# Module 5 — Docker Compose and Multi-Service Apps

**Course:** DevOps & Platform Engineering | **Path:** DevOps (5 of 10)

---

## What You'll Actually Do

You'll run a complete application stack — app, database, cache, reverse proxy — with a single command using Docker Compose.

---

## docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_HOST=redis
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:
  pgdata:
  redisdata:
```

---

## Commands

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f app

# Scale a service
docker compose up -d --scale app=3

# Stop and remove
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild
docker compose build --no-cache
docker compose up -d
```

---

## Environment Variables

```bash
# .env file (don't commit this!)
DB_PASSWORD=supersecret
REDIS_PASSWORD=anothersecret

# Reference in docker-compose.yml
environment:
  - DB_PASSWORD=${DB_PASSWORD}
```

---

## Assessment

**Lab task (25 min):**

1. Create a docker-compose.yml for app + postgres + redis
2. Start the stack
3. Verify all services are connected
4. Add a reverse proxy (nginx)
5. Configure health checks

**Grading:**
- Compose file correct: 25%
- Services running: 20%
- Connectivity working: 20%
- Reverse proxy: 20%
- Health checks: 15%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO5 — Docker Compose`
