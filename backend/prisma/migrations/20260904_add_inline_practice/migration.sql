-- CreateTable
CREATE TABLE "InlinePractice" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COMMAND_ANSWER',
    "prompt" TEXT NOT NULL,
    "instructions" TEXT,
    "expectedAnswer" TEXT,
    "validationMode" TEXT NOT NULL DEFAULT 'EXACT',
    "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxAttempts" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL DEFAULT 25,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InlinePractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InlinePracticeSubmission" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "feedback" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InlinePracticeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InlinePractice_lessonId_order_idx" ON "InlinePractice"("lessonId", "order");

-- CreateIndex
CREATE INDEX "InlinePractice_required_idx" ON "InlinePractice"("required");

-- CreateIndex
CREATE INDEX "InlinePracticeSubmission_practiceId_userId_idx" ON "InlinePracticeSubmission"("practiceId", "userId");

-- CreateIndex
CREATE INDEX "InlinePracticeSubmission_userId_isCorrect_idx" ON "InlinePracticeSubmission"("userId", "isCorrect");

-- CreateIndex
CREATE INDEX "InlinePracticeSubmission_createdAt_idx" ON "InlinePracticeSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "InlinePractice" ADD CONSTRAINT "InlinePractice_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlinePracticeSubmission" ADD CONSTRAINT "InlinePracticeSubmission_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "InlinePractice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlinePracticeSubmission" ADD CONSTRAINT "InlinePracticeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
