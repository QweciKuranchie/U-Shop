import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { uploadKYCDocument } from "@/lib/s3";
import { Prisma } from "../../../../generated/prisma";

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate user ─────────────────────────────────────────
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse multipart form data ─────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // ── Validate file ─────────────────────────────────────────────
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WEBP are accepted." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // ── Verify user has a SellerProfile ────────────────────────────
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "No seller profile found. Please register as a seller first." },
        { status: 404 }
      );
    }

    // ── Upload to private S3 ──────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = await uploadKYCDocument(buffer, file.type, session.user.id);

    // ── Append S3 key to SellerProfile.kycDocKeys ─────────────────
    const existingKeys = (sellerProfile.kycDocKeys as string[]) || [];
    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        kycDocKeys: [...existingKeys, s3Key] as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ s3Key }, { status: 201 });
  } catch (error: unknown) {
    console.error("KYC upload error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
