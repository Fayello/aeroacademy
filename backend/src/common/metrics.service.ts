import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordMetricParams {
  userId?: string;
  displayMode?: string;
  type: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private prisma: PrismaService) {}

  async record(params: RecordMetricParams): Promise<void> {
    try {
      await this.prisma.metricEvent.create({
        data: {
          userId: params.userId,
          displayMode: params.displayMode,
          type: params.type,
          metadata: params.metadata as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record metric: ${err}`);
    }
  }

  async getModeComparison() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.prisma.metricEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      select: { displayMode: true, type: true },
    });

    const result: Record<string, Record<string, number>> = {};
    for (const event of events) {
      const mode = event.displayMode || 'UNKNOWN';
      if (!result[mode]) result[mode] = {};
      result[mode][event.type] = (result[mode][event.type] || 0) + 1;
    }

    return result;
  }

  async getModeRetention() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get all session starts
    const allSessions = await this.prisma.metricEvent.findMany({
      where: { type: 'SESSION_START' },
      select: { displayMode: true, userId: true },
    });

    const recent7 = await this.prisma.metricEvent.findMany({
      where: { type: 'SESSION_START', createdAt: { gte: sevenDaysAgo } },
      select: { displayMode: true, userId: true },
    });

    const recent30 = await this.prisma.metricEvent.findMany({
      where: { type: 'SESSION_START', createdAt: { gte: thirtyDaysAgo } },
      select: { displayMode: true, userId: true },
    });

    const retention: Record<string, { total: number; active7Day: number; active30Day: number; retention7Day: number; retention30Day: number }> = {};

    for (const mode of ['PROFESSIONAL', 'PROGRESSION', 'COMPETITIVE']) {
      const totalUsers = new Set(allSessions.filter(s => s.displayMode === mode).map(s => s.userId)).size;
      const active7Users = new Set(recent7.filter(s => s.displayMode === mode).map(s => s.userId)).size;
      const active30Users = new Set(recent30.filter(s => s.displayMode === mode).map(s => s.userId)).size;

      retention[mode] = {
        total: totalUsers,
        active7Day: active7Users,
        active30Day: active30Users,
        retention7Day: totalUsers > 0 ? Math.round((active7Users / totalUsers) * 100) : 0,
        retention30Day: totalUsers > 0 ? Math.round((active30Users / totalUsers) * 100) : 0,
      };
    }

    return retention;
  }

  async getModeFeatureAdoption() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.prisma.metricEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, type: 'FEATURE_USED' },
      select: { displayMode: true, metadata: true },
    });

    const result: Record<string, Record<string, number>> = {};
    for (const event of events) {
      const mode = event.displayMode || 'UNKNOWN';
      if (!result[mode]) result[mode] = {};
      const meta = event.metadata as Record<string, unknown> | null;
      const feature = (meta?.feature as string) || 'unknown';
      result[mode][feature] = (result[mode][feature] || 0) + 1;
    }

    return result;
  }
}
