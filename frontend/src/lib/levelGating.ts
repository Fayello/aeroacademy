export function getLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

export function getLevelProgress(xp: number): number {
  return (xp % 1000) / 1000;
}

export interface LevelGate {
  requiredLevel: number;
  locked: boolean;
  reason: string;
}

const SECTION_GATES: Record<string, number> = {
  "Fundamentals": 1,
  "Beginner": 1,
  "Essentials": 1,
  "Intermediate": 4,
  "Advanced": 7,
  "Expert": 10,
  "Certifications": 10,
};

const LAB_DIFFICULTY_GATES: { maxDifficulty: number; requiredLevel: number }[] = [
  { maxDifficulty: 1100, requiredLevel: 1 },
  { maxDifficulty: 1300, requiredLevel: 4 },
  { maxDifficulty: 1500, requiredLevel: 7 },
  { maxDifficulty: Infinity, requiredLevel: 10 },
];

const SIDEBAR_GATES: Record<string, number> = {
  "/dashboard": 1,
  "/dashboard/courses": 1,
  "/dashboard/labs": 3,
  "/dashboard/leaderboard": 1,
  "/dashboard/certifications": 10,
  "/dashboard/registry": 5,
  "/dashboard/enterprise": 1,
  "/dashboard/profile": 1,
};

export function getCourseLock(sectionTitle: string, level: number): LevelGate {
  const required = SECTION_GATES[sectionTitle] ?? 1;
  return {
    requiredLevel: required,
    locked: level < required,
    reason: required <= 1 ? "" : `Reach Level ${required} to unlock`,
  };
}

export function getLabLock(difficulty: number, level: number): LevelGate {
  const gate = LAB_DIFFICULTY_GATES.find((g) => difficulty <= g.maxDifficulty)!;
  return {
    requiredLevel: gate.requiredLevel,
    locked: level < gate.requiredLevel,
    reason: gate.requiredLevel <= 1 ? "" : `Reach Level ${gate.requiredLevel} to unlock`,
  };
}

export function getSidebarItemLock(href: string, level: number): LevelGate {
  const required = SIDEBAR_GATES[href] ?? 1;
  return {
    requiredLevel: required,
    locked: level < required,
    reason: required <= 1 ? "" : `Reach Level ${required}`,
  };
}

export function getCertificationLock(level: number): LevelGate {
  return {
    requiredLevel: 10,
    locked: level < 10,
    reason: level < 10 ? "Reach Level 10 to earn certifications" : "",
  };
}
