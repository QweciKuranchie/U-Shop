// lib/otp.ts
// Compliance: U-Shop SRD v1.1 §6.4

import crypto from "crypto";
import bcrypt from "bcryptjs";

/** Salt rounds for bcrypt — 10 provides ~100ms hash time on t3.micro */
const BCRYPT_SALT_ROUNDS = 10;

/** OTP TTL in milliseconds (4 hours) */
const OTP_TTL_MS = 4 * 60 * 60 * 1000;

/** Max verification attempts before lockout */
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically random 4-digit delivery OTP.
 *
 * Uses crypto.randomInt(0, 10000) which draws from the OS CSPRNG.
 * The raw OTP is hashed with bcrypt before storage.
 * The raw OTP is returned once, to be emailed to the buyer, then discarded.
 */
export async function generateDeliveryOTP(): Promise<{
  raw: string; // Send to buyer via Resend — NEVER store this
  hash: string; // Store in DB as order.otpHash
  expiresAt: Date; // Store in DB as order.otpExpiresAt
}> {
  // crypto.randomInt is CSPRNG-backed, uniform distribution over [0, 10000)
  const rawInt = crypto.randomInt(0, 10000);
  const raw = rawInt.toString().padStart(4, "0"); // e.g. "0042", "9999"

  // Hash with bcrypt — 10 salt rounds (~100ms). NEVER store raw OTP.
  const hash = await bcrypt.hash(raw, BCRYPT_SALT_ROUNDS);

  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  return { raw, hash, expiresAt };
}

/**
 * Verify a rider-submitted OTP against the stored bcrypt hash.
 * Returns a typed result — never throws on mismatch (only on system error).
 */
export async function verifyDeliveryOTP(
  submitted: string,
  storedHash: string,
  expiresAt: Date,
  attempts: number
): Promise<
  | { success: true }
  | { success: false; reason: "OTP_EXPIRED" | "OTP_MISMATCH" | "OTP_LOCKED" }
> {
  // Check lockout FIRST
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, reason: "OTP_LOCKED" };
  }

  // Check expiry
  if (new Date() > expiresAt) {
    return { success: false, reason: "OTP_EXPIRED" };
  }

  // Timing-safe bcrypt comparison
  const matches = await bcrypt.compare(submitted, storedHash);
  if (!matches) {
    return { success: false, reason: "OTP_MISMATCH" };
  }

  return { success: true };
}
