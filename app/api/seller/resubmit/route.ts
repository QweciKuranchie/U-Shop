import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { queueEmail } from "@/lib/notifications/outbox";
import { Prisma } from "../../../../generated/prisma";

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate user ─────────────────────────────────────────
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { kycDocKeys } = body;

    if (!kycDocKeys || !Array.isArray(kycDocKeys) || kycDocKeys.length === 0) {
      return NextResponse.json(
        { error: "At least one KYC document key is required" },
        { status: 400 }
      );
    }

    // ── Verify user has a REJECTED SellerProfile ──────────────────
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "No seller profile found" },
        { status: 404 }
      );
    }

    if (sellerProfile.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Resubmission is only allowed for rejected applications" },
        { status: 400 }
      );
    }

    // ── Determine pending status based on tier ────────────────────
    const statusMap: Record<string, "PENDING_STUDENT" | "PENDING_BUSINESS" | "PENDING_INDIVIDUAL"> = {
      STUDENT: "PENDING_STUDENT",
      BUSINESS: "PENDING_BUSINESS",
      INDIVIDUAL: "PENDING_INDIVIDUAL",
    };
    const newStatus = statusMap[sellerProfile.tier] || "PENDING_INDIVIDUAL";

    // ── Update profile: replace KYC docs, reset status ────────────
    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        kycDocKeys: kycDocKeys as unknown as Prisma.InputJsonValue,
        status: newStatus,
        rejectionReason: null,
      },
    });

    // ── Queue admin notification email ────────────────────────────
    // Notify admin about resubmission (using SELLER_OTP type as a proxy
    // since we don't have a dedicated RESUBMISSION type)
    await queueEmail({
      to: "admin@ushop.com",
      subject: `KYC Resubmission: ${sellerProfile.storeName}`,
      jobType: "SELLER_OTP",
      payload: {
        storeName: sellerProfile.storeName,
        handle: sellerProfile.handle,
        resubmission: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "KYC documents resubmitted. Your application is back under review.",
    });
  } catch (error: unknown) {
    console.error("Seller resubmit error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
