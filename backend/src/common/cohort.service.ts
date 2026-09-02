import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Any = any;

@Injectable()
export class CohortService {
  constructor(private readonly prisma: PrismaService) {}

  async getCohorts(curriculumId?: string): Promise<Any> {
    return this.prisma.cohort.findMany({
      where: {
        isActive: true,
        ...(curriculumId ? { curriculumId } : {}),
      },
      include: {
        curriculum: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as Any;
  }

  async getCohort(id: string): Promise<Any> {
    const cohort = (await this.prisma.cohort.findUnique({
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                division: true,
                xp: true,
              },
            },
          },
        },
      },
    })) as Any;
    if (!cohort) throw new NotFoundException('Cohort not found');
    return cohort;
  }

  async createCohort(data: {
    curriculumId: string;
    name: string;
    semester?: string;
    year: number;
    maxStudents?: number;
  }): Promise<Any> {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id: data.curriculumId },
    });
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
    }) as Any;
  }

  async addMember(
    cohortId: string,
    userId: string,
    role: string = 'STUDENT',
  ): Promise<Any> {
    const cohort = (await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: { _count: { select: { members: true } } },
    })) as Any;
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
    }) as Any;
  }

  async removeMember(cohortId: string, userId: string) {
    return this.prisma.cohortMember.deleteMany({
      where: { cohortId, userId },
    });
  }

  async getCohortDashboard(cohortId: string): Promise<Any> {
    const cohort = (await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        curriculum: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                division: true,
                xp: true,
              },
            },
          },
        },
      },
    })) as Any;
    if (!cohort) throw new NotFoundException('Cohort not found');

    const memberIds = cohort.members.map((m: Any) => m.user.id);

    // Fetch outcome evidence per member
    const evidences = (await this.prisma.outcomeEvidence.findMany({
      where: { userId: { in: memberIds } },
      include: { outcome: { include: { domain: true } } },
    })) as Any[];

    // Fetch lab instances per member
    const labInstances = (await this.prisma.labInstance.findMany({
      where: { userId: { in: memberIds } },
      select: { userId: true, labId: true },
    })) as Any[];

    // Aggregate domain stats
    const domainMap = new Map<
      string,
      { name: string; totalScore: number; count: number; labs: Set<string> }
    >();

    for (const ev of evidences) {
      const domainId = ev.outcome.domainId;
      const domainName = ev.outcome.domain.name;
      if (!domainMap.has(domainId)) {
        domainMap.set(domainId, {
          name: domainName,
          totalScore: 0,
          count: 0,
          labs: new Set(),
        });
      }
      const entry = domainMap.get(domainId)!;
      entry.totalScore += ev.score;
      entry.count++;
    }

    // Count labs per user
    const labsByUser = new Map<string, Set<string>>();
    for (const li of labInstances) {
      if (!labsByUser.has(li.userId)) labsByUser.set(li.userId, new Set());
      labsByUser.get(li.userId)!.add(li.labId);
    }

    // Find weakest and strongest domains
    const domainStats = Array.from(domainMap.entries()).map(([id, d]) => ({
      domainId: id,
      name: d.name,
      avgMastery:
        d.count > 0 ? Math.round((d.totalScore / d.count) * 10) / 10 : 0,
      labsCompleted: d.labs.size,
    }));
    domainStats.sort((a: Any, b: Any) => b.avgMastery - a.avgMastery);

    // Compute per-member stats
    const memberStats = cohort.members.map((m: Any) => {
      const userEvidences = evidences.filter(
        (e: Any) => e.userId === m.user.id,
      );
      const avgMastery =
        userEvidences.length > 0
          ? Math.round(
              (userEvidences.reduce((s: number, e: Any) => s + e.score, 0) /
                userEvidences.length) *
                10,
            ) / 10
          : 0;
      const labsDone = labsByUser.get(m.user.id)?.size ?? 0;
      return {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        division: m.user.division,
        xp: m.user.xp,
        role: m.role,
        labsCompleted: labsDone,
        avgMastery,
      };
    });

    // At-risk students (below 50% mastery average)
    const atRisk = memberStats.filter((m: Any) => m.avgMastery < 50);

    const totalLabsCompleted = memberStats.reduce(
      (sum: number, m: Any) => sum + m.labsCompleted,
      0,
    );

    return {
      cohort: {
        id: cohort.id,
        name: cohort.name,
        year: cohort.year,
        semester: cohort.semester,
      },
      curriculum: { id: cohort.curriculum.id, name: cohort.curriculum.name },
      stats: {
        totalStudents: cohort.members.length,
        totalLabsCompleted,
        strongestDomain: domainStats[0] ?? null,
        weakestDomain: domainStats[domainStats.length - 1] ?? null,
        atRiskCount: atRisk.length,
        atRiskStudents: atRisk.map((m: Any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
        })),
      },
      domains: domainStats,
      members: memberStats,
    };
  }

  async getStudentProgress(cohortId: string, userId: string): Promise<Any> {
    const member = (await this.prisma.cohortMember.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      include: {
        cohort: {
          include: {
            curriculum: {
              include: {
                modules: {
                  include: {
                    outcomes: {
                      include: { outcome: { include: { domain: true } } },
                    },
                    labs: { include: { lab: true } },
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            division: true,
            xp: true,
          },
        },
      },
    })) as Any;
    if (!member) throw new NotFoundException('Student not in this cohort');

    // Get student's evidence
    const evidences = (await this.prisma.outcomeEvidence.findMany({
      where: { userId },
      include: { outcome: { include: { domain: true } } },
    })) as Any[];

    // Get student's lab instances
    const labInstances = (await this.prisma.labInstance.findMany({
      where: { userId },
      select: { labId: true },
    })) as Any[];
    const completedLabIds = new Set(labInstances.map((li: Any) => li.labId));

    // Get student's assessments
    const assessments = (await this.prisma.studentAssessment.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { assessment: { include: { domain: true } } },
      orderBy: { completedAt: 'desc' },
    })) as Any[];

    // Map outcomes to student progress
    const moduleProgress = member.cohort.curriculum.modules.map((mod: Any) => {
      const outcomeProgress = mod.outcomes.map((mo: Any) => {
        const evidence = evidences.find(
          (e: Any) => e.learningOutcomeId === mo.learningOutcomeId,
        );
        return {
          outcomeId: mo.learningOutcomeId,
          code: mo.outcome.code,
          title: mo.outcome.title,
          domain: mo.outcome.domain.name,
          mastery: evidence ? Math.round(evidence.score * 10) / 10 : 0,
          weight: mo.weight,
        };
      });

      const labsCompleted = mod.labs.filter((ml: Any) =>
        completedLabIds.has(ml.labId),
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

    const assessmentData = assessments.map((a: Any) => ({
      assessmentId: a.assessmentId,
      title: a.assessment.title,
      domain: a.assessment.domain?.name,
      score: a.score,
      breakdown: a.breakdown,
      completedAt: a.completedAt,
    }));

    const allOutcomeMastery = moduleProgress.flatMap((m: Any) =>
      m.outcomeProgress.map((o: Any) => o.mastery),
    );

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
      assessments: assessmentData,
      overallStats: {
        totalLabsCompleted: completedLabIds.size,
        avgMastery:
          allOutcomeMastery.length > 0
            ? Math.round(
                (allOutcomeMastery.reduce((s: number, m: number) => s + m, 0) /
                  allOutcomeMastery.length) *
                  10,
              ) / 10
            : 0,
        assessmentsCompleted: assessmentData.length,
        avgAssessmentScore:
          assessmentData.length > 0
            ? Math.round(
                assessmentData.reduce(
                  (s: number, a: Any) => s + (a.score ?? 0),
                  0,
                ) / assessmentData.length,
              )
            : 0,
      },
    };
  }
}
