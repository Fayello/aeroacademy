-- AlterTable: Add enriched fields to BossMission
ALTER TABLE "BossMission" ADD COLUMN "ratingReward" INTEGER NOT NULL DEFAULT 200;
ALTER TABLE "BossMission" ADD COLUMN "requiredDomains" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BossMission" ADD COLUMN "domainId" TEXT;
ALTER TABLE "BossMission" ADD COLUMN "theme" TEXT;
