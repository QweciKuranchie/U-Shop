// lib/s3.ts
// Compliance: U-Shop SRD v1.1 §4.3 & §7.1

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "./prisma";

// Robust AWS region parsing to support descriptive text in env
let awsRegion = process.env.AWS_REGION || "us-east-1";
if (awsRegion.includes(" ")) {
  const parts = awsRegion.split(" ");
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.includes("-")) {
    awsRegion = lastPart;
  } else {
    awsRegion = "us-east-1";
  }
}

const s3 = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const PRODUCT_BUCKET = process.env.AWS_S3_PRODUCT_IMAGES_BUCKET || process.env.S3_PRODUCT_BUCKET || "ushop-product-images-01";
const KYC_BUCKET = process.env.AWS_S3_KYC_DOCUMENTS_BUCKET || process.env.S3_KYC_BUCKET || "ushop-kyc-documents";
const KYC_TTL_SECS = 900; // 15 minutes — STRICT

/** Maximum product image file size: 5 MB */
const MAX_BYTES = 5 * 1024 * 1024;

/** Target output width for product images */
const TARGET_WIDTH = 1200;

/**
 * Process and upload a product image to S3.
 * Resizes to max 1200px wide, converts to WebP for storage efficiency.
 */
export async function uploadProductImage(
  rawBuffer: Buffer,
  originalMime: string,
  sellerId: string
): Promise<string> {
  if (rawBuffer.length > MAX_BYTES) {
    throw new Error("Image exceeds 5MB limit");
  }

  // Resize + convert to WebP using sharp
  const webpBuffer = await sharp(rawBuffer)
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const key = `products/${sellerId}/${randomUUID()}.webp`;

  await s3.send(
    new PutObjectCommand({
      Bucket: PRODUCT_BUCKET,
      Key: key,
      Body: webpBuffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return key;
}

function getContentTypeFromKey(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

/**
 * Generate a 15-minute presigned GET URL for a private KYC document.
 * MUST only be called from admin-role-protected Route Handlers.
 * Every call MUST be logged to kyc_access_logs.
 */
export async function generateKYCPresignedUrl(
  s3Key: string,
  adminUserId: string,
  ipAddress?: string
): Promise<string> {
  // Audit log in kyc_access_logs
  await prisma.kycAccessLog.create({
    data: {
      adminUserId,
      s3ObjectKey: s3Key,
      ipAddress: ipAddress || null,
    },
  });

  const contentType = getContentTypeFromKey(s3Key);

  const command = new GetObjectCommand({
    Bucket: KYC_BUCKET,
    Key: s3Key,
    ResponseContentDisposition: "inline",
    ResponseContentType: contentType,
  });

  try {
    return await getSignedUrl(s3, command, { expiresIn: KYC_TTL_SECS });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: "s3", operation: "generatePresignedUrl" },
      extra: { s3Key, adminUserId, ipAddress },
    });
    throw error;
  }
}

/**
 * Batch-delete all S3 objects for a product being soft-deleted.
 * Called asynchronously — NEVER blocks the API response.
 */
export async function deleteProductImages(imageS3Keys: string[]): Promise<void> {
  if (imageS3Keys.length === 0) return;

  const command = new DeleteObjectsCommand({
    Bucket: PRODUCT_BUCKET,
    Delete: {
      Objects: imageS3Keys.map((Key) => ({ Key })),
      Quiet: true,
    },
  });
  try {
    const result = await s3.send(command);
    if (result.Errors && result.Errors.length > 0) {
      Sentry.captureEvent({
        message: "Partial S3 product image deletion failure",
        level: "warning",
        extra: { errors: result.Errors },
      });
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: "s3", operation: "deleteProductImages" },
      extra: { imageS3Keys },
    });
    throw error;
  }
}
