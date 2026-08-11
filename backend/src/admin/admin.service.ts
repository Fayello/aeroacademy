
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LabsService } from '../labs/labs.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private labsService: LabsService
  ) {}

  async createTeam(ownerId: string, name: string, description?: string) {
    return this.prisma.team.create({
      data: { name, description, ownerId }
    });
  }

  async getMyTeams(ownerId: string) {
    return this.prisma.team.findMany({
      where: { ownerId },
      include: { 
        _count: { select: { members: true } }
      }
    });
  }

  async addMemberToTeam(teamId: string, userId: string) {
    return this.prisma.team.update({
      where: { id: teamId },
      data: { members: { connect: { id: userId } } }
    });
  }

  async getTeamProgress(teamId: string) {
    return this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            xp: true,
            rank: true,
            labSubmissions: {
              where: { isCorrect: true },
              include: { flag: true }
            }
          }
        }
      }
    });
  }

  /**
   * Classroom Mode: Bulk provision labs for a team
   */
  async bulkProvisionLab(teamId: string, labId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, members: { select: { id: true } } }
    });

    if (!team) throw new Error('Team not found');

    const results: any[] = [];
    for (const member of team.members) {
      try {
        const instance = await this.labsService.startLab(member.id, labId);
        results.push({ userId: member.id, status: 'SUCCESS', instanceId: instance.id });
      } catch (err) {
        results.push({ userId: member.id, status: 'FAILED', error: err.message });
      }
    }
    return results;
  }

  /**
   * Classroom Mode: Bulk terminate labs for a team
   */
  async bulkTerminateLab(teamId: string, labId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, members: { select: { id: true } } }
    });

    if (!team) throw new Error('Team not found');

    for (const member of team.members) {
      await this.labsService.stopLab(member.id, labId).catch(() => {});
    }
    return { success: true, count: team.members.length };
  }
}
