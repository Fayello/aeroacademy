import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CohortService {
  constructor(private readonly prisma: PrismaService) {}

  async getCohorts(curriculumId?: string) {
    return this.prisma.cohort.findMany({
      where: {
        isActive: true,
        ...(curriculumId ? { curriculumId } : {}),
      },
      include: {
        curriculum: true,
        members: {
          include: { user: { select: { id: true, name: true, email: true, division: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCohort(id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
      include: {
        curriculum: {
          include: {
            modules: {
              include: {
                outcomes: { include: { outcome: true } },
                labs: { include: { lab: true } },
              },
            },
          },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, division: true, xp: true } } },
        },
      },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    return cohort;
  }

  async createCohort(data: {
    curriculumId: string;
    name: string;
    semester?: string;
    year: number;
    maxStudents?: number;
  }) {
    const curriculum = await this.prisma.curriculum.findUnique({ where: { id: data.curriculumId } });
    if (!curriculum) throw new NotFoundException('Curriculum not found');

    return this.prisma.cohort.create({
      data: {
        curriculumId: data.curriculumId,
        name: data.name,
        semester: data.semester,
        year: data.year,
        maxStudents: data.maxStudents ?? 50,
      },
      include: { curriculum: true },
    });
  }

  async addMember(cohortId: string, userId: string, role: string = 'STUDENT') {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: { _count: { select: { members: true } } },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    if (cohort._count.members >= cohort.maxStudents) {
      throw new BadRequestException('Cohort is full');
    }

    const existing = await this.prisma.cohortMember.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
    });
    if (existing) throw new BadRequestException('User already in cohort');

    return this.prisma.cohortMember.create({
      data: { cohortId, userId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeMember(cohortId: string, userId: string) {
    return this.prisma.cohortMember.deleteMany({
      where: { cohortId, userId },
    });
  }

  async getCohortDashboard(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        curriculum: {
          include: {
            modules: {
              include: {
                outcomes: { include: { outcome: { include: { domain: true } } } },
                labs: { include: { lab: true } },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              include: {
                labCompletions: {
                  include: { lab: { include: { skills: { include: { skill: { include: { domain: true } } } } } } },
                },
                outcomeProgress: { include: { outcome: { include: { domain: true } } } },
              },
              select: { id: true, name: true, email: true, division: true, xp: true },
            },
          },
        },
      },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    // Aggregate domain stats
    const domainMap = new Map<string, { name: string; totalScore: number; count: number; labs: Set<string> }>();
    const moduleMap = new Map<string, { name: string; code: string; totalScore: number; count: number }>();

    for (const member of cohort.members) {
      for (const op of member.user.outcomeProgress) {
        const domainId = op.outcome.domainId;
        const domainName = op.outcome.domain.name;
        if (!domainMap.has(domainId)) {
          domainMap.set(domainId, { name: domainName, totalScore: 0, count: 0, labs: new Set() });
        }
        const entry = domainMap.get(domainId)!;
        entry.totalScore += op.mastery;
        entry.count++;
      }

      for (const lc of member.user.labCompletions) {
        for (const ls of lc.lab.skills) {
          const domainId = ls.skill.domainId;
          if (domainMap.has(domainId)) {
            domainMap.get(domainId)!.labs.add(lc.labId);
          }
        }
      }
    }

    // Find weakest and strongest domains
    const domainStats = Array.from(domainMap.entries()).map(([id, d]) => ({
      domainId: id,
      name: d.name,
      avgMastery: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
      labsCompleted: d.labs.size,
    }));
    domainStats.sort((a, b) => b.avgMastery - a.avgMastery);

    // At-risk students (below 50% mastery average)
    const atRisk = cohort.members.filter((m) => {
      const outcomes = m.user.outcomeProgress;
      if (outcomes.length === 0) return true;
      const avg = outcomes.reduce((sum, o) => sum + o.mastery, 0) / outcomes.length;
      return avg < 50;
    });

    // Total labs completed across cohort
    const totalLabsCompleted = cohort.members.reduce(
      (sum, m) => sum + m.user.labCompletions.length,
      0,
    );

    return {
      cohort: { id: cohort.id, name: cohort.name, year: cohort.year, semester: cohort.semester },
      curriculum: { id: cohort.curriculum.id, name: cohort.curriculum.name },
      stats: {
        totalStudents: cohort.members.length,
        totalLabsCompleted,
        strongestDomain: domainStats[0] ?? null,
        weakestDomain: domainStats[domainStats.length - 1] ?? null,
        atRiskCount: atRisk.length,
        atRiskStudents: atRisk.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
        })),
      },
      domains: domainStats,
      members: cohort.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        division: m.user.division,
        xp: m.user.xp,
        role: m.role,
        labsCompleted: m.user.labCompletions.length,
        avgMastery: m.user.outcomeProgress.length > 0
          ? Math.round(
              m.user.outcomeProgress.reduce((sum, o) => sum + o.mastery, 0) /
              m.user.outcomeProgress.length,
            )
          : 0,
      })),
    };
  }

  async getStudentProgress(cohortId: string, userId: string) {
    const member = await this.prisma.cohortMember.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      include: {
        cohort: {
          include: {
            curriculum: {
              include: {
                modules: {
                  include: {
                    outcomes: { include: { outcome: { include: { domain: true } } } },
                    labs: { include: { lab: true } },
                  },
                },
              },
            },
          },
        },
        user: {
          include: {
            labCompletions: true,
            outcomeProgress: { include: { outcome: { include: { domain: true } } } },
            studentAssessments: {
              include: { assessment: { include: { domain: true } } },
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    });
    if (!member) throw new NotFoundException('Student not in this cohort');

    // Map outcomes to student progress
    const moduleProgress = member.cohort.curriculum.modules.map((mod) => {
      const outcomeProgress = mod.outcomes.map((mo) => {
        const studentOutcome = member.user.outcomeProgress.find(
          (op) => op.learningOutcomeId === mo.learningOutcomeId,
        );
        return {
          outcomeId: mo.learningOutcomeId,
          code: mo.outcome.code,
          title: mo.outcome.title,
          domain: mo.outcome.domain.name,
          mastery: studentOutcome?.mastery ?? 0,
          weight: mo.weight,
        };
      });

      const labsCompleted = mod.labs.filter((ml) =>
        member.user.labCompletions.some((lc) => lc.labId === ml.labId),
      ).length;

      return {
        moduleId: mod.id,
        name: mod.name,
        code: mod.code,
        credits: mod.credits,
        outcomeProgress,
        labsCompleted,
        totalLabs: mod.labs.length,
      };
    });

    const assessments = member.user.studentAssessments.map((a) => ({
      assessmentId: a.assessmentId,
      title: a.assessment.title,
      domain: a.assessment.domain?.name,
      score: a.score,
      breakdown: a.breakdown,
      completedAt: a.completedAt,
    }));

    return {
      student: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        division: member.user.division,
        xp: member.user.xp,
      },
      cohort: { id: member.cohort.id, name: member.cohort.name },
      moduleProgress,
      assessments,
      overallStats: {
        totalLabsCompleted: member.user.labCompletions.length,
        avgMastery: member.user.outcomeProgress.length > 0
          ? Math.round(
              member.user.outcomeProgress.reduce((sum, o) => sum + o.mastery, 0) /
              member.user.outcomeProgress.length,
            )
          : 0,
        assessmentsCompleted: assessments.length,
        avgAssessmentScore: assessments.length > 0
          ? Math.round(
              assessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / assessments.length,
            )
          : 0,
      },
    };
  }
}
