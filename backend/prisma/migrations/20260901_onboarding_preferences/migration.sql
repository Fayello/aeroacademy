ALTER TABLE "UserPreference"
  ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingSelections" JSONB NOT NULL DEFAULT '{}';
