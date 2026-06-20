export function getSafeRedirectPath(callbackUrl: string | null, defaultDestination: string): string {
  if (!callbackUrl) return defaultDestination;
  try {
    const decoded = decodeURIComponent(callbackUrl).trim();
    // Accept only trusted internal application paths:
    // Must start with a single '/' and NOT be followed by another '/' or '\'
    // Reject protocol-based/absolute URLs and script-style values (e.g., javascript:, data:).
    const isSafe = /^\/(?!\/|\\)/.test(decoded) &&
                   !decoded.toLowerCase().includes("javascript:") &&
                   !decoded.toLowerCase().includes("data:") &&
                   !/^[a-z\d+\-.]+:\/\//i.test(decoded) &&
                   !decoded.startsWith("//") &&
                   !decoded.startsWith("\\");
    return isSafe ? decoded : defaultDestination;
  } catch {
    return defaultDestination;
  }
}
