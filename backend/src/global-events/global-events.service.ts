import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class GlobalEventsService {
  private readonly logger = new Logger(GlobalEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
  ) {}

  async getActiveEvents() {
    const now = new Date();
    return this.prisma.globalEvent.findMany({
      where: { isActive: true, startsAt: { lte: now }, expiresAt: { gte: now } },
      include: { _count: { select: { participants: true } } },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async getAllEvents() {
    return this.prisma.globalEvent.findMany({
      include: { _count: { select: { participants: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEvent(data: {
    seasonId?: string;
    title: string;
    description: string;
    type: string;
    targetXp?: number;
    targetCount?: number;
    xpReward?: number;
    metadata?: any;
    startsAt: string;
    expiresAt: string;
  }) {
    const event = await this.prisma.globalEvent.create({
      data: {
        ...data,
        xpReward: data.xpReward ?? 0,
        startsAt: new Date(data.startsAt),
        expiresAt: new Date(data.expiresAt),
      },
    });
    this.logger.log(`Global event created: ${event.title}`);
    return event;
  }

  async joinEvent(userId: string, eventId: string) {
    const event = await this.prisma.globalEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const now = new Date();
    if (now > event.expiresAt) throw new BadRequestException('Event has expired');
    if (now < event.startsAt) throw new BadRequestException('Event has not started yet');

    const existing = await this.prisma.globalEventParticipant.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) throw new BadRequestException('Already joined this event');

    return this.prisma.globalEventParticipant.create({
      data: { userId, eventId },
    });
  }

  async updateProgress(userId: string, eventId: string, progress: number) {
    const participant = await this.prisma.globalEventParticipant.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!participant) throw new NotFoundException('Not participating in this event');

    const event = await this.prisma.globalEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const completed = event.targetXp
      ? progress >= event.targetXp
      : event.targetCount
        ? progress >= event.targetCount
        : false;

    const updated = await this.prisma.globalEventParticipant.update({
      where: { id: participant.id },
      data: {
        progress,
        ...(completed && !participant.completed ? { completed: true, completedAt: new Date() } : {}),
      },
    });

    if (completed && !participant.completed && event.xpReward > 0) {
      await this.progressionService.awardXP(userId, {
        amount: event.xpReward,
        source: 'GLOBAL_EVENT',
        sourceId: eventId,
      });
      this.logger.log(`User ${userId} completed event "${event.title}" for ${event.xpReward} XP`);
    }

    return updated;
  }

  async claimReward(userId: string, eventId: string) {
    const participant = await this.prisma.globalEventParticipant.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!participant) throw new NotFoundException('Not participating');
    if (!participant.completed) throw new BadRequestException('Event not yet completed');
    if (participant.rewardClaimed) throw new BadRequestException('Reward already claimed');

    const event = await this.prisma.globalEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.xpReward > 0) {
      await this.progressionService.awardXP(userId, {
        amount: event.xpReward,
        source: 'GLOBAL_EVENT_REWARD',
        sourceId: eventId,
      });
    }

    return this.prisma.globalEventParticipant.update({
      where: { id: participant.id },
      data: { rewardClaimed: true },
    });
  }

  async getEventLeaderboard(eventId: string) {
    const participants = await this.prisma.globalEventParticipant.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: [{ progress: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    });

    return participants.map((p, i) => ({
      position: i + 1,
      userId: p.user.id,
      name: p.user.name ?? p.user.username,
      avatarUrl: p.user.avatarUrl,
      progress: p.progress,
      completed: p.completed,
    }));
  }

  async getCommunityProgress(eventId: string) {
    const event = await this.prisma.globalEvent.findUnique({
      where: { id: eventId },
      include: { _count: { select: { participants: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');

    const stats = await this.prisma.globalEventParticipant.aggregate({
      where: { eventId },
      _sum: { progress: true },
      _count: { id: true },
    });

    return {
      eventId: event.id,
      title: event.title,
      type: event.type,
      targetXp: event.targetXp,
      targetCount: event.targetCount,
      totalParticipants: stats._count.id,
      totalProgress: stats._sum.progress ?? 0,
      completedCount: await this.prisma.globalEventParticipant.count({
        where: { eventId, completed: true },
      }),
    };
  }
}
