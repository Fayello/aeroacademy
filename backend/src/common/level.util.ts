import { XP_PER_LEVEL, LAB_DIFFICULTY_GATES, SECTION_GATES } from './gamification.constants';

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getRequiredLabLevel(difficulty: number): number {
  const gate = LAB_DIFFICULTY_GATES.find((g) => difficulty <= g.maxDifficulty)!;
  return gate.requiredLevel;
}

export function getRequiredSectionLevel(sectionTitle: string): number {
  return SECTION_GATES[sectionTitle] ?? 1;
}
