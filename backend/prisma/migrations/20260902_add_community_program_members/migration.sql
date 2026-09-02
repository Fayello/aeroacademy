CREATE TYPE "CommunityProgramMemberStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'PAUSED', 'ALUMNI');

CREATE TABLE "CommunityProgramMember" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "programType" "CommunityProgramType" NOT NULL,
  "status" "CommunityProgramMemberStatus" NOT NULL DEFAULT 'ONBOARDING',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "city" TEXT,
  "organization" TEXT,
  "role" TEXT,
  "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "contribution" TEXT NOT NULL,
  "availability" TEXT,
  "linkedinUrl" TEXT,
  "portfolioUrl" TEXT,
  "onboardingStage" TEXT NOT NULL DEFAULT 'WELCOME',
  "onboardingNotes" TEXT,
  "ownerId" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommunityProgramMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityProgramMember_applicationId_key" ON "CommunityProgramMember"("applicationId");
CREATE INDEX "CommunityProgramMember_programType_status_idx" ON "CommunityProgramMember"("programType", "status");
CREATE INDEX "CommunityProgramMember_status_joinedAt_idx" ON "CommunityProgramMember"("status", "joinedAt" DESC);
CREATE INDEX "CommunityProgramMember_email_idx" ON "CommunityProgramMember"("email");

ALTER TABLE "CommunityProgramMember"
ADD CONSTRAINT "CommunityProgramMember_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "CommunityProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityProgramMember"
ADD CONSTRAINT "CommunityProgramMember_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
