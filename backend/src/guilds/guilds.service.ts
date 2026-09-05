import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuildsService {
  private readonly logger = new Logger(GuildsService.name);

  constructor(private prisma: PrismaService) {}

  async createGuild(masterId: string, data: { name: string; description?: string; focusDomain?: string; visibility?: string; motto?: string; primaryColor?: string; accentColor?: string }) {
    const existing = await this.prisma.guildMember.findFirst({ where: { userId: masterId } });
    if (existing) throw new BadRequestException('You are already in a guild');

    return this.prisma.guild.create({
      data: {
        name: data.name,
        description: data.description,
        focusDomain: data.focusDomain,
        visibility: data.visibility || 'PUBLIC',
        motto: data.motto,
        primaryColor: data.primaryColor || '#229C62',
        accentColor: data.accentColor || '#7AD62A',
        masterId,
        members: {
          create: { userId: masterId, role: 'MASTER' },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, xp: true } } } } },
    });
  }

  async browseGuilds(userId: string, search?: string) {
    const where: Record<string, unknown> = { visibility: 'PUBLIC' };
    if (search) where.name = { contains: search, mode: 'insensitive' };

    return this.prisma.guild.findMany({
      where,
      include: {
        _count: { select: { members: true } },
        master: { select: { id: true, name: true } },
      },
      orderBy: { xp: 'desc' },
      take: 50,
    });
  }

  async getMyGuild(userId: string) {
    const membership = await this.prisma.guildMember.findFirst({
      where: { userId },
      include: {
        guild: {
          include: {
            _count: { select: { members: true, chatMessages: true } },
            master: { select: { id: true, name: true, avatarUrl: true } },
            members: {
              include: { user: { select: { id: true, name: true, username: true, xp: true, division: true, avatarUrl: true, currentStreak: true } } },
              orderBy: { contributionXp: 'desc' },
            },
          },
        },
      },
    });
    return membership?.guild || null;
  }

  async getGuildDetail(guildId: string) {
    const guild = await this.prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        _count: { select: { members: true } },
        master: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, name: true, username: true, xp: true, division: true, avatarUrl: true, currentStreak: true } } },
          orderBy: { contributionXp: 'desc' },
        },
      },
    });
    if (!guild) throw new NotFoundException('Guild not found');
    return guild;
  }

  async updateGuild(userId: string, guildId: string, data: Record<string, unknown>) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    const isMaster = guild.masterId === userId;
    const member = isMaster ? null : await this.prisma.guildMember.findFirst({ where: { guildId, userId } });

    if (!isMaster && (!member || member.role !== 'OFFICER')) {
      throw new ForbiddenException('Only the guild master or officers can update settings');
    }

    const masterOnlyFields = ['name', 'visibility', 'primaryColor', 'accentColor'];
    const officerAllowed = ['description', 'motto', 'focusDomain'];
    const allAllowed = [...masterOnlyFields, ...officerAllowed];

    const updateData: Record<string, unknown> = {};
    for (const key of allAllowed) {
      if (data[key] !== undefined) {
        if (!isMaster && masterOnlyFields.includes(key)) continue;
        updateData[key] = data[key];
      }
    }

    return this.prisma.guild.update({ where: { id: guildId }, data: updateData });
  }

  async disbandGuild(userId: string, guildId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');
    if (guild.masterId !== userId) throw new ForbiddenException('Only the guild master can disband');
    await this.prisma.guild.delete({ where: { id: guildId } });
    return { success: true };
  }

  async joinGuild(userId: string, guildId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId }, include: { _count: { select: { members: true } } } });
    if (!guild) throw new NotFoundException('Guild not found');

    const existing = await this.prisma.guildMember.findFirst({ where: { userId } });
    if (existing) throw new BadRequestException('You are already in a guild');

    if (guild._count.members >= guild.maxMembers) throw new BadRequestException('Guild is full');

    if (guild.visibility === 'PRIVATE') throw new BadRequestException('This guild is private — you need an invite');

    return this.prisma.guildMember.create({
      data: { guildId, userId, role: 'MEMBER' },
      include: { user: { select: { id: true, name: true } }, guild: { select: { id: true, name: true } } },
    });
  }

  async joinByCode(userId: string, inviteCode: string) {
    const guild = await this.prisma.guild.findUnique({ where: { inviteCode }, include: { _count: { select: { members: true } } } });
    if (!guild) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.guildMember.findFirst({ where: { userId } });
    if (existing) throw new BadRequestException('You are already in a guild');
    if (guild._count.members >= guild.maxMembers) throw new BadRequestException('Guild is full');

    return this.prisma.guildMember.create({
      data: { guildId: guild.id, userId, role: 'MEMBER' },
      include: { user: { select: { id: true, name: true } }, guild: { select: { id: true, name: true } } },
    });
  }

  async applyToGuild(userId: string, guildId: string, message?: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    const existingMember = await this.prisma.guildMember.findFirst({ where: { userId } });
    if (existingMember) throw new BadRequestException('You are already in a guild');

    const existingApp = await this.prisma.guildApplication.findFirst({ where: { guildId, userId, status: 'PENDING' } });
    if (existingApp) throw new BadRequestException('Application already pending');

    return this.prisma.guildApplication.create({
      data: { guildId, userId, message },
      include: { user: { select: { id: true, name: true, xp: true } } },
    });
  }

  async reviewApplication(userId: string, guildId: string, appId: string, action: 'APPROVED' | 'REJECTED') {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    const member = await this.prisma.guildMember.findFirst({ where: { guildId, userId } });
    if (!member || (member.role !== 'MASTER' && member.role !== 'OFFICER')) {
      throw new ForbiddenException('Only master or officers can review applications');
    }

    const app = await this.prisma.guildApplication.findUnique({ where: { id: appId } });
    if (!app || app.guildId !== guildId) throw new NotFoundException('Application not found');

    await this.prisma.guildApplication.update({ where: { id: appId }, data: { status: action, reviewedBy: userId, reviewedAt: new Date() } });

    if (action === 'APPROVED') {
      const guildMemberCount = await this.prisma.guildMember.count({ where: { guildId } });
      if (guildMemberCount >= guild.maxMembers) throw new BadRequestException('Guild is full');
      await this.prisma.guildMember.create({ data: { guildId, userId: app.userId, role: 'MEMBER' } });
    }

    return { success: true, action };
  }

  async leaveGuild(userId: string) {
    const membership = await this.prisma.guildMember.findFirst({ where: { userId } });
    if (!membership) throw new BadRequestException('You are not in a guild');
    if (membership.role === 'MASTER') throw new BadRequestException('Guild master cannot leave — transfer ownership or disband');

    await this.prisma.guildMember.delete({ where: { id: membership.id } });
    return { success: true };
  }

  async kickMember(userId: string, guildId: string, targetId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    const requester = await this.prisma.guildMember.findFirst({ where: { guildId, userId } });
    if (!requester || (requester.role !== 'MASTER' && requester.role !== 'OFFICER')) {
      throw new ForbiddenException('Only master or officers can kick');
    }

    const target = await this.prisma.guildMember.findFirst({ where: { guildId, userId: targetId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'MASTER') throw new ForbiddenException('Cannot kick the guild master');
    if (requester.role === 'OFFICER' && target.role === 'OFFICER') throw new ForbiddenException('Officers cannot kick other officers');

    await this.prisma.guildMember.delete({ where: { id: target.id } });
    return { success: true };
  }

  async promoteMember(userId: string, guildId: string, targetId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');
    if (guild.masterId !== userId) throw new ForbiddenException('Only the guild master can promote');

    const target = await this.prisma.guildMember.findFirst({ where: { guildId, userId: targetId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role !== 'MEMBER') throw new BadRequestException('Can only promote members');

    const officerCount = await this.prisma.guildMember.count({ where: { guildId, role: 'OFFICER' } });
    if (officerCount >= 5) throw new BadRequestException('Maximum 5 officers');

    return this.prisma.guildMember.update({ where: { id: target.id }, data: { role: 'OFFICER' } });
  }

  async demoteMember(userId: string, guildId: string, targetId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');
    if (guild.masterId !== userId) throw new ForbiddenException('Only the guild master can demote');

    const target = await this.prisma.guildMember.findFirst({ where: { guildId, userId: targetId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role !== 'OFFICER') throw new BadRequestException('Can only demote officers');

    return this.prisma.guildMember.update({ where: { id: target.id }, data: { role: 'MEMBER' } });
  }

  async refreshInviteCode(userId: string, guildId: string) {
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');
    if (guild.masterId !== userId) throw new ForbiddenException('Only the guild master can refresh invite code');

    return this.prisma.guild.update({ where: { id: guildId }, data: { inviteCode: Math.random().toString(36).substring(2, 10) } });
  }

  async getApplications(userId: string, guildId: string) {
    const member = await this.prisma.guildMember.findFirst({ where: { guildId, userId } });
    if (!member || (member.role !== 'MASTER' && member.role !== 'OFFICER')) {
      throw new ForbiddenException('Only master or officers can view applications');
    }

    return this.prisma.guildApplication.findMany({
      where: { guildId, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, username: true, xp: true, division: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChatHistory(guildId: string, limit = 100) {
    return this.prisma.guildChatMessage.findMany({
      where: { guildId },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    }).then((msgs) => msgs.reverse());
  }

  async sendChatMessage(guildId: string, userId: string, content: string) {
    const member = await this.prisma.guildMember.findFirst({ where: { guildId, userId } });
    if (!member) throw new ForbiddenException('You are not a member of this guild');

    return this.prisma.guildChatMessage.create({
      data: { guildId, userId, content },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });
  }

  async pinMessage(userId: string, guildId: string, messageId: string) {
    const member = await this.prisma.guildMember.findFirst({ where: { guildId, userId } });
    if (!member || (member.role !== 'MASTER' && member.role !== 'OFFICER')) {
      throw new ForbiddenException('Only master or officers can pin messages');
    }

    const msg = await this.prisma.guildChatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.guildId !== guildId) throw new NotFoundException('Message not found');

    return this.prisma.guildChatMessage.update({ where: { id: messageId }, data: { pinned: !msg.pinned } });
  }

  async getGuildFeed(guildId: string) {
    const members = await this.prisma.guildMember.findMany({
      where: { guildId },
      select: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);

    return this.prisma.activityEvent.findMany({
      where: { userId: { in: memberIds } },
      select: { id: true, type: true, metadata: true, createdAt: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getGuildLeaderboard() {
    return this.prisma.guild.findMany({
      include: {
        _count: { select: { members: true } },
        master: { select: { id: true, name: true } },
      },
      orderBy: { xp: 'desc' },
      take: 50,
    });
  }

  async toggleSeekingGuild(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { seekingTeam: true } });
    await this.prisma.user.update({ where: { id: userId }, data: { seekingTeam: !user?.seekingTeam } });
    return { seekingGuild: !user?.seekingTeam };
  }

  async getGuildSeekers() {
    return this.prisma.user.findMany({
      where: { seekingTeam: true },
      select: {
        id: true, name: true, username: true, xp: true, division: true,
        rank: true, currentStreak: true, avatarUrl: true, city: true,
      },
      orderBy: { xp: 'desc' },
      take: 30,
    });
  }

  async contributeXp(userId: string, amount: number) {
    if (amount <= 0) return;

    const membership = await this.prisma.guildMember.findFirst({ where: { userId } });
    if (!membership) return;

    await this.prisma.guildMember.update({
      where: { id: membership.id },
      data: { contributionXp: { increment: amount } },
    });

    const guild = await this.prisma.guild.findUnique({ where: { id: membership.guildId } });
    if (!guild) return;

    const newTotalXp = Number(guild.xp) + amount;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;

    await this.prisma.guild.update({
      where: { id: membership.guildId },
      data: {
        xp: { increment: amount },
        level: newLevel,
      },
    });

    return { guildId: membership.guildId, guildXp: newTotalXp, guildLevel: newLevel };
  }
}
