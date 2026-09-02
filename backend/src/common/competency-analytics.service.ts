import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompetencyAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Radar chart data: per-domain competency scores (0-100)
   */
  async getRadarData(userId: string) {
    const domains = await this.prisma.skillDomain.findMany({
      include: {
        learningOutcomes: {
          include: {
            evidence: { where: { userId } },
          },
        },
        skills: {
          include: {
            userSkills: { where: { userId } },
          },
        },
      },
    });

    return domains.map((d) => {
      // Outcome-based competency
      const outcomes = d.learningOutcomes;
      const outcomeScores = outcomes.map((lo) => {
        const scores = lo.evidence.map((e) => e.score);
        return scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      });
      const avgOutcomeScore =
        outcomeScores.length > 0
          ? outcomeScores.reduce((a, b) => a + b, 0) / outcomeScores.length
          : 0;

      // Skill-based mastery
      const userSkills = d.skills
        .flatMap((s) => s.userSkills)
        .filter((us) => us.xp > 0);
      const avgMastery =
        userSkills.length > 0
          ? userSkills.reduce((s, us) => s + us.mastery, 0) / userSkills.length
          : 0;

      // Lab completion rate
      const totalLabs = outcomes.flatMap((lo) =>
        lo.evidence.filter((e) => e.activityType === 'LAB_COMPLETED'),
      ).length;
      const completedLabs = new Set(
        outcomes.flatMap((lo) =>
          lo.evidence
            .filter((e) => e.activityType === 'LAB_COMPLETED')
            .map((e) => e.activityId),
        ),
      ).size;

      // Combined score: 50% outcome + 30% mastery + 20% lab completion
      const labPct =
        d.learningOutcomes.length > 0
          ? (completedLabs / d.learningOutcomes.length) * 100
          : 0;
      const combined = avgOutcomeScore * 0.5 + avgMastery * 0.3 + labPct * 0.2;

      return {
        domain: d.name,
        displayName: d.displayName,
        outcomeScore: Math.round(avgOutcomeScore * 10) / 10,
        masteryScore: Math.round(avgMastery * 10) / 10,
        labCompletion: Math.round(labPct * 10) / 10,
        combined: Math.round(combined * 10) / 10,
        totalOutcomes: outcomes.length,
        completedOutcomes: outcomeScores.filter((s) => s >= 70).length,
        totalSkills: d.skills.length,
        activeSkills: userSkills.length,
      };
    });
  }

  /**
   * Growth trajectory: competency over time (last 30 days)
   */
  async getGrowthTrajectory(userId: string, days = 30) {
    const now = new Date();
    const start = new Date(now.getTime() - days * 86400000);

    const evidence = await this.prisma.outcomeEvidence.findMany({
      where: {
        userId,
        demonstratedAt: { gte: start },
      },
      include: { outcome: { include: { domain: true } } },
      orderBy: { demonstratedAt: 'asc' },
    });

    // Group by day
    const dailyData: Record<string, Record<string, number>> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = {};
    }

    // Accumulate evidence per domain per day
    for (const e of evidence) {
      const day = e.demonstratedAt.toISOString().split('T')[0];
      const domain = e.outcome.domain.name;
      if (!dailyData[day]) dailyData[day] = {};
      if (!dailyData[day][domain]) dailyData[day][domain] = 0;
      dailyData[day][domain] += e.score;
    }

    // Convert to chart data with cumulative averages
    const domains = await this.prisma.skillDomain.findMany();
    const domainNames = domains.map((d) => d.name);
    const cumulativeScores: Record<string, number[]> = {};
    domainNames.forEach((dn) => {
      cumulativeScores[dn] = [];
    });

    const chartData = Object.entries(dailyData).map(([date, domainScores]) => {
      const entry: Record<string, any> = { date };
      for (const dn of domainNames) {
        const dayScore = domainScores[dn] || 0;
        const prevAvg =
          cumulativeScores[dn].length > 0
            ? cumulativeScores[dn][cumulativeScores[dn].length - 1]
            : 0;
        const newAvg = dayScore > 0 ? (prevAvg + dayScore) / 2 : prevAvg;
        cumulativeScores[dn].push(newAvg);
        entry[dn] = Math.round(newAvg * 10) / 10;
      }
      return entry;
    });

    return { chartData, domainNames };
  }

  /**
   * Cross-domain correlation: how domains relate to each other
   */
  async getCrossDomainCorrelation(userId: string) {
    const domains = await this.prisma.skillDomain.findMany({
      include: {
        learningOutcomes: {
          include: {
            evidence: { where: { userId } },
          },
        },
      },
    });

    const domainScores = domains.map((d) => {
      const outcomes = d.learningOutcomes;
      const scores = outcomes.flatMap((lo) => lo.evidence.map((e) => e.score));
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      return {
        domain: d.name,
        displayName: d.displayName,
        score: avg,
        evidenceCount: scores.length,
      };
    });

    // Compute correlation matrix
    const matrix: Array<{
      domainA: string;
      domainB: string;
      correlation: number;
      strength: 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE';
    }> = [];

    for (let i = 0; i < domainScores.length; i++) {
      for (let j = i + 1; j < domainScores.length; j++) {
        const a = domainScores[i];
        const b = domainScores[j];

        // Simple correlation proxy: if both have evidence, check if scores are similar
        // More sophisticated would need per-outcome paired data
        const scoreDiff = Math.abs(a.score - b.score);
        const bothActive = a.evidenceCount > 0 && b.evidenceCount > 0;

        let correlation = 0;
        if (bothActive) {
          // Negative diff = higher correlation
          correlation = Math.max(0, 1 - scoreDiff / 100);
        }

        let strength: 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE' = 'NONE';
        if (correlation >= 0.7) strength = 'STRONG';
        else if (correlation >= 0.4) strength = 'MODERATE';
        else if (correlation > 0) strength = 'WEAK';

        matrix.push({
          domainA: a.displayName,
          domainB: b.displayName,
          correlation: Math.round(correlation * 100) / 100,
          strength,
        });
      }
    }

    // Identify strongest correlations
    const strongest = matrix
      .filter((m) => m.strength === 'STRONG' || m.strength === 'MODERATE')
      .sort((a, b) => b.correlation - a.correlation)
      .slice(0, 5);

    // Identify gaps: domains with 0 evidence
    const gaps = domainScores
      .filter((d) => d.evidenceCount === 0)
      .map((d) => d.displayName);

    return {
      domainScores,
      correlationMatrix: matrix,
      strongestCorrelations: strongest,
      gaps,
    };
  }

  /**
   * Competency trends: week-over-week comparison
   */
  async getCompetencyTrends(userId: string) {
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 86400000);
    const lastWeekStart = new Date(now.getTime() - 14 * 86400000);

    const [thisWeekEvidence, lastWeekEvidence] = await Promise.all([
      this.prisma.outcomeEvidence.findMany({
        where: {
          userId,
          demonstratedAt: { gte: thisWeekStart },
        },
        include: { outcome: { include: { domain: true } } },
      }),
      this.prisma.outcomeEvidence.findMany({
        where: {
          userId,
          demonstratedAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
        include: { outcome: { include: { domain: true } } },
      }),
    ]);

    const domains = await this.prisma.skillDomain.findMany();

    const trends = domains.map((d) => {
      const thisWeekScores = thisWeekEvidence
        .filter((e) => e.outcome.domainId === d.id)
        .map((e) => e.score);
      const lastWeekScores = lastWeekEvidence
        .filter((e) => e.outcome.domainId === d.id)
        .map((e) => e.score);

      const thisWeekAvg =
        thisWeekScores.length > 0
          ? thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length
          : 0;
      const lastWeekAvg =
        lastWeekScores.length > 0
          ? lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length
          : 0;

      const change = thisWeekAvg - lastWeekAvg;
      const changePct =
        lastWeekAvg > 0
          ? (change / lastWeekAvg) * 100
          : thisWeekAvg > 0
            ? 100
            : 0;

      return {
        domainId: d.id,
        domainName: d.displayName,
        thisWeekAvg: Math.round(thisWeekAvg * 10) / 10,
        lastWeekAvg: Math.round(lastWeekAvg * 10) / 10,
        change: Math.round(change * 10) / 10,
        changePct: Math.round(changePct),
        trend: change > 5 ? 'UP' : change < -5 ? 'DOWN' : 'STABLE',
        thisWeekEvidenceCount: thisWeekScores.length,
        lastWeekEvidenceCount: lastWeekScores.length,
      };
    });

    // Overall trend
    const totalThisWeek = thisWeekEvidence.length;
    const totalLastWeek = lastWeekEvidence.length;
    const overallTrend =
      totalThisWeek > totalLastWeek
        ? 'UP'
        : totalThisWeek < totalLastWeek
          ? 'DOWN'
          : 'STABLE';

    return {
      trends,
      overall: {
        thisWeekEvidence: totalThisWeek,
        lastWeekEvidence: totalLastWeek,
        trend: overallTrend,
      },
    };
  }
}
