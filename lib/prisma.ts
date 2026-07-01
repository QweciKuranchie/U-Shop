// lib/prisma.ts
// Standard Prisma Client initialization with hot-reload safety

import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { withAccelerate } from "@prisma/extension-accelerate";

// Prevent multiple Prisma Client instances during Next.js hot reload in development
declare global {
  var __prisma: ReturnType<typeof buildPrismaClient> | undefined;
}

function buildPrismaClient() {
  let dbUrl = process.env.DATABASE_URL;

  // 1. Prisma Accelerate (prisma://)
  if (dbUrl && dbUrl.startsWith("prisma://")) {
    let hasApiKey = false;
    try {
      const urlObj = new URL(dbUrl);
      const apiKey = urlObj.searchParams.get("api_key");
      if (apiKey && apiKey.trim().length > 0 && !apiKey.includes("placeholder") && !apiKey.includes("<")) {
        hasApiKey = true;
      }
    } catch {
      hasApiKey = false;
    }

    if (hasApiKey) {
      const client = new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "warn", "error"]
            : ["warn", "error"],
        accelerateUrl: dbUrl,
      }).$extends(withAccelerate());
      if (process.env.NODE_ENV !== "test") {
        (client as unknown as { $executeRawUnsafe: (q: string) => Promise<unknown> }).$executeRawUnsafe(`ALTER TABLE "seller_otps" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3);`)
          .catch((err: unknown) => console.error("Dynamic migration (seller_otps) failed:", err));
        (client as unknown as { $executeRawUnsafe: (q: string) => Promise<unknown> }).$executeRawUnsafe(`ALTER TABLE "seller_profiles" ADD COLUMN IF NOT EXISTS "applicationSubmitted" BOOLEAN NOT NULL DEFAULT false;`)
          .then(() => {
            return (client as unknown as { $executeRawUnsafe: (q: string) => Promise<unknown> }).$executeRawUnsafe(`UPDATE "seller_profiles" SET "applicationSubmitted" = true WHERE "applicationSubmitted" = false AND "status" IN ('PENDING_STUDENT', 'PENDING_BUSINESS', 'PENDING_INDIVIDUAL') AND "kycDocKeys"::text <> '[]';`);
          })
          .catch((err: unknown) => console.error("Dynamic migration (seller_profiles/backfill) failed:", err));
      }
      return client as unknown as PrismaClient;
    } else {
      console.warn("Prisma Accelerate URL is invalid or missing a valid api_key query parameter.");
      if (process.env.DIRECT_DATABASE_URL) {
        console.warn("Falling back to DIRECT_DATABASE_URL.");
        dbUrl = process.env.DIRECT_DATABASE_URL;
      }
    }
  }

  // 2. Direct Driver Adapter (postgres:// or postgresql://)
  const connectionString = dbUrl || process.env.DIRECT_DATABASE_URL || "postgres://placeholder:placeholder@localhost:5432/ushop";
  const pool = new Pool({
    connectionString,
    ssl: connectionString && (connectionString.includes("rds.amazonaws.com") || connectionString.includes("sslmode=require"))
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
    adapter,
  });
  if (process.env.NODE_ENV !== "test") {
    (client as unknown as { $executeRawUnsafe: (q: string) => Promise<unknown> }).$executeRawUnsafe(`ALTER TABLE "seller_otps" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3);`)
      .catch((err: unknown) => console.error("Dynamic migration (seller_otps) failed:", err));
    (client as unknown as { $executeRawUnsafe: (q: string) => Promise<unknown> }).$executeRawUnsafe(`ALTER TABLE "seller_profiles" ADD COLUMN IF NOT EXISTS "applicationSubmitted" BOOLEAN NOT NULL DEFAULT false;`)
      .then(() => {
        return (client as unknown as { $executeRawUnsafe: (q: string) => Promise<unknown> }).$executeRawUnsafe(`UPDATE "seller_profiles" SET "applicationSubmitted" = true WHERE "applicationSubmitted" = false AND "status" IN ('PENDING_STUDENT', 'PENDING_BUSINESS', 'PENDING_INDIVIDUAL') AND "kycDocKeys"::text <> '[]';`);
      })
      .catch((err: unknown) => console.error("Dynamic migration (seller_profiles/backfill) failed:", err));
  }
  return client;
}

export const prisma = globalThis.__prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;
