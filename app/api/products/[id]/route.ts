import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { computeOrderPricing } from "@/lib/pricing";
import { Prisma } from "../../../../generated/prisma";

const VALID_CATEGORIES = ["PHONES", "LAPTOPS", "AUDIO", "ACCESSORIES", "COMPONENTS", "CABLES", "GAMING", "OTHER"];
const VALID_CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/products/[id] — Edit a product (seller-owned only)
 * Auth: requireRole("seller")
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireRole(request, "seller");
    const { id } = await params;

    // ── Fetch seller profile ──────────────────────────────────────
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, commissionRate: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "No seller profile found" }, { status: 404 });
    }

    // ── Fetch product and verify ownership ────────────────────────
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true, vendorPrice: true, commissionRate: true, imageS3Keys: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.sellerId !== sellerProfile.id) {
      return NextResponse.json({ error: "Forbidden: you do not own this product" }, { status: 403 });
    }

    if (product.status === "SOLD") {
      return NextResponse.json({ error: "Cannot edit a sold product" }, { status: 400 });
    }

    if (product.status === "DELETED") {
      return NextResponse.json({ error: "Cannot edit a deleted product" }, { status: 400 });
    }

    // ── Check if any orders exist for this product ──────────────────
    const orderCount = await prisma.order.count({
      where: { productId: id },
    });
    if (orderCount > 0) {
      return NextResponse.json({ error: "Cannot modify a product with existing orders" }, { status: 400 });
    }

    // ── Parse update fields ───────────────────────────────────────
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      if (body.title.trim().length > 200) {
        return NextResponse.json({ error: "Title must be 200 characters or fewer" }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string" || body.description.trim().length === 0) {
        return NextResponse.json({ error: "Description cannot be empty" }, { status: 400 });
      }
      updateData.description = body.description.trim();
    }

    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
      }
      updateData.category = body.category;
    }

    if (body.condition !== undefined) {
      if (!VALID_CONDITIONS.includes(body.condition)) {
        return NextResponse.json({ error: `Invalid condition. Must be one of: ${VALID_CONDITIONS.join(", ")}` }, { status: 400 });
      }
      updateData.condition = body.condition;
    }

    if (body.imageS3Keys !== undefined) {
      if (!Array.isArray(body.imageS3Keys)) {
        return NextResponse.json({ error: "imageS3Keys must be an array" }, { status: 400 });
      }
      if (body.imageS3Keys.length > 5) {
        return NextResponse.json({ error: "Maximum of 5 images allowed" }, { status: 400 });
      }
      // Validate image keys belong to this seller's upload prefix
      const productImagePrefix = `products/${sellerProfile.id}/`;
      for (const key of body.imageS3Keys) {
        if (typeof key !== "string" || !key.startsWith(productImagePrefix)) {
          return NextResponse.json(
            { error: "Invalid image key: all images must belong to your seller account" },
            { status: 400 }
          );
        }
      }
      updateData.imageS3Keys = body.imageS3Keys as unknown as Prisma.InputJsonValue;
    }

    // ── Recompute listing price if vendorPrice changes ────────────
    if (body.vendorPrice !== undefined) {
      if (isNaN(Number(body.vendorPrice)) || Number(body.vendorPrice) <= 0) {
        return NextResponse.json({ error: "Vendor price must be a positive number" }, { status: 400 });
      }

      const vendorPriceDecimal = new Prisma.Decimal(String(body.vendorPrice));
      const commissionRateDecimal = new Prisma.Decimal(String(sellerProfile.commissionRate));

      const pricing = computeOrderPricing({
        vendorPrice: vendorPriceDecimal,
        commissionRate: commissionRateDecimal,
        deliveryFee: new Prisma.Decimal("0"),
      });

      updateData.vendorPrice = vendorPriceDecimal;
      updateData.listingPrice = pricing.listingPrice;
      updateData.commissionRate = commissionRateDecimal;
    }

    if (body.status !== undefined) {
      if (!["ACTIVE", "PAUSED"].includes(body.status)) {
        return NextResponse.json({ error: "Status can only be set to ACTIVE or PAUSED" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // ── Perform update ────────────────────────────────────────────
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      vendorPrice: updated.vendorPrice.toString(),
      listingPrice: updated.listingPrice.toString(),
      commissionRate: updated.commissionRate.toString(),
      status: updated.status,
      message: "Product updated successfully",
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Edit product error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id] — Soft-delete a product
 * Auth: requireRole("seller")
 * Sets status = DELETED, deletedAt = now(). S3 keys retained.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireRole(request, "seller");
    const { id } = await params;

    // ── Fetch seller profile ──────────────────────────────────────
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "No seller profile found" }, { status: 404 });
    }

    // ── Fetch product and verify ownership ────────────────────────
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.sellerId !== sellerProfile.id) {
      return NextResponse.json({ error: "Forbidden: you do not own this product" }, { status: 403 });
    }

    if (product.status === "SOLD") {
      return NextResponse.json({ error: "Cannot delete a sold product" }, { status: 400 });
    }

    if (product.status === "DELETED") {
      return NextResponse.json({ error: "Product is already deleted" }, { status: 400 });
    }

    // ── Check if any orders exist for this product ──────────────────
    const orderCount = await prisma.order.count({
      where: { productId: id },
    });
    if (orderCount > 0) {
      return NextResponse.json({ error: "Cannot delete a product with existing orders" }, { status: 400 });
    }

    // ── Soft-delete: status = DELETED, set deletedAt ──────────────
    await prisma.product.update({
      where: { id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Product deleted successfully",
      id,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Delete product error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
