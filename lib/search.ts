// lib/search.ts
// Compliance: U-Shop SRD v1.1 §3.4

import { prisma } from "@/lib/prisma";
import { Prisma, ProductCategory, ProductCondition, SellerTier } from "../generated/prisma";

export interface SearchParams {
  query: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  campus?: string;
  sellerTier?: string;
  page?: number;
  pageSize?: number;
}

export async function searchProducts(params: SearchParams) {
  const {
    query,
    category,
    condition,
    minPrice,
    maxPrice,
    campus,
    sellerTier,
    page = 1,
    pageSize = 20,
  } = params;
  const offset = (page - 1) * pageSize;

  const trimmedQuery = query ? query.trim() : "";

  // ── Fallback to standard Prisma if query is empty ─────────────────
  if (!trimmedQuery) {
    return prisma.product.findMany({
      where: {
        status: "ACTIVE",
        category: category ? (category as ProductCategory) : undefined,
        condition: condition ? (condition as ProductCondition) : undefined,
        listingPrice: {
          gte: minPrice !== undefined ? minPrice : undefined,
          lte: maxPrice !== undefined ? maxPrice : undefined,
        },
        seller: {
          campus: campus ? campus : undefined,
          tier: sellerTier ? (sellerTier as SellerTier) : undefined,
        },
      },
      include: {
        seller: {
          select: {
            handle: true,
            storeName: true,
            campus: true,
            tier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: pageSize,
    });
  }

  // ── Raw query for FTS + trigram matching when query is present ────
  // ts_rank rank represents full text matching, and we add 0.5 if it is a trigram ILIKE match in the title.
  const results = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
    SELECT
      p.id,
      (
        ts_rank(
          to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,'')),
          plainto_tsquery('english', ${trimmedQuery})
        ) +
        CASE WHEN p.title ILIKE ${"%" + trimmedQuery + "%"} THEN 0.5 ELSE 0.0 END
      ) AS rank
    FROM products p
    JOIN seller_profiles sp ON sp.id = p."sellerId"
    WHERE
      p.status = 'ACTIVE'
      AND (
        to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,''))
        @@ plainto_tsquery('english', ${trimmedQuery})
        OR p.title ILIKE ${"%" + trimmedQuery + "%"}
      )
      ${category ? Prisma.sql`AND p.category = ${category}::"ProductCategory"` : Prisma.empty}
      ${condition ? Prisma.sql`AND p.condition = ${condition}::"ProductCondition"` : Prisma.empty}
      ${minPrice !== undefined ? Prisma.sql`AND p."listingPrice" >= ${minPrice}::numeric` : Prisma.empty}
      ${maxPrice !== undefined ? Prisma.sql`AND p."listingPrice" <= ${maxPrice}::numeric` : Prisma.empty}
      ${campus ? Prisma.sql`AND sp.campus = ${campus}` : Prisma.empty}
      ${sellerTier ? Prisma.sql`AND sp.tier = ${sellerTier}::"SellerTier"` : Prisma.empty}
    ORDER BY rank DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  // Fetch full product records for the matched IDs
  const ids = results.map((r) => r.id);
  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      seller: {
        select: {
          handle: true,
          storeName: true,
          campus: true,
          tier: true,
        },
      },
    },
  });

  // Map products by ID for O(1) retrieval
  const productsMap = new Map(products.map((p) => [p.id, p]));

  // Preserve database search relevance rank order
  return ids
    .map((id) => productsMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
}
