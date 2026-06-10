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
- pnpm 9 (recommended) or npm

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

## Git Tracking Notice

> [!NOTE]
> If files inside the `.claude` folder are showing up in your Git Source Control, they may have been tracked prior to updating `.gitignore`. To fix this, run the following command in your local system terminal:
> ```bash
> git rm -r --cached .claude
> ```
> This deletes them from the tracking cache without deleting the files on your local disk.

---

## GitHub Branch Protection Ruleset for `main`

To prevent broken code or unapproved migrations from entering production, follow these steps to protect the `main` branch.

### Step-by-Step Configuration on GitHub:

1. Open your repository on GitHub.
2. Click **Settings** (top tab navigation).
3. In the left sidebar under *Code and automation*, click **Branches**.
4. Click **Add branch ruleset** (or **Add rule** under Branch protection rules).
5. **Ruleset Settings**:
   - **Ruleset name:** `Main Branch Protection`
   - **Enforcement status:** Set to **Active**
   - **Bypass list:** *[Optional]* You can add admins if emergency bypasses are needed, but it is highly recommended to leave it blank to enforce policy.
6. **Target branches**:
   - Select **Add target** → **Include default branch** (which targets `main`).
7. **Branch Rules (Select the following checkboxes):**
   - **Require a pull request before merging:**
     - Check **Require approvals** (Set *Minimum approvals before merging* to `1` or `2`).
     - Check **Dismiss stale pull request approvals when new commits are pushed**.
     - Check **Require review from Code Owners** (if utilizing a `CODEOWNERS` file).
   - **Require status checks to pass before merging:**
     - Check **Require branches to be up to date before merging** (forces branch sync before merge).
     - Under *Status checks that must pass*, search for and add the following job from our PR validation pipeline:
       - `validate`
   - **Require conversation resolution before merging:** (Ensures all PR comment threads are resolved before code is merged).
   - **Require signed commits:** (Recommended to verify commit identity).
   - **Require linear history:** (Forces a squash-and-merge or rebase workflow, keeping the history clean).
   - **Block force pushes:** (Prevents overwriting history on `main`).
   - **Block deletions:** (Prevents deleting the `main` branch).
8. Click **Create** or **Save changes** at the bottom of the page.
