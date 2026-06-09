<!-- ================================================================
     U-SHOP — SYSTEM REQUIREMENTS DOCUMENT (SRD) v1.1
     Author  : Richard Nuhu
     Date    : June 9, 2026 (Patch Release — Production Fixes)
     Derived From: PRD v1.3 (approved) · SRD v1.0 (superseded)
     ================================================================ -->

<div align="center">

<br/>

<h1>
  <span style="background:#FF0000;color:#FFFFFF;padding:4px 14px;font-size:2.2rem;font-weight:900;border-radius:4px;">U</span>&nbsp;<span style="color:#5D1A89;font-size:2.2rem;font-weight:900;">sh</span><span style="color:#D1148A;font-size:2.2rem;font-weight:900;">op</span>
</h1>

<h2 style="color:#5D1A89;">System Requirements Document</h2>
<p style="color:#D1148A;font-weight:600;">Version 1.1 — Engineering Reference (Patch Release)</p>

<br/>

| Field | Value |
|---|---|
| **Document** | System Requirements Document (SRD) |
| **Version** | 1.1 |
| **Author** | Richard Nuhu |
| **Derived From** | PRD v1.3 (approved, June 1, 2026) · SRD v1.0 (superseded) |
| **Sprint Start** | June 1, 2026 |
| **Sprint End** | August 31, 2026 |
| **Status** | Approved — Engineering Reference |
| **Stack** | Next.js 15 (App Router) · Vercel · AWS RDS PostgreSQL · AWS S3 · Better Auth · Prisma · Resend · Paystack · Sentry · @vercel/functions |

</div>

---

<br/>

# <span style="color:#5D1A89;">Table of Contents</span>

| § | Section |
|---|---|
| 0 | [Document Control & Scope](#s0) |
| 1 | [System Architecture Overview](#s1) |
| 2 | [Authentication & RBAC Specification](#s2) |
| 3 | [Database & Data Access Layer](#s3) |
| 4 | [Security & IAM Infrastructure](#s4) |
| 5 | [API Performance & Error Observability](#s5) |
| 6 | [Logistics State Machine](#s6) |
| 7 | [S3 Asset Management](#s7) |
| 8 | [Commission & Pricing Engine](#s8) |
| 9 | [Email & Notification Architecture](#s9) |
| 10 | [Environment Variables & Secrets](#s10) |
| 11 | [CI/CD Pipeline Technical Specification](#s11) |
| 12 | [API Contract & Error Code Reference](#s12) |
| 13 | [Non-Functional Technical Targets](#s13) |
| 14 | [Document History](#s14) |

---

<br/>

<a name="s0"></a>

# <span style="color:#5D1A89;">0. Document Control & Scope</span>

## <span style="color:#D1148A;">0.1 Purpose</span>

This System Requirements Document (SRD) translates the approved PRD v1.3 into precise, implementable engineering specifications. Every section defines *how* a system requirement is met, not merely *that* it must be met. Code snippets are normative — deviations require a written architecture decision record (ADR).

## <span style="color:#D1148A;">0.2 Scope</span>

This SRD governs all software components of U-Shop V1 MVP:

- **Next.js 15 Application** — full-stack monorepo on Vercel Hobby tier
- **PostgreSQL 15 Database** — AWS RDS `db.t2.micro`, accessed via Prisma Accelerate
- **AWS S3** — two buckets: `ushop-product-images` (public) and `ushop-kyc-documents` (private)
- **Better Auth** — authentication, session management, and RBAC via `@better-auth/prisma-adapter`
- **Paystack** — payment processing, webhook ingestion
- **Resend** — transactional email delivery
- **Sentry** — error tracking and performance monitoring

## <span style="color:#D1148A;">0.3 Conventions</span>

| Notation | Meaning |
|---|---|
| `MUST` | Mandatory. Non-compliance is a build blocker. |
| `SHOULD` | Strongly recommended. Deviation requires justification. |
| `MAY` | Optional enhancement. |
| `[ENV: VAR_NAME]` | Value sourced from environment variable. |
| `// SRD-NORM` | Normative code: exact implementation required. |
| `// SRD-REF` | Reference pattern: adapt as needed. |

---

<br/>

<a name="s1"></a>

# <span style="color:#5D1A89;">1. System Architecture Overview</span>

## <span style="color:#D1148A;">1.1 High-Level Component Topology</span>

```
 Client (Android Chrome / Desktop)
         │
         │ HTTPS (Cloudflare TLS termination)
         ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │                    Cloudflare (Free Tier)                           │
 │   DNS · DDoS Protection · Edge Cache · Automatic HTTPS             │
 └─────────────────────────────┬──────────────────────────────────────┘
                               │ Proxied to Vercel origin
                               ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │                 Vercel (Next.js 15 App Router — Hobby Tier)        │
 │                                                                    │
 │  ┌─────────────────────────────────────────────────────────────┐  │
 │  │              Next.js Middleware (Edge Runtime)               │  │
 │  │  Cookie check ONLY (session_token present?) → route guard   │  │
 │  │  ⚠️ NO Prisma / NO auth.api.getSession() — Edge-safe       │  │
 │  └──────────────────────────────┬──────────────────────────────┘  │
 │                                 │                                  │
 │  ┌──────────────┐  ┌────────────┴────────────┐  ┌─────────────┐  │
 │  │    Server    │  │    API Route Handlers    │  │   Server    │  │
 │  │  Components  │  │  /api/auth/[...all]      │  │  Actions    │  │
 │  │  (RSC/SSR)   │  │  /api/webhooks/paystack  │  │  (forms)    │  │
 │  │              │  │  /api/orders/[id]/*      │  │             │  │
 │  │              │  │  /api/kyc/presigned-url  │  │             │  │
 │  └──────────────┘  └─────────────────────────┘  └─────────────┘  │
 └──────┬─────────────────────────┬─────────────────────┬────────────┘
        │                         │                     │
        ▼                         ▼                     ▼
 ┌─────────────┐        ┌──────────────────┐   ┌──────────────────────┐
 │  AWS RDS    │        │     AWS S3        │   │   External Services  │
 │ PostgreSQL  │        │                  │   │                      │
 │ db.t2.micro │        │ ushop-product-   │   │  Paystack API        │
 │             │        │ images (public)  │   │  Resend API          │
 │ via Prisma  │        │                  │   │  Sentry (errors)     │
 │ Accelerate  │        │ ushop-kyc-       │   │  UptimeRobot         │
 │ (pooled)    │        │ documents (priv) │   │                      │
 └─────────────┘        └──────────────────┘   └──────────────────────┘
```

## <span style="color:#D1148A;">1.2 Request Lifecycle</span>

1. **DNS → Cloudflare**: All `*.ushopgh.com` traffic is proxied through Cloudflare. TLS termination occurs at Cloudflare edge.
2. **Cloudflare → Vercel**: Request forwarded to Vercel with original headers preserved.
3. **Next.js Middleware** (Edge Runtime): Performs a **lightweight cookie-presence check** for the `better-auth.session_token` cookie. If accessing a protected route and no cookie is present, the user is redirected to `/login`. **Middleware does NOT call `auth.api.getSession()`** — the Edge Runtime does not support the Node.js APIs required by Prisma. The actual database-backed session and role validation is deferred to Step 4.
4. **Server Component / Route Handler** (Node.js Runtime): Executes the **strict, database-backed** `auth.api.getSession()` call to validate the session token against PostgreSQL and retrieve `session.user.role`. This is the authoritative RBAC enforcement point. Accesses PostgreSQL via Prisma Accelerate connection pool. Accesses S3 via AWS SDK v3. Vercel Hobby tier imposes a 10-second execution timeout.
5. **Response**: Streamed or returned. Cloudflare CDN caches static assets. Dynamic API responses: `Cache-Control: no-store`. For S3 cleanup after product deletion, `waitUntil()` from `@vercel/functions` keeps the execution context alive after the response is sent.

## <span style="color:#D1148A;">1.3 Route Group Architecture</span>

```
app/
├── (public)/                    # No auth required
│   ├── page.tsx                 # Homepage / product browse
│   ├── store/[handle]/page.tsx  # Seller storefront
│   └── products/[id]/page.tsx  # Product detail
├── (auth)/                      # Better Auth sign-in/up pages
│   ├── login/page.tsx
│   └── register/page.tsx
├── (buyer)/                     # role: "buyer" | "seller" | "admin"
│   ├── checkout/page.tsx
│   └── orders/[id]/page.tsx
├── (seller)/                    # role: "seller" only
│   ├── dashboard/page.tsx
│   ├── listings/page.tsx
│   └── listings/new/page.tsx
├── (admin)/                     # role: "admin" only
│   ├── dashboard/page.tsx
│   ├── sellers/page.tsx         # KYC queue
│   ├── orders/page.tsx
│   └── riders/page.tsx
├── (rider)/                     # role: "rider" only
│   ├── page.tsx                 # Order list
│   ├── orders/[id]/page.tsx    # OTP submission
│   └── history/page.tsx
└── api/
    ├── auth/[...all]/route.ts   # Better Auth catch-all
    ├── webhooks/paystack/route.ts
    ├── orders/[id]/
    │   ├── route.ts
    │   ├── assign-rider/route.ts
    │   └── verify-otp/route.ts
    ├── products/route.ts
    ├── kyc/presigned-url/route.ts
    └── health/route.ts
```

---

<br/>

<a name="s2"></a>

# <span style="color:#5D1A89;">2. Authentication & RBAC Specification</span>

> <span style="color:#FF0000;font-weight:700;">MANDATE:</span> Custom JWT implementation is prohibited. `better-auth` + `@better-auth/prisma-adapter` is the sole authentication layer.

## <span style="color:#D1148A;">2.1 Package Installation</span>

```bash
pnpm add better-auth @better-auth/prisma-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

## <span style="color:#D1148A;">2.2 Core Better Auth Configuration</span>

**File: `lib/auth.ts`** — normative configuration. No deviations without ADR.

```typescript
// lib/auth.ts  // SRD-NORM
import { betterAuth } from "better-auth"
import { prismaAdapter } from "@better-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

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
      const { sendVerificationEmail } = await import("@/lib/email")
      await sendVerificationEmail({ to: user.email, url })
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
})

export type Session = typeof auth.$Infer.Session
export type User    = typeof auth.$Infer.Session["user"]
```

**File: `lib/auth-client.ts`** — client-side auth instance:

```typescript
// lib/auth-client.ts  // SRD-NORM
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
```

**File: `app/api/auth/[...all]/route.ts`** — catch-all handler:

```typescript
// app/api/auth/[...all]/route.ts  // SRD-NORM
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

## <span style="color:#D1148A;">2.3 Database Schema — Better Auth Tables</span>

The following Prisma schema is the authoritative definition. Better Auth's Prisma adapter reads and writes to these tables.

```prisma
// prisma/schema.prisma  // SRD-NORM
// ── Better Auth Tables ───────────────────────────────────────────────

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  // Custom field — role-based access control
  role          String   @default("buyer")
  // "admin" | "seller" | "buyer" | "rider"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions      Session[]
  accounts      Account[]

  // Application relations
  sellerProfile SellerProfile?
  buyerOrders   Order[]        @relation("BuyerOrders")

  @@index([email])
  @@index([role])
  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([token])
  @@index([userId])
  @@map("sessions")
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?   @db.Text
  refreshToken          String?   @db.Text
  idToken               String?   @db.Text
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?   // bcrypt hash (managed by Better Auth)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([providerId, accountId])
  @@index([userId])
  @@map("accounts")
}

model Verification {
  id         String    @id @default(cuid())
  identifier String    // email address
  value      String    // OTP or verification token
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt

  @@index([identifier])
  @@map("verifications")
}
```

## <span style="color:#D1148A;">2.4 Role Claim Mapping</span>

Better Auth does not use JWT bearer tokens by default — it uses **opaque session tokens** stored in an HttpOnly cookie (`better-auth.session_token`). The session token is a random string that references a `Session` record in PostgreSQL. When the server calls `auth.api.getSession()`, it performs a DB lookup joining `Session → User`, returning `session.user.role`.

**Role claim is therefore a database field, not a JWT claim.** The role is accessed as:

```typescript
const session = await auth.api.getSession({ headers: request.headers })
const role = session?.user.role  // "admin" | "seller" | "buyer" | "rider"
```

The role is **never self-assignable** by the user. It is set exclusively by server-side admin actions:

| Role | Who Sets It | When |
|---|---|---|
| `"buyer"` | Better Auth (default) | At `signUp.email()` — automatic |
| `"seller"` | Admin server action | On KYC approval: `prisma.user.update({ role: "seller" })` |
| `"rider"` | Admin server action | When admin creates rider account |
| `"admin"` | Prisma seed script | One-time on first deployment by Richard Nuhu |

## <span style="color:#D1148A;">2.5 Next.js Middleware — Route Protection (Edge-Safe Cookie Gate)</span>

> <span style="color:#FF0000;font-weight:700;">v1.1 PATCH:</span> The Next.js Edge Runtime does **not** support the Node.js APIs required by Prisma (tcp sockets, `node:crypto`, etc.). Therefore `auth.api.getSession()` — which performs a database lookup — **MUST NOT** be called in `middleware.ts`. The middleware now performs only a **lightweight cookie-presence check** for `better-auth.session_token`. The strict, database-backed role validation is enforced inside Server Components, Route Handlers, and Server Actions (§2.6).

```typescript
// middleware.ts  // SRD-NORM (v1.1 — Edge-safe rewrite)
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// ── Protected route prefixes ─────────────────────────────────────────
// Middleware only checks IF a session cookie exists.
// Actual role enforcement happens server-side in the Node.js runtime.
const PROTECTED_PREFIXES = [
  "/admin",
  "/seller",
  "/rider",
  "/account",
]

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // ── Check if this route requires authentication ──────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  // Not a protected route — allow through
  if (!isProtected) return NextResponse.next()

  // ── Lightweight cookie presence check ────────────────────────────
  // This does NOT validate the session — it only checks if the cookie exists.
  // The actual session validation and role check happens in the Node.js
  // runtime via auth.api.getSession() inside the page/route handler.
  const sessionCookie = request.cookies.get("better-auth.session_token")

  if (!sessionCookie?.value) {
    // No session cookie at all — redirect to login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Cookie exists — allow through to Node.js runtime ─────────────
  // The Server Component or Route Handler will:
  //   1. Call auth.api.getSession({ headers }) — DB lookup
  //   2. Verify session.user.role matches the route's required role
  //   3. Return 401/403 or redirect to /unauthorized if invalid
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/rider/:path*",
    "/account/:path*",
    // Exclude static files, Next.js internals, and auth API
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}
```

> <span style="color:#FF0000;font-weight:700;">CRITICAL:</span> Middleware is a **UX routing gate only**. It can redirect unauthenticated users to `/login` based on cookie presence, but it **cannot** make role-based routing decisions because it has no access to the database. All role-based authorization MUST be enforced inside the Node.js runtime (see §2.6).

## <span style="color:#D1148A;">2.6 Session Retrieval Patterns (Node.js Runtime — Authoritative RBAC)</span>

> <span style="color:#FF0000;font-weight:700;">v1.1 MANDATE:</span> Since middleware only checks cookie presence (§2.5), **every** Server Component, Route Handler, and Server Action that serves a protected resource **MUST** independently call `auth.api.getSession()` to validate the session against the database and enforce role-based access. This is the authoritative security boundary.

**In Server Components (page-level RBAC):**
```typescript
// SRD-NORM (v1.1 — mandatory for all protected pages)
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function SellerDashboardPage() {
  const session = await auth.api.getSession({ headers: headers() })

  // Unauthenticated — middleware may have let through a stale cookie
  if (!session) redirect("/login")

  // Wrong role — strict server-side enforcement
  if (session.user.role !== "seller") redirect("/unauthorized")

  // ── Session validated, role confirmed. Render page. ──────────────
  // ...
}
```

**In Route Handlers:**
```typescript
// SRD-REF
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 })
  // ...
}
```

**Role-specific guard helper:**
```typescript
// lib/auth-guards.ts  // SRD-NORM
import { auth } from "@/lib/auth"

/**
 * Validates the session via database lookup and enforces role-based access.
 * This is the AUTHORITATIVE security gate — replaces the removed middleware RBAC.
 * MUST be called in every Route Handler and Server Action serving protected resources.
 */
export async function requireRole(
  request: Request,
  ...roles: string[]
): Promise<{ user: { id: string; role: string; email: string } }> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user)          throw new AuthError("UNAUTHENTICATED", 401)
  if (!roles.includes(session.user.role)) throw new AuthError("FORBIDDEN", 403)
  return { user: session.user }
}

export class AuthError extends Error {
  constructor(public code: string, public status: number) {
    super(code)
  }
}
```

---

<br/>

<a name="s3"></a>

# <span style="color:#5D1A89;">3. Database & Data Access Layer</span>

## <span style="color:#D1148A;">3.1 Connection Pooling — Serverless Exhaustion Prevention</span>

### Problem

AWS RDS `db.t2.micro` (1 GB RAM) has a PostgreSQL `max_connections` ceiling of approximately **87 connections** (calculated as `LEAST({DBInstanceClassMemory/9531392}, 5000)` = `LEAST(1073741824/9531392, 5000)` ≈ 112; practically ~87 after system overhead). Vercel serverless functions are stateless: without pooling, each concurrent function invocation opens a new Prisma Client connection, rapidly exhausting the limit during any traffic spike.

### Solution: Prisma Accelerate (Primary)

Prisma Accelerate acts as a managed connection pooler proxy between Vercel serverless functions and AWS RDS. The application connects to the Accelerate endpoint; Accelerate maintains a persistent pool against RDS.

```
Vercel Fn 1 ──┐
Vercel Fn 2 ──┤──► Prisma Accelerate (proxy) ──► AWS RDS (max ~87 conns)
Vercel Fn 3 ──┤        (manages N→~10 pooling)
Vercel Fn N ──┘
```

**Setup:**

```bash
# Install Accelerate extension
pnpm add @prisma/extension-accelerate
```

**`prisma/schema.prisma` datasource:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Accelerate connection string
  directUrl = env("DIRECT_DATABASE_URL") // Direct RDS URL (migrations only)
}
```

**`lib/prisma.ts`** — singleton with Accelerate:
```typescript
// lib/prisma.ts  // SRD-NORM
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

// Prevent multiple Prisma Client instances during Next.js hot reload
declare global {
  // eslint-disable-next-line no-var
  var __prisma: ReturnType<typeof buildPrismaClient> | undefined
}

function buildPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [{ emit: "event", level: "query" }, "warn", "error"]
        : ["warn", "error"],
  }).$extends(withAccelerate())
}

export const prisma = globalThis.__prisma ?? buildPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma
}
```

**Environment variables:**
```bash
# .env (production — Vercel environment)
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=[ENV:PRISMA_ACCELERATE_API_KEY]"
DIRECT_DATABASE_URL="postgresql://[user]:[pass]@[rds-endpoint]:5432/ushop?sslmode=require"
```

### Alternative: PgBouncer (Fallback)

If Prisma Accelerate is unavailable or cost-prohibitive, deploy a self-hosted PgBouncer instance via Docker on an AWS EC2 `t2.micro` free-tier instance within the same VPC as RDS:

```ini
# pgbouncer.ini  // SRD-REF
[databases]
ushop = host=[RDS_ENDPOINT] port=5432 dbname=ushop

[pgbouncer]
pool_mode         = transaction    # Transaction-level pooling for serverless
max_client_conn   = 200            # Max incoming connections from Vercel
default_pool_size = 15             # Connections kept open to RDS (≤ 87)
min_pool_size     = 2
reserve_pool_size = 3
reserve_pool_timeout = 3
server_idle_timeout  = 60
```

In transaction pool mode, the connection is released back to the pool immediately after each `BEGIN...COMMIT` block — ideal for serverless functions that issue short-lived queries.

## <span style="color:#D1148A;">3.2 Full Application Schema</span>

```prisma
// prisma/schema.prisma  // SRD-NORM (application tables, appended after Better Auth tables)

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// ── Enums ──────────────────────────────────────────────────────────

enum SellerTier {
  STUDENT
  BUSINESS
  INDIVIDUAL
}

enum SellerStatus {
  PENDING_STUDENT
  PENDING_BUSINESS
  PENDING_INDIVIDUAL
  ACTIVE
  SUSPENDED
  REJECTED
}

enum ProductCategory {
  PHONES
  LAPTOPS
  AUDIO
  ACCESSORIES
  COMPONENTS
  CABLES
  GAMING
  OTHER
}

enum ProductCondition {
  NEW
  LIKE_NEW
  GOOD
  FAIR
}

enum ProductStatus {
  ACTIVE
  PAUSED
  SOLD
  DELETED
}

enum OrderStatus {
  PENDING_COD
  PAID
  PROCESSING
  READY_FOR_PICKUP
  IN_TRANSIT
  DELIVERED
  COMPLETED
  DISPUTED
  CANCELLED
}

enum PaymentMethod {
  MOBILE_MONEY
  CARD
  CASH_ON_DELIVERY
}

enum CommissionStatus {
  PENDING
  CAPTURED
  WAIVED
}

enum DeliveryFeeStatus {
  PENDING
  PAID_TO_RIDER
  WAIVED
}

// ── Application Models ────────────────────────────────────────────

model SellerProfile {
  id              String       @id @default(cuid())
  userId          String       @unique
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  handle          String       @unique   // URL slug: /store/{handle}
  storeName       String
  bio             String?      @db.Text
  tagline         String?
  profilePhotoKey String?                // S3 key — ushop-product-images
  coverImageKey   String?                // S3 key — ushop-product-images
  whatsappNumber  String?                // Admin-only; NEVER in buyer-facing API
  phone           String?                // Admin-only; NEVER in buyer-facing API
  campus          String?
  tier            SellerTier
  status          SellerStatus @default(PENDING_STUDENT)
  commissionRate  Decimal      @default(0.05) @db.Decimal(5, 4)
  kycDocKeys      Json         @default("[]")  // String[] of S3 keys — private bucket
  rejectionReason String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  products Product[]

  @@index([handle])
  @@index([status])
  @@index([campus])
  @@map("seller_profiles")
}

model Product {
  id             String           @id @default(cuid())
  sellerId       String
  seller         SellerProfile    @relation(fields: [sellerId], references: [id])
  title          String
  description    String           @db.Text
  category       ProductCategory
  condition      ProductCondition
  // ── Currency fields: ALL Decimal(10,2) — NO floating point ──────
  vendorPrice    Decimal          @db.Decimal(10, 2)
  listingPrice   Decimal          @db.Decimal(10, 2)
  commissionRate Decimal          @db.Decimal(5, 4)
  imageS3Keys    Json             @default("[]")  // String[] — public bucket
  status         ProductStatus    @default(ACTIVE)
  deletedAt      DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  orders Order[]

  // Note: GIN index for full-text search added via raw migration (see §3.4)
  @@index([status])
  @@index([category])
  @@index([sellerId])
  @@map("products")
}

model Order {
  id        String @id @default(cuid())
  reference String @unique   // Format: USH-YYYYMMDD-XXXXXX

  // ── Relationships ───────────────────────────────────────────────
  buyerId   String
  buyer     User          @relation("BuyerOrders", fields: [buyerId], references: [id])
  productId String
  product   Product       @relation(fields: [productId], references: [id])
  riderId   String?
  rider     Rider?        @relation(fields: [riderId], references: [id])

  // ── Pricing snapshot (ALL Decimal — immutable after creation) ───
  vendorPrice      Decimal @db.Decimal(10, 2)
  commissionRate   Decimal @db.Decimal(5, 4)
  listingPrice     Decimal @db.Decimal(10, 2)
  deliveryFee      Decimal @default(0) @db.Decimal(10, 2)
  checkoutPrice    Decimal @db.Decimal(10, 2)
  paystackFee      Decimal @default(0) @db.Decimal(10, 2)
  totalCharged     Decimal @db.Decimal(10, 2)
  commissionAmount Decimal @db.Decimal(10, 2)
  sellerReceivable Decimal @db.Decimal(10, 2)

  // ── Payment ─────────────────────────────────────────────────────
  paymentMethod     PaymentMethod
  paystackReference String?        @unique

  // ── State ───────────────────────────────────────────────────────
  status            OrderStatus      @default(PAID)
  commissionStatus  CommissionStatus @default(PENDING)
  deliveryFeeStatus DeliveryFeeStatus @default(PENDING)

  // ── OTP delivery verification ────────────────────────────────────
  otpHash      String?   // bcrypt hash — raw OTP never stored
  otpExpiresAt DateTime?
  otpAttempts  Int       @default(0)

  // ── Lifecycle timestamps ────────────────────────────────────────
  paidAt        DateTime?
  processedAt   DateTime?
  readyAt       DateTime?
  inTransitAt   DateTime?
  deliveredAt   DateTime?
  completedAt   DateTime?
  disputedAt    DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  webhookEvents WebhookEvent[]
  reviews       Review[]

  @@index([status])
  @@index([buyerId])
  @@index([riderId])
  @@index([paystackReference])
  @@map("orders")
}

model Rider {
  id        String   @id @default(cuid())
  userId    String   @unique
  name      String
  phone     String                  // Shown to buyer during IN_TRANSIT only
  zone      String                  // Campus/delivery zone(s)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders Order[]

  @@map("riders")
}

model WebhookEvent {
  id          String   @id @default(cuid())
  paystackRef String   @unique   // Idempotency key
  event       String             // e.g. "charge.success"
  processed   Boolean  @default(false)
  orderId     String?
  order       Order?   @relation(fields: [orderId], references: [id])
  payload     Json
  receivedAt  DateTime @default(now())

  @@index([paystackRef])
  @@map("webhook_events")
}

model Review {
  id        String   @id @default(cuid())
  orderId   String   @unique
  order     Order    @relation(fields: [orderId], references: [id])
  buyerId   String
  sellerId  String
  rating    Int                    // 1–5
  comment   String?  @db.Text
  createdAt DateTime @default(now())

  @@map("reviews")
}

model Institution {
  id        String   @id @default(cuid())
  name      String
  domains   Json                   // String[] of accepted .edu.gh domains
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("institutions")
}

model KycAccessLog {
  id          String   @id @default(cuid())
  adminUserId String
  s3ObjectKey String
  accessedAt  DateTime @default(now())
  ipAddress   String?

  @@index([adminUserId])
  @@map("kyc_access_logs")
}
```

## <span style="color:#D1148A;">3.3 Currency Field Constraint</span>

> <span style="color:#FF0000;font-weight:700;">MANDATE:</span> All monetary values MUST use `@db.Decimal(10, 2)`. JavaScript `number` (IEEE 754 float) MUST NEVER be used for currency. Prisma returns `Decimal` instances from the `decimal.js` library.

**Correct usage:**
```typescript
// SRD-NORM: Currency arithmetic using Prisma's Decimal
import { Prisma } from "@prisma/client"

const vendorPrice    = new Prisma.Decimal("350.00")
const commissionRate = new Prisma.Decimal("0.05")
const listingPrice   = vendorPrice.div(Prisma.Decimal.sub(1, commissionRate))
// Result: Decimal("368.421...") — no floating-point error

const listingPriceRounded = listingPrice.toDecimalPlaces(2) // Decimal("368.42")
```

**Prohibited:**
```typescript
// PROHIBITED — floating-point arithmetic on currency
const listingPrice = 350 / (1 - 0.05) // → 368.42105263157896 (float imprecision)
```

## <span style="color:#D1148A;">3.4 GIN Index Strategy for Full-Text Search</span>

GIN (Generalised Inverted Index) indexes on PostgreSQL `tsvector` expressions enable sub-millisecond full-text search on product titles and descriptions. These MUST be added via a raw SQL migration — Prisma's `@@index` directive does not support GIN expressions.

**Migration file: `prisma/migrations/[timestamp]_add_product_fts_gin_index/migration.sql`:**

```sql
-- SRD-NORM: GIN index for product full-text search
-- Enable pg_trgm for trigram fuzzy search (fallback)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search GIN index on product title + description
CREATE INDEX IF NOT EXISTS idx_products_fts
  ON products
  USING gin (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  );

-- Trigram index on title for partial/fuzzy match (e.g. "samsu" → "samsung")
CREATE INDEX IF NOT EXISTS idx_products_title_trgm
  ON products
  USING gin (title gin_trgm_ops);

-- Partial index: only ACTIVE products need to be searchable
-- (Filtered index reduces index size significantly)
CREATE INDEX IF NOT EXISTS idx_products_active
  ON products (status, category, created_at DESC)
  WHERE status = 'ACTIVE';
```

**Full-text search query pattern:**

```typescript
// lib/search.ts  // SRD-NORM
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

interface SearchParams {
  query:      string
  category?:  string
  condition?: string
  minPrice?:  number
  maxPrice?:  number
  campus?:    string
  page?:      number
  pageSize?:  number
}

export async function searchProducts(params: SearchParams) {
  const { query, category, condition, minPrice, maxPrice, campus, page = 1, pageSize = 20 } = params
  const offset = (page - 1) * pageSize

  // Use raw query for GIN full-text search — Prisma ORM cannot express tsvector queries
  const results = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
    SELECT
      p.id,
      ts_rank(
        to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,'')),
        plainto_tsquery('english', ${query})
      ) AS rank
    FROM products p
    JOIN seller_profiles sp ON sp.id = p.seller_id
    WHERE
      p.status = 'ACTIVE'
      AND (
        to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,''))
        @@ plainto_tsquery('english', ${query})
      )
      ${category  ? Prisma.sql`AND p.category = ${category}::\"ProductCategory\"`  : Prisma.empty}
      ${condition ? Prisma.sql`AND p.condition = ${condition}::\"ProductCondition\"` : Prisma.empty}
      ${minPrice  ? Prisma.sql`AND p.listing_price >= ${minPrice}` : Prisma.empty}
      ${maxPrice  ? Prisma.sql`AND p.listing_price <= ${maxPrice}` : Prisma.empty}
      ${campus    ? Prisma.sql`AND sp.campus = ${campus}` : Prisma.empty}
    ORDER BY rank DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `

  // Fetch full product records for the matched IDs
  const ids = results.map((r) => r.id)
  return prisma.product.findMany({
    where:   { id: { in: ids } },
    include: { seller: { select: { handle: true, storeName: true, campus: true, tier: true } } },
    orderBy: { createdAt: "desc" },
  })
}
```

## <span style="color:#D1148A;">3.5 Database Connection Health Check</span>

```typescript
// app/api/health/route.ts  // SRD-NORM
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok", db: "connected" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ status: "error", db: "unreachable" }, { status: 503 })
  }
}
```

---

<br/>

<a name="s4"></a>

# <span style="color:#5D1A89;">4. Security & IAM Infrastructure</span>

## <span style="color:#D1148A;">4.1 AWS IAM Least-Privilege Policy — Application Runtime</span>

The application server (Vercel serverless functions) authenticates to AWS using an **IAM User** with no AWS Console access. Credentials are stored exclusively as Vercel environment secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

> <span style="color:#FF0000;font-weight:700;">MANDATE:</span> The IAM user MUST have no permissions beyond those specified below. No `s3:*` wildcard. No access to RDS, EC2, IAM, or any other AWS service.

**IAM Policy Document — `ushop-app-server-policy`:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ProductImagesFullAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ushop-product-images",
        "arn:aws:s3:::ushop-product-images/*"
      ],
      "Condition": {
        "StringEquals": {
          "s3:RequestObjectTag/source": "ushop-app"
        }
      }
    },
    {
      "Sid": "KYCDocumentsWrite",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::ushop-kyc-documents/kyc/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    },
    {
      "Sid": "KYCDocumentsPresignedRead",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::ushop-kyc-documents/kyc/*"
    },
    {
      "Sid": "KYCDocumentsDelete",
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ushop-kyc-documents/kyc/*"
    },
    {
      "Sid": "KYCBucketList",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::ushop-kyc-documents",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["kyc/*"]
        }
      }
    }
  ]
}
```

**Key constraints enforced by this policy:**
- `ushop-product-images`: Full CRUD but only on the specific bucket. No access to `ushop-kyc-documents` via this statement.
- `ushop-kyc-documents`: Write (`PutObject`) requires server-side encryption header. Read (`GetObject`) is scoped to `kyc/*` prefix only, enabling presigned URL generation.
- No `s3:*`, no `iam:*`, no `rds:*`. The application server cannot escalate privileges.

## <span style="color:#D1148A;">4.2 S3 Bucket Configurations</span>

### `ushop-product-images` — Public Read

**S3 Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid":       "AllowPublicRead",
      "Effect":    "Allow",
      "Principal": "*",
      "Action":    "s3:GetObject",
      "Resource":  "arn:aws:s3:::ushop-product-images/*"
    }
  ]
}
```

**Bucket settings:**
- Block Public Access: `BlockPublicAcls: false`, `BlockPublicPolicy: false`, `IgnorePublicAcls: false`, `RestrictPublicBuckets: false`
- Versioning: Disabled (not needed for ephemeral product images)
- CORS: Configured to allow PUT from `https://ushopgh.com`

**CORS configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["https://ushopgh.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### `ushop-kyc-documents` — Strictly Private

**Bucket settings:**
- Block Public Access: ALL FOUR settings set to `true` — enforced at both bucket and account level
- Versioning: Enabled (provides recovery if document accidentally deleted)
- Server-Side Encryption: `AES256` (SSE-S3) enabled as default encryption
- No bucket policy granting public access — none. Ever.

> <span style="color:#FF0000;font-weight:700;">SECURITY RULE:</span> If a presigned URL for `ushop-kyc-documents` is accidentally shared or scraped, it expires in ≤ 900 seconds. The bucket policy ensures no permanent public access path exists.

## <span style="color:#D1148A;">4.3 S3 Presigned URL Generation — 15-Minute TTL</span>

```typescript
// lib/s3.ts  // SRD-NORM
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import * as Sentry from "@sentry/nextjs"

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const PRODUCT_BUCKET = process.env.S3_PRODUCT_BUCKET!   // "ushop-product-images"
const KYC_BUCKET     = process.env.S3_KYC_BUCKET!       // "ushop-kyc-documents"
const KYC_TTL_SECS   = 900                               // 15 minutes — STRICT

/**
 * Generate a 15-minute presigned GET URL for a private KYC document.
 * MUST only be called from admin-role-protected Route Handlers.
 * Every call MUST be logged to kyc_access_logs.
 */
export async function generateKYCPresignedUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket:                        KYC_BUCKET,
    Key:                           s3Key,
    ResponseContentDisposition:    "inline",
    ResponseContentType:           "image/jpeg",
  })
  try {
    return await getSignedUrl(s3, command, { expiresIn: KYC_TTL_SECS })
  } catch (error) {
    Sentry.captureException(error, {
      tags:  { service: "s3", operation: "generatePresignedUrl" },
      extra: { s3Key },
    })
    throw error
  }
}

/**
 * Batch-delete all S3 objects for a product being soft-deleted.
 * Called asynchronously — NEVER blocks the API response.
 */
export async function deleteProductImages(imageS3Keys: string[]): Promise<void> {
  if (imageS3Keys.length === 0) return

  const command = new DeleteObjectsCommand({
    Bucket: PRODUCT_BUCKET,
    Delete: {
      Objects: imageS3Keys.map((Key) => ({ Key })),
      Quiet:   true,
    },
  })
  try {
    const result = await s3.send(command)
    if (result.Errors && result.Errors.length > 0) {
      Sentry.captureEvent({
        message: "Partial S3 product image deletion failure",
        level:   "warning",
        extra:   { errors: result.Errors },
      })
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags:  { service: "s3", operation: "deleteProductImages" },
      extra: { imageS3Keys },
    })
    throw error
  }
}
```

**Admin presigned URL Route Handler:**

```typescript
// app/api/kyc/presigned-url/route.ts  // SRD-NORM
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { generateKYCPresignedUrl } from "@/lib/s3"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  // 1. Enforce admin-only access
  const { user } = await requireRole(request, "admin").catch(() => {
    throw new Response("Forbidden", { status: 403 })
  })

  const { s3Key } = await request.json()
  if (!s3Key || typeof s3Key !== "string") {
    return NextResponse.json({ error: "s3Key required" }, { status: 400 })
  }

  // 2. Validate key belongs to KYC bucket prefix (prevent path traversal)
  if (!s3Key.startsWith("kyc/")) {
    return NextResponse.json({ error: "Invalid key prefix" }, { status: 400 })
  }

  // 3. Generate presigned URL
  const url = await generateKYCPresignedUrl(s3Key)

  // 4. Log every access — mandatory audit trail
  await prisma.kycAccessLog.create({
    data: {
      adminUserId: user.id,
      s3ObjectKey: s3Key,
      ipAddress:   request.headers.get("x-forwarded-for") ?? undefined,
    },
  })

  return NextResponse.json({ url, expiresInSeconds: 900 }, { status: 200 })
}
```

### <span style="color:#D1148A;">4.3.1 Admin KYC Queue — Lazy-Load Presigned URLs (v1.1 UX Mandate)</span>

> <span style="color:#FF0000;font-weight:700;">v1.1 PATCH — Admin KYC Performance:</span> Pre-fetching S3 presigned URLs for every document in the Admin KYC queue on initial page render will generate N × M API calls (N sellers × M documents per seller), severely degrading dashboard load times and creating unnecessary S3 presigned URL traffic.

**MANDATE:** The Admin KYC Queue UI **MUST NOT** pre-fetch presigned URLs on render. Documents MUST remain hidden/unloaded by default. The client MUST only call `POST /api/kyc/presigned-url` asynchronously when the Admin explicitly clicks a "View Document" button.

**Client-side implementation pattern:**

```typescript
// components/admin/kyc-document-viewer.tsx  // SRD-NORM (v1.1)
"use client"

import { useState } from "react"

interface KycDocumentViewerProps {
  s3Key:     string
  label:     string   // e.g. "Student ID", "Ghana Card (Front)"
}

export function KycDocumentViewer({ s3Key, label }: KycDocumentViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleViewDocument() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/kyc/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key }),
      })
      if (!res.ok) throw new Error(`Failed to fetch presigned URL (${res.status})`)
      const { url } = await res.json()
      setImageUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p>{label}</p>
      {!imageUrl ? (
        <button onClick={handleViewDocument} disabled={loading}>
          {loading ? "Loading…" : "View Document"}
        </button>
      ) : (
        <img
          src={imageUrl}
          alt={label}
          style={{ maxWidth: "100%", borderRadius: 8 }}
          onError={() => setError("Image failed to load — URL may have expired")}
        />
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}
```

**KYC Queue page usage:**
```typescript
// In the Admin KYC review page — for each seller's documents:
{seller.kycDocKeys.map((key: string, i: number) => (
  <KycDocumentViewer
    key={key}
    s3Key={key}
    label={`Document ${i + 1}`}
  />
))}
// ❌ PROHIBITED: Fetching presigned URLs in getServerSideProps / Server Component
//    for all documents upfront. This would block page render and generate
//    N×M S3 presigned URL calls.
```

---

<br/>

<a name="s5"></a>

# <span style="color:#5D1A89;">5. API Performance & Error Observability</span>

## <span style="color:#D1148A;">5.1 Paystack Webhook Handler</span>

> <span style="color:#FF0000;font-weight:700;">MANDATE:</span> The raw request body MUST be read as text before JSON parsing. Any modification to the body string (whitespace, encoding) will invalidate the HMAC signature. Use `request.text()`, NOT `request.json()`.

```typescript
// app/api/webhooks/paystack/route.ts  // SRD-NORM
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"
import { processPaystackChargeSuccess } from "@/lib/orders/payment"

// ── 1. Signature Verification ─────────────────────────────────────
function verifyPaystackSignature(rawBody: string, signature: string): boolean {
  const expectedHash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody, "utf8")
    .digest("hex")

  // MUST use timingSafeEqual to prevent timing-based side-channel attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(signature,    "hex")
    )
  } catch {
    // Buffer lengths differ — invalid signature
    return false
  }
}

// ── 2. Webhook Route Handler ───────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Read raw body (MUST be text — not json())
  const rawBody  = await request.text()
  const signature = request.headers.get("x-paystack-signature") ?? ""

  // Step 2: Verify HMAC-SHA512 signature
  if (!signature || !verifyPaystackSignature(rawBody, signature)) {
    Sentry.captureEvent({
      message: "Paystack webhook signature verification failed",
      level:   "warning",
      extra:   { signature: signature.slice(0, 16) + "..." },
    })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Step 3: Parse verified payload
  let event: PaystackWebhookEvent
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 })
  }

  const reference = event.data?.reference

  // Step 4: Idempotency check — prevent double-processing
  if (reference) {
    const existing = await prisma.webhookEvent.findUnique({
      where: { paystackRef: reference },
    })
    if (existing?.processed) {
      // Already processed — return 200 immediately (Paystack will stop retrying)
      return NextResponse.json({ status: "already_processed" }, { status: 200 })
    }
  }

  // Step 5: Record webhook event atomically before processing
  // The unique constraint on paystackRef prevents race conditions
  // from concurrent webhook deliveries of the same event
  let webhookRecord
  try {
    webhookRecord = await prisma.webhookEvent.create({
      data: {
        paystackRef: reference ?? crypto.randomUUID(),
        event:       event.event,
        processed:   false,
        payload:     event as object,
      },
    })
  } catch (error: unknown) {
    // Unique constraint violation = concurrent duplicate delivery
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ status: "already_processing" }, { status: 200 })
    }
    throw error
  }

  // Step 6: Process event by type
  try {
    switch (event.event) {
      case "charge.success":
        await processPaystackChargeSuccess(event.data)
        break
      default:
        // Log unhandled event types but don't error
        console.info(`Unhandled Paystack event: ${event.event}`)
    }

    // Step 7: Mark as processed
    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data:  { processed: true },
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags:  { service: "webhook", event: event.event },
      extra: { reference, webhookId: webhookRecord.id },
    })
    // Return 200 to prevent Paystack infinite retries — failure logged in Sentry
    return NextResponse.json({ status: "processing_error_logged" }, { status: 200 })
  }

  return NextResponse.json({ status: "ok" }, { status: 200 })
}

interface PaystackWebhookEvent {
  event: string
  data: {
    reference:    string
    amount:       number   // In kobo (GHS pesewas × 100)
    status:       string
    customer:     { email: string }
    metadata?:    Record<string, unknown>
  }
}
```

## <span style="color:#D1148A;">5.2 Idempotency Mechanism — Double-Processing Prevention</span>

The `WebhookEvent` table provides a two-layer idempotency guarantee:

| Layer | Mechanism | Protection Against |
|---|---|---|
| **Layer 1: DB Unique Constraint** | `@unique` on `WebhookEvent.paystackRef` | Race condition: two concurrent webhook deliveries of the same event. The second `CREATE` throws `P2002` and is rejected. |
| **Layer 2: Processed Flag Check** | `WHERE paystackRef = ref AND processed = true` | Retry after success: Paystack re-delivers an event that was already handled. Caught before any DB writes. |

```prisma
// Unique constraint enforces Layer 1 at the DB level
model WebhookEvent {
  paystackRef String @unique  // ← DB-level idempotency key
  // ...
}
```

```typescript
// lib/orders/payment.ts  // SRD-NORM
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { computeOrderPricing } from "@/lib/pricing"

export async function processPaystackChargeSuccess(
  data: { reference: string; amount: number; metadata?: Record<string, unknown> }
): Promise<void> {
  const { reference, metadata } = data

  // Metadata set during Paystack Inline initialisation
  const productId  = metadata?.productId as string
  const buyerId    = metadata?.buyerId   as string
  const deliveryFee = new Prisma.Decimal(String(metadata?.deliveryFee ?? "0"))

  if (!productId || !buyerId) throw new Error("Missing metadata in Paystack charge")

  // Prevent creating duplicate orders for same Paystack reference
  const existingOrder = await prisma.order.findUnique({
    where: { paystackReference: reference },
  })
  if (existingOrder) return  // Idempotent

  // Fetch product and seller for pricing snapshot
  const product = await prisma.product.findUniqueOrThrow({
    where:   { id: productId },
    include: { seller: { select: { commissionRate: true } } },
  })

  const pricing = computeOrderPricing({
    vendorPrice:    product.vendorPrice,
    commissionRate: product.seller.commissionRate,
    deliveryFee,
  })

  const orderReference = `USH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`

  await prisma.order.create({
    data: {
      reference,
      buyerId,
      productId,
      paystackReference: reference,
      paymentMethod: "MOBILE_MONEY",  // Determined from Paystack channel
      status:        "PAID",
      paidAt:        new Date(),
      ...pricing,
    },
  })
}
```

## <span style="color:#D1148A;">5.3 Sentry Integration</span>

**Installation:**
```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**`sentry.server.config.ts`:**

> <span style="color:#FF0000;font-weight:700;">v1.1 PATCH — Sentry Quota Protection:</span> Sentry's free tier provides **5,000 errors/month**. Expected `P2002` (Unique Constraint Violation) errors from concurrent Paystack webhooks are a known, handled race condition (§5.2) — NOT bugs. Without filtering, a traffic spike generating concurrent duplicate webhooks will exhaust the Sentry quota within hours. The `beforeSend` hook MUST explicitly drop these events.

```typescript
// sentry.server.config.ts  // SRD-NORM (v1.1 — with P2002 quota protection)
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn:               process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:       process.env.NODE_ENV,
  release:           process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate:  process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Capture 10% of production transactions for performance monitoring
  profilesSampleRate: 0.1,
  beforeSend(event, hint) {
    // ── 1. Redact sensitive fields before sending to Sentry ────────
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>
      if (data.password)     data.password = "[REDACTED]"
      if (data.otpHash)      data.otpHash  = "[REDACTED]"
    }

    // ── 2. Drop P2002 (Unique Constraint) errors from webhook route ─
    // These are EXPECTED race conditions from concurrent Paystack
    // webhook deliveries. The duplicate is safely rejected by the
    // DB unique constraint on WebhookEvent.paystackRef (§5.2).
    // Sending these to Sentry would rapidly drain the free quota.
    const error = hint?.originalException as { code?: string } | undefined
    if (
      error?.code === "P2002" &&
      event.request?.url?.includes("/api/webhooks/paystack")
    ) {
      // Return null = drop the event, do not send to Sentry
      return null
    }

    return event
  },
})
```

> **Rationale:** The `P2002` error code is Prisma's identifier for unique constraint violations. When two concurrent Paystack webhooks for the same `reference` hit the `WebhookEvent.create()` call simultaneously, the second will throw `P2002`. This is caught and handled gracefully in the webhook handler (returns `200 { status: "already_processing" }`). The `beforeSend` filter ensures this expected error never consumes a Sentry quota slot. All other `P2002` errors from non-webhook routes will still be reported.

**`sentry.client.config.ts`:**
```typescript
// sentry.client.config.ts  // SRD-NORM
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn:              process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:      process.env.NODE_ENV,
  tracesSampleRate: 0.05,  // Low sample rate client-side
  replaysOnErrorSampleRate: 1.0,   // Full session replay on errors
  replaysSessionSampleRate: 0.01,  // 1% of all sessions
  integrations: [Sentry.replayIntegration()],
})
```

**Mandatory Sentry capture points:**

| Event | Severity | Trigger |
|---|---|---|
| OTP max attempts exceeded | `warning` | `otpAttempts >= 5` on a single order |
| S3 batch delete failure | `error` | `deleteProductImages()` throws after 3 retries |
| Paystack signature mismatch | `warning` | `verifyPaystackSignature()` returns false |
| State machine illegal transition | `error` | `assertValidTransition()` throws `InvalidStateTransitionError` |
| KYC presigned URL generation failure | `error` | `generateKYCPresignedUrl()` throws |
| RDS connection failure | `fatal` | `prisma.$queryRaw\`SELECT 1\`` throws |
| Better Auth session lookup failure | `warning` | `auth.api.getSession()` throws unexpectedly |

```typescript
// Example Sentry capture — OTP lockout  // SRD-REF
Sentry.withScope((scope) => {
  scope.setTag("subsystem",   "otp")
  scope.setTag("orderId",     orderId)
  scope.setLevel("warning")
  scope.setExtra("riderId",   riderId)
  scope.setExtra("attempts",  order.otpAttempts + 1)
  Sentry.captureMessage("OTP verification max attempts exceeded — admin intervention required")
})
```

---

<br/>

<a name="s6"></a>

# <span style="color:#5D1A89;">6. Logistics State Machine</span>

## <span style="color:#D1148A;">6.1 State Transition Table</span>

| From State | Valid `to` States | Actor | Side Effects |
|---|---|---|---|
| `PENDING_COD` | `PROCESSING`, `CANCELLED` | SELLER, ADMIN | — |
| `PAID` | `PROCESSING`, `DISPUTED` | SELLER | — |
| `PROCESSING` | `READY_FOR_PICKUP`, `DISPUTED` | SELLER | `processedAt = now()` |
| `READY_FOR_PICKUP` | `IN_TRANSIT`, `DISPUTED` | ADMIN | `readyAt = now()` |
| `IN_TRANSIT` | `DELIVERED`, `DISPUTED` | SYSTEM (OTP match) | `inTransitAt = now()`, OTP generated + emailed |
| `DELIVERED` | `COMPLETED`, `DISPUTED` | ADMIN | `deliveredAt = now()`, OTP nullified |
| `COMPLETED` | _(terminal)_ | — | `completedAt = now()`, payout triggered |
| `DISPUTED` | `COMPLETED`, `CANCELLED` | ADMIN | `disputedAt = now()` |
| `CANCELLED` | _(terminal)_ | — | — |

> All transitions not listed above are **illegal** and MUST return `HTTP 422 Unprocessable Entity`.

## <span style="color:#D1148A;">6.2 State Machine Implementation</span>

```typescript
// lib/state-machine.ts  // SRD-NORM
import { OrderStatus } from "@prisma/client"

// Immutable transition map — source of truth for all state changes
const VALID_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING_COD:       ["PROCESSING",        "CANCELLED"]  as const,
  PAID:              ["PROCESSING",        "DISPUTED"]   as const,
  PROCESSING:        ["READY_FOR_PICKUP",  "DISPUTED"]   as const,
  READY_FOR_PICKUP:  ["IN_TRANSIT",        "DISPUTED"]   as const,
  IN_TRANSIT:        ["DELIVERED",         "DISPUTED"]   as const,
  DELIVERED:         ["COMPLETED",         "DISPUTED"]   as const,
  COMPLETED:         []                                  as const,
  DISPUTED:          ["COMPLETED",         "CANCELLED"]  as const,
  CANCELLED:         []                                  as const,
}

// Roles permitted to trigger each transition
const TRANSITION_ACTORS: Readonly<Record<string, readonly string[]>> = {
  [`PENDING_COD->PROCESSING`]:      ["seller", "admin"],
  [`PAID->PROCESSING`]:             ["seller"],
  [`PROCESSING->READY_FOR_PICKUP`]: ["seller"],
  [`READY_FOR_PICKUP->IN_TRANSIT`]: ["admin"],   // Admin triggers by assigning rider
  [`IN_TRANSIT->DELIVERED`]:        ["system"],  // System triggers on OTP match
  [`DELIVERED->COMPLETED`]:         ["admin"],
  [`PAID->DISPUTED`]:               ["buyer", "admin"],
  [`PROCESSING->DISPUTED`]:         ["buyer", "admin"],
  [`READY_FOR_PICKUP->DISPUTED`]:   ["buyer", "admin"],
  [`IN_TRANSIT->DISPUTED`]:         ["buyer", "admin"],
  [`DELIVERED->DISPUTED`]:          ["buyer", "admin"],
  [`DISPUTED->COMPLETED`]:          ["admin"],
  [`DISPUTED->CANCELLED`]:          ["admin"],
  [`PENDING_COD->CANCELLED`]:       ["admin"],
}

export class InvalidStateTransitionError extends Error {
  public readonly statusCode = 422
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Illegal state transition: ${from} → ${to}`)
    this.name = "InvalidStateTransitionError"
  }
}

export class UnauthorisedTransitionError extends Error {
  public readonly statusCode = 403
  constructor(role: string, from: OrderStatus, to: OrderStatus) {
    super(`Role "${role}" cannot transition order from ${from} → ${to}`)
    this.name = "UnauthorisedTransitionError"
  }
}

/**
 * Validates a proposed state transition and the actor's authorisation.
 * Throws InvalidStateTransitionError (→ 422) or UnauthorisedTransitionError (→ 403).
 */
export function assertValidTransition(
  from: OrderStatus,
  to:   OrderStatus,
  actorRole: string
): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    throw new InvalidStateTransitionError(from, to)
  }

  const permittedActors = TRANSITION_ACTORS[`${from}->${to}`] ?? []
  if (!permittedActors.includes(actorRole)) {
    throw new UnauthorisedTransitionError(actorRole, from, to)
  }
}

/** Returns timestamp field name for a given target state */
export function getTimestampField(to: OrderStatus): string | null {
  const map: Partial<Record<OrderStatus, string>> = {
    PAID:             "paidAt",
    PROCESSING:       "processedAt",
    READY_FOR_PICKUP: "readyAt",
    IN_TRANSIT:       "inTransitAt",
    DELIVERED:        "deliveredAt",
    COMPLETED:        "completedAt",
    DISPUTED:         "disputedAt",
  }
  return map[to] ?? null
}
```

## <span style="color:#D1148A;">6.3 State Transition API Pattern</span>

```typescript
// lib/orders/transition.ts  // SRD-NORM
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { assertValidTransition, getTimestampField } from "@/lib/state-machine"
import * as Sentry from "@sentry/nextjs"

export async function transitionOrderStatus(
  orderId:   string,
  to:        OrderStatus,
  actorRole: string,
  extra?:    Record<string, unknown>
): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })

  // Throws 422 or 403 on invalid/unauthorised transition
  assertValidTransition(order.status, to, actorRole)

  const tsField = getTimestampField(to)

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status:          to,
      ...(tsField ? { [tsField]: new Date() } : {}),
      ...(extra ?? {}),
    },
  })
}
```

**Route Handler error mapping:**
```typescript
// In any Route Handler  // SRD-NORM
import { InvalidStateTransitionError, UnauthorisedTransitionError } from "@/lib/state-machine"

try {
  await transitionOrderStatus(orderId, "PROCESSING", session.user.role)
} catch (error) {
  if (error instanceof InvalidStateTransitionError) {
    return NextResponse.json(
      { error: "INVALID_STATE_TRANSITION", message: error.message },
      { status: 422 }
    )
  }
  if (error instanceof UnauthorisedTransitionError) {
    return NextResponse.json(
      { error: "TRANSITION_FORBIDDEN", message: error.message },
      { status: 403 }
    )
  }
  Sentry.captureException(error)
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
}
```

## <span style="color:#D1148A;">6.4 OTP Generation — Cryptographic Specification</span>

```typescript
// lib/otp.ts  // SRD-NORM
import crypto from "crypto"
import bcrypt from "bcryptjs"
import * as Sentry from "@sentry/nextjs"

/** Salt rounds for bcrypt — 10 provides ~100ms hash time on t3.micro */
const BCRYPT_SALT_ROUNDS = 10

/** OTP TTL in milliseconds (4 hours) */
const OTP_TTL_MS = 4 * 60 * 60 * 1000

/** Max verification attempts before lockout */
export const OTP_MAX_ATTEMPTS = 5

/**
 * Generate a cryptographically random 4-digit delivery OTP.
 *
 * Uses crypto.randomInt(0, 10000) which draws from the OS CSPRNG
 * (equivalent to /dev/urandom on Linux — Vercel Node.js runtime).
 * The raw OTP is hashed with bcrypt before storage.
 * The raw OTP is returned once, to be emailed to the buyer, then discarded.
 */
export async function generateDeliveryOTP(): Promise<{
  raw:       string   // Send to buyer via Resend — NEVER store this
  hash:      string   // Store in DB as order.otpHash
  expiresAt: Date     // Store in DB as order.otpExpiresAt
}> {
  // crypto.randomInt is CSPRNG-backed, uniform distribution over [0, 10000)
  const rawInt = crypto.randomInt(0, 10000)
  const raw    = rawInt.toString().padStart(4, "0")  // e.g. "0042", "9999"

  // Hash with bcrypt — 10 salt rounds (~100ms). NEVER store raw OTP.
  const hash = await bcrypt.hash(raw, BCRYPT_SALT_ROUNDS)

  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  return { raw, hash, expiresAt }
}

/**
 * Verify a rider-submitted OTP against the stored bcrypt hash.
 * Returns a typed result — never throws on mismatch (only on system error).
 */
export async function verifyDeliveryOTP(
  submitted:  string,
  storedHash: string,
  expiresAt:  Date,
  attempts:   number
): Promise<
  | { success: true }
  | { success: false; reason: "OTP_EXPIRED" | "OTP_MISMATCH" | "OTP_LOCKED" }
> {
  // Check lockout FIRST
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, reason: "OTP_LOCKED" }
  }

  // Check expiry
  if (new Date() > expiresAt) {
    return { success: false, reason: "OTP_EXPIRED" }
  }

  // Timing-safe bcrypt comparison (bcryptjs compare is inherently timing-safe)
  const matches = await bcrypt.compare(submitted, storedHash)
  if (!matches) {
    return { success: false, reason: "OTP_MISMATCH" }
  }

  return { success: true }
}
```

## <span style="color:#D1148A;">6.5 OTP Verification Route Handler</span>

```typescript
// app/api/orders/[id]/verify-otp/route.ts  // SRD-NORM
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { verifyDeliveryOTP, OTP_MAX_ATTEMPTS } from "@/lib/otp"
import { transitionOrderStatus } from "@/lib/orders/transition"
import * as Sentry from "@sentry/nextjs"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Only RIDER role may submit OTPs
  const { user } = await requireRole(request, "rider").catch(() => {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }) as { user: { id: string; role: string } }

  const { otp } = await request.json()

  if (typeof otp !== "string" || !/^\d{4}$/.test(otp)) {
    return NextResponse.json({ error: "OTP must be a 4-digit string" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { rider: true },
  })

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  // Ensure this rider is assigned to this order
  if (order.rider?.userId !== user.id) {
    return NextResponse.json({ error: "FORBIDDEN — not your order" }, { status: 403 })
  }

  // Order must be IN_TRANSIT
  if (order.status !== "IN_TRANSIT") {
    return NextResponse.json(
      { error: "INVALID_STATE_TRANSITION", message: `Cannot verify OTP in state ${order.status}` },
      { status: 422 }
    )
  }

  if (!order.otpHash || !order.otpExpiresAt) {
    return NextResponse.json({ error: "No OTP on record for this order" }, { status: 409 })
  }

  const result = await verifyDeliveryOTP(
    otp,
    order.otpHash,
    order.otpExpiresAt,
    order.otpAttempts
  )

  if (result.success) {
    // Transition to DELIVERED — nullify OTP fields atomically
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status:      "IN_TRANSIT",  // transitionOrderStatus will update this
        otpHash:     null,
        otpExpiresAt: null,
        deliveredAt:  new Date(),
      },
    })
    await transitionOrderStatus(order.id, "DELIVERED", "system")

    return NextResponse.json({ success: true, status: "DELIVERED" }, { status: 200 })
  }

  // Increment attempt counter
  const newAttempts = order.otpAttempts + 1
  await prisma.order.update({
    where: { id: order.id },
    data:  { otpAttempts: newAttempts },
  })

  // Fire Sentry alert at lockout threshold
  if (newAttempts >= OTP_MAX_ATTEMPTS) {
    Sentry.withScope((scope) => {
      scope.setTag("subsystem", "otp")
      scope.setTag("orderId",   order.id)
      scope.setLevel("warning")
      scope.setExtra("riderId", user.id)
      scope.setExtra("reason",  result.reason)
      Sentry.captureMessage("OTP verification max attempts exceeded")
    })
  }

  const statusCodeMap = {
    OTP_EXPIRED: 410,
    OTP_MISMATCH: 400,
    OTP_LOCKED:   423,
  } as const

  return NextResponse.json(
    {
      success:          false,
      reason:           result.reason,
      attemptsRemaining: Math.max(0, OTP_MAX_ATTEMPTS - newAttempts),
    },
    { status: statusCodeMap[result.reason] }
  )
}
```

---

<br/>

<a name="s7"></a>

# <span style="color:#5D1A89;">7. S3 Asset Management</span>

## <span style="color:#D1148A;">7.1 Product Image Upload Pipeline</span>

```typescript
// lib/upload.ts  // SRD-NORM
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import sharp from "sharp"
import { randomUUID } from "crypto"

const s3 = new S3Client({ region: process.env.AWS_REGION! })
const PRODUCT_BUCKET = process.env.S3_PRODUCT_BUCKET!

/** Maximum product image file size: 5 MB */
const MAX_BYTES = 5 * 1024 * 1024

/** Target output width for product images */
const TARGET_WIDTH = 1200

/**
 * Process and upload a product image to S3.
 * Resizes to max 1200px wide, converts to WebP for storage efficiency.
 */
export async function uploadProductImage(
  rawBuffer: Buffer,
  originalMime: string,
  sellerId: string
): Promise<string> {
  if (rawBuffer.length > MAX_BYTES) {
    throw new Error("Image exceeds 5MB limit")
  }

  // Resize + convert to WebP using sharp
  const webpBuffer = await sharp(rawBuffer)
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const key = `products/${sellerId}/${randomUUID()}.webp`

  await s3.send(new PutObjectCommand({
    Bucket:      PRODUCT_BUCKET,
    Key:         key,
    Body:        webpBuffer,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }))

  return key
}
```

## <span style="color:#D1148A;">7.2 Async Product Image Deletion (Vercel `waitUntil` Pattern)</span>

> <span style="color:#FF0000;font-weight:700;">v1.1 PATCH — Vercel Execution Freeze Fix:</span> The previous implementation used `setImmediate` for async S3 cleanup. On Vercel, once a serverless function returns its HTTP response, the Lambda execution context is **frozen immediately** — `setImmediate` callbacks are killed mid-execution. This leaves orphaned images in S3 and prevents the hard-delete of the DB record. The fix uses `waitUntil()` from `@vercel/functions`, which explicitly instructs Vercel to keep the Lambda alive until the provided Promise resolves.

Product deletion MUST be a two-phase operation to respect Vercel's 10s function timeout:

1. **Phase 1 (sync, < 50ms):** Soft-delete the product in PostgreSQL. Return 200 to client.
2. **Phase 2 (async via `waitUntil`):** S3 deletion runs **after** the response is sent. The `waitUntil()` API guarantees the Lambda stays alive until the S3 `DeleteObjectsCommand` resolves.

**Installation:**
```bash
pnpm add @vercel/functions
```

```typescript
// app/api/products/[id]/route.ts — DELETE handler  // SRD-NORM (v1.1)
import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { deleteProductImages } from "@/lib/s3"
import * as Sentry from "@sentry/nextjs"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await requireRole(request, "seller", "admin")

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: params.id },
  })

  // Authorisation: sellers may only delete their own products
  if (user.role === "seller") {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    })
    if (product.sellerId !== sellerProfile?.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }
  }

  // Phase 1: Soft-delete in DB (synchronous — immediate)
  const imageKeys = product.imageS3Keys as string[]
  await prisma.product.update({
    where: { id: params.id },
    data:  { status: "DELETED", deletedAt: new Date() },
  })

  // Phase 2: Async S3 cleanup via waitUntil()
  // waitUntil() tells Vercel to keep the Lambda alive AFTER the response
  // is sent, until the provided Promise resolves. This replaces the
  // broken setImmediate pattern that was being frozen mid-execution.
  if (imageKeys.length > 0) {
    waitUntil(
      (async () => {
        let attempts = 0
        while (attempts < 3) {
          try {
            await deleteProductImages(imageKeys)
            // Hard-delete DB record only after S3 is clean
            await prisma.product.delete({ where: { id: params.id } })
            return
          } catch (err) {
            attempts++
            if (attempts >= 3) {
              Sentry.captureException(err, {
                tags:  { service: "s3_cleanup", productId: params.id },
                extra: { imageKeys, attempts },
              })
            }
            await new Promise((r) => setTimeout(r, 1000 * attempts)) // Backoff
          }
        }
      })()
    )
  }

  return NextResponse.json({ success: true, message: "Product deleted" }, { status: 200 })
}
```

> <span style="color:#FF0000;font-weight:700;">MANDATE:</span> `setImmediate` is **PROHIBITED** for any async work in Vercel serverless functions. Use `waitUntil()` from `@vercel/functions` for all fire-and-forget background work that must complete after the HTTP response is sent.

---

<br/>

<a name="s8"></a>

# <span style="color:#5D1A89;">8. Commission & Pricing Engine</span>

## <span style="color:#D1148A;">8.1 Core Computation</span>

```typescript
// lib/pricing.ts  // SRD-NORM
import { Prisma } from "@prisma/client"

interface PricingInput {
  vendorPrice:    Prisma.Decimal
  commissionRate: Prisma.Decimal   // e.g. Decimal("0.05") or Decimal("0.08")
  deliveryFee:    Prisma.Decimal   // e.g. Decimal("30.00") or Decimal("0.00")
}

interface PricingSnapshot {
  vendorPrice:      Prisma.Decimal
  commissionRate:   Prisma.Decimal
  listingPrice:     Prisma.Decimal
  deliveryFee:      Prisma.Decimal
  checkoutPrice:    Prisma.Decimal
  paystackFee:      Prisma.Decimal
  totalCharged:     Prisma.Decimal
  commissionAmount: Prisma.Decimal
  sellerReceivable: Prisma.Decimal
}

const PAYSTACK_RATE    = new Prisma.Decimal("0.0195")  // 1.95%
const PAYSTACK_FLAT    = new Prisma.Decimal("0.50")    // GHS 0.50
const DECIMAL_SCALE    = 2                              // 2 decimal places

/**
 * Compute the full pricing snapshot for an order.
 * All arithmetic uses Prisma.Decimal (backed by decimal.js) — NO float.
 * Rounding: ROUND_HALF_UP (standard commercial rounding).
 */
export function computeOrderPricing(input: PricingInput): PricingSnapshot {
  const { vendorPrice, commissionRate, deliveryFee } = input
  const ONE = new Prisma.Decimal("1")

  // Formula 1: Final Listing Price = Vendor Price / (1 - Commission Rate)
  const listingPrice = vendorPrice
    .div(ONE.minus(commissionRate))
    .toDecimalPlaces(DECIMAL_SCALE, Prisma.Decimal.ROUND_HALF_UP)

  // Formula 2: Checkout Price = Listing Price + Delivery Fee
  const checkoutPrice = listingPrice.plus(deliveryFee)

  // Formula 3: Paystack Fee = (1.95% × Checkout Price) + GHS 0.50
  const paystackFee = checkoutPrice
    .mul(PAYSTACK_RATE)
    .plus(PAYSTACK_FLAT)
    .toDecimalPlaces(DECIMAL_SCALE, Prisma.Decimal.ROUND_HALF_UP)

  // Total = Checkout Price + Paystack Fee
  const totalCharged = checkoutPrice.plus(paystackFee)

  // Platform revenue = Listing Price − Vendor Price
  const commissionAmount = listingPrice.minus(vendorPrice)

  // Seller receives exactly their vendor price
  const sellerReceivable = vendorPrice

  return {
    vendorPrice:      vendorPrice.toDecimalPlaces(DECIMAL_SCALE),
    commissionRate,
    listingPrice,
    deliveryFee:      deliveryFee.toDecimalPlaces(DECIMAL_SCALE),
    checkoutPrice:    checkoutPrice.toDecimalPlaces(DECIMAL_SCALE),
    paystackFee,
    totalCharged:     totalCharged.toDecimalPlaces(DECIMAL_SCALE),
    commissionAmount: commissionAmount.toDecimalPlaces(DECIMAL_SCALE),
    sellerReceivable: sellerReceivable.toDecimalPlaces(DECIMAL_SCALE),
  }
}
```

## <span style="color:#D1148A;">8.2 Worked Example (Runtime Verification)</span>

```typescript
// This should be a passing test in __tests__/pricing.test.ts
const result = computeOrderPricing({
  vendorPrice:    new Prisma.Decimal("350.00"),
  commissionRate: new Prisma.Decimal("0.05"),
  deliveryFee:    new Prisma.Decimal("30.00"),
})

// Expected:
// listingPrice:     368.42  (350 / 0.95 = 368.421... → 368.42)
// checkoutPrice:    398.42  (368.42 + 30.00)
// paystackFee:       8.29   (398.42 * 0.0195 + 0.50 = 8.2892 → 8.29)
// totalCharged:     406.71  (398.42 + 8.29)
// commissionAmount:  18.42  (368.42 - 350.00)
// sellerReceivable: 350.00
```

---

<br/>

<a name="s9"></a>

# <span style="color:#5D1A89;">9. Email & Notification Architecture</span>

## <span style="color:#D1148A;">9.1 Resend Configuration</span>

```bash
pnpm add resend @react-email/components
```

```typescript
// lib/email/index.ts  // SRD-NORM
import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY!)

export const FROM_ADDRESS = "U-Shop <noreply@ushopgh.com>"
```

## <span style="color:#D1148A;">9.2 Email Trigger Matrix</span>

All email sends are **async and non-blocking**. They MUST NOT be awaited inside a critical path (e.g., webhook handler, OTP generation). Use `void sendEmail(...)` or wrap in `setImmediate`.

| Trigger | Recipient | Template | Key Data |
|---|---|---|---|
| Student OTP verification | Seller (`.edu.gh`) | `StudentOTPEmail` | `{ otp: string }` |
| Seller approved | Seller | `SellerApprovedEmail` | `{ storeName, handle }` |
| Seller rejected | Seller | `SellerRejectedEmail` | `{ reason }` |
| New order paid | Seller | `NewOrderEmail` | `{ ref, productTitle, totalCharged }` |
| Order confirmed | Buyer | `OrderReceiptEmail` | `{ ref, listingPrice, deliveryFee, paystackFee, totalCharged }` |
| OTP dispatched | Buyer | `DeliveryOTPEmail` | `{ otp: string, ref }` |
| Order delivered | Buyer | `OrderDeliveredEmail` | `{ ref }` |
| Payout sent | Seller | `PayoutSentEmail` | `{ amount, momoRef }` |

```typescript
// lib/email/send.ts  // SRD-REF
import { resend, FROM_ADDRESS } from "@/lib/email"
import { render } from "@react-email/render"
import * as Sentry from "@sentry/nextjs"

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to:       string
  subject:  string
  template: React.ReactElement
}): Promise<void> {
  try {
    const html = render(template)
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html })
  } catch (error) {
    Sentry.captureException(error, {
      tags:  { service: "resend" },
      extra: { to, subject },
    })
    // Non-fatal: log error, do not throw. Email failure must not break order flow.
  }
}
```

---

<br/>

<a name="s10"></a>

# <span style="color:#5D1A89;">10. Environment Variables & Secrets Specification</span>

All variables marked **`VERCEL SECRET`** MUST be stored in Vercel Environment Secrets (never in `.env` committed to Git). Variables marked `PUBLIC` may be exposed to the browser.

| Variable | Scope | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | Server | ✅ | Prisma Accelerate connection string |
| `DIRECT_DATABASE_URL` | Server (CI only) | ✅ | Direct AWS RDS URL for `prisma migrate deploy` |
| `BETTER_AUTH_SECRET` | Server | ✅ | Min 32-char random secret for session signing |
| `BETTER_AUTH_URL` | Server | ✅ | `https://ushopgh.com` — base URL |
| `AWS_ACCESS_KEY_ID` | Server | ✅ | IAM user access key (least-privilege policy) |
| `AWS_SECRET_ACCESS_KEY` | Server | ✅ | IAM user secret key |
| `AWS_REGION` | Server | ✅ | e.g. `af-south-1` |
| `S3_PRODUCT_BUCKET` | Server | ✅ | `ushop-product-images` |
| `S3_KYC_BUCKET` | Server | ✅ | `ushop-kyc-documents` |
| `PAYSTACK_SECRET_KEY` | Server | ✅ | Paystack secret key (for HMAC + API calls) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | ✅ | Paystack public key (Inline.js) |
| `RESEND_API_KEY` | Server | ✅ | Resend API key |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | ✅ | Sentry DSN (client-side error reporting) |
| `SENTRY_AUTH_TOKEN` | Server (CI) | ✅ | Sentry token for release creation in CI |
| `SENTRY_ORG` | Server (CI) | ✅ | Sentry organisation slug |
| `SENTRY_PROJECT` | Server (CI) | ✅ | Sentry project slug |
| `PRISMA_ACCELERATE_API_KEY` | Server | ✅ | Prisma Accelerate API key |
| `NEXT_PUBLIC_APP_URL` | Public | ✅ | `https://ushopgh.com` |

**`.env.local` (development only — never committed):**
```bash
# .env.local — gitignored  // SRD-REF
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
DIRECT_DATABASE_URL="postgresql://dev_user:dev_pass@localhost:5432/ushop_dev"
BETTER_AUTH_SECRET="dev-secret-min-32-chars-xxxxxxxxx"
BETTER_AUTH_URL="http://localhost:3000"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="af-south-1"
S3_PRODUCT_BUCKET="ushop-product-images-dev"
S3_KYC_BUCKET="ushop-kyc-documents-dev"
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
RESEND_API_KEY="re_..."
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

<br/>

<a name="s11"></a>

# <span style="color:#5D1A89;">11. CI/CD Pipeline Technical Specification</span>

## <span style="color:#D1148A;">11.1 Pipeline Overview</span>

```
Git Push / PR
     │
     ├─► PR Validation Pipeline (blocks merge on failure)
     │         │
     │         ├── pnpm install --frozen-lockfile
     │         ├── tsc --noEmit               (TypeScript type-check)
     │         ├── prisma validate            (schema integrity)
     │         ├── eslint . --max-warnings 0  (zero-warning policy)
     │         └── vitest run --reporter=verbose (unit tests)
     │
     └─► Deploy Pipeline (runs on merge to main)
               │
               ├── PR Validation steps (repeated)
               ├── prisma migrate deploy (against staging RDS via DIRECT_URL)
               ├── Vercel build (triggered via GitHub integration)
               ├── sentry-cli releases new $COMMIT_SHA
               ├── sentry-cli releases set-commits --auto
               └── GET /api/health → assert 200
```

## <span style="color:#D1148A;">11.2 GitHub Actions Workflow</span>

```yaml
# .github/workflows/ci.yml  // SRD-NORM
name: U-Shop CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"
  PNPM_VERSION: "9"

jobs:
  # ── PR Validation ────────────────────────────────────────────────
  validate:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript check
        run: pnpm tsc --noEmit

      - name: Prisma schema validation
        run: pnpm prisma validate

      - name: ESLint (zero warnings)
        run: pnpm eslint . --max-warnings 0

      - name: Unit tests
        run: pnpm vitest run --reporter=verbose
        env:
          DATABASE_URL:      ${{ secrets.TEST_DATABASE_URL }}
          BETTER_AUTH_SECRET: test-secret-min-32-chars-xxxxxx

  # ── Deploy (main only) ───────────────────────────────────────────
  deploy:
    name: Deploy
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with: { version: "${{ env.PNPM_VERSION }}" }

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run migrations (staging DB)
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DIRECT_DATABASE_URL }}

      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG:        ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT:    ${{ secrets.SENTRY_PROJECT }}
        with:
          environment: production

      - name: Smoke test (post-deploy)
        run: |
          sleep 30  # Wait for Vercel deployment to propagate
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ushopgh.com/api/health)
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed with status $STATUS"
            exit 1
          fi
          echo "Health check passed: $STATUS"

  # ── Daily Integrity Check ────────────────────────────────────────
  integrity:
    name: Daily Integrity Check
    runs-on: ubuntu-latest
    schedule:
      - cron: "0 0 * * *"   # 00:00 UTC daily
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: "${{ env.PNPM_VERSION }}" }
      - uses: actions/setup-node@v4
        with: { node-version: "${{ env.NODE_VERSION }}", cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Run integrity checks
        run: pnpm tsx scripts/integrity-check.ts
        env:
          DATABASE_URL:         ${{ secrets.DIRECT_DATABASE_URL }}
          AWS_ACCESS_KEY_ID:    ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION:           ${{ secrets.AWS_REGION }}
          S3_PRODUCT_BUCKET:    ${{ secrets.S3_PRODUCT_BUCKET }}
          RESEND_API_KEY:       ${{ secrets.RESEND_API_KEY }}
          ALERT_EMAIL:          richard@ushopgh.com
```

---

<br/>

<a name="s12"></a>

# <span style="color:#5D1A89;">12. API Contract & Error Code Reference</span>

## <span style="color:#D1148A;">12.1 Standard Response Envelope</span>

All API Route Handlers MUST return responses conforming to this envelope:

```typescript
// types/api.ts  // SRD-NORM

// Success
interface ApiSuccess<T> {
  data:    T
  message?: string
}

// Error
interface ApiError {
  error:   string         // Machine-readable error code (SCREAMING_SNAKE_CASE)
  message: string         // Human-readable description
  details?: unknown       // Optional: validation errors, etc.
}
```

## <span style="color:#D1148A;">12.2 HTTP Status Code Mandate</span>

| Status | Usage |
|---|---|
| `200 OK` | Successful GET, PATCH, or idempotent duplicate webhook |
| `201 Created` | Successful POST that creates a resource |
| `400 Bad Request` | Malformed request body, invalid OTP format, validation failure |
| `401 Unauthorized` | No valid Better Auth session cookie |
| `403 Forbidden` | Session valid but role insufficient |
| `404 Not Found` | Resource does not exist or has been soft-deleted |
| `409 Conflict` | Duplicate resource (e.g., handle already taken) |
| `410 Gone` | OTP expired |
| `422 Unprocessable Entity` | Illegal state machine transition |
| `423 Locked` | OTP locked (max attempts exceeded) |
| `429 Too Many Requests` | Rate limit hit (auth endpoints) |
| `500 Internal Server Error` | Unhandled exception (always logged to Sentry) |
| `503 Service Unavailable` | RDS unreachable (health check failure) |

## <span style="color:#D1148A;">12.3 Machine-Readable Error Codes</span>

| Error Code | Status | Description |
|---|---|---|
| `UNAUTHENTICATED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Role insufficient |
| `NOT_FOUND` | 404 | Resource not found |
| `HANDLE_TAKEN` | 409 | Store handle already in use |
| `INVALID_STATE_TRANSITION` | 422 | Illegal order state change |
| `TRANSITION_FORBIDDEN` | 403 | Actor's role cannot perform this transition |
| `OTP_MISMATCH` | 400 | Submitted OTP does not match |
| `OTP_EXPIRED` | 410 | OTP TTL (4h) exceeded |
| `OTP_LOCKED` | 423 | Max attempts (5) exceeded |
| `NO_OTP_ON_RECORD` | 409 | verify-otp called before assign-rider |
| `INVALID_SIGNATURE` | 401 | Paystack HMAC verification failed |
| `ALREADY_PROCESSED` | 200 | Idempotent webhook already handled |
| `INVALID_DOMAIN` | 400 | `.edu.gh` domain not in approved institution list |
| `MISSING_KYC_DOCUMENTS` | 400 | KYC upload incomplete |
| `SELLER_NOT_APPROVED` | 403 | Seller account still in PENDING state |
| `PRODUCT_NOT_ACTIVE` | 409 | Product is PAUSED, SOLD, or DELETED |
| `CANNOT_BUY_OWN_PRODUCT` | 409 | Buyer and seller are the same user |
| `S3_UPLOAD_FAILED` | 500 | Image upload to S3 failed |
| `INTERNAL_ERROR` | 500 | Unclassified server error (see Sentry) |

---

<br/>

<a name="s13"></a>

# <span style="color:#5D1A89;">13. Non-Functional Technical Targets</span>

| NFR | Target | Measurement Method | Remediation |
|---|---|---|---|
| **API P95 Latency** | < 500ms for non-search endpoints | Sentry Performance transactions | Add `select` field pruning; check for N+1 queries via Prisma query log |
| **Search P95 Latency** | < 800ms (PG full-text with GIN) | Sentry Performance | Ensure GIN index was created; check `EXPLAIN ANALYZE` |
| **Lighthouse Mobile Score** | ≥ 70 | Vercel Analytics + manual audit | Implement `next/image` lazy loading; reduce JS bundle via dynamic imports |
| **LCP (Largest Contentful Paint)** | < 2.5s on 3G | Lighthouse | Move hero images to S3 CDN; preload critical images |
| **Vercel Function Timeout** | < 9.5s (buffer against 10s limit) | Sentry Performance | Move S3 ops to `waitUntil()` from `@vercel/functions` (v1.1); reduce DB joins. **`setImmediate` is PROHIBITED** — Vercel freezes it on response. |
| **DB Connection Count** | ≤ 15 connections at peak (headroom below 87 limit) | AWS RDS CloudWatch `DatabaseConnections` | Confirm Accelerate pooling is active; check for connection leaks |
| **OTP Hash Time** | < 200ms (`bcrypt`, 10 rounds) | Sentry Performance span | 10 rounds on Vercel Node.js is ~100–150ms — acceptable |
| **S3 Upload Latency** | < 3s for a 5MB WebP | Sentry Performance | Use AWS region `af-south-1` (Cape Town — lowest latency from Accra) |
| **Email Delivery (Resend)** | > 95% within 60 seconds | Resend dashboard | Check SPF/DKIM/DMARC on Cloudflare; monitor bounce rate |
| **Uptime SLO** | ≥ 99% | UptimeRobot 5-min checks | PM2-equivalent: Vercel auto-restarts failed functions |
| **Zero Seller Contact Leak** | 0 occurrences | Automated API test: assert `whatsappNumber` absent from buyer responses | Prisma `select` enforcement; integration test suite |

---

<br/>

<a name="s14"></a>

# <span style="color:#5D1A89;">14. Document History</span>

| Version | Date | Author | Changes |
|---|---|---|---|
| **1.1** | **June 9, 2026** | **Richard Nuhu** | **Patch release resolving 4 production bottlenecks: (1) §2.5 — Edge Middleware rewritten to lightweight cookie-presence check; `auth.api.getSession()` removed from Edge Runtime due to Prisma/Node.js API incompatibility. Strict RBAC enforcement moved to §2.6 Server Components/Route Handlers. (2) §7.2 — `setImmediate` replaced with `waitUntil()` from `@vercel/functions` in product DELETE handler; Vercel was freezing Lambda mid-execution after response. (3) §5.3 — Sentry `beforeSend` hook updated to drop P2002 (Unique Constraint) errors from `/api/webhooks/paystack` route, preventing quota exhaustion on free tier (5,000 errors/month). (4) §4.3.1 — Admin KYC Queue UI mandated to lazy-load presigned URLs on "View Document" click only; pre-fetching all URLs on render prohibited due to N×M performance degradation. Stack updated: added `@vercel/functions` dependency.** |
| **1.0** | **June 1, 2026** | **Richard Nuhu** | **Initial release. Derived from PRD v1.3. Covers: Better Auth + Prisma Adapter full spec, RBAC middleware, Prisma Accelerate connection pooling, full Prisma schema with GIN indexes, `Decimal(10,2)` currency enforcement, AWS IAM least-privilege JSON policies, S3 two-bucket architecture, KYC presigned URL flow (15-min TTL), Paystack HMAC-SHA512 webhook verification, idempotency via `WebhookEvent` table, Sentry integration, 7-state machine with `assertValidTransition`, OTP generation via `crypto.randomInt` + `bcrypt` (10 rounds), API error code reference, GitHub Actions CI/CD pipeline, NFR technical targets.** |

---

<br/>

<div align="center">

<p style="color:#94A3B8;font-style:italic;">— End of Document —</p>
<p style="color:#94A3B8;font-style:italic;font-size:0.85em;">U-Shop SRD v1.1 &nbsp;·&nbsp; Author: Richard Nuhu &nbsp;·&nbsp; ushopgh.com &nbsp;·&nbsp; Engineering Reference &nbsp;·&nbsp; Confidential</p>
<br/>
<span style="background:#FF0000;color:#FFFFFF;padding:2px 10px;font-weight:900;border-radius:3px;">U</span>&nbsp;<span style="color:#5D1A89;font-weight:900;">sh</span><span style="color:#D1148A;font-weight:900;">op</span>

</div>
