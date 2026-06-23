import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyOnboardingToken } from "@/lib/onboarding-token";

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate user ─────────────────────────────────────────
    let userId: string | null = null;
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
      userId = session.user.id;
    } else {
      const onboardingToken = request.headers.get("x-onboarding-token");
      if (onboardingToken) {
        userId = verifyOnboardingToken(onboardingToken);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Verify user has a SellerProfile ────────────────────────────
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "No seller profile found. Please register as a seller first." },
        { status: 404 }
      );
    }

    // ── Check if already submitted ────────────────────────────────
    const profile = sellerProfile as unknown as {
      id: string;
      userId: string;
      tier: string;
      status: string;
      kycDocKeys: string[];
      applicationSubmitted: boolean;
    };

    if (profile.applicationSubmitted) {
      return NextResponse.json(
        { error: "Application has already been submitted" },
        { status: 400 }
      );
    }

    // ── Validate KYC document completeness ────────────────────────
    const kycKeys = profile.kycDocKeys || [];

    if (kycKeys.length === 0) {
      return NextResponse.json(
        { error: "At least one KYC document is required before submitting" },
        { status: 400 }
      );
    }

    if (kycKeys.length > 3) {
      return NextResponse.json(
        { error: "Maximum of 3 KYC documents allowed" },
        { status: 400 }
      );
    }

    // Validate that all keys belong to this user's KYC directory
    const expectedPrefix = `kyc/${userId}/`;
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    for (const key of kycKeys) {
      if (!key.startsWith(expectedPrefix)) {
        return NextResponse.json(
          { error: "Invalid KYC document key detected" },
          { status: 400 }
        );
      }
      const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
      if (!validExtensions.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid file extension in document key: ${ext}` },
          { status: 400 }
        );
      }
    }

    // ── Mark application as submitted ─────────────────────────────
    await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: { applicationSubmitted: true } as unknown as Parameters<typeof prisma.sellerProfile.update>[0]["data"],
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully. Our team will review your documents.",
    });
  } catch (error: unknown) {
    console.error("Submit application error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
