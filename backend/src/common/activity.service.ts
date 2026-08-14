import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, type: string, metadata?: unknown) {
    return this.prisma.activityEvent.create({
      data: { userId, type, metadata: metadata as Prisma.InputJsonValue },
    });
  }

  async getUserActivity(userId: string, limit = 20) {
    return this.prisma.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentActivity(limit = 50) {
    return this.prisma.activityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getLabActivity(labId: string) {
    return this.prisma.activityEvent.findMany({
      where: {
        type: { in: ['LAB_STARTED', 'LAB_STOPPED', 'FLAG_SOLVED'] },
        metadata: { path: ['labId'], equals: labId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getActiveLabUsers() {
    const instances = await this.prisma.labInstance.findMany({
      where: { status: 'RUNNING' },
      include: {
        user: { select: { id: true, name: true, email: true, xp: true } },
        lab: { select: { id: true, title: true, difficulty: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return instances;
  }

  async getUserStats(userId: string) {
    const [totalSessions, activeSessions, flagsSolved] = await Promise.all([
      this.prisma.activityEvent.count({
        where: { userId, type: 'LAB_STARTED' },
      }),
      this.prisma.labInstance.count({ where: { userId, status: 'RUNNING' } }),
      this.prisma.activityEvent.count({
        where: { userId, type: 'FLAG_SOLVED' },
      }),
    ]);
    return { totalSessions, activeSessions, flagsSolved };
  }
}
