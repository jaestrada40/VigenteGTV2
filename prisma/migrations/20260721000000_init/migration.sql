CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "DocumentType" AS ENUM ('DPI', 'LICENCIA');
CREATE TYPE "DeliveryStatus" AS ENUM ('SENT', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL,
  "name" TEXT NOT NULL,
  "expiryDate" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "statusLabel" TEXT NOT NULL,
  "deliveryStatus" "DeliveryStatus" NOT NULL,
  "reminderKey" TEXT,
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_expiryDate_idx" ON "Document"("expiryDate");
CREATE UNIQUE INDEX "NotificationLog_reminderKey_key" ON "NotificationLog"("reminderKey");
CREATE INDEX "NotificationLog_documentId_idx" ON "NotificationLog"("documentId");
CREATE INDEX "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");

ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
