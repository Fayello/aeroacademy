import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class MissionService implements OnModuleInit {
  private readonly logger = new Logger(MissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
  ) {}

  async onModuleInit() {
    await this.generateDailyMissions().catch((err) =>
      this.logger.error('Failed to generate daily missions on startup', err),
    );
    await this.generateWeeklyMissions().catch((err) =>
      this.logger.error('Failed to generate weekly missions on startup', err),
    );
    await this.generateMonthlyMissions().catch((err) =>
      this.logger.error('Failed to generate monthly missions on startup', err),
    );
  }

  async getDailyMissions(userId: string) {
    const now = new Date();

    const challenges = await this.prisma.challenge.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
    });

    const missions: any[] = [];

    for (const challenge of challenges) {
      const userChallenge = await this.prisma.userChallenge.upsert({
        where: { userId_challengeId: { userId, challengeId: challenge.id } },
        update: {},
        create: {
          userId,
          challengeId: challenge.id,
          target: challenge.objectiveTarget,
        },
      });

      const tierMap: Record<string, string> = {
        DAILY_WARMUP: 'warmup',
        DAILY_SKILL: 'skill',
        DAILY_BOSS: 'boss',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
      };

      missions.push({
        id: challenge.id,
        type: tierMap[challenge.type] ?? challenge.type,
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        objectiveType: challenge.objectiveType,
        objectiveTarget: challenge.objectiveTarget,
        xpReward: challenge.xpReward,
        domain: challenge.domainId,
        skill: challenge.skillId,
        labId: (challenge.metadata as any)?.labId ?? null,
        progress: userChallenge.progress,
        completed: userChallenge.completed,
        claimedAt: userChallenge.claimedAt,
        endAt: challenge.endAt,
      });
    }

    return missions;
  }

  async claimReward(userId: string, challengeId: string) {
    const userChallenge = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
      include: { challenge: true },
    });

    if (!userChallenge) {
      throw new BadRequestException('Mission not found for this user');
    }
    if (!userChallenge.completed) {
      throw new BadRequestException('Mission is not yet completed');
    }
    if (userChallenge.claimedAt) {
      throw new BadRequestException('Reward already claimed');
    }

    const result = await this.progressionService.awardXP(userId, {
      amount: userChallenge.challenge.xpReward,
      source: 'MISSION_REWARD',
      sourceId: challengeId,
    });

    await this.prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: { claimedAt: new Date() },
    });

    await this.prisma.progressionEvent.create({
      data: {
        userId,
        type: 'MISSION_COMPLETED',
        amount: userChallenge.challenge.xpReward,
        source: 'MISSION_REWARD',
        sourceId: challengeId,
      },
    });

    return result;
  }

  async checkProgress(userId: string, eventType: string, entityId?: string) {
    const activeChallenges = await this.prisma.challenge.findMany({
      where: { isActive: true, objectiveType: eventType },
    });

    for (const ch of activeChallenges) {
      await this.prisma.userChallenge.upsert({
        where: { userId_challengeId: { userId, challengeId: ch.id } },
        update: {},
        create: { userId, challengeId: ch.id, target: ch.objectiveTarget },
      });
    }

    const userChallenges = await this.prisma.userChallenge.findMany({
      where: {
        userId,
        completed: false,
        challenge: { isActive: true },
      },
      include: { challenge: true },
    });

    const newlyCompleted: string[] = [];

    for (const uc of userChallenges) {
      if (uc.challenge.objectiveType !== eventType) continue;

      let newProgress = uc.progress;

      switch (eventType) {
        case 'FLAG_COMPLETIONS':
        case 'LAB_COMPLETIONS':
        case 'LESSON_COMPLETIONS':
        case 'QUIZ_COMPLETIONS':
          newProgress = uc.progress + 1;
          break;

        case 'XP_EARNED': {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true },
          });
          newProgress = user?.xp ?? uc.progress;
          break;
        }

        case 'SKILL_XP_EARNED': {
          if (!uc.challenge.domainId) break;
          const skill = await this.prisma.skill.findFirst({
            where: {
              domainId: uc.challenge.domainId,
              name: uc.challenge.skillId ?? undefined,
            },
          });
          if (!skill) break;
          const userSkill = await this.prisma.userSkill.findUnique({
            where: { userId_skillId: { userId, skillId: skill.id } },
          });
          newProgress = userSkill?.xp ?? 0;
          break;
        }

        default:
          continue;
      }

      if (newProgress >= uc.target && !uc.completed) {
        await this.prisma.userChallenge.update({
          where: { id: uc.id },
          data: { progress: newProgress, completed: true, completedAt: new Date() },
        });
        newlyCompleted.push(uc.challengeId);
        this.logger.log(
          `User ${userId} completed mission "${uc.challenge.title}"`,
        );
      } else if (newProgress !== uc.progress) {
        await this.prisma.userChallenge.update({
          where: { id: uc.id },
          data: { progress: newProgress },
        });
      }
    }

    return newlyCompleted;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyMissions() {
    this.logger.log('Running daily mission generation cron...');
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const tomorrow = new Date(startOfDay);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.challenge.findFirst({
      where: {
        type: { startsWith: 'DAILY' },
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
    });

    if (existing) {
      this.logger.log('Daily missions already exist for today, skipping');
      return;
    }

    const labs = await this.prisma.lab.findMany({
      include: {
        labSkills: { include: { skill: { include: { domain: true } } } },
      },
    });

    if (labs.length === 0) {
      this.logger.warn('No labs found, cannot generate daily missions');
      return;
    }

    const beginner = labs.filter((l) => l.difficulty < 1200);
    const intermediate = labs.filter(
      (l) => l.difficulty >= 1200 && l.difficulty < 1400,
    );
    const advanced = labs.filter((l) => l.difficulty >= 1400);

    const pick = <T>(arr: T[]): T | undefined =>
      arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

    const warmupLab = pick(beginner) ?? pick(labs)!;
    const skillLab = pick(intermediate) ?? pick(labs)!;
    const bossLab = pick(advanced) ?? pick(labs)!;

    const warmupSkill = warmupLab.labSkills[0]?.skill;
    const skillSkill = skillLab.labSkills[0]?.skill;
    const bossSkill = bossLab.labSkills[0]?.skill;

    const missions = [
      {
        type: 'DAILY_WARMUP',
        domainId: warmupSkill?.domainId ?? null,
        skillId: warmupSkill?.id ?? null,
        title: `Daily Warmup: ${warmupLab.title}`,
        description: 'Solve 1 flag in a beginner lab to warm up.',
        difficulty: 'EASY',
        objectiveType: 'FLAG_COMPLETIONS',
        objectiveTarget: 1,
        xpReward: 50,
        startAt: startOfDay,
        endAt: endOfDay,
        metadata: { labId: warmupLab.id },
      },
      {
        type: 'DAILY_SKILL',
        domainId: skillSkill?.domainId ?? null,
        skillId: skillSkill?.id ?? null,
        title: `Daily Skill: ${skillLab.title}`,
        description: 'Solve 3 flags in an intermediate lab to sharpen your skills.',
        difficulty: 'MEDIUM',
        objectiveType: 'FLAG_COMPLETIONS',
        objectiveTarget: 3,
        xpReward: 150,
        startAt: startOfDay,
        endAt: endOfDay,
        metadata: { labId: skillLab.id },
      },
      {
        type: 'DAILY_BOSS',
        domainId: bossSkill?.domainId ?? null,
        skillId: bossSkill?.id ?? null,
        title: `Daily Boss: ${bossLab.title}`,
        description: 'Complete an advanced lab to prove your mastery.',
        difficulty: 'HARD',
        objectiveType: 'LAB_COMPLETIONS',
        objectiveTarget: 1,
        xpReward: 500,
        startAt: startOfDay,
        endAt: endOfDay,
        metadata: { labId: bossLab.id },
      },
    ];

    const created = await Promise.all(
      missions.map((m) => this.prisma.challenge.create({ data: m })),
    );

    this.logger.log(`Generated ${created.length} daily missions`);
    return created;
  }

  @Cron(CronExpression.EVERY_MONDAY_AT_MIDNIGHT)
  async generateWeeklyMissions() {
    this.logger.log('Running weekly mission generation cron...');
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const existing = await this.prisma.challenge.findFirst({
      where: { type: 'WEEKLY', isActive: true, startAt: { lte: now }, endAt: { gte: now } },
    });

    if (existing) {
      this.logger.log('Weekly missions already exist, skipping');
      return;
    }

    const labs = await this.prisma.lab.findMany({
      include: { labSkills: { include: { skill: { include: { domain: true } } } } },
    });

    if (labs.length === 0) return;

    const pick = <T>(arr: T[]): T | undefined =>
      arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

    const allSkills = await this.prisma.skill.findMany({ include: { domain: true } });
    const pickSkill = pick(allSkills);

    const targetLab = pick(labs)!;

    const missions = [
      {
        type: 'WEEKLY',
        domainId: pickSkill?.domainId ?? null,
        skillId: pickSkill?.id ?? null,
        title: `Weekly Challenge: ${targetLab.title}`,
        description: 'Solve 10 flags across any labs this week.',
        difficulty: 'MEDIUM',
        objectiveType: 'FLAG_COMPLETIONS',
        objectiveTarget: 10,
        xpReward: 500,
        startAt: startOfWeek,
        endAt: endOfWeek,
        metadata: {},
      },
    ];

    const created = await Promise.all(
      missions.map((m) => this.prisma.challenge.create({ data: m })),
    );

    this.logger.log(`Generated ${created.length} weekly missions`);
    return created;
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyMissions() {
    this.logger.log('Running monthly mission generation cron...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const existing = await this.prisma.challenge.findFirst({
      where: { type: 'MONTHLY', isActive: true, startAt: { lte: now }, endAt: { gte: now } },
    });

    if (existing) {
      this.logger.log('Monthly missions already exist, skipping');
      return;
    }

    const labs = await this.prisma.lab.findMany({
      include: { labSkills: { include: { skill: { include: { domain: true } } } } },
    });

    if (labs.length === 0) return;

    const pick = <T>(arr: T[]): T | undefined =>
      arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

    const allSkills = await this.prisma.skill.findMany({ include: { domain: true } });
    const pickSkill = pick(allSkills);

    const targetLab = pick(labs)!;

    const missions = [
      {
        type: 'MONTHLY',
        domainId: pickSkill?.domainId ?? null,
        skillId: pickSkill?.id ?? null,
        title: `Monthly Boss: ${targetLab.title}`,
        description: 'Complete 3 labs this month to earn a massive XP bonus.',
        difficulty: 'HARD',
        objectiveType: 'LAB_COMPLETIONS',
        objectiveTarget: 3,
        xpReward: 2000,
        startAt: startOfMonth,
        endAt: endOfMonth,
        metadata: {},
      },
    ];

    const created = await Promise.all(
      missions.map((m) => this.prisma.challenge.create({ data: m })),
    );

    this.logger.log(`Generated ${created.length} monthly missions`);
    return created;
  }
}
