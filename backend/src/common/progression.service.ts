import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';

export interface AwardXPParams {
  amount: number;
  source: string;
  sourceId?: string;
  domain?: string;
  skillName?: string;
}

export interface AwardXPResult {
  xp: number;
  level: number;
  leveledUp: boolean;
  skillXp?: number;
  skillLevel?: number;
}

export interface SkillProfileDomain {
  domain: string;
  domainDisplayName: string;
  skills: {
    name: string;
    displayName: string;
    xp: number;
    level: number;
  }[];
}

@Injectable()
export class ProgressionService {
  private readonly logger = new Logger(ProgressionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async awardXP(userId: string, params: AwardXPParams): Promise<AwardXPResult> {
    const { amount, source, sourceId, domain, skillName } = params;

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const oldXp = user.xp;
    const oldLevel = Math.floor(oldXp / 1000) + 1;

    const newXp = oldXp + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: newXp },
    });

    let skillXp: number | undefined;
    let skillLevel: number | undefined;

    if (domain && skillName) {
      try {
        const skill = await this.prisma.skill.findFirst({
          where: { name: skillName, domain: { name: domain } },
        });

        if (skill) {
          const existingUserSkill = await this.prisma.userSkill.findUnique({
            where: { userId_skillId: { userId, skillId: skill.id } },
          });

          if (existingUserSkill) {
            const newSkillXp = existingUserSkill.xp + amount;
            skillLevel = Math.floor(newSkillXp / 500) + 1;
            await this.prisma.userSkill.update({
              where: { id: existingUserSkill.id },
              data: { xp: newSkillXp, level: skillLevel },
            });
            skillXp = newSkillXp;
          } else {
            skillXp = amount;
            skillLevel = Math.floor(amount / 500) + 1;
            await this.prisma.userSkill.create({
              data: { userId, skillId: skill.id, xp: skillXp, level: skillLevel },
            });
          }
        }
      } catch (error) {
        this.logger.warn(
          `Failed to update skill XP for user ${userId} (${domain}/${skillName}): ${error}`,
        );
      }
    }

    const metadata: Prisma.InputJsonValue = {
      ...(domain && { domain }),
      ...(skillName && { skillName }),
    };

    await this.prisma.progressionEvent.create({
      data: {
        userId,
        type: 'XP_AWARDED',
        amount,
        source,
        sourceId: sourceId ?? null,
        metadata,
      },
    });

    if (newLevel > oldLevel) {
      await this.prisma.progressionEvent.create({
        data: {
          userId,
          type: 'LEVEL_UP',
          amount: newLevel - oldLevel,
          source,
          sourceId: sourceId ?? null,
          metadata: { oldLevel, newLevel },
        },
      });
    }

    this.eventsService.emit('XP_AWARDED', { userId, amount, source });
    if (newLevel > oldLevel) {
      this.eventsService.emit('LEVEL_UP', { userId, newLevel });
    }

    return {
      xp: newXp,
      level: newLevel,
      leveledUp: newLevel > oldLevel,
      skillXp,
      skillLevel,
    };
  }

  async getSkillProfile(userId: string): Promise<SkillProfileDomain[]> {
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: {
          include: { domain: true },
        },
      },
    });

    const domainMap = new Map<string, SkillProfileDomain>();

    for (const us of userSkills) {
      const domainName = us.skill.domain.name;

      if (!domainMap.has(domainName)) {
        domainMap.set(domainName, {
          domain: domainName,
          domainDisplayName: us.skill.domain.displayName,
          skills: [],
        });
      }

      domainMap.get(domainName)!.skills.push({
        name: us.skill.name,
        displayName: us.skill.displayName,
        xp: us.xp,
        level: us.level,
      });
    }

    return Array.from(domainMap.values());
  }

  async getOverallLevel(userId: string): Promise<number> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return Math.floor(user.xp / 1000) + 1;
  }
}
