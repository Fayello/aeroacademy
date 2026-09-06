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
import { DockerManager } from './docker-manager.service';
import { JwtService } from '@nestjs/jwt';
import Docker from 'dockerode';
import { Duplex } from 'stream';
import createLogger from '../common/logger';

const logger = createLogger('LabsGateway');
const MAX_INPUT_SIZE = 4096;
const MAX_CONNECTIONS_PER_USER = 3;
const TERMINAL_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const JOIN_TIMEOUT_MS = 30 * 1000;
const INPUT_RATE_LIMIT = 100; // max messages per second
const INPUT_RATE_WINDOW_MS = 1000;
const ALLOWED_CONTROL_CHARS = new Set([
  8,
  9,
  10,
  13,
  27,
  127, // backspace, tab, newline, carriage return, ESC, DEL
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

function getCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

interface SocketData {
  user?: JwtPayload;
  joinTimer?: NodeJS.Timeout;
}

interface TerminalSession {
  stream: Duplex;
  exec: Docker.Exec;
  idleTimer: NodeJS.Timeout;
  lastActivity: number;
  inputCount: number;
  inputWindowStart: number;
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
    private readonly dockerManager: DockerManager,
    private readonly jwtService: JwtService,
  ) {
    this.docker = dockerManager.getLocalDocker();
  }

  handleConnection(client: Socket) {
    const authToken = client.handshake.auth?.token as string | undefined;
    const cookieToken =
      getCookieValue(client.handshake.headers.cookie, 'access_token') ||
      getCookieValue(client.handshake.headers.cookie, 'token');
    const token = authToken || cookieToken;
    if (!token) {
      logger.warn(
        `Terminal connection rejected: no token (client ${client.id})`,
      );
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      (client.data as SocketData).user = payload;

      const userId = payload.sub;
      const currentConnections = this.userConnections.get(userId) || 0;
      if (currentConnections >= MAX_CONNECTIONS_PER_USER) {
        logger.warn(
          `Terminal connection rejected: max connections for user ${userId}`,
        );
        client.emit('error', 'Maximum terminal connections reached');
        client.disconnect();
        return;
      }
      this.userConnections.set(userId, currentConnections + 1);
      logger.info(`Terminal client connected: ${client.id} (user ${userId})`);

      const joinTimer = setTimeout(() => {
        if (!this.activeSessions.has(client.id)) {
          logger.warn(`Terminal join timeout for client ${client.id}`);
          client.emit('error', 'Terminal session timed out');
          client.disconnect();
        }
      }, JOIN_TIMEOUT_MS);
      (client.data as SocketData).joinTimer = joinTimer;
    } catch (err) {
      logger.warn(
        `Terminal connection rejected: invalid token (client ${client.id}): ${err instanceof Error ? err.message : String(err)}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    logger.info(`Terminal client disconnected: ${client.id}`);
    const session = this.activeSessions.get(client.id);
    if (session) {
      clearTimeout(session.idleTimer);
      session.stream.end();
      this.activeSessions.delete(client.id);
    }

    const joinTimer = (client.data as SocketData).joinTimer;
    if (joinTimer) clearTimeout(joinTimer);

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
      logger.warn(
        `Terminal join rejected: not authenticated (client ${client.id})`,
      );
      client.emit('error', 'Not authenticated');
      return;
    }
    if (
      !data?.labId ||
      typeof data.labId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        data.labId,
      )
    ) {
      logger.warn(
        `Terminal join rejected: invalid lab ID (client ${client.id})`,
      );
      client.emit('error', 'Invalid lab ID');
      return;
    }
    logger.info(
      `Terminal join request: user ${userId}, lab ${data.labId}, client ${client.id}`,
    );
    const instance = await this.labsService.getLabStatus(userId, data.labId);

    if (!instance || !instance.containerId || instance.status !== 'RUNNING') {
      logger.warn(
        `Terminal join rejected: no active instance (user ${userId}, lab ${data.labId}, status: ${instance?.status})`,
      );
      client.emit('error', 'No active lab instance found');
      return;
    }

    try {
      const targetDocker =
        this.dockerManager.getDockerForServer(instance.serverId || 'local') ||
        this.docker;
      const container = targetDocker.getContainer(instance.containerId);

      let inspectInfo;
      try {
        inspectInfo = await container.inspect();
      } catch {
        logger.warn(
          `Container not found (user ${userId}, lab ${data.labId}), container ${instance.containerId}`,
        );
        client.emit('error', 'Lab container not found. Please restart the lab.');
        return;
      }

      if (!inspectInfo.State.Running) {
        logger.warn(
          `Container not running (user ${userId}, lab ${data.labId}), state: ${inspectInfo.State.Status}, exit: ${inspectInfo.State.ExitCode}`,
        );
        try {
          await container.start();
          logger.info(
            `Auto-restarted container ${instance.containerId}`,
          );
        } catch {
          client.emit('error', 'Lab instance stopped. Please restart the lab.');
          return;
        }
      }

      try {
        const ensureExec = await container.exec({
          AttachStdin: false,
          AttachStdout: false,
          AttachStderr: false,
          Cmd: [
            'bash',
            '-c',
            'id student >/dev/null 2>&1 || (useradd -m -s /bin/bash student && echo "student:lab123" | chpasswd && echo "student ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/student && chmod 0440 /etc/sudoers.d/student); exit 0',
          ],
        });
        await ensureExec.start({ hijack: false, stdin: false });
      } catch {}

      const shells = ['/bin/bash', '/bin/sh', 'sh'];
      let stream: Duplex | null = null;
      let execInstance: Docker.Exec | null = null;

      const users = ['student', 'kali', 'user', 'root'];

      for (const user of users) {
        if (stream) break;
        for (const shell of shells) {
          try {
            const exec = await container.exec({
              AttachStdin: true,
              AttachStdout: true,
              AttachStderr: true,
              Tty: true,
              Cmd: [shell],
              User: user,
            });

            const nextStream = await exec.start({ hijack: true, stdin: true });

            const probe = await new Promise<boolean>((resolve) => {
              const timeout = setTimeout(() => resolve(true), 1000);
              nextStream.once('data', (chunk: Buffer) => {
                clearTimeout(timeout);
                const text = chunk.toString();
                if (
                  text.includes('not found') ||
                  text.includes('unable to find user') ||
                  text.includes('no such user')
                ) {
                  nextStream.resume();
                  resolve(false);
                } else {
                  resolve(true);
                }
              });
              nextStream.once('end', () => {
                clearTimeout(timeout);
                resolve(false);
              });
            });

            if (!probe) {
              nextStream.destroy();
              continue;
            }

            logger.info(
              `Terminal attached: user=${user}, shell=${shell}, client=${client.id}`,
            );
            execInstance = exec;
            stream = nextStream;
            break;
          } catch (err) {
            logger.warn(
              `Exec failed: user=${user}, shell=${shell}: ${err instanceof Error ? err.message : String(err)}`,
            );
            continue;
          }
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
        inputCount: 0,
        inputWindowStart: Date.now(),
      };

      this.activeSessions.set(client.id, session);

      const joinTimer = (client.data as SocketData).joinTimer;
      if (joinTimer) clearTimeout(joinTimer);

      stream.on('data', (chunk: Buffer) => {
        client.emit('output', chunk.toString());
        this.resetIdleTimer(client.id);
      });

      stream.on('end', () => {
        logger.warn(`Terminal stream ended for client ${client.id}`);
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
      // Rate limit: max INPUT_RATE_LIMIT messages per window
      const now = Date.now();
      if (now - session.inputWindowStart > INPUT_RATE_WINDOW_MS) {
        session.inputCount = 0;
        session.inputWindowStart = now;
      }
      session.inputCount++;
      if (session.inputCount > INPUT_RATE_LIMIT) return;

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
      const cols = Math.max(1, Math.min(500, Number(data.cols) || 80));
      const rows = Math.max(1, Math.min(200, Number(data.rows) || 24));
      try {
        await session.exec.resize({ h: rows, w: cols });
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
