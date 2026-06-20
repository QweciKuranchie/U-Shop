import crypto from "crypto";

export function generateOnboardingToken(userId: string): string {
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiration
  const payload = `${userId}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", process.env.BETTER_AUTH_SECRET || "default_secret");
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `${payload}:${signature}`;
}

export function verifyOnboardingToken(token: string): string | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;
    const [userId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    
    if (Date.now() > expiresAt) {
      return null;
    }
    
    const payload = `${userId}:${expiresAt}`;
    const hmac = crypto.createHmac("sha256", process.env.BETTER_AUTH_SECRET || "default_secret");
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    return userId;
  } catch {
    return null;
  }
}
