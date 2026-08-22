import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../common/events.service';
import { ProgressionService } from '../common/progression.service';
import createLogger from '../common/logger';

const logger = createLogger('Achievements');

@Injectable()
export class AchievementService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private progressionService: ProgressionService,
  ) {}

  async checkAndUnlockAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        progress: { where: { completed: true } },
        labSubmissions: { where: { isCorrect: true } },
      },
    });

    if (!user) return;

    const unlockedIds = new Set(user.achievements.map((a) => a.achievementId));
    const allAchievements = await this.prisma.achievement.findMany();

    for (const ach of allAchievements) {
      if (unlockedIds.has(ach.id)) continue;

      let shouldUnlock = false;
      const solvedCount = user.labSubmissions.length;
      const lessonCount = user.progress.length;

      // Logic by Code/Title
      if (ach.title === 'FIRST_BLOOD' && solvedCount >= 1) shouldUnlock = true;
      if (ach.title === 'PENTEST_APPRENTICE' && solvedCount >= 5)
        shouldUnlock = true;
      if (
        ach.title === 'ZERO_DAY_HUNTER' &&
        (solvedCount >= 10 || user.xp >= 5000)
      )
        shouldUnlock = true;

      // Compatibility with old names
      if (ach.title === 'Initiate Operative' && lessonCount >= 1)
        shouldUnlock = true;

      if (shouldUnlock) {
        try {
          await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: ach.id,
            },
          });
        } catch (e: unknown) {
          if ((e as { code?: string }).code === 'P2002') continue;
          throw e;
        }

        // Grant XP reward through the progression engine
        if (ach.xpReward > 0) {
          await this.progressionService.awardXP(userId, {
            amount: ach.xpReward,
            source: 'ACHIEVEMENT_UNLOCKED',
            sourceId: ach.id,
          }).catch((err) => logger.error('ProgressionService.awardXP failed for achievement', err));
        }

        logger.info(`Unlocked "${ach.title}" for user ${userId}`);

        this.eventsService.emit('ACHIEVEMENT_UNLOCKED', {
          userId,
          achievementId: ach.id,
          title: ach.title,
          description: ach.description,
          icon: ach.icon || 'Trophy',
          xpReward: ach.xpReward,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}
