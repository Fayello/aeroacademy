# Module 8 — Deployment: Docker, CI/CD, and Cloud Platforms

## What You'll Actually Do

Take a Node.js app from your laptop to production. You'll containerize it with Docker, set up a CI/CD pipeline that deploys automatically, and understand the tradeoffs between cloud providers. This is the stuff that gets your code in front of users.

---

## Dockerizing a Node.js App

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
```

```dockerfile
# Dockerfile.dev — for development
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/aeroacademy
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aeroacademy
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## Environment Configuration

```bash
# .env.example — committed to repo
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
REDIS_URL=redis://localhost:6379
```

```bash
# .env — NEVER committed
cp .env.example .env
# Fill in real values
```

```javascript
// src/config.js
const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
};

// Validate required env vars on startup
const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = config;
```

---

## CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          JWT_ACCESS_SECRET: test-secret
          JWT_REFRESH_SECRET: test-secret

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/aeroacademy
            docker compose pull
            docker compose up -d --remove-orphans
            docker compose exec -T app npx prisma migrate deploy
```

---

## Health Checks and Graceful Shutdown

```javascript
// src/server.js
const app = require("./app");
const config = require("./config");

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await db.query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "error", error: err.message });
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed");

    // Close database connections
    await db.disconnect();
    console.log("Database connections closed");

    process.exit(0);
  });

  // Force close after 30s
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

---

## Deployment Checklist

Before deploying:

- [ ] Environment variables set on production server
- [ ] Database migrations run (`prisma migrate deploy`)
- [ ] Health check endpoint returns 200
- [ ] Graceful shutdown handles in-flight requests
- [ ] Logs are structured (JSON format for aggregation)
- [ ] No secrets in code or Docker images
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled

---

## Assessment

**Lab Task: Containerize and Deploy (60 minutes)**

Containerize a Node.js API and set up deployment:

1. **Dockerfile:** Multi-stage build with non-root user, health check, and proper layer caching.
2. **docker-compose.yml:** App + PostgreSQL + Redis with health checks and volumes.
3. **CI/CD pipeline:** GitHub Actions workflow that runs tests on PR, builds and pushes image on merge to main.
4. **Health check:** Implement `/health` endpoint that checks database connectivity.
5. **Graceful shutdown:** Handle SIGTERM/SIGINT properly.
6. **Environment config:** Validate required env vars on startup.

**Deliverables:** Dockerfile, docker-compose.yml, GitHub Actions workflow, health check implementation, and a README with deployment instructions.

**Grading:**
- Docker image builds and runs: 25%
- docker-compose brings up full stack: 25%
- CI/CD pipeline runs tests: 25%
- Health check and graceful shutdown work: 15%
- Documentation is clear: 10%

---

## Evidence

Save all deployment files. Include a screenshot of `docker compose up` running successfully. Include the CI/CD pipeline output from GitHub Actions. Note any issues you encountered and how you solved them.
