# U-Shop Infrastructure Setup Guide (T1)

This guide provides click-by-click instructions to configure all external resources and services required for the U-Shop v1 MVP project foundation.

---

## 1. AWS RDS PostgreSQL Setup

To stay within the free tier, we will provision a single `db.t2.micro` database instance.

### Step-by-Step Instructions:
1. Log in to the [AWS Management Console](https://console.aws.aws.com/).
2. Navigate to **RDS** service.
3. Click **Create database**.
4. Choose database creation method: **Standard create**.
5. Engine options: **PostgreSQL**.
6. Engine version: Select **PostgreSQL 15.x** (e.g., `15.4-R1` or similar v15).
7. Templates: Select **Free Tier** (this will automatically restrict configuration to `db.t2.micro` or `db.t3.micro` and 20GB storage).
8. **Settings**:
   - DB instance identifier: `ushop-db`
   - Master username: `ushop_admin`
   - Master password: *Generate a strong password and save it*
9. **Instance configuration**:
   - DB instance class: `db.t2.micro` (or `db.t3.micro` depending on availability in your region)
10. **Storage**:
    - Storage type: General Purpose SSD (gp2 or gp3)
    - Allocated storage: `20` GiB
    - Enable storage autoscaling: *Uncheck* to avoid accidental charges.
11. **Connectivity**:
    - Virtual private cloud (VPC): Choose your default VPC.
    - Public access: Select **Yes** (required for Prisma direct access; we will restrict access via Security Group rules).
    - VPC security group: Create new → name it `ushop-rds-sg`.
12. **Database authentication**: Choose **Password authentication**.
13. **Additional configuration**:
    - Initial database name: `ushop`
    - Backup: Enable automated backups (7 days retention is free).
    - Encryption: Enable encryption.
14. Click **Create database**.

### Security Group Configuration (Strict Access Control)
1. Go to the created security group `ushop-rds-sg` in the EC2 Console.
2. Edit **Inbound Rules**:
   - Rule 1: Type `PostgreSQL` (Port 5432), Source `My IP` (allows you to run migrations locally from your development machine).
   - Rule 2 (Accelerate Connection): Prisma Accelerate acts as a connection proxy. The database itself does not need public open ingress; only specific secure proxy IPs or a private tunnel/bastion/VPN path should be configured for pooled runtime access.
3. Save rules.

> [!CAUTION]
> **Public-open RDS ingress (e.g., configuring `0.0.0.0/0`) is strictly prohibited** for U-Shop environments to prevent exposing the database to the public internet. All traffic must be restricted to tightly scoped source IPs (e.g., `My IP` for development) or routed securely through Prisma Accelerate proxy connections.

### Database URLs for `.env`:
- **DIRECT_DATABASE_URL**: `postgresql://ushop_admin:[PASSWORD]@[RDS_ENDPOINT]:5432/ushop?schema=public`

---

## 2. AWS S3 Buckets Setup

We require two buckets: one public for product images and one completely blocked for KYC documents.

### A. Public Bucket: `ushop-product-images`
1. Navigate to **S3** in the AWS Console.
2. Click **Create bucket**.
3. Bucket name: `ushop-product-images` (must be globally unique; append a suffix if needed).
4. Region: Choose `af-south-1` (Cape Town) or your preferred region.
5. **Object Ownership**: Select **ACLs disabled (recommended)**.
6. **Block Public Access settings for this bucket**:
   - *Uncheck* **Block all public access**.
   - Acknowledge the warning that objects will become public.
7. Click **Create bucket**.

#### Configure Public Bucket Policy
1. Select the `ushop-product-images` bucket.
2. Go to the **Permissions** tab.
3. Scroll to **Bucket policy** and click **Edit**.
4. Paste the following JSON policy (replace `ushop-product-images` with your bucket name):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::ushop-product-images/*"
        }
    ]
}
```
5. Click **Save changes**.

#### Configure CORS (Cross-Origin Resource Sharing)
1. Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
2. Paste the following configuration to allow uploads from your domains:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000", "https://ushopgh.com", "https://*.ushopgh.com"],
        "ExposeHeaders": []
    }
}
```
3. Click **Save changes**.

---

### B. Private Bucket: `ushop-kyc-documents`
1. Navigate to **S3** and click **Create bucket**.
2. Bucket name: `ushop-kyc-documents`
3. Region: Select the same region as the public bucket.
4. **Block Public Access settings**:
   - *Check* **Block all public access** (Very Important!).
5. **Bucket Versioning**: Select **Enable** (to prevent accidental overwrites/deletions of identity papers).
6. **Default encryption**:
   - Encryption type: Server-side encryption with Amazon S3 managed keys (SSE-S3).
7. Click **Create bucket**.

---

### C. Least-Privilege IAM Policy for Serverless App
1. Go to the **IAM** Service in the AWS Console.
2. Click **Policies** → **Create policy**.
3. Choose **JSON** editor and paste the following policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::ushop-product-images/*",
                "arn:aws:s3:::ushop-kyc-documents/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::ushop-product-images",
                "arn:aws:s3:::ushop-kyc-documents"
            ]
        }
    ]
}
```
4. Click **Next** → name the policy `ushop-s3-app-policy` → Click **Create policy**.
5. Click **Users** → **Create user**.
6. User name: `ushop-app-server` (Select Access key - Programmatic access).
7. Click **Next** → Select **Attach policies directly**.
8. Search for and check `ushop-s3-app-policy`.
9. Click **Create user**.
10. Download/save the **Access Key ID** and **Secret Access Key**. Save these for Vercel/local `.env`.

---

## 3. Vercel & Cloudflare Configuration

Cloudflare acts as the DNS proxy, shielding Vercel from direct exposure.

### Step-by-Step Instructions:
1. Log in to [Cloudflare](https://dash.cloudflare.com/) and click **Add site**. Add `ushopgh.com`.
2. Select the **Free Plan**.
3. Cloudflare will scan DNS records. Keep defaults and continue.
4. Cloudflare will provide two nameservers (e.g., `sandy.ns.cloudflare.com`, `tony.ns.cloudflare.com`).
5. Log in to your domain registrar (where you bought `ushopgh.com`) and replace the default nameservers with Cloudflare's.
6. Once active in Cloudflare, navigate to **SSL/TLS** → change SSL mode to **Full (strict)**.

### Linking to Vercel:
1. Log in to [Vercel](https://vercel.com/) and import your GitHub repository.
2. In the Project Settings, go to **Domains**.
3. Add `ushopgh.com` and `www.ushopgh.com`.
4. Vercel will ask you to add CNAME/A records.
5. Go back to Cloudflare DNS dashboard:
   - Add `A` record: Name `@`, IPv4 address `76.76.21.21`, Proxy status: **Proxied**.
   - Add `CNAME` record: Name `www`, Target `cname.vercel-dns.com`, Proxy status: **Proxied**.
6. Set up all Environment Variables in **Project Settings** → **Environment Variables** in Vercel matching your `.env.example` file.

---

## 4. Sentry & Resend Setup

### Sentry Error Tracking:
1. Create a project on [Sentry.io](https://sentry.io/) for Next.js.
2. Select the Platform as **Next.js**.
3. Save the provided **DSN** key.
4. Go to **Developer Settings** → **Internal Integrations** → Create New Token with `project:write` and `release:write` permissions. Save this as `SENTRY_AUTH_TOKEN`.

### Resend Email Services:
1. Create an account on [Resend.com](https://resend.com/).
2. Go to **Domains** → Add `ushopgh.com`.
3. Resend will provide TXT/MX records for SPF, DKIM, and DMARC.
4. Go to Cloudflare DNS and add the provided TXT and MX records.
5. Once DNS verifies, go to Resend dashboard → **API Keys** → **Create API Key** with sending access.
6. Save the key as `RESEND_API_KEY`.

---

## 5. UptimeRobot Configuration

1. Log in to [UptimeRobot](https://uptimerobot.com/).
2. Click **Add New Monitor**.
3. Monitor Type: **HTTPS**.
4. Friendly Name: `U-Shop Health Ping`.
5. URL (or IP): `https://ushopgh.com/api/health`.
6. Monitoring Interval: **Every 5 minutes**.
7. Click **Create Monitor**.

---

## 6. GitHub Branch Protection Ruleset for `main`

To prevent broken code or unapproved migrations from entering production, follow these steps to protect the `main` branch.

### Step-by-Step Configuration on GitHub:

1. Open your repository on GitHub.
2. Click **Settings** (top tab navigation).
3. In the left sidebar under *Code and automation*, click **Branches**.
4. Click **Add branch ruleset** (or **Add rule** under Branch protection rules).
5. **Ruleset Settings**:
   - **Ruleset name:** `Main Branch Protection`
   - **Enforcement status:** Set to **Active**
   - **Bypass list:** *Optional* You can add admins if emergency bypasses are needed, but it is highly recommended to leave it blank to enforce policy.
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

---
