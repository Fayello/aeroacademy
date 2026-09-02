import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DashboardService } from './dashboard.service';
import { LeaderboardService } from './leaderboard.service';
import { AchievementService } from './achievement.service';
import { JwtService } from '@nestjs/jwt';
import { Interval } from '@nestjs/schedule';
import { EventsService } from '../common/events.service';
import { OnModuleInit } from '@nestjs/common';
import createLogger from '../common/logger';

const logger = createLogger('Dashboard');
const MAX_CONNECTIONS_PER_USER = 3;

function getCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(valueParts.join('='));
  }

  return null;
}

interface NotificationPayload {
  userId?: string;
  title?: string;
  messageOverride?: string;
  xpReward?: number;
  timestamp?: string;
  flagTitle?: string;
  points?: number;
}

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
  },
  namespace: 'dashboard',
})
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId
  private connectionCounts: Map<string, number> = new Map(); // userId -> count
  private achievementCheckCounter = 0;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly leaderboardService: LeaderboardService,
    private readonly achievementService: AchievementService,
    private readonly jwtService: JwtService,
    private readonly eventsService: EventsService,
  ) {}

  onModuleInit() {
    this.eventsService.events$.subscribe(({ type, payload }) => {
      if (type === 'ACHIEVEMENT_UNLOCKED') {
        const data = payload as NotificationPayload;
        for (const [socketId, userId] of this.connectedUsers.entries()) {
          if (userId === data.userId) {
            this.server.to(socketId).emit('achievement_unlocked', payload);
          }
        }

        this.server.emit('global_feed_update', {
          type: 'ACHIEVEMENT_UNLOCKED',
          message:
            data.messageOverride ||
            `Operative unlocked merit: ${data.title?.replace('_', ' ') ?? ''}`,
          points: data.xpReward,
          timestamp: data.timestamp,
        });
      }

      if (type === 'FLAG_CAPTURED') {
        const data = payload as NotificationPayload;
        this.server.emit('global_feed_update', {
          type: 'FLAG_CAPTURED',
          message:
            data.messageOverride ||
            `Operative synchronized flag: ${data.flagTitle ?? ''}`,
          points: data.points,
          timestamp: data.timestamp,
        });
      }
    });
  }

  async handleConnection(client: Socket) {
    const authToken = client.handshake.auth.token as string | undefined;
    const cookieToken =
      getCookieValue(client.handshake.headers.cookie, 'access_token') ||
      getCookieValue(client.handshake.headers.cookie, 'token');
    const token = authToken || cookieToken;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const userId = payload.sub;

      const count = this.connectionCounts.get(userId) || 0;
      if (count >= MAX_CONNECTIONS_PER_USER) {
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.id, userId);
      this.connectionCounts.set(userId, count + 1);

      const userMetrics = await this.dashboardService.getUserMetrics(userId);
      client.emit('user_metrics_update', userMetrics);

      logger.info(`User ${userId} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    if (userId) {
      const count = this.connectionCounts.get(userId) || 1;
      if (count <= 1) {
        this.connectionCounts.delete(userId);
      } else {
        this.connectionCounts.set(userId, count - 1);
      }
    }
    logger.info('Client disconnected');
  }

  @Interval(10000)
  async broadcastLabTelemetry() {
    if (this.connectedUsers.size === 0) return;
    try {
      const telemetry = await this.dashboardService.getLabTelemetry();
      this.server.emit('lab_telemetry', telemetry);
    } catch {
      // ignore docker errors
    }
  }

  @Interval(15000)
  async broadcastSystemIntelligence() {
    if (this.connectedUsers.size === 0) return;

    const leaderboard = await this.leaderboardService.getGlobalLeaderboard();
    this.server.emit('leaderboard_update', leaderboard);

    const uniqueUserIds = [...new Set(this.connectedUsers.values())];

    // Batch: check achievements once per user — every 6th cycle (~90s) to reduce DB load
    this.achievementCheckCounter++;
    if (this.achievementCheckCounter >= 6) {
      this.achievementCheckCounter = 0;
      await Promise.allSettled(
        uniqueUserIds.map((uid) =>
          this.achievementService.checkAndUnlockAchievements(uid),
        ),
      );
    }

    // Batch: fetch metrics for all connected users in parallel
    const metricsResults = await Promise.allSettled(
      uniqueUserIds.map(async (uid) => ({
        userId: uid,
        intelligence: await this.dashboardService.getSystemIntelligence(uid),
        userMetrics: await this.dashboardService.getUserMetrics(uid),
      })),
    );

    // Emit to each socket
    for (const [socketId, userId] of this.connectedUsers.entries()) {
      const result = metricsResults.find(
        (r) => r.status === 'fulfilled' && r.value.userId === userId,
      );
      if (result && result.status === 'fulfilled') {
        this.server
          .to(socketId)
          .emit('intelligence_update', result.value.intelligence);
        this.server
          .to(socketId)
          .emit('user_metrics_update', result.value.userMetrics);
      }
    }
  }
}
