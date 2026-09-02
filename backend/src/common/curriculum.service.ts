import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurricula(institution?: string) {
    return this.prisma.curriculum.findMany({
      where: {
        isActive: true,
        ...(institution
          ? { institution: { contains: institution, mode: 'insensitive' } }
          : {}),
      },
      include: {
        modules: {
          include: {
            outcomes: { include: { outcome: true } },
            labs: { include: { lab: true } },
          },
        },
        _count: { select: { cohorts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCurriculum(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            outcomes: { include: { outcome: { include: { domain: true } } } },
            labs: { include: { lab: true } },
          },
          orderBy: { code: 'asc' },
        },
        cohorts: {
          where: { isActive: true },
          include: { members: true },
        },
      },
    });
    if (!curriculum) throw new NotFoundException('Curriculum not found');
    return curriculum;
  }

  async createCurriculum(data: {
    name: string;
    description: string;
    institution: string;
    degree: string;
    year: number;
    modules?: Array<{
      name: string;
      code: string;
      credits: number;
      theoryHours?: number;
      practicalHours?: number;
      outcomeIds?: string[];
      labIds?: string[];
    }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const curriculum = await tx.curriculum.create({
        data: {
          name: data.name,
          description: data.description,
          institution: data.institution,
          degree: data.degree,
          year: data.year,
        },
      });

      if (data.modules?.length) {
        for (const mod of data.modules) {
          const module = await tx.curriculumModule.create({
            data: {
              curriculumId: curriculum.id,
              name: mod.name,
              code: mod.code,
              credits: mod.credits,
              theoryHours: mod.theoryHours ?? 0,
              practicalHours: mod.practicalHours ?? 0,
            },
          });

          if (mod.outcomeIds?.length) {
            for (const outcomeId of mod.outcomeIds) {
              await tx.moduleOutcome.create({
                data: {
                  moduleId: module.id,
                  learningOutcomeId: outcomeId,
                  weight: 1.0,
                },
              });
            }
          }

          if (mod.labIds?.length) {
            for (const labId of mod.labIds) {
              await tx.moduleLab.create({
                data: {
                  moduleId: module.id,
                  labId,
                },
              });
            }
          }
        }
      }

      return this.getCurriculum(curriculum.id);
    });
  }

  async updateCurriculum(
    id: string,
    data: {
      name?: string;
      description?: string;
      institution?: string;
      degree?: string;
      year?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.curriculum.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Curriculum not found');

    return this.prisma.curriculum.update({
      where: { id },
      data,
    });
  }

  async addModule(
    curriculumId: string,
    data: {
      name: string;
      code: string;
      credits: number;
      theoryHours?: number;
      practicalHours?: number;
    },
  ) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id: curriculumId },
    });
    if (!curriculum) throw new NotFoundException('Curriculum not found');

    return this.prisma.curriculumModule.create({
      data: {
        curriculumId,
        name: data.name,
        code: data.code,
        credits: data.credits,
        theoryHours: data.theoryHours ?? 0,
        practicalHours: data.practicalHours ?? 0,
      },
    });
  }

  async updateModule(
    moduleId: string,
    data: {
      name?: string;
      code?: string;
      credits?: number;
      theoryHours?: number;
      practicalHours?: number;
    },
  ) {
    const existing = await this.prisma.curriculumModule.findUnique({
      where: { id: moduleId },
    });
    if (!existing) throw new NotFoundException('Module not found');

    return this.prisma.curriculumModule.update({
      where: { id: moduleId },
      data,
    });
  }

  async deleteModule(moduleId: string) {
    const existing = await this.prisma.curriculumModule.findUnique({
      where: { id: moduleId },
    });
    if (!existing) throw new NotFoundException('Module not found');

    return this.prisma.curriculumModule.delete({ where: { id: moduleId } });
  }

  async mapOutcome(
    moduleId: string,
    learningOutcomeId: string,
    weight?: number,
  ) {
    const module = await this.prisma.curriculumModule.findUnique({
      where: { id: moduleId },
    });
    if (!module) throw new NotFoundException('Module not found');

    const outcome = await this.prisma.learningOutcome.findUnique({
      where: { id: learningOutcomeId },
    });
    if (!outcome) throw new NotFoundException('Learning outcome not found');

    return this.prisma.moduleOutcome.upsert({
      where: { moduleId_learningOutcomeId: { moduleId, learningOutcomeId } },
      update: { weight: weight ?? 1.0 },
      create: {
        moduleId,
        learningOutcomeId,
        weight: weight ?? 1.0,
      },
    });
  }

  async removeOutcomeMapping(moduleId: string, learningOutcomeId: string) {
    return this.prisma.moduleOutcome.deleteMany({
      where: { moduleId, learningOutcomeId },
    });
  }

  async mapLab(moduleId: string, labId: string) {
    const module = await this.prisma.curriculumModule.findUnique({
      where: { id: moduleId },
    });
    if (!module) throw new NotFoundException('Module not found');

    const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new NotFoundException('Lab not found');

    return this.prisma.moduleLab.upsert({
      where: { moduleId_labId: { moduleId, labId } },
      update: {},
      create: { moduleId, labId },
    });
  }

  async removeLabMapping(moduleId: string, labId: string) {
    return this.prisma.moduleLab.deleteMany({
      where: { moduleId, labId },
    });
  }

  async getCurriculumStats(curriculumId: string) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        modules: {
          include: {
            outcomes: true,
            labs: true,
          },
        },
        cohorts: {
          include: { members: true },
        },
      },
    });
    if (!curriculum) throw new NotFoundException('Curriculum not found');

    const totalCredits = curriculum.modules.reduce(
      (sum, m) => sum + m.credits,
      0,
    );
    const totalTheoryHours = curriculum.modules.reduce(
      (sum, m) => sum + m.theoryHours,
      0,
    );
    const totalPracticalHours = curriculum.modules.reduce(
      (sum, m) => sum + m.practicalHours,
      0,
    );
    const totalOutcomes = new Set(
      curriculum.modules.flatMap((m) =>
        m.outcomes.map((o) => o.learningOutcomeId),
      ),
    ).size;
    const totalLabs = new Set(
      curriculum.modules.flatMap((m) => m.labs.map((l) => l.labId)),
    ).size;
    const totalStudents = curriculum.cohorts.reduce(
      (sum, c) => sum + c.members.length,
      0,
    );

    return {
      curriculum,
      stats: {
        totalModules: curriculum.modules.length,
        totalCredits,
        totalTheoryHours,
        totalPracticalHours,
        totalOutcomes,
        totalLabs,
        totalCohorts: curriculum.cohorts.length,
        totalStudents,
      },
    };
  }
}
