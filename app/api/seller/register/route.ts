import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSellerOTP } from "@/lib/otp";
import { queueEmail } from "@/lib/notifications/outbox";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, handle, storeName, tier, campus, bio, tagline, phone, whatsappNumber } = body;

    // ── Validate required fields ──────────────────────────────────
    if (!name || !email || !password || !handle || !storeName || !tier) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, handle, storeName, tier" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const validTiers = ["STUDENT", "BUSINESS", "INDIVIDUAL"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be STUDENT, BUSINESS, or INDIVIDUAL" },
        { status: 400 }
      );
    }

    // ── Handle uniqueness ─────────────────────────────────────────
    const existingHandle = await prisma.sellerProfile.findUnique({
      where: { handle: handle.toLowerCase() },
    });
    if (existingHandle) {
      return NextResponse.json(
        { error: "Handle is already taken" },
        { status: 409 }
      );
    }

    // ── Check if email is already registered ──────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ── Student tier: validate .edu.gh domain ─────────────────────
    if (tier === "STUDENT") {
      if (!campus) {
        return NextResponse.json(
          { error: "Campus is required for Student tier" },
          { status: 400 }
        );
      }

      const emailDomain = email.split("@")[1];
      if (!emailDomain) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      const institution = await prisma.institution.findFirst({
        where: {
          isActive: true,
          name: campus,
        },
      });

      if (!institution) {
        return NextResponse.json(
          { error: "Institution not found or not approved" },
          { status: 400 }
        );
      }

      const domains = institution.domains as string[];
      const domainMatch = domains.some((d) => emailDomain.endsWith(d));
      if (!domainMatch) {
        return NextResponse.json(
          { error: `Email domain does not match any approved domain for ${campus}. Accepted: ${domains.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // ── Create Better Auth user account (provisional — role: "buyer") ──
    const signUpResult = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    if (!signUpResult?.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    const userId = signUpResult.user.id;

    // ── Determine pending status based on tier ────────────────────
    const statusMap: Record<string, "PENDING_STUDENT" | "PENDING_BUSINESS" | "PENDING_INDIVIDUAL"> = {
      STUDENT: "PENDING_STUDENT",
      BUSINESS: "PENDING_BUSINESS",
      INDIVIDUAL: "PENDING_INDIVIDUAL",
    };

    // ── Create SellerProfile ──────────────────────────────────────
    const sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId,
        handle: handle.toLowerCase(),
        storeName,
        bio: bio || null,
        tagline: tagline || null,
        phone: phone || null,
        whatsappNumber: whatsappNumber || null,
        campus: campus || null,
        tier: tier as "STUDENT" | "BUSINESS" | "INDIVIDUAL",
        status: statusMap[tier],
        commissionRate: 0.05,
        kycDocKeys: [],
      },
    });

    // ── Student tier: generate and queue OTP ──────────────────────
    let otpRequired = false;
    if (tier === "STUDENT") {
      const { raw, hash, expiresAt } = await generateSellerOTP();

      // Store OTP in Verification table
      await prisma.verification.create({
        data: {
          identifier: email,
          value: hash,
          expiresAt,
        },
      });

      // Queue OTP email via outbox
      await queueEmail({
        to: email,
        subject: "U-Shop Seller Verification OTP",
        jobType: "SELLER_OTP",
        payload: { otp: raw, storeName, name },
      });

      otpRequired = true;
    }

    return NextResponse.json(
      {
        userId,
        profileId: sellerProfile.id,
        otpRequired,
        message: otpRequired
          ? "Account created. Please verify your student email with the OTP sent to your inbox."
          : "Account created. Please upload your KYC documents to complete registration.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Seller registration error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
