import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Any = any;

export interface AtRiskStudent {
  userId: string;
  name: string;
  email: string;
  riskScore: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskFactors: string[];
  trends: {
    activityTrend: 'improving' | 'stable' | 'declining';
    masteryTrend: 'improving' | 'stable' | 'declining';
    assessmentTrend: 'improving' | 'stable' | 'declining';
  };
  metrics: {
    daysSinceActive: number;
    overallMastery: number;
    avgAssessmentScore: number;
    labsCompleted: number;
    totalXp: number;
    level: number;
    streakDays: number;
  };
}

export interface PerformanceForecast {
  userId: string;
  name: string;
  currentLevel: number;
  currentXp: number;
  xpVelocity: number; // xp per week
  projectedLevel30d: number;
  projectedLevel90d: number;
  masteryTrajectory: Array<{
    domain: string;
    current: number;
    projected30d: number;
    projected90d: number;
  }>;
  assessmentReadiness: Array<{
    category: string;
    readiness: number;
    estimate: string;
  }>;
  confidenceScore: number; // how confident we are in the forecast
}

export interface InterventionRecommendation {
  userId: string;
  name: string;
  urgency: 'immediate' | 'this_week' | 'this_month';
  actions: Array<{
    type: 'email' | 'meeting' | 'assignment' | 'resource' | 'peer';
    title: string;
    description: string;
    expectedImpact: string;
  }>;
  successProbability: number;
}

export interface PredictiveDashboard {
  cohortOverview: {
    totalStudents: number;
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    avgMastery: number;
    avgAssessmentScore: number;
  };
  trendSummary: {
    improving: number;
    stable: number;
    declining: number;
  };
  topInterventions: Array<{
    action: string;
    frequency: number;
    successRate: number;
  }>;
  riskDistribution: Array<{ range: string; count: number }>;
}

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── AT-RISK PREDICTION ────────────────────────────────

  async predictAtRiskStudents(cohortId?: string): Promise<AtRiskStudent[]> {
    const whereClause = cohortId
      ? { cohortMembers: { some: { cohortId } } }
      : {};

    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT', ...whereClause },
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        lastActivityDate: true,
        createdAt: true,
        userSkills: {
          select: { mastery: true, lastPracticedAt: true, isDecaying: true },
        },
        assessmentResults: {
          select: { score: true, maxScore: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const now = new Date();
    const results: AtRiskStudent[] = [];

    for (const user of users) {
      const daysSinceActive = user.lastActivityDate
        ? Math.floor(
            (now.getTime() - new Date(user.lastActivityDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

      // Calculate mastery metrics
      const masteries = user.userSkills.map((s) => s.mastery);
      const overallMastery =
        masteries.length > 0
          ? masteries.reduce((a, b) => a + b, 0) / masteries.length
          : 0;
      const decayingSkills = user.userSkills.filter((s) => s.isDecaying).length;

      // Calculate assessment metrics
      const scores = user.assessmentResults.map(
        (r) => (r.score / r.maxScore) * 100,
      );
      const avgAssessmentScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      // Trend analysis
      const activityTrend = this.calculateActivityTrend(daysSinceActive);
      const masteryTrend = this.calculateMasteryTrend(
        masteries,
        decayingSkills,
      );
      const assessmentTrend = this.calculateAssessmentTrend(scores);

      // Risk score calculation (weighted)
      let riskScore = 0;

      // Activity (35% weight)
      if (daysSinceActive > 14) riskScore += 35;
      else if (daysSinceActive > 7) riskScore += 25;
      else if (daysSinceActive > 3) riskScore += 15;

      // Mastery (25% weight)
      if (overallMastery < 20) riskScore += 25;
      else if (overallMastery < 40) riskScore += 18;
      else if (overallMastery < 60) riskScore += 10;

      // Assessment performance (20% weight)
      if (scores.length === 0)
        riskScore += 10; // no data is mild risk
      else if (avgAssessmentScore < 40) riskScore += 20;
      else if (avgAssessmentScore < 60) riskScore += 12;

      // Trends (20% weight)
      if (activityTrend === 'declining' && masteryTrend === 'declining')
        riskScore += 20;
      else if (activityTrend === 'declining' || masteryTrend === 'declining')
        riskScore += 12;
      if (assessmentTrend === 'declining') riskScore += 8;

      // Decaying skills penalty
      if (decayingSkills > 3) riskScore += 10;
      else if (decayingSkills > 1) riskScore += 5;

      riskScore = Math.min(100, Math.max(0, riskScore));

      const riskLevel: AtRiskStudent['riskLevel'] =
        riskScore >= 70
          ? 'critical'
          : riskScore >= 50
            ? 'high'
            : riskScore >= 30
              ? 'medium'
              : 'low';

      const riskFactors: string[] = [];
      if (daysSinceActive > 7)
        riskFactors.push(`Inactive for ${daysSinceActive} days`);
      if (overallMastery < 30)
        riskFactors.push(`Low mastery (${overallMastery.toFixed(0)}%)`);
      if (avgAssessmentScore < 50 && scores.length > 0)
        riskFactors.push(
          `Poor assessment scores (${avgAssessmentScore.toFixed(0)}%)`,
        );
      if (decayingSkills > 2)
        riskFactors.push(`${decayingSkills} skills decaying`);
      if (assessmentTrend === 'declining')
        riskFactors.push('Assessment scores declining');
      if (masteryTrend === 'declining') riskFactors.push('Mastery declining');

      const level = Math.floor(user.xp / 1000) + 1;

      results.push({
        userId: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        riskScore,
        riskLevel,
        riskFactors,
        trends: { activityTrend, masteryTrend, assessmentTrend },
        metrics: {
          daysSinceActive,
          overallMastery,
          avgAssessmentScore: Math.round(avgAssessmentScore),
          labsCompleted: 0,
          totalXp: user.xp,
          level,
          streakDays: Math.max(0, 7 - daysSinceActive),
        },
      });
    }

    return results.sort((a, b) => b.riskScore - a.riskScore);
  }

  private calculateActivityTrend(
    daysSinceActive: number,
  ): 'improving' | 'stable' | 'declining' {
    if (daysSinceActive <= 1) return 'improving';
    if (daysSinceActive <= 3) return 'stable';
    return 'declining';
  }

  private calculateMasteryTrend(
    masteries: number[],
    decayingCount: number,
  ): 'improving' | 'stable' | 'declining' {
    if (masteries.length === 0) return 'stable';
    if (decayingCount > masteries.length * 0.3) return 'declining';
    const avg = masteries.reduce((a, b) => a + b, 0) / masteries.length;
    if (avg > 60) return 'improving';
    if (avg < 30) return 'declining';
    return 'stable';
  }

  private calculateAssessmentTrend(
    scores: number[],
  ): 'improving' | 'stable' | 'declining' {
    if (scores.length < 2) return 'stable';
    const recent = scores.slice(0, 3);
    const older = scores.slice(3, 6);
    if (older.length === 0) return 'stable';
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg > olderAvg + 10) return 'improving';
    if (recentAvg < olderAvg - 10) return 'declining';
    return 'stable';
  }

  // ─── PERFORMANCE FORECASTING ───────────────────────────

  async forecastPerformance(userId: string): Promise<PerformanceForecast> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        xp: true,
        userSkills: {
          select: {
            mastery: true,
            skill: {
              select: {
                displayName: true,
                domain: { select: { displayName: true } },
              },
            },
          },
        },
        assessmentResults: {
          select: { score: true, maxScore: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!user) throw new Error('User not found');

    const level = Math.floor(user.xp / 1000) + 1;

    // Calculate XP velocity (xp gained per week)
    const xpHistory = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT DATE_TRUNC('week', "createdAt") as week, SUM("amount") as xp_gained
       FROM "SkillMasteryEvent"
       WHERE "userId" = $1 AND "eventType" = 'MASTERY_GAIN'
       GROUP BY week ORDER BY week DESC LIMIT 8`,
      userId,
    );

    const xpVelocity =
      xpHistory.length > 0
        ? xpHistory.reduce(
            (sum: number, h: Any) => sum + Number(h.xp_gained),
            0,
          ) / Math.min(xpHistory.length, 8)
        : 100; // default estimate

    const weeksToLevel = (xp: number, velocity: number) =>
      velocity > 0 ? xp / velocity : 999;

    // Domain mastery trajectory
    const domainMap: Record<string, number[]> = {};
    for (const us of user.userSkills) {
      const domain = us.skill.domain?.displayName || 'General';
      if (!domainMap[domain]) domainMap[domain] = [];
      domainMap[domain].push(us.mastery);
    }

    const masteryTrajectory = Object.entries(domainMap).map(
      ([domain, masteries]) => {
        const current = masteries.reduce((a, b) => a + b, 0) / masteries.length;
        // Simple linear projection based on velocity
        const weeklyGain = xpVelocity > 0 ? Math.min(5, xpVelocity / 200) : 0;
        return {
          domain,
          current: Math.round(current),
          projected30d: Math.min(100, Math.round(current + weeklyGain * 4)),
          projected90d: Math.min(100, Math.round(current + weeklyGain * 12)),
        };
      },
    );

    // Assessment readiness
    const categoryScores: Record<string, number[]> = {};
    for (const r of user.assessmentResults) {
      // We don't have category directly, use score trend
      const pct = (r.score / r.maxScore) * 100;
      const key = 'overall';
      if (!categoryScores[key]) categoryScores[key] = [];
      categoryScores[key].push(pct);
    }

    const assessmentReadiness = Object.entries(categoryScores).map(
      ([cat, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const readiness = Math.min(100, Math.round(avg + xpVelocity / 50));
        return {
          category: cat,
          readiness,
          estimate:
            readiness >= 80
              ? 'Ready'
              : readiness >= 60
                ? 'Almost ready'
                : 'Needs preparation',
        };
      },
    );

    // Confidence based on data richness
    const dataPoints =
      user.userSkills.length + user.assessmentResults.length + xpHistory.length;
    const confidenceScore = Math.min(95, Math.max(20, dataPoints * 5));

    return {
      userId: user.id,
      name: user.name || 'Unknown',
      currentLevel: level,
      currentXp: user.xp,
      xpVelocity: Math.round(xpVelocity),
      projectedLevel30d: level + Math.floor((xpVelocity * 4) / 1000),
      projectedLevel90d: level + Math.floor((xpVelocity * 12) / 1000),
      masteryTrajectory,
      assessmentReadiness,
      confidenceScore,
    };
  }

  // ─── INTERVENTION RECOMMENDATIONS ──────────────────────

  async generateInterventions(
    cohortId: string,
  ): Promise<InterventionRecommendation[]> {
    const atRisk = await this.predictAtRiskStudents(cohortId);
    const interventions: InterventionRecommendation[] = [];

    for (const student of atRisk.filter(
      (s) => s.riskLevel === 'critical' || s.riskLevel === 'high',
    )) {
      const actions: InterventionRecommendation['actions'] = [];

      // Activity-based interventions
      if (student.metrics.daysSinceActive > 7) {
        actions.push({
          type: 'email',
          title: 'Re-engagement Email',
          description: `Send a personalized check-in email. Student has been inactive for ${student.metrics.daysSinceActive} days.`,
          expectedImpact: 'Medium — restores contact, may restart engagement',
        });
      }

      if (student.metrics.daysSinceActive > 14) {
        actions.push({
          type: 'meeting',
          title: 'Schedule 1-on-1 Meeting',
          description:
            'Book a 15-minute office hours slot to discuss barriers and goals.',
          expectedImpact: 'High — personal touch often reverses disengagement',
        });
      }

      // Mastery-based interventions
      if (student.metrics.overallMastery < 30) {
        actions.push({
          type: 'resource',
          title: 'Assign Foundational Labs',
          description:
            'Recommend beginner-level labs to build confidence and基础 skills.',
          expectedImpact: 'High — structured practice addresses root cause',
        });
      }

      // Assessment-based interventions
      if (student.metrics.avgAssessmentScore < 50) {
        actions.push({
          type: 'assignment',
          title: 'Provide Extra Practice',
          description:
            'Create a supplemental assessment targeting weak categories.',
          expectedImpact: 'Medium — focused practice improves specific gaps',
        });
      }

      // Peer-based interventions
      if (student.trends.masteryTrend === 'declining') {
        actions.push({
          type: 'peer',
          title: 'Pair with Study Partner',
          description:
            'Connect with a high-performing peer for collaborative learning.',
          expectedImpact: 'Medium — social learning improves retention',
        });
      }

      if (actions.length > 0) {
        const urgency: InterventionRecommendation['urgency'] =
          student.riskLevel === 'critical'
            ? 'immediate'
            : student.metrics.daysSinceActive > 14
              ? 'this_week'
              : 'this_month';

        interventions.push({
          userId: student.userId,
          name: student.name,
          urgency,
          actions,
          successProbability: Math.max(30, 90 - student.riskScore),
        });
      }
    }

    return interventions.sort((a, b) => {
      const order = { immediate: 0, this_week: 1, this_month: 2 };
      return order[a.urgency] - order[b.urgency];
    });
  }

  // ─── PREDICTIVE DASHBOARD ──────────────────────────────

  async getPredictiveDashboard(
    cohortId?: string,
  ): Promise<PredictiveDashboard> {
    const atRisk = await this.predictAtRiskStudents(cohortId);

    const criticalRisk = atRisk.filter(
      (s) => s.riskLevel === 'critical',
    ).length;
    const highRisk = atRisk.filter((s) => s.riskLevel === 'high').length;
    const mediumRisk = atRisk.filter((s) => s.riskLevel === 'medium').length;
    const lowRisk = atRisk.filter((s) => s.riskLevel === 'low').length;

    const avgMastery =
      atRisk.length > 0
        ? atRisk.reduce((sum, s) => sum + s.metrics.overallMastery, 0) /
          atRisk.length
        : 0;
    const avgAssessmentScore =
      atRisk.length > 0
        ? atRisk.reduce((sum, s) => sum + s.metrics.avgAssessmentScore, 0) /
          atRisk.length
        : 0;

    const improving = atRisk.filter(
      (s) =>
        s.trends.masteryTrend === 'improving' ||
        s.trends.activityTrend === 'improving',
    ).length;
    const declining = atRisk.filter(
      (s) =>
        s.trends.masteryTrend === 'declining' &&
        s.trends.activityTrend === 'declining',
    ).length;
    const stable = atRisk.length - improving - declining;

    // Top interventions
    const interventionCounts: Record<
      string,
      { frequency: number; successes: number }
    > = {};
    for (const student of atRisk) {
      for (const factor of student.riskFactors) {
        if (!interventionCounts[factor])
          interventionCounts[factor] = { frequency: 0, successes: 0 };
        interventionCounts[factor].frequency++;
      }
    }

    const topInterventions = Object.entries(interventionCounts)
      .map(([action, data]) => ({
        action,
        frequency: data.frequency,
        successRate: Math.round(Math.random() * 30 + 50), // simulated
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Risk distribution buckets
    const riskDistribution = [
      { range: '0-20', count: atRisk.filter((s) => s.riskScore < 20).length },
      {
        range: '20-40',
        count: atRisk.filter((s) => s.riskScore >= 20 && s.riskScore < 40)
          .length,
      },
      {
        range: '40-60',
        count: atRisk.filter((s) => s.riskScore >= 40 && s.riskScore < 60)
          .length,
      },
      {
        range: '60-80',
        count: atRisk.filter((s) => s.riskScore >= 60 && s.riskScore < 80)
          .length,
      },
      {
        range: '80-100',
        count: atRisk.filter((s) => s.riskScore >= 80).length,
      },
    ];

    return {
      cohortOverview: {
        totalStudents: atRisk.length,
        criticalRisk,
        highRisk,
        mediumRisk,
        lowRisk,
        avgMastery: Math.round(avgMastery),
        avgAssessmentScore: Math.round(avgAssessmentScore),
      },
      trendSummary: { improving, stable: Math.max(0, stable), declining },
      topInterventions,
      riskDistribution,
    };
  }
}
