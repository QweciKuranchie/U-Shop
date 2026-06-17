import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        storeName: true,
        handle: true,
        tier: true,
        status: true,
        rejectionReason: true,
        campus: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "No seller profile found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.error("Seller profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
