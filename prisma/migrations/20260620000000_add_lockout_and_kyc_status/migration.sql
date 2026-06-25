-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN "applicationSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: pending sellers with uploaded KYC docs should be treated as submitted
UPDATE "seller_profiles"
SET "applicationSubmitted" = true
WHERE "status" IN ('PENDING_STUDENT', 'PENDING_BUSINESS', 'PENDING_INDIVIDUAL')
  AND "kycDocKeys"::text <> '[]';

-- AlterTable
ALTER TABLE "seller_otps" ADD COLUMN "lockoutUntil" TIMESTAMP(3);
