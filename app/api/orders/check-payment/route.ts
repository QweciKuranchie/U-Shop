import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "buyer");

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference query parameter is required" }, { status: 400 });
    }

    // 1. Check if order exists for this reference
    const order = await prisma.order.findFirst({
      where: {
        paystackReference: reference,
      },
      select: {
        id: true,
        buyerId: true,
      },
    });

    if (order) {
      if (order.buyerId === user.id) {
        return NextResponse.json({ status: "success", orderId: order.id });
      } else {
        // Order exists but belongs to a different buyer: conflict refund initiated
        return NextResponse.json({
          status: "refunded",
          message: "Item already sold — refund started",
        });
      }
    }

    // 2. Check if a webhook event conflict occurred
    const webhookEvent = await prisma.webhookEvent.findUnique({
      where: { paystackRef: reference },
    });

    if (webhookEvent) {
      if (webhookEvent.processed) {
        if (!webhookEvent.orderId) {
          // Processed but no order created: this is a conflict refund
          return NextResponse.json({
            status: "refunded",
            message: "Item already sold — refund started",
          });
        } else {
          // Has order ID but we didn't find it for this buyer (belongs to someone else)
          return NextResponse.json({
            status: "refunded",
            message: "Item already sold — refund started",
          });
        }
      } else {
        // Logged but not processed yet
        return NextResponse.json({ status: "pending" });
      }
    }

    // 3. Not received or not processed yet
    return NextResponse.json({ status: "pending" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Check payment status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
