import { describe, it, expect } from "vitest";
import { computeOrderPricing } from "../lib/pricing";
import { Prisma } from "../generated/prisma";

describe("Pricing Calculations (lib/pricing.ts)", () => {
  it("should return correct Decimal gross-up for Tier 1 (5% commission) at GHS 350 vendor price", () => {
    const result = computeOrderPricing({
      vendorPrice: new Prisma.Decimal("350.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      deliveryFee: new Prisma.Decimal("30.00"),
    });

    // Worked Example from Spec:
    // listingPrice: 368.42 (350 / 0.95 = 368.421... -> 368.42)
    // checkoutPrice: 398.42 (368.42 + 30.00)
    // paystackFee: 8.29 (398.42 * 0.0195 + 0.50 = 8.2892 -> 8.29)
    // totalCharged: 406.71 (398.42 + 8.29)
    // commissionAmount: 18.42 (368.42 - 350.00)
    // sellerReceivable: 350.00
    expect(result.listingPrice.toString()).toBe("368.42");
    expect(result.checkoutPrice.toString()).toBe("398.42");
    expect(result.paystackFee.toString()).toBe("8.29");
    expect(result.totalCharged.toString()).toBe("406.71");
    expect(result.commissionAmount.toString()).toBe("18.42");
    expect(result.sellerReceivable.toString()).toBe("350");
  });

  it("should return correct Decimal gross-up for Tier 1 (5% commission) at GHS 95 vendor price", () => {
    const result = computeOrderPricing({
      vendorPrice: new Prisma.Decimal("95.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      deliveryFee: new Prisma.Decimal("0.00"),
    });

    expect(result.listingPrice.toString()).toBe("100");
    expect(result.checkoutPrice.toString()).toBe("100");
    expect(result.paystackFee.toString()).toBe("2.45"); // 100 * 0.0195 + 0.50 = 2.45
    expect(result.totalCharged.toString()).toBe("102.45");
  });

  it("should return correct Decimal gross-up for Tier 2 (8% commission) at GHS 92 vendor price", () => {
    const result = computeOrderPricing({
      vendorPrice: new Prisma.Decimal("92.00"),
      commissionRate: new Prisma.Decimal("0.08"),
      deliveryFee: new Prisma.Decimal("10.00"),
    });

    // listingPrice = 92 / 0.92 = 100.00
    // checkoutPrice = 100.00 + 10.00 = 110.00
    // paystackFee = 110.00 * 0.0195 + 0.50 = 2.645 -> 2.65
    // totalCharged = 110.00 + 2.65 = 112.65
    expect(result.listingPrice.toString()).toBe("100");
    expect(result.checkoutPrice.toString()).toBe("110");
    expect(result.paystackFee.toString()).toBe("2.65");
    expect(result.totalCharged.toString()).toBe("112.65");
  });

  it("should correctly snapshot deliveryFee from a given DeliveryZone.flatFee", () => {
    const deliveryZoneFlatFee = new Prisma.Decimal("25.00");
    const result = computeOrderPricing({
      vendorPrice: new Prisma.Decimal("100.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      deliveryFee: deliveryZoneFlatFee,
    });

    expect(result.deliveryFee).toBe(deliveryZoneFlatFee);
    expect(result.deliveryFee.toString()).toBe("25");
  });

  it("should have all 11 fields present and non-null", () => {
    const result = computeOrderPricing({
      vendorPrice: new Prisma.Decimal("100.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      deliveryFee: new Prisma.Decimal("15.00"),
    });

    const expectedFields = [
      "vendorPrice",
      "commissionRate",
      "listingPrice",
      "deliveryFee",
      "checkoutPrice",
      "paystackFee",
      "totalCharged",
      "commissionAmount",
      "sellerReceivable",
      "paystackRate",
      "paystackFlat"
    ];

    expect(Object.keys(result).length).toBe(11);
    for (const field of expectedFields) {
      expect(result[field as keyof typeof result]).toBeDefined();
      expect(result[field as keyof typeof result]).not.toBeNull();
    }
  });

  it("should use Prisma.Decimal instances for all pricing snapshot fields", () => {
    const result = computeOrderPricing({
      vendorPrice: new Prisma.Decimal("100.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      deliveryFee: new Prisma.Decimal("15.00"),
    });

    for (const key of Object.keys(result)) {
      const value = result[key as keyof typeof result];
      expect(value).toBeInstanceOf(Prisma.Decimal);
    }
  });
});
