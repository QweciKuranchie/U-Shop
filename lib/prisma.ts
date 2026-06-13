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
  const dbUrl = process.env.DATABASE_URL;

  // 1. Prisma Accelerate (prisma://)
  if (dbUrl && dbUrl.startsWith("prisma://")) {
    const client = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["warn", "error"],
      accelerateUrl: dbUrl,
    }).$extends(withAccelerate());
    return client as unknown as PrismaClient;
  }

  // 2. Direct Driver Adapter (postgres:// or postgresql://)
  const pool = new Pool({
    connectionString: dbUrl || "postgres://placeholder:placeholder@localhost:5432/ushop",
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
    adapter,
  });
}

export const prisma = globalThis.__prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;
