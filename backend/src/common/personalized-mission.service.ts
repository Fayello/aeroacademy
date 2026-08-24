import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryService, TechnologyGenome } from './mastery.service';

export interface GenerateMissionsResult {
  missions: GeneratedMission[];
  generatedAt: Date;
}

export interface GeneratedMission {
  title: string;
  description: string;
  difficulty: number;
  estimatedMinutes: number;
  targetSkillId: string | null;
  targetSkillName: string | null;
  targetDomainId: string | null;
  targetDomainName: string | null;
  xpReward: number;
  masteryReward: number;
  missionType: string;
}

@Injectable()
export class PersonalizedMissionService {
  private readonly logger = new Logger(PersonalizedMissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryService: MasteryService,
  ) {}

  async generateMissions(userId: string): Promise<GeneratedMission[]> {
    const genome = await this.masteryService.getTechnologyGenome(userId);
    const missions: GeneratedMission[] = [];

    // 1. Maintenance missions for fading skills
    for (const skill of genome.fadingSkills) {
      if (skill.mastery < 70 && skill.mastery > 30) {
        const domain = genome.domains.find(d =>
          d.skills.some(s => s.skillId === skill.skillId)
        );
        missions.push({
          title: `${skill.displayName} Maintenance`,
          description: `Your ${skill.displayName} mastery has fallen to ${Math.round(skill.mastery)}%. Complete this quick exercise to refresh your skills.`,
          difficulty: 3,
          estimatedMinutes: 15,
          targetSkillId: skill.skillId,
          targetSkillName: skill.displayName,
          targetDomainId: domain?.domain || null,
          targetDomainName: domain?.displayName || null,
          xpReward: 200,
          masteryReward: 10,
          missionType: 'SKILL_MAINTENANCE',
        });
      }
    }

    // 2. Weakness improvement missions
    for (const weakness of genome.weaknesses) {
      if (weakness.mastery < 40) {
        const domain = genome.domains.find(d =>
          d.skills.some(s => s.skillId === weakness.skillId)
        );
        missions.push({
          title: `Strengthen ${weakness.displayName}`,
          description: `Build your ${weakness.displayName} fundamentals with this targeted exercise.`,
          difficulty: 4,
          estimatedMinutes: 25,
          targetSkillId: weakness.skillId,
          targetSkillName: weakness.displayName,
          targetDomainId: domain?.domain || null,
          targetDomainName: domain?.displayName || null,
          xpReward: 350,
          masteryReward: 15,
          missionType: 'WEAKNESS_IMPROVEMENT',
        });
      }
    }

    // 3. Cross-domain missions
    if (genome.strengths.length > 0 && genome.weaknesses.length > 0) {
      const strength = genome.strengths[0];
      const weakness = genome.weaknesses[0];
      const weaknessDomain = genome.domains.find(d =>
        d.skills.some(s => s.skillId === weakness.skillId)
      );

      missions.push({
        title: `Cross-Domain: ${strength.displayName} → ${weakness.displayName}`,
        description: `Apply your ${strength.displayName} expertise (mastery: ${Math.round(strength.mastery)}%) to solve a ${weakness.displayName} challenge.`,
        difficulty: 6,
        estimatedMinutes: 35,
        targetSkillId: weakness.skillId,
        targetSkillName: weakness.displayName,
        targetDomainId: weaknessDomain?.domain || null,
        targetDomainName: weaknessDomain?.displayName || null,
        xpReward: 500,
        masteryReward: 20,
        missionType: 'CROSS_DOMAIN',
      });
    }

    // Cap at 5 active missions
    return missions.slice(0, 5);
  }

  async saveGeneratedMissions(userId: string): Promise<void> {
    // Expire old AVAILABLE missions
    await this.prisma.personalizedMission.updateMany({
      where: {
        userId,
        status: 'AVAILABLE',
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      data: { status: 'EXPIRED' },
    });

    // Check if user already has active missions
    const activeCount = await this.prisma.personalizedMission.count({
      where: { userId, status: { in: ['AVAILABLE', 'ACTIVE'] } },
    });

    if (activeCount >= 5) return;

    const generated = await this.generateMissions(userId);
    const existingTitles = await this.prisma.personalizedMission.findMany({
      where: { userId, status: { in: ['AVAILABLE', 'ACTIVE', 'COMPLETED'] } },
      select: { title: true },
    });
    const existingSet = new Set(existingTitles.map(e => e.title));

    for (const mission of generated) {
      if (existingSet.has(mission.title)) continue;

      await this.prisma.personalizedMission.create({
        data: {
          userId,
          title: mission.title,
          description: mission.description,
          difficulty: mission.difficulty,
          estimatedMinutes: mission.estimatedMinutes,
          targetSkillId: mission.targetSkillId,
          targetDomainId: mission.targetDomainId,
          xpReward: mission.xpReward,
          masteryReward: mission.masteryReward,
          missionType: mission.missionType,
          status: 'AVAILABLE',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  async getAvailableMissions(userId: string) {
    await this.saveGeneratedMissions(userId);

    return this.prisma.personalizedMission.findMany({
      where: {
        userId,
        status: { in: ['AVAILABLE', 'ACTIVE'] },
        expiresAt: { gt: new Date() },
      },
      include: {
        skill: { select: { id: true, name: true, displayName: true } },
        domain: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: [
        { status: 'asc' },
        { difficulty: 'asc' },
      ],
    });
  }

  async acceptMission(userId: string, missionId: string) {
    const mission = await this.prisma.personalizedMission.findUnique({
      where: { id: missionId },
    });

    if (!mission) throw new NotFoundException('Mission not found');
    if (mission.userId !== userId) throw new BadRequestException('Not your mission');
    if (mission.status !== 'AVAILABLE') throw new BadRequestException('Mission is not available');
    if (mission.expiresAt && mission.expiresAt < new Date()) {
      throw new BadRequestException('Mission has expired');
    }

    return this.prisma.personalizedMission.update({
      where: { id: missionId },
      data: { status: 'ACTIVE' },
    });
  }

  async completeMission(userId: string, missionId: string) {
    const mission = await this.prisma.personalizedMission.findUnique({
      where: { id: missionId },
    });

    if (!mission) throw new NotFoundException('Mission not found');
    if (mission.userId !== userId) throw new BadRequestException('Not your mission');
    if (mission.status !== 'ACTIVE') throw new BadRequestException('Mission is not active');

    return this.prisma.personalizedMission.update({
      where: { id: missionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async getMissionHistory(userId: string) {
    return this.prisma.personalizedMission.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'EXPIRED'] },
      },
      include: {
        skill: { select: { id: true, name: true, displayName: true } },
        domain: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
