import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Docker from 'dockerode';
import { Client as SSHClient } from 'ssh2';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('DockerManager');

export interface DockerServer {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  keyPath: string;
  docker?: Docker;
  sshClient?: SSHClient;
  tunnelPort?: number;
  isActive: boolean;
  labCount: number;
}

@Injectable()
export class DockerManager implements OnModuleInit, OnModuleDestroy {
  private servers: Map<string, DockerServer> = new Map();
  private localDocker: Docker;
  private tunnelServers: net.Server[] = [];
  private nextTunnelPort = 23760;

  constructor() {
    this.localDocker = new Docker();
  }

  async onModuleInit() {
    // Register local server
    this.servers.set('local', {
      id: 'local',
      name: 'Server 1 (Manager)',
      host: '127.0.0.1',
      port: 2376,
      username: 'root',
      keyPath: '',
      docker: this.localDocker,
      isActive: true,
      labCount: 0,
    });

    // Register remote server from env
    const remoteHost = process.env.REMOTE_DOCKER_HOST;
    const remoteUser = process.env.REMOTE_DOCKER_USER || 'fayell';
    const remoteKey = process.env.REMOTE_DOCKER_KEY || path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.ssh',
      'aeroacademy_deploy',
    );

    if (remoteHost) {
      await this.addRemoteServer({
        id: 'remote',
        name: 'Server 2 (Worker)',
        host: remoteHost,
        port: 22,
        username: remoteUser,
        keyPath: remoteKey,
      });
    }

    logger.log(`DockerManager initialized with ${this.servers.size} server(s)`);
  }

  async onModuleDestroy() {
    // Close all SSH tunnels
    for (const server of this.servers.values()) {
      if (server.sshClient) {
        server.sshClient.end();
      }
    }
    for (const tunnel of this.tunnelServers) {
      tunnel.close();
    }
  }

  async addRemoteServer(config: Omit<DockerServer, 'docker' | 'sshClient' | 'tunnelPort' | 'isActive' | 'labCount'>) {
    const connect = async (attempt: number) => {
      try {
        const tunnelPort = this.nextTunnelPort++;
        const sshClient = new SSHClient();

        await new Promise<void>((resolve, reject) => {
          sshClient
            .on('ready', () => {
              logger.log(`SSH connected to ${config.host}`);

              const server = net.createServer((socket) => {
                sshClient.forwardOut(
                  '127.0.0.1',
                  0,
                  '127.0.0.1',
                  2375,
                  (err, stream) => {
                    if (err) {
                      socket.end();
                      return;
                    }
                    socket.pipe(stream);
                    stream.pipe(socket);
                  },
                );
              });

              server.listen(tunnelPort, '127.0.0.1', () => {
                logger.log(`Docker tunnel established on 127.0.0.1:${tunnelPort}`);
                this.tunnelServers.push(server);
                resolve();
              });
            })
            .on('error', (err) => {
              logger.error(`SSH connection failed to ${config.host}: ${err.message}`);
              reject(err);
            })
            .on('close', () => {
              logger.warn(`SSH connection to ${config.host} closed, reconnecting...`);
              const existing = this.servers.get(config.id);
              if (existing) {
                existing.isActive = false;
              }
              setTimeout(() => connect(attempt + 1), Math.min(30000, 1000 * Math.pow(2, attempt)));
            })
            .connect({
              host: config.host,
              port: config.port,
              username: config.username,
              privateKey: fs.readFileSync(config.keyPath),
              readyTimeout: 10000,
            });
        });

        const docker = new Docker({
          host: '127.0.0.1',
          port: tunnelPort,
          protocol: 'http',
        });

        await docker.ping();
        logger.log(`Docker daemon verified on ${config.host}`);

        this.servers.set(config.id, {
          ...config,
          docker,
          sshClient,
          tunnelPort,
          isActive: true,
          labCount: 0,
        });
      } catch (err) {
        logger.error(`Failed to add remote server ${config.id} (attempt ${attempt}): ${err instanceof Error ? err.message : String(err)}`);
        if (attempt < 5) {
          setTimeout(() => connect(attempt + 1), Math.min(30000, 1000 * Math.pow(2, attempt)));
        }
      }
    };

    await connect(0);
  }

  getServer(id: string): DockerServer | undefined {
    return this.servers.get(id);
  }

  getLocalDocker(): Docker {
    return this.localDocker;
  }

  getRemoteDocker(): Docker | undefined {
    const remote = this.servers.get('remote');
    return remote?.docker;
  }

  getDockerForServer(serverId: string): Docker | undefined {
    return this.servers.get(serverId)?.docker;
  }

  /**
   * Pick the best server for a new lab based on current load
   */
  pickServer(): string {
    let bestId = 'local';
    let bestCount = Infinity;

    for (const [id, server] of this.servers) {
      if (!server.isActive) continue;
      if (server.labCount < bestCount) {
        bestCount = server.labCount;
        bestId = id;
      }
    }

    return bestId;
  }

  /**
   * Increment lab count for a server
   */
  incrementLabs(serverId: string) {
    const server = this.servers.get(serverId);
    if (server) server.labCount++;
  }

  /**
   * Decrement lab count for a server
   */
  decrementLabs(serverId: string) {
    const server = this.servers.get(serverId);
    if (server && server.labCount > 0) server.labCount--;
  }

  /**
   * Get total capacity across all servers
   */
  getTotalCapacity(): number {
    let total = 0;
    for (const server of this.servers.values()) {
      if (server.isActive) total += 20; // max per server
    }
    return total;
  }

  /**
   * Get current total labs
   */
  getTotalLabs(): number {
    let total = 0;
    for (const server of this.servers.values()) {
      total += server.labCount;
    }
    return total;
  }

  /**
   * Execute a command on a remote server via SSH
   */
  async execRemote(serverId: string, command: string): Promise<string> {
    const server = this.servers.get(serverId);
    if (!server?.sshClient) throw new Error(`Server ${serverId} not connected`);

    return new Promise((resolve, reject) => {
      server.sshClient!.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        let output = '';
        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });
        stream.on('end', () => resolve(output.trim()));
        stream.on('error', (e: Error) => reject(e));
      });
    });
  }
}
