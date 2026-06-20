import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySellerOTP, SELLER_OTP_MAX_ATTEMPTS } from "@/lib/otp";

export async function POST(request: NextRequest) {
  try {
    interface TempSellerOtp {
      id: string;
      email: string;
      otpHash: string;
      expiresAt: Date;
      attempts: number;
      isVerified: boolean;
      isLocked: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
    const db = prisma as unknown as {
      sellerOtp: {
        findUnique: (args: {
          where: { email: string };
        }) => Promise<TempSellerOtp | null>;
        update: (args: {
          where: { email: string };
          data: Partial<TempSellerOtp>;
        }) => Promise<TempSellerOtp>;
      };
      user: {
        findUnique: (args: {
          where: { email: string };
          include?: { sellerProfile: boolean };
        }) => Promise<{ id: string; email: string; sellerProfile: { id: string } | null } | null>;
      };
      sellerProfile: {
        update: (args: {
          where: { id: string };
          data: { otpVerified: boolean };
        }) => Promise<unknown>;
      };
    };
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // ── Find the SellerOtp record for this email ────────
    const sellerOtp = await db.sellerOtp.findUnique({
      where: { email },
    });

    if (!sellerOtp) {
      return NextResponse.json(
        { error: "No OTP found for this email. Please request a new one." },
        { status: 404 }
      );
    }

    // Check expiry first
    if (new Date() > sellerOtp.expiresAt) {
      if (sellerOtp.isLocked || sellerOtp.attempts > 0) {
        await db.sellerOtp.update({
          where: { email },
          data: {
            attempts: 0,
            isLocked: false,
          },
        });
      }
      return NextResponse.json(
        {
          verified: false,
          reason: "OTP_EXPIRED",
          message: "OTP has expired. Please request a new one.",
        },
        { status: 410 }
      );
    }

    // Check lockout (only if active / not expired)
    if (sellerOtp.isLocked || sellerOtp.attempts >= SELLER_OTP_MAX_ATTEMPTS) {
      const lockoutEndsAt = new Date(sellerOtp.expiresAt.getTime());
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

    // ── Verify OTP ────────────────────────────────────────────────
    const result = await verifySellerOTP(
      otp,
      sellerOtp.otpHash,
      sellerOtp.expiresAt,
      sellerOtp.attempts
    );

    if (!result.success) {
      const nextAttempts = sellerOtp.attempts + 1;
      const isLockedNow = nextAttempts >= SELLER_OTP_MAX_ATTEMPTS;

      await db.sellerOtp.update({
        where: { email },
        data: {
          attempts: nextAttempts,
          isLocked: isLockedNow,
        },
      });

      if (isLockedNow) {
        const lockoutEndsAt = new Date(sellerOtp.expiresAt.getTime());
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

      return NextResponse.json(
        {
          verified: false,
          reason: "OTP_MISMATCH",
          attemptsRemaining: SELLER_OTP_MAX_ATTEMPTS - nextAttempts,
          message: "Invalid OTP. Please try again.",
        },
        { status: 400 }
      );
    }

    // ── Success: clean up OTP record for this email ──
    await db.sellerOtp.update({
      where: { email },
      data: { isVerified: true },
    });

    const user = (await db.user.findUnique({
      where: { email },
      include: { sellerProfile: true },
    })) as { id: string; email: string; sellerProfile: { id: string } | null } | null;

    if (user && user.sellerProfile) {
      await db.sellerProfile.update({
        where: { id: user.sellerProfile.id },
        data: { otpVerified: true },
      });
      // Set emailVerified: true on user table to allow credentials sign-in
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

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
