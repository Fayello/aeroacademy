-- V3: Seasons, Battle Pass, Boss Missions, Cross-Domain, Global Events, Advanced Ranking

-- Alter Season table
ALTER TABLE "Season" ADD COLUMN "theme" TEXT;
ALTER TABLE "Season" ADD COLUMN "xpMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- Alter LeaderboardSnapshot to add season relation
ALTER TABLE "LeaderboardSnapshot" ADD COLUMN "seasonId" TEXT;
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BattlePass
CREATE TABLE "BattlePass" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalTiers" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattlePass_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BattlePass_seasonId_key" ON "BattlePass"("seasonId");
ALTER TABLE "BattlePass" ADD CONSTRAINT "BattlePass_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BattlePassTier
CREATE TABLE "BattlePassTier" (
    "id" TEXT NOT NULL,
    "battlePassId" TEXT NOT NULL,
    "tierNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xpRequired" INTEGER NOT NULL,
    "rewards" JSONB NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattlePassTier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BattlePassTier_battlePassId_tierNumber_key" ON "BattlePassTier"("battlePassId", "tierNumber");
CREATE INDEX "BattlePassTier_battlePassId_idx" ON "BattlePassTier"("battlePassId");
ALTER TABLE "BattlePassTier" ADD CONSTRAINT "BattlePassTier_battlePassId_fkey" FOREIGN KEY ("battlePassId") REFERENCES "BattlePass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BattlePassProgress
CREATE TABLE "BattlePassProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "currentXp" INTEGER NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattlePassProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BattlePassProgress_userId_tierId_key" ON "BattlePassProgress"("userId", "tierId");
CREATE INDEX "BattlePassProgress_userId_idx" ON "BattlePassProgress"("userId");
CREATE INDEX "BattlePassProgress_tierId_idx" ON "BattlePassProgress"("tierId");
ALTER TABLE "BattlePassProgress" ADD CONSTRAINT "BattlePassProgress_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "BattlePassTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BossMission
CREATE TABLE "BossMission" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'BOSS',
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "xpReward" INTEGER NOT NULL,
    "badgeRewardId" TEXT,
    "prerequisiteLabIds" JSONB NOT NULL DEFAULT '[]',
    "labId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BossMission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BossMission_seasonId_isActive_idx" ON "BossMission"("seasonId", "isActive");
CREATE INDEX "BossMission_startsAt_expiresAt_idx" ON "BossMission"("startsAt", "expiresAt");
ALTER TABLE "BossMission" ADD CONSTRAINT "BossMission_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BossMissionAttempt
CREATE TABLE "BossMissionAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BossMissionAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BossMissionAttempt_userId_bossId_key" ON "BossMissionAttempt"("userId", "bossId");
CREATE INDEX "BossMissionAttempt_userId_idx" ON "BossMissionAttempt"("userId");
CREATE INDEX "BossMissionAttempt_bossId_idx" ON "BossMissionAttempt"("bossId");
ALTER TABLE "BossMissionAttempt" ADD CONSTRAINT "BossMissionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BossMissionAttempt" ADD CONSTRAINT "BossMissionAttempt_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "BossMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CrossDomainMission
CREATE TABLE "CrossDomainMission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredDomains" JSONB NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "badgeRewardId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrossDomainMission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CrossDomainMission_isActive_startsAt_expiresAt_idx" ON "CrossDomainMission"("isActive", "startsAt", "expiresAt");

-- CrossDomainProgress
CREATE TABLE "CrossDomainProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "progress" JSONB NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrossDomainProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CrossDomainProgress_userId_missionId_key" ON "CrossDomainProgress"("userId", "missionId");
CREATE INDEX "CrossDomainProgress_userId_idx" ON "CrossDomainProgress"("userId");
ALTER TABLE "CrossDomainProgress" ADD CONSTRAINT "CrossDomainProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrossDomainProgress" ADD CONSTRAINT "CrossDomainProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "CrossDomainMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GlobalEvent
CREATE TABLE "GlobalEvent" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetXp" INTEGER,
    "targetCount" INTEGER,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlobalEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GlobalEvent_seasonId_isActive_idx" ON "GlobalEvent"("seasonId", "isActive");
CREATE INDEX "GlobalEvent_startsAt_expiresAt_idx" ON "GlobalEvent"("startsAt", "expiresAt");
ALTER TABLE "GlobalEvent" ADD CONSTRAINT "GlobalEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- GlobalEventParticipant
CREATE TABLE "GlobalEventParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlobalEventParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GlobalEventParticipant_userId_eventId_key" ON "GlobalEventParticipant"("userId", "eventId");
CREATE INDEX "GlobalEventParticipant_userId_idx" ON "GlobalEventParticipant"("userId");
CREATE INDEX "GlobalEventParticipant_eventId_idx" ON "GlobalEventParticipant"("eventId");
ALTER TABLE "GlobalEventParticipant" ADD CONSTRAINT "GlobalEventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlobalEventParticipant" ADD CONSTRAINT "GlobalEventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GlobalEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RankingTier
CREATE TABLE "RankingTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "minXp" INTEGER NOT NULL,
    "maxXp" INTEGER NOT NULL,
    "kFactor" DOUBLE PRECISION NOT NULL DEFAULT 32.0,
    "decayRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RankingTier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RankingTier_name_key" ON "RankingTier"("name");
CREATE INDEX "RankingTier_minXp_maxXp_idx" ON "RankingTier"("minXp", "maxXp");
CREATE INDEX "RankingTier_order_idx" ON "RankingTier"("order");

-- RankingHistory
CREATE TABLE "RankingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromTier" TEXT NOT NULL,
    "toTier" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RankingHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RankingHistory_userId_createdAt_idx" ON "RankingHistory"("userId", "createdAt");

-- WinStreak
CREATE TABLE "WinStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastWinDate" TIMESTAMP(3),
    "streakMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WinStreak_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WinStreak_userId_key" ON "WinStreak"("userId");
CREATE INDEX "WinStreak_userId_idx" ON "WinStreak"("userId");
