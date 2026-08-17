import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LabsService } from '../labs/labs.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private labsService: LabsService,
  ) {}

  async createTeam(ownerId: string, name: string, description?: string) {
    return this.prisma.team.create({
      data: { name, description, ownerId },
    });
  }

  async getMyTeams(ownerId: string) {
    return this.prisma.team.findMany({
      where: { ownerId },
      include: {
        _count: { select: { members: true } },
      },
    });
  }

  async addMemberToTeam(teamId: string, userId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== requesterId) throw new ForbiddenException('You do not own this team');
    return this.prisma.team.update({
      where: { id: teamId },
      data: { members: { connect: { id: userId } } },
    });
  }

  async getTeamProgress(teamId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== requesterId) throw new ForbiddenException('You do not own this team');
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
              include: { flag: true },
            },
          },
        },
      },
    });
  }

  /**
   * Classroom Mode: Bulk provision labs for a team
   */
  async bulkProvisionLab(teamId: string, labId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, members: { select: { id: true } } },
    });

    if (!team) throw new NotFoundException('Team not found');

    const results = await Promise.allSettled(
      team.members.map(async (member) => {
        const instance = await this.labsService.startLab(member.id, labId);
        return { userId: member.id, status: 'SUCCESS' as const, instanceId: instance.id };
      }),
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { userId: team.members[i].id, status: 'FAILED' as const, error: r.reason?.message || String(r.reason) },
    );
  }

  /**
   * Classroom Mode: Bulk terminate labs for a team
   */
  async bulkTerminateLab(teamId: string, labId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, members: { select: { id: true } } },
    });

    if (!team) throw new NotFoundException('Team not found');

    for (const member of team.members) {
      await this.labsService.stopLab(member.id, labId).catch(() => {});
    }
    return { success: true, count: team.members.length };
  }
}
