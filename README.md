# U-Shop (Campus Marketplace)

U-Shop is a campus marketplace platform that connects buyers, sellers, and delivery riders. Built with Next.js 15, PostgreSQL, S3, Prisma, Resend, and Sentry.

---

## Technical Stack

- **Core Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS, shadcn/ui
- **ORM:** Prisma
- **Database:** AWS RDS PostgreSQL (Connection pooled via Prisma Accelerate)
- **Asset Storage:** AWS S3 (Dual bucket: public product images + private KYC documents)
- **Email:** Resend
- **Observability:** Sentry
- **Proxy/DNS:** Cloudflare
- **Testing/Cron:** GitHub Actions

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd UShop
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in your database endpoints, AWS credentials, Sentry tokens, Resend keys, and Paystack credentials. Refer to [scaffold_setup_guide.md](file:///c:/Users/Kuranchie/Desktop/UShop/docs/scaffold_setup_guide.md) for step-by-step credentials provisioning.

4. **Initialize Database:**
   Ensure database parameters are set up in your `.env`, then run:
   ```bash
   pnpm prisma db push
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the landing page.

---

## Available Scripts

- `pnpm dev` - Starts the Next.js development server.
- `pnpm build` - Builds the application for production.
- `pnpm start` - Starts the Next.js production server.
- `pnpm lint` - Runs next lint/eslint checks.
- `pnpm postinstall` - Autogenerates Prisma Client after installing dependencies.

---

