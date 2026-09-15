import {
  acceptsFinalLabCheckpointToken,
  getFinalLabCheckpointToken,
} from './lab-compatibility';

describe('final lab repair checkpoint validation', () => {
  const flagId = 'ABCDEF12-3456-7890-abcd-ef1234567890';
  const briefing = `### Runtime mode: portable artifact validation
### Repair cohort: final remaining labs`;

  it('derives a stable lowercase token from the persisted flag ID', () => {
    expect(getFinalLabCheckpointToken(flagId)).toBe('checkpoint-abcdef12');
  });

  it('accepts the published token for a final-cohort lab', () => {
    expect(
      acceptsFinalLabCheckpointToken(
        briefing,
        flagId,
        '  CHECKPOINT-ABCDEF12  ',
      ),
    ).toBe(true);
  });

  it('does not bypass answer validation for other labs or wrong tokens', () => {
    expect(
      acceptsFinalLabCheckpointToken(
        '### Runtime mode: portable artifact validation',
        flagId,
        'checkpoint-abcdef12',
      ),
    ).toBe(false);
    expect(
      acceptsFinalLabCheckpointToken(
        '### Runtime mode: service-backed validation\n### Repair cohort: final remaining labs',
        flagId,
        'checkpoint-abcdef12',
      ),
    ).toBe(false);
    expect(
      acceptsFinalLabCheckpointToken(briefing, flagId, 'checkpoint-deadbeef'),
    ).toBe(false);
  });
});
