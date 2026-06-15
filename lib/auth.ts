import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma";
import { dash } from "@better-auth/infra";

export const auth = betterAuth({
  // ── Database adapter ─────────────────────────────────────────────
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // ── Email + Password ─────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,   // Buyers must verify before purchasing
    autoSignIn: false,
    minPasswordLength: 8,
  },

  // ── Email verification via Resend ────────────────────────────────
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { sendVerificationEmail } = await import("@/lib/email");
      await sendVerificationEmail({ to: user.email, url });
    },
  },

  // ── Session configuration ────────────────────────────────────────
  session: {
    expiresIn:      60 * 60 * 24 * 7,   // 7 days
    updateAge:      60 * 60 * 24,         // Refresh if > 24h old
    cookieCache: {
      enabled:    true,
      maxAge:     60 * 5,                 // Re-use cached session for 5 min
    },
  },

  // ── User schema extensions (custom fields) ───────────────────────
  user: {
    additionalFields: {
      role: {
        type:         "string",
        required:     false,
        defaultValue: "buyer",            // Enum: "admin"|"seller"|"buyer"|"rider"
        input:        false,              // Cannot be set by user at sign-up
      },
    },
  },

  // ── Security ─────────────────────────────────────────────────────
  advanced: {
    useSecureCookies:           process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
    },
    crossSubDomainCookies: {
      enabled: false,                     // Single domain: ushopgh.com
    },
  },

  // ── Rate limiting on auth endpoints ─────────────────────────────
  rateLimit: {
    enabled: true,
    window:  60,                          // 60-second window
    max:     10,                          // 10 auth attempts per window per IP
  },

  plugins: [
    dash(),
  ],
});
