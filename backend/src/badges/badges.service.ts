import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    private prisma: PrismaService,
    private progressionService: ProgressionService,
  ) {}

  async getAllBadges() {
    return this.prisma.badge.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });
  }

  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async checkAndAwardBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { badges: { select: { badgeId: true } } },
    });
    if (!user) return;

    const earnedBadgeIds = new Set(user.badges.map((b) => b.badgeId));
    const allBadges = await this.prisma.badge.findMany();

    const [lessonsCompleted, flagsCaptured, courseEnrollments, longestStreak] = await Promise.all([
      this.prisma.progress.count({ where: { userId, completed: true } }),
      this.prisma.labSubmission.count({ where: { userId, isCorrect: true } }),
      this.prisma.courseEnrollment.count({ where: { userId } }),
      user.longestStreak,
    ]);

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let earned = false;

      switch (badge.requirement) {
        case 'complete_1_lesson':
          earned = lessonsCompleted >= 1;
          break;
        case 'complete_5_lessons':
          earned = lessonsCompleted >= 5;
          break;
        case 'complete_10_lessons':
          earned = lessonsCompleted >= 10;
          break;
        case 'complete_25_lessons':
          earned = lessonsCompleted >= 25;
          break;
        case 'complete_50_lessons':
          earned = lessonsCompleted >= 50;
          break;
        case 'capture_1_flag':
          earned = flagsCaptured >= 1;
          break;
        case 'capture_5_flags':
          earned = flagsCaptured >= 5;
          break;
        case 'capture_10_flags':
          earned = flagsCaptured >= 10;
          break;
        case 'capture_25_flags':
          earned = flagsCaptured >= 25;
          break;
        case 'enroll_3_courses':
          earned = courseEnrollments >= 3;
          break;
        case 'enroll_5_courses':
          earned = courseEnrollments >= 5;
          break;
        case 'streak_7_days':
          earned = longestStreak >= 7;
          break;
        case 'streak_30_days':
          earned = longestStreak >= 30;
          break;
        case 'level_5':
          earned = Math.floor(user.xp / 1000) + 1 >= 5;
          break;
        case 'level_10':
          earned = Math.floor(user.xp / 1000) + 1 >= 10;
          break;
      }

      if (earned) {
        await this.prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });

        if (badge.xpReward > 0) {
          await this.progressionService.awardXP(userId, {
            amount: badge.xpReward,
            source: 'BADGE_EARNED',
            sourceId: badge.id,
          }).catch((err) => this.logger.error('ProgressionService.awardXP failed for badge', err));
        }

        this.logger.log(`Awarded badge "${badge.name}" to user ${userId}`);
      }
    }
  }

  async createBadge(data: {
    name: string;
    description: string;
    icon: string;
    category?: string;
    tier?: string;
    xpReward?: number;
    requirement: string;
  }) {
    return this.prisma.badge.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        category: data.category || 'SKILL',
        tier: data.tier || 'BRONZE',
        xpReward: data.xpReward || 0,
        requirement: data.requirement,
      },
    });
  }
}
