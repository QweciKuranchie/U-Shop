import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole, AuthError } from "../lib/auth-guards";
import { auth } from "../lib/auth";
import { authClient } from "../lib/auth-client";
import { middleware } from "../middleware";
import AuthLayout from "../app/(auth)/layout";
import BuyerLayout from "../app/(buyer)/layout";
import SellerLayout from "../app/(seller)/layout";
import { headers } from "next/headers";
import { prisma } from "../lib/prisma";
import { NextRequest } from "next/server";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const m = new Map<string, string>();
    m.set("x-invoke-path", "/account");
    return m;
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirect: ${url}`);
  }),
}));

// Mock next/server
vi.mock("next/server", () => {
  return {
    NextResponse: {
      next: vi.fn(() => ({ type: "next" })),
      redirect: vi.fn((url: URL | string) => ({ type: "redirect", url: url.toString() })),
    },
  };
});

// Mock better-auth and its adapter/client
vi.mock("../lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
  },
}));

// Mock prisma client
vi.mock("../lib/prisma", () => ({
  prisma: {
    sellerProfile: {
      findUnique: vi.fn(),
    },
  },
}));

type SessionType = {
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified?: boolean;
    name?: string;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
  };
};

describe("T3 Auth Contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Buyer Registration/Login Happy Path ─────────────────────────────────────
  describe("Registration & Login Client Flow", () => {
    it("should invoke signUp.email with correct buyer credentials", async () => {
      const mockResult = {
        data: { user: { id: "u1", email: "test@ug.edu.gh", name: "John" } },
        error: null,
      };
      
      const mockSignUp = vi.mocked(authClient.signUp.email).mockResolvedValue(
        mockResult as unknown as ReturnType<typeof authClient.signUp.email>
      );

      const credentials = { email: "test@ug.edu.gh", password: "password123", name: "John" };
      await authClient.signUp.email(credentials);

      expect(mockSignUp).toHaveBeenCalledWith(credentials);
    });

    it("should invoke signIn.email with correct credentials", async () => {
      const mockResult = {
        data: { user: { id: "u1", email: "test@ug.edu.gh", role: "buyer" } },
        error: null,
      };

      const mockSignIn = vi.mocked(authClient.signIn.email).mockResolvedValue(
        mockResult as unknown as ReturnType<typeof authClient.signIn.email>
      );

      const credentials = { email: "test@ug.edu.gh", password: "password123" };
      await authClient.signIn.email(credentials);

      expect(mockSignIn).toHaveBeenCalledWith(credentials);
    });
  });

  // ── 2. requireRole Guard ────────────────────────────────────────────────────────
  describe("requireRole Guard", () => {
    it("should throw UNAUTHENTICATED if session does not exist", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const promise = requireRole(new Headers(), "admin");
      await expect(promise).rejects.toThrow(AuthError);
      await expect(promise).rejects.toThrow(
        expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
      );
    });

    it("should throw FORBIDDEN if session role does not match required roles", async () => {
      const mockSession = {
        user: { id: "u1", email: "test@ug.edu.gh", role: "buyer" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      const promise = requireRole(new Headers(), "admin");
      await expect(promise).rejects.toThrow(AuthError);
      await expect(promise).rejects.toThrow(
        expect.objectContaining({ code: "FORBIDDEN", status: 403 })
      );
    });

    it("should pass and return user if role matches", async () => {
      const mockUser = { id: "u1", email: "admin@ushop.com", role: "admin" };
      const mockSession = {
        user: mockUser,
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      const result = await requireRole(new Headers(), "admin");
      expect(result.user).toEqual(mockUser);
    });
  });

  // ── 3. Middleware redirects ─────────────────────────────────────────────────────
  describe("Middleware Protections", () => {
    it("should redirect to /login for unauthenticated request to /admin", () => {
      const mockRequest = {
        nextUrl: new URL("http://localhost/admin/dashboard"),
        url: "http://localhost/admin/dashboard",
        cookies: {
          get: vi.fn().mockReturnValue(undefined), // No cookie
        },
      };

      const response = middleware(mockRequest as unknown as NextRequest) as unknown as { type: string; url: string };
      expect(response.type).toBe("redirect");
      expect(response.url).toContain("/login");
      expect(response.url).toContain("callbackUrl=%2Fadmin%2Fdashboard");
    });

    it("should allow request to proceed if session cookie is present", () => {
      const mockRequest = {
        nextUrl: new URL("http://localhost/admin/dashboard"),
        url: "http://localhost/admin/dashboard",
        cookies: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === "better-auth.session_token") return { value: "token123" };
            return undefined;
          }),
        },
      };

      const response = middleware(mockRequest as unknown as NextRequest) as unknown as { type: string };
      expect(response.type).toBe("next");
    });
  });

  // ── 4. app/(auth)/layout.tsx ────────────────────────────────────────────────────
  describe("Auth Shared Layout", () => {
    it("should redirect logged-in users away from login/register pages", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "buyer@ug.edu.gh", role: "buyer" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      await expect(AuthLayout({ children: "content" })).rejects.toThrow("Redirect: /buyer/dashboard");
    });

    it("should redirect logged-in admin to admin/dashboard", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "admin@ushop.com", role: "admin" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      await expect(AuthLayout({ children: "content" })).rejects.toThrow("Redirect: /admin/dashboard");
    });

    it("should render children if user is not logged in", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const result = await AuthLayout({ children: "auth-form" });
      expect(result).toEqual("auth-form");
    });
  });

  // ── 5. app/(buyer)/layout.tsx ───────────────────────────────────────────────────
  describe("Buyer Protected Layout", () => {
    it("should redirect unauthenticated users to /login with callbackUrl", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(BuyerLayout({ children: "content" })).rejects.toThrow(
        "Redirect: /login?callbackUrl=%2Faccount"
      );
    });

    it("should redirect users with non-buyer roles to /unauthorized", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "seller@ug.edu.gh", role: "seller" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      await expect(BuyerLayout({ children: "content" })).rejects.toThrow("Redirect: /unauthorized");
    });

    it("should redirect unverified buyers to /login?error=unauthorized", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "unverified@ug.edu.gh", role: "buyer", emailVerified: false },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      await expect(BuyerLayout({ children: "content" })).rejects.toThrow("Redirect: /login?error=unauthorized");
    });

    it("should render children for verified buyers", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "verified@ug.edu.gh", role: "buyer", emailVerified: true },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      const result = await BuyerLayout({ children: "buyer-content" });
      expect(result).toEqual("buyer-content");
    });
  });

  // ── 6. app/(seller)/layout.tsx ──────────────────────────────────────────────────
  describe("Seller Protected Layout", () => {
    it("should allow approved sellers to access any seller route", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "seller@ushop.com", role: "seller" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      const m = new Map<string, string>();
      m.set("x-invoke-path", "/seller/dashboard");
      vi.mocked(headers).mockResolvedValue(m as unknown as Headers);

      const result = await SellerLayout({ children: "seller-content" });
      expect(result).toEqual("seller-content");
    });

    it("should allow provisional buyers accessing /seller/application if they have a pending profile", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "pending@ug.edu.gh", role: "buyer" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      vi.mocked(prisma.sellerProfile.findUnique).mockResolvedValue({
        id: "p1",
        userId: "u1",
        status: "PENDING_STUDENT",
      } as unknown as Awaited<ReturnType<typeof prisma.sellerProfile.findUnique>>);

      const m = new Map<string, string>();
      m.set("x-invoke-path", "/seller/application");
      vi.mocked(headers).mockResolvedValue(m as unknown as Headers);

      const result = await SellerLayout({ children: "seller-content" });
      expect(result).toEqual("seller-content");
    });

    it("should redirect provisional buyers to /unauthorized if accessing dashboard /seller/dashboard", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "pending@ug.edu.gh", role: "buyer" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      vi.mocked(prisma.sellerProfile.findUnique).mockResolvedValue({
        id: "p1",
        userId: "u1",
        status: "PENDING_STUDENT",
      } as unknown as Awaited<ReturnType<typeof prisma.sellerProfile.findUnique>>);

      const m = new Map<string, string>();
      m.set("x-invoke-path", "/seller/dashboard");
      vi.mocked(headers).mockResolvedValue(m as unknown as Headers);

      await expect(SellerLayout({ children: "content" })).rejects.toThrow("Redirect: /unauthorized");
    });

    it("should redirect normal buyers (no profile) accessing /seller/application to /unauthorized", async () => {
      const mockSession: SessionType = {
        user: { id: "u1", email: "buyer@ushop.com", role: "buyer" },
        session: {
          id: "s1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "u1",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as ReturnType<typeof auth.api.getSession>
      );

      vi.mocked(prisma.sellerProfile.findUnique).mockResolvedValue(null);

      const m = new Map<string, string>();
      m.set("x-invoke-path", "/seller/application");
      vi.mocked(headers).mockResolvedValue(m as unknown as Headers);

      await expect(SellerLayout({ children: "content" })).rejects.toThrow("Redirect: /unauthorized");
    });
  });

  // ── 7. HTTPS Secure Cookie Regression ──────────────────────────────────────────
  describe("Middleware Protected HTTPS Secure Cookie", () => {
    it("should allow request to proceed if secure session cookie is present (HTTPS)", () => {
      const mockRequest = {
        nextUrl: new URL("https://localhost/admin/dashboard"),
        url: "https://localhost/admin/dashboard",
        cookies: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === "__Secure-better-auth.session_token") return { value: "token123" };
            return undefined;
          }),
        },
      };

      const response = middleware(mockRequest as unknown as NextRequest) as unknown as { type: string };
      expect(response.type).toBe("next");
    });
  });
});
