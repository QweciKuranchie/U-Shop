import { describe, it, expect } from "vitest";
import prisma from "../lib/prisma";
import { Prisma } from "../generated/prisma";

describe("Prisma Schema & Database Constraints Integration Tests", () => {
  it("should verify seeded admin user exists with role: 'admin'", async () => {
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe("admin");
    expect(admin?.email).toBe("admin@ushop.com");
  });

  it("should verify exactly 4 institution records are seeded", async () => {
    const count = await prisma.institution.count();
    expect(count).toBe(4);
  });

  it("should verify delivery zones and addresses exist and can be queried", async () => {
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
    const reference = `pstk_test_${Date.now()}`;

    // Insert first event
    await prisma.webhookEvent.create({
      data: {
        paystackRef: reference,
        event: "charge.success",
        payload: {},
      },
    });

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

    // Clean up
    await prisma.webhookEvent.delete({
      where: { paystackRef: reference },
    });
  });

  it("should reject Order with invalid/orphaned deliveryAddressId due to FK constraint", async () => {
    // Generate a unique reference
    const reference = `USH-TEST-${Date.now()}`;

    // Get a valid product and buyer
    const product = await prisma.product.findFirst();
    const buyer = await prisma.user.findFirst({
      where: { role: "buyer" },
    });

    expect(product).not.toBeNull();
    expect(buyer).not.toBeNull();

    // Attempt to create an order with a non-existent deliveryAddressId
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
