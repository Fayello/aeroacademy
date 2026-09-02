import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Certification {
  domain: string;
  domainDisplayName: string;
  labCount: number;
  totalLabs: number;
  completedAt: string;
}

@Injectable()
export class CertificationsService {
  constructor(private prisma: PrismaService) {}

  async getCertifications(userId: string): Promise<Certification[]> {
    const domains = await this.prisma.skillDomain.findMany({
      include: {
        skills: {
          include: {
            labSkills: {
              include: {
                lab: {
                  include: {
                    flags: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const certifications: Certification[] = [];

    for (const domain of domains) {
      const labMap = new Map<string, { id: string; flagCount: number }>();

      for (const skill of domain.skills) {
        for (const ls of skill.labSkills) {
          if (!labMap.has(ls.labId)) {
            labMap.set(ls.labId, {
              id: ls.labId,
              flagCount: ls.lab.flags.length,
            });
          }
        }
      }

      const labs = Array.from(labMap.values());
      const totalLabs = labs.length;

      if (totalLabs === 0) continue;

      let completedLabs = 0;
      let lastCompletedAt: Date | null = null;

      for (const lab of labs) {
        if (lab.flagCount === 0) {
          completedLabs++;
          continue;
        }

        const correctFlags = await this.prisma.labSubmission.count({
          where: {
            userId,
            isCorrect: true,
            flag: { labId: lab.id },
          },
        });

        if (correctFlags >= lab.flagCount) {
          completedLabs++;
          const lastSubmission = await this.prisma.labSubmission.findFirst({
            where: {
              userId,
              isCorrect: true,
              flag: { labId: lab.id },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (
            lastSubmission &&
            (!lastCompletedAt || lastSubmission.createdAt > lastCompletedAt)
          ) {
            lastCompletedAt = lastSubmission.createdAt;
          }
        }
      }

      if (completedLabs >= totalLabs) {
        certifications.push({
          domain: domain.name,
          domainDisplayName: domain.displayName,
          labCount: completedLabs,
          totalLabs,
          completedAt: (lastCompletedAt || new Date()).toISOString(),
        });
      }
    }

    return certifications;
  }
}
