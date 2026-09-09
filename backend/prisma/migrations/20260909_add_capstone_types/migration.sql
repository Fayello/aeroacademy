-- AlterEnum
ALTER TYPE "ResourceProfile" ADD VALUE IF NOT EXISTS 'LIGHTWEIGHT';

-- CreateEnum
CREATE TYPE "LabType" AS ENUM ('PRACTICE', 'CAPSTONE');

-- AlterTable
ALTER TABLE "Lab" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PRACTICE';
ALTER TABLE "Lab" ADD COLUMN "composeFile" TEXT;
ALTER TABLE "Lab" ADD COLUMN "ramRequirement" INTEGER DEFAULT 512;

-- CreateTable
CREATE TABLE "CapstonePhase" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,

    CONSTRAINT "CapstonePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapstonePrereq" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "skillDomainId" TEXT NOT NULL,
    "requiredPercentage" INTEGER NOT NULL DEFAULT 80,

    CONSTRAINT "CapstonePrereq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CapstonePhase_labId_phaseNumber_key" ON "CapstonePhase"("labId", "phaseNumber");

-- CreateIndex
CREATE INDEX "CapstonePhase_labId_idx" ON "CapstonePhase"("labId");

-- CreateIndex
CREATE INDEX "CapstonePrereq_labId_idx" ON "CapstonePrereq"("labId");

-- CreateIndex
CREATE INDEX "Lab_type_idx" ON "Lab"("type");
