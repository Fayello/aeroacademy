# Module 4 — Containerization with Docker

**Course:** DevOps & Platform Engineering | **Path:** DevOps (4 of 10)

---

## What You'll Actually Do

You'll containerize an application — write a Dockerfile, build an image, run a container, optimize for production.

---

## Dockerfile — The Recipe

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
USER appuser
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

---

## Image Optimization

```text
Use alpine images (5MB vs 100MB+)
Multi-stage builds (build in one stage, run in another)
Don't copy unnecessary files (.git, node_modules in build stage)
Layer ordering (rarely changing layers first)
Use .dockerignore
```

```dockerignore
.git
node_modules
*.md
.env
```

---

## Container Security

```text
Don't run as root (USER appuser)
Read-only filesystem (--read-only)
Drop capabilities (--cap-drop=ALL --cap-add=NET_BIND_SERVICE)
Scan images (trivy image myapp:latest)
Pin base image versions (node:20.11-alpine, not node:latest)
```

---

## Docker Networking

```bash
# Bridge (default) — containers on same network
docker network create mynet
docker run --network mynet --name app myapp
docker run --network mynet --name db postgres

# Host — container uses host network
docker run --network host myapp

# None — no network
docker run --network none myapp
```

---

## Assessment

**Lab task (25 min):**

1. Write a Dockerfile for a simple app
2. Build the image
3. Run the container
4. Optimize with multi-stage build
5. Scan for vulnerabilities

**Grading:**
- Dockerfile correct: 20%
- Image built: 15%
- Container running: 15%
- Multi-stage build: 25%
- Vulnerability scan: 25%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO4 — Docker Containerization`
