import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LabsService } from './labs.service';
import { JwtService } from '@nestjs/jwt';
import Docker from 'dockerode';
import { Duplex } from 'stream';
import createLogger from '../common/logger';

const logger = createLogger('LabsGateway');
const MAX_INPUT_SIZE = 4096;
const MAX_CONNECTIONS_PER_USER = 3;
const TERMINAL_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ALLOWED_CONTROL_CHARS = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127,
]);

function sanitizeInput(data: string): string {
  if (typeof data !== 'string') return '';
  const filtered: string[] = [];
  for (let i = 0; i < data.length && filtered.length < MAX_INPUT_SIZE; i++) {
    const code = data.charCodeAt(i);
    if (code >= 32 && code < 127) {
      filtered.push(data[i]);
    } else if (ALLOWED_CONTROL_CHARS.has(code)) {
      filtered.push(data[i]);
    }
  }
  return filtered.join('');
}

interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

interface SocketData {
  user?: JwtPayload;
}

interface TerminalSession {
  stream: Duplex;
  exec: Docker.Exec;
  idleTimer: NodeJS.Timeout;
  lastActivity: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'terminal',
})
export class LabsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private docker: Docker;
  private activeSessions: Map<string, TerminalSession> = new Map();
  private userConnections: Map<string, number> = new Map();

  constructor(
    private readonly labsService: LabsService,
    private readonly jwtService: JwtService,
  ) {
    this.docker = new Docker();
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      (client.data as SocketData).user = payload;

      const userId = payload.sub;
      const currentConnections = this.userConnections.get(userId) || 0;
      if (currentConnections >= MAX_CONNECTIONS_PER_USER) {
        client.emit('error', 'Maximum terminal connections reached');
        client.disconnect();
        return;
      }
      this.userConnections.set(userId, currentConnections + 1);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const session = this.activeSessions.get(client.id);
    if (session) {
      clearTimeout(session.idleTimer);
      session.stream.end();
      this.activeSessions.delete(client.id);
    }

    const user = (client.data as SocketData).user;
    if (user) {
      const userId = user.sub;
      const currentConnections = this.userConnections.get(userId) || 0;
      if (currentConnections <= 1) {
        this.userConnections.delete(userId);
      } else {
        this.userConnections.set(userId, currentConnections - 1);
      }
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { labId: string },
  ) {
    const userId = (client.data as SocketData).user?.sub;
    if (!userId) {
      client.emit('error', 'Not authenticated');
      return;
    }
    const instance = await this.labsService.getLabStatus(userId, data.labId);

    if (!instance || !instance.containerId || instance.status !== 'RUNNING') {
      client.emit('error', 'No active lab instance found');
      return;
    }

    try {
      const container = this.docker.getContainer(instance.containerId);
      const shells = ['/bin/bash', '/bin/sh', 'sh'];
      let stream: Duplex | null = null;
      let execInstance: Docker.Exec | null = null;

      for (const shell of shells) {
        try {
          const exec = await container.exec({
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: [shell],
          });

          const nextStream = await exec.start({ hijack: true, stdin: true });

          const isAlive = await Promise.race([
            new Promise<boolean>((r) => {
              nextStream.once('data', () => r(true));
              nextStream.once('end', () => r(false));
              setTimeout(() => r(true), 500);
            }),
          ]);

          if (isAlive) {
            execInstance = exec;
            stream = nextStream;
            break;
          } else {
            nextStream.end();
          }
        } catch {
          continue;
        }
      }

      if (!stream || !execInstance)
        throw new Error('No compatible shell found in container');

      const idleTimer = setTimeout(() => {
        this.cleanupSession(client.id);
        client.emit('exit', 'Terminal closed due to inactivity');
      }, TERMINAL_IDLE_TIMEOUT_MS);

      const session: TerminalSession = {
        stream,
        exec: execInstance,
        idleTimer,
        lastActivity: Date.now(),
      };

      this.activeSessions.set(client.id, session);

      stream.on('data', (chunk: Buffer) => {
        client.emit('output', chunk.toString());
        this.resetIdleTimer(client.id);
      });

      stream.on('end', () => {
        this.cleanupSession(client.id);
        client.emit('exit', 'Session closed');
      });

      client.emit('ready', 'Terminal connected');
    } catch (err) {
      logger.error(
        `Terminal attach failed for client ${client.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      client.emit('error', 'Failed to attach terminal. Please try again.');
    }
  }

  @SubscribeMessage('input')
  handleInput(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    const session = this.activeSessions.get(client.id);
    if (session) {
      const sanitized = sanitizeInput(data);
      if (sanitized.length > 0) {
        session.stream.write(sanitized);
        this.resetIdleTimer(client.id);
      }
    }
  }

  @SubscribeMessage('resize')
  async handleResize(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cols: number; rows: number },
  ) {
    const session = this.activeSessions.get(client.id);
    if (session?.exec) {
      try {
        await session.exec.resize({ h: data.rows, w: data.cols });
      } catch {
        /* session may have ended */
      }
    }
  }

  private resetIdleTimer(clientId: string) {
    const session = this.activeSessions.get(clientId);
    if (session) {
      clearTimeout(session.idleTimer);
      session.idleTimer = setTimeout(() => {
        this.cleanupSession(clientId);
        const client = this.server?.sockets?.sockets?.get(clientId);
        client?.emit('exit', 'Terminal closed due to inactivity');
      }, TERMINAL_IDLE_TIMEOUT_MS);
      session.lastActivity = Date.now();
    }
  }

  private cleanupSession(clientId: string) {
    const session = this.activeSessions.get(clientId);
    if (session) {
      clearTimeout(session.idleTimer);
      session.stream.end();
      this.activeSessions.delete(clientId);
    }
  }
}
