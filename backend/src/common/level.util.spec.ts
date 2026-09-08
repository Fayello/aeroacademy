import { getLevel, getRequiredLabLevel, getRequiredSectionLevel } from './level.util';

describe('getLevel', () => {
  it('returns 1 for 0 XP', () => expect(getLevel(0)).toBe(1));
  it('returns 1 for 999 XP', () => expect(getLevel(999)).toBe(1));
  it('returns 2 for 1000 XP', () => expect(getLevel(1000)).toBe(2));
  it('returns 5 for 4000 XP', () => expect(getLevel(4000)).toBe(5));
  it('returns 11 for 10000 XP', () => expect(getLevel(10000)).toBe(11));
  it('returns 100 for 99000 XP', () => expect(getLevel(99000)).toBe(100));
});

describe('getRequiredLabLevel', () => {
  it('level 1 for easy labs (difficulty <= 1100)', () => {
    expect(getRequiredLabLevel(800)).toBe(1);
    expect(getRequiredLabLevel(1100)).toBe(1);
  });
  it('level 4 for medium labs (difficulty <= 1300)', () => {
    expect(getRequiredLabLevel(1200)).toBe(4);
    expect(getRequiredLabLevel(1300)).toBe(4);
  });
  it('level 7 for hard labs (difficulty <= 1500)', () => {
    expect(getRequiredLabLevel(1400)).toBe(7);
    expect(getRequiredLabLevel(1500)).toBe(7);
  });
  it('level 10 for expert labs (difficulty > 1500)', () => {
    expect(getRequiredLabLevel(1600)).toBe(10);
    expect(getRequiredLabLevel(2000)).toBe(10);
  });
});

describe('getRequiredSectionLevel', () => {
  it('level 1 for Fundamentals', () => expect(getRequiredSectionLevel('Fundamentals')).toBe(1));
  it('level 1 for Beginner', () => expect(getRequiredSectionLevel('Beginner')).toBe(1));
  it('level 1 for Essentials', () => expect(getRequiredSectionLevel('Essentials')).toBe(1));
  it('level 4 for Intermediate', () => expect(getRequiredSectionLevel('Intermediate')).toBe(4));
  it('level 7 for Advanced', () => expect(getRequiredSectionLevel('Advanced')).toBe(7));
  it('level 10 for Expert', () => expect(getRequiredSectionLevel('Expert')).toBe(10));
  it('level 10 for Certifications', () => expect(getRequiredSectionLevel('Certifications')).toBe(10));
  it('level 1 for unknown section (default)', () => expect(getRequiredSectionLevel('Random Stuff')).toBe(1));
});
