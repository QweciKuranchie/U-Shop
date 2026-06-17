import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { queueEmail } from "@/lib/notifications/outbox";

export async function POST(request: NextRequest) {
  try {
    // ── Admin auth gate ───────────────────────────────────────────
    await requireRole(request, "admin");

    const body = await request.json();
    const { sellerProfileId } = body;

    if (!sellerProfileId) {
      return NextResponse.json(
        { error: "sellerProfileId is required" },
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
        { error: "Seller is already approved" },
        { status: 400 }
      );
    }

    // ── Commission rate (5% for all tiers) ────────────────────────
    const commissionRate = 0.05;

    // ── Update SellerProfile → ACTIVE ─────────────────────────────
    await prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        status: "ACTIVE",
        commissionRate,
        rejectionReason: null,
      },
    });

    // ── Upgrade user.role → "seller" ──────────────────────────────
    await prisma.user.update({
      where: { id: profile.userId },
      data: { role: "seller" },
    });

    // ── Queue welcome email ───────────────────────────────────────
    await queueEmail({
      to: profile.user.email,
      subject: "🎉 Your U-Shop Store Has Been Approved!",
      jobType: "SELLER_APPROVED",
      payload: {
        storeName: profile.storeName,
        handle: profile.handle,
        name: profile.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Seller "${profile.storeName}" approved and role upgraded.`,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status }
      );
    }
    console.error("KYC approve error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
