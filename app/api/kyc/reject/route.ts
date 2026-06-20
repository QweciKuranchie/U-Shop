import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { queueEmail } from "@/lib/notifications/outbox";

export async function POST(request: NextRequest) {
  try {
    // ── Admin auth gate ───────────────────────────────────────────
    await requireRole(request, "admin");

    const body = await request.json();
    const { sellerProfileId, reason } = body;

    if (!sellerProfileId || !reason) {
      return NextResponse.json(
        { error: "sellerProfileId and reason are required" },
        { status: 400 }
      );
    }

    // ── Fetch SellerProfile ───────────────────────────────────────
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    if (profile.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Cannot reject an already approved seller" },
        { status: 400 }
      );
    }

    // ── Update profile and outbox inside transaction ──────────────
    await prisma.$transaction(async (tx) => {
      // 1. Update SellerProfile → REJECTED
      await tx.sellerProfile.update({
        where: { id: sellerProfileId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
        },
      });

      // 2. Queue rejection email
      await queueEmail({
        to: profile.user.email,
        subject: "U-Shop Seller Application Update",
        jobType: "SELLER_REJECTED",
        payload: {
          reason,
          storeName: profile.storeName,
          name: profile.user.name,
        },
      }, tx);
    });

    return NextResponse.json({
      success: true,
      message: `Seller "${profile.storeName}" rejected.`,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status }
      );
    }
    console.error("KYC reject error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
