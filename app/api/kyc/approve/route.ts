import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { queueEmail } from "@/lib/notifications/outbox";
import { getCommissionRate } from "@/lib/pricing";

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

    // ── Validate KYC completeness before approval ─────────────────
    const profileData = profile as unknown as {
      applicationSubmitted: boolean;
      kycDocKeys: string[];
      userId: string;
    };

    if (!profileData.applicationSubmitted) {
      return NextResponse.json(
        { error: "Cannot approve: seller has not submitted their application" },
        { status: 400 }
      );
    }

    const kycKeys = profileData.kycDocKeys || [];
    if (kycKeys.length === 0) {
      return NextResponse.json(
        { error: "Cannot approve: no KYC documents uploaded" },
        { status: 400 }
      );
    }

    // Validate document keys belong to the correct user prefix
    const expectedPrefix = `kyc/${profileData.userId}/`;
    const hasValidKeys = kycKeys.every((key: string) => key.startsWith(expectedPrefix));
    if (!hasValidKeys) {
      return NextResponse.json(
        { error: "Cannot approve: invalid KYC document keys detected" },
        { status: 400 }
      );
    }

    // ── Commission rate based on tier ────────────────────────────
    const commissionRate = getCommissionRate(profile.tier);

    // ── Update SellerProfile, User, and Outbox in transaction ──────
    await prisma.$transaction(async (tx) => {
      // 1. Update SellerProfile → ACTIVE
      await tx.sellerProfile.update({
        where: { id: sellerProfileId },
        data: {
          status: "ACTIVE",
          commissionRate,
          rejectionReason: null,
        },
      });

      // 2. Upgrade user.role → "seller"
      await tx.user.update({
        where: { id: profile.userId },
        data: { role: "seller" },
      });

      // 3. Queue welcome email
      await queueEmail({
        to: profile.user.email,
        subject: "🎉 Your U-Shop Store Has Been Approved!",
        jobType: "SELLER_APPROVED",
        payload: {
          storeName: profile.storeName,
          handle: profile.handle,
          name: profile.user.name,
        },
      }, tx);
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
