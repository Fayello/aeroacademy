CREATE TYPE "InstitutionalInquiryType" AS ENUM ('UNIVERSITY', 'ENTERPRISE');

CREATE TYPE "InstitutionalInquiryStatus" AS ENUM ('NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'CLOSED');

CREATE TABLE "InstitutionalInquiry" (
  "id" TEXT NOT NULL,
  "inquiryType" "InstitutionalInquiryType" NOT NULL,
  "status" "InstitutionalInquiryStatus" NOT NULL DEFAULT 'NEW',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "organization" TEXT NOT NULL,
  "role" TEXT,
  "teamSize" TEXT,
  "phone" TEXT,
  "message" TEXT NOT NULL,
  "sourcePage" TEXT DEFAULT '/get-started',
  "notes" TEXT,
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InstitutionalInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InstitutionalInquiry_status_createdAt_idx" ON "InstitutionalInquiry"("status", "createdAt" DESC);
CREATE INDEX "InstitutionalInquiry_inquiryType_createdAt_idx" ON "InstitutionalInquiry"("inquiryType", "createdAt" DESC);
CREATE INDEX "InstitutionalInquiry_email_idx" ON "InstitutionalInquiry"("email");

ALTER TABLE "InstitutionalInquiry"
ADD CONSTRAINT "InstitutionalInquiry_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
