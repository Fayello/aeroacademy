# Module 5 — Docker Compose and Multi-Service Apps

## What Docker Compose Solves

Real applications are not single containers. A typical web application needs a web server, an application server, a database, a cache, a message queue, and maybe a reverse proxy. Running each of these as separate `docker run` commands with the right network settings, volume mounts, environment variables, and startup order is tedious and error-prone.

Docker Compose solves this by defining all services in a single YAML file. One command starts everything: `docker compose up`. One command stops everything: `docker compose down`. The configuration is version-controlled, repeatable, and shareable.

A `docker-compose.yml` file is the source of truth for your local development environment. New team members clone the repository, run `docker compose up`, and have a working environment in minutes. No "install PostgreSQL, install Redis, configure the connection string, run migrations" instructions. It just works.

## Complete docker-compose.yml

Here is a complete, production-ready Docker Compose configuration for a typical web application stack:

```yaml
services:
  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      app:
        condition: service_healthy
    networks:
      - frontend
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://appuser:${DB_PASSWORD}@postgres:5432/aeroacademy
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=smtp.example.com
      - SMTP_PORT=587
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aeroacademy
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d aeroacademy"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
    restart: unless-stopped

  prisma-migrate:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    command: npx prisma migrate deploy
    environment:
      - DATABASE_URL=postgresql://appuser:${DB_PASSWORD}@postgres:5432/aeroacademy
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - backend
    # This service runs once and exits
    restart: "no"

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true

volumes:
  postgres-data:
  redis-data:
```

This configuration has five services: nginx (reverse proxy), app (the application), postgres (database), redis (cache), and prisma-migrate (database migrations). It defines two networks (frontend for external access, backend for internal communication), two named volumes (for data persistence), and health checks for every service that needs to be ready before dependent services start.

## Health Checks

Health checks tell Docker and Docker Compose whether a service is actually ready to handle requests. Without health checks, `depends_on` only waits for the container to start, not for the application inside it to be ready. A PostgreSQL container might start in 2 seconds but take 30 seconds to initialize the database.

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

- **test**: The command to run. `curl -f` returns a non-zero exit code if the HTTP status is not 2xx. For PostgreSQL, `pg_isready` is the standard health check command.
- **interval**: How often to run the check (default: 30s).
- **timeout**: How long to wait for the check to complete (default: 30s).
- **retries**: How many consecutive failures before marking the service as unhealthy (default: 3).
- **start_period**: How long to wait after the container starts before beginning health checks. This gives the application time to initialize.

For the application, a health endpoint should check:
- The process is running
- Database connectivity
- Redis connectivity
- Disk space (if applicable)

```javascript
// Example health endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024,
  };

  const healthy = Object.values(checks).every(Boolean);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    uptime: process.uptime(),
  });
});
```

## depends_on with Conditions

The `depends_on` directive controls startup order. Without conditions, Docker Compose only waits for the container to start, not for the service to be ready.

```yaml
# Basic depends_on (waits for container start only)
depends_on:
  - postgres

# Depends with condition (waits for health check)
depends_on:
  postgres:
    condition: service_healthy
```

The `service_healthy` condition waits until the dependent service's health check passes. This prevents the application from starting before PostgreSQL is ready to accept connections.

The available conditions are:
- `service_started` — Container has started (default behavior)
- `service_healthy` — Container's health check passes
- `service_completed_successfully` — Container exits with code 0 (useful for init containers)

For the prisma-migrate service, `restart: "no"` ensures it runs once and exits. The application waits for postgres to be healthy, but does not depend on prisma-migrate (which might finish after the app starts). This is a common pattern for initialization tasks.

## Environment Variables and .env Files

Sensitive configuration (passwords, API keys, secrets) should not be hardcoded in `docker-compose.yml`. Docker Compose supports environment variables from multiple sources.

### .env File

Create a `.env` file in the same directory as `docker-compose.yml`:

```bash
# .env
DB_PASSWORD=supersecret123
JWT_SECRET=anothersecret456
REDIS_PASSWORD=redissecret789
```

Reference variables in `docker-compose.yml`:

```yaml
environment:
  - DATABASE_URL=postgresql://appuser:${DB_PASSWORD}@postgres:5432/aeroacademy
```

Docker Compose automatically reads the `.env` file and substitutes variables. The `.env` file should be in `.gitignore` — never commit secrets to version control.

### Environment File Directive

For more control, use the `env_file` directive:

```yaml
app:
  env_file:
    - .env
    - .env.local
```

This loads all variables from the specified files. The `.env.local` file can override values from `.env` for local development.

### Variable Substitution in Compose File

Docker Compose supports variable substitution in the YAML file itself:

```yaml
services:
  app:
    image: myapp:${VERSION:-latest}
    ports:
      - "${HOST_PORT:-3000}:3000"
```

The `:-` syntax provides default values. If `VERSION` is not set, it defaults to `latest`. If `HOST_PORT` is not set, it defaults to `3000`.

### Docker Secrets

For production, Docker secrets provide a more secure way to handle sensitive data. Secrets are mounted as files in the container, not environment variables:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    secrets:
      - db-password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db-password

secrets:
  db-password:
    file: ./secrets/db-password.txt
```

The password is mounted at `/run/secrets/db-password` inside the container. The application reads it from the file instead of from an environment variable. This prevents secrets from appearing in process listings, logs, or Docker inspect output.

## Docker Compose Networking

Docker Compose creates a default network for all services. Services can communicate with each other using their service names as hostnames. This is DNS resolution provided by Docker's embedded DNS server.

```bash
# List networks created by Docker Compose
docker network ls

# Inspect the network
docker network inspect aeroacademy_default
```

By default, all services in a `docker-compose.yml` are on the same network. The `app` service can reach `postgres` at `postgres:5432` and `redis` at `redis:6379`. This is why service names matter — they are the DNS names used for communication.

You can create custom networks for isolation:

```yaml
services:
  app:
    networks:
      - frontend
      - backend

  postgres:
    networks:
      - backend

  redis:
    networks:
      - backend

  nginx:
    networks:
      - frontend

networks:
  frontend:
  backend:
```

With this configuration, `nginx` can reach `app` but not `postgres` or `redis`. `app` can reach `postgres` and `redis` but not `nginx` directly. This isolation prevents unintended communication between services.

For debugging network issues, use `docker compose exec` to run commands inside a container:

```bash
# Test connectivity from app to postgres
docker compose exec app ping postgres

# Test connectivity from app to redis
docker compose exec app nc -zv redis 6379

# Check DNS resolution
docker compose exec app nslookup postgres

# Check what ports are listening
docker compose exec postgres netstat -tlnp
```

Network issues are among the most common Docker Compose problems. The usual culprits: the service name is wrong (typo), the port is wrong (using host port instead of container port), or the service is on a different network.

## Docker Compose and Data Persistence

Data persistence is critical for stateful services like databases. Docker Compose supports three approaches:

**Named volumes** are the preferred method for production data:

```yaml
services:
  postgres:
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

Named volumes are managed by Docker, portable across environments, and can be backed up. They persist across `docker compose down` but are removed with `docker compose down -v`.

**Bind mounts** map host directories into containers:

```yaml
services:
  postgres:
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```

Bind mounts are useful for development because you can inspect the data directly on your host. They are not suitable for production because they depend on the host's directory structure.

** tmpfs mounts** are in-memory filesystems for temporary data:

```yaml
services:
  redis:
    tmpfs:
      - /data
```

tmpfs mounts are fast but volatile. Data is lost when the container stops. Use them for caching or temporary files, not for persistent data.

Backing up named volumes:

```bash
# Backup the database volume
docker compose exec postgres pg_dump -U appuser myapp > backup.sql

# Or backup the entire volume
docker run --rm -v aeroacademy_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

Restoring from backup:

```bash
# Restore database
cat backup.sql | docker compose exec -T postgres psql -U appuser myapp

# Restore volume
docker run --rm -v aeroacademy_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

Regular backups are essential for production databases. Automate backups using a cron job or a scheduled container that runs the backup command daily.

## Scaling Services

Docker Compose can scale services to multiple instances:

```bash
# Scale the app to 3 instances
docker compose up -d --scale app=3
```

Scaling works for stateless services. If your application stores session state locally, scaling to multiple instances will cause session loss. Use Redis or a database for session storage to enable horizontal scaling.

For load balancing across scaled instances, you need an external load balancer (nginx, HAProxy, or a cloud load balancer). Docker Compose does not provide built-in load balancing.

```yaml
services:
  nginx:
    image: nginx:1.27-alpine
    volumes:
      - ./nginx/upstream.conf:/etc/nginx/conf.d/upstream.conf:ro
    depends_on:
      - app

  app:
    build: .
    # No port mapping — nginx handles external traffic
```

```nginx
# nginx/upstream.conf
upstream app_backend {
    server app:3000;
    # Docker Compose DNS resolves to all instances
}
```

When using `depends_on` with scaled services, Docker Compose waits for all instances to be healthy before starting dependent services.

The DNS resolution for scaled services works because Docker Compose's embedded DNS server returns all IP addresses for the service name. When nginx resolves `app`, it gets all three instance IPs. Nginx's `upstream` directive then load-balances across them using round-robin by default.

## Logging Configuration

Docker captures stdout and stderr from containers. Docker Compose provides configuration for log drivers and rotation.

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

This limits each container's logs to 10 MB per file and keeps 3 files (30 MB total). Without rotation, container logs grow indefinitely and can fill the disk.

For centralized logging, use a log driver that sends logs to a logging service:

```yaml
services:
  app:
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        fluentd-async: "true"
```

This sends logs to Fluentd, which can forward them to Elasticsearch, Loki, or any other logging backend. The `fluentd-async` option prevents the application from blocking if the logging service is unavailable.

For development, the `json-file` driver with rotation is sufficient. For production, consider shipping logs to a centralized system.

## Development vs Production Overrides

Docker Compose supports multiple configuration files that can be layered on top of each other:

```bash
# Base configuration
docker-compose.yml

# Development overrides
docker-compose.override.yml

# Production overrides
docker-compose.prod.yml
```

Docker Compose automatically loads `docker-compose.yml` and `docker-compose.override.yml` if both exist. For production, specify the override file explicitly:

The base `docker-compose.yml` should contain the common configuration shared across all environments: service definitions, network names, and volume names. The override files modify environment-specific settings. This keeps the configuration DRY (Don't Repeat Yourself) while allowing per-environment customization.

```bash
# Development (uses default override)
docker compose up

# Production (uses production override)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Development Override

```yaml
# docker-compose.override.yml
services:
  app:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debugger
    environment:
      - NODE_ENV=development
      - DEBUG=app:*

  postgres:
    ports:
      - "5432:5432"

  redis:
    ports:
      - "6379:6379"
```

### Production Override

```yaml
# docker-compose.prod.yml
services:
  app:
    image: ghcr.io/myorg/myapp:${VERSION:-latest}
    build: null  # Override to prevent building
    ports: []    # No exposed ports — nginx handles traffic
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    restart: unless-stopped

  postgres:
    ports: []  # No exposed ports — only accessible from backend network
    restart: unless-stopped

  redis:
    ports: []  # No exposed ports
    restart: unless-stopped

  nginx:
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
```

The production override removes exposed ports (except nginx), adds restart policies, and configures resource limits. The development override adds bind mounts, exposed ports for debugging, and development environment variables.

## Real Story: Running 15 Microservices Locally with Compose

A platform team was migrating from a monolith to microservices. The monolith was a single Docker container with everything bundled together. The migration plan called for extracting services one at a time: authentication, user management, course management, lab provisioning, payment processing, notification service, file storage, search, analytics, email service, certificate generation, webhook handler, rate limiter, API gateway, and background job processor.

The challenge was that these services needed to communicate with each other during development. The authentication service needed the user management service. The course management service needed the lab provisioning service. The API gateway needed all of them.

The team created a `docker-compose.yml` with all 15 services:

```yaml
services:
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8080:8080"
    depends_on:
      auth-service:
        condition: service_healthy
      user-service:
        condition: service_healthy

  auth-service:
    build: ./services/auth-service
    environment:
      - JWT_SECRET=dev-secret
      - USER_SERVICE_URL=http://user-service:3001
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  user-service:
    build: ./services/user-service
    environment:
      - DATABASE_URL=postgresql://appuser:secret@postgres:5432/users
    depends_on:
      postgres:
        condition: service_healthy

  # ... 12 more services

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine

volumes:
  postgres-data:
```

The problems they encountered:

**Problem 1: Startup order.** The API gateway tried to connect to services that were not ready. The health checks were missing, so `depends_on` only waited for container start. The fix was adding health checks to every service and using `condition: service_healthy`.

**Problem 2: Resource consumption.** Running 15 services plus PostgreSQL and Redis consumed 8 GB of RAM. Developer laptops with 16 GB struggled. The fix was adding resource limits to each service and allowing developers to run only the services they were working on.

**Problem 3: Port conflicts.** Multiple services tried to use port 3000. The fix was using unique ports per service or letting Docker Compose assign random ports.

**Problem 4: Database migrations.** Each service had its own database, but the init scripts ran in a single PostgreSQL instance. The fix was using separate databases within the same PostgreSQL instance and running migrations as a separate init container.

The solution was a `Makefile` that provided shortcuts:

```makefile
.PHONY: up down logs restart

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart

# Run only core services
core:
	docker compose up -d postgres redis api-gateway auth-service user-service

# Run everything except the heavy services
dev:
	docker compose up -d --scale lab-provisioner=0 --scale analytics=0
```

The final configuration ran all 15 services with about 6 GB of RAM. Developers could run the full stack or just the services they needed. The `docker-compose.override.yml` added bind mounts for live code reloading, and the `docker-compose.prod.yml` added production configurations.

The key lesson was that Docker Compose scales to many services, but you need to be deliberate about resource management, health checks, and startup order. The investment in proper configuration paid off: new developers had a working environment in 10 minutes instead of the previous 2-day setup process.

## Debugging Docker Compose

When things go wrong with Docker Compose, the debugging workflow is systematic:

**Step 1: Check service status.**

```bash
docker compose ps
# NAME                    STATUS          PORTS
# app                     Up (healthy)    0.0.0.0:3000->3000/tcp
# postgres                Up (healthy)    5432/tcp
# redis                   Up              6379/tcp
```

The `STATUS` column shows whether each service is running and healthy. If a service is `Restarting` or `Exit`, something is wrong.

**Step 2: Check logs.**

```bash
# Logs for all services
docker compose logs

# Logs for a specific service
docker compose logs app

# Follow logs in real-time
docker compose logs -f app

# Show last 100 lines
docker compose logs --tail 100 app
```

Logs reveal startup errors, connection failures, and application errors. The most common issues: database connection refused (database not ready), port already in use (conflict), and missing environment variables.

**Step 3: Inspect the container.**

```bash
# Inspect container configuration
docker compose inspect app

# Check environment variables
docker compose exec app env

# Check network connectivity
docker compose exec app ping postgres

# Check if files are mounted correctly
docker compose exec app ls -la /app
```

**Step 4: Check resource usage.**

```bash
# View resource usage for all containers
docker stats

# View disk usage
docker system df
```

If a container is using excessive memory or CPU, it might be killed by the OOM killer or cause other services to slow down.

**Step 5: Rebuild from scratch.**

When all else fails, tear down everything and rebuild:

```bash
# Stop all containers and remove volumes
docker compose down -v

# Remove all images for this project
docker compose down --rmi all

# Rebuild and start
docker compose up --build
```

This is the nuclear option. It removes all data in volumes, so use it only when you are sure you do not need the data. For databases, make sure you have a backup before running `docker compose down -v`.

Common Docker Compose issues and their solutions:

| Problem | Cause | Solution |
|---------|-------|----------|
| `Connection refused` | Database not ready | Add `condition: service_healthy` to `depends_on` |
| `Port already in use` | Another process using the port | Change the host port or stop the other process |
| `No space left on device` | Docker disk full | Run `docker system prune -a` |
| `Image not found` | Wrong image name or tag | Check the image name and tag in Docker Hub |
| `Permission denied` | File ownership mismatch | Check volume mount permissions |

## Assessment

**Lab Task 1: Multi-Service Stack (90 minutes)**

Create a Docker Compose configuration for a web application with:
1. Nginx reverse proxy
2. Node.js application
3. PostgreSQL database
4. Redis cache
5. Health checks for all services
6. Named volumes for data persistence
7. Two networks (frontend and backend)
8. Environment variables from a .env file

The stack should start cleanly with `docker compose up` and all health checks should pass.

Grading criteria: All 5 services running (25%), health checks configured correctly (20%), networks properly configured (15%), volumes working (15%), environment variables properly managed (15%), documentation (10%).

**Lab Task 2: Development vs Production Configs (60 minutes)**

Using the stack from Task 1, create:
1. A `docker-compose.override.yml` for development with bind mounts, exposed database ports, and debugging tools
2. A `docker-compose.prod.yml` for production with resource limits, no exposed internal ports, and restart policies

Demonstrate both configurations work correctly.

Grading criteria: Development config includes all required features (25%), production config includes all required features (25%), both configs work (25%), differences are documented (25%).

**Lab Task 3: Scaling and Load Balancing (60 minutes)**

Configure your application stack to:
1. Scale the application to 3 instances
2. Set up nginx as a load balancer across all instances
3. Demonstrate that requests are distributed across instances
4. Show that one instance can be stopped without affecting service

Document the load balancing configuration and explain how Docker Compose DNS resolution works with scaled services.

Grading criteria: Scaling works (25%), load balancing distributes traffic (25%), fault tolerance demonstrated (25%), documentation explains DNS resolution (25%).

**Lab Task 4: Troubleshooting Lab (45 minutes)**

Given a broken Docker Compose configuration with 5 intentional issues (wrong image name, missing dependency, port conflict, incorrect volume mount, broken health check), identify and fix each issue. Document the debugging process.

Grading criteria: All 5 issues identified (30%), all 5 fixed correctly (30%), debugging process documented (25%), explanation of each issue (15%).

## Evidence

Docker Compose is documented in the official Docker documentation. The Compose Specification defines the YAML format, service configuration, networking, volumes, and environment variable handling. The examples in this module follow the Compose Specification version 3.x.

Health checks use Docker's built-in health check mechanism, which is documented in the Dockerfile reference and the Docker run documentation. The `service_healthy` condition in `depends_on` was introduced in Docker Compose version 2.1 and is documented in the Compose specification.

The microservices example is based on common patterns observed in organizations that are migrating from monoliths to microservices. The challenges (startup order, resource consumption, port conflicts, database migrations) are well-documented in the microservices literature and have been discussed extensively at conferences like KubeCon and QCon.

The multi-file configuration approach (docker-compose.yml, docker-compose.override.yml, docker-compose.prod.yml) is documented in the Docker Compose documentation and is a recommended pattern for managing different environments. The Makefile shortcuts are a common pattern for providing developer-friendly commands on top of Docker Compose.