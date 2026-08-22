import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';
import { EventsService } from '../common/events.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MissionService implements OnModuleInit {
  private readonly logger = new Logger(MissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
    private readonly eventsService: EventsService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.generateDailyMissions().catch((err) =>
      this.logger.error('Failed to generate daily missions on startup', err),
    );
    await this.generateWeeklyMissions().catch((err) =>
      this.logger.error('Failed to generate weekly missions on startup', err),
    );
    await this.generateTeamWeeklyMissions().catch((err) =>
      this.logger.error('Failed to generate team weekly missions on startup', err),
    );
    await this.generateMonthlyMissions().catch((err) =>
      this.logger.error('Failed to generate monthly missions on startup', err),
    );
    await this.generateSeasonalEvent().catch((err) =>
      this.logger.error('Failed to generate seasonal event on startup', err),
    );
  }

  async getDailyMissions(userId: string) {
    const now = new Date();

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    const userLevel = Math.floor((user?.xp ?? 0) / 1000) + 1;

    const challenges = await this.prisma.challenge.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
        ...(userLevel < 25 ? { type: { not: 'SEASONAL' } } : {}),
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
        SEASONAL: 'seasonal',
        TEAM_WEEKLY: 'team_weekly',
      };

      const missionData: any = {
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
      };

      if (challenge.type === 'TEAM_WEEKLY') {
        const userWithTeam = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { teamId: true },
        });

        if (userWithTeam?.teamId) {
          const teamMemberIds = (
            await this.prisma.user.findMany({
              where: { teamId: userWithTeam.teamId },
              select: { id: true },
            })
          ).map((u) => u.id);

          const teamUserChallenges = await this.prisma.userChallenge.findMany({
            where: {
              challengeId: challenge.id,
              userId: { in: teamMemberIds },
            },
            include: {
              user: { select: { id: true, name: true, username: true, xp: true } },
            },
          });

          const teamProgress = teamUserChallenges.reduce((sum, uc) => sum + uc.progress, 0);
          const topContributors = teamUserChallenges
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3)
            .map((uc) => ({
              userId: uc.user.id,
              name: uc.user.name ?? uc.user.username ?? 'Unknown',
              progress: uc.progress,
              xp: uc.user.xp,
            }));

          missionData.teamProgress = teamProgress;
          missionData.teamTarget = challenge.objectiveTarget;
          missionData.topContributors = topContributors;
          missionData.progress = teamProgress;
        }
      }

      missions.push(missionData);
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
        this.eventsService.emit('MISSION_COMPLETED', {
          userId,
          title: uc.challenge.title,
          xpReward: uc.challenge.xpReward,
        });

        this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
          .then((user) => {
            if (user) {
              this.emailService.sendMissionCompleted(
                user.email, user.name, uc.challenge.title, uc.challenge.xpReward, uc.challenge.type,
              ).catch((err) => this.logger.error(`Mission completion email failed: ${err.message}`));
            }
          })
          .catch(() => {});
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

  @Cron('0 0 * * 1')
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

  @Cron('0 0 * * 1')
  async generateTeamWeeklyMissions() {
    this.logger.log('Running team weekly mission generation cron...');
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const existing = await this.prisma.challenge.findFirst({
      where: { type: 'TEAM_WEEKLY', isActive: true, startAt: { lte: now }, endAt: { gte: now } },
    });

    if (existing) {
      this.logger.log('Team weekly missions already exist, skipping');
      return;
    }

    const teams = await this.prisma.team.findMany();
    if (teams.length === 0) {
      this.logger.log('No teams found, skipping team weekly mission generation');
      return;
    }

    const allSkills = await this.prisma.skill.findMany({ include: { domain: true } });
    const pick = <T>(arr: T[]): T | undefined =>
      arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;
    const pickSkill = pick(allSkills);

    const mission = await this.prisma.challenge.create({
      data: {
        type: 'TEAM_WEEKLY',
        domainId: pickSkill?.domainId ?? null,
        skillId: pickSkill?.id ?? null,
        title: 'Team Weekly Challenge',
        description: 'Capture 50 flags as a team this week!',
        difficulty: 'MEDIUM',
        objectiveType: 'FLAG_COMPLETIONS',
        objectiveTarget: 50,
        xpReward: 2000,
        startAt: startOfWeek,
        endAt: endOfWeek,
        metadata: {},
      },
    });

    this.logger.log(`Generated team weekly mission: ${mission.title}`);
    return mission;
  }

  @Cron('0 0 1 * *')
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

  @Cron('0 0 1 * *')
  async generateSeasonalEvent() {
    this.logger.log('Running seasonal event generation cron...');
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const existing = await this.prisma.challenge.findFirst({
      where: { type: 'SEASONAL', isActive: true, startAt: { lte: now }, endAt: { gte: now } },
    });

    if (existing) {
      this.logger.log('Seasonal event already active, skipping');
      return;
    }

    const themes = [
      { name: 'Security Sprint', domain: 'SECURITY', desc: 'Capture 20 flags across security labs.', obj: 'FLAG_COMPLETIONS', target: 20, xp: 3000, diff: 'HARD' },
      { name: 'DevOps Marathon', domain: 'DEVOPS', desc: 'Complete 5 labs in the DevOps domain.', obj: 'LAB_COMPLETIONS', target: 5, xp: 3000, diff: 'MEDIUM' },
      { name: 'Networking Gauntlet', domain: 'NETWORKING', desc: 'Solve 15 flags in networking labs.', obj: 'FLAG_COMPLETIONS', target: 15, xp: 3000, diff: 'HARD' },
      { name: 'Database Deep Dive', domain: 'DATABASES', desc: 'Complete 4 database labs.', obj: 'LAB_COMPLETIONS', target: 4, xp: 3000, diff: 'MEDIUM' },
      { name: 'Systems Challenge', domain: 'SYSTEMS', desc: 'Solve 15 flags across systems labs.', obj: 'FLAG_COMPLETIONS', target: 15, xp: 3000, diff: 'HARD' },
      { name: 'QA Sprint', domain: 'QA', desc: 'Complete 3 QA labs.', obj: 'LAB_COMPLETIONS', target: 3, xp: 3000, diff: 'MEDIUM' },
    ];

    const theme = themes[month % themes.length];
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const domain = await this.prisma.skillDomain.findFirst({ where: { name: theme.domain } });

    const seasonal = await this.prisma.challenge.create({
      data: {
        type: 'SEASONAL',
        domainId: domain?.id ?? null,
        title: `Seasonal: ${theme.name}`,
        description: theme.desc,
        difficulty: theme.diff,
        objectiveType: theme.obj,
        objectiveTarget: theme.target,
        xpReward: theme.xp,
        startAt: startOfMonth,
        endAt: endOfMonth,
        metadata: { theme: theme.name, season: `${year}-${String(month + 1).padStart(2, '0')}` },
      },
    });

    this.logger.log(`Generated seasonal event: ${seasonal.title}`);
    return seasonal;
  }
}
