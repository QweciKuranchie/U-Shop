-- DropIndex
DROP INDEX "seller_profiles_status_idx";

-- CreateIndex
CREATE INDEX "seller_profiles_status_createdAt_idx" ON "seller_profiles"("status", "createdAt" DESC);
