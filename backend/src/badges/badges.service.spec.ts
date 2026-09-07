import { BadgesService } from './badges.service';

describe('BadgesService', () => {
  const progressionService = { awardXP: jest.fn() };

  function createService(prisma: Record<string, unknown>) {
    return new BadgesService(prisma as never, progressionService as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty badge catalog cleanly', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = createService({
      badge: { findMany },
    });

    await expect(service.getAllBadges()).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      include: { _count: { select: { users: true } } },
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });
  });

  it('returns user badges ordered newest first', async () => {
    const rows = [{ userId: 'user-1', badgeId: 'badge-1' }];
    const findMany = jest.fn().mockResolvedValue(rows);
    const service = createService({
      userBadge: { findMany },
    });

    await expect(service.getUserBadges('user-1')).resolves.toBe(rows);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  });
});
