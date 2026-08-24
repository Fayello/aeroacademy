-- CreateTable
CREATE TABLE "GlobalRankSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "globalRating" INTEGER NOT NULL,
    "globalDivision" TEXT NOT NULL,
    "globalTier" INTEGER NOT NULL,
    "domainCount" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "winRate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalRankSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalRankSnapshot_userId_seasonId_key" ON "GlobalRankSnapshot"("userId", "seasonId");

-- CreateIndex
CREATE INDEX "GlobalRankSnapshot_userId_seasonNumber_idx" ON "GlobalRankSnapshot"("userId", "seasonNumber");

-- AddForeignKey
ALTER TABLE "GlobalRankSnapshot" ADD CONSTRAINT "GlobalRankSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalRankSnapshot" ADD CONSTRAINT "GlobalRankSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
