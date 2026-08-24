-- V5: Learning Outcomes & Competency Framework

-- 1. Learning Outcome
CREATE TABLE "LearningOutcome" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearningOutcome_domainId_code_key" ON "LearningOutcome"("domainId", "code");
CREATE INDEX "LearningOutcome_domainId_idx" ON "LearningOutcome"("domainId");

ALTER TABLE "LearningOutcome" ADD CONSTRAINT "LearningOutcome_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SkillDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. SkillOutcome
CREATE TABLE "SkillOutcome" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "learningOutcomeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "SkillOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkillOutcome_skillId_learningOutcomeId_key" ON "SkillOutcome"("skillId", "learningOutcomeId");
CREATE INDEX "SkillOutcome_skillId_idx" ON "SkillOutcome"("skillId");
CREATE INDEX "SkillOutcome_learningOutcomeId_idx" ON "SkillOutcome"("learningOutcomeId");

ALTER TABLE "SkillOutcome" ADD CONSTRAINT "SkillOutcome_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillOutcome" ADD CONSTRAINT "SkillOutcome_learningOutcomeId_fkey" FOREIGN KEY ("learningOutcomeId") REFERENCES "LearningOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. LabOutcome
CREATE TABLE "LabOutcome" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "learningOutcomeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "LabOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LabOutcome_labId_learningOutcomeId_key" ON "LabOutcome"("labId", "learningOutcomeId");
CREATE INDEX "LabOutcome_labId_idx" ON "LabOutcome"("labId");
CREATE INDEX "LabOutcome_learningOutcomeId_idx" ON "LabOutcome"("learningOutcomeId");

ALTER TABLE "LabOutcome" ADD CONSTRAINT "LabOutcome_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabOutcome" ADD CONSTRAINT "LabOutcome_learningOutcomeId_fkey" FOREIGN KEY ("learningOutcomeId") REFERENCES "LearningOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. OutcomeEvidence
CREATE TABLE "OutcomeEvidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningOutcomeId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "demonstratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutcomeEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutcomeEvidence_userId_learningOutcomeId_idx" ON "OutcomeEvidence"("userId", "learningOutcomeId");
CREATE INDEX "OutcomeEvidence_userId_activityType_idx" ON "OutcomeEvidence"("userId", "activityType");
CREATE INDEX "OutcomeEvidence_learningOutcomeId_idx" ON "OutcomeEvidence"("learningOutcomeId");
CREATE INDEX "OutcomeEvidence_demonstratedAt_idx" ON "OutcomeEvidence"("demonstratedAt");

ALTER TABLE "OutcomeEvidence" ADD CONSTRAINT "OutcomeEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutcomeEvidence" ADD CONSTRAINT "OutcomeEvidence_learningOutcomeId_fkey" FOREIGN KEY ("learningOutcomeId") REFERENCES "LearningOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Curriculum
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- 6. CurriculumModule
CREATE TABLE "CurriculumModule" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "theoryHours" INTEGER NOT NULL DEFAULT 0,
    "practicalHours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumModule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CurriculumModule_curriculumId_idx" ON "CurriculumModule"("curriculumId");

ALTER TABLE "CurriculumModule" ADD CONSTRAINT "CurriculumModule_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. ModuleOutcome
CREATE TABLE "ModuleOutcome" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "learningOutcomeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ModuleOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ModuleOutcome_moduleId_learningOutcomeId_key" ON "ModuleOutcome"("moduleId", "learningOutcomeId");

ALTER TABLE "ModuleOutcome" ADD CONSTRAINT "ModuleOutcome_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CurriculumModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModuleOutcome" ADD CONSTRAINT "ModuleOutcome_learningOutcomeId_fkey" FOREIGN KEY ("learningOutcomeId") REFERENCES "LearningOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. ModuleLab
CREATE TABLE "ModuleLab" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,

    CONSTRAINT "ModuleLab_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ModuleLab_moduleId_labId_key" ON "ModuleLab"("moduleId", "labId");

ALTER TABLE "ModuleLab" ADD CONSTRAINT "ModuleLab_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CurriculumModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModuleLab" ADD CONSTRAINT "ModuleLab_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Cohort
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester" TEXT,
    "year" INTEGER NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Cohort_curriculumId_idx" ON "Cohort"("curriculumId");

ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. CohortMember
CREATE TABLE "CohortMember" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CohortMember_cohortId_userId_key" ON "CohortMember"("cohortId", "userId");
CREATE INDEX "CohortMember_cohortId_idx" ON "CohortMember"("cohortId");
CREATE INDEX "CohortMember_userId_idx" ON "CohortMember"("userId");

ALTER TABLE "CohortMember" ADD CONSTRAINT "CohortMember_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortMember" ADD CONSTRAINT "CohortMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. PracticalAssessment
CREATE TABLE "PracticalAssessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domainId" TEXT,
    "timeLimit" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticalAssessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PracticalAssessment_domainId_idx" ON "PracticalAssessment"("domainId");

ALTER TABLE "PracticalAssessment" ADD CONSTRAINT "PracticalAssessment_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SkillDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 12. AssessmentScenario
CREATE TABLE "AssessmentScenario" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "expectedSteps" JSONB,
    "expectedState" JSONB,
    "hints" JSONB,

    CONSTRAINT "AssessmentScenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssessmentScenario_assessmentId_idx" ON "AssessmentScenario"("assessmentId");

ALTER TABLE "AssessmentScenario" ADD CONSTRAINT "AssessmentScenario_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PracticalAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 13. AssessmentOutcome
CREATE TABLE "AssessmentOutcome" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "learningOutcomeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "AssessmentOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentOutcome_assessmentId_learningOutcomeId_key" ON "AssessmentOutcome"("assessmentId", "learningOutcomeId");

ALTER TABLE "AssessmentOutcome" ADD CONSTRAINT "AssessmentOutcome_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PracticalAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentOutcome" ADD CONSTRAINT "AssessmentOutcome_learningOutcomeId_fkey" FOREIGN KEY ("learningOutcomeId") REFERENCES "LearningOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 14. StudentAssessment
CREATE TABLE "StudentAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "breakdown" JSONB,
    "feedback" JSONB,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "StudentAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentAssessment_userId_assessmentId_key" ON "StudentAssessment"("userId", "assessmentId");
CREATE INDEX "StudentAssessment_userId_idx" ON "StudentAssessment"("userId");
CREATE INDEX "StudentAssessment_assessmentId_idx" ON "StudentAssessment"("assessmentId");

ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PracticalAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 15. Certification
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "xpRequired" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Certification_code_key" ON "Certification"("code");

-- 16. CertificationAward
CREATE TABLE "CertificationAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "credentialId" TEXT NOT NULL,
    "evidenceSummary" JSONB NOT NULL,

    CONSTRAINT "CertificationAward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CertificationAward_credentialId_key" ON "CertificationAward"("credentialId");
CREATE UNIQUE INDEX "CertificationAward_userId_certificationId_key" ON "CertificationAward"("userId", "certificationId");
CREATE INDEX "CertificationAward_userId_idx" ON "CertificationAward"("userId");
CREATE INDEX "CertificationAward_credentialId_idx" ON "CertificationAward"("credentialId");

ALTER TABLE "CertificationAward" ADD CONSTRAINT "CertificationAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CertificationAward" ADD CONSTRAINT "CertificationAward_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
