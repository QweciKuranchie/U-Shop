# Contributing to U-Shop

Welcome! We appreciate your interest in contributing to U-Shop. Please follow these guidelines to keep our development workflow efficient and consistent.

---

## 1. Branching & Git Workflow

- **Branch Name Conventions:**
  - Feature development: `feature/your-feature-name`
  - Bug fixes: `fix/bug-description`
  - Documentation updates: `docs/what-changed`
  - Refactoring: `refactor/what-changed`
- Always create your branches from the latest state of `main`:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/your-feature-name
  ```
- Before pushing, make sure your code builds locally:
  ```bash
  pnpm tsc --noEmit
  pnpm lint
  ```

---

## 2. Pull Request Policy

All code changes must be submitted via Pull Requests. Direct pushes to `main` are blocked by branch protection.

- **PR Validation Checks:**
  Our automated CI/CD pipeline runs validation checks on every PR:
  1. TypeScript Compilation: `tsc --noEmit`
  2. Prisma Schema Validation: `prisma validate`
  3. Linting: `eslint . --max-warnings 0`
  *Your PR will block merging if any of these checks fail.*
- **Reviews:** At least **1 review approval** is required before merging into `main`.
- **Merge Strategy:** Use **Squash and Merge** on GitHub to keep the commit history clean and linear.

---

## 3. Coding Guidelines

### Architecture Boundaries
- **Next.js Route Groups:** Scope your layouts and pages within their corresponding route groups:
  - `(buyer)` — Buyer-facing store pages, shopping carts, checkout.
  - `(seller)` — Seller profiles, catalog managers, order lists.
  - `(admin)` — Platform control centers, KYC approvals, dispatch management.
  - `(rider)` — Delivery status boards, verification popups.
  - `/api` — Route handlers, webhook handlers.

### Zero-Trust Security Gate
- **Do not rely on Next.js Middleware for server-side security.** Middleware is a lightweight UX redirect gate.
- Every Route Handler, Server Action, and protected Server Component **must** independently authenticate the session and verify roles using the `auth.api.getSession()` mechanism before modifying or returning data.

### Database snapshot rules
- **Pricing Snapshot:** All pricing data associated with orders must be snapshot-recorded as `Decimal` fields in the `Order` model at checkout time. Do not recalculate pricing dynamically from catalog values to prevent historical pricing drifts.
- **Privacy Controls:** Never expose seller contact properties (`phone`, `whatsappNumber`) to the buyer queries. Filter this out at the database `select` projection layer in your Prisma queries.

### S3 File Handling
- Make all S3 deletions asynchronous or fire-and-forget in serverless routines using Vercel's `waitUntil()` helper to prevent Vercel function timeout thresholds (10-second serverless limit).

### Styling & UI
- Use Tailwind CSS and shadcn/ui.
- Keep UI color definitions mapped to our CSS custom variables (`var(--primary)`, `var(--background)`, etc.) inside `app/globals.css` to support dark mode themes seamlessly.
