import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireRole(request, "buyer");
    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            description: true,
            listingPrice: true,
            imageS3Keys: true,
            status: true,
            seller: {
              select: {
                storeName: true,
                handle: true,
                campus: true,
                tier: true,
              },
            },
          },
        },
        deliveryAddress: {
          include: {
            zone: true,
          },
        },
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.buyerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Conditional inclusion of rider.phone: only when status is IN_TRANSIT
    let riderData = null;
    if (order.rider) {
      riderData = {
        id: order.rider.id,
        name: order.rider.name,
        phone: order.status === "IN_TRANSIT" ? order.rider.phone : null,
      };
    }

    const serializedOrder = {
      id: order.id,
      reference: order.reference,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paystackReference: order.paystackReference,
      vendorPrice: order.vendorPrice.toString(),
      commissionRate: order.commissionRate.toString(),
      listingPrice: order.listingPrice.toString(),
      deliveryFee: order.deliveryFee.toString(),
      checkoutPrice: order.checkoutPrice.toString(),
      paystackFee: order.paystackFee.toString(),
      totalCharged: order.totalCharged.toString(),
      commissionAmount: order.commissionAmount.toString(),
      sellerReceivable: order.sellerReceivable.toString(),
      commissionStatus: order.commissionStatus,
      deliveryFeeStatus: order.deliveryFeeStatus,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
      product: order.product,
      deliveryAddress: order.deliveryAddress ? {
        id: order.deliveryAddress.id,
        userId: order.deliveryAddress.userId,
        zoneId: order.deliveryAddress.zoneId,
        type: order.deliveryAddress.type,
        addressText: order.deliveryAddress.addressText,
        landmark: order.deliveryAddress.landmark,
        recipientPhone: order.deliveryAddress.recipientPhone,
        isDefault: order.deliveryAddress.isDefault,
        createdAt: order.deliveryAddress.createdAt,
        updatedAt: order.deliveryAddress.updatedAt,
        zone: {
          id: order.deliveryAddress.zone.id,
          name: order.deliveryAddress.zone.name,
          flatFee: order.deliveryAddress.zone.flatFee.toString(),
          isActive: order.deliveryAddress.zone.isActive,
        },
      } : null,
      rider: riderData,
    };

    return NextResponse.json({ order: serializedOrder });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Fetch order detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
