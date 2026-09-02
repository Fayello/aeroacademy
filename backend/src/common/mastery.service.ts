import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DECAY_THRESHOLD_DAYS = 7;
const MAX_SKILL_XP_FOR_MASTERY = 5000;

export interface TechnologyGenome {
  domains: DomainGenome[];
  overallMastery: number;
  fadingSkills: SkillMasteryInfo[];
  strengths: SkillMasteryInfo[];
  weaknesses: SkillMasteryInfo[];
  totalSkills: number;
  activeSkills: number;
  decayingSkills: number;
}

export interface DomainGenome {
  domain: string;
  displayName: string;
  skills: SkillMasteryInfo[];
  averageMastery: number;
}

export interface SkillMasteryInfo {
  skillId: string;
  name: string;
  displayName: string;
  mastery: number;
  level: number;
  xp: number;
  lastPracticedAt: Date | null;
  isDecaying: boolean;
  daysSincePractice: number | null;
}

@Injectable()
export class MasteryService {
  private readonly logger = new Logger(MasteryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async computeMasteryOnXpGain(
    userId: string,
    skillId: string,
    xpGained: number,
    source: string,
    sourceId?: string,
  ): Promise<{ masteryBefore: number; masteryAfter: number }> {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    if (!userSkill) {
      return { masteryBefore: 0, masteryAfter: 0 };
    }

    const masteryBefore = userSkill.mastery;
    const masteryAfter = this.calculateMasteryFromXp(
      userSkill.xp + xpGained,
      source,
    );

    const now = new Date();
    const masteryDelta = masteryAfter - masteryBefore;

    await this.prisma.userSkill.update({
      where: { id: userSkill.id },
      data: {
        mastery: masteryAfter,
        lastPracticedAt: now,
        isDecaying: false,
      },
    });

    await this.prisma.skillMasteryEvent.create({
      data: {
        userId,
        skillId,
        eventType: userSkill.isDecaying ? 'MASTERY_RECOVERY' : 'MASTERY_GAIN',
        amount: masteryDelta,
        masteryBefore,
        masteryAfter,
        source,
        sourceId: sourceId ?? null,
      },
    });

    return { masteryBefore, masteryAfter };
  }

  async applyMasteryDecay(): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - DECAY_THRESHOLD_DAYS);

    const inactiveSkills = await this.prisma.userSkill.findMany({
      where: {
        lastPracticedAt: { lt: threshold },
        mastery: { gt: 0 },
      },
      include: {
        skill: { select: { name: true, displayName: true } },
        user: { select: { id: true, name: true } },
      },
    });

    let decayedCount = 0;

    for (const userSkill of inactiveSkills) {
      const now = new Date();
      const daysInactive = Math.floor(
        (now.getTime() - userSkill.lastPracticedAt!.getTime()) / 86400000,
      );

      const daysOverThreshold = Math.max(
        0,
        daysInactive - DECAY_THRESHOLD_DAYS,
      );
      const decayAmount = Math.min(
        userSkill.mastery,
        userSkill.decayRate * daysOverThreshold,
      );

      if (decayAmount <= 0) continue;

      const newMastery = Math.max(0, userSkill.mastery - decayAmount);

      await this.prisma.userSkill.update({
        where: { id: userSkill.id },
        data: {
          mastery: newMastery,
          isDecaying: true,
        },
      });

      await this.prisma.skillMasteryEvent.create({
        data: {
          userId: userSkill.userId,
          skillId: userSkill.skillId,
          eventType: 'MASTERY_DECAY',
          amount: -decayAmount,
          masteryBefore: userSkill.mastery,
          masteryAfter: newMastery,
          source: 'DECAY_CRON',
        },
      });

      decayedCount++;

      if (newMastery < 50 && userSkill.mastery >= 50) {
        this.logger.warn(
          `Mastery dropped below 50% for user ${userSkill.userId} on ${userSkill.skill.displayName}: ${userSkill.mastery.toFixed(1)}% → ${newMastery.toFixed(1)}%`,
        );
      }
    }

    this.logger.log(`Applied mastery decay to ${decayedCount} user skills`);
    return decayedCount;
  }

  async getTechnologyGenome(userId: string): Promise<TechnologyGenome> {
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: { include: { domain: true } },
      },
    });

    const now = new Date();
    const domainMap = new Map<string, DomainGenome>();
    const allSkills: SkillMasteryInfo[] = [];
    const fadingSkills: SkillMasteryInfo[] = [];
    const strengths: SkillMasteryInfo[] = [];
    const weaknesses: SkillMasteryInfo[] = [];
    let decayingCount = 0;

    for (const us of userSkills) {
      const domainName = us.skill.domain.name;

      if (!domainMap.has(domainName)) {
        domainMap.set(domainName, {
          domain: domainName,
          displayName: us.skill.domain.displayName,
          skills: [],
          averageMastery: 0,
        });
      }

      const daysSincePractice = us.lastPracticedAt
        ? Math.floor((now.getTime() - us.lastPracticedAt.getTime()) / 86400000)
        : null;

      const info: SkillMasteryInfo = {
        skillId: us.skillId,
        name: us.skill.name,
        displayName: us.skill.displayName,
        mastery: us.mastery,
        level: us.level,
        xp: us.xp,
        lastPracticedAt: us.lastPracticedAt,
        isDecaying: us.isDecaying,
        daysSincePractice,
      };

      domainMap.get(domainName)!.skills.push(info);
      allSkills.push(info);

      if (us.isDecaying) decayingCount++;

      if (
        us.isDecaying ||
        (daysSincePractice !== null &&
          daysSincePractice > DECAY_THRESHOLD_DAYS &&
          us.mastery > 0)
      ) {
        fadingSkills.push(info);
      }

      if (us.mastery >= 70) {
        strengths.push(info);
      } else if (us.mastery < 40 && us.mastery > 0) {
        weaknesses.push(info);
      }
    }

    for (const domain of domainMap.values()) {
      const total = domain.skills.reduce((sum, s) => sum + s.mastery, 0);
      domain.averageMastery =
        domain.skills.length > 0 ? total / domain.skills.length : 0;
    }

    const overallMastery =
      allSkills.length > 0
        ? allSkills.reduce((sum, s) => sum + s.mastery, 0) / allSkills.length
        : 0;

    fadingSkills.sort((a, b) => a.mastery - b.mastery);
    strengths.sort((a, b) => b.mastery - a.mastery);
    weaknesses.sort((a, b) => a.mastery - b.mastery);

    return {
      domains: Array.from(domainMap.values()),
      overallMastery,
      fadingSkills,
      strengths,
      weaknesses,
      totalSkills: allSkills.length,
      activeSkills: allSkills.filter((s) => !s.isDecaying).length,
      decayingSkills: decayingCount,
    };
  }

  private calculateMasteryFromXp(xp: number, source: string): number {
    const baseMastery = Math.min(100, (xp / MAX_SKILL_XP_FOR_MASTERY) * 100);

    let sourceMultiplier = 1.0;
    if (source === 'FLAG_SOLVED') sourceMultiplier = 1.0;
    else if (source === 'LAB_COMPLETED') sourceMultiplier = 1.1;
    else if (source === 'BOSS_MISSION') sourceMultiplier = 1.2;
    else if (source === 'QUIZ_PASSED') sourceMultiplier = 0.8;

    return Math.min(100, baseMastery * sourceMultiplier);
  }
}
