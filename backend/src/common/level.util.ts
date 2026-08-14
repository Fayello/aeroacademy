export function getLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

const LAB_DIFFICULTY_GATES: { maxDifficulty: number; requiredLevel: number }[] =
  [
    { maxDifficulty: 1100, requiredLevel: 1 },
    { maxDifficulty: 1300, requiredLevel: 4 },
    { maxDifficulty: 1500, requiredLevel: 7 },
    { maxDifficulty: Infinity, requiredLevel: 10 },
  ];

const SECTION_GATES: Record<string, number> = {
  Fundamentals: 1,
  Beginner: 1,
  Essentials: 1,
  Intermediate: 4,
  Advanced: 7,
  Expert: 10,
  Certifications: 10,
};

export function getRequiredLabLevel(difficulty: number): number {
  const gate = LAB_DIFFICULTY_GATES.find((g) => difficulty <= g.maxDifficulty)!;
  return gate.requiredLevel;
}

export function getRequiredSectionLevel(sectionTitle: string): number {
  return SECTION_GATES[sectionTitle] ?? 1;
}
