import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const serialized = zones.map((z) => ({
      id: z.id,
      name: z.name,
      flatFee: z.flatFee.toString(),
      isActive: z.isActive,
    }));

    return NextResponse.json({ zones: serialized });
  } catch (error) {
    console.error("Fetch delivery zones error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
