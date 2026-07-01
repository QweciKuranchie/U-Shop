import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "buyer");

    const addresses = await prisma.deliveryAddress.findMany({
      where: { userId: user.id },
      include: {
        zone: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = addresses.map((addr) => ({
      id: addr.id,
      userId: addr.userId,
      zoneId: addr.zoneId,
      type: addr.type,
      addressText: addr.addressText,
      landmark: addr.landmark,
      recipientPhone: addr.recipientPhone,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt,
      updatedAt: addr.updatedAt,
      zone: {
        id: addr.zone.id,
        name: addr.zone.name,
        flatFee: addr.zone.flatFee.toString(),
        isActive: addr.zone.isActive,
      },
    }));

    return NextResponse.json({ addresses: serialized });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Fetch saved addresses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "buyer");

    const body = await request.json();
    const { type, zoneId, addressText, landmark, recipientPhone, isDefault } = body;

    // Validate inputs
    if (!type || !["CAMPUS", "HOME"].includes(type)) {
      return NextResponse.json({ error: "Invalid address type. Must be CAMPUS or HOME" }, { status: 400 });
    }
    if (!zoneId || typeof zoneId !== "string") {
      return NextResponse.json({ error: "Zone ID is required" }, { status: 400 });
    }
    if (!addressText || typeof addressText !== "string" || addressText.trim().length === 0) {
      return NextResponse.json({ error: "Address text is required" }, { status: 400 });
    }
    if (!recipientPhone || typeof recipientPhone !== "string" || recipientPhone.trim().length === 0) {
      return NextResponse.json({ error: "Recipient phone is required" }, { status: 400 });
    }

    // Verify zone exists
    const zone = await prisma.deliveryZone.findUnique({
      where: { id: zoneId },
    });
    if (!zone) {
      return NextResponse.json({ error: "Delivery zone not found" }, { status: 404 });
    }

    // If setting as default, unset others first
    if (isDefault) {
      await prisma.deliveryAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.deliveryAddress.create({
      data: {
        userId: user.id,
        zoneId,
        type: type as any,
        addressText: addressText.trim(),
        landmark: landmark ? landmark.trim() : null,
        recipientPhone: recipientPhone.trim(),
        isDefault: !!isDefault,
      },
      include: {
        zone: true,
      },
    });

    const serialized = {
      id: newAddress.id,
      userId: newAddress.userId,
      zoneId: newAddress.zoneId,
      type: newAddress.type,
      addressText: newAddress.addressText,
      landmark: newAddress.landmark,
      recipientPhone: newAddress.recipientPhone,
      isDefault: newAddress.isDefault,
      createdAt: newAddress.createdAt,
      updatedAt: newAddress.updatedAt,
      zone: {
        id: newAddress.zone.id,
        name: newAddress.zone.name,
        flatFee: newAddress.zone.flatFee.toString(),
        isActive: newAddress.zone.isActive,
      },
    };

    return NextResponse.json({ address: serialized }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Create saved address error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
