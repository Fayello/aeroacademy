import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../common/events.service';
import { ProgressionService } from '../common/progression.service';

const logger = new Logger('Achievements');

export const ACHIEVEMENT_DEFINITIONS = [
  // ─── MILESTONE: Flags ────────────────────────────────────
  {
    title: 'FIRST_BLOOD',
    description: 'Capture your first flag',
    icon: 'Target',
    category: 'MILESTONE',
    rarity: 'COMMON',
    requirementType: 'FLAGS_CAPTURED',
    requirementTarget: 1,
    xpReward: 50,
  },
  {
    title: 'FLAG_HUNTER',
    description: 'Capture 10 flags',
    icon: 'Crosshair',
    category: 'MILESTONE',
    rarity: 'UNCOMMON',
    requirementType: 'FLAGS_CAPTURED',
    requirementTarget: 10,
    xpReward: 150,
    chainParentId: 'FIRST_BLOOD',
  },
  {
    title: 'FLAG_VETERAN',
    description: 'Capture 50 flags',
    icon: 'Crosshair',
    category: 'MILESTONE',
    rarity: 'RARE',
    requirementType: 'FLAGS_CAPTURED',
    requirementTarget: 50,
    xpReward: 500,
    chainParentId: 'FLAG_HUNTER',
  },
  {
    title: 'FLAG_LEGEND',
    description: 'Capture 100 flags',
    icon: 'Crosshair',
    category: 'MILESTONE',
    rarity: 'EPIC',
    requirementType: 'FLAGS_CAPTURED',
    requirementTarget: 100,
    xpReward: 1000,
    chainParentId: 'FLAG_VETERAN',
  },
  {
    title: 'FLAG_GOD',
    description: 'Capture 500 flags',
    icon: 'Crosshair',
    category: 'MILESTONE',
    rarity: 'LEGENDARY',
    requirementType: 'FLAGS_CAPTURED',
    requirementTarget: 500,
    xpReward: 5000,
    chainParentId: 'FLAG_LEGEND',
  },

  // ─── MILESTONE: Labs ─────────────────────────────────────
  {
    title: 'FIRST_STRIKE',
    description: 'Complete your first lab',
    icon: 'Zap',
    category: 'MILESTONE',
    rarity: 'COMMON',
    requirementType: 'LABS_COMPLETED',
    requirementTarget: 1,
    xpReward: 100,
  },
  {
    title: 'PENTEST_APPRENTICE',
    description: 'Complete 5 labs',
    icon: 'Shield',
    category: 'MILESTONE',
    rarity: 'UNCOMMON',
    requirementType: 'LABS_COMPLETED',
    requirementTarget: 5,
    xpReward: 250,
    chainParentId: 'FIRST_STRIKE',
  },
  {
    title: 'PENTEST_OPERATIVE',
    description: 'Complete 15 labs',
    icon: 'Shield',
    category: 'MILESTONE',
    rarity: 'RARE',
    requirementType: 'LABS_COMPLETED',
    requirementTarget: 15,
    xpReward: 750,
    chainParentId: 'PENTEST_APPRENTICE',
  },
  {
    title: 'PENTEST_COMMANDER',
    description: 'Complete 30 labs',
    icon: 'Shield',
    category: 'MILESTONE',
    rarity: 'EPIC',
    requirementType: 'LABS_COMPLETED',
    requirementTarget: 30,
    xpReward: 2000,
    chainParentId: 'PENTEST_OPERATIVE',
  },

  // ─── MILESTONE: Lessons ──────────────────────────────────
  {
    title: 'INITIATE_OPERATIVE',
    description: 'Complete your first lesson',
    icon: 'BookOpen',
    category: 'MILESTONE',
    rarity: 'COMMON',
    requirementType: 'LESSONS_COMPLETED',
    requirementTarget: 1,
    xpReward: 25,
  },
  {
    title: 'DEDICATED_LEARNER',
    description: 'Complete 25 lessons',
    icon: 'GraduationCap',
    category: 'MILESTONE',
    rarity: 'UNCOMMON',
    requirementType: 'LESSONS_COMPLETED',
    requirementTarget: 25,
    xpReward: 300,
  },
  {
    title: 'KNOWLEDGE_SEEKER',
    description: 'Complete 100 lessons',
    icon: 'GraduationCap',
    category: 'MILESTONE',
    rarity: 'RARE',
    requirementType: 'LESSONS_COMPLETED',
    requirementTarget: 100,
    xpReward: 1500,
  },

  // ─── MILESTONE: Quizzes ──────────────────────────────────
  {
    title: 'QUIZ_INITIATE',
    description: 'Pass your first quiz',
    icon: 'CheckCircle',
    category: 'MILESTONE',
    rarity: 'COMMON',
    requirementType: 'QUIZZES_PASSED',
    requirementTarget: 1,
    xpReward: 50,
  },
  {
    title: 'QUIZ_MASTER',
    description: 'Pass 10 quizzes',
    icon: 'CheckCircle',
    category: 'MASTERY',
    rarity: 'UNCOMMON',
    requirementType: 'QUIZZES_PASSED',
    requirementTarget: 10,
    xpReward: 300,
  },

  // ─── MASTERY: Level ──────────────────────────────────────
  {
    title: 'LEVEL_5',
    description: 'Reach Level 5',
    icon: 'TrendingUp',
    category: 'MASTERY',
    rarity: 'COMMON',
    requirementType: 'LEVEL_REACHED',
    requirementTarget: 5,
    xpReward: 100,
  },
  {
    title: 'LEVEL_10',
    description: 'Reach Level 10',
    icon: 'TrendingUp',
    category: 'MASTERY',
    rarity: 'UNCOMMON',
    requirementType: 'LEVEL_REACHED',
    requirementTarget: 10,
    xpReward: 300,
  },
  {
    title: 'LEVEL_25',
    description: 'Reach Level 25',
    icon: 'TrendingUp',
    category: 'MASTERY',
    rarity: 'RARE',
    requirementType: 'LEVEL_REACHED',
    requirementTarget: 25,
    xpReward: 1000,
  },
  {
    title: 'LEVEL_50',
    description: 'Reach Level 50',
    icon: 'TrendingUp',
    category: 'MASTERY',
    rarity: 'EPIC',
    requirementType: 'LEVEL_REACHED',
    requirementTarget: 50,
    xpReward: 3000,
  },
  {
    title: 'LEVEL_100',
    description: 'Reach Level 100',
    icon: 'Crown',
    category: 'MASTERY',
    rarity: 'LEGENDARY',
    requirementType: 'LEVEL_REACHED',
    requirementTarget: 100,
    xpReward: 10000,
  },

  // ─── STREAK ──────────────────────────────────────────────
  {
    title: 'STREAK_3',
    description: 'Maintain a 3-day streak',
    icon: 'Flame',
    category: 'STREAK',
    rarity: 'COMMON',
    requirementType: 'STREAK_DAYS',
    requirementTarget: 3,
    xpReward: 50,
  },
  {
    title: 'STREAK_7',
    description: 'Maintain a 7-day streak',
    icon: 'Flame',
    category: 'STREAK',
    rarity: 'UNCOMMON',
    requirementType: 'STREAK_DAYS',
    requirementTarget: 7,
    xpReward: 200,
  },
  {
    title: 'STREAK_30',
    description: 'Maintain a 30-day streak',
    icon: 'Flame',
    category: 'STREAK',
    rarity: 'RARE',
    requirementType: 'STREAK_DAYS',
    requirementTarget: 30,
    xpReward: 1000,
  },
  {
    title: 'STREAK_90',
    description: 'Maintain a 90-day streak',
    icon: 'Flame',
    category: 'STREAK',
    rarity: 'EPIC',
    requirementType: 'STREAK_DAYS',
    requirementTarget: 90,
    xpReward: 3000,
  },

  // ─── CHALLENGE ───────────────────────────────────────────
  {
    title: 'MISSION_COMPLETE',
    description: 'Complete your first mission',
    icon: 'Target',
    category: 'CHALLENGE',
    rarity: 'COMMON',
    requirementType: 'MISSIONS_COMPLETED',
    requirementTarget: 1,
    xpReward: 50,
  },
  {
    title: 'MISSION_VETERAN',
    description: 'Complete 10 missions',
    icon: 'Target',
    category: 'CHALLENGE',
    rarity: 'UNCOMMON',
    requirementType: 'MISSIONS_COMPLETED',
    requirementTarget: 10,
    xpReward: 300,
  },
  {
    title: 'WEEKLY_WARRIOR',
    description: 'Complete 5 weekly challenges',
    icon: 'Calendar',
    category: 'CHALLENGE',
    rarity: 'UNCOMMON',
    requirementType: 'WEEKLY_CHALLENGES',
    requirementTarget: 5,
    xpReward: 500,
  },
  {
    title: 'SEASONAL_CONQUEROR',
    description: 'Complete a seasonal event',
    icon: 'Zap',
    category: 'CHALLENGE',
    rarity: 'RARE',
    requirementType: 'SEASONAL_COMPLETED',
    requirementTarget: 1,
    xpReward: 1000,
  },

  // ─── SOCIAL ──────────────────────────────────────────────
  {
    title: 'FIRST_REFERRAL',
    description: 'Refer your first friend',
    icon: 'Users',
    category: 'SOCIAL',
    rarity: 'COMMON',
    requirementType: 'REFERRALS',
    requirementTarget: 1,
    xpReward: 100,
  },
  {
    title: 'TEAM_PLAYER',
    description: 'Join a team',
    icon: 'Users',
    category: 'SOCIAL',
    rarity: 'COMMON',
    requirementType: 'TEAM_JOINED',
    requirementTarget: 1,
    xpReward: 50,
  },
  {
    title: 'DISCUSSION_STARTER',
    description: 'Post in a discussion',
    icon: 'MessageSquare',
    category: 'SOCIAL',
    rarity: 'COMMON',
    requirementType: 'DISCUSSION_POSTS',
    requirementTarget: 1,
    xpReward: 25,
  },
  {
    title: 'HELPFUL_OPERATIVE',
    description: 'Comment on 10 discussions',
    icon: 'MessageSquare',
    category: 'SOCIAL',
    rarity: 'UNCOMMON',
    requirementType: 'DISCUSSION_COMMENTS',
    requirementTarget: 10,
    xpReward: 200,
  },

  // ─── COURSE ──────────────────────────────────────────────
  {
    title: 'COURSE_ENROLLEE',
    description: 'Enroll in 3 courses',
    icon: 'BookOpen',
    category: 'MILESTONE',
    rarity: 'COMMON',
    requirementType: 'COURSES_ENROLLED',
    requirementTarget: 3,
    xpReward: 50,
  },
  {
    title: 'COURSE_GRADUATE',
    description: 'Complete a course',
    icon: 'GraduationCap',
    category: 'MILESTONE',
    rarity: 'UNCOMMON',
    requirementType: 'COURSES_COMPLETED',
    requirementTarget: 1,
    xpReward: 500,
  },
  {
    title: 'POLYGLOT',
    description: 'Complete 3 courses',
    icon: 'GraduationCap',
    category: 'MASTERY',
    rarity: 'RARE',
    requirementType: 'COURSES_COMPLETED',
    requirementTarget: 3,
    xpReward: 1500,
  },
];

@Injectable()
export class AchievementService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private progressionService: ProgressionService,
  ) {}

  async seedAchievements() {
    for (let i = 0; i < ACHIEVEMENT_DEFINITIONS.length; i++) {
      const def = ACHIEVEMENT_DEFINITIONS[i];
      // Find parent by title if chainParentId is set
      let chainParentId: string | null = null;
      if (def.chainParentId) {
        const parent = await this.prisma.achievement.findUnique({
          where: { title: def.chainParentId },
        });
        chainParentId = parent?.id ?? null;
      }

      await this.prisma.achievement.upsert({
        where: { title: def.title },
        update: {
          description: def.description,
          icon: def.icon,
          category: def.category,
          rarity: def.rarity,
          requirementType: def.requirementType,
          requirementTarget: def.requirementTarget,
          xpReward: def.xpReward,
          chainParentId,
          chainOrder: i,
        },
        create: {
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
          rarity: def.rarity,
          requirementType: def.requirementType,
          requirementTarget: def.requirementTarget,
          xpReward: def.xpReward,
          chainParentId,
          chainOrder: i,
        },
      });
    }
    return { seeded: ACHIEVEMENT_DEFINITIONS.length };
  }

  async getAchievementProgress(userId: string) {
    const allAchievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { chainOrder: 'asc' },
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua]),
    );
    const stats = await this.getUserStats(userId);

    return allAchievements.map((ach) => {
      const userAch = unlockedMap.get(ach.id);
      const progress = userAch
        ? userAch.progress
        : this.calculateProgress(ach, stats);
      const target = ach.requirementTarget;
      const unlocked = !!userAch;
      const percentage = Math.min(100, Math.round((progress / target) * 100));

      return {
        ...ach,
        unlocked,
        unlockedAt: userAch?.unlockedAt ?? null,
        progress,
        target,
        percentage,
      };
    });
  }

  async checkAndUnlockAchievements(userId: string) {
    const allAchievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua]),
    );
    const stats = await this.getUserStats(userId);

    const newlyUnlocked: string[] = [];

    for (const ach of allAchievements) {
      if (unlockedMap.has(ach.id)) continue;

      // Check chain prerequisite
      if (ach.chainParentId) {
        if (!unlockedMap.has(ach.chainParentId)) continue;
      }

      const progress = this.calculateProgress(ach, stats);

      if (progress >= ach.requirementTarget) {
        try {
          await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: ach.id,
              progress,
              target: ach.requirementTarget,
            },
          });
        } catch (e: unknown) {
          if ((e as { code?: string }).code === 'P2002') continue;
          throw e;
        }

        // Update progress on existing records that were partially tracked
        await this.prisma.userAchievement.updateMany({
          where: { userId, achievementId: ach.id },
          data: { progress, target: ach.requirementTarget },
        });

        // Grant XP reward
        if (ach.xpReward > 0) {
          await this.progressionService
            .awardXP(userId, {
              amount: ach.xpReward,
              source: 'ACHIEVEMENT_UNLOCKED',
              sourceId: ach.id,
            })
            .catch((err) =>
              logger.error(
                'ProgressionService.awardXP failed for achievement',
                err,
              ),
            );
        }

        newlyUnlocked.push(ach.id);
        logger.log(
          `Unlocked "${ach.title}" for user ${userId} (${progress}/${ach.requirementTarget})`,
        );

        this.eventsService.emit('ACHIEVEMENT_UNLOCKED', {
          userId,
          achievementId: ach.id,
          title: ach.title,
          description: ach.description,
          icon: ach.icon || 'Trophy',
          xpReward: ach.xpReward,
          rarity: ach.rarity,
          category: ach.category,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Update progress for partially completed achievements
        if (progress > 0) {
          await this.prisma.userAchievement
            .upsert({
              where: {
                userId_achievementId: { userId, achievementId: ach.id },
              },
              update: { progress },
              create: {
                userId,
                achievementId: ach.id,
                progress,
                target: ach.requirementTarget,
              },
            })
            .catch(() => {});
        }
      }
    }

    return newlyUnlocked;
  }

  private async getUserStats(userId: string) {
    const [
      flagsCaptured,
      labsCompleted,
      lessonsCompleted,
      quizzesPassed,
      user,
      missionCount,
      weeklyCount,
      coursesEnrolled,
      coursesCompleted,
      referrals,
      teamJoined,
      discussionPosts,
      discussionComments,
    ] = await Promise.all([
      this.prisma.labSubmission.count({ where: { userId, isCorrect: true } }),
      // Count distinct labs with at least one correct submission
      this.prisma.labSubmission
        .findMany({
          where: { userId, isCorrect: true },
          select: { flag: { select: { labId: true } } },
          distinct: ['flagId'],
        })
        .then((subs) => new Set(subs.map((s) => s.flag.labId)).size),
      this.prisma.progress.count({ where: { userId, completed: true } }),
      this.prisma.quizSubmission.count({ where: { userId, passed: true } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          xp: true,
          currentStreak: true,
          longestStreak: true,
          teamId: true,
          referredBy: true,
        },
      }),
      this.prisma.userChallenge.count({ where: { userId, completed: true } }),
      this.prisma.userChallenge.count({
        where: {
          userId,
          completed: true,
          challenge: { type: 'WEEKLY' },
        },
      }),
      this.prisma.courseEnrollment.count({ where: { userId } }),
      // Count completed courses (all lessons done)
      this.prisma.courseEnrollment
        .findMany({
          where: { userId },
          select: { courseId: true },
        })
        .then(async (enrollments) => {
          let completed = 0;
          for (const { courseId } of enrollments) {
            const total = await this.prisma.lesson.count({
              where: { section: { courseId } },
            });
            const done = await this.prisma.progress.count({
              where: {
                userId,
                completed: true,
                lesson: { section: { courseId } },
              },
            });
            if (total > 0 && done >= total) completed++;
          }
          return completed;
        }),
      this.prisma.user.count({ where: { referredBy: userId } }),
      this.prisma.user
        .findUnique({ where: { id: userId }, select: { teamId: true } })
        .then((u) => (u?.teamId ? 1 : 0)),
      this.prisma.discussionPost.count({ where: { userId } }),
      this.prisma.discussionComment.count({ where: { userId } }),
    ]);

    return {
      flagsCaptured,
      labsCompleted,
      lessonsCompleted,
      quizzesPassed,
      level: user ? Math.floor(user.xp / 1000) + 1 : 1,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      missionsCompleted: missionCount,
      weeklyChallenges: weeklyCount,
      coursesEnrolled,
      coursesCompleted,
      referrals,
      teamJoined,
      discussionPosts,
      discussionComments,
      seasonalCompleted: 0, // TODO: track seasonal completions
    };
  }

  private calculateProgress(
    ach: { requirementType: string; requirementTarget: number },
    stats: Record<string, number>,
  ): number {
    const key = ach.requirementType.toLowerCase();
    const value = stats[key] ?? 0;
    return Math.min(value, ach.requirementTarget);
  }
}
