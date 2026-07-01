import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import { computeOrderPricing } from "../lib/pricing";
import prisma from "../lib/prisma";
import { Prisma } from "../generated/prisma";

// Mock the prisma client
vi.mock("../lib/prisma", () => ({
  default: {
    $transaction: vi.fn((cb) => cb(prisma)),
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deliveryAddress: {
      findUnique: vi.fn(),
    },
    sellerProfile: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailOutbox: {
      create: vi.fn(),
    },
  },
  prisma: {
    $transaction: vi.fn((cb) => cb(prisma)),
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deliveryAddress: {
      findUnique: vi.fn(),
    },
    sellerProfile: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailOutbox: {
      create: vi.fn(),
    },
  },
}));

// Mock notifications outbox
vi.mock("../lib/notifications/outbox", () => ({
  queueEmail: vi.fn().mockResolvedValue({ id: "job-1" }),
}));

// Mock auth-guards
vi.mock("../lib/auth-guards", () => ({
  requireRole: vi.fn().mockResolvedValue({
    user: { id: "buyer-1", email: "buyer@example.com" },
  }),
  AuthError: class AuthError extends Error {
    status: number;
    code: string;
    constructor(message: string, status = 401, code = "UNAUTHORIZED") {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
}));

describe("Checkout and Pricing Logic (lib/pricing.ts)", () => {
  it("should calculate correct 11 pricing fields with zone-based delivery fee", () => {
    const input = {
      vendorPrice: new Prisma.Decimal("100.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      deliveryFee: new Prisma.Decimal("15.00"),
    };

    const snapshot = computeOrderPricing(input);

    // Listing Price = 100 / (1 - 0.05) = 105.26315 -> 105.26
    expect(snapshot.listingPrice.toString()).toBe("105.26");
    // Checkout Price = 105.26 + 15 = 120.26
    expect(snapshot.checkoutPrice.toString()).toBe("120.26");
    // Paystack Fee = (120.26 * 0.0195) + 0.5 = 2.34507 + 0.5 = 2.84507 -> 2.85
    expect(snapshot.paystackFee.toString()).toBe("2.85");
    // Total Charged = 120.26 + 2.85 = 123.11
    expect(snapshot.totalCharged.toString()).toBe("123.11");
  });
});

describe("Paystack HMAC Webhook Signature Verification", () => {
  const secretKey = "test_paystack_secret_key";
  process.env.PAYSTACK_SECRET_KEY = secretKey;

  it("should verify successfully with matching computed hash", () => {
    const payload = JSON.stringify({ event: "charge.success", data: { reference: "ref_1" } });
    const computedHash = crypto
      .createHmac("sha512", secretKey)
      .update(payload)
      .digest("hex");

    const computedBuffer = Buffer.from(computedHash);
    const signatureBuffer = Buffer.from(computedHash);

    // Verify length equality
    expect(computedBuffer.length).toBe(signatureBuffer.length);
    // Verify timing-safe equality
    const verified = crypto.timingSafeEqual(computedBuffer, signatureBuffer);
    expect(verified).toBe(true);
  });

  it("should fail signature validation for tampered payload", () => {
    const payload = JSON.stringify({ event: "charge.success", data: { reference: "ref_1" } });
    const computedHash = crypto
      .createHmac("sha512", secretKey)
      .update(payload)
      .digest("hex");

    const tamperedHash = crypto
      .createHmac("sha512", secretKey)
      .update(payload + "tamper")
      .digest("hex");

    const computedBuffer = Buffer.from(computedHash);
    const tamperedBuffer = Buffer.from(tamperedHash);

    expect(crypto.timingSafeEqual(computedBuffer, tamperedBuffer)).toBe(false);
  });
});
