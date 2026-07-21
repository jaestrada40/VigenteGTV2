CREATE TYPE "AccountTokenType" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');
CREATE TYPE "ConsentType" AS ENUM ('TERMS', 'PRIVACY', 'ALERT_EMAILS');
CREATE TYPE "EmailCategory" AS ENUM ('VERIFICATION', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'REMINDER');

ALTER TABLE "User"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "AccountToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "AccountTokenType" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "ConsentType" NOT NULL,
  "version" TEXT NOT NULL,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailDelivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "recipientEmail" TEXT NOT NULL,
  "category" "EmailCategory" NOT NULL,
  "deliveryStatus" "DeliveryStatus" NOT NULL,
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");
CREATE INDEX "AccountToken_userId_type_idx" ON "AccountToken"("userId", "type");
CREATE INDEX "AccountToken_expiresAt_idx" ON "AccountToken"("expiresAt");
CREATE INDEX "ConsentRecord_userId_type_idx" ON "ConsentRecord"("userId", "type");
CREATE INDEX "EmailDelivery_createdAt_idx" ON "EmailDelivery"("createdAt");
CREATE INDEX "EmailDelivery_category_deliveryStatus_idx" ON "EmailDelivery"("category", "deliveryStatus");

ALTER TABLE "AccountToken" ADD CONSTRAINT "AccountToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing administrators are trusted deployment owners. Existing citizens must verify.
UPDATE "User" SET "emailVerifiedAt" = CURRENT_TIMESTAMP WHERE "role" = 'ADMIN';
