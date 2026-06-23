import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSellerOTP } from "@/lib/otp";
import { queueEmail } from "@/lib/notifications/outbox";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const db = prisma as unknown as {
      sellerOtp: {
        upsert: (args: {
          where: { email: string };
          create: {
            email: string;
            otpHash: string;
            expiresAt: Date;
            attempts: number;
            isVerified: boolean;
            isLocked: boolean;
          };
          update: {
            otpHash: string;
            expiresAt: Date;
            attempts: number;
            isVerified: boolean;
            isLocked: boolean;
          };
        }) => Promise<TempSellerOtp>;
      };
      user: {
        findUnique: (args: {
          where: { email: string };
          include?: { sellerProfile: boolean };
        }) => Promise<{
          id: string;
          name: string;
          sellerProfile: {
            id: string;
            status: string;
            tier: string;
            storeName: string;
          } | null;
        } | null>;
      };
    };

    // ── Find user and seller profile ─────────────────────────────────
    const user = await db.user.findUnique({
      where: { email },
      include: { sellerProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    if (!user.sellerProfile) {
      return NextResponse.json(
        { error: "Seller profile not found for this account" },
        { status: 404 }
      );
    }

    const { status, tier, storeName } = user.sellerProfile;

    if (tier !== "STUDENT") {
      return NextResponse.json(
        { error: "OTP reissue is only available for student sellers" },
        { status: 400 }
      );
    }

    if (status !== "PENDING_STUDENT" && status !== "REJECTED") {
      return NextResponse.json(
        { error: "OTP reissue is not allowed for your profile status" },
        { status: 400 }
      );
    }

    // ── Check if there is an active lockout ───────────────────────────
    const existingOtp = await prisma.sellerOtp.findUnique({
      where: { email },
    });

    if (existingOtp) {
      const lockoutUntilDate = existingOtp.lockoutUntil ? new Date(existingOtp.lockoutUntil) : null;
      if (lockoutUntilDate && new Date() < lockoutUntilDate) {
        return NextResponse.json(
          {
            error: "Too many failed attempts. Please wait for the lockout to expire.",
            lockoutEndsAt: lockoutUntilDate.toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // ── Generate fresh OTP ───────────────────────────────────────────
    const { raw, hash, expiresAt } = await generateSellerOTP();

    // ── Replace the existing SellerOtp record safely ─────────────────
    await db.sellerOtp.upsert({
      where: { email },
      create: {
        email,
        otpHash: hash,
        expiresAt,
        attempts: 0,
        isVerified: false,
        isLocked: false,
        lockoutUntil: null,
      } as unknown as Parameters<typeof db.sellerOtp.create>[0]["data"],
      update: {
        otpHash: hash,
        expiresAt,
        attempts: 0,
        isVerified: false,
        isLocked: false,
        lockoutUntil: null,
      } as unknown as Parameters<typeof db.sellerOtp.update>[0]["data"],
    });

    // ── Queue a fresh seller OTP email ───────────────────────────────
    await queueEmail({
      to: email,
      subject: "U-Shop Seller Verification OTP (Resend)",
      jobType: "SELLER_OTP",
      payload: { otp: raw, storeName, name: user.name },
    });

    return NextResponse.json({
      success: true,
      message: "A new OTP code has been sent to your student email.",
    });
  } catch (error: unknown) {
    console.error("Seller OTP resend error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
