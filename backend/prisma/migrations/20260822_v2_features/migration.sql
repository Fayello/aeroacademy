-- V2 Schema Migration: Achievements Engine, Momentum, Personalization, Career Paths

-- 1. Achievement model enhancements
ALTER TABLE "Achievement" ADD COLUMN "rarity" TEXT NOT NULL DEFAULT 'COMMON';
ALTER TABLE "Achievement" ADD COLUMN "requirementType" TEXT NOT NULL DEFAULT 'FLAGS_CAPTURED';
ALTER TABLE "Achievement" ADD COLUMN "requirementTarget" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Achievement" ADD COLUMN "chainParentId" TEXT;
ALTER TABLE "Achievement" ADD COLUMN "chainOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Achievement" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- 2. UserAchievement progress tracking
ALTER TABLE "UserAchievement" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserAchievement" ADD COLUMN "target" INTEGER NOT NULL DEFAULT 1;

-- 3. User model: streak freeze + daily combo
ALTER TABLE "User" ADD COLUMN "streakFreezes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastStreakFreezeUsedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "dailyMissionCombo" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastDailyComboDate" TIMESTAMP(3);

-- 4. LearningPath: prerequisites + career mapping
ALTER TABLE "LearningPath" ADD COLUMN "prerequisitePathId" TEXT;
ALTER TABLE "LearningPath" ADD COLUMN "careerRole" TEXT;
ALTER TABLE "LearningPath" ADD COLUMN "certificationName" TEXT;
ALTER TABLE "LearningPath" ADD COLUMN "estimatedHours" INTEGER;

-- 5. New table: UserPreference (personalization)
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weakSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredDifficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigestEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- 6. New table: LeaderboardSnapshot (season snapshots)
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "period" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- 7. Foreign keys
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_chainParentId_fkey"
    FOREIGN KEY ("chainParentId") REFERENCES "Achievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_prerequisitePathId_fkey"
    FOREIGN KEY ("prerequisitePathId") REFERENCES "LearningPath"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Indexes
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE INDEX "LeaderboardSnapshot_period_snapshotAt_idx" ON "LeaderboardSnapshot"("period", "snapshotAt");
