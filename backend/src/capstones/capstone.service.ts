import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLevel } from '../common/level.util';

const logger = new Logger('CapstoneService');

@Injectable()
export class CapstoneService {
  constructor(private readonly prisma: PrismaService) {}

  async getCapstoneDetail(labId: string, userId?: string) {
    const capstone = await this.prisma.lab.findUnique({
      where: { id: labId },
      include: {
        flags: {
          include: {
            submissions: userId
              ? { where: { isCorrect: true, userId } }
              : { where: { isCorrect: true } },
          },
        },
        capstonePhases: {
          orderBy: { phaseNumber: 'asc' },
        },
        capstonePrereqs: {
          include: { skillDomain: true },
        },
        labSkills: {
          include: {
            skill: {
              include: { domain: true },
            },
          },
        },
      },
    });

    if (!capstone || capstone.type !== 'CAPSTONE') {
      throw new NotFoundException('Capstone not found');
    }

    let prerequisitesMet = true;
    let prerequisiteDetails: any[] = [];

    if (capstone.capstonePrereqs.length > 0 && userId) {
      prerequisiteDetails = await Promise.all(
        capstone.capstonePrereqs.map(async (prereq) => {
          const skillDomainId = prereq.skillDomainId;
          const requiredPct = prereq.requiredPercentage;

          const userSkills = await this.prisma.userSkill.findMany({
            where: {
              userId,
              skill: { domainId: skillDomainId },
            },
          });

          const totalXp = userSkills.reduce((sum, s) => sum + s.xp, 0);
          const domainMaxXp = 10000;
          const currentPct = Math.min(100, Math.round((totalXp / domainMaxXp) * 100));
          const met = currentPct >= requiredPct;

          if (!met) prerequisitesMet = false;

          return {
            domain: prereq.skillDomain.name,
            requiredPercentage: requiredPct,
            currentPercentage: currentPct,
            met,
          };
        }),
      );
    }

    return {
      ...capstone,
      prerequisitesMet,
      prerequisiteDetails,
    };
  }

  async getUserCapstoneProgress(userId: string) {
    const instances = await this.prisma.labInstance.findMany({
      where: {
        userId,
        lab: { type: 'CAPSTONE' },
      },
      include: {
        lab: {
          select: { id: true, title: true, difficulty: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const progress = await Promise.all(
      instances.map(async (instance) => {
        const labId = instance.labId;
        const totalFlags = await this.prisma.labFlag.count({ where: { labId } });
        const solvedFlags = await this.prisma.labSubmission.count({
          where: {
            userId,
            flag: { labId },
            isCorrect: true,
          },
        });

        return {
          instanceId: instance.id,
          labId,
          labTitle: instance.lab.title,
          difficulty: instance.lab.difficulty,
          status: instance.status,
          totalFlags,
          solvedFlags,
          progressPct: totalFlags > 0 ? Math.round((solvedFlags / totalFlags) * 100) : 0,
          expiresAt: instance.expiresAt,
        };
      }),
    );

    return progress;
  }
}
