# Module 8 — Deployment

Writing code is half the job. Getting it running in production is the other half. This module covers Docker containerization, CI/CD with GitHub Actions, cloud deployment, and how to ship code reliably without breaking things at 3 AM.

## Why Deployment Matters

The best code in the world is useless if it does not reach users. Deployment is the process of taking your code from a development environment to a production environment where real users can interact with it.

The goal of deployment is repeatability. You should be able to deploy the same code to staging and production with the same process. You should be able to roll back to a previous version if something breaks. You should be able to set up a new environment without hand-holding.

Manual deployment is error-prone. Someone forgets to run a migration. Someone deploys the wrong branch. Someone does not set an environment variable. Automated deployment eliminates these mistakes by following the same script every time.

The deployment pipeline typically has four stages. First is the build stage, where your code is compiled, bundled, and packaged. Second is the test stage, where automated tests verify that the code works correctly. Third is the staging stage, where the code is deployed to a production-like environment for final verification. Fourth is the production stage, where the code is deployed to real users. Each stage acts as a gate — if the build fails, you do not run tests. If tests fail, you do not deploy to staging. If staging verification fails, you do not deploy to production.

Containerization has changed how we think about deployment. Before Docker, you had to configure the server environment manually — install the right version of Node.js, set up the database client, configure the web server. With Docker, you package the entire environment into a container that runs identically everywhere. The server just needs Docker installed. This eliminates the "works on my machine" problem and makes it possible to deploy to any cloud provider without changes.

The distinction between building an application and deploying an application is important. Building means compiling TypeScript, bundling JavaScript, optimizing images, and creating production-ready artifacts. Deploying means getting those artifacts onto a server, configuring the environment, running migrations, and starting the application. Many developers conflate these two activities, but they are separate concerns that require separate tooling.

## Docker Containerization

Docker packages your application and its dependencies into a container — a lightweight, portable unit that runs the same way everywhere. The container includes the operating system libraries, the Node.js runtime, your application code, and all npm dependencies. This means "it works on my machine" becomes "it works everywhere."

Understanding Docker images and containers is essential. A Docker image is a read-only template that contains everything needed to run an application. A Docker container is a running instance of an image. You can create multiple containers from the same image, each running independently. Images are built from a Dockerfile, which is a text file containing step-by-step instructions for building the image.

The Dockerfile is the most important file in your deployment setup. It defines the base image (usually a minimal Linux distribution with Node.js), the working directory, the files to copy, the commands to run, and the user to run as. Each instruction in the Dockerfile creates a layer in the image. Docker caches these layers, so rebuilding an image after a small change is fast — only the affected layers are rebuilt.

Layer ordering is critical for build performance. Docker caches layers from top to bottom. If a layer changes, all subsequent layers are rebuilt. This means you should put instructions that change infrequently (like installing dependencies) before instructions that change frequently (like copying source code). If you copy source code before installing dependencies, every code change triggers a full dependency installation.

The `.dockerignore` file prevents unnecessary files from being included in the image. Without it, `node_modules` (which may contain platform-specific binaries), `.git` history (which can be hundreds of megabytes), and `.env` files (which contain secrets) are all included. A well-crafted `.dockerignore` reduces image size, speeds up builds, and prevents security issues.

### Why Multi-Stage Builds Matter

A Dockerfile with a single stage copies everything — development dependencies, test files, source code — into the production image. This makes the image larger than necessary and potentially exposes sensitive files. Multi-stage builds solve this by separating the build process from the final image.

### Dockerfile

```dockerfile
# Multi-stage build for Node.js application
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# Install dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
USER node
CMD ["dumb-init", "node", "dist/index.js"]
```

Each stage starts fresh from a base image. The `dependencies` stage installs only production dependencies. The `production` stage copies only what it needs. The `USER node` directive runs the application as a non-root user, which is a security best practice — if an attacker escapes the container, they have limited privileges.

### Docker Compose for Development

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

The `volumes` mount in the app service maps your local code directory into the container, so changes you make locally appear immediately inside the container. The `/app/node_modules` anonymous volume prevents your local `node_modules` from overwriting the container's installed dependencies.

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

The `restart: unless-stopped` policy tells Docker to automatically restart the container if it crashes, unless you explicitly stop it. The `healthcheck` configuration lets Docker and orchestration tools know when the application is actually ready to serve traffic, not just when the container is running.

### .dockerignore

```
node_modules
npm-debug.log
.git
.env
.env.*
dist
coverage
tests
*.md
docker-compose*.yml
Dockerfile
.dockerignore
```

Without a `.dockerignore` file, the `COPY . .` instruction copies everything, including `node_modules` (which may be for a different platform), `.git` history, and `.env` files with secrets. This bloats the image and creates security risks.

## CI/CD with GitHub Actions

CI/CD (Continuous Integration / Continuous Deployment) automates testing and deployment. Every push to the repository triggers a pipeline that runs tests, builds the application, and deploys it. This means bugs are caught before they reach production, and deployments happen in minutes instead of hours.

Continuous Integration means that every code change is automatically tested and merged into the main branch. When you push code, the CI pipeline runs your test suite, checks for linting errors, and verifies that the build succeeds. If any step fails, the change is rejected. This prevents broken code from accumulating in the codebase and makes it easy to identify which change introduced a bug.

Continuous Deployment means that every change that passes the CI pipeline is automatically deployed to production. When tests pass, the application is built, containerized, and deployed. This eliminates the manual deployment step and ensures that production is always up to date. Continuous Deployment requires high confidence in your test suite — if your tests do not catch bugs, you will deploy broken code to production automatically.

The distinction between Continuous Delivery and Continuous Deployment is subtle but important. Continuous Delivery means that every change is deployed to a staging environment and ready for production, but requires a manual approval step. Continuous Deployment means that every change goes directly to production without manual intervention. Most teams start with Continuous Delivery and move to Continuous Deployment as their test suite matures.

GitHub Actions is the most common CI/CD platform for open-source projects. It provides free CI minutes for public repositories and integrates directly with GitHub. The configuration is a YAML file that defines jobs, steps, and triggers. Each job runs on a separate virtual machine. Each step within a job runs a single command. Jobs can run in parallel or sequentially, and can depend on other jobs.

The CI pipeline should run as fast as possible. Slow CI pipelines discourage developers from running them, which defeats the purpose. Common optimizations include caching dependencies between runs, running independent jobs in parallel, only running tests that are affected by the code change, and using faster hardware for CI runners. A good CI pipeline completes in under 10 minutes.

### Basic CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          JWT_SECRET: test-secret-key
          NODE_ENV: test

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run typecheck
```

The `services` section starts PostgreSQL and Redis containers as part of the CI job. The `--health-cmd` options wait for the services to be ready before the job proceeds. The `cache: "npm"` option caches npm dependencies between runs, making subsequent runs faster.

### CD Pipeline with Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/myapp:latest
            ${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.sha }}
          target: production

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/myapp
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --force-recreate
            docker system prune -f
```

The pipeline has three jobs that run in sequence: test, build-and-push, and deploy. Each job depends on the previous one — if tests fail, the image is not built. If the build fails, the deployment does not happen. The image is tagged with both `latest` and the git commit SHA, so you can always roll back to a specific version.

## Cloud Deployment

### Environment Variables

Never hardcode secrets. Use environment variables:

```bash
# .env (development only — never commit this)
DATABASE_URL=postgresql://localhost:5432/myapp_dev
JWT_SECRET=dev-secret-key
REDIS_URL=redis://localhost:6379
PORT=3000
CLIENT_URL=http://localhost:5173

# Production environment variables (set on your server or platform)
DATABASE_URL=postgresql://user:password@host:5432/myapp_prod
JWT_SECRET=a-very-long-random-secret-key
REDIS_URL=redis://redis:6379
PORT=3000
CLIENT_URL=https://myapp.example.com
NODE_ENV=production
```

### Health Check Endpoint

```javascript
// src/routes/health.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

router.get("/health", async (req, res) => {
  const checks = {
    database: "ok",
    redis: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    checks.database = "error";
    checks.databaseError = error.message;
  }

  try {
    await redis.ping();
  } catch (error) {
    checks.redis = "error";
    checks.redisError = error.message;
  }

  const isHealthy = checks.database === "ok" && checks.redis === "ok";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    checks
  });
});

module.exports = router;
```

A health check endpoint is not just a nice-to-have — it is required for container orchestrators, load balancers, and monitoring tools. The health check should verify that all critical dependencies (database, cache, external services) are reachable. A 503 status code tells the load balancer to stop sending traffic to this instance until it recovers.

### Graceful Shutdown

```javascript
// src/index.js
const app = require("./app");
const { connectDB, disconnectDB } = require("./db/connection");

const server = app.listen(process.env.PORT || 3000, async () => {
  await connectDB();
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed");

    await disconnectDB();
    console.log("Database connections closed");

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

Graceful shutdown is often overlooked but critical for production applications. When you deploy a new version, the old container is stopped. Without graceful shutdown, the process is killed immediately, which can leave database transactions incomplete, file writes unfinished, and responses partially sent to clients. With graceful shutdown, the application stops accepting new connections, waits for existing requests to complete, closes database connections, and then exits cleanly.

The timeout is essential. Without it, a stuck request (like a long-running database query or an external API call that hangs) would prevent the process from ever shutting down. The timeout ensures that the process exits within a reasonable time, even if some requests are stuck. A 30-second timeout is a good default — long enough for most requests to complete, short enough that deployments do not hang.

SIGTERM and SIGINT are the two signals you need to handle. SIGTERM is sent by Docker when you stop a container, by Kubernetes when it needs to evict a pod, and by process managers when they need to restart the application. SIGINT is sent when you press Ctrl+C in the terminal. Both signals should trigger the same graceful shutdown logic.

When you run `docker compose up -d`, Docker sends a SIGTERM signal to your application when you run `docker compose stop` or when the container is replaced during an update. Without a graceful shutdown handler, the process is killed immediately, potentially in the middle of writing to the database. The `server.close()` method stops accepting new connections but lets existing requests finish. The timeout ensures the process does not hang forever if a request is stuck.

## Real Scenario: Deploying to Production

Here is a complete deployment workflow for a Node.js application with a PostgreSQL database.

### Pre-Deployment Checklist

```markdown
## Before Deploying

1. [ ] All tests pass locally
2. [ ] Linting passes with no errors
3. [ ] No hardcoded secrets in the codebase
4. [ ] Environment variables are set on the server
5. [ ] Database migrations are ready
6. [ ] Docker image builds successfully
7. [ ] Health check endpoint is working
8. [ ] Graceful shutdown handler is in place
9. [ ] Log levels are appropriate (no debug logs in production)
10. [ ] Monitoring and alerting are configured
```

### Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Build Docker image
echo "Building Docker image..."
docker compose -f docker-compose.prod.yml build --no-cache app

# Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Restart services
echo "Restarting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate app

# Wait for health check
echo "Waiting for application to be healthy..."
for i in {1..30}; do
  if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Application is healthy!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Health check failed after 30 attempts"
    docker compose -f docker-compose.prod.yml logs app
    exit 1
  fi
  sleep 2
done

# Clean up old images
echo "Cleaning up..."
docker image prune -f

echo "Deployment complete!"
```

The `--no-cache` flag on the build command ensures a fresh build without cached layers. The `--force-recreate` flag on the up command replaces the running container even if the image has not changed. The health check loop waits up to 60 seconds (30 attempts × 2 seconds) for the application to become healthy, and dumps the logs if it does not.

### Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

PREVIOUS_VERSION=${1:-"HEAD~1"}

echo "Rolling back to $PREVIOUS_VERSION..."

git checkout $PREVIOUS_VERSION -- docker-compose.prod.yml
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d --force-recreate app

# Wait for health check
for i in {1..30}; do
  if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Rollback successful!"
    break
  fi
  sleep 2
done
```

## Nginx Configuration

Nginx sits in front of your application as a reverse proxy. It handles SSL termination (so your Node.js application does not need to), serves static files directly from disk (much faster than through Node.js), compresses responses with gzip, rate-limits API requests, and adds security headers. The `try_files $uri $uri/ /index.html` directive is critical for single-page applications — it serves `index.html` for all routes that do not match a static file, letting the client-side router handle the routing.

Understanding the Nginx configuration is important for debugging production issues. If static files are not loading, check the `root` directive. If the API is returning 502 Bad Gateway, check that the upstream server is running. If SSL is not working, check the certificate paths. If rate limiting is too aggressive, adjust the `rate` and `burst` parameters.

The `proxy_set_header` directives are critical for passing client information to your application. Without them, your application sees all requests as coming from Nginx's IP address instead of the actual client IP. The `X-Forwarded-For` header contains the client's IP address, the `X-Forwarded-Proto` header indicates whether the original request was HTTP or HTTPS, and the `Host` header contains the original hostname.

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name myapp.example.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name myapp.example.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml;

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://app;
        }

        # Static files (React build)
        location / {
            root /app/dist;
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

Nginx sits in front of your application as a reverse proxy. It handles SSL termination (so your Node.js application does not need to), serves static files directly from disk (much faster than through Node.js), compresses responses with gzip, rate-limits API requests, and adds security headers. The `try_files $uri $uri/ /index.html` directive is critical for single-page applications — it serves `index.html` for all routes that do not match a static file, letting the client-side router handle the routing.

## Assessment

### Lab Task: Deploy an Application

**Time Limit: 60 minutes**

Deploy a Node.js application with the following requirements:

1. **Dockerfile:** Create a multi-stage Dockerfile with development and production targets.
2. **Docker Compose:** Create docker-compose.yml for development with PostgreSQL and Redis.
3. **CI Pipeline:** Create a GitHub Actions workflow that runs tests on every push.
4. **Health Check:** Implement a health check endpoint that verifies database and cache connectivity.
5. **Deployment Script:** Create a deployment script that builds, migrates, and deploys the application.

**Requirements:**
- Dockerfile must use multi-stage build
- Docker Compose must include PostgreSQL and Redis
- CI pipeline must run tests, linting, and type checking
- Health check must verify database connectivity
- Deployment script must include rollback capability

### Grading Criteria

- **Dockerfile (25 points):** Multi-stage build, proper layer caching, non-root user, health check.
- **Docker Compose (20 points):** Services are properly configured, volumes persist data, environment variables are used.
- **CI Pipeline (25 points):** Tests run on push, proper caching, database services in CI.
- **Health Check (15 points):** Endpoint verifies database and cache, returns appropriate status codes.
- **Deployment (15 points):** Script handles build, migration, and restart with error handling.

### Evidence

After completing this module, you should be able to:

1. Write multi-stage Dockerfiles for Node.js applications.
2. Configure Docker Compose for development and production environments.
3. Set up GitHub Actions CI/CD pipelines.
4. Implement health check endpoints and graceful shutdown.
5. Deploy applications with database migrations.
6. Configure Nginx as a reverse proxy with SSL and security headers.
7. Implement rollback procedures for failed deployments.
