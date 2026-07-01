import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { computeOrderPricing } from "@/lib/pricing";
import { queueEmail } from "@/lib/notifications/outbox";
import { EmailJobType, PaymentMethod, OrderStatus, Prisma } from "../../../generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "buyer");

    const body = await request.json();
    const { productId, deliveryAddressId } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    if (!deliveryAddressId || typeof deliveryAddressId !== "string") {
      return NextResponse.json({ error: "Delivery address ID is required" }, { status: 400 });
    }

    // Verify delivery address exists and belongs to the buyer
    const address = await prisma.deliveryAddress.findUnique({
      where: { id: deliveryAddressId },
      include: { zone: true },
    });

    if (!address) {
      return NextResponse.json({ error: "Delivery address not found" }, { status: 404 });
    }
    if (address.userId !== user.id) {
      return NextResponse.json({ error: "Access denied. Delivery address does not belong to you." }, { status: 403 });
    }

    // Run order creation in transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Lock and update product status
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }
      if (product.status !== "ACTIVE") {
        throw new Error("PRODUCT_ALREADY_SOLD");
      }

      // Atomically mark product as SOLD
      await tx.product.update({
        where: { id: productId },
        data: { status: "SOLD" },
      });

      // 2. Fetch seller details to queue email and fetch commission rate
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

      // 3. Compute pricing snapshot
      const pricing = computeOrderPricing({
        vendorPrice: product.vendorPrice,
        commissionRate: product.commissionRate,
        deliveryFee: address.zone.flatFee,
      });

      // Adjust for COD (No Paystack Fee)
      const totalCharged = pricing.checkoutPrice;

      // 4. Generate unique order reference
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const reference = `USH-${dateStr}-${randomStr}`;

      // 5. Create Order
      const newOrder = await tx.order.create({
        data: {
          reference,
          buyerId: user.id,
          productId,
          deliveryAddressId,
          vendorPrice: pricing.vendorPrice,
          commissionRate: pricing.commissionRate,
          listingPrice: pricing.listingPrice,
          deliveryFee: pricing.deliveryFee,
          checkoutPrice: pricing.checkoutPrice,
          paystackFee: new Prisma.Decimal("0.00"),
          totalCharged,
          commissionAmount: pricing.commissionAmount,
          sellerReceivable: pricing.sellerReceivable,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
          status: OrderStatus.PENDING_COD,
          commissionStatus: "PENDING",
          deliveryFeeStatus: "PENDING",
        },
      });

      // 6. Queue emails in the same transaction
      await queueEmail(
        {
          to: user.email,
          subject: `Order Placed (COD) - ${product.title}`,
          jobType: EmailJobType.ORDER_CONFIRMED_BUYER,
          payload: {
            ref: reference,
            totalCharged: totalCharged.toString(),
          },
        },
        tx as unknown as Parameters<typeof queueEmail>[1]
      );

      await queueEmail(
        {
          to: sellerUser.email,
          subject: `New COD Order - ${product.title}`,
          jobType: EmailJobType.NEW_ORDER_SELLER,
          payload: {
            ref: reference,
            productTitle: product.title,
            totalCharged: totalCharged.toString(),
          },
        },
        tx as unknown as Parameters<typeof queueEmail>[1]
      );

      return newOrder;
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (message === "PRODUCT_ALREADY_SOLD") {
      return NextResponse.json({ error: "Item already sold" }, { status: 409 });
    }
    console.error("Create COD order error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "buyer");

    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        product: {
          select: {
            title: true,
            imageS3Keys: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = orders.map((o) => ({
      id: o.id,
      reference: o.reference,
      status: o.status,
      paymentMethod: o.paymentMethod,
      totalCharged: o.totalCharged.toString(),
      createdAt: o.createdAt,
      product: o.product,
    }));

    return NextResponse.json({ orders: serialized });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("List buyer orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
