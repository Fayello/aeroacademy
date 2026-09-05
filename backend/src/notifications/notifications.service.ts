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
  level?: number;
  streak?: number;
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
          this.create({
            userId: p.userId,
            title: 'Achievement Unlocked',
            message: `You unlocked "${p.title ?? 'a new achievement'}" and earned +${p.xpReward ?? 0} XP`,
            type: 'ACHIEVEMENT',
            link: '/dashboard/profile',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'FLAG_CAPTURED':
          this.create({
            userId: p.userId,
            title: 'Flag Captured',
            message: `You solved "${p.flagTitle ?? 'a flag'}" and earned +${p.points ?? 0} XP`,
            type: 'SUCCESS',
            link: '/dashboard/labs',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'BOOKING_CONFIRMED':
          this.create({
            userId: p.userId,
            title: 'Booking Confirmed',
            message: p.message ?? 'Your training session has been confirmed.',
            type: 'BOOKING',
            link: '/dashboard/training/bookings',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'BOOKING_CANCELLED':
          this.create({
            userId: p.userId,
            title: 'Booking Cancelled',
            message: p.message ?? 'A training booking has been cancelled.',
            type: 'WARNING',
            link: p.link ?? '/dashboard/training/bookings',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'TRAINER_BOOKING_RECEIVED':
          this.create({
            userId: p.userId,
            title: 'New Booking',
            message: p.message ?? 'A student has booked a training session.',
            type: 'BOOKING',
            link: p.link ?? '/dashboard/training/bookings',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'MASTERCLASS_REGISTERED':
          this.create({
            userId: p.userId,
            title: 'Master Class Registered',
            message:
              p.message ??
              `You registered for "${p.title ?? 'a master class'}".`,
            type: 'MASTERCLASS',
            link: p.link ?? '/dashboard/master-classes',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'MASTERCLASS_UNREGISTERED':
          this.create({
            userId: p.userId,
            title: 'Master Class Unregistered',
            message:
              p.message ??
              `You unregistered from "${p.title ?? 'a master class'}".`,
            type: 'INFO',
            link: p.link ?? '/dashboard/master-classes',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'MISSION_COMPLETED':
          this.create({
            userId: p.userId,
            title: 'Mission Completed',
            message: `You completed "${p.title ?? 'a mission'}" and earned +${p.xpReward ?? 0} XP. Claim your reward!`,
            type: 'SUCCESS',
            link: '/dashboard',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'LEVEL_UP':
          this.create({
            userId: p.userId,
            title: 'Level Up!',
            message: `You reached Level ${p.level ?? '?'}! Keep building practical skills.`,
            type: 'ACHIEVEMENT',
            link: '/dashboard/ranking',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'STREAK_MILESTONE':
          this.create({
            userId: p.userId,
            title: 'Streak Milestone',
            message: `You're on a ${p.streak ?? 0}-day streak! Consistency is key.`,
            type: 'ACHIEVEMENT',
            link: '/dashboard',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'COURSE_COMPLETED':
          this.create({
            userId: p.userId,
            title: 'Course Completed',
            message: `You completed "${p.title ?? 'a course'}"! Strong work.`,
            type: 'SUCCESS',
            link: '/dashboard/courses',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
          break;
        case 'LAB_COMPLETED':
          this.create({
            userId: p.userId,
            title: 'Lab Completed',
            message: `You completed "${p.title ?? 'a lab'}" and captured all flags!`,
            type: 'SUCCESS',
            link: '/dashboard/labs',
          }).catch((err) =>
            logger.error(`Failed to create notification: ${err.message}`),
          );
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
    opts: {
      limit?: number;
      offset?: number;
      cursor?: string;
      unreadOnly?: boolean;
    },
  ) {
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
    const offset = Math.max(opts.offset ?? 0, 0);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(opts.unreadOnly ? { read: false } : {}),
      ...(opts.cursor ? { createdAt: { lt: new Date(opts.cursor) } } : {}),
    };

    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        ...(opts.cursor ? {} : { skip: offset }),
      }),
      this.prisma.notification.count({
        where: { userId, ...(opts.unreadOnly ? { read: false } : {}) },
      }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    const nextCursor =
      items.length === limit
        ? items[items.length - 1].createdAt.toISOString()
        : null;
    return { items, total, unread, limit, offset, nextCursor };
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
