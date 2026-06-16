import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "admin");

    const applications = await prisma.sellerProfile.findMany({
      where: {
        status: {
          in: ["PENDING_STUDENT", "PENDING_BUSINESS", "PENDING_INDIVIDUAL"],
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ applications });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("KYC list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
