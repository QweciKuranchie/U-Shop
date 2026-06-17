// lib/pricing.ts
// Compliance: U-Shop SRD v1.1 §8.1

import { Prisma } from "../generated/prisma";

export interface PricingInput {
  vendorPrice: Prisma.Decimal;
  commissionRate: Prisma.Decimal; // e.g. Decimal("0.05") or Decimal("0.08")
  deliveryFee: Prisma.Decimal; // e.g. Decimal("30.00") or Decimal("0.00")
}

export interface PricingSnapshot {
  vendorPrice: Prisma.Decimal;
  commissionRate: Prisma.Decimal;
  listingPrice: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  checkoutPrice: Prisma.Decimal;
  paystackFee: Prisma.Decimal;
  totalCharged: Prisma.Decimal;
  commissionAmount: Prisma.Decimal;
  sellerReceivable: Prisma.Decimal;
  paystackRate: Prisma.Decimal;
  paystackFlat: Prisma.Decimal;
}

const PAYSTACK_RATE = new Prisma.Decimal("0.0195"); // 1.95%
const PAYSTACK_FLAT = new Prisma.Decimal("0.50"); // GHS 0.50
const DECIMAL_SCALE = 2; // 2 decimal places

/**
 * Compute the full pricing snapshot for an order.
 * All arithmetic uses Prisma.Decimal (backed by decimal.js) — NO float.
 * Rounding: ROUND_HALF_UP (standard commercial rounding).
 */
export function computeOrderPricing(input: PricingInput): PricingSnapshot {
  const { vendorPrice, commissionRate, deliveryFee } = input;
  const ONE = new Prisma.Decimal("1");

  // Formula 1: Final Listing Price = Vendor Price / (1 - Commission Rate)
  const listingPrice = vendorPrice
    .div(ONE.minus(commissionRate))
    .toDecimalPlaces(DECIMAL_SCALE, Prisma.Decimal.ROUND_HALF_UP);

  // Formula 2: Checkout Price = Listing Price + Delivery Fee
  const checkoutPrice = listingPrice.plus(deliveryFee);

  // Formula 3: Paystack Fee = (1.95% × Checkout Price) + GHS 0.50
  const paystackFee = checkoutPrice
    .mul(PAYSTACK_RATE)
    .plus(PAYSTACK_FLAT)
    .toDecimalPlaces(DECIMAL_SCALE, Prisma.Decimal.ROUND_HALF_UP);

  // Total = Checkout Price + Paystack Fee
  const totalCharged = checkoutPrice.plus(paystackFee);

  // Platform revenue = Listing Price − Vendor Price
  const commissionAmount = listingPrice.minus(vendorPrice);

  // Seller receives exactly their vendor price
  const sellerReceivable = vendorPrice;

  return {
    vendorPrice: vendorPrice.toDecimalPlaces(DECIMAL_SCALE),
    commissionRate,
    listingPrice,
    deliveryFee: deliveryFee.toDecimalPlaces(DECIMAL_SCALE),
    checkoutPrice: checkoutPrice.toDecimalPlaces(DECIMAL_SCALE),
    paystackFee,
    totalCharged: totalCharged.toDecimalPlaces(DECIMAL_SCALE),
    commissionAmount: commissionAmount.toDecimalPlaces(DECIMAL_SCALE),
    sellerReceivable: sellerReceivable.toDecimalPlaces(DECIMAL_SCALE),
    paystackRate: PAYSTACK_RATE,
    paystackFlat: PAYSTACK_FLAT,
  };
}
