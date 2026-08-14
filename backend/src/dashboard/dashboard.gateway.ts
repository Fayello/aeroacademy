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
    const token = client.handshake.auth.token as string;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const userId = payload.sub;
      this.connectedUsers.set(client.id, userId);

      await this.achievementService.checkAndUnlockAchievements(userId);

      const intelligence = await this.dashboardService.getSystemIntelligence();
      const userMetrics = await this.dashboardService.getUserMetrics(userId);
      const leaderboard = await this.leaderboardService.getGlobalLeaderboard();

      client.emit('intelligence_update', intelligence);
      client.emit('user_metrics_update', userMetrics);
      client.emit('leaderboard_update', leaderboard);

      logger.info(`User ${userId} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
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

    for (const [socketId, userId] of this.connectedUsers.entries()) {
      try {
        await this.achievementService.checkAndUnlockAchievements(userId);
        const intelligence =
          await this.dashboardService.getSystemIntelligence(userId);
        const userMetrics = await this.dashboardService.getUserMetrics(userId);

        this.server.to(socketId).emit('intelligence_update', intelligence);
        this.server.to(socketId).emit('user_metrics_update', userMetrics);
      } catch {
        // skip individual user errors
      }
    }
  }
}
