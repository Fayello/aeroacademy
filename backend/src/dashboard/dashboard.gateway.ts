
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

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: 'dashboard',
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
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
        for (const [socketId, userId] of this.connectedUsers.entries()) {
          if (userId === payload.userId) {
            this.server.to(socketId).emit('achievement_unlocked', payload);
          }
        }

        this.server.emit('global_feed_update', {
          type: 'ACHIEVEMENT_UNLOCKED',
          message: payload.messageOverride || `Operative unlocked merit: ${payload.title.replace('_', ' ')}`,
          points: payload.xpReward,
          timestamp: payload.timestamp
        });
      }
      
      if (type === 'FLAG_CAPTURED') {
        this.server.emit('global_feed_update', {
          type: 'FLAG_CAPTURED',
          message: payload.messageOverride || `Operative synchronized flag: ${payload.flagTitle}`,
          points: payload.points,
          timestamp: payload.timestamp
        });
      }
    });
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
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
    } catch (err) {
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
        const intelligence = await this.dashboardService.getSystemIntelligence(userId);
        const userMetrics = await this.dashboardService.getUserMetrics(userId);
        
        this.server.to(socketId).emit('intelligence_update', intelligence);
        this.server.to(socketId).emit('user_metrics_update', userMetrics);
      } catch {
        // skip individual user errors
      }
    }
  }
}
