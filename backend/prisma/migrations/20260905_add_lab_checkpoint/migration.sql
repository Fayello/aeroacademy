-- CreateTable
CREATE TABLE "lab_checkpoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "walkthroughState" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_checkpoints_userId_labId_key" ON "lab_checkpoints"("userId", "labId");

-- CreateIndex
CREATE INDEX "lab_checkpoints_userId_idx" ON "lab_checkpoints"("userId");

-- CreateIndex
CREATE INDEX "lab_checkpoints_labId_idx" ON "lab_checkpoints"("labId");
