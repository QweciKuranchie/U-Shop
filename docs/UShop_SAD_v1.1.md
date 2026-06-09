<!-- ================================================================
     U-SHOP — SYSTEM ARCHITECTURE DOCUMENT (SAD) v1.1
     Author  : Richard Nuhu
     Date    : June 9, 2026 (Patch Release — Production Fixes)
     Derived From: PRD v1.3 · SRD v1.1
     ================================================================ -->

<div align="center">

<br/>

<h1>
  <span style="background:#FF0000;color:#FFFFFF;padding:4px 16px;font-size:2.2rem;font-weight:900;border-radius:4px;">U</span>&nbsp;<span style="color:#5D1A89;font-size:2.2rem;font-weight:900;">sh</span><span style="color:#D1148A;font-size:2.2rem;font-weight:900;">op</span>
</h1>

<h2 style="color:#5D1A89;margin-top:0.5rem;">System Architecture Document</h2>
<p style="color:#D1148A;font-weight:600;font-size:1.05rem;">Version 1.1 — Principal Architecture Reference</p>

<br/>

| Field | Value |
|---|---|
| **Document** | System Architecture Document (SAD) |
| **Version** | 1.1 |
| **Author** | Richard Nuhu |
| **Derived From** | PRD v1.3 · SRD v1.1 |
| **Date** | June 9, 2026 — Patch Release — Production Bottleneck Fixes |
| **Status** | Approved — Architecture Baseline |
| **Stack** | Next.js 15 (App Router) · Vercel · AWS RDS · AWS S3 · Better Auth · Prisma · Paystack · Resend · Sentry · @vercel/functions |

</div>

---

<br/>

# <span style="color:#5D1A89;">Table of Contents</span>

| § | Section |
|---|---|
| 0 | [Document Control](#s0) |
| 1 | [High-Level Infrastructure Topology](#s1) |
| 2 | [Authentication & Security Architecture](#s2) |
| 3 | [Data Storage & Asset Management Strategy](#s3) |
| 4 | [Core Data Flow Diagrams](#s4) |
| 5 | [Entity-Relationship Blueprint](#s5) |
| 6 | [DevOps & Observability Pipeline](#s6) |
| 7 | [Architecture Decision Records](#s7) |
| 8 | [Document History](#s8) |

---

<br/>

<a name="s0"></a>

# <span style="color:#5D1A89;">0. Document Control</span>

## <span style="color:#D1148A;">0.1 Purpose</span>

This System Architecture Document (SAD) defines the structural decomposition, component interactions, data flows, and infrastructure topology for U-Shop v1 MVP. It is the authoritative reference for all engineering decisions made during the June–August 2026 build sprint. Where this document conflicts with the PRD or SRD, the SRD takes precedence for implementation specifics; this SAD governs component boundaries and interaction contracts.

## <span style="color:#D1148A;">0.2 Architectural Principles</span>

| Principle | Application |
|---|---|
| **Unified Full-Stack** | A single Next.js 15 repository is the entire platform — no separate API server, no microservices. Server Components, Route Handlers, and Server Actions replace a standalone Express backend. |
| **Zero Trust at the API Layer** | Every Route Handler independently verifies the Better Auth session. Middleware is a UX gate, not a security gate. Server-side role checks are non-negotiable. |
| **Immutable Pricing Snapshots** | All monetary fields are captured as `Decimal(10,2)` at order creation time. No float arithmetic. Historic orders are never retroactively recalculated. |
| **Zero Buyer-Seller Communication** | No `Message` model exists. Seller contact fields (`whatsappNumber`, `phone`) are excluded at the Prisma `select` level in all buyer-facing queries. Enforced in data layer, not just UI. |
| **Async-Safe Serverless** | All S3 mutations and email dispatches are non-blocking (Vercel `waitUntil()` or fire-and-forget after API response). No operation that could exceed Vercel's 10-second function timeout is awaited in the critical path. `setImmediate` is prohibited. |
| **Cost-Bounded by Design** | AWS RDS free tier (12 months) + Prisma Accelerate pooling + Vercel Hobby (free) + Resend free tier = ~$0.50/month fixed infra cost. Every architectural choice is evaluated against this constraint. |

## <span style="color:#D1148A;">0.3 Reference Documents</span>

| Document | Version | Status |
|---|---|---|
| Product Requirements Document (PRD) | 1.3 | Approved |
| System Requirements Document (SRD) | 1.1 | Approved |
| System Architecture Document (SAD) | **1.1** | **This document** |

---

<br/>

<a name="s1"></a>

# <span style="color:#5D1A89;">1. High-Level Infrastructure Topology</span>

## <span style="color:#D1148A;">1.1 End-to-End Architecture Diagram</span>

```mermaid
graph TB
    subgraph CLIENT["CLIENT LAYER"]
        BROWSER["Android Chrome / Desktop\nBuyer · Seller · Admin · Rider"]
        PWA["PWA Shell\nnext-pwa service worker\nOffline cache for Rider Dashboard"]
    end

    subgraph EDGE["EDGE LAYER — Cloudflare (Free)"]
        DNS["DNS Resolution\nushopgh.com → Vercel origin"]
        CDN["Edge Cache\nStatic assets · CSS · JS bundles"]
        TLS["TLS Termination\nAuto-HTTPS · HTTP/2"]
        DDOS["DDoS Mitigation\nRate limiting · Bot protection"]
    end

    subgraph COMPUTE["COMPUTE LAYER — Vercel Hobby Tier"]
        direction TB
        MW["Next.js Middleware\nEdge Runtime — <1ms cold start\nLightweight session cookie presence gate\nNo Prisma / No database lookup"]
        subgraph NEXTJS["Next.js 15 App Router (Node.js Runtime)"]
            RSC["Server Components\nSSR · Prisma data fetch\nNo client bundle cost"]
            RH["API Route Handlers\n/api/auth/[...all]\n/api/webhooks/paystack\n/api/orders/[id]/*\n/api/kyc/presigned-url\n/api/health"]
            ACT["Server Actions\nForm mutations\nKYC uploads\nProduct CRUD"]
        end
    end

    subgraph DATA["DATA LAYER — AWS"]
        subgraph POOL["Connection Pooling"]
            ACCEL["Prisma Accelerate\nManaged connection proxy\nPrevents serverless conn exhaustion"]
        end
        subgraph RDS_CLUSTER["AWS RDS"]
            RDS[("PostgreSQL 15\ndb.t2.micro\n≤87 max_connections\nBetter Auth sessions\nOrders · Products · KYC keys")]
        end
        subgraph S3_BUCKETS["AWS S3"]
            S3PUB["ushop-product-images\nPublic Read\nWebP product images\nSeller avatars · covers"]
            S3PRIV["ushop-kyc-documents\n⛔ Block All Public Access\nSSE-AES256 at rest\nStudent IDs · Ghana Cards"]
        end
    end

    subgraph THIRD["THIRD-PARTY API LAYER"]
        PS["Paystack\nMoMo · Visa · MC\nWebhook: charge.success"]
        RE["Resend\nReact Email templates\n3,000 emails/month free"]
        SENTRY["Sentry\n@sentry/nextjs\nError + performance APM"]
        UPTIME["UptimeRobot\n5-min ping\nDowntime alerts"]
    end

    BROWSER --> CDN
    PWA --> CDN
    CDN --> TLS
    TLS --> DDOS
    DDOS --> MW
    MW --> NEXTJS
    RSC --> ACCEL
    RH --> ACCEL
    ACT --> ACCEL
    ACCEL --> RDS
    RH --> S3PUB
    ACT --> S3PUB
    ACT --> S3PRIV
    RH --> S3PRIV
    RH --> PS
    RH --> RE
    RSC --> RE
    NEXTJS -.->|"unhandled exceptions\nperformance spans"| SENTRY
    COMPUTE -.->|"health check"| UPTIME
    PS -->|"webhook POST"| RH
```

## <span style="color:#D1148A;">1.2 Layer Responsibilities</span>

### Edge Layer — Cloudflare

The edge layer handles all concerns that must be resolved before a request touches application code. This is purely infrastructure — no business logic resides here.

| Responsibility | Implementation |
|---|---|
| DNS resolution | `A` record pointing `ushopgh.com` to Vercel's assigned IPs |
| TLS termination | Cloudflare Universal SSL; all HTTP → HTTPS redirects enforced at edge |
| Static asset caching | `Cache-Control: public, max-age=31536000, immutable` on Next.js `/_next/static/*` |
| DDoS mitigation | Cloudflare free tier provides Layer 3/4 protection and basic Layer 7 rate limiting |
| Origin shielding | Vercel's real IP is never exposed; all traffic proxied through Cloudflare |

### Compute Layer — Vercel (Next.js 15)

Vercel executes the application as a collection of serverless Node.js functions (one per route or route group). The Edge Runtime is used exclusively for `middleware.ts` due to its sub-millisecond cold start and geographic distribution.

| Runtime | Used For | Timeout |
|---|---|---|
| **Edge Runtime** | `middleware.ts` (Lightweight cookie check only) | ~50ms |
| **Node.js Runtime** | All Server Components, Route Handlers, Server Actions | 10s (Hobby) |

> ⚠️ **Critical Constraint:** Every Node.js serverless function on Vercel Hobby tier has a hard 10-second execution timeout. Background operations (such as S3 image cleanup) MUST use Vercel's `waitUntil()` helper to prevent Lambda freeze after the HTTP response has been sent.

### Data Layer — AWS

AWS is used exclusively for persistent data storage. No compute runs on AWS in V1 — the `db.t2.micro` instance is accessed via Prisma Accelerate and never directly from client code.

| Service | Role | Access Pattern |
|---|---|---|
| AWS RDS PostgreSQL | Primary datastore — all relational data | Prisma ORM via Accelerate pooler |
| `ushop-product-images` | Publicly readable product photos | Direct URL reads; app writes via AWS SDK |
| `ushop-kyc-documents` | Private identity documents | App writes only; admin reads via presigned URL |

### Third-Party API Layer

All third-party services are called exclusively from server-side code (Route Handlers, Server Actions, Server Components). No third-party API key is ever exposed to the browser.

| Service | Integration Point | Direction |
|---|---|---|
| Paystack | `/api/webhooks/paystack` receives events; checkout page initialises Inline JS | Inbound (webhook) + Outbound (API) |
| Resend | Called from Route Handlers and Server Actions | Outbound only |
| Sentry | `@sentry/nextjs` SDK instruments all Node.js functions automatically | Outbound (error/perf data) |

## <span style="color:#D1148A;">1.3 Prisma Accelerate Connection Pool Topology</span>

```mermaid
graph LR
    subgraph VERCEL["Vercel — Concurrent Function Invocations"]
        F1["Function Instance 1\nPrisma Client"]
        F2["Function Instance 2\nPrisma Client"]
        F3["Function Instance 3\nPrisma Client"]
        FN["Function Instance N\nPrisma Client"]
    end

    subgraph ACCELERATE["Prisma Accelerate (Managed Proxy)"]
        POOL["Connection Pool\nMax 15 persistent connections\nto RDS — well within 87-conn limit"]
    end

    subgraph AWS_RDS["AWS RDS — db.t2.micro"]
        PG[("PostgreSQL 15\nmax_connections ≈ 87\n1 GB RAM")]
    end

    F1 -->|"DATABASE_URL\nprisma://accelerate..."| POOL
    F2 -->|"DATABASE_URL\nprisma://accelerate..."| POOL
    F3 -->|"DATABASE_URL\nprisma://accelerate..."| POOL
    FN -->|"DATABASE_URL\nprisma://accelerate..."| POOL
    POOL -->|"TCP persistent\n≤15 connections"| PG
```

**Problem solved:** Without Prisma Accelerate, each of N concurrent Vercel function invocations would open a new TCP connection to RDS. At 88+ concurrent requests, the `max_connections` limit is breached and new queries begin failing with `too many clients`. Accelerate maintains a warm pool of ≤15 connections to RDS regardless of how many Vercel function instances run simultaneously.

---

<br/>

<a name="s2"></a>

# <span style="color:#5D1A89;">2. Authentication & Security Architecture</span>

## <span style="color:#D1148A;">2.1 Better Auth Integration Architecture</span>

```mermaid
graph TB
    subgraph CLIENT_SIDE["Client Side (Browser)"]
        CC["Client Component\nauthClient.signIn.email()\nauthClient.signUp.email()\nuseSession() hook"]
    end

    subgraph NEXTJS_APP["Next.js Application (Vercel)"]
        MW["middleware.ts\nEdge Runtime\nLightweight cookie check"]
        CATCH_ALL["app/api/auth/[...all]/route.ts\ntoNextJsHandler(auth)\nHandles all /api/auth/* routes"]
        SC["Server Components\nRoute Handlers\nServer Actions\nauth.api.getSession()\nAuthoritative security gate"]
        AUTH_CONF["lib/auth.ts\nbetterAuth({ ... })\nCore configuration"]
    end

    subgraph BETTER_AUTH_CORE["Better Auth Runtime"]
        SESSION_MGR["Session Manager\nOpaque token generation\nCookie: better-auth.session_token\nHttpOnly · Secure · SameSite=lax"]
        PWD_HASH["Password Handler\nArgon2id hashing\nVerification on sign-in"]
        EMAIL_VER["Email Verification\nToken generation → Resend"]
        ADAPTER["@better-auth/prisma-adapter\nTranslates BA ops → Prisma queries"]
    end

    subgraph POSTGRES["AWS RDS PostgreSQL"]
        USERS_TBL[("users\nid · email · role\nemailVerified")]
        SESSIONS_TBL[("sessions\ntoken (UK) · expiresAt\nuserId (FK)")]
        ACCOUNTS_TBL[("accounts\npassword hash\nproviderId")]
        VERIF_TBL[("verifications\nidentifier · value\nexpiresAt")]
    end

    CC -->|"POST /api/auth/sign-in/email"| CATCH_ALL
    CC -->|"POST /api/auth/sign-up/email"| CATCH_ALL
    CATCH_ALL --> AUTH_CONF
    AUTH_CONF --> SESSION_MGR
    AUTH_CONF --> PWD_HASH
    AUTH_CONF --> EMAIL_VER
    AUTH_CONF --> ADAPTER
    ADAPTER --> USERS_TBL
    ADAPTER --> SESSIONS_TBL
    ADAPTER --> ACCOUNTS_TBL
    ADAPTER --> VERIF_TBL
    SESSION_MGR -->|"Set-Cookie: session_token"| CC
    SC -->|"auth.api.getSession()"| AUTH_CONF
    AUTH_CONF -->|"SELECT sessions JOIN users"| SESSIONS_TBL
```

## <span style="color:#D1148A;">2.2 Session Lifecycle — Sign-In Flow</span>

```mermaid
sequenceDiagram
    autonumber
    participant C as Client Component
    participant API as /api/auth/sign-in/email
    participant BA as Better Auth Core
    participant DB as PostgreSQL

    C->>API: POST { email, password }
    API->>BA: betterAuth handler (via toNextJsHandler)
    BA->>DB: SELECT * FROM accounts WHERE email = ?
    DB-->>BA: Account record (password hash)
    BA->>BA: Argon2id verify(password, hash)
    alt Password invalid
        BA-->>C: 401 Unauthorized { error: "INVALID_CREDENTIALS" }
    end
    BA->>DB: INSERT INTO sessions (token, userId, expiresAt)
    DB-->>BA: Session created
    BA-->>C: 200 OK\nSet-Cookie: better-auth.session_token=<opaque>\nHttpOnly; Secure; SameSite=lax; Max-Age=604800
    Note over C: Session token stored in HttpOnly cookie.\nNever accessible to JavaScript.
```

## <span style="color:#D1148A;">2.3 RBAC Middleware Gate — Request Flow</span>

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (Browser)
    participant CF as Cloudflare Edge
    participant MW as middleware.ts (Edge Runtime)
    participant APP as Server Component / Route Handler (Node.js)
    participant BA as Better Auth (Node.js)
    participant DB as PostgreSQL (sessions)

    C->>CF: GET /seller/dashboard\nCookie: better-auth.session_token=abc123
    CF->>MW: Forward request (headers preserved)
    Note over MW: Check if request is for protected route<br/>and better-auth.session_token cookie exists

    alt Cookie missing
        MW-->>C: 307 Redirect → /login?callbackUrl=/seller/dashboard
    else Cookie exists
        MW->>APP: Forward request (NextResponse.next())
        Note over APP: Authoritative security boundary
        APP->>BA: auth.api.getSession({ headers })
        BA->>DB: SELECT s.*, u.role FROM sessions s<br/>JOIN users u ON s.user_id = u.id<br/>WHERE s.token = 'abc123'<br/>AND s.expires_at > NOW()
        DB-->>BA: { user: { id, email, role: "seller" } }
        BA-->>APP: Session object

        alt Session invalid/expired
            APP-->>C: 307 Redirect → /login
        else Wrong role (e.g. "buyer" on /seller/*)
            APP-->>C: 307 Redirect → /unauthorized
        else Correct role ("seller" on /seller/*)
            APP-->>C: 200 Render seller dashboard
        end
    end
```

## <span style="color:#D1148A;">2.4 RBAC Route Guard Matrix</span>

| Route Prefix | Required Role(s) | Unauthorised Redirect | Notes |
|---|---|---|---|
| `/admin/*` | `admin` | `/unauthorized` | All admin API sub-routes also verified server-side via `requireRole()` |
| `/seller/*` | `seller` | `/unauthorized` | Seller pages; data scoped to `sellerProfile.userId = session.user.id` |
| `/rider/*` | `rider` | `/unauthorized` | Mobile-optimised OTP dashboard |
| `/account/*` | `buyer`, `seller`, `admin` | `/login` | Order history, profile settings |
| `/api/auth/*` | Public | — | Better Auth catch-all handler |
| `/api/webhooks/paystack` | Public (HMAC-verified) | — | No session required; authenticated via HMAC-SHA512 |
| All others | Public | — | Product browsing, storefronts |

> ⚠️ **Authoritative Guard Rule:** Middleware is a lightweight UX gate only that checks cookie presence (§2.5 of SRD). Every protected Server Component, Route Handler, and Server Action must independently verify authentication and roles via `auth.api.getSession()` before processing requests or rendering views.

## <span style="color:#D1148A;">2.5 Security Threat Model Summary</span>

| Threat | Mitigation |
|---|---|
| Session token theft | HttpOnly cookie prevents JS access; `Secure` flag prevents HTTP transmission |
| Session fixation | Better Auth regenerates session token on sign-in |
| Timing attack on HMAC comparison | `crypto.timingSafeEqual()` used in Paystack webhook verification |
| Timing attack on OTP verification | `bcrypt.compare()` is inherently constant-time per hash computation |
| Brute-force on OTP | 5-attempt lockout per order; Sentry alert on lockout; OTP has 4-hour TTL |
| Privilege escalation (role self-assignment) | `role` field has `input: false` in Better Auth config; only admin server actions can update it |
| Path traversal on KYC keys | Presigned URL endpoint validates `s3Key.startsWith("kyc/")` before signing |
| SQL injection | Parameterised queries via Prisma ORM; raw queries use `Prisma.sql` tagged templates |
| CSRF | Better Auth `SameSite=lax` cookie; state-mutating API calls require active session |
| Seller contact data leak | Prisma `select` excludes `whatsappNumber` and `phone` in all buyer-facing queries |

---

<br/>

<a name="s3"></a>

# <span style="color:#5D1A89;">3. Data Storage & Asset Management Strategy</span>

## <span style="color:#D1148A;">3.1 Dual S3 Bucket Architecture</span>

```mermaid
graph TB
    subgraph APP["Next.js Application (Vercel)"]
        SA["Server Action\nKYC Upload"]
        PROD_UP["Server Action\nProduct Image Upload"]
        PROD_DEL["Route Handler\nProduct Delete → async cleanup"]
        PRESIGN["Route Handler\n/api/kyc/presigned-url\n(ADMIN only)"]
    end

    subgraph IAM["AWS IAM (Least-Privilege)"]
        IAM_USER["IAM User: ushop-app-server\nNo console access\nKey/Secret in Vercel env secrets"]
        IAM_POL["Policy: ushop-app-server-policy\nScoped per-bucket, per-action"]
    end

    subgraph PUBLIC_BUCKET["AWS S3: ushop-product-images"]
        direction LR
        PUB_CFG["✅ Public Read enabled\nBucket policy: s3:GetObject for *\nCORS: PUT from ushopgh.com\nCacheControl: immutable 1yr"]
        PUB_OBJ["products/{sellerId}/{uuid}.webp\nsellers/{sellerId}/avatar.webp\nsellers/{sellerId}/cover.webp"]
    end

    subgraph PRIVATE_BUCKET["AWS S3: ushop-kyc-documents"]
        direction LR
        PRIV_CFG["⛔ Block All Public Access: TRUE\nVersioning: Enabled\nSSE: AES-256 default\nNo bucket policy — IAM only"]
        PRIV_OBJ["kyc/{sellerId}/student-id.jpg\nkyc/{sellerId}/ghana-card-front.jpg\nkyc/{sellerId}/ghana-card-back.jpg\nkyc/{sellerId}/business-reg.pdf"]
    end

    subgraph CDN_READ["Public Read Path"]
        DIRECT_URL["Direct S3 URL\nhttps://ushop-product-images\n.s3.af-south-1.amazonaws.com\n/products/{sellerId}/{uuid}.webp"]
    end

    subgraph ADMIN_READ["Admin-Only Read Path"]
        PRESIGNED["15-min Presigned URL\nhttps://ushop-kyc-documents\n.s3.af-south-1.amazonaws.com\n/kyc/...?X-Amz-Signature=..."]
    end

    PROD_UP -->|"PutObjectCommand\nWebP · max 1200px"| PUB_OBJ
    PROD_DEL -->|"DeleteObjectsCommand\n(async waitUntil)"| PUB_OBJ
    SA -->|"PutObjectCommand\nSSE-AES256 required"| PRIV_OBJ
    PRESIGN -->|"GetObjectCommand\ngetSignedUrl(900s)"| PRIV_OBJ
    PUB_OBJ --> DIRECT_URL
    PRIV_OBJ --> PRESIGNED
    IAM_USER --> IAM_POL
    IAM_POL --> PUBLIC_BUCKET
    IAM_POL --> PRIVATE_BUCKET
```

## <span style="color:#D1148A;">3.2 KYC Document Upload Flow</span>

```mermaid
sequenceDiagram
    autonumber
    participant S as Seller (Browser)
    participant SA as Server Action\n(Next.js)
    participant BA as Better Auth
    participant VALID as File Validator
    participant S3 as S3: ushop-kyc-documents
    participant DB as PostgreSQL

    S->>SA: FormData { file: File, sellerId }
    SA->>BA: auth.api.getSession()
    BA-->>SA: { user: { id, role: "seller" } }

    alt Not authenticated or wrong role
        SA-->>S: Error: FORBIDDEN (403)
    end

    SA->>VALID: Validate file
    Note over VALID: • MIME: image/jpeg, image/png, image/webp\n• Max size: 5 MB\n• Min dimensions: 400×300px

    alt File invalid
        SA-->>S: Error: INVALID_FILE (400)
    end

    SA->>SA: Generate S3 key\nkyc/{sellerId}/{uuid}.{ext}
    SA->>S3: PutObjectCommand {\n  Bucket: ushop-kyc-documents,\n  Key: "kyc/{sellerId}/{uuid}.jpg",\n  Body: fileBuffer,\n  ServerSideEncryption: "AES256",\n  ContentType: "image/jpeg"\n}
    S3-->>SA: ETag (upload confirmed)

    SA->>DB: UPDATE seller_profiles\nSET kyc_doc_keys = array_append(kyc_doc_keys, s3Key)\nWHERE user_id = ?

    DB-->>SA: Updated seller profile
    SA-->>S: { success: true, key: "kyc/..." }
```

## <span style="color:#D1148A;">3.3 KYC Document Read — Presigned URL Flow</span>

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin (Browser)
    participant API as /api/kyc/presigned-url\n(Route Handler)
    participant BA as Better Auth
    participant SDK as AWS SDK v3\n(S3Client + getSignedUrl)
    participant S3 as S3: ushop-kyc-documents
    participant LOG as kyc_access_logs\n(PostgreSQL)

    A->>API: POST { s3Key: "kyc/seller123/id.jpg" }
    Note over A: Admin clicks "View Document" (Lazy loaded)<br/>No URLs are pre-fetched during queue load.
    API->>BA: auth.api.getSession()
    BA-->>API: { user: { id: "admin01", role: "admin" } }

    alt Role !== "admin"
        API-->>A: 403 Forbidden
    end

    API->>API: Validate key prefix\ns3Key.startsWith("kyc/") ✓

    API->>SDK: GetObjectCommand {\n  Bucket: "ushop-kyc-documents",\n  Key: "kyc/seller123/id.jpg"\n}
    SDK->>SDK: HMAC-SHA256 sign\nusing IAM credentials\nexpiresIn: 900 seconds
    SDK-->>API: presignedUrl\n(embedded X-Amz-Signature,\nX-Amz-Expires=900)

    API->>LOG: INSERT kyc_access_logs {\n  adminUserId, s3ObjectKey,\n  ipAddress, accessedAt\n}

    API-->>A: { url: "https://...", expiresInSeconds: 900 }

    Note over A: Admin opens URL in new tab.\nURL self-destructs after 15 minutes.
    A->>S3: GET presignedUrl
    S3->>S3: Verify signature,\ncheck expiry (900s)
    S3-->>A: Document binary (image/jpeg)
```

## <span style="color:#D1148A;">3.4 Product Image Lifecycle</span>

```mermaid
graph LR
    subgraph UPLOAD["Upload Path"]
        U_ACT["Server Action\nuploadProductImage()"]
        SHARP["sharp.resize(1200px)\n.webp({ quality: 82 })"]
        S3W["S3 PutObjectCommand\nushop-product-images\nproducts/{sellerId}/{uuid}.webp\nCacheControl: immutable 1yr"]
        DB_KEY["Product.imageS3Keys\n+= [s3Key]\n(JSON array)"]
    end

    subgraph DELETE["Delete Path (2-Phase)"]
        D_API["Route Handler DELETE\n/api/products/[id]"]
        SOFT["Phase 1 (sync):\nproduct.status = DELETED\nproduct.deletedAt = NOW()\nReturn 200 immediately"]
        ASYNC["waitUntil(async () => {\n  // Phase 2 runs after response\n  // Max 3 retries + exponential backoff\n})"]
        S3D["S3 DeleteObjectsCommand\n(batch — all image keys)"]
        HARD["prisma.product.delete()\nHard-delete DB record\nafter S3 confirmed clean"]
        ERR["Sentry.captureException()\nFlag for manual cleanup\n(after 3 retry failures)"]
    end

    U_ACT --> SHARP --> S3W --> DB_KEY
    D_API --> SOFT --> ASYNC --> S3D
    S3D -->|"Success"| HARD
    S3D -->|"Failure × 3"| ERR
```

---

<br/>

<a name="s4"></a>

# <span style="color:#5D1A89;">4. Core Data Flow Diagrams</span>

## <span style="color:#D1148A;">4.1 Checkout & Paystack Webhook Flow</span>

```mermaid
sequenceDiagram
    autonumber
    participant B as Buyer (Browser)
    participant FE as Next.js\nCheckout Page
    participant PS_JS as Paystack\nInline.js
    participant PS_API as Paystack\nPayment Server
    participant WH as /api/webhooks/paystack\n(Route Handler)
    participant PRICE as lib/pricing.ts\ncomputeOrderPricing()
    participant DB as PostgreSQL\n(Prisma)
    participant RE as Resend\nEmail

    B->>FE: Click "Pay Now"\n(checkout_price + paystack_fee displayed)

    FE->>PS_JS: PaystackPop.setup({\n  key: NEXT_PUBLIC_PAYSTACK_KEY,\n  amount: totalCharged * 100,\n  email: buyer.email,\n  metadata: { productId, buyerId, deliveryFee }\n})
    PS_JS->>B: MoMo prompt / Card form popup
    B->>PS_API: Completes payment\n(MoMo PIN or card details)
    PS_API-->>B: Payment processed ✓
    PS_JS-->>FE: onSuccess callback\n{ reference: "REF_xxx" }
    FE-->>B: "Payment received — processing your order..."

    Note over PS_API,WH: Paystack fires webhook asynchronously\n(independent of browser callback)

    PS_API->>WH: POST /api/webhooks/paystack\nx-paystack-signature: HMAC-SHA512\n{ event: "charge.success", data: { reference, amount, metadata } }

    WH->>WH: rawBody = await request.text()\nexpectedHash = HMAC-SHA512(rawBody, SECRET_KEY)\ncrypto.timingSafeEqual(expected, received)

    alt Signature mismatch
        WH->>WH: Sentry.captureEvent("Webhook sig fail", warning)
        WH-->>PS_API: 401 Unauthorized
    end

    WH->>DB: SELECT FROM webhook_events\nWHERE paystack_ref = reference
    alt Already processed (idempotency)
        WH-->>PS_API: 200 { status: "already_processed" }
    end

    WH->>DB: INSERT webhook_events\n{ paystackRef: reference, processed: false }\n(UNIQUE constraint — blocks race condition)

    WH->>PRICE: computeOrderPricing({\n  vendorPrice, commissionRate, deliveryFee\n})
    PRICE-->>WH: Pricing snapshot\n(all Decimal(10,2))

    WH->>DB: BEGIN TRANSACTION\nCREATE order {\n  reference, buyerId, productId,\n  status: PAID, paidAt: NOW(),\n  paystackReference: reference,\n  ...pricingSnapshot\n}\nUPDATE webhook_events SET processed = true\nCOMMIT

    DB-->>WH: Order created ✓

    WH->>RE: sendEmail(buyer, OrderReceiptEmail)
    WH->>RE: sendEmail(seller, NewOrderEmail)
    Note over WH,RE: Emails are fire-and-forget\nvoid sendEmail() — non-blocking

    WH-->>PS_API: 200 { status: "ok" }
    Note over PS_API: Paystack stops retrying\nafter receiving 200
```

## <span style="color:#D1148A;">4.2 Managed Dispatch & OTP Delivery Flow</span>

```mermaid
sequenceDiagram
    autonumber
    participant SEL as Seller\n(Browser)
    participant SELL_API as /api/orders/[id]\nSELLER Route Handler
    participant AD as Admin\n(Browser)
    participant ADM_API as /api/orders/[id]/assign-rider\nADMIN Route Handler
    participant OTP_LIB as lib/otp.ts\ngenerateDeliveryOTP()
    participant DB as PostgreSQL
    participant RE as Resend
    participant BUY_EMAIL as Buyer\n(Email)
    participant R as Rider\n/rider/orders/[id]
    participant OTP_API as /api/orders/[id]/verify-otp\nRIDER Route Handler

    SEL->>SELL_API: PATCH { status: "PROCESSING" }\n(SELLER session)
    SELL_API->>SELL_API: assertValidTransition("PAID" → "PROCESSING", "seller")
    SELL_API->>DB: UPDATE orders SET status=PROCESSING, processedAt=NOW()
    SELL_API-->>SEL: 200 { status: "PROCESSING" }

    SEL->>SELL_API: PATCH { status: "READY_FOR_PICKUP" }
    SELL_API->>SELL_API: assertValidTransition("PROCESSING" → "READY_FOR_PICKUP", "seller")
    SELL_API->>DB: UPDATE orders SET status=READY_FOR_PICKUP, readyAt=NOW()
    SELL_API->>RE: sendEmail(admin, OrderReadyEmail)
    SELL_API-->>SEL: 200 { status: "READY_FOR_PICKUP" }

    AD->>ADM_API: POST { riderId: "rider01" }\n(ADMIN session)
    ADM_API->>ADM_API: requireRole(request, "admin")
    ADM_API->>ADM_API: assertValidTransition\n("READY_FOR_PICKUP" → "IN_TRANSIT", "admin")

    ADM_API->>OTP_LIB: generateDeliveryOTP()
    OTP_LIB->>OTP_LIB: rawInt = crypto.randomInt(0, 10000)\nraw = rawInt.toString().padStart(4, "0")\nhash = await bcrypt.hash(raw, 10)\nexpiresAt = NOW() + 4h
    OTP_LIB-->>ADM_API: { raw: "4821", hash: "$2b$10$...", expiresAt }

    ADM_API->>DB: UPDATE orders SET\n  status = IN_TRANSIT,\n  rider_id = "rider01",\n  otp_hash = "$2b$10$...",\n  otp_expires_at = expiresAt,\n  otp_attempts = 0,\n  in_transit_at = NOW()

    ADM_API->>RE: sendEmail(buyer, DeliveryOTPEmail\n{ otp: "4821", ref: "USH-20260610-A3F1" })
    Note over ADM_API,RE: raw OTP sent to buyer once\nthen discarded — never stored

    RE->>BUY_EMAIL: "Your U-Shop Delivery OTP: 4821\nGive this to your rider when they arrive."

    ADM_API-->>AD: 200 { status: "IN_TRANSIT", riderId }

    Note over R: Rider sees order appear\nin /rider dashboard
    R->>OTP_API: POST { otp: "4821" }\n(RIDER session)
    OTP_API->>OTP_API: requireRole(request, "rider")
    OTP_API->>DB: SELECT otp_hash, otp_expires_at,\notp_attempts, rider_id\nFROM orders WHERE id = ?

    OTP_API->>OTP_API: Verify order.rider.userId === session.user.id
    OTP_API->>OTP_API: Check expiry: NOW() < otp_expires_at ✓
    OTP_API->>OTP_API: Check attempts: 0 < 5 ✓
    OTP_API->>OTP_API: bcrypt.compare("4821", "$2b$10$...") → true

    OTP_API->>DB: UPDATE orders SET\n  status = DELIVERED,\n  otp_hash = NULL,\n  otp_expires_at = NULL,\n  delivered_at = NOW()

    OTP_API->>RE: sendEmail(buyer, OrderDeliveredEmail)
    OTP_API-->>R: 200 { success: true, status: "DELIVERED" }

    Note over R: Rider sees green success screen\n"Delivered — great work!"
```

## <span style="color:#D1148A;">4.3 Order Lifecycle State Machine</span>

```mermaid
stateDiagram-v2
    [*] --> PENDING_COD : COD checkout submitted
    [*] --> PAID : Paystack webhook ✓\nHMAC-SHA512 verified

    PENDING_COD --> PROCESSING : Seller acknowledges order\n[SELLER role]
    PAID --> PROCESSING : Seller acknowledges order\n[SELLER role]

    PROCESSING --> READY_FOR_PICKUP : Seller marks item packaged\n[SELLER role]

    READY_FOR_PICKUP --> IN_TRANSIT : Admin assigns rider\n[ADMIN role]\nOTP generated → bcrypt hash\nOTP emailed to buyer via Resend

    IN_TRANSIT --> DELIVERED : Rider submits OTP\n[RIDER role]\nbcrypt.compare() ✓\nOTP nullified in DB

    DELIVERED --> COMPLETED : Admin verifies + releases payout\n[ADMIN role]\nMoMo transfer to seller

    PAID --> DISPUTED : Issue raised\n[BUYER or ADMIN]
    PROCESSING --> DISPUTED : Issue raised\n[BUYER or ADMIN]
    READY_FOR_PICKUP --> DISPUTED : Issue raised\n[BUYER or ADMIN]
    IN_TRANSIT --> DISPUTED : Issue raised\n[BUYER or ADMIN]
    DELIVERED --> DISPUTED : Issue raised\n[BUYER or ADMIN]

    DISPUTED --> COMPLETED : Admin resolves → release payout\n[ADMIN role]
    DISPUTED --> CANCELLED : Admin cancels\n[ADMIN role]
    PENDING_COD --> CANCELLED : Admin cancels\n[ADMIN role]

    COMPLETED --> [*]
    CANCELLED --> [*]
```

---

<br/>

<a name="s5"></a>

# <span style="color:#5D1A89;">5. Entity-Relationship Blueprint</span>

## <span style="color:#D1148A;">5.1 Core ER Diagram</span>

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string name
        string role
        boolean emailVerified
        datetime createdAt
    }

    Session {
        string id PK
        string token UK
        datetime expiresAt
        string userId FK
        string ipAddress
        string userAgent
    }

    Account {
        string id PK
        string providerId
        string accountId
        string userId FK
        string password
    }

    Verification {
        string id PK
        string identifier
        string value
        datetime expiresAt
    }

    SellerProfile {
        string id PK
        string userId FK
        string handle UK
        string storeName
        enum tier
        enum status
        decimal commissionRate
        json kycDocKeys
        string whatsappNumber
        string phone
    }

    Rider {
        string id PK
        string userId FK
        string phone
        string zone
        boolean isActive
    }

    Product {
        string id PK
        string sellerId FK
        string title
        string description
        enum category
        enum condition
        decimal vendorPrice
        decimal listingPrice
        decimal commissionRate
        json imageS3Keys
        enum status
        datetime deletedAt
    }

    Order {
        string id PK
        string reference UK
        string buyerId FK
        string productId FK
        string riderId FK
        enum paymentMethod
        string paystackReference UK
        enum status
        decimal vendorPrice
        decimal listingPrice
        decimal commissionAmount
        decimal sellerReceivable
        decimal totalCharged
        string otpHash
        datetime otpExpiresAt
        int otpAttempts
        datetime paidAt
        datetime deliveredAt
        datetime completedAt
    }

    WebhookEvent {
        string id PK
        string paystackRef UK
        string event
        boolean processed
        string orderId FK
        json payload
        datetime receivedAt
    }

    Review {
        string id PK
        string orderId UK
        string buyerId
        string sellerId
        int rating
        string comment
    }

    Institution {
        string id PK
        string name
        json domains
        boolean isActive
    }

    KycAccessLog {
        string id PK
        string adminUserId
        string s3ObjectKey
        string ipAddress
        datetime accessedAt
    }

    User ||--o{ Session : "authenticates via"
    User ||--o{ Account : "linked to"
    User ||--o| SellerProfile : "may operate"
    User ||--o| Rider : "may be assigned as"
    User ||--o{ Order : "places as buyer"

    SellerProfile ||--o{ Product : "lists"

    Product ||--o{ Order : "fulfilled by"

    Rider ||--o{ Order : "delivers"

    Order ||--o{ WebhookEvent : "triggered by"
    Order ||--o| Review : "receives after COMPLETED"
```

## <span style="color:#D1148A;">5.2 Zero Buyer-Seller Communication — Enforced in Schema</span>

The strict zero-contact policy is **structurally enforced** in the data model, not just in UI logic:

| Enforcement Point | Implementation |
|---|---|
| **No `Message` model** | There is no chat, messaging, or contact table in the schema. It cannot be added without a migration. |
| **Contact fields on `SellerProfile`** | `whatsappNumber` and `phone` exist in the DB for admin use but are **excluded by default in all Prisma queries** serving buyer-facing endpoints via explicit `select` blocks. |
| **Rider phone** | Stored on `Rider` model. Returned in order detail API **only when** `order.status === "IN_TRANSIT"` AND `order.buyerId === session.user.id`. |
| **No buyer→seller FK on reviews** | The `Review` model captures `buyerId` and `sellerId` as strings but does not create a bidirectional communication path — it is write-once at `COMPLETED` state. |
| **API contract** | `GET /api/storefront/{handle}` Prisma query uses `select: { whatsappNumber: false, phone: false }`. Verified in integration tests. |

## <span style="color:#D1148A;">5.3 Key Schema Design Decisions</span>

| Decision | Rationale |
|---|---|
| `Order.otpHash` stores bcrypt hash, not raw OTP | Raw OTP is generated, emailed to buyer, then discarded. Only the hash persists. Prevents DB breach from exposing delivery OTPs. |
| `Order` has all pricing fields (`vendorPrice`, `listingPrice`, `commissionAmount`, etc.) | Immutable snapshot at order creation. `SellerProfile.commissionRate` can change without affecting historical order records. |
| `WebhookEvent.paystackRef` has `@unique` constraint | Database-level idempotency key. The second concurrent write of the same reference throws `P2002` and is safely rejected. |
| `SellerProfile.kycDocKeys` is `Json` (string array) | Stores S3 keys for up to 3 documents (student ID, Ghana card front/back, business doc). Flexible without a separate `KycDocument` table. |
| `Product.imageS3Keys` is `Json` (string array) | Stores up to 5 S3 keys. Retrieved atomically with the product for S3 cleanup on deletion. |
| `Rider` is a separate model (not just a User role) | Separates rider operational data (phone, zone, isActive) from the Better Auth `User` model. Admin manages rider records independently. |
| `Institution` stored in DB, not code | The approved `.edu.gh` institution list can be updated by admin via the dashboard without a code deployment or Vercel redeployment. |

---

<br/>

<a name="s6"></a>

# <span style="color:#5D1A89;">6. DevOps & Observability Pipeline</span>

## <span style="color:#D1148A;">6.1 CI/CD Architecture</span>

```mermaid
flowchart TB
    subgraph DEV["Developer Workstation"]
        CODE["Richard Nuhu\nlocal feature branch"]
    end

    subgraph GITHUB["GitHub Repository\nrichardnuhu/ushop"]
        PR["Pull Request\nfeature/* → main"]
        MAIN["main branch\n(protected — CI must pass)"]
    end

    subgraph CI["GitHub Actions: ci.yml\n(PR Validation Job)"]
        direction TB
        INSTALL["pnpm install\n--frozen-lockfile"]
        TSC["tsc --noEmit\nTypeScript check\n❌ BLOCKS MERGE on failure"]
        PRISMA_V["prisma validate\nSchema integrity\n❌ BLOCKS MERGE on failure"]
        LINT["eslint .\n--max-warnings 0\n❌ BLOCKS MERGE on failure"]
        TESTS["vitest run\n--reporter=verbose\n❌ BLOCKS MERGE on failure"]
    end

    subgraph DEPLOY["GitHub Actions: ci.yml\n(Deploy Job — main only)"]
        direction TB
        MIGRATE["prisma migrate deploy\nDIRECT_DATABASE_URL\nRDS migration via direct conn"]
        VB["Vercel Build\ntriggered via GitHub integration\nNext.js production build"]
        SENTRY_R["sentry-cli releases new\n$VERCEL_GIT_COMMIT_SHA\nSource maps uploaded"]
        SMOKE["curl GET /api/health\nassert HTTP 200\n❌ TRIGGERS ROLLBACK on failure"]
    end

    subgraph VERCEL_PROD["Vercel Production"]
        DEPLOY_LIVE["Live deployment\nhttps://ushopgh.com"]
        ROLLBACK["One-click rollback\nPrevious deployment\nre-promoted if smoke fails"]
    end

    subgraph MONITORING["Observability Stack"]
        SENTRY_DASH["Sentry Dashboard\nError tracking\nPerformance APM"]
        UPTIME_BOT["UptimeRobot\n5-min ping\nEmail/SMS alert"]
        DAILY["Daily Integrity Check\n00:00 UTC cron job\nOrphaned S3 · stale COD orders"]
    end

    CODE -->|"git push origin feature/X"| PR
    PR --> CI
    INSTALL --> TSC
    TSC --> PRISMA_V
    PRISMA_V --> LINT
    LINT --> TESTS
    TESTS -->|"All checks green\nPR approved"| MAIN
    MAIN --> DEPLOY
    MIGRATE --> VB
    VB --> SENTRY_R
    SENTRY_R --> SMOKE
    SMOKE -->|"200 OK"| DEPLOY_LIVE
    SMOKE -->|"Non-200"| ROLLBACK
    DEPLOY_LIVE --> SENTRY_DASH
    DEPLOY_LIVE --> UPTIME_BOT
    DEPLOY_LIVE --> DAILY
```

## <span style="color:#D1148A;">6.2 Sentry Instrumentation Architecture</span>

```mermaid
graph TB
    subgraph NEXT_APP["Next.js 15 Application"]
        subgraph SERVER_SIDE["Server-Side (Node.js Runtime)"]
            RH_WH["Route Handler:\n/api/webhooks/paystack\nHMAC failure capture"]
            RH_OTP["Route Handler:\n/api/orders/[id]/verify-otp\nMax-attempts warning capture"]
            RH_KYC["Route Handler:\n/api/kyc/presigned-url\nS3 presign failure capture"]
            RH_DEL["Route Handler:\nProduct DELETE\nS3 batch-delete retry failure"]
            PRISMA_ERR["Prisma Client\nDB connection timeout capture"]
            STATE_ERR["lib/state-machine.ts\nInvalidStateTransitionError capture"]
        end
        subgraph CLIENT_SIDE["Client-Side (Browser)"]
            CC_ERR["Client Components\nError boundaries\nUnhandled promise rejections"]
        end
        subgraph CONFIG["Sentry Config Files"]
            S_SERVER["sentry.server.config.ts\nDSN · beforeSend hook\nRedacts passwords/OTPs\nFilters and drops Prisma P2002 errors\nfrom Paystack webhook endpoint"]
            S_CLIENT["sentry.client.config.ts\nReplays on error: 1.0\nSession sample: 0.01"]
        end
    end

    subgraph SENTRY_PLATFORM["Sentry Cloud"]
        S_ISSUES["Issues\nGrouped by stack trace"]
        S_PERF["Performance\nTransaction traces\nSlowDB queries flagged"]
        S_REPLAYS["Session Replays\nError context for UI bugs"]
        S_ALERTS["Alerts\nEmail to richard@ushopgh.com\nOn: new issue, spike, regression"]
    end

    RH_WH -->|"throws P2002 on concurrent duplicate"| S_SERVER
    S_SERVER -.->|"P2002 from webhook dropped"| S_ISSUES
    RH_WH -->|"captureEvent(webhook sig fail)"| S_ISSUES
    RH_OTP -->|"captureMessage(OTP locked)"| S_ISSUES
    RH_KYC -->|"captureException(S3 error)"| S_ISSUES
    RH_DEL -->|"captureException(S3 batch delete)"| S_ISSUES
    PRISMA_ERR -->|"auto-instrumented\nPrisma query spans"| S_PERF
    STATE_ERR -->|"captureException(422)"| S_ISSUES
    CC_ERR -->|"global error boundary"| S_REPLAYS
    S_ISSUES --> S_ALERTS
    S_PERF --> S_ALERTS
```

## <span style="color:#D1148A;">6.3 Mandatory Sentry Capture Points</span>

| Location | Event | Sentry Level | Captured Fields |
|---|---|---|---|
| `verify-otp` Route Handler | `otpAttempts >= OTP_MAX_ATTEMPTS` | `warning` | `orderId`, `riderId`, `attempts` |
| `deleteProductImages()` | S3 batch delete after 3 retries | `error` | `productId`, `imageS3Keys`, `s3Error` |
| `webhooks/paystack` | HMAC signature mismatch | `warning` | Truncated signature (first 16 chars) |
| `transitionOrderStatus()` | `InvalidStateTransitionError` thrown | `error` | `from`, `to`, `orderId`, `actorRole` |
| `generateKYCPresignedUrl()` | S3 client throws | `error` | `s3Key` (no content) |
| `lib/prisma.ts` | `$connect()` failure at cold start | `fatal` | Node.js error message |
| Server Components / Route Handlers | `auth.api.getSession()` throws unexpectedly | `warning` | `pathname`, `userId`, `error type` |
| `sendEmail()` in `lib/email/send.ts` | Resend API call fails | `error` | `to` (email), `subject` (no body) |

## <span style="color:#D1148A;">6.4 Database Migration Strategy</span>

```mermaid
flowchart LR
    subgraph LOCAL["Local Dev"]
        DEV_SCHEMA["Edit prisma/schema.prisma"]
        MIGRATE_DEV["prisma migrate dev\n--name add_otp_fields\nCreates timestamped migration file"]
    end

    subgraph GIT["Version Control"]
        MIGRATION_FILE["prisma/migrations/\n20260601_add_otp_fields/\nmigration.sql\n(committed to Git)"]
    end

    subgraph CI_MIGRATE["CI — Deploy Job"]
        MIGRATE_DEPLOY["prisma migrate deploy\nDIRECT_DATABASE_URL\n(direct RDS connection,\nnot Accelerate)\nApplies pending migrations\nin sequence"]
    end

    subgraph RDS_PROD["AWS RDS Production"]
        PG_SCHEMA["PostgreSQL schema\nMigration history in\n_prisma_migrations table"]
    end

    DEV_SCHEMA --> MIGRATE_DEV --> MIGRATION_FILE --> MIGRATE_DEPLOY --> PG_SCHEMA
```

> **Why `DIRECT_DATABASE_URL` for migrations?** Prisma Accelerate is a query proxy — it cannot run DDL statements. `prisma migrate deploy` must connect directly to the RDS endpoint using the `directUrl` datasource field, bypassing Accelerate.

---

<br/>

<a name="s7"></a>

# <span style="color:#5D1A89;">7. Architecture Decision Records</span>

> ADRs document significant architectural decisions, their context, and the trade-offs accepted. Each ADR is immutable once accepted.

---

## <span style="color:#D1148A;">ADR-001: Unified Full-Stack Next.js vs. Separate Frontend/Backend</span>

| Field | Detail |
|---|---|
| **Date** | June 1, 2026 |
| **Status** | Accepted |
| **Decision** | Build U-Shop as a single Next.js 15 App Router monorepo deployed to Vercel. No separate Express/Fastify backend. |

**Context:** A solo developer needs to ship a production-quality marketplace in 3 months with zero DevOps overhead. The traditional split (React SPA + Node.js API) requires two deployment targets, two CI pipelines, CORS configuration, and two codebases to maintain.

**Consequences — Positive:**
- One repo, one deploy. `git push` to `main` deploys the entire platform.
- Server Components eliminate client-side data fetching boilerplate and reduce JS bundle size.
- Server Actions replace REST endpoints for form mutations — type-safe, co-located with UI.
- Route Handlers remain for external integrations (Paystack webhooks, Resend, S3 presigned URLs).

**Consequences — Negative:**
- Vercel Hobby tier 10-second function timeout constrains long-running operations. Mitigated by async background patterns (`waitUntil()` helper). `setImmediate` is prohibited as Vercel freezes execution contexts immediately after response.
- No native WebSocket support on Vercel Hobby. Real-time features (order status push) deferred to V2.

---

## <span style="color:#D1148A;">ADR-002: Better Auth (Session-Based) vs. Custom JWT</span>

| Field | Detail |
|---|---|
| **Date** | June 1, 2026 |
| **Status** | Accepted |
| **Decision** | Use `better-auth` with `@better-auth/prisma-adapter` for all authentication. Custom JWT implementation prohibited. |

**Context:** A custom JWT implementation requires: token generation, HMAC signing, refresh token rotation, secure cookie flag management, clock skew handling, and revocation logic. A solo developer building 37 features in 3 months cannot safely own all of this surface area.

**Consequences — Positive:**
- Sessions stored in PostgreSQL via Prisma adapter — instantly revocable server-side (vs. JWT which cannot be revoked before expiry).
- Password hashing (Argon2id) managed by the library — no developer-owned crypto.
- Role claim is a DB field (`user.role`) — role changes take effect on the next request, not after token expiry.
- `better-auth.session_token` cookie is HttpOnly + Secure by default.

**Consequences — Negative:**
- Every authenticated request requires a DB lookup (`SELECT sessions JOIN users`). Mitigated by Better Auth's 5-minute `cookieCache` reducing DB round-trips for short sessions.
- Adds 4 new DB tables managed by the library. Schema is less minimal.

---

## <span style="color:#D1148A;">ADR-003: Prisma Accelerate for Serverless Connection Pooling</span>

| Field | Detail |
|---|---|
| **Date** | June 1, 2026 |
| **Status** | Accepted |
| **Decision** | Route all Prisma queries through Prisma Accelerate. Direct RDS connections are used only for `prisma migrate deploy` in CI. |

**Context:** AWS RDS `db.t2.micro` supports approximately 87 concurrent PostgreSQL connections. Vercel serverless functions are stateless and short-lived — each invocation opens a new connection. Under modest load (100 concurrent page loads), the connection limit is breached without pooling.

**Alternatives Considered:**
- **PgBouncer on EC2 t2.micro:** Free but requires managing another server, firewall rules, health monitoring.
- **Supabase PostgreSQL (built-in PgBouncer):** Would require migrating from AWS RDS, losing the AWS free tier.
- **Prisma Accelerate:** Managed service, zero infrastructure, integrates via `DATABASE_URL` replacement. Free tier generous enough for V1 traffic.

**Consequences — Positive:** Zero connection exhaustion risk. No additional server to manage. Query caching available in V2.

**Consequences — Negative:** Adds a third-party dependency in the critical data path. Network hop from Vercel → Accelerate → RDS adds ~5–15ms latency vs. direct connection.

---

## <span style="color:#D1148A;">ADR-004: 7-State Order Lifecycle vs. Simpler 3-State Model</span>

| Field | Detail |
|---|---|
| **Date** | June 1, 2026 |
| **Status** | Accepted |
| **Decision** | Implement a 7-state typed state machine (`PAID → PROCESSING → READY_FOR_PICKUP → IN_TRANSIT → DELIVERED → COMPLETED → DISPUTED`) with `assertValidTransition()` enforcing illegal transitions. |

**Context:** The Managed Dispatch model requires granular tracking of physical order movement. A simple `PAID → DELIVERED → COMPLETED` model cannot represent: seller packaging time, rider assignment, OTP verification, or dispute windows. Each state has a distinct actor, trigger, and side effect.

**Consequences — Positive:**
- Illegal transitions (e.g. `PROCESSING → COMPLETED`) rejected at API layer with `HTTP 422`.
- Timestamp fields (`paidAt`, `processedAt`, `readyAt`, etc.) provide a full audit trail.
- Side effects (OTP generation, email triggers) are deterministically tied to specific transitions.

**Consequences — Negative:**
- More complex seller dashboard (6 distinct states visible to seller). Mitigated by clear status labels and contextual CTAs.

---

## <span style="color:#D1148A;">ADR-005: Zero Buyer-Seller Communication (Policy → Architecture Impact)</span>

| Field | Detail |
|---|---|
| **Date** | June 1, 2026 |
| **Status** | Accepted |
| **Decision** | No in-app messaging between buyers and sellers at any state. Seller contact fields excluded at Prisma `select` level in all buyer-facing queries. Rider phone number is the sole buyer-accessible contact channel (during `IN_TRANSIT` only). |

**Context:** PRD v1.3 mandates this as a platform policy to prevent off-platform transaction solicitation and simplify V1 development scope (removes ~2 weeks of messaging infrastructure). The architectural consequence is that no `Message` model, no chat polling, and no WebSocket is required in V1.

**Consequences — Positive:**
- Significant scope reduction (no real-time messaging infrastructure).
- Eliminates the surface area for data leaks of seller personal contact.
- Rider-mediated communication is architecturally simpler to reason about.

**Consequences — Negative:**
- Buyers cannot ask sellers product questions pre-purchase. Mitigated by complete product descriptions and detailed listing requirements.

---

## <span style="color:#D1148A;">ADR-006: Gross-Up Commission Model vs. Net Deduction</span>

| Field | Detail |
|---|---|
| **Date** | June 1, 2026 |
| **Status** | Accepted |
| **Decision** | Use gross-up pricing: `listingPrice = vendorPrice / (1 - commissionRate)`. The commission is embedded in the buyer-facing price. Seller always receives their exact `vendorPrice`. |

**Context:** In a net-deduction model, a seller listing at GHS 350 receives GHS 332.50 after 5% commission — creating post-sale confusion and seller trust issues. In the gross-up model, the seller receives exactly GHS 350; the buyer pays GHS 368.42. The platform's revenue is sourced from the buyer, not the seller.

**Consequences — Positive:**
- Seller experience is predictable and transparent (enter price, receive that exact price).
- Pricing logic is a pure function — easy to test, easy to audit.

**Consequences — Negative:**
- Buyer pays slightly more than the listed product price. Mitigated by a clear tooltip on the product page explaining the gross-up.
- Rounding on `Decimal(10,2)` must be consistently applied (ROUND_HALF_UP) to avoid commission drift over thousands of orders.

---

<br/>

<a name="s8"></a>

# <span style="color:#5D1A89;">8. Document History</span>

| Version | Date | Author | Changes |
|---|---|---|---|
| **1.1** | **June 9, 2026** | **Richard Nuhu** | **Patch release resolving 4 production bottlenecks: (1) §2.3, §2.1 — Edge Middleware request flow updated to lightweight cookie-presence check only; database-backed auth deferred to server-side Node.js functions. (2) §3.1, §3.4 — S3 deletion execution context updated to use Vercel waitUntil() instead of prohibited setImmediate pattern. (3) §6.2, §6.3 — Sentry beforeSend hook updated to filter and drop P2002 errors from Paystack webhook endpoints. (4) §3.3 — KYC document viewer flow updated to reflect the lazy-load UX mandate with zero upfront S3 presigned URL generation.** |
| **1.0** | **June 1, 2026** | **Richard Nuhu** | **Initial release. Covers: End-to-end infrastructure topology diagram (Cloudflare → Vercel → AWS → Third-Party). Prisma Accelerate connection pool topology. Better Auth integration architecture with session lifecycle sequence diagram. RBAC Middleware gate sequence diagram. Dual S3 bucket architecture with KYC upload, presigned URL, and image lifecycle flow diagrams. Checkout & Paystack HMAC webhook sequence diagram. Managed Dispatch & OTP delivery sequence diagram. 7-state order lifecycle stateDiagram. Core ER diagram (User, SellerProfile, Product, Order, Rider, WebhookEvent, Review). Zero buyer-seller communication schema enforcement documentation. CI/CD flowchart (GitHub Actions → Vercel). Sentry instrumentation architecture diagram with mandatory capture points. DB migration strategy diagram. 6 Architecture Decision Records (ADR-001 through ADR-006).** |

---

<br/>

<div align="center">

<p style="color:#94A3B8;font-style:italic;">— End of Document —</p>
<p style="color:#94A3B8;font-style:italic;font-size:0.85em;">U-Shop SAD v1.1 &nbsp;·&nbsp; Author: Richard Nuhu &nbsp;·&nbsp; ushopgh.com &nbsp;·&nbsp; Principal Architecture Reference &nbsp;·&nbsp; Confidential</p>
<br/>
<span style="background:#FF0000;color:#FFFFFF;padding:2px 10px;font-weight:900;border-radius:3px;">U</span>&nbsp;<span style="color:#5D1A89;font-weight:900;">sh</span><span style="color:#D1148A;font-weight:900;">op</span>

</div>
