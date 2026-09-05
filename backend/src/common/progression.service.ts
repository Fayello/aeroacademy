import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';
import { MasteryService } from './mastery.service';
import { GuildsService } from '../guilds/guilds.service';
import { CertificationEngineService } from '../certifications/certification-engine.service';

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
  masteryBefore?: number;
  masteryAfter?: number;
}

export interface SkillProfileDomain {
  domain: string;
  domainDisplayName: string;
  skills: {
    name: string;
    displayName: string;
    xp: number;
    level: number;
    mastery: number;
    lastPracticedAt: Date | null;
    isDecaying: boolean;
  }[];
}

@Injectable()
export class ProgressionService {
  private readonly logger = new Logger(ProgressionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly masteryService: MasteryService,
    private readonly guildsService: GuildsService,
    private readonly certificationEngineService: CertificationEngineService,
  ) {}

  async awardXP(userId: string, params: AwardXPParams): Promise<AwardXPResult> {
    const { amount, source, sourceId, domain, skillName } = params;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const oldXp = user.xp;
    const oldLevel = Math.floor(oldXp / 1000) + 1;

    const newXp = oldXp + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: newXp },
    });

    this.guildsService.contributeXp(userId, amount).catch(() => {});

    if (newXp >= 5000) {
      this.certificationEngineService.autoAwardForUser(userId).catch(() => {});
    }

    let skillXp: number | undefined;
    let skillLevel: number | undefined;
    let masteryBefore: number | undefined;
    let masteryAfter: number | undefined;

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
              data: {
                userId,
                skillId: skill.id,
                xp: skillXp,
                level: skillLevel,
              },
            });
          }

          // Compute mastery
          const masteryResult =
            await this.masteryService.computeMasteryOnXpGain(
              userId,
              skill.id,
              amount,
              source,
              sourceId,
            );
          masteryBefore = masteryResult.masteryBefore;
          masteryAfter = masteryResult.masteryAfter;

          await this.prisma.progressionEvent.create({
            data: {
              userId,
              type: 'SKILL_XP_AWARDED',
              amount,
              source,
              sourceId: sourceId ?? null,
              metadata: { domain, skillName, skillId: skill.id, masteryAfter },
            },
          });
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

    await this.awardPassXp(userId, amount, source);

    return {
      xp: newXp,
      level: newLevel,
      leveledUp: newLevel > oldLevel,
      skillXp,
      skillLevel,
      masteryBefore,
      masteryAfter,
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
        mastery: us.mastery,
        lastPracticedAt: us.lastPracticedAt,
        isDecaying: us.isDecaying,
      });
    }

    return Array.from(domainMap.values());
  }

  async getOverallLevel(userId: string): Promise<number> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return Math.floor(user.xp / 1000) + 1;
  }

  async awardPassXp(
    userId: string,
    amount: number,
    source: string,
  ): Promise<void> {
    try {
      const activeSeason = await this.prisma.season.findFirst({
        where: { isActive: true },
      });
      if (!activeSeason) return;

      const battlePass = await this.prisma.battlePass.findFirst({
        where: { seasonId: activeSeason.id, isActive: true },
        include: { tiers: { orderBy: { tierNumber: 'asc' } } },
      });
      if (!battlePass) return;

      const totalXpNeeded = 0;
      let unlockedTierCount = 0;

      for (const tier of battlePass.tiers) {
        const existing = await this.prisma.battlePassProgress.findFirst({
          where: { userId, tierId: tier.id },
        });

        if (existing?.unlocked) {
          unlockedTierCount++;
          continue;
        }

        const xpForThisTier = existing ? existing.currentXp : 0;
        const remaining = tier.xpRequired - xpForThisTier;

        if (amount <= 0) break;

        if (amount >= remaining) {
          if (existing) {
            await this.prisma.battlePassProgress.update({
              where: { id: existing.id },
              data: {
                currentXp: tier.xpRequired,
                unlocked: true,
                unlockedAt: new Date(),
              },
            });
          } else {
            await this.prisma.battlePassProgress.create({
              data: {
                userId,
                tierId: tier.id,
                currentXp: tier.xpRequired,
                unlocked: true,
                unlockedAt: new Date(),
              },
            });
          }
          unlockedTierCount++;
          amount -= remaining;
        } else {
          if (existing) {
            await this.prisma.battlePassProgress.update({
              where: { id: existing.id },
              data: { currentXp: existing.currentXp + amount },
            });
          } else {
            await this.prisma.battlePassProgress.create({
              data: { userId, tierId: tier.id, currentXp: amount },
            });
          }
          amount = 0;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to award pass XP for user ${userId}: ${error}`);
    }
  }
}
