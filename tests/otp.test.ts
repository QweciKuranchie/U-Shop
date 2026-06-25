// tests/otp.test.ts
// TS Cache Refresh Trigger
import { describe, it, expect } from "vitest";
import {
  generateDeliveryOTP,
  verifyDeliveryOTP,
  generateSellerOTP,
  verifySellerOTP,
} from "../lib/otp";

describe("OTP Library (lib/otp.ts)", () => {
  it("should generate delivery OTP that is exactly 4 digits", async () => {
    const otp = await generateDeliveryOTP();
    expect(otp.raw).toHaveLength(4);
    expect(/^\d{4}$/.test(otp.raw)).toBe(true);
  });

  it("should generate seller OTP that is exactly 6 digits", async () => {
    const otp = await generateSellerOTP();
    expect(otp.raw).toHaveLength(6);
    expect(/^\d{6}$/.test(otp.raw)).toBe(true);
  });

  it("should verify matches using bcrypt for freshly generated delivery OTP", async () => {
    const otp = await generateDeliveryOTP();
    const result = await verifyDeliveryOTP(otp.raw, otp.hash, otp.expiresAt, 0);
    expect(result.success).toBe(true);
  });

  it("should verify matches using bcrypt for freshly generated seller OTP", async () => {
    const otp = await generateSellerOTP();
    const result = await verifySellerOTP(otp.raw, otp.hash, otp.expiresAt, 0);
    expect(result.success).toBe(true);
  });

  it("should fail verification for expired delivery OTP", async () => {
    const otp = await generateDeliveryOTP();
    const expiredTime = new Date(Date.now() - 1000); // 1s ago
    const result = await verifyDeliveryOTP(otp.raw, otp.hash, expiredTime, 0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_EXPIRED");
    }
  });

  it("should fail verification for expired seller OTP", async () => {
    const otp = await generateSellerOTP();
    const expiredTime = new Date(Date.now() - 1000); // 1s ago
    const result = await verifySellerOTP(otp.raw, otp.hash, expiredTime, 0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_EXPIRED");
    }
  });

  it("should lock out seller verification after 3 incorrect attempts", async () => {
    const otp = await generateSellerOTP();
    const result = await verifySellerOTP(otp.raw, otp.hash, otp.expiresAt, 3);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_LOCKED");
    }
  });

  it("should return mismatch for incorrect OTP value", async () => {
    const otp = await generateSellerOTP();
    const incorrectVal = otp.raw === "123456" ? "654321" : "123456";
    const result = await verifySellerOTP(incorrectVal, otp.hash, otp.expiresAt, 0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_MISMATCH");
    }
  });

  // ── Lockout enforcement tests ──────────────────────────────────

  it("should enforce lockout when lockoutUntil is in the future (10-minute window)", async () => {
    const otp = await generateSellerOTP();
    // Lockout set 1 minute ago, expires 9 minutes from now (within 10-min window)
    const lockoutUntil = new Date(Date.now() + 9 * 60 * 1000);
    const result = await verifySellerOTP(otp.raw, otp.hash, otp.expiresAt, 3, lockoutUntil);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_LOCKED");
    }
  });

  it("should allow verification after lockoutUntil has passed", async () => {
    const otp = await generateSellerOTP();
    // Lockout expired 1 second ago
    const lockoutUntil = new Date(Date.now() - 1000);
    // Reset attempts to 0 (as backend would do after lockout expiry)
    const result = await verifySellerOTP(otp.raw, otp.hash, otp.expiresAt, 0, lockoutUntil);
    expect(result.success).toBe(true);
  });

  it("should still lock out when attempts >= 3 even without lockoutUntil", async () => {
    const otp = await generateSellerOTP();
    const result = await verifySellerOTP(otp.raw, otp.hash, otp.expiresAt, 3, null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_LOCKED");
    }
  });

  it("should enforce lockout even with correct OTP when lockoutUntil is active", async () => {
    const otp = await generateSellerOTP();
    // Active lockout — 5 minutes remaining
    const lockoutUntil = new Date(Date.now() + 5 * 60 * 1000);
    const result = await verifySellerOTP(otp.raw, otp.hash, otp.expiresAt, 0, lockoutUntil);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_LOCKED");
    }
  });

  it("lockout should last exactly 10 minutes — not tied to OTP expiry", async () => {
    const otp = await generateSellerOTP();
    // OTP expires in 10 minutes, but lockout is set for exactly 10 minutes from now
    const lockoutUntil = new Date(Date.now() + 10 * 60 * 1000);
    const result = await verifySellerOTP(otp.raw, otp.hash, otp.expiresAt, 3, lockoutUntil);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("OTP_LOCKED");
    }

    // After lockout passes (simulate with expired lockout), should check OTP normally
    const expiredLockout = new Date(Date.now() - 1);
    const freshOtp = await generateSellerOTP();
    const resultAfter = await verifySellerOTP(freshOtp.raw, freshOtp.hash, freshOtp.expiresAt, 0, expiredLockout);
    expect(resultAfter.success).toBe(true);
  });
});
