import { labs } from '../../prisma/seed-enrich-labs';
import {
  LAB_REPAIR_BATCH_50_TITLES,
  LAB_REPAIR_INTERACTIVE_TITLES,
} from '../../prisma/lab-repair-batch-50';
import { assessLabCompatibility } from './lab-compatibility';

describe('50-lab repair catalog', () => {
  const cohort = LAB_REPAIR_BATCH_50_TITLES.map((title) =>
    labs.find((lab) => lab.title === title),
  );

  it('contains exactly 50 unique canonical lab titles', () => {
    expect(LAB_REPAIR_BATCH_50_TITLES).toHaveLength(50);
    expect(new Set(LAB_REPAIR_BATCH_50_TITLES).size).toBe(50);
    expect(cohort.every(Boolean)).toBe(true);
  });

  it('keeps every repaired definition compatible with its runtime', () => {
    for (const lab of cohort) {
      expect(assessLabCompatibility(lab!)).toEqual([]);
    }
  });

  it('normalizes artifact labs to the portable Ubuntu runtime', () => {
    for (const lab of cohort) {
      if (LAB_REPAIR_INTERACTIVE_TITLES.has(lab!.title)) continue;
      expect(lab!.dockerImage).toBe('aeroacademy/ubuntu-practice:22.04');
      expect(lab!.briefing.toLowerCase()).toContain(
        'runtime mode: portable artifact validation',
      );
      expect(lab!.tasks).toHaveLength(lab!.flags.length);
    }
  });

  it('retains purpose-built images for interactive targets', () => {
    for (const lab of cohort) {
      if (!LAB_REPAIR_INTERACTIVE_TITLES.has(lab!.title)) continue;
      expect(lab!.dockerImage).not.toBe('aeroacademy/ubuntu-practice:22.04');
      expect(lab!.briefing.toLowerCase()).not.toContain(
        'runtime mode: portable artifact validation',
      );
    }
  });
});
