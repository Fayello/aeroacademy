CREATE TYPE "CommunityProgramType" AS ENUM ('AMBASSADOR', 'VOLUNTEER');

CREATE TYPE "CommunityProgramApplicationStatus" AS ENUM ('NEW', 'REVIEWING', 'INTERVIEW', 'ACCEPTED', 'CLOSED');

CREATE TABLE "CommunityProgramApplication" (
  "id" TEXT NOT NULL,
  "programType" "CommunityProgramType" NOT NULL,
  "status" "CommunityProgramApplicationStatus" NOT NULL DEFAULT 'NEW',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "city" TEXT,
  "organization" TEXT,
  "role" TEXT,
  "experience" TEXT,
  "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "contribution" TEXT NOT NULL,
  "availability" TEXT,
  "linkedinUrl" TEXT,
  "portfolioUrl" TEXT,
  "sourcePage" TEXT DEFAULT '/community',
  "notes" TEXT,
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommunityProgramApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityProgramApplication_status_createdAt_idx" ON "CommunityProgramApplication"("status", "createdAt" DESC);
CREATE INDEX "CommunityProgramApplication_programType_createdAt_idx" ON "CommunityProgramApplication"("programType", "createdAt" DESC);
CREATE INDEX "CommunityProgramApplication_email_idx" ON "CommunityProgramApplication"("email");

ALTER TABLE "CommunityProgramApplication"
ADD CONSTRAINT "CommunityProgramApplication_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
