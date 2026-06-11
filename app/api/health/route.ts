import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    // Ping DB using a simple query
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (error: unknown) {
    // Narrow the error type to Error before logging and capturing
    const parsedError = error instanceof Error ? error : new Error(String(error));
    console.error("Health check failed:", parsedError);
    Sentry.captureException(parsedError);

    return NextResponse.json(
      { status: "error", db: "disconnected" },
      { status: 500 }
    );
  }
}
