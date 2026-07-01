import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { uploadProductImage } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

/** Allowed image MIME types */
const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

/** Max file size: 5 MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/products/upload-image — Upload a single product image
 * Auth: requireRole("seller")
 *
 * Accepts a single file via FormData. Validates size and MIME type.
 * Processes via Sharp (resize 1200px, WebP conversion) and stores in S3.
 * Returns the S3 key for the client to accumulate before product submission.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "seller");

    // ── Fetch seller profile ──────────────────────────────────────
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, status: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "No seller profile found" }, { status: 404 });
    }
    if (sellerProfile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Seller account is not active" }, { status: 403 });
    }

    // ── Parse FormData ────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── Validate MIME type ────────────────────────────────────────
    if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, AVIF` },
        { status: 400 }
      );
    }

    // ── Validate file size ────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum is 5MB.` },
        { status: 400 }
      );
    }

    // ── Process and upload ────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = await uploadProductImage(buffer, file.type, sellerProfile.id);

    return NextResponse.json(
      {
        key: s3Key,
        message: "Image uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Upload product image error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
