import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithUser } from './audit.interceptor';
import createLogger from '../common/logger';

const logger = createLogger('Audit');

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'oldPassword',
  'newPassword',
  'currentPassword',
  'token',
  'access_token',
  'refresh_token',
  'refreshToken',
  'correctAnswer',
  'secret',
  'authorization',
  'cookie',
];

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 3 || value == null) return value;
  if (typeof value === 'string') return value.slice(0, 2000);
  if (Array.isArray(value))
    return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.includes(k)) {
        out[k] = '[REDACTED]';
        continue;
      }
      out[k] = sanitize(v, depth + 1);
    }
    return out;
  }
  return value;
}

export interface AuditLogParams {
  action: string;
  request: RequestWithUser;
  error?: unknown;
  duration?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: AuditLogParams) {
    const { action, request, error } = params;
    const errObj = error as
      | { status?: number; statusCode?: number; message?: string }
      | undefined;
    const requestBody = sanitize(request?.body);
    const requestParams = sanitize(request?.params);
    const requestQuery = sanitize(request?.query);

    const actorId = request?.user?.id || null;
    const actorEmail = request?.user?.email || null;

    const statusCode = error
      ? errObj?.status || errObj?.statusCode || 500
      : request?.res?.statusCode || (request?.method === 'POST' ? 201 : 200);

    const metadata: Record<string, any> = {
      ...(requestBody && Object.keys(requestBody).length > 0
        ? { body: requestBody }
        : {}),
      ...(requestParams && Object.keys(requestParams).length > 0
        ? { params: requestParams }
        : {}),
      ...(requestQuery && Object.keys(requestQuery).length > 0
        ? { query: requestQuery }
        : {}),
      ...(params.duration != null ? { durationMs: params.duration } : {}),
      ...(error ? { error: errObj?.message } : {}),
    };

    try {
      return await this.prisma.auditLog.create({
        data: {
          action,
          actorId,
          actorEmail,
          method: request?.method,
          path: request?.originalUrl || request?.url,
          statusCode,
          ip: request?.ip,
          userAgent:
            (request?.headers?.['user-agent'] as string)?.slice(0, 300) || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      });
    } catch (err) {
      // Never let audit logging break the request flow
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to write audit log: ${message}`);
      return null;
    }
  }

  async findAll(filters: {
    action?: string;
    actorId?: string;
    status?: 'success' | 'error';
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.action) where.action = filters.action;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.status) {
      where.statusCode =
        filters.status === 'success' ? { lt: 400 } : { gte: 400 };
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const limit = Math.min(Math.max(filters.limit || 50, 1), 200);
    const offset = Math.max(filters.offset || 0, 0);

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async getSummary() {
    const [byAction, byStatus, last24h] = await Promise.all([
      this.prisma.auditLog.groupBy({ by: ['action'], _count: { _all: true } }),
      this.prisma.auditLog.groupBy({
        by: ['statusCode'],
        _count: { _all: true },
      }),
      this.prisma.auditLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      byAction: byAction
        .map((a) => ({ action: a.action, count: a._count._all }))
        .sort((a, b) => b.count - a.count),
      byStatus: byStatus
        .map((s) => ({ statusCode: s.statusCode, count: s._count._all }))
        .sort((a, b) => b.count - a.count),
      last24h,
    };
  }
}
