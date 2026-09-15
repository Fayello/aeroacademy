import { labs } from '../../prisma/seed-enrich-labs';
import { LAB_REPAIR_BATCH_02_TITLES } from '../../prisma/lab-repair-batch-02';
import { assessLabCompatibility } from './lab-compatibility';

describe('second 50-lab repair catalog', () => {
  const cohort = LAB_REPAIR_BATCH_02_TITLES.map((title) =>
    labs.find((lab) => lab.title === title),
  );

  it('contains exactly 50 unique canonical lab titles', () => {
    expect(LAB_REPAIR_BATCH_02_TITLES).toHaveLength(50);
    expect(new Set(LAB_REPAIR_BATCH_02_TITLES).size).toBe(50);
    expect(cohort.every(Boolean)).toBe(true);
  });

  it('uses the portable runtime without compatibility blockers', () => {
    for (const lab of cohort) {
      expect(lab!.dockerImage).toBe('aeroacademy/ubuntu-practice:22.04');
      expect(lab!.briefing.toLowerCase()).toContain(
        'runtime mode: portable artifact validation',
      );
      expect(assessLabCompatibility(lab!)).toEqual([]);
    }
  });

  it('provides one deterministic task per checkpoint and exact guidance', () => {
    for (const lab of cohort) {
      expect(lab!.tasks).toHaveLength(lab!.flags.length);
      for (const flag of lab!.flags) {
        expect(flag.description).toContain(
          `Required result: ${flag.correctAnswer}`,
        );
      }
    }
  });
});
