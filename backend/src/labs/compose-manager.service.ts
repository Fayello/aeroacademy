import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const execAsync = promisify(exec);
const logger = new Logger('ComposeManager');

export interface ComposeProject {
  projectId: string;    // lab instance ID
  labId: string;
  userId: string;
  projectName: string;  // docker compose project name
  workDir: string;      // path to compose file
  services: string[];   // list of service names
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  ports: Record<string, number>; // service -> host port mapping
  startedAt?: Date;
}

@Injectable()
export class ComposeManager {
  private projects = new Map<string, ComposeProject>();
  private readonly COMPOSE_BASE_DIR = '/tmp/capstone-labs';
  private readonly COMPOSE_NETWORK = 'aeroacademy_capstone';

  async init() {
    // Ensure base directory exists
    if (!fs.existsSync(this.COMPOSE_BASE_DIR)) {
      fs.mkdirSync(this.COMPOSE_BASE_DIR, { recursive: true });
    }

    // Ensure network exists
    try {
      await execAsync(`docker network inspect ${this.COMPOSE_NETWORK}`);
    } catch {
      await execAsync(`docker network create ${this.COMPOSE_NETWORK}`);
      logger.log(`Created compose network: ${this.COMPOSE_NETWORK}`);
    }
  }

  /**
   * Deploy a capstone lab as a Docker Compose stack
   */
  async deployCapstone(
    instanceId: string,
    labId: string,
    userId: string,
    composeYaml: string,
    basePort: number,
  ): Promise<ComposeProject> {
    const projectName = `capstone-${instanceId.slice(0, 8)}`;
    const workDir = path.join(this.COMPOSE_BASE_DIR, projectName);

    // Create working directory
    fs.mkdirSync(workDir, { recursive: true });

    // Parse and modify compose file
    const compose = yaml.load(composeYaml) as any;

    // Add our network to all services
    if (!compose.networks) compose.networks = {};
    compose.networks.capstone = { external: true, name: this.COMPOSE_NETWORK };

    for (const [serviceName, serviceConfig] of Object.entries<any>(compose.services || {})) {
      if (!serviceConfig.networks) serviceConfig.networks = [];
      serviceConfig.networks.push('capstone');

      // Add restart policy
      serviceConfig.restart = 'unless-stopped';

      // Add resource limits
      if (!serviceConfig.deploy) serviceConfig.deploy = {};
      serviceConfig.deploy.resources = {
        limits: { memory: '1G' },
      };
    }

    // Write compose file
    const composePath = path.join(workDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, yaml.dump(compose));

    // Parse service list
    const services = Object.keys(compose.services || {});

    const project: ComposeProject = {
      projectId: instanceId,
      labId,
      userId,
      projectName,
      workDir,
      services,
      status: 'starting',
      ports: {},
      startedAt: new Date(),
    };

    this.projects.set(instanceId, project);

    try {
      // Start the compose stack
      await execAsync(
        `docker compose -p ${projectName} -f ${composePath} up -d`,
        { timeout: 300000 }, // 5 minute timeout for image pulls
      );

      // Get port mappings
      for (const service of services) {
        try {
          const { stdout } = await execAsync(
            `docker compose -p ${projectName} -f ${composePath} port ${service} 80 2>/dev/null || echo ""`,
          );
          const port = stdout.trim().split(':').pop();
          if (port && !isNaN(parseInt(port))) {
            project.ports[service] = parseInt(port);
          }
        } catch {
          // Service might not expose port 80
        }
      }

      project.status = 'running';
      logger.log(`Capstone deployed: ${projectName} (${services.length} services)`);
    } catch (err) {
      project.status = 'error';
      logger.error(`Capstone deploy failed: ${err.message}`);
      throw err;
    }

    return project;
  }

  /**
   * Execute a command inside a specific service container
   */
  async execInService(
    instanceId: string,
    serviceName: string,
    command: string,
    user = 'root',
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const project = this.projects.get(instanceId);
    if (!project) throw new Error(`Project ${instanceId} not found`);

    try {
      const { stdout, stderr } = await execAsync(
        `docker compose -p ${project.projectName} -f ${project.workDir}/docker-compose.yml exec -T ${serviceName} bash -c '${command.replace(/'/g, "'\\''")}'`,
        { timeout: 30000 },
      );
      return { stdout, stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        exitCode: err.code || 1,
      };
    }
  }

  /**
   * Verify a flag across containers
   */
  async verifyFlag(
    instanceId: string,
    serviceName: string,
    command: string,
    expectedAnswer: string,
  ): Promise<{ passed: boolean; actual: string; expected: string }> {
    const result = await this.execInService(instanceId, serviceName, command);
    const actual = result.stdout.trim();

    // Flexible matching: exact, contains, or regex
    const passed =
      actual === expectedAnswer ||
      actual.includes(expectedAnswer) ||
      new RegExp(expectedAnswer).test(actual);

    return { passed, actual, expected: expectedAnswer };
  }

  /**
   * Stop and remove a capstone stack
   */
  async stopCapstone(instanceId: string): Promise<void> {
    const project = this.projects.get(instanceId);
    if (!project) return;

    project.status = 'stopping';

    try {
      await execAsync(
        `docker compose -p ${project.projectName} -f ${project.workDir}/docker-compose.yml down -v --remove-orphans`,
        { timeout: 120000 },
      );
      project.status = 'stopped';
      logger.log(`Capstone stopped: ${project.projectName}`);
    } catch (err) {
      logger.error(`Capstone stop failed: ${err.message}`);
      project.status = 'error';
    }
  }

  /**
   * Get project status
   */
  getProject(instanceId: string): ComposeProject | undefined {
    return this.projects.get(instanceId);
  }

  /**
   * List all running projects
   */
  listProjects(): ComposeProject[] {
    return Array.from(this.projects.values());
  }

  /**
   * Cleanup expired projects
   */
  async cleanupExpired(maxAgeMs: number = 2 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    for (const [id, project] of this.projects) {
      if (project.startedAt && now - project.startedAt.getTime() > maxAgeMs) {
        await this.stopCapstone(id);
        this.projects.delete(id);
      }
    }
  }
}
