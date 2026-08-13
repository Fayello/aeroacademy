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
      void client.join(`notifications:${payload.sub}`);
      logger.info(`User ${payload.sub} subscribed to notifications`);
    } catch {
      client.disconnect();
    }
  }
}
