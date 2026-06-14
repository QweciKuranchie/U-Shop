-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('CAMPUS', 'HOME');

-- CreateEnum
CREATE TYPE "EmailJobType" AS ENUM ('seller-otp', 'seller-approved', 'seller-rejected', 'new-order-seller', 'order-confirmed-buyer', 'delivery-otp-buyer', 'order-delivered', 'payout-sent', 'refund-started');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "deliveryAddressId" TEXT;

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flatFee" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL,
    "addressText" TEXT NOT NULL,
    "landmark" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "jobType" "EmailJobType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zones_name_key" ON "delivery_zones"("name");

-- CreateIndex
CREATE INDEX "delivery_addresses_userId_idx" ON "delivery_addresses"("userId");

-- CreateIndex
CREATE INDEX "delivery_addresses_zoneId_idx" ON "delivery_addresses"("zoneId");

-- CreateIndex
CREATE INDEX "email_outbox_status_idx" ON "email_outbox"("status");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "delivery_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_addresses_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "delivery_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable pg_trgm for trigram fuzzy search
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
CREATE INDEX IF NOT EXISTS idx_products_active
  ON products (status, category, "createdAt" DESC)
  WHERE status = 'ACTIVE';
