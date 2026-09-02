import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

type Any = any;

@Injectable()
export class LabAnalyticsService {
  private readonly logger = new Logger(LabAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async aggregateAll() {
    this.logger.log('Starting nightly lab analytics aggregation...');
    try {
      const count = await this.aggregateAllLabs();
      this.logger.log(`Aggregated analytics for ${count} labs`);
    } catch (err) {
      this.logger.error('Lab analytics aggregation failed', err);
    }
  }

  async aggregateAllLabs(): Promise<number> {
    const labs = await this.prisma.lab.findMany({ select: { id: true } });
    let count = 0;
    for (const lab of labs) {
      try {
        await this.aggregateLab(lab.id);
        count++;
      } catch (err) {
        this.logger.warn(`Failed to aggregate lab ${lab.id}: ${err}`);
      }
    }
    return count;
  }

  async aggregateLab(labId: string): Promise<void> {
    const [instances, submissions, flags, labSkills] = await Promise.all([
      this.prisma.labInstance.findMany({
        where: { labId },
        select: { id: true, status: true, createdAt: true, expiresAt: true },
      }),
      this.prisma.labSubmission.findMany({
        where: { flag: { labId } },
        select: { id: true, isCorrect: true, createdAt: true, flagId: true },
      }),
      this.prisma.labFlag.findMany({
        where: { labId },
        select: { id: true, title: true, points: true },
      }),
      this.prisma.labSkill.findMany({
        where: { labId },
        select: {
          skill: { select: { domain: { select: { displayName: true } } } },
        },
      }),
    ]);

    const totalAttempts = instances.length;
    const completions = instances.filter(
      (i) => (i.status as string) === 'COMPLETED',
    ).length;
    const completionRate =
      totalAttempts > 0 ? (completions / totalAttempts) * 100 : 0;

    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter((s) => s.isCorrect).length;
    const failureRate =
      totalSubmissions > 0
        ? ((totalSubmissions - correctSubmissions) / totalSubmissions) * 100
        : 0;

    // Calculate average time from completed instances
    const completedInstances = instances.filter(
      (i) => (i.status as string) === 'COMPLETED',
    );
    const avgTimeMinutes =
      completedInstances.length > 0
        ? completedInstances.reduce((sum, i) => {
            const timeMs =
              new Date(i.expiresAt).getTime() - new Date(i.createdAt).getTime();
            return sum + timeMs / (1000 * 60);
          }, 0) / completedInstances.length
        : 0;

    // Step-level analytics from flag submissions
    const stepAnalytics = flags.map((flag) => {
      const flagSubs = submissions.filter((s) => s.flagId === flag.id);
      const flagCorrect = flagSubs.filter((s) => s.isCorrect).length;
      const flagFailureRate =
        flagSubs.length > 0
          ? ((flagSubs.length - flagCorrect) / flagSubs.length) * 100
          : 0;

      return {
        step: flag.title,
        attempts: flagSubs.length,
        completions: flagCorrect,
        failureRate: Math.round(flagFailureRate * 10) / 10,
        points: flag.points,
      };
    });

    // Weekly trend (last 8 weeks)
    const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
    const recentInstances = instances.filter(
      (i) => new Date(i.createdAt) >= eightWeeksAgo,
    );
    const weeklyCompletions = Array.from({ length: 8 }, (_, weekIdx) => {
      const weekStart = new Date(
        Date.now() - (7 - weekIdx) * 7 * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(
        Date.now() - (6 - weekIdx) * 7 * 24 * 60 * 60 * 1000,
      );
      const count = recentInstances.filter(
        (i) =>
          (i.status as string) === 'COMPLETED' &&
          new Date(i.createdAt) >= weekStart &&
          new Date(i.createdAt) < weekEnd,
      ).length;
      return { week: weekIdx + 1, count };
    });

    const weeklyAttempts = Array.from({ length: 8 }, (_, weekIdx) => {
      const weekStart = new Date(
        Date.now() - (7 - weekIdx) * 7 * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(
        Date.now() - (6 - weekIdx) * 7 * 24 * 60 * 60 * 1000,
      );
      const count = recentInstances.filter(
        (i) =>
          new Date(i.createdAt) >= weekStart && new Date(i.createdAt) < weekEnd,
      ).length;
      return { week: weekIdx + 1, count };
    });

    const domainName = labSkills[0]?.skill?.domain?.displayName || null;

    // Difficulty ELO adjustment based on actual performance
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { difficulty: true },
    });
    const difficultyELO = lab ? lab.difficulty : 1200;

    await this.prisma.labAnalytics.upsert({
      where: { labId },
      create: {
        labId,
        domainName,
        totalAttempts,
        completions,
        completionRate: Math.round(completionRate * 10) / 10,
        avgTimeMinutes: Math.round(avgTimeMinutes * 10) / 10,
        totalSubmissions,
        correctSubmissions,
        failureRate: Math.round(failureRate * 10) / 10,
        hintUsageRate: Math.round(failureRate * 10) / 10,
        difficultyELO,
        tooEasy: completionRate > 85,
        tooHard: completionRate < 15 && totalAttempts >= 10,
        stepAnalytics,
        weeklyCompletions,
        weeklyAttempts,
        lastUpdated: new Date(),
      },
      update: {
        domainName,
        totalAttempts,
        completions,
        completionRate: Math.round(completionRate * 10) / 10,
        avgTimeMinutes: Math.round(avgTimeMinutes * 10) / 10,
        totalSubmissions,
        correctSubmissions,
        failureRate: Math.round(failureRate * 10) / 10,
        hintUsageRate: Math.round(failureRate * 10) / 10,
        difficultyELO,
        tooEasy: completionRate > 85,
        tooHard: completionRate < 15 && totalAttempts >= 10,
        stepAnalytics,
        weeklyCompletions,
        weeklyAttempts,
        lastUpdated: new Date(),
      },
    });
  }

  async getLabInsights(labId: string): Promise<Any> {
    const analytics = await this.prisma.labAnalytics.findUnique({
      where: { labId },
      include: {
        lab: { select: { title: true, description: true, difficulty: true } },
      },
    });

    if (!analytics) return null;

    const insights: string[] = [];

    if (analytics.tooEasy)
      insights.push(
        'This lab has a very high completion rate (>85%). Consider increasing difficulty or adding advanced flags.',
      );
    if (analytics.tooHard)
      insights.push(
        'This lab has a very low completion rate (<15%). Consider adding hints or simplifying early steps.',
      );
    if (analytics.failureRate > 70)
      insights.push(
        'High failure rate across flags. Students may need better prerequisites or more scaffolding.',
      );
    if (analytics.avgTimeMinutes > (analytics.lab as Any).difficulty * 0.05)
      insights.push(
        'Average completion time is high relative to difficulty. Consider simplifying the scenario.',
      );

    const stepData = analytics.stepAnalytics as Array<{
      step: string;
      failureRate: number;
    }> | null;
    if (stepData) {
      const hardestStep = stepData.reduce(
        (max, s) => (s.failureRate > max.failureRate ? s : max),
        stepData[0],
      );
      if (hardestStep && hardestStep.failureRate > 60) {
        insights.push(
          `Step "${hardestStep.step}" has ${hardestStep.failureRate}% failure rate — consider adding hints.`,
        );
      }
    }

    return {
      ...analytics,
      insights,
    };
  }
}
