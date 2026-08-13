export function getDifficultyStyle(difficulty: number) {
  if (difficulty <= 1100) return { label: "BEGINNER", color: "text-emerald-600", dot: "bg-emerald-500", bar: "bg-emerald-500", ring: "ring-emerald-500/30" };
  if (difficulty <= 1300) return { label: "INTERMEDIATE", color: "text-amber-600", dot: "bg-amber-500", bar: "bg-amber-500", ring: "ring-amber-500/30" };
  if (difficulty <= 1500) return { label: "ADVANCED", color: "text-orange-600", dot: "bg-orange-500", bar: "bg-orange-500", ring: "ring-orange-500/30" };
  return { label: "EXPERT", color: "text-rose-600", dot: "bg-rose-500", bar: "bg-rose-500", ring: "ring-rose-500/30" };
}

export function getEstimatedTime(flags: number): string {
  if (flags <= 2) return "~30m";
  if (flags <= 4) return "~1h";
  return "~2h";
}

export type LabFlag = { id: string; submissions?: unknown[] };

export function getSolvedCount(flags: LabFlag[] | undefined): number {
  return flags?.filter((f) => f.submissions?.length).length || 0;
}

export function getProgressStatus(flags: LabFlag[] | undefined): string {
  if (!flags || flags.length === 0) return "NOT_STARTED";
  const solved = getSolvedCount(flags);
  if (solved >= flags.length) return "COMPLETED";
  return solved > 0 ? "IN_PROGRESS" : "NOT_STARTED";
}