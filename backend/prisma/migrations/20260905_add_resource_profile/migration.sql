-- CreateEnum
CREATE TYPE "ResourceProfile" AS ENUM ('LIGHTWEIGHT', 'STANDARD', 'HEAVY');

-- AlterTable
ALTER TABLE "labs" ADD COLUMN "resourceProfile" "ResourceProfile" NOT NULL DEFAULT 'STANDARD';
