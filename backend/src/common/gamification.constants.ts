/**
 * Central gamification constants.
 *
 * All XP curves, level thresholds, streak bonuses, mission rewards,
 * and progression multipliers live here. Values can be overridden
 * via environment variables for A/B testing or seasonal tuning.
 */

// ─── Level System ───────────────────────────────────────────
export const XP_PER_LEVEL = parseInt(process.env.XP_PER_LEVEL || '1000', 10);

// ─── Skill System ───────────────────────────────────────────
export const XP_PER_SKILL_LEVEL = parseInt(process.env.XP_PER_SKILL_LEVEL || '500', 10);
export const MAX_SKILL_XP_FOR_MASTERY = parseInt(process.env.MAX_SKILL_XP_FOR_MASTERY || '5000', 10);

// ─── Lesson / Course ────────────────────────────────────────
export const BASE_LESSON_XP = parseInt(process.env.BASE_LESSON_XP || '100', 10);

// ─── Streak ─────────────────────────────────────────────────
export const STREAK_BONUS_XP = parseInt(process.env.STREAK_BONUS_XP || '500', 10);
export const STREAK_BONUS_RATE_PER_WEEK = 0.10;   // +10% per 7-day streak
export const STREAK_BONUS_MAX = 0.50;              // cap at +50%
export const FIRST_LESSON_BONUS_RATE = 0.50;       // +50% for first completion
export const STREAK_FREEZE_GAP_DAYS = 2;
export const STREAK_FREEZE_INTERVAL_DAYS = 7;

// ─── Daily Combo ────────────────────────────────────────────
export const COMBO_BASE_XP = parseInt(process.env.COMBO_BASE_XP || '100', 10);
export const COMBO_INCREMENT_XP = parseInt(process.env.COMBO_INCREMENT_XP || '50', 10);
export const COMBO_MAX_XP = parseInt(process.env.COMBO_MAX_XP || '500', 10);

// ─── Daily Mission Rewards ──────────────────────────────────
export const DAILY_WARMUP_XP = 50;
export const DAILY_SKILL_XP = 150;
export const DAILY_BOSS_XP = 500;

// ─── Weekly / Monthly / Seasonal ────────────────────────────
export const WEEKLY_MISSION_XP = 500;
export const TEAM_WEEKLY_MISSION_XP = 2000;
export const MONTHLY_MISSION_XP = 2000;
export const SEASONAL_MISSION_XP = 3000;

// ─── Certification ──────────────────────────────────────────
export const CERTIFICATION_XP_THRESHOLD = parseInt(process.env.CERTIFICATION_XP_THRESHOLD || '5000', 10);

// ─── League ELO ─────────────────────────────────────────────
export const ELO_K_FACTOR = 32;
export const ELO_SEASON_MULTIPLIER = 1.2;
export const ELO_DEFAULT_RATING = 1200;
export const ELO_DIVISIONS = [
  { name: 'TITAN', min: 2400 },
  { name: 'DIAMOND', min: 2000 },
  { name: 'PLATINUM', min: 1600 },
  { name: 'GOLD', min: 1200 },
  { name: 'SILVER', min: 800 },
  { name: 'BRONZE', min: 0 },
] as const;

// ─── Domain Ranking ─────────────────────────────────────────
export const DOMAIN_PLACEMENT_MATCHES = 5;
export const DOMAIN_K_FACTOR_PROVISIONAL = 48;
export const DOMAIN_K_FACTOR_NORMAL = 24;
export const DOMAIN_SOFT_RESET_DECAY = 0.3;
export const DOMAIN_DEFAULT_RATING = 1000;
export const DOMAIN_PERFORMANCE_WEIGHTS = {
  performance: 0.35,
  quality: 0.25,
  timeEfficiency: 0.20,
  independence: 0.20,
};
export const DOMAIN_DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  BEGINNER: 1.0,
  EASY: 1.0,
  MEDIUM: 1.5,
  HARD: 2.0,
  ADVANCED: 2.5,
  BOSS: 3.0,
  EXPERT: 3.5,
};
export const DOMAIN_DIVISIONS = [
  { name: 'BRONZE', min: 0, max: 1499, tiers: 4 },
  { name: 'SILVER', min: 1500, max: 2999, tiers: 4 },
  { name: 'GOLD', min: 3000, max: 4999, tiers: 4 },
  { name: 'PLATINUM', min: 5000, max: 7499, tiers: 4 },
  { name: 'DIAMOND', min: 7500, max: 10999, tiers: 4 },
  { name: 'MASTER', min: 11000, max: 14999, tiers: 4 },
  { name: 'GRANDMASTER', min: 15000, max: 999999, tiers: 4 },
] as const;

// ─── Capability Ranking ─────────────────────────────────────
export const CAPABILITY_WEIGHTS = {
  technicalPerformance: 0.40,
  difficulty: 0.25,
  consistency: 0.20,
  problemSolving: 0.15,
};
export const CAPABILITY_TIERS = [
  { name: 'EXPERT', min: 90 },
  { name: 'ADVANCED', min: 75 },
  { name: 'INTERMEDIATE', min: 60 },
  { name: 'DEVELOPING', min: 40 },
  { name: 'NOVICE', min: 0 },
] as const;

// ─── Mastery ────────────────────────────────────────────────
export const MASTERY_DECAY_THRESHOLD_DAYS = 7;
export const MASTERY_WARNING_THRESHOLD = 50;
export const MASTERY_STRENGTH_THRESHOLD = 70;
export const MASTERY_WEAKNESS_THRESHOLD = 40;
export const MASTERY_SOURCE_MULTIPLIERS: Record<string, number> = {
  FLAG_SOLVED: 1.0,
  LAB_COMPLETED: 1.1,
  BOSS_MISSION: 1.2,
  QUIZ_PASSED: 0.8,
};

// ─── Lab Difficulty Gates ───────────────────────────────────
export const LAB_DIFFICULTY_GATES: { maxDifficulty: number; requiredLevel: number }[] = [
  { maxDifficulty: 1100, requiredLevel: 1 },
  { maxDifficulty: 1300, requiredLevel: 4 },
  { maxDifficulty: 1500, requiredLevel: 7 },
  { maxDifficulty: Infinity, requiredLevel: 10 },
];

// ─── Section Gates ──────────────────────────────────────────
export const SECTION_GATES: Record<string, number> = {
  Fundamentals: 1,
  Beginner: 1,
  Essentials: 1,
  Intermediate: 4,
  Advanced: 7,
  Expert: 10,
  Certifications: 10,
};

// ─── Milestones ─────────────────────────────────────────────
export const MILESTONE_THRESHOLDS = [25, 50, 75, 100];

// ─── Mission Difficulty Bands ───────────────────────────────
export const MISSION_DIFFICULTY_BANDS = {
  beginner: { max: 1200 },
  intermediate: { min: 1200, max: 1399 },
  advanced: { min: 1400 },
};

// ─── Seasonal Access ────────────────────────────────────────
export const SEASONAL_ACCESS_LEVEL = 25;
