import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { computeOrderPricing } from "@/lib/pricing";
import { queueEmail } from "@/lib/notifications/outbox";
import { EmailJobType, PaymentMethod, OrderStatus, Prisma } from "../../../../generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-paystack-signature");
    const rawBody = await request.text();

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    const computedBuffer = Buffer.from(computedHash);
    const signatureBuffer = Buffer.from(signature);

    if (computedBuffer.length !== signatureBuffer.length) {
      return NextResponse.json({ error: "Invalid signature length" }, { status: 400 });
    }

    if (!crypto.timingSafeEqual(computedBuffer, signatureBuffer)) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    // Only process charge.success events
    if (payload.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const transactionData = payload.data;
    const reference = transactionData.reference;
    const metadata = transactionData.metadata;

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }
    if (!metadata || !metadata.productId || !metadata.buyerId || !metadata.deliveryAddressId) {
      return NextResponse.json({ error: "Missing metadata fields" }, { status: 400 });
    }

    const { productId, buyerId, deliveryAddressId } = metadata;

    // ── Layer 1: Idempotency Check ────────────────────────────────────
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { paystackRef: reference },
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, message: "Duplicate event logged" });
    }

    // Try to create WebhookEvent. Unique constraint prevents race conditions.
    try {
      await prisma.webhookEvent.create({
        data: {
          paystackRef: reference,
          event: payload.event,
          payload: transactionData as Prisma.InputJsonValue,
          processed: false,
        },
      });
    } catch (e: unknown) {
      // P2002: Unique constraint failed
      if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
        return NextResponse.json({ received: true, message: "Duplicate event processed" });
      }
      throw e;
    }

    // ── Layer 2: Concurrency Check (Transaction) ─────────────────────
    let orderId: string | null = null;
    let isConflict = false;

    try {
      await prisma.$transaction(async (tx) => {
        // Find product
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product || product.status !== "ACTIVE") {
          throw new Error("PRODUCT_ALREADY_SOLD");
        }

        // Lock product
        await tx.product.update({
          where: { id: productId },
          data: { status: "SOLD" },
        });

        // Fetch address & zone
        const address = await tx.deliveryAddress.findUnique({
          where: { id: deliveryAddressId },
          include: { zone: true },
        });

        if (!address) {
          throw new Error("ADDRESS_NOT_FOUND");
        }

        // Fetch seller details
        const sellerProfile = await tx.sellerProfile.findUnique({
          where: { id: product.sellerId },
        });

        if (!sellerProfile) {
          throw new Error("SELLER_NOT_FOUND");
        }

        const sellerUser = await tx.user.findUnique({
          where: { id: sellerProfile.userId },
          select: { email: true },
        });

        if (!sellerUser) {
          throw new Error("SELLER_USER_NOT_FOUND");
        }

        // Compute pricing snapshot
        const pricing = computeOrderPricing({
          vendorPrice: product.vendorPrice,
          commissionRate: product.commissionRate,
          deliveryFee: address.zone.flatFee,
        });

        // Generate order reference
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderReference = `USH-${dateStr}-${randomStr}`;

        // Create Order
        const newOrder = await tx.order.create({
          data: {
            reference: orderReference,
            buyerId,
            productId,
            deliveryAddressId,
            vendorPrice: pricing.vendorPrice,
            commissionRate: pricing.commissionRate,
            listingPrice: pricing.listingPrice,
            deliveryFee: pricing.deliveryFee,
            checkoutPrice: pricing.checkoutPrice,
            paystackFee: pricing.paystackFee,
            totalCharged: pricing.totalCharged,
            commissionAmount: pricing.commissionAmount,
            sellerReceivable: pricing.sellerReceivable,
            paymentMethod: transactionData.channel === "card" ? PaymentMethod.CARD : PaymentMethod.MOBILE_MONEY,
            paystackReference: reference,
            status: OrderStatus.PAID,
            paidAt: new Date(),
            commissionStatus: "PENDING",
            deliveryFeeStatus: "PENDING",
          },
        });

        orderId = newOrder.id;

        // Update WebhookEvent
        await tx.webhookEvent.update({
          where: { paystackRef: reference },
          data: {
            processed: true,
            orderId: newOrder.id,
          },
        });

        // Fetch buyer email
        const buyerUser = await tx.user.findUnique({
          where: { id: buyerId },
          select: { email: true },
        });

        // Queue emails in same transaction
        if (buyerUser) {
          await queueEmail(
            {
              to: buyerUser.email,
              subject: `Payment Confirmed - Order ${newOrder.reference}`,
              jobType: EmailJobType.ORDER_CONFIRMED_BUYER,
              payload: {
                ref: newOrder.reference,
                totalCharged: pricing.totalCharged.toString(),
              },
            },
            tx as unknown as Parameters<typeof queueEmail>[1]
          );
        }

        await queueEmail(
          {
            to: sellerUser.email,
            subject: `New Order Received - ${product.title}`,
            jobType: EmailJobType.NEW_ORDER_SELLER,
            payload: {
              ref: newOrder.reference,
              productTitle: product.title,
              totalCharged: pricing.totalCharged.toString(),
            },
          },
          tx as unknown as Parameters<typeof queueEmail>[1]
        );
      });
    } catch (transactionError: unknown) {
      if (transactionError instanceof Error && transactionError.message === "PRODUCT_ALREADY_SOLD") {
        isConflict = true;
      } else {
        throw transactionError;
      }
    }

    // Handle conflict (automatic refund and outbox record)
    if (isConflict) {
      console.log(`Product ${productId} is already sold. Initiating refund for reference ${reference}...`);

      // Run transactional update to record conflict and queue refund email
      await prisma.$transaction(async (tx) => {
        await tx.webhookEvent.update({
          where: { paystackRef: reference },
          data: { processed: true },
        });

        const buyerUser = await tx.user.findUnique({
          where: { id: buyerId },
          select: { email: true },
        });

        if (buyerUser) {
          await queueEmail(
            {
              to: buyerUser.email,
              subject: "Payment Refunded - Item Already Sold",
              jobType: EmailJobType.REFUND_STARTED,
              payload: {
                ref: reference,
              },
            },
            tx as unknown as Parameters<typeof queueEmail>[1]
          );
        }
      });

      // Call Paystack Refund API
      try {
        const refundRes = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transaction: reference }),
        });

        if (!refundRes.ok) {
          const errText = await refundRes.text();
          console.error("Paystack automatic refund failed:", errText);
        } else {
          console.log("Paystack automatic refund initiated successfully.");
        }
      } catch (refundError) {
        console.error("Error calling Paystack refund API:", refundError);
      }
    }

    return NextResponse.json({ received: true, orderId });
  } catch (error: unknown) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
