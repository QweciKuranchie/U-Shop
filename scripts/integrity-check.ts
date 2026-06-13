import { prisma } from "../lib/prisma";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for script execution
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || "af-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "placeholder",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "placeholder",
  },
});

const BUCKET_NAME = process.env.AWS_S3_PRODUCT_IMAGES_BUCKET || "ushop-product-images";

async function main() {
  console.log("=== STARTING DAILY INTEGRITY CHECK ===");

  // 1. Database Health Check
  console.log("Checking database connectivity...");
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database Connection: OK");
  } catch (error: any) {
    console.error("Database Connection: FAILED");
    console.error(error);
    Sentry.captureException(error);
    process.exit(1);
  }

  // 2. Orphaned S3 Asset Report
  console.log("Checking for orphaned S3 assets in:", BUCKET_NAME);
  try {
    // List all items in the S3 bucket under products/
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "products/",
    });
    const s3Response = await s3.send(listCommand);
    const s3Keys = (s3Response.Contents || [])
      .map((item) => item.Key)
      .filter((key): key is string => !!key);

    console.log(`Found ${s3Keys.length} assets in S3 under 'products/'.`);

    // In T1, we don't have Product model fully set up yet.
    // We will do a safe check if Product table exists and has records.
    let dbImageKeys: string[] = [];
    try {
      const products = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "imageS3Keys" FROM "Product"`
      );
      for (const product of products) {
        if (product.imageS3Keys) {
          const keys = typeof product.imageS3Keys === "string" 
            ? JSON.parse(product.imageS3Keys) 
            : product.imageS3Keys;
          if (Array.isArray(keys)) {
            dbImageKeys.push(...keys);
          }
        }
      }
      console.log(`Found ${dbImageKeys.length} image keys referenced in database.`);
    } catch (dbError: any) {
      console.log("Product table not found or empty (skipping DB-side comparisons for T1 scaffold).");
      // If the product table is not available yet, we assume 0 keys in DB
    }

    // Find orphaned S3 assets (exist in S3, but NOT in DB)
    const orphanedKeys = s3Keys.filter((key) => !dbImageKeys.includes(key));

    if (orphanedKeys.length > 0) {
      console.warn(`WARNING: Found ${orphanedKeys.length} orphaned S3 assets:`);
      orphanedKeys.forEach((key) => console.log(` - ${key}`));

      // Report to Sentry
      Sentry.captureMessage(
        `Daily Integrity Check: Found ${orphanedKeys.length} orphaned S3 assets in ${BUCKET_NAME}`,
        "warning"
      );
    } else {
      console.log("Integrity Check: No orphaned S3 assets found.");
    }
  } catch (error: any) {
    console.error("S3 Asset Verification: FAILED");
    console.error(error);
    Sentry.captureException(error);
  } finally {
    await prisma.$disconnect();
    console.log("=== DAILY INTEGRITY CHECK COMPLETED ===");
  }
}

main().catch((err) => {
  console.error("Fatal error during integrity check:", err);
  Sentry.captureException(err);
  process.exit(1);
});
