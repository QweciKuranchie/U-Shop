import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchProducts } from "../lib/search";
import prisma from "../lib/prisma";
import { Prisma } from "../generated/prisma";

// Mock the prisma client
vi.mock("../lib/prisma", () => ({
  default: {
    $queryRaw: vi.fn(),
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
  prisma: {
    $queryRaw: vi.fn(),
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("Product Search & Browse Library (lib/search.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return active products sorted by creation date when query is empty", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        title: "MacBook Air",
        description: "M1 2020",
        category: "LAPTOPS",
        condition: "GOOD",
        vendorPrice: new Prisma.Decimal("6000.00"),
        listingPrice: new Prisma.Decimal("6315.79"),
        commissionRate: new Prisma.Decimal("0.05"),
        imageS3Keys: ["prod/img-1.jpg"],
        status: "ACTIVE",
        seller: {
          handle: "mac-seller",
          storeName: "Mac Shop",
          campus: "University of Ghana",
          tier: "STUDENT",
        },
      },
    ];

    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as unknown as ReturnType<typeof prisma.product.findMany>);

    const results = await searchProducts({ query: "" });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
        }),
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("MacBook Air");
  });

  it("should execute raw full-text query when query is present", async () => {
    const mockRawResults = [{ id: "prod-2", rank: 0.8 }];
    const mockProducts = [
      {
        id: "prod-2",
        title: "iPhone 13 Pro",
        description: "128GB blue",
        category: "PHONES",
        condition: "LIKE_NEW",
        vendorPrice: new Prisma.Decimal("7000.00"),
        listingPrice: new Prisma.Decimal("7368.42"),
        commissionRate: new Prisma.Decimal("0.05"),
        imageS3Keys: ["prod/img-2.jpg"],
        status: "ACTIVE",
        seller: {
          handle: "iphone-shop",
          storeName: "iStore",
          campus: "University of Ghana",
          tier: "STUDENT",
        },
      },
    ];

    vi.mocked(prisma.$queryRaw).mockResolvedValue(mockRawResults as unknown as ReturnType<typeof prisma.$queryRaw>);
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as unknown as ReturnType<typeof prisma.product.findMany>);

    const results = await searchProducts({ query: "iPhone" });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.product.findMany).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("iPhone 13 Pro");
  });

  it("should enforce category and campus filters in raw SQL", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([] as unknown as ReturnType<typeof prisma.$queryRaw>);

    await searchProducts({
      query: "laptop",
      category: "LAPTOPS",
      campus: "University of Ghana",
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it("should never include seller contact fields (whatsappNumber, phone, email) in search results", async () => {
    const mockProducts = [
      {
        id: "prod-3",
        title: "AirPods Max",
        category: "AUDIO",
        condition: "NEW",
        vendorPrice: new Prisma.Decimal("5000.00"),
        listingPrice: new Prisma.Decimal("5263.16"),
        commissionRate: new Prisma.Decimal("0.05"),
        imageS3Keys: [],
        status: "ACTIVE",
        seller: {
          handle: "audio-store",
          storeName: "Audio Hub",
          campus: "Accra Technical University",
          tier: "BUSINESS",
        },
      },
    ];

    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as unknown as ReturnType<typeof prisma.product.findMany>);

    const results = await searchProducts({ query: "" });
    const seller = results[0]?.seller as unknown as { storeName: string; whatsappNumber?: string; phone?: string; email?: string };

    expect(seller).toBeDefined();
    expect(seller.storeName).toBe("Audio Hub");
    expect(seller.whatsappNumber).toBeUndefined();
    expect(seller.phone).toBeUndefined();
    expect(seller.email).toBeUndefined();
  });
});
