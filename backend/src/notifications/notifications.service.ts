import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../common/events.service';
import createLogger from '../common/logger';

const logger = createLogger('Notifications');

interface NotificationEventPayload {
  userId: string;
  title?: string;
  message?: string;
  xpReward?: number;
  points?: number;
  flagTitle?: string;
  trainerName?: string;
  link?: string;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  onModuleInit() {
    this.eventsService.events$.subscribe(({ type, payload }) => {
      const p = payload as NotificationEventPayload;
      if (!p?.userId) return;

      switch (type) {
        case 'ACHIEVEMENT_UNLOCKED':
          void this.create({
            userId: p.userId,
            title: 'Achievement Unlocked',
            message: `You unlocked "${p.title ?? 'a new achievement'}" and earned +${p.xpReward ?? 0} XP`,
            type: 'ACHIEVEMENT',
            link: '/dashboard/profile',
          });
          break;
        case 'FLAG_CAPTURED':
          void this.create({
            userId: p.userId,
            title: 'Flag Captured',
            message: `You solved "${p.flagTitle ?? 'a flag'}" and earned +${p.points ?? 0} XP`,
            type: 'SUCCESS',
            link: '/dashboard/labs',
          });
          break;
        case 'BOOKING_CONFIRMED':
          void this.create({
            userId: p.userId,
            title: 'Booking Confirmed',
            message: p.message ?? 'Your training session has been confirmed.',
            type: 'BOOKING',
            link: '/dashboard/training/bookings',
          });
          break;
        case 'BOOKING_CANCELLED':
          void this.create({
            userId: p.userId,
            title: 'Booking Cancelled',
            message: p.message ?? 'A training booking has been cancelled.',
            type: 'WARNING',
            link: '/dashboard/training/bookings',
          });
          break;
        case 'MASTERCLASS_REGISTERED':
          void this.create({
            userId: p.userId,
            title: 'Master Class Registered',
            message:
              p.message ??
              `You registered for "${p.title ?? 'a master class'}".`,
            type: 'MASTERCLASS',
            link: p.link ?? '/dashboard/master-classes',
          });
          break;
        case 'MASTERCLASS_UNREGISTERED':
          void this.create({
            userId: p.userId,
            title: 'Master Class Unregistered',
            message:
              p.message ??
              `You unregistered from "${p.title ?? 'a master class'}".`,
            type: 'INFO',
            link: p.link ?? '/dashboard/master-classes',
          });
          break;
      }
    });
  }

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? 'INFO',
        link: input.link ?? null,
      },
    });
    this.eventsService.emit('NOTIFICATION_CREATED', notification);
    return notification;
  }

  async findAll(
    userId: string,
    opts: { limit?: number; offset?: number; unreadOnly?: boolean },
  ) {
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
    const offset = Math.max(opts.offset ?? 0, 0);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(opts.unreadOnly ? { read: false } : {}),
    };

    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { items, total, unread, limit, offset };
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async delete(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });
    logger.info(`Notification ${id} deleted by user ${userId}`);
    return { success: true };
  }
}
