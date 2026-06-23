import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth-guards";
import { computeOrderPricing, getCommissionRate } from "@/lib/pricing";
import { Prisma } from "../../../generated/prisma";

// ── Allowed categories and conditions (match Prisma enums) ────────
const VALID_CATEGORIES = ["PHONES", "LAPTOPS", "AUDIO", "ACCESSORIES", "COMPONENTS", "CABLES", "GAMING", "OTHER"];
const VALID_CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR"];

/**
 * POST /api/products — Create a new product listing
 * Auth: requireRole("seller")
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "seller");

    const body = await request.json();
    const { title, description, category, condition, vendorPrice, imageS3Keys } = body;

    // ── Validate required fields ──────────────────────────────────
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or fewer" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }
    if (!condition || !VALID_CONDITIONS.includes(condition)) {
      return NextResponse.json({ error: `Invalid condition. Must be one of: ${VALID_CONDITIONS.join(", ")}` }, { status: 400 });
    }
    if (vendorPrice === undefined || vendorPrice === null || isNaN(Number(vendorPrice)) || Number(vendorPrice) <= 0) {
      return NextResponse.json({ error: "Vendor price must be a positive number" }, { status: 400 });
    }

    // ── Validate image keys ───────────────────────────────────────
    const images: string[] = Array.isArray(imageS3Keys) ? imageS3Keys : [];
    if (images.length > 5) {
      return NextResponse.json({ error: "Maximum of 5 images allowed" }, { status: 400 });
    }

    // ── Fetch seller profile ──────────────────────────────────────
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, commissionRate: true, tier: true, status: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "No seller profile found" }, { status: 404 });
    }
    if (sellerProfile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Seller account is not active" }, { status: 403 });
    }

    // ── Compute listing price server-side ──────────────────────────
    const vendorPriceDecimal = new Prisma.Decimal(String(vendorPrice));
    const commissionRateDecimal = new Prisma.Decimal(String(sellerProfile.commissionRate));

    const pricing = computeOrderPricing({
      vendorPrice: vendorPriceDecimal,
      commissionRate: commissionRateDecimal,
      deliveryFee: new Prisma.Decimal("0"),
    });

    // ── Create product ────────────────────────────────────────────
    const product = await prisma.product.create({
      data: {
        sellerId: sellerProfile.id,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        vendorPrice: vendorPriceDecimal,
        listingPrice: pricing.listingPrice,
        commissionRate: commissionRateDecimal,
        imageS3Keys: images as unknown as Prisma.InputJsonValue,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        id: product.id,
        title: product.title,
        vendorPrice: product.vendorPrice.toString(),
        listingPrice: product.listingPrice.toString(),
        commissionRate: product.commissionRate.toString(),
        imageS3Keys: images,
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("Create product error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/products — List the authenticated seller's products
 * Auth: requireRole("seller")
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, "seller");

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, commissionRate: true, tier: true, campus: true, storeName: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "No seller profile found" }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: sellerProfile.id,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        condition: true,
        vendorPrice: true,
        listingPrice: true,
        commissionRate: true,
        imageS3Keys: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields to strings for JSON
    const serialized = products.map((p) => ({
      ...p,
      vendorPrice: p.vendorPrice.toString(),
      listingPrice: p.listingPrice.toString(),
      commissionRate: p.commissionRate.toString(),
    }));

    return NextResponse.json({
      products: serialized,
      seller: {
        id: sellerProfile.id,
        commissionRate: sellerProfile.commissionRate.toString(),
        tier: sellerProfile.tier,
        campus: sellerProfile.campus,
        storeName: sellerProfile.storeName,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    console.error("List products error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
