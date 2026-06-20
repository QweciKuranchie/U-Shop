-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN "applicationSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "seller_otps" ADD COLUMN "lockoutUntil" TIMESTAMP(3);
