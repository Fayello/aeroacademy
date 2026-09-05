-- CreateTable
CREATE TABLE "LabChallenge" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "challengerTime" INTEGER,
    "opponentTime" INTEGER,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabChallenge_challengerId_idx" ON "LabChallenge"("challengerId");

-- CreateIndex
CREATE INDEX "LabChallenge_opponentId_idx" ON "LabChallenge"("opponentId");

-- CreateIndex
CREATE INDEX "LabChallenge_labId_idx" ON "LabChallenge"("labId");

-- CreateIndex
CREATE INDEX "LabChallenge_status_idx" ON "LabChallenge"("status");

-- AddForeignKey
ALTER TABLE "LabChallenge" ADD CONSTRAINT "LabChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabChallenge" ADD CONSTRAINT "LabChallenge_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabChallenge" ADD CONSTRAINT "LabChallenge_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
