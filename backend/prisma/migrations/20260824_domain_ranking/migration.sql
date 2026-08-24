-- AlterTable: Season
ALTER TABLE "Season" ADD COLUMN "seasonNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Season" ADD COLUMN "domainTheme" TEXT;
ALTER TABLE "Season" ADD COLUMN "softResetCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: DomainRank
CREATE TABLE "DomainRank" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "division" TEXT NOT NULL DEFAULT 'BRONZE',
    "divisionTier" INTEGER NOT NULL DEFAULT 1,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,
    "placementMatchesLeft" INTEGER NOT NULL DEFAULT 5,
    "careerHighRating" INTEGER NOT NULL DEFAULT 1000,
    "careerHighDivision" TEXT NOT NULL DEFAULT 'BRONZE',
    "careerHighTier" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SeasonRankSnapshot
CREATE TABLE "SeasonRankSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "finalRating" INTEGER NOT NULL,
    "finalDivision" TEXT NOT NULL,
    "finalTier" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "placementRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonRankSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PlacementMatch
CREATE TABLE "PlacementMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityId" TEXT,
    "difficulty" TEXT NOT NULL,
    "performance" DOUBLE PRECISION NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "timeEfficiency" DOUBLE PRECISION NOT NULL,
    "independence" DOUBLE PRECISION NOT NULL,
    "ratingDelta" INTEGER NOT NULL,
    "ratingBefore" INTEGER NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DomainRatingEvent
CREATE TABLE "DomainRatingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityId" TEXT,
    "difficulty" TEXT NOT NULL,
    "performance" DOUBLE PRECISION NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "timeEfficiency" DOUBLE PRECISION NOT NULL,
    "independence" DOUBLE PRECISION NOT NULL,
    "ratingDelta" INTEGER NOT NULL,
    "ratingBefore" INTEGER NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainRatingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DomainRank_userId_domainId_seasonId_key" ON "DomainRank"("userId", "domainId", "seasonId");
CREATE INDEX "DomainRank_domainId_seasonId_rating_idx" ON "DomainRank"("domainId", "seasonId", "rating" DESC);
CREATE INDEX "DomainRank_userId_seasonId_idx" ON "DomainRank"("userId", "seasonId");
CREATE INDEX "DomainRank_rating_idx" ON "DomainRank"("rating" DESC);

CREATE UNIQUE INDEX "SeasonRankSnapshot_userId_domainId_seasonId_key" ON "SeasonRankSnapshot"("userId", "domainId", "seasonId");
CREATE INDEX "SeasonRankSnapshot_userId_seasonNumber_idx" ON "SeasonRankSnapshot"("userId", "seasonNumber");
CREATE INDEX "SeasonRankSnapshot_domainId_seasonId_rating_idx" ON "SeasonRankSnapshot"("domainId", "seasonId", "finalRating" DESC);

CREATE INDEX "PlacementMatch_userId_domainId_seasonId_idx" ON "PlacementMatch"("userId", "domainId", "seasonId");
CREATE INDEX "PlacementMatch_seasonId_domainId_idx" ON "PlacementMatch"("seasonId", "domainId");

CREATE INDEX "DomainRatingEvent_userId_domainId_seasonId_idx" ON "DomainRatingEvent"("userId", "domainId", "seasonId");
CREATE INDEX "DomainRatingEvent_seasonId_createdAt_idx" ON "DomainRatingEvent"("seasonId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "DomainRank" ADD CONSTRAINT "DomainRank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DomainRank" ADD CONSTRAINT "DomainRank_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SkillDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DomainRank" ADD CONSTRAINT "DomainRank_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SeasonRankSnapshot" ADD CONSTRAINT "SeasonRankSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeasonRankSnapshot" ADD CONSTRAINT "SeasonRankSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlacementMatch" ADD CONSTRAINT "PlacementMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlacementMatch" ADD CONSTRAINT "PlacementMatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DomainRatingEvent" ADD CONSTRAINT "DomainRatingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DomainRatingEvent" ADD CONSTRAINT "DomainRatingEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
