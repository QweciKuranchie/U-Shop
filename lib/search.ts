// lib/search.ts
// Compliance: U-Shop SRD v1.1 §3.4

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface SearchParams {
  query: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  campus?: string;
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
    page = 1,
    pageSize = 20,
  } = params;
  const offset = (page - 1) * pageSize;

  // Use raw query for GIN full-text search — Prisma ORM cannot express tsvector queries.
  // Note: Column names must match the camelCase columns generated in PostgreSQL by Prisma, which are case-sensitive and quoted.
  const results = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
    SELECT
      p.id,
      ts_rank(
        to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,'')),
        plainto_tsquery('english', ${query})
      ) AS rank
    FROM products p
    JOIN seller_profiles sp ON sp.id = p."sellerId"
    WHERE
      p.status = 'ACTIVE'
      AND (
        to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,''))
        @@ plainto_tsquery('english', ${query})
      )
      ${category ? Prisma.sql`AND p.category = ${category}::"ProductCategory"` : Prisma.empty}
      ${condition ? Prisma.sql`AND p.condition = ${condition}::"ProductCondition"` : Prisma.empty}
      ${minPrice ? Prisma.sql`AND p."listingPrice" >= ${minPrice}` : Prisma.empty}
      ${maxPrice ? Prisma.sql`AND p."listingPrice" <= ${maxPrice}` : Prisma.empty}
      ${campus ? Prisma.sql`AND sp.campus = ${campus}` : Prisma.empty}
    ORDER BY rank DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  // Fetch full product records for the matched IDs
  const ids = results.map((r) => r.id);
  if (ids.length === 0) return [];

  return prisma.product.findMany({
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
    orderBy: { createdAt: "desc" },
  });
}
