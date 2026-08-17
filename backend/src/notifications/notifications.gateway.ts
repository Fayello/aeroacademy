import { OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { EventsService } from '../common/events.service';
import createLogger from '../common/logger';

const logger = createLogger('Notifications');
const MAX_CONNECTIONS_PER_USER = 3;

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private connectionCounts: Map<string, number> = new Map();

  constructor(
    private jwtService: JwtService,
    private eventsService: EventsService,
  ) {}

  onModuleInit() {
    this.eventsService.events$.subscribe(({ type, payload }) => {
      if (type === 'NOTIFICATION_CREATED') {
        const n = payload as { userId: string };
        if (n?.userId) {
          this.server
            .to(`notifications:${n.userId}`)
            .emit('notification:new', payload);
        }
      }
    });
  }

  handleConnection(client: Socket) {
    const token: unknown = client.handshake.auth?.token;
    if (typeof token !== 'string') {
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

      this.connectionCounts.set(userId, count + 1);
      void client.join(`notifications:${userId}`);
      logger.info(`User ${userId} subscribed to notifications`);

      client.on('disconnect', () => {
        const c = this.connectionCounts.get(userId) || 1;
        if (c <= 1) this.connectionCounts.delete(userId);
        else this.connectionCounts.set(userId, c - 1);
      });
    } catch {
      client.disconnect();
    }
  }
}
