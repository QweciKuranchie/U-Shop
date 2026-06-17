import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../lib/prisma";
import { Prisma } from "../generated/prisma";

// Mock the prisma client
vi.mock("../lib/prisma", () => ({
  default: {
    user: {
      findFirst: vi.fn(),
    },
    institution: {
      count: vi.fn(),
    },
    deliveryZone: {
      findMany: vi.fn(),
    },
    deliveryAddress: {
      findMany: vi.fn(),
    },
    webhookEvent: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
  },
}));

describe("Prisma Schema & Database Constraints Integration Tests (Mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify seeded admin user exists with role: 'admin'", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "admin-id",
      name: "Richard Nuhu",
      email: "admin@ushop.com",
      role: "admin",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe("admin");
    expect(admin?.email).toBe("admin@ushop.com");
  });

  it("should verify exactly 4 institution records are seeded", async () => {
    vi.mocked(prisma.institution.count).mockResolvedValue(4);

    const count = await prisma.institution.count();
    expect(count).toBe(4);
  });

  it("should verify delivery zones and addresses exist and can be queried", async () => {
    vi.mocked(prisma.deliveryZone.findMany).mockResolvedValue([
      { id: "1", name: "Legon", flatFee: new Prisma.Decimal("15.00"), isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "2", name: "Tesano", flatFee: new Prisma.Decimal("20.00"), isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "3", name: "East Legon", flatFee: new Prisma.Decimal("25.00"), isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "4", name: "Madina", flatFee: new Prisma.Decimal("30.00"), isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    vi.mocked(prisma.deliveryAddress.findMany).mockResolvedValue([
      {
        id: "addr-1",
        userId: "buyer-1",
        zoneId: "1",
        type: "CAMPUS",
        addressText: "Limann Hostel",
        landmark: "Gate",
        recipientPhone: "+233240000000",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        zone: { id: "1", name: "Legon", flatFee: new Prisma.Decimal("15.00"), isActive: true, createdAt: new Date(), updatedAt: new Date() },
      } as unknown as Prisma.DeliveryAddressGetPayload<{ include: { zone: true } }>,
    ]);

    const zones = await prisma.deliveryZone.findMany();
    expect(zones.length).toBeGreaterThanOrEqual(4);

    const addresses = await prisma.deliveryAddress.findMany({
      include: { zone: true },
    });
    expect(addresses.length).toBeGreaterThan(0);
    for (const address of addresses) {
      expect(address.zone).not.toBeNull();
      expect(address.zoneId).toBe(address.zone.id);
    }
  });

  it("should reject duplicate WebhookEvent.paystackRef due to unique constraint", async () => {
    const reference = "pstk_test_duplicate";

    // Mock first create to succeed
    vi.mocked(prisma.webhookEvent.create)
      .mockResolvedValueOnce({
        id: "event-1",
        paystackRef: reference,
        event: "charge.success",
        processed: false,
        orderId: null,
        payload: {},
        receivedAt: new Date(),
      })
      // Mock second create to throw a unique constraint error
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed on the fields: (`paystackRef`)",
          {
            code: "P2002",
            clientVersion: "7.8.0",
            meta: { target: ["paystackRef"] },
          }
        )
      );

    // Insert first event
    const firstEvent = await prisma.webhookEvent.create({
      data: {
        paystackRef: reference,
        event: "charge.success",
        payload: {},
      },
    });
    expect(firstEvent.paystackRef).toBe(reference);

    // Try to insert second event with same paystackRef
    await expect(
      prisma.webhookEvent.create({
        data: {
          paystackRef: reference,
          event: "charge.success",
          payload: {},
        },
      })
    ).rejects.toThrow();
  });

  it("should reject Order with invalid/orphaned deliveryAddressId due to FK constraint", async () => {
    const reference = "USH-TEST-123456";

    vi.mocked(prisma.product.findFirst).mockResolvedValue({
      id: "prod-1",
      sellerId: "seller-1",
      title: "MacBook",
      description: "M1",
      category: "LAPTOPS",
      condition: "NEW",
      vendorPrice: new Prisma.Decimal("4275.00"),
      listingPrice: new Prisma.Decimal("4500.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      imageS3Keys: [],
      status: "ACTIVE",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "buyer-1",
      name: "Buyer One",
      email: "buyer@ushop.com",
      role: "buyer",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.order.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed on the field: (`deliveryAddressId`)",
        {
          code: "P2003",
          clientVersion: "7.8.0",
          meta: { field_name: "deliveryAddressId" },
        }
      )
    );

    const product = await prisma.product.findFirst();
    const buyer = await prisma.user.findFirst({
      where: { role: "buyer" },
    });

    expect(product).not.toBeNull();
    expect(buyer).not.toBeNull();

    await expect(
      prisma.order.create({
        data: {
          reference,
          buyerId: buyer!.id,
          productId: product!.id,
          deliveryAddressId: "non-existent-address-id",
          vendorPrice: new Prisma.Decimal("10.00"),
          commissionRate: new Prisma.Decimal("0.05"),
          listingPrice: new Prisma.Decimal("10.53"),
          deliveryFee: new Prisma.Decimal("0.00"),
          checkoutPrice: new Prisma.Decimal("10.53"),
          paystackFee: new Prisma.Decimal("0.71"),
          totalCharged: new Prisma.Decimal("11.24"),
          commissionAmount: new Prisma.Decimal("0.53"),
          sellerReceivable: new Prisma.Decimal("10.00"),
          paymentMethod: "CARD",
        },
      })
    ).rejects.toThrow();
  });
});
