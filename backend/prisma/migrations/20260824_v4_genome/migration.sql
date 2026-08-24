-- V4: Technology Genome + Skill Mastery

-- 1. Alter UserSkill: add mastery, lastPracticedAt, decayRate, isDecaying, timestamps
ALTER TABLE "UserSkill" ADD COLUMN "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "UserSkill" ADD COLUMN "lastPracticedAt" TIMESTAMP(3);
ALTER TABLE "UserSkill" ADD COLUMN "decayRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5;
ALTER TABLE "UserSkill" ADD COLUMN "isDecaying" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserSkill" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UserSkill" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "UserSkill_lastPracticedAt_idx" ON "UserSkill"("lastPracticedAt");

-- 2. Create SkillMasteryEvent
CREATE TABLE "SkillMasteryEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "masteryBefore" DOUBLE PRECISION NOT NULL,
    "masteryAfter" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillMasteryEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SkillMasteryEvent_userId_skillId_idx" ON "SkillMasteryEvent"("userId", "skillId");
CREATE INDEX "SkillMasteryEvent_createdAt_idx" ON "SkillMasteryEvent"("createdAt");
CREATE INDEX "SkillMasteryEvent_eventType_idx" ON "SkillMasteryEvent"("eventType");

ALTER TABLE "SkillMasteryEvent" ADD CONSTRAINT "SkillMasteryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillMasteryEvent" ADD CONSTRAINT "SkillMasteryEvent_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Create SkillPrerequisite
CREATE TABLE "SkillPrerequisite" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "minMastery" DOUBLE PRECISION NOT NULL DEFAULT 50,

    CONSTRAINT "SkillPrerequisite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkillPrerequisite_skillId_prerequisiteId_key" ON "SkillPrerequisite"("skillId", "prerequisiteId");

ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Create PersonalizedMission
CREATE TABLE "PersonalizedMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "targetSkillId" TEXT,
    "targetDomainId" TEXT,
    "xpReward" INTEGER NOT NULL,
    "masteryReward" DOUBLE PRECISION NOT NULL,
    "missionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalizedMission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonalizedMission_userId_status_idx" ON "PersonalizedMission"("userId", "status");
CREATE INDEX "PersonalizedMission_userId_createdAt_idx" ON "PersonalizedMission"("userId", "createdAt");

ALTER TABLE "PersonalizedMission" ADD CONSTRAINT "PersonalizedMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalizedMission" ADD CONSTRAINT "PersonalizedMission_targetSkillId_fkey" FOREIGN KEY ("targetSkillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonalizedMission" ADD CONSTRAINT "PersonalizedMission_targetDomainId_fkey" FOREIGN KEY ("targetDomainId") REFERENCES "SkillDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
