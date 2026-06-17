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
});
