-- DropIndex
DROP INDEX "idx_products_title_trgm";

-- DropIndex
DROP INDEX "products_status_idx";

-- CreateIndex
CREATE INDEX "products_status_createdAt_idx" ON "products"("status", "createdAt" DESC);
