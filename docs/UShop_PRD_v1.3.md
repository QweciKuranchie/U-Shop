<!-- ============================================================
     U-SHOP — PRODUCT REQUIREMENTS DOCUMENT v1.3
     Author : Richard Nuhu
     Date   : June 2026
     ============================================================ -->

<div align="center">

<br/>

<h1>
  <span style="background:#FF0000; color:#FFFFFF; padding: 4px 14px; font-size:2.4rem; font-weight:900; border-radius:4px;">U</span>&nbsp;<span style="color:#5D1A89; font-size:2.4rem; font-weight:900;">sh</span><span style="color:#D1148A; font-size:2.4rem; font-weight:900;">op</span>
</h1>

<p><a href="https://ushopgh.com" style="color:#D1148A; font-weight:600;">ushopgh.com</a></p>
<p style="color:#5D1A89; font-style:italic;">Technology Equipment Marketplace — Ghana</p>

<br/>

| Field | Detail |
|---|---|
| **Document** | Product Requirements Document (PRD) |
| **Version** | **1.3 — UPDATED** |
| **Author** | Richard Nuhu |
| **Project Start** | June 1, 2026 |
| **Target Launch** | **August 31, 2026** |
| **Dev Cycle** | 3-Month MVP Sprint (Strict) |
| **Supersedes** | PRD v1.2 (June 2026) |
| **Status** | In Review |
| **Confidentiality** | Internal Only |

<br/>

</div>

---

<br/>

# <span style="color:#5D1A89">Table of Contents</span>

| § | Section |
|---|---|
| 0 | [Strategic Pivot Summary (v1.2 → v1.3)](#0) |
| 1 | [Executive Summary](#1) |
| 2 | [Problem Statement](#2) |
| 3 | [Project Timeline & Milestones](#3) |
| 4 | [Goals & Success Metrics](#4) |
| 5 | [User Personas](#5) |
| 6 | [Tech Stack & DevOps](#6) |
| 7 | [Authentication Architecture — Better Auth](#7) |
| 8 | [Seller Verification Tiers](#8) |
| 9 | [Commission & Pricing Engine](#9) |
| 10 | [Order Logistics State Machine](#10) |
| 11 | [Role-Based Access Control & Rider Dashboard](#11) |
| 12 | [Communication Policy — Zero Buyer-Seller Contact](#12) |
| 13 | [V1 Feature Scope](#13) |
| 14 | [S3 Security & Asset Management](#14) |
| 15 | [Core User Stories & Acceptance Criteria](#15) |
| 16 | [Payment & Payout Flow](#16) |
| 17 | [Out of Scope for V1](#17) |
| 18 | [Monetisation Model](#18) |
| 19 | [Non-Functional Requirements](#19) |
| 20 | [Assumptions & Constraints](#20) |
| 21 | [Risk Register](#21) |
| 22 | [Glossary](#22) |
| 23 | [Document History](#23) |

---

<br/>

<a name="0"></a>

# <span style="color:#5D1A89">0. Strategic Pivot Summary — v1.2 → v1.3</span>

> Every deliberate change from PRD v1.1 → v1.2 → v1.3 is recorded here. All downstream sections have been rewritten to reflect these pivots.

| # | Area | v1.2 Baseline | <span style="color:#FF0000">v1.3 Decision</span> | Rationale |
|---|---|---|---|---|
| P-01 | **Authentication Framework** | Custom JWT (Access Token in memory + Refresh Token in HttpOnly cookie). Manual token rotation, custom password hashing. | **`better-auth` + `@better-auth/prisma-adapter`.** Better Auth manages all session creation, storage, password hashing, and cookie security. Custom JWT stack removed entirely. | Better Auth is a battle-tested, TypeScript-native auth library. Eliminates a large surface area of bespoke security code. Prisma adapter stores sessions in the same PostgreSQL DB. Next.js Middleware reads Better Auth session for route protection. |
| P-02 | **Escrow-First Communication (Chapter 12)** | Seller WhatsApp revealed to buyer after PAID. In-app per-order messaging thread. Rider phone revealed at IN_TRANSIT. | **Chapter 12 removed entirely.** Zero buyer-seller communication. No in-app messaging. Buyer communicates only with Rider (phone/WhatsApp, IN_TRANSIT only) or Admin (disputes). Sellers communicate only with Admin. | Simplifies the platform significantly. Eliminates the in-app messaging feature (saves ~2 weeks of dev time). Reduces dispute surface. Riders and Admin mediate all logistics communication. |
| P-03 | **In-App Order Messaging** | P1 feature: threaded per-order messages between buyer and seller. | **Removed from all sections.** Feature F-22 ("In-App Order Messaging") deleted from feature scope. No related API routes, DB tables, or UI components. | Consistent with P-02. Zero communication policy makes messaging redundant. Rider phone + Admin contact are sufficient channels. |
| P-04 | **RBAC Implementation** | Manual JWT `role` claim checked in Next.js Middleware. Custom middleware logic. | **Better Auth's built-in RBAC plugin handles role management.** Next.js Middleware calls `auth.api.getSession()` to read session and verify role. No custom JWT parsing. | Better Auth's session object includes `user.role` natively. Cleaner, less error-prone Middleware. Role data lives in the DB, not encoded in a token. |
| P-05 | **All v1.2 core systems** | 7-state logistics machine, Managed Dispatch, Rider Dashboard, OTP, 3-tier KYC (4 institutions), Gross-Up pricing, GitHub Actions, Sentry, Vercel/AWS. | **Fully retained without change.** | These systems are correct and complete. No regressions introduced. |

---

<br/>

<a name="1"></a>

# <span style="color:#5D1A89">1. Executive Summary</span>

<span style="color:#D1148A; font-weight:600;">U-Shop</span> (`ushopgh.com`) is a niche, peer-to-peer (C2C) e-commerce marketplace exclusively for technology equipment, purpose-built for Ghana's university ecosystem. It is designed and maintained as a solo engineering project by **Richard Nuhu**, serving simultaneously as a sustainable income source and a reference-grade full-stack portfolio system.

Each seller operates a branded, shareable storefront at `ushopgh.com/store/{handle}`. The platform is a unified **Next.js 15 (App Router)** full-stack application, deployed on **Vercel**, with **PostgreSQL** and **S3** on **AWS**. Authentication and session management are powered by **`better-auth`** connected to the same PostgreSQL database via the **`@better-auth/prisma-adapter`**.

Revenue comes from a tiered gross-up commission model — **5% for verified student sellers**, **8% for business and individual sellers** — embedded transparently into buyer-facing listing prices. Version 1.3 formalises a **Zero Buyer-Seller Communication Policy**: buyers never have access to seller contact information at any point. All logistics coordination flows through the Managed Dispatch rider.

> **Vision:** To be the most trusted marketplace for student and youth-led tech commerce in Ghana — with end-to-end managed logistics, cryptographic delivery verification, and industrial-grade engineering.

> **Timeline:** Project Start: June 1, 2026 | V1 MVP Launch: August 31, 2026 | Author: Richard Nuhu

---

<br/>

<a name="2"></a>

# <span style="color:#5D1A89">2. Problem Statement</span>

### <span style="color:#D1148A">Problem 1 — No Trusted, Niche Channel</span>
General Ghanaian marketplaces (Tonaton, Jiji) are unverified, cluttered, and offer zero curation for tech equipment. Buyers cannot assess seller legitimacy or transact with any form of protection.

### <span style="color:#D1148A">Problem 2 — Informal Sales Are Fragile and Risky</span>
Student-to-student tech sales happen via WhatsApp and Facebook groups — ephemeral, unverified, with no transaction structure. Buyers and sellers meet strangers with cash, creating safety risks and enabling fraud.

### <span style="color:#D1148A">Problem 3 — No Professional Seller Identity</span>
Skilled student resellers have no structured way to build a reputation, showcase inventory, or accept payment safely. A persistent, verified storefront directly solves this.

### <span style="color:#D1148A">Problem 4 — Last-Mile Delivery is Uncontrolled</span>
Even on platforms with payment support, delivery is peer-arranged. This creates a critical trust gap: buyers have no guarantee of delivery; sellers have no proof of receipt. U-Shop's Managed Dispatch with OTP-verified delivery closes this gap entirely — and the Zero Communication Policy ensures that all logistics coordination flows cleanly through the rider.

---

<br/>

<a name="3"></a>

# <span style="color:#5D1A89">3. Project Timeline & Milestones</span>

> ⚠️ **Constraint:** Strict 3-month solo development sprint. June 1 – August 31, 2026. No scope creep after Phase 1 sign-off.

| Phase | Period | Core Deliverables | Exit Gate |
|---|---|---|---|
| **Phase 0** Setup & Architecture | Jun 1–14 (2 weeks) | Monorepo scaffold (Next.js 15 + TypeScript). Prisma schema v1 with Better Auth tables. AWS RDS provisioned. S3 buckets (public + private KYC). Vercel project linked to GitHub. GitHub Actions pipeline. Sentry project. Resend domain DNS (SPF/DKIM/DMARC). Paystack test keys. `better-auth` + `@better-auth/prisma-adapter` configured. | "Hello World" deployed at ushopgh.com. DB connection verified. Better Auth `/api/auth/[...all]` route responding. GitHub Actions green. Sentry test error captured. |
| **Phase 1** Auth, Sellers & RBAC | Jun 15–Jul 5 (3 weeks) | Better Auth full setup: email/password, RBAC plugin, Prisma sessions. Next.js Middleware route protection (admin/seller/rider groups). Tiered seller registration (Student OTP, Business, Individual). Admin KYC queue with S3 presigned URL viewer. Storefront public page. Product CRUD + S3 image upload + S3 cleanup-on-delete. | Seller registers (student OTP), uploads ID, gets approved, publishes a product. Rider login at `/rider` returns 200. Admin login at `/admin` returns 200. |
| **Phase 2** Buyer Flow & Payments | Jul 6–26 (3 weeks) | Product search (PG full-text) + filters. Product detail page (gross-up price). Paystack Inline checkout. Explicit 3-line checkout breakdown. Paystack webhook (idempotent). Order creation with commission snapshot. Zero-contact enforcement on all seller-related API responses. | Full purchase: buyer finds product → checkout → Paystack → order PAID → Resend emails triggered. Seller contact fields absent from all public API responses. |
| **Phase 3** Managed Dispatch & OTP | Jul 27–Aug 10 (2 weeks) | 7-state order machine. Seller order dashboard (PROCESSING/READY actions). Admin assigns rider (IN_TRANSIT trigger). OTP generation (crypto.randomInt, bcrypt, 4h TTL, Resend). Rider Dashboard `/rider` (mobile-optimised, RIDER-protected). OTP submission + verification. DELIVERED state + OTP nullification. | Full dispatch loop: seller marks ready → admin assigns rider → OTP emailed to buyer → rider submits OTP → DELIVERED. |
| **Phase 4** QA, Hardening & Launch | Aug 11–31 (3 weeks) | Admin dashboard (GMV, revenue, payout queue, rider mgmt). Seller ratings + reviews. Resend email templates (all triggers). PWA manifest + service worker. OWASP Top 10 audit. Lighthouse ≥ 70 mobile. Sentry alerts tuned. UptimeRobot configured. Seed 10 beta sellers across GCTU, UG, UPSA, ATU. | Platform live at ushopgh.com. 10 verified sellers with listings. All P0 and P1 features passing QA. |

---

<br/>

<a name="4"></a>

# <span style="color:#5D1A89">4. Goals & Success Metrics</span>

## <span style="color:#D1148A">4.1 Business Goals — V1 Targets (Month 3 Post-Launch, Nov 2026)</span>

| ID | Goal | Metric | Target |
|---|---|---|---|
| G-01 | Establish seller supply | Verified active sellers | 50 sellers (min. 10 at launch) |
| G-02 | Drive buyer demand | Registered buyers | 500 users |
| G-03 | Generate GMV | Gross Merchandise Volume / month | GHS 10,000 / month |
| G-04 | Commission revenue | Net platform revenue (blended ~6%) | GHS 600 / month |
| G-05 | Platform trust | Admin-resolved dispute tickets | < 3 disputes / month |
| G-06 | Dispatch reliability | OTP-verified DELIVERED / total dispatched | > 90% first-attempt delivery |
| G-07 | Rider onboarding | Active vetted riders | 5–10 riders by launch |
| G-08 | Zero contact violations | Seller contact fields exposed in buyer-facing API responses | 0 (enforced server-side) |
| G-09 | Portfolio signal | Production system, public, documented | Live at ushopgh.com — 99% uptime SLO |

---

<br/>

<a name="5"></a>

# <span style="color:#5D1A89">5. User Personas</span>

## <span style="color:#D1148A">5.1 Student Reseller — "Kofi" (Primary Seller)</span>

| Attribute | Detail |
|---|---|
| **Profile** | Kofi, 22, Level 300 Computer Science — GCTU, Accra |
| **Behaviour** | Buys, refurbishes, resells phones and laptops via WhatsApp |
| **Goal on U-Shop** | Shareable storefront link: `ushopgh.com/store/techbykofi` |
| **Verification Tier** | Student Reseller: `.gctu.edu.gh` email OTP + Student ID. Commission: 5% |
| **Communication** | Communicates only with Admin (payout queries, account issues) |
| **Primary Device** | Android smartphone (primary), laptop (listing management) |

## <span style="color:#D1148A">5.2 Student Buyer — "Ama" (Primary Buyer)</span>

| Attribute | Detail |
|---|---|
| **Profile** | Ama, 20, Level 100 — University of Ghana, Legon |
| **Goal on U-Shop** | Find a verified seller, pay safely, get delivery with proof of receipt |
| **Communication** | Communicates only with Rider (phone/WhatsApp) during `IN_TRANSIT`. Contacts Admin for disputes. Never contacts seller. |
| **Primary Device** | Android smartphone (sole device) |

## <span style="color:#D1148A">5.3 Business Reseller — "Mr. Mensah" (Secondary Seller)</span>

| Attribute | Detail |
|---|---|
| **Profile** | Mr. Mensah, 34, independent tech reseller — Accra Mall area |
| **Verification Tier** | Business Store: Ghana Card + business doc. Commission: 8% |
| **Communication** | Communicates only with Admin |
| **Goal** | Reach the student market without managing his own delivery staff |

## <span style="color:#D1148A">5.4 Dispatch Rider — "Kwame"</span>

| Attribute | Detail |
|---|---|
| **Profile** | Kwame, 25, freelance motorcycle dispatch rider — Accra |
| **Relationship** | Platform-vetted. RIDER role created by Admin. Independent contractor. |
| **Primary Tool** | U-Shop Rider Dashboard at `ushopgh.com/rider` — mobile-optimised web app |
| **Workflow** | Logs in → checks assigned orders → picks up from seller → delivers to buyer → asks buyer for OTP → submits in app → order auto-updates to `DELIVERED` |
| **Communication** | Communicates directly with buyer via phone/WhatsApp during `IN_TRANSIT` to coordinate drop-off |

---

<br/>

<a name="6"></a>

# <span style="color:#5D1A89">6. Tech Stack & DevOps</span>

> ℹ️ **v1.3 Change:** `better-auth` + `@better-auth/prisma-adapter` added to stack. Custom JWT implementation removed. All other stack decisions retained from v1.2.

## <span style="color:#D1148A">6.1 Application Stack</span>

| Layer | Technology | Hosting / Tier | Rationale |
|---|---|---|---|
| **Full-Stack Framework** | Next.js 15 App Router + TypeScript | Vercel Hobby (Free) | Unified frontend + backend. Server Components, Route Handlers, Server Actions replace a separate Express API. |
| **Authentication** | `better-auth` + `@better-auth/prisma-adapter` | Self-hosted (Next.js API route + AWS RDS) | Replaces custom JWT. Session-based auth stored in PostgreSQL. Built-in RBAC plugin. Password hashing, cookie management, and session rotation handled by the library. See Section 7. |
| **Styling** | Tailwind CSS + shadcn/ui | Bundled | Utility-first CSS. Critical for mobile-optimised Rider Dashboard. |
| **Server State** | TanStack Query v5 | npm | Data fetching, caching, optimistic updates. |
| **Global State** | Zustand | npm | Cart state, UI state. Lightweight. |
| **ORM** | Prisma ORM | npm | Type-safe DB client. `prisma migrate` for schema versioning. Validated by GitHub Actions. |
| **Primary Database** | PostgreSQL 15 | AWS RDS db.t2.micro (Free Tier) | Relational integrity for orders, commissions, OTP, sessions, users. |
| **Product Images** | AWS S3 — `ushop-product-images` (public) | AWS S3 Standard | Publicly readable. Cleaned up on product deletion. |
| **KYC Documents** | AWS S3 — `ushop-kyc-documents` (private) | AWS S3 Standard (Block All Public Access) | Admin access via 15-min presigned URLs only. |
| **Payments** | Paystack | Paystack (Ghana-registered) | MoMo + Visa/MC. 1.95% + GHS 0.50 fee shown as explicit checkout line item. |
| **Transactional Email** | Resend + React Email | Resend Free (3,000/month) | All 8 email trigger types. OTP emails, order notifications, payout alerts. |
| **Search (V1)** | PostgreSQL Full-Text Search | Within AWS RDS | GIN indexes on title + description. No extra infra. |
| **PWA** | `next-pwa` | Bundled | Service worker + manifest. Rider Dashboard works offline for cached orders. |
| **Error Tracking** | Sentry (`@sentry/nextjs`) | Sentry Free (5k errors/month) | Server + client error capture. Configured from Phase 0. |
| **Uptime Monitoring** | UptimeRobot | Free | 5-min ping. Email alert on downtime. |
| **DNS + CDN** | Cloudflare | Free (domain registered) | Proxies Vercel. DDoS protection, edge caching, HTTPS. |

## <span style="color:#D1148A">6.2 DevOps — GitHub Actions CI/CD</span>

> ✅ GitHub Student Developer Pack provides free Actions minutes for `richard-nuhu`'s student account.

| Pipeline Stage | Trigger | Steps | Failure Behaviour |
|---|---|---|---|
| **PR Validation** | Every pull request to `main` | 1. `pnpm install --frozen-lockfile` 2. `tsc --noEmit` 3. `prisma validate` 4. `eslint . --max-warnings 0` | PR blocked from merging. Status check shown on GitHub UI. |
| **Deploy Pipeline** | Merge to `main` | 1. PR Validation steps repeated 2. `prisma migrate deploy` (staging DB) 3. Vercel build via GitHub integration 4. Sentry release created (`sentry-cli releases new`) 5. Smoke test: `GET /api/health` | Deploy halted. Sentry alert fired. Rollback via Vercel dashboard (one click). |
| **Daily Integrity Check** | Cron: `00:00 UTC` | 1. RDS connection health check 2. Report orphaned S3 product images 3. Report orders > 7 days in `PENDING_COD` | Results emailed to Richard Nuhu via Resend. |

## <span style="color:#D1148A">6.3 Infrastructure Cost Model</span>

| Service | Tier | Monthly Cost | Notes |
|---|---|---|---|
| Vercel (Next.js) | Hobby (Free) | $0.00 | 100GB bandwidth. 10s function timeout. |
| AWS RDS PostgreSQL | db.t2.micro Free Tier | $0.00 | Free 12 months. Post-free-tier: ~$15/mo from AWS credits. |
| AWS S3 (both buckets) | Standard | ~$0.50 | < 10GB at V1 scale. |
| Resend | Free (3,000/month) | $0.00 | All V1 email volume covered. |
| Sentry | Free (5,000 errors/mo) | $0.00 | |
| GitHub Actions | Free (Student Pack) | $0.00 | |
| Cloudflare | Free | $0.00 | |
| **TOTAL FIXED** | | **~$0.50 / month** | $140 AWS credits covers ~11 months. |

---

<br/>

<a name="7"></a>

# <span style="color:#5D1A89">7. Authentication Architecture — Better Auth</span>

> <span style="color:#FF0000; font-weight:bold;">NEW in v1.3</span> — Custom JWT stack fully removed. `better-auth` + `@better-auth/prisma-adapter` is the sole authentication layer.

## <span style="color:#D1148A">7.1 Why Better Auth Replaces Custom JWT</span>

| Concern | Custom JWT (v1.2) | Better Auth (v1.3) |
|---|---|---|
| **Session Storage** | Access token in memory (ephemeral). Refresh token in HttpOnly cookie. | Sessions stored in PostgreSQL via Prisma adapter. Instantly revocable server-side. |
| **Password Hashing** | Custom implementation (bcrypt). Developer responsibility. | Built-in, library-managed. Uses Argon2id by default. Zero developer crypto code. |
| **Token Rotation** | Manual refresh endpoint with rotation logic. High complexity, high risk. | Library handles session renewal automatically. |
| **RBAC** | Custom `role` claim in JWT payload. Manually parsed in Middleware. | Built-in RBAC plugin. `session.user.role` available natively. No custom parsing. |
| **Security Surface** | Large: token generation, rotation, expiry, invalidation, cookie flags, CSRF. | Minimal: library owns all of this. Reviewed by the open-source community. |
| **Dev Time** | ~3–5 days to implement correctly. | ~4 hours to integrate. |

## <span style="color:#D1148A">7.2 Better Auth Configuration</span>

**Installation:**
```bash
pnpm add better-auth @better-auth/prisma-adapter
```

**`lib/auth.ts` — Core Configuration:**
```typescript
import { betterAuth } from "better-auth"
import { prismaAdapter } from "@better-auth/prisma-adapter"
import { rbac } from "better-auth/plugins"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,      // 7-day session TTL
    updateAge:  60 * 60 * 24,           // Refresh session every 24 hours
    cookieCache: { enabled: true },
  },
  plugins: [
    rbac({
      defaultRole: "buyer",
      roles: {
        admin:  { inherits: [] },
        seller: { inherits: [] },
        buyer:  { inherits: [] },
        rider:  { inherits: [] },
      },
    }),
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: { sameSite: "lax" },
  },
})
```

**`app/api/auth/[...all]/route.ts` — Catch-All Handler:**
```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

**`lib/auth-client.ts` — Client-Side:**
```typescript
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})
```

## <span style="color:#D1148A">7.3 Prisma Schema — Better Auth Tables</span>

Better Auth creates and manages the following tables via `prisma migrate`. These are appended to the existing application schema:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  role          String    @default("buyer")   // "admin" | "seller" | "buyer" | "rider"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]
  // Application relations:
  sellerProfile SellerProfile?
  orders        Order[]
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
}

model Account {
  id           String  @id @default(cuid())
  accountId    String
  providerId   String
  userId       String
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

> ⚠️ **Note:** The `role` field on `User` is the authoritative source of truth for access control. It is set by Admin at the time of seller approval or rider account creation. It is never self-assignable by any user.

## <span style="color:#D1148A">7.4 Next.js Middleware — Route Protection via Better Auth Session</span>

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  const { pathname } = request.nextUrl

  // Unauthenticated guard
  if (!session) {
    if (
      pathname.startsWith("/admin")  ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/rider")  ||
      pathname.startsWith("/account")
    ) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  const role = session.user.role

  // Role guards
  if (pathname.startsWith("/admin")  && role !== "admin")  return NextResponse.redirect(new URL("/unauthorized", request.url))
  if (pathname.startsWith("/seller") && role !== "seller") return NextResponse.redirect(new URL("/unauthorized", request.url))
  if (pathname.startsWith("/rider")  && role !== "rider")  return NextResponse.redirect(new URL("/unauthorized", request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/rider/:path*", "/account/:path*"],
}
```

## <span style="color:#D1148A">7.5 Session Retrieval in Server Components & Route Handlers</span>

```typescript
// In a Server Component or Route Handler
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const session = await auth.api.getSession({ headers: headers() })

if (!session) {
  // User is not authenticated
}

const { user } = session
// user.id, user.email, user.role, user.name
```

## <span style="color:#D1148A">7.6 Admin Role Assignment</span>

- **Buyer accounts:** Created via `authClient.signUp.email()`. Role defaults to `"buyer"` (Better Auth default).
- **Seller accounts:** Created via seller registration flow. Role set to `"seller"` by a `prisma.user.update()` call in the admin approval server action — not self-assigned.
- **Rider accounts:** Created manually by Admin via admin dashboard. Admin calls `prisma.user.create()` with `role: "rider"` and a temporary password.
- **Admin account:** Seeded manually by Richard Nuhu via `prisma db seed` on first deployment. Role set to `"admin"`.

> ⚠️ <span style="color:#FF0000; font-weight:600;">Security Rule:</span> No API endpoint or form action allows a user to self-set their role. The `role` field is only mutated by server-side admin actions with an active `ADMIN` session guard.

---

<br/>

<a name="8"></a>

# <span style="color:#5D1A89">8. Seller Verification Tiers</span>

> ✅ Retained from v1.2 without change. Selfie requirement removed. 4-institution list locked.

## <span style="color:#D1148A">8.1 Tier Overview</span>

| Tier | Seller Type | Commission | Documents Required | Storefront Badge |
|---|---|---|---|---|
| **Tier 1 — Student Reseller** | Enrolled university students | **5%** | 1. `.edu.gh` email OTP (4 approved institutions only) 2. Student ID card (front) → private S3 | Verified Student |
| **Tier 2 — Business Store** | Registered business / commercial reseller | **8%** | 1. Ghana Card (front + back) → private S3 2. EITHER: Certificate of Incorporation / Business Reg. OR Business Owner's national ID | Verified Business |
| **Tier 3 — Individual** | General public, no student/business affiliation | **8%** | 1. Ghana Card (front + back) → private S3 | Verified Individual |

## <span style="color:#D1148A">8.2 V1 Approved Institution List</span>

> <span style="color:#FF0000; font-weight:600;">V1 Scope:</span> Narrowed to 4 Accra-based institutions. Stored in DB — admin can add/remove without a code deployment.

| Institution | Accepted Email Domains | Campus |
|---|---|---|
| Ghana Communication Technology University (GCTU) | `gctu.edu.gh` | Tesano, Accra |
| University of Ghana (UG) | `ug.edu.gh`, `st.ug.edu.gh` | Legon, Accra |
| University of Professional Studies, Accra (UPSA) | `upsa.edu.gh` | Okponglo, Accra |
| Accra Technical University (ATU) | `atu.edu.gh` | Barnes Road, Accra |

## <span style="color:#D1148A">8.3 Student Reseller OTP Flow</span>

1. Seller selects "Student Reseller" at registration. Enters name, handle, `.edu.gh` email, password, campus.
2. System validates domain against DB institution list. Inline error if not found.
3. 6-digit OTP sent to `.edu.gh` email via Resend (TTL: 10 minutes). 3 failed attempts → 10-minute lockout.
4. Valid OTP unlocks Student ID upload (JPEG/PNG/WEBP, max 5MB → `ushop-kyc-documents` private S3).
5. Account status: `PENDING_STUDENT`. Storefront URL reserved, returns `404`. Admin notified.
6. Admin reviews, approves or rejects (with reason). On approval: `ACTIVE`, `commission_rate = 0.05`, welcome email.

---

<br/>

<a name="9"></a>

# <span style="color:#5D1A89">9. Commission & Pricing Engine</span>

> ✅ Gross-Up model retained from v1.2. Paystack fee remains an explicit checkout line item.

## <span style="color:#D1148A">9.1 Commission Rates</span>

| Seller Tier | Rate | Effective Buyer Markup |
|---|---|---|
| Tier 1 — Student Reseller | **5%** | 5.26% (GHS 100 vendor → GHS 105.26 listed) |
| Tier 2 — Business Store | **8%** | 8.70% (GHS 100 vendor → GHS 108.70 listed) |
| Tier 3 — Individual | **8%** | 8.70% (GHS 100 vendor → GHS 108.70 listed) |

## <span style="color:#D1148A">9.2 Pricing Formulas</span>

**Formula 1 — Final Listing Price** *(displayed on listing card and product detail page)*

```
Final Listing Price  =  Vendor Price  ÷  (1 − Commission Rate)
```
> *Example: Vendor Price GHS 200, Student (5%) → 200 ÷ 0.95 = **GHS 210.53***

**Formula 2 — Checkout Price** *(subtotal before Paystack fee)*
```
Checkout Price  =  Final Listing Price  +  Delivery Fee
```

**Formula 3 — Total Due** *(full amount charged to buyer)*
```
Total Due  =  Checkout Price  +  Paystack Fee
           where Paystack Fee  =  (1.95% × Checkout Price)  +  GHS 0.50
```

## <span style="color:#D1148A">9.3 Mandatory Checkout Line Item Display</span>

The checkout page **must** display the following, in order. No single component may be omitted:

| Line Item | Calculation | Paid To |
|---|---|---|
| Product Price | `listing_price` | Platform (commission embedded) |
| Delivery Fee | Flat rate per order (or GHS 0) | Platform → Rider |
| Checkout Price | `listing_price + delivery_fee` | Subtotal |
| Paystack Processing Fee | `(0.0195 × checkout_price) + 0.50` | Paystack directly |
| **TOTAL DUE** | `checkout_price + paystack_fee` | **Buyer pays this** |

> A tooltip on the Paystack fee must read: *"This fee is charged by Paystack for processing your payment. U-Shop does not retain it."*

## <span style="color:#D1148A">9.4 Order Commission Fields (Immutable Snapshot)</span>

| Field | Type | Description |
|---|---|---|
| `vendor_price` | `Decimal(10,2)` | Seller's asking price. Equals `seller_receivable`. |
| `commission_rate` | `Decimal(5,4)` | Rate at time of order. Immutable. |
| `listing_price` | `Decimal(10,2)` | `vendor_price / (1 - commission_rate)` |
| `delivery_fee` | `Decimal(10,2)` | Flat delivery fee. May be `0.00`. |
| `checkout_price` | `Decimal(10,2)` | `listing_price + delivery_fee` |
| `paystack_fee` | `Decimal(10,2)` | `(0.0195 × checkout_price) + 0.50` |
| `total_charged` | `Decimal(10,2)` | `checkout_price + paystack_fee` |
| `commission_amount` | `Decimal(10,2)` | `listing_price - vendor_price`. Platform gross revenue. |
| `seller_receivable` | `Decimal(10,2)` | `vendor_price`. Exact payout to seller. |
| `commission_status` | `Enum` | `PENDING \| CAPTURED \| WAIVED` |
| `delivery_fee_status` | `Enum` | `PENDING \| PAID_TO_RIDER \| WAIVED` |

---

<br/>

<a name="10"></a>

# <span style="color:#5D1A89">10. Order Logistics State Machine</span>

> ✅ 7-state machine retained from v1.2 without change.

## <span style="color:#D1148A">10.1 State Definitions</span>

| State | Meaning | Who Sets This | System Actions Triggered |
|---|---|---|---|
| `PENDING_COD` | COD order created. No payment captured. | System (COD checkout) | Email to seller: "New COD order." Email to buyer: "Order confirmed." |
| `PAID` | Buyer completed Paystack checkout. Payment confirmed by webhook. | System (Paystack webhook) | Email to seller: "New order — begin packaging." Email to buyer: receipt. Commission snapshot stored. |
| `PROCESSING` | Seller acknowledges and is packaging. | Seller (dashboard action) | Email to buyer: "Your order is being prepared." |
| `READY_FOR_PICKUP` | Item is packaged. Admin notified to assign a rider. | Seller (dashboard action) | Email/notification to Admin: "Order #USH-XXXX ready — assign a rider." |
| `IN_TRANSIT` | Rider assigned. En route to buyer. | Admin (assigns rider) | System generates 4-digit OTP (bcrypt hash, 4h TTL). **Resend email to buyer with OTP.** Rider sees order in `/rider` dashboard. |
| `DELIVERED` | Rider submitted correct OTP at buyer's doorstep. | System (OTP match) | OTP hash nullified (`otp_hash = NULL`). `delivered_at` timestamp set. Email to buyer: "Delivered — please confirm item works." Email to Admin. |
| `COMPLETED` | Buyer confirms item is working. Admin releases payout. | Admin (or 48h auto-close) | `commission_status = CAPTURED`. Admin initiates MoMo payout (`seller_receivable`). Email to seller: payout sent. |
| `DISPUTED` | Issue raised post-`PAID`. | Buyer or Admin | Payout withheld. Admin notified. Email to Admin. |

## <span style="color:#D1148A">10.2 State Transition Flow</span>

```
PAID ──────────► PROCESSING ──────► READY_FOR_PICKUP ──────► IN_TRANSIT ──────► DELIVERED ──────► COMPLETED
                                                                                                         │
PENDING_COD ──► PROCESSING ──► (same path as above) ────────────────────────────────────────────────────┘

                                        ↕ (any post-PAID state)
                                     DISPUTED
```

> ⚠️ Illegal transitions (e.g., `PROCESSING → COMPLETED`) are rejected with `HTTP 422 Unprocessable Entity`.

## <span style="color:#D1148A">10.3 OTP Delivery Verification System</span>

### Generation (on `IN_TRANSIT` transition)
- Admin calls `POST /api/orders/{id}/assign-rider` with `{ riderId }`.
- Server: `crypto.randomInt(0, 10000).toString().padStart(4, '0')` generates raw OTP.
- Raw OTP hashed with `bcrypt.hash(otp, 10)`. Hash stored as `order.otp_hash`.
- `order.otp_expires_at = Date.now() + (4 * 60 * 60 * 1000)` (4 hours).
- Order status → `IN_TRANSIT`. `order.rider_id` set.
- Resend email to buyer: *"Your delivery OTP is: **XXXX**. Give this to the rider only when they are at your door."*

### Verification (rider at doorstep)
- Rider calls `POST /api/orders/{id}/verify-otp` (RIDER JWT required) with `{ otp: "XXXX" }`.
- Server checks: `otp_expires_at > now()`. Runs `bcrypt.compare(submittedOtp, otp_hash)`.
- **Match:** Order → `DELIVERED`. `otp_hash = NULL`. `otp_expires_at = NULL`. `delivered_at = now()`. Rider sees success screen.
- **Mismatch:** `HTTP 400`. Attempt counter incremented. After 5 failures: Sentry alert fired. Rider sees: "Contact admin."
- **Expiry:** Admin regenerates OTP from admin dashboard. New OTP emailed to buyer.

---

<br/>

<a name="11"></a>

# <span style="color:#5D1A89">11. Role-Based Access Control & Rider Dashboard</span>

## <span style="color:#D1148A">11.1 RBAC — Better Auth Roles</span>

> ✅ Four roles retained from v1.2. Better Auth's RBAC plugin is now the implementation layer (replaces manual JWT role claim).

| Role | Description | Protected Route Group | How Role is Set |
|---|---|---|---|
| `admin` | Full platform access. Verifies sellers, assigns riders, manages orders, triggers payouts. | `/(admin)` | Seeded by Richard Nuhu via `prisma db seed` on first deployment. |
| `seller` | Manages own storefront, listings, and orders. | `/(seller)` | Set by admin server action on seller KYC approval. |
| `buyer` | Browses products, checks out, views own orders, submits reviews. | `/(buyer)` + public | Default role assigned by Better Auth on `signUp.email()`. |
| `rider` | Views assigned orders in `READY_FOR_PICKUP` or `IN_TRANSIT`. Submits OTP. | `/(rider)` | Set by admin when creating rider account via admin dashboard. |

## <span style="color:#D1148A">11.2 Permission Matrix</span>

| Capability | ADMIN | SELLER | BUYER | RIDER |
|---|---|---|---|---|
| View any order | ✅ | Own only | Own only | Assigned only |
| Transition to `PROCESSING` | ❌ | ✅ (own) | ❌ | ❌ |
| Transition to `READY_FOR_PICKUP` | ❌ | ✅ (own) | ❌ | ❌ |
| Assign rider (`IN_TRANSIT` trigger) | ✅ | ❌ | ❌ | ❌ |
| Submit OTP (`DELIVERED` trigger) | ❌ | ❌ | ❌ | ✅ (assigned) |
| Mark `COMPLETED` | ✅ | ❌ | ❌ | ❌ |
| Mark `DISPUTED` | ✅ | ❌ | ✅ (own) | ❌ |
| Create/edit product listing | ❌ | ✅ (own) | ❌ | ❌ |
| Approve/reject seller KYC | ✅ | ❌ | ❌ | ❌ |
| View KYC documents (presigned URL) | ✅ | ❌ | ❌ | ❌ |
| Trigger seller payout | ✅ | ❌ | ❌ | ❌ |
| Create RIDER account | ✅ | ❌ | ❌ | ❌ |
| View seller/buyer contact info | ✅ (admin only) | ❌ | ❌ | Rider phone in own profile only |
| Set user role | ✅ (server action) | ❌ | ❌ | ❌ |

## <span style="color:#D1148A">11.3 Rider Web Dashboard</span>

> ⚠️ The Rider Dashboard is a **mobile-optimised protected web route**. No native iOS/Android app required.

**Design Constraints:**
- Functional on 360–390px viewport Android Chrome (Kwame's device).
- All touch targets: minimum 48px height.
- OTP input boxes: minimum 60×60px with numeric keyboard (`inputMode="numeric"`).
- `next-pwa` service worker caches assigned order data for brief network interruptions.

**Rider Dashboard Pages:**

| Route | Page | Features |
|---|---|---|
| `/rider` | Order List | All orders assigned to this rider in `READY_FOR_PICKUP` or `IN_TRANSIT`. Card shows: order ref, buyer's campus/area, product name, status badge, time since assignment. Sorted oldest first. |
| `/rider/orders/[id]` | Order Detail + OTP Input | Order summary: product name, buyer first name only (no surname), delivery area, seller pickup address. If `IN_TRANSIT`: 4-box OTP input interface. "Submit OTP" button (disabled until 4 digits entered). Attempt counter. |
| `/rider/history` | Completed Deliveries | Read-only list of `DELIVERED` / `COMPLETED` orders for delivery count reference. |
| `/rider/profile` | Rider Profile | Name, phone, assigned campus zones. Read-only (admin manages). |

**OTP Input UI Specification:**
- Four separate `<input type="text" inputMode="numeric" maxLength={1}>` boxes rendered as large squares.
- Auto-advance: focus moves to next box on digit entry. Backspace returns to previous.
- Paste support: pasting `"4821"` auto-fills all four boxes.
- Submit disabled until all 4 boxes contain a digit.
- On submit: spinner shown; button disabled during API call.
- **Success:** Green tick animation. Order card updates to `DELIVERED`. OTP boxes cleared.
- **Failure:** Red shake animation. Boxes cleared. `"Incorrect OTP — X attempts remaining."`

---

<br/>

<a name="12"></a>

# <span style="color:#5D1A89">12. Communication Policy — Zero Buyer-Seller Contact</span>

> <span style="color:#FF0000; font-weight:bold;">REPLACES Chapter 12 (Escrow-First Communication) from v1.2.</span>
>
> **v1.3 Rule:** There is **absolutely zero communication** permitted between buyers and sellers — at any order state, at any time, via any channel. This is a platform-level policy enforced at the API layer.

## <span style="color:#D1148A">12.1 Permitted Communication Channels</span>

| Actor | Can Communicate With | Channel | When |
|---|---|---|---|
| **Buyer** | **Rider only** | Phone / WhatsApp (rider number revealed in buyer's Order Detail) | **Only during `IN_TRANSIT`** state — to coordinate exact drop-off location |
| **Buyer** | **Admin only** | Dispute form / contact page | **Only for disputes or account issues** |
| **Seller** | **Admin only** | Email / admin contact | Payout queries, account issues |
| **Rider** | **Buyer** | Phone / WhatsApp (pre-arranged by admin) | During `IN_TRANSIT` to coordinate delivery |
| **Rider** | **Admin only** | Phone / WhatsApp | For pickup address confirmation or issues |
| **Admin** | **Any party** | Email / phone | Full visibility and control |

## <span style="color:#D1148A">12.2 What Is Explicitly Prohibited</span>

- ❌ Seller WhatsApp / phone number shown to buyer — **at any point, in any order state**.
- ❌ Buyer email / phone shown to seller — **at any point**.
- ❌ In-app messaging between buyer and seller — **feature does not exist in V1**.
- ❌ Seller's personal contact embedded in storefront pages.
- ❌ Any "Contact Seller" button or CTA on product pages or storefronts.

## <span style="color:#D1148A">12.3 What Is Permitted</span>

- ✅ Seller contact fields (`whatsapp_number`, `phone`) are stored in DB for admin use only.
- ✅ Rider phone number is returned **only** in the buyer's Order Detail API response **and only when** `order.status === "IN_TRANSIT"` and the requesting user is the verified buyer of that order.
- ✅ A "Contact Admin" link is visible on all buyer-facing order detail pages for dispute escalation.
- ✅ After order `COMPLETED`: buyer can submit a product rating/review (no messaging, just structured review form).

## <span style="color:#D1148A">12.4 Server-Side Enforcement Rules</span>

1. `GET /api/storefront/{handle}` — seller contact fields (`whatsapp_number`, `phone`, `email`) **must never be included** in the API response payload. Prisma `select` statement must explicitly exclude these fields.

2. `GET /api/orders/{id}` (buyer) — response includes `rider.phone` **only if** `order.status === "IN_TRANSIT"` AND `order.buyer_id === session.user.id`. All seller contact fields: **omitted entirely**.

3. No API endpoint exists to retrieve seller contact information for a buyer. Any such endpoint must be treated as a security vulnerability and immediately removed.

4. Admin-facing endpoints may include seller and buyer contact fields, guarded by `role === "admin"` session check.

> ⚠️ <span style="color:#FF0000; font-weight:600;">Implementation Rule:</span> Client-side hiding (CSS `display: none`, conditional rendering) is **not** sufficient. The server must never transmit prohibited fields to buyer-scoped requests. Enforce at the Prisma `select` level.

---

<br/>

<a name="13"></a>

# <span style="color:#5D1A89">13. V1 Feature Scope</span>

> ℹ️ **v1.3 Removals:** F-22 (In-App Order Messaging) deleted entirely. All escrow-related contact gating features removed. Better Auth replaces JWT features.

## <span style="color:#D1148A">13.1 Feature Priority Matrix</span>

| ID | Feature | Role(s) | Priority | Notes |
|---|---|---|---|---|
| F-01 | Tiered Seller Registration & KYC Upload | SELLER | P0 | 3 tiers. Private S3. Admin review. Student OTP. |
| F-02 | Student Email OTP (.edu.gh — 4 institutions) | SELLER (Student) | P0 | GCTU, UG, UPSA, ATU. DB-managed list. |
| F-03 | Unique Seller Storefront URL | SELLER | P0 | `ushopgh.com/store/{handle}`. Immutable post-approval. |
| F-04 | Storefront Customisation | SELLER | P0 | Store name, tagline, bio, profile photo, cover image, campus tag. No contact info shown publicly. |
| F-05 | Product Listing (Create / Edit / Delete + S3 Cleanup) | SELLER | P0 | Seller sets `vendor_price`. System computes `listing_price`. Deletion → async S3 cleanup. |
| F-06 | Gross-Up Price Calculation Engine | Platform | P0 | `listing_price = vendor_price / (1 - commission_rate)`. Stored on Product. Commission snapshot on Order. |
| F-07 | Better Auth Integration | Platform | P0 | `better-auth` + `@better-auth/prisma-adapter`. Sessions in PostgreSQL. RBAC plugin. Replaces JWT. |
| F-08 | Next.js Middleware Route Protection | Platform | P0 | Reads Better Auth session. Guards `/admin`, `/seller`, `/rider`. |
| F-09 | Buyer Registration & Login | BUYER | P0 | `authClient.signUp.email()` via Better Auth. Email verification. Role defaults to `"buyer"`. |
| F-10 | Product Search & Browse | BUYER | P0 | PG full-text search. Filters: category, condition, price range, campus, seller tier. |
| F-11 | Product Detail Page | BUYER | P0 | Shows `listing_price`. No seller contact info. No "Contact Seller" CTA. |
| F-12 | Paystack Checkout (MoMo + Card) | BUYER | P0 | Explicit 3-line breakdown. Paystack fee as distinct line item. |
| F-13 | COD Checkout Option | BUYER | P0 | `PENDING_COD` state. Follows same 7-state dispatch lifecycle. |
| F-14 | 7-State Order Lifecycle (State Machine) | Platform / All | P0 | Illegal transitions rejected with `HTTP 422`. |
| F-15 | OTP Generation on `IN_TRANSIT` | Platform | P0 | `crypto.randomInt`, bcrypt hash, 4h TTL. Resend email to buyer. |
| F-16 | Rider Web Dashboard (`/rider`) | RIDER | P0 | Better Auth RIDER session guard. Mobile-optimised. 4-digit OTP input. |
| F-17 | RBAC — 4 Roles via Better Auth | Platform | P0 | ADMIN / SELLER / BUYER / RIDER. |
| F-18 | Admin: Assign Rider to Order | ADMIN | P0 | Triggers `IN_TRANSIT` + OTP generation. |
| F-19 | Zero Buyer-Seller Contact Enforcement | Platform | P0 | Seller contact never in buyer API responses. Enforced at Prisma `select` level. |
| F-20 | Admin KYC Queue + S3 Presigned URL Viewer | ADMIN | P0 | 15-min presigned URLs. All views logged. |
| F-21 | Admin Dashboard | ADMIN | P0 | GMV, commission, payout queue, rider list, order state distribution. |
| F-22 | ~~In-App Order Messaging~~ | — | **REMOVED** | Zero Buyer-Seller Communication Policy. No messaging feature. |
| F-23 | GitHub Actions CI/CD Pipeline | DevOps | P0 | TS typecheck + `prisma validate` + ESLint on every PR. |
| F-24 | Sentry Integration | DevOps | P0 | `@sentry/nextjs`. Error + performance monitoring from Phase 0. |
| F-25 | Rider Phone Reveal (IN_TRANSIT only) | BUYER | P1 | Rider phone shown in buyer's Order Detail only when `status === "IN_TRANSIT"`. |
| F-26 | Seller Payout Management (Manual MoMo) | ADMIN | P1 | Admin triggers payout at `COMPLETED`. Records MoMo reference. Resend email to seller. |
| F-27 | Seller Ratings & Reviews | BUYER | P1 | Post-`COMPLETED` rating (1–5 stars + text). Shown on storefront and product cards. |
| F-28 | Storefront OG Social Share Card | SELLER | P1 | Dynamic OG image for WhatsApp / Twitter/X preview. |
| F-29 | Transactional Emails via Resend (8 triggers) | All | P1 | Student OTP, new order, order confirmed, OTP delivery, `DELIVERED`, payout sent, dispute raised, seller approved/rejected. |
| F-30 | Seller Tier Badge on Storefront | BUYER / SELLER | P1 | "Verified Student" / "Verified Business" / "Verified Individual". |
| F-31 | Campus Tag & Filter | Both | P1 | Seller tags campus. Buyer filters by campus. |
| F-32 | PWA Manifest + Service Worker | All | P1 | Android "Add to Home Screen". Offline shell for Rider Dashboard. |
| F-33 | UptimeRobot Monitoring | DevOps | P1 | 5-min ping. Email alert. |
| F-34 | Wishlist / Save for Later | BUYER | P2 | No checkout impact. V1.1. |
| F-35 | Seller Analytics Dashboard | SELLER | P2 | Views, sales, revenue. V1.1. |
| F-36 | Admin Homepage Banner | ADMIN | P2 | Featured sellers or products. |
| F-37 | Rider Earnings Tracker | RIDER | P2 | Per-delivery payment log. V1.1. |

---

<br/>

<a name="14"></a>

# <span style="color:#5D1A89">14. S3 Security & Asset Management</span>

> ✅ Retained from v1.2. Two-bucket architecture with private KYC bucket and async product image cleanup.

## <span style="color:#D1148A">14.1 Two-Bucket Architecture</span>

| Bucket | Purpose | Public Access | Admin Access | Retention |
|---|---|---|---|---|
| `ushop-product-images` | Product listing photos (max 5 per listing) | ✅ PUBLIC READ | Direct URL | Deleted via background job when product is deleted from DB. |
| `ushop-kyc-documents` | Seller KYC: Student IDs, Ghana Cards, business docs | ❌ NO PUBLIC ACCESS (Block All Public Access at bucket + account level) | 15-minute presigned URL via `POST /api/kyc/presigned-url` (ADMIN session required). Every access logged. | Retained 2 years post-account closure. Admin can manually purge. |

## <span style="color:#D1148A">14.2 KYC Presigned URL Flow</span>

1. Admin clicks "View Document" in the KYC queue.
2. Admin dashboard calls `POST /api/kyc/presigned-url` (requires `role === "admin"` Better Auth session).
3. Route Handler calls `AWS SDK GetObjectCommand` with a 900-second (15-minute) expiry.
4. Presigned URL returned to admin browser. Opens in new tab.
5. After 15 minutes, URL is invalid. New URL required for re-access.
6. Every generation logged: `admin_user_id`, `s3_object_key`, `timestamp`.

## <span style="color:#D1148A">14.3 Product Image S3 Cleanup on Delete</span>

1. Seller/Admin deletes product → `status = DELETED`, `deleted_at = now()` (soft delete). Product disappears from buyer view immediately.
2. API returns `200 OK`. Async background job queued (non-blocking; respects Vercel 10s timeout).
3. Job reads `product.image_s3_keys` (JSON array).
4. Calls `AWS SDK DeleteObjectsCommand` (batch).
5. **On success:** Hard-delete product DB record.
6. **On failure (3 retries, exponential backoff):** Sentry error logged. Product flagged for manual admin cleanup.

> ⚠️ <span style="color:#FF0000; font-weight:600;">Security Mandate:</span> IAM policy for the Next.js app IAM role must be least-privilege: read/write on both S3 buckets + `s3:GeneratePresignedUrl` on `ushop-kyc-documents` only. No human IAM user has direct console access to the KYC bucket in production.

---

<br/>

<a name="15"></a>

# <span style="color:#5D1A89">15. Core User Stories & Acceptance Criteria</span>

## <span style="color:#D1148A">Epic 1 — Authentication (Better Auth)</span>

### US-01 — Buyer Registration via Better Auth
*As a new buyer, I want to create an account with my email and password, so that I can browse and purchase products.*

**Acceptance Criteria:**
- Registration calls `authClient.signUp.email({ name, email, password })` from the Better Auth client.
- Better Auth sends a verification email via Resend. Buyer must verify before purchasing.
- Role defaults to `"buyer"` (Better Auth RBAC default role).
- On successful verification + login: Better Auth sets a session cookie (HttpOnly, Secure in production).
- `/account` routes are accessible. `/seller`, `/admin`, `/rider` routes redirect to `/unauthorized`.

### US-02 — Admin Approves Seller (Role Assignment)
*As an admin, I want to approve a seller's KYC, so that their account becomes active with the correct commission rate and role.*

**Acceptance Criteria:**
- Admin calls a server action: `approveSellerKYC(userId, tier)`.
- Server action: (a) verifies caller has `role === "admin"` via `auth.api.getSession()`, (b) calls `prisma.user.update({ where: { id: userId }, data: { role: "seller" } })`, (c) updates `SellerProfile.status = "ACTIVE"` and `commission_rate`.
- Seller's next request to `/seller/dashboard` succeeds (Better Auth session reflects updated role).
- Welcome email sent via Resend.

---

## <span style="color:#D1148A">Epic 2 — Seller Onboarding</span>

### US-03 — Student Reseller Registration (OTP + KYC)
*As a GCTU/UG/UPSA/ATU student, I want to register with my .edu.gh email, so that I get a verified storefront at the 5% commission rate.*

**Acceptance Criteria:**
- Domain validated against DB institution list. Inline error if not found.
- 6-digit OTP sent via Resend. 10-minute TTL. 3-attempt lockout.
- Student ID uploaded to `ushop-kyc-documents` (private S3). Max 5MB.
- Account: `PENDING_STUDENT`. Admin notified. On approval: `ACTIVE`, `commission_rate = 0.05`.

### US-04 — Product Listing with Live Gross-Up Preview
*As an approved seller, I want to enter my vendor price and see what buyers will pay in real time.*

**Acceptance Criteria:**
- As seller types `vendor_price`, UI shows: `"Buyers will see: GHS [listing_price]"` (client-side, confirmed server-side on submit).
- Images → `ushop-product-images` (public). WebP compression. Max 1200px.
- Product deletion → soft delete → async S3 cleanup job. Seller gets immediate UI confirmation.
- Storefront page never exposes seller contact info (`whatsapp_number`, `phone`) in API response.

---

## <span style="color:#D1148A">Epic 3 — Buyer Flow</span>

### US-05 — Transparent Checkout Breakdown
*As a buyer, I want to see exactly where every Ghana Cedi goes, so I can make an informed decision.*

**Acceptance Criteria:**
- Checkout shows exactly: Product Price + Delivery Fee + Checkout Price + Paystack Fee + TOTAL DUE.
- Tooltip on Paystack Fee: *"Charged by Paystack. U-Shop does not retain this."*
- On Paystack webhook: Order created in `PAID`. All 11 commission fields stored immutably.
- Buyer receipt email via Resend within 30 seconds. Seller "New Order" email within 30 seconds.
- Seller contact fields (`whatsapp_number`, `phone`) absent from all buyer-facing order responses.

---

## <span style="color:#D1148A">Epic 4 — Managed Dispatch & OTP</span>

### US-06 — Admin Assigns Rider (IN_TRANSIT + OTP Trigger)
*As an admin, I want to assign a vetted rider to a READY_FOR_PICKUP order.*

**Acceptance Criteria:**
- Admin selects rider from dropdown in order management view. Calls `POST /api/orders/{id}/assign-rider`.
- Server: (a) verifies `role === "admin"`, (b) generates 4-digit OTP via `crypto.randomInt`, (c) hashes with bcrypt (rounds: 10), (d) stores `otp_hash` + `otp_expires_at` (4h), (e) sets `order.rider_id`, (f) transitions order to `IN_TRANSIT`.
- Buyer receives Resend email within 30 seconds with OTP.
- Rider sees the order appear on their `/rider` dashboard.

### US-07 — Rider Submits OTP (DELIVERED Transition)
*As a rider at the buyer's location, I want to submit the buyer's OTP to confirm delivery.*

**Acceptance Criteria:**
- Rider opens `/rider/orders/{id}`. Sees 4 large digit input boxes.
- Calls `POST /api/orders/{id}/verify-otp` with `{ otp }` (RIDER Better Auth session required).
- On match: `DELIVERED`, `otp_hash = NULL`, `delivered_at = now()`. Green success screen.
- On mismatch: `HTTP 400`. Shake animation. Attempt counter. After 5 fails: Sentry alert. Rider sees: "Contact admin."

### US-08 — Buyer Receives Rider Contact (IN_TRANSIT Only)
*As a buyer, I want to see the rider's phone number only when my order is in transit, so I can coordinate drop-off.*

**Acceptance Criteria:**
- `GET /api/orders/{id}` (BUYER session): includes `rider.phone` **only if** `order.status === "IN_TRANSIT"` AND `order.buyer_id === session.user.id`.
- Seller contact fields (`whatsapp_number`, `phone`) **never** present in this response.
- Before `IN_TRANSIT`: rider section shows "Rider will be assigned once your order is ready."
- After `DELIVERED`: rider section shows "Delivered ✓. Contact Admin for any concerns."

---

<br/>

<a name="16"></a>

# <span style="color:#5D1A89">16. Payment & Payout Flow</span>

## <span style="color:#D1148A">16.1 Paystack Flow (MoMo + Card)</span>

1. Buyer views product. `listing_price` displayed with gross-up tooltip.
2. Buyer clicks "Buy Now". Checkout page: 5-line breakdown including explicit Paystack fee.
3. Buyer clicks "Pay Now". Paystack Inline opens. U-Shop never handles raw credentials.
4. Paystack calls `POST /api/webhooks/paystack`. Handler: (a) verifies HMAC signature, (b) checks idempotency key, (c) creates Order in `PAID` with full commission snapshot.
5. Resend emails: buyer receipt + seller "New Order" (both within 30s).
6. Seller transitions to `PROCESSING` → `READY_FOR_PICKUP`.
7. Admin assigns rider → `IN_TRANSIT` → OTP generated → buyer OTP email.
8. Rider submits OTP → `DELIVERED`.
9. Admin marks `COMPLETED`. Initiates MoMo payout to seller (`seller_receivable = vendor_price`). Records MoMo reference. Resend email to seller.

## <span style="color:#D1148A">16.2 COD Flow</span>

1. Buyer selects COD. Order created: `PENDING_COD`, `commission_status = PENDING`.
2. Seller acknowledges → `PROCESSING` → `READY_FOR_PICKUP`.
3. Admin assigns rider → `IN_TRANSIT` → OTP generated → buyer OTP email.
4. Rider collects item from seller. Delivers to buyer. Rider collects cash. Buyer provides OTP. Rider submits OTP → `DELIVERED`.
5. Admin confirms cash. Marks `COMPLETED`. Commission deducted from rider-collected cash. Remainder (`vendor_price`) paid to seller.

---

<br/>

<a name="17"></a>

# <span style="color:#5D1A89">17. Out of Scope for V1</span>

| Feature | Rationale | Target Version |
|---|---|---|
| Automated seller payouts (Paystack Transfer API) | Requires business-tier Paystack account. Manual MoMo sufficient. | V2 |
| Multi-vendor cart | Complex payment splitting. | V2 |
| In-app buyer-seller messaging | Prohibited by Zero Communication Policy. | Never (policy decision) |
| Seller contact info revealed to buyer | Prohibited by Zero Communication Policy. | Never (policy decision) |
| Seller tier self-upgrade | New document submission workflow needed. | V1.1 |
| Liveness detection / selfie (Smile Identity) | Document-only KYC acceptable for V1. | V2 |
| Native iOS / Android app | PWA + Rider web dashboard sufficient. | V3 |
| Dispute resolution workflow | Admin handles via email in V1. | V2 |
| Seller subscription tiers / featured listings | Commission model simpler to operate solo. | V2 |
| Subdomain storefronts (`kofi.ushopgh.com`) | Requires Vercel Pro + wildcard TLS. | V2 |
| Real-time notifications (WebSocket / SSE) | Resend emails sufficient for V1. | V2 |
| Typesense / Meilisearch | PG full-text sufficient at V1 catalogue size. | V2 |
| KNUST + non-Accra universities | V1: 4 Accra institutions only. | V2 |
| OAuth (Google/GitHub sign-in) | Better Auth supports this natively — deferred to V1.1. | V1.1 |

---

<br/>

<a name="18"></a>

# <span style="color:#5D1A89">18. Monetisation Model</span>

## <span style="color:#D1148A">18.1 V1 Revenue Streams</span>

| Stream | Rate | Who Pays | Status |
|---|---|---|---|
| Transaction Commission (Student) | 5% gross-up embedded in `listing_price` | Buyer (higher listing price) | Active Day 1 |
| Transaction Commission (Business/Individual) | 8% gross-up embedded in `listing_price` | Buyer | Active Day 1 |
| Delivery Fee Margin | Platform takes a cut of the delivery fee; remainder to rider | Buyer (explicit checkout line) | Active Day 1 |

## <span style="color:#D1148A">18.2 Revenue Projection (Month 3 Post-Launch)</span>

| Source | Volume | Unit Revenue | Monthly |
|---|---|---|---|
| Student commission (5%) | 40 sellers × GHS 200 avg GMV | ~GHS 10.53 / order | GHS ~420 |
| Business/Individual commission (8%) | 10 sellers × GHS 200 avg GMV | ~GHS 17.39 / order | GHS ~174 |
| Delivery fee margin (platform cut) | ~100 dispatched orders × GHS 5 platform cut | GHS 5 / delivery | GHS ~500 |
| **TOTAL** | | | **GHS ~1,094 / month** |

> At GHS 1,094/month (~$73 USD), the platform covers AWS S3 (~$0.50/mo) from Month 1 and builds reserves for post-free-tier RDS costs.

---

<br/>

<a name="19"></a>

# <span style="color:#5D1A89">19. Non-Functional Requirements</span>

| Category | V1 Target | Implementation |
|---|---|---|
| **Performance** | Lighthouse ≥ 70 (mobile). LCP < 2.5s on 3G. | Next.js Server Components. `next/image` WebP. Cloudflare edge caching. |
| **Availability** | 99% uptime SLO (best-effort, Vercel Hobby). | UptimeRobot. Sentry. Vercel auto-restart. |
| **Scalability** | 1,000 concurrent users without re-architecture. | Vercel serverless auto-scales. RDS handles 1k connections on t2.micro. |
| **Security** | OWASP Top 10 compliance. HTTPS everywhere. | Cloudflare TLS. Zod server-side validation. Better Auth secure cookies. Rate limiting on auth routes. |
| **Auth Security** | Sessions instantly revocable. Password hashing managed by library. | Better Auth sessions in PostgreSQL. `betterAuth.api.revokeSession()` available. Argon2id via Better Auth. |
| **OTP Security** | OTP never stored in plaintext. 4h TTL. 5-attempt lockout. | bcrypt hash (rounds: 10). `crypto.randomInt`. `otp_expires_at` DB field. |
| **Zero Contact** | Seller contact fields absent from all buyer-facing API responses. | Enforced at Prisma `select` level. 0 violations target (G-08). |
| **Data Privacy** | KYC docs never publicly accessible. | Private S3. Block All Public Access. IAM least-privilege. 15-min presigned URLs. Access logged. |
| **Mobile-First** | Full Rider Dashboard + buyer flow at 360px. | Tailwind responsive. 48px minimum touch targets. Tested on Android Chrome. |
| **Email Reliability** | > 95% deliverability. | Resend with SPF/DKIM/DMARC on `ushopgh.com` via Cloudflare. |
| **CI/CD** | Zero broken builds merged to `main`. | GitHub Actions blocks PR on typecheck / lint / Prisma validation failure. |
| **Error Observability** | 100% of unhandled server errors captured. | `@sentry/nextjs`. Error boundaries on client components. |
| **Cost** | Total AWS spend < $1/month. | RDS free tier. S3 minimal. Vercel free. Resend free. GitHub Student Pack. |

---

<br/>

<a name="20"></a>

# <span style="color:#5D1A89">20. Assumptions & Constraints</span>

## <span style="color:#D1148A">Assumptions</span>

- Paystack supports MTN MoMo, Vodafone Cash, AirtelTigo Money, Visa, and Mastercard throughout V1.
- Sellers, buyers, and riders all have Android smartphones with Chrome and campus Wi-Fi or mobile data.
- Richard Nuhu performs the ADMIN role. No separate hire needed at V1 scale.
- `better-auth` v1.x API is stable throughout the 3-month build.
- Resend free tier (3,000 emails/month) is sufficient for all V1 email volume.
- Vercel Hobby tier (free, 10s function timeout) is sufficient for all V1 API operations when designed correctly.
- 5–10 platform-vetted riders can be recruited before launch.

## <span style="color:#D1148A">Constraints</span>

- **Solo developer** (Richard Nuhu): all features must be buildable and maintainable in 3 months.
- **$140 AWS credits**: all AWS infra (RDS + S3) must fit within this envelope.
- **Vercel Hobby 10s timeout**: all S3 ops and email sends are strictly async/non-blocking.
- **Zero buyer-seller communication**: policy decision, not a technical limitation. No feature that exposes seller contact to buyer may be shipped.
- **4 approved institutions**: V1 student tier limited to GCTU, UG, UPSA, ATU.
- **No automated payouts**: manual MoMo via admin in V1.
- **Storefront handle**: immutable post-approval.
- **RIDER accounts**: admin-created only.

---

<br/>

<a name="21"></a>

# <span style="color:#5D1A89">21. Risk Register</span>

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Better Auth breaking changes mid-build | Low | High | Pin `better-auth` version in `package.json`. Review changelog before upgrading. |
| Off-platform transactions (sellers solicit buyers outside platform) | High | High | Zero Communication Policy removes the mechanism. Gross-up model means sellers have no financial incentive to go off-platform (they receive full vendor price either way). |
| Rider no-shows or delayed delivery | Medium | High | 5–10 vetted riders. Admin can reassign. OTP expiry (4h) with admin regeneration. SLA target: 90% first-attempt delivery. |
| OTP brute-force attack | Low | High | 5-attempt lockout. bcrypt hash. 4h expiry. Sentry alert on 5 failures. Rate limiting on `/api/orders/{id}/verify-otp`. |
| Fake KYC document submissions | Medium | High | Admin manual review. `.edu.gh` OTP is independent signal for students. V2: Smile Identity. |
| Vercel Hobby 10s timeout breach | Low | Medium | All S3 + email ops are async. API handlers are lean. Escalation path: Vercel Pro ($20/mo). |
| Cold start: insufficient sellers at launch | High | High | Richard pre-recruits 10 seed sellers. Zero-commission first 30 days. |
| AWS RDS free tier expiry (Month 12+) | Certain | Medium | $140 credits cover ~9 months post-free-tier. Commission revenue targets exceed infra cost by Month 3. |
| Paystack webhook missed | Low | High | Idempotency keys. Paystack 3-retry policy. Admin reconciliation report. |
| KYC data breach | Low | Critical | Private S3. Block All Public Access. IAM least-privilege. Presigned URL access log. |
| Solo developer burnout / scope creep | High | High | Zero-scope-creep rule after Phase 1. GitHub Actions surfaces regressions. P2 features strictly deferred. |

---

<br/>

<a name="22"></a>

# <span style="color:#5D1A89">22. Glossary</span>

| Term | Definition |
|---|---|
| **Better Auth** | The authentication library (`better-auth`) used in v1.3. Manages sessions, password hashing, email verification, and RBAC. Replaces custom JWT. |
| `@better-auth/prisma-adapter` | Connects Better Auth to the PostgreSQL database via Prisma ORM. Sessions, accounts, and verifications are stored in AWS RDS. |
| **Session** | A Better Auth session stored in the `Session` table in PostgreSQL. Contains a session token (in HttpOnly cookie), expiry, and user reference. |
| **GMV** | Gross Merchandise Volume — total `checkout_price` value of all transactions. |
| **Vendor Price** | The price a seller enters. The exact amount they will receive (`seller_receivable`). |
| **Listing Price** | `vendor_price / (1 - commission_rate)`. The price displayed to buyers. |
| **Checkout Price** | `listing_price + delivery_fee`. Subtotal before Paystack fee. |
| **Total Due** | `checkout_price + paystack_fee`. Full amount buyer pays. |
| **Gross-Up Model** | Commission embedded in buyer-facing price. Seller always receives their exact vendor price. |
| **Paystack Fee** | `(1.95% × checkout_price) + GHS 0.50`. Explicit line item at checkout. Paid to Paystack. |
| **Managed Dispatch** | U-Shop's logistics model: platform-vetted riders fulfil all deliveries. |
| **OTP** | 4-digit numeric code generated on `IN_TRANSIT`. Emailed to buyer. Rider submits at doorstep. |
| **Zero Communication Policy** | V1.3 policy: no communication between buyers and sellers via any channel. Buyers communicate with Rider (IN_TRANSIT) or Admin (disputes) only. |
| **RBAC** | Role-Based Access Control. Four roles: ADMIN, SELLER, BUYER, RIDER. Managed by Better Auth RBAC plugin. |
| **Presigned URL** | 15-minute AWS S3 URL for admin-only access to private KYC documents. Access logged. |
| **State Machine** | 7-state order lifecycle. Illegal transitions rejected with `HTTP 422`. |
| **KYC** | Know Your Customer — seller identity verification. Documents stored in private S3. |
| **Storefront** | Seller's branded page at `ushopgh.com/store/{handle}`. |
| **Handle** | Seller's unique URL-safe identifier (3–30 chars). Immutable post-approval. |
| **P0 / P1 / P2** | Feature priority: P0 = launch blocker. P1 = significant V1 value. P2 = deferred. |
| **GitHub Student Developer Pack** | Free GitHub Pro + Actions minutes for Richard Nuhu's student account. Used for CI/CD. |

---

<br/>

<a name="23"></a>

# <span style="color:#5D1A89">23. Document History</span>

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | Jun 2026 | Richard Nuhu | Initial PRD. Product vision, personas, feature scope, flat 5% commission (net-deduction), React/Vite/Express, single-tier verification, peer-arranged delivery. |
| 1.1 | Jun 2026 | Richard Nuhu | Next.js + Vercel + Resend. 3-tier KYC (selfie removed). Gross-up commission (5% Student / 8% Business). COD GHS 50 enforcement. Private S3 KYC + presigned URLs. S3 image cleanup. Timeline defined. |
| 1.2 | Jun 2026 | Richard Nuhu | Author named. GitHub Actions + Sentry mandated. 4-institution list. Paystack fee as explicit line item. COD enforcement removed. Managed Dispatch + 7-state machine. OTP delivery. RIDER role + RBAC. Rider Dashboard. Escrow-First communication. |
| **1.3** | **Jun 2026** | **Richard Nuhu** | **Auth pivot: `better-auth` + `@better-auth/prisma-adapter` replaces custom JWT entirely. Chapter 12 (Escrow-First) removed. Zero Buyer-Seller Communication Policy introduced: no contact info shared between buyers and sellers, no in-app messaging. Rider phone revealed to buyer only during `IN_TRANSIT`. RBAC now powered by Better Auth RBAC plugin. All v1.2 core systems (7-state machine, OTP, Managed Dispatch, Rider Dashboard, KYC, Pricing Engine) retained.** |

---

<br/>

<div align="center">

<p style="color:#94A3B8; font-style:italic;">— End of Document —</p>
<p style="color:#94A3B8; font-style:italic; font-size:0.85em;">U-Shop PRD v1.3 &nbsp;·&nbsp; Author: Richard Nuhu &nbsp;·&nbsp; ushopgh.com &nbsp;·&nbsp; Confidential</p>
<br/>
<span style="background:#FF0000; color:#FFFFFF; padding: 2px 10px; font-weight:900; border-radius:3px;">U</span>&nbsp;<span style="color:#5D1A89; font-weight:900;">sh</span><span style="color:#D1148A; font-weight:900;">op</span>

</div>
