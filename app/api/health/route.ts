import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Ping DB using a simple query
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", db: "disconnected", details: error.message },
      { status: 500 }
    );
  }
}
