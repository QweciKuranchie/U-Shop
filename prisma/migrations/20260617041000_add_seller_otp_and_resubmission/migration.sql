-- AlterEnum
ALTER TYPE "EmailJobType" ADD VALUE 'seller-resubmitted';

-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN "otpVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "seller_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_otps_email_key" ON "seller_otps"("email");
