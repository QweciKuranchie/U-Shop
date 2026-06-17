import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySellerOTP, SELLER_OTP_MAX_ATTEMPTS } from "@/lib/otp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // ── Find the latest Verification record for this email ────────
    const verification = await prisma.verification.findFirst({
      where: { identifier: email },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "No OTP found for this email. Please request a new one." },
        { status: 404 }
      );
    }

    // ── Count previous failed attempts (using createdAt as proxy) ──
    // We track attempts by counting verifications with same identifier
    // that have been created after the current one (failed re-tries)
    // For simplicity, we store attempt count in a separate query pattern:
    // Check all verifications for this email to count attempts
    const allVerifications = await prisma.verification.findMany({
      where: { identifier: email },
      orderBy: { createdAt: "desc" },
    });

    // The number of verification records beyond the first is our attempt count
    const attempts = Math.max(0, allVerifications.length - 1);

    // ── Verify OTP ────────────────────────────────────────────────
    const result = await verifySellerOTP(
      otp,
      verification.value,
      verification.expiresAt,
      attempts
    );

    if (!result.success) {
      if (result.reason === "OTP_LOCKED") {
        // Calculate lockout end time (10 min from OTP creation)
        const lockoutEndsAt = new Date(verification.expiresAt.getTime());
        return NextResponse.json(
          {
            verified: false,
            reason: "OTP_LOCKED",
            lockoutEndsAt: lockoutEndsAt.toISOString(),
            message: `Too many failed attempts (${SELLER_OTP_MAX_ATTEMPTS} max). Please wait for the lockout to expire.`,
          },
          { status: 429 }
        );
      }

      if (result.reason === "OTP_EXPIRED") {
        return NextResponse.json(
          {
            verified: false,
            reason: "OTP_EXPIRED",
            message: "OTP has expired. Please request a new one.",
          },
          { status: 410 }
        );
      }

      // OTP_MISMATCH — create a new verification record to track attempt
      await prisma.verification.create({
        data: {
          identifier: email,
          value: verification.value, // same hash
          expiresAt: verification.expiresAt, // same expiry
        },
      });

      return NextResponse.json(
        {
          verified: false,
          reason: "OTP_MISMATCH",
          attemptsRemaining: SELLER_OTP_MAX_ATTEMPTS - (attempts + 1),
          message: "Invalid OTP. Please try again.",
        },
        { status: 400 }
      );
    }

    // ── Success: clean up all verification records for this email ──
    await prisma.verification.deleteMany({
      where: { identifier: email },
    });

    return NextResponse.json({
      verified: true,
      message: "Email verified successfully. You can now upload your KYC documents.",
    });
  } catch (error: unknown) {
    console.error("OTP verification error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
