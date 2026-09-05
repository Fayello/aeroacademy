import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GuildsService } from './guilds.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/guild-chat' })
export class GuildChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();
  private socketGuilds = new Map<string, string>();

  constructor(
    private guildsService: GuildsService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId);
    }
    this.socketGuilds.delete(client.id);
  }

  @SubscribeMessage('join-guild')
  async handleJoinGuild(@ConnectedSocket() client: Socket, @MessageBody() data: { guildId: string }) {
    const userId = client.data.userId;
    if (!userId) return;

    client.join(`guild:${data.guildId}`);
    this.socketGuilds.set(client.id, data.guildId);

    this.server.to(`guild:${data.guildId}`).emit('user-joined', { userId, guildId: data.guildId });
  }

  @SubscribeMessage('leave-guild')
  async handleLeaveGuild(@ConnectedSocket() client: Socket, @MessageBody() data: { guildId: string }) {
    client.leave(`guild:${data.guildId}`);
    this.socketGuilds.delete(client.id);

    this.server.to(`guild:${data.guildId}`).emit('user-left', { userId: client.data.userId, guildId: data.guildId });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { guildId: string; content: string }) {
    const userId = client.data.userId;
    if (!userId || !data.content?.trim()) return;

    try {
      const message = await this.guildsService.sendChatMessage(data.guildId, userId, data.content.trim());
      this.server.to(`guild:${data.guildId}`).emit('new-message', message);
    } catch (err) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { guildId: string }) {
    const userId = client.data.userId;
    if (!userId) return;
    client.to(`guild:${data.guildId}`).emit('user-typing', { userId, guildId: data.guildId });
  }

  @SubscribeMessage('stop-typing')
  handleStopTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { guildId: string }) {
    const userId = client.data.userId;
    if (!userId) return;
    client.to(`guild:${data.guildId}`).emit('user-stop-typing', { userId, guildId: data.guildId });
  }
}
