import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");

  if (!handle) {
    return NextResponse.json(
      { error: "Handle query parameter is required" },
      { status: 400 }
    );
  }

  const normalized = handle.toLowerCase().trim();

  if (normalized.length < 3 || normalized.length > 30) {
    return NextResponse.json(
      { available: false, error: "Handle must be between 3 and 30 characters" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalized)) {
    return NextResponse.json(
      { available: false, error: "Handle must contain only lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  const existing = await prisma.sellerProfile.findUnique({
    where: { handle: normalized },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
