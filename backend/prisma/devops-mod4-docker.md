# Module 4 — Containerization with Docker

## Why Containers Exist

Before containers, deploying software meant "it works on my machine." The developer ran the application on their laptop with their specific OS version, their specific library versions, and their specific configuration. When it got to the server, something was different. Maybe the server ran a different version of glibc. Maybe a required library was missing. Maybe the file paths were different. The result was hours of debugging deployment issues that had nothing to do with the code.

Virtual machines solved the "works on my machine" problem by packaging the entire operating system. You could run the same VM on any hypervisor and get identical behavior. But VMs are heavy. A typical VM might be 5-10 GB, take minutes to boot, and consume significant memory just for the OS kernel.

Containers solve the same problem differently. Instead of packaging the entire OS, containers share the host OS kernel and package only the application and its dependencies. A container might be 50 MB instead of 5 GB. It starts in seconds instead of minutes. Multiple containers share the same kernel, reducing memory overhead.

Docker made containers mainstream. Before Docker, Linux containers (LXC, LXD) existed but were difficult to use. Docker provided a simple API, a clean CLI, and an image format that made containers portable across environments. The Docker image format is the key innovation: a layered filesystem that can be versioned, shared, and composed.

## Dockerfile Best Practices

A Dockerfile is a build script for creating Docker images. Every line in a Dockerfile creates a layer in the image. Layers are cached and reused, so the order of instructions matters for build speed.

### Bad Dockerfile

```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

This Dockerfile has several problems:

1. `COPY . .` copies everything, including `node_modules`, `.git`, test files, and anything else in the directory. This wastes space and makes builds slower.
2. `npm install` installs all dependencies, including devDependencies that are not needed in production.
3. Every code change invalidates the `npm install` cache because `COPY . .` comes before it.
4. The base image `node:20` is 1 GB. It includes the full Debian OS, compilers, and tools you do not need in production.

### Good Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

This Dockerfile uses a multi-stage build. The first stage (`builder`) installs dependencies, compiles the application, and produces the build artifacts. The second stage copies only the artifacts into a clean image. The result is a production image that does not contain source code, build tools, or devDependencies.

Key improvements:
1. `COPY package*.json ./` copies only the package files, not the entire directory.
2. `npm ci --only=production` installs only production dependencies.
3. `npm ci` instead of `npm install` for deterministic builds from the lockfile.
4. Multi-stage build reduces image size significantly.
5. `node:20-alpine` (50 MB) instead of `node:20` (1 GB).
6. Non-root user `appuser` for security.

## Multi-Stage Builds Explained

Multi-stage builds are the most important Dockerfile optimization. They allow you to use multiple images in a single Dockerfile, copying only what you need from each stage.

The pattern is simple: use a large image with build tools for compilation, then copy the compiled artifacts into a small image for production.

```dockerfile
# Stage 1: Build
FROM golang:1.21 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Stage 2: Production
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
USER nobody:nobody
EXPOSE 8080
CMD ["./server"]
```

The builder stage uses `golang:1.21` (800 MB) which includes the Go compiler and all build tools. It compiles the application into a static binary. The production stage uses `alpine:3.19` (7 MB) which has nothing except the Alpine Linux base. The final image is about 15 MB instead of 800 MB.

For Python applications, the pattern is similar:

```dockerfile
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt
COPY . .
RUN python -m py_compile main.py

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app
ENV PATH=/root/.local/bin:$PATH
USER nobody
EXPOSE 8000
CMD ["python", "main.py"]
```

For Java applications, multi-stage builds are even more valuable because the JDK is large and Maven/Gradle build processes are complex:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER nobody
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

The build stage uses the full JDK (600 MB) with Maven. The production stage uses only the JRE (100 MB). The final image is a fraction of the size of a single-stage build.

## Image Optimization

### Alpine Base Images

Alpine Linux is a minimal Linux distribution. The Alpine base image is about 7 MB compared to 100+ MB for Debian-based images. Using Alpine as the base for your production image reduces image size dramatically.

```dockerfile
# Debian-based: ~900 MB
FROM node:20

# Alpine-based: ~170 MB
FROM node:20-alpine

# Slim Debian-based: ~250 MB
FROM node:20-slim
```

The trade-off is that Alpine uses musl libc instead of glibc. Some compiled libraries have compatibility issues with musl. If your application uses native modules (like `bcrypt` or `sharp`), test thoroughly on Alpine before switching.

### Layer Ordering

Docker caches layers. If a layer has not changed, Docker uses the cached version. The key is to put infrequently changing layers first and frequently changing layers last.

```dockerfile
# Good: dependencies change less often than source code
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Bad: source code changes invalidate the dependency cache
COPY . .
RUN npm ci
RUN npm run build
```

In the "good" example, changing a source file only invalidates the `COPY . .` and `npm run build` layers. The `npm ci` layer is cached. In the "bad" example, changing any source file invalidates everything after the first `COPY . .`.

### .dockerignore

The `.dockerignore` file tells Docker which files to exclude from the build context. This reduces the context size and prevents sensitive files from being included in the image.

```
node_modules
.git
.env
.env.*
*.log
dist
build
coverage
.github
.vscode
.idea
docker-compose*.yml
README.md
```

Without `.dockerignore`, the entire directory (including `node_modules` with thousands of files) gets sent to the Docker daemon. This wastes time and can cause cache invalidation.

## Container Security

Running containers as root is a security risk. If an attacker escapes the container, they have root access on the host. The principle of least privilege applies: containers should run with the minimum permissions necessary.

### Non-Root User

```dockerfile
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser
```

The `USER` instruction switches to a non-root user. The application runs as `appuser` instead of `root`. If the container is compromised, the attacker has limited permissions.

### Read-Only Filesystem

```dockerfile
FROM node:20-alpine
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser
```

```bash
docker run --read-only --tmpfs /tmp my-app
```

The `--read-only` flag makes the container filesystem read-only. The `--tmpfs /tmp` flag creates a writable tmpfs mount for temporary files. This prevents attackers from modifying application files or writing malicious scripts.

### Drop Capabilities

Linux capabilities give processes specific privileges. Docker grants containers a subset of capabilities, but many are unnecessary.

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE my-app
```

This drops all capabilities and adds only the capability to bind to low ports. The container cannot mount filesystems, change system time, or perform other privileged operations.

### Scan for Vulnerabilities

Every Docker image should be scanned for vulnerabilities before deployment:

```bash
# Using Trivy
trivy image my-app:latest

# Using Grype
grype my-app:latest
```

Both tools check the image layers against vulnerability databases. They report CVEs with severity levels. Integrate scanning into your CI pipeline to catch vulnerabilities before images reach production.

### Image Tagging Strategies

How you tag images matters. Bad tags (`latest`, `v1`, `test`) make it impossible to know which version is deployed. Good tags (`1.0.0`, `1.0.1-rc.1`, `commit-sha`) make rollback and debugging straightforward.

Common tagging strategies:

**Semantic versioning:** `myapp:1.0.0`, `myapp:1.0.1`, `myapp:2.0.0`
- Follows semver.org conventions
- Users know what changed (major = breaking, minor = feature, patch = fix)
- Easy to roll back to a specific version

**Git SHA:** `myapp:abc1234`
- Ties the image to a specific commit
- Useful for debugging ("which code is running?")
- Harder to read but unambiguous

**Branch-based:** `myapp:main`, `myapp:develop`, `myapp:feature-auth`
- Useful for development images
- Not suitable for production (branches can be deleted)

**Timestamp:** `myapp:20240101-143022`
- When semver is too rigid
- Useful for nightly builds
- Hard to roll back (which timestamp is "older"?)

The best practice for production: use semantic versioning for releases and git SHA for development builds. Tag the latest release as `latest` only if it is actually the latest stable version.

## Docker Networking

Docker creates virtual networks for containers to communicate. Understanding the network modes is essential for debugging connectivity issues.

### Bridge Network (Default)

Bridge networking creates a private network on the host. Containers on the same bridge network can communicate with each other. Containers on different bridge networks cannot.

```bash
# Create a custom bridge network
docker network create app-network

# Run containers on the network
docker run --network app-network --name postgres postgres:15-alpine
docker run --network app-network --name redis redis:7-alpine
docker run --network app-network --name app my-app

# Containers can reach each other by name
# app can connect to postgres at "postgres:5432"
# app can connect to redis at "redis:6379"
```

Bridge networking is the default and works for most use cases. Containers get their own IP addresses and can communicate with each other using container names as hostnames.

### Host Network

Host networking removes the network isolation. The container shares the host's network stack. There is no port mapping — the container listens directly on the host's interfaces.

```bash
docker run --network host my-app
```

Host networking is faster (no NAT overhead) but reduces isolation. The container can access all host network interfaces and ports. Use it only when network performance is critical and you trust the container.

### None Network

None networking disables all networking. The container has only a loopback interface.

```bash
docker run --network none my-app
```

None networking is useful for batch processing or security-sensitive workloads that do not need network access.

## Volume Management

Containers are ephemeral. When a container is removed, its filesystem is lost. Volumes persist data beyond the container's lifecycle.

### Bind Mounts

Bind mounts map a host directory into the container. Changes on either side are immediately visible.

```bash
docker run -v /host/path:/container/path my-app

# Or with --mount for more explicit syntax
docker run --mount type=bind,source=/host/path,target=/container/path my-app
```

Bind mounts are useful for development because you can edit files on the host and see changes in the container immediately. They are not suitable for production because they depend on the host's directory structure.

### Named Volumes

Named volumes are managed by Docker. They persist data and can be shared between containers.

```bash
# Create a named volume
docker volume create postgres-data

# Use the named volume
docker run -v postgres-data:/var/lib/postgresql/data postgres:15-alpine

# List volumes
docker volume ls

# Inspect a volume
docker volume inspect postgres-data
```

Named volumes are the preferred way to persist data in production. They are portable (not dependent on host paths) and can be backed up, moved, and restored.

### Docker Compose Volumes

In Docker Compose, volumes are defined in the `docker-compose.yml` file:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secret

volumes:
  postgres-data:
```

The `volumes` section at the bottom defines named volumes. The `volumes` section in the service definition maps the named volume to a path in the container.

## Docker Compose for Development vs Production

Docker Compose is a tool for defining and running multi-container applications. A single `docker-compose.yml` file defines all services, networks, and volumes.

### Development Configuration

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:secret@postgres:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres-data:
```

This configuration is optimized for development:
- Source code is bind-mounted for live reload
- Ports are exposed to the host for direct access
- Database and cache are local for fast iteration
- The `.dev` Dockerfile includes hot-reload tools

### Production Configuration

```yaml
services:
  app:
    image: ghcr.io/myorg/myapp:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:secret@postgres:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 1G
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
```

This configuration is optimized for production:
- Uses a pre-built image from a registry (not build from source)
- No bind mounts (ephemeral container filesystem)
- Resource limits to prevent runaway containers
- `restart: unless-stopped` for automatic recovery
- Ports not exposed to the host (use a reverse proxy)
- Named volumes for data persistence

## Real Story: Reducing Image Size from 1.2 GB to 45 MB

A team was deploying a Python web application. Their Docker image was 1.2 GB. Pushing the image to the registry took 3 minutes. Pulling the image on the server took 5 minutes. Cold starts took 2 minutes. Every deployment was slow because of image transfer time.

The Dockerfile looked like this:

```dockerfile
FROM python:3.12
WORKDIR /app
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    vim \
    git \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

The analysis revealed several issues:

1. **Full Python image (900 MB)**: The `python:3.12` image includes the full Debian OS, compilers, and development tools. The application only needs the Python runtime.

2. **Development tools (100 MB)**: `gcc`, `libpq-dev`, `curl`, `vim`, and `git` are useful for development but unnecessary in production. They were installed because some Python packages required compilation during installation.

3. **All pip packages (150 MB)**: The `requirements.txt` included development packages like `pytest`, `black`, and `flake8` that are not needed in production.

4. **Source code in the image**: `COPY . .` copied the entire application directory, including tests, documentation, and configuration files.

The optimization process:

**Step 1: Switch to Alpine base**

```dockerfile
FROM python:3.12-alpine
```

This alone reduced the base image from 900 MB to 50 MB. Alpine uses musl libc instead of glibc, but the Python application did not use any glibc-specific features.

**Step 2: Create a requirements file for production**

```
# requirements-prod.txt
fastapi==0.109.0
uvicorn==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
redis==5.0.1
pydantic==2.5.3
```

This excluded development packages (`pytest`, `black`, `flake8`) from the production image.

**Step 3: Use multi-stage build**

```dockerfile
FROM python:3.12-alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc libpq-dev musl-dev
COPY requirements-prod.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements-prod.txt

FROM python:3.12-alpine
WORKDIR /app
RUN apk add --no-cache libpq musl
COPY --from=builder /install /usr/local
COPY src ./src
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

The builder stage installed compilation tools and built the pip packages. The production stage copied only the compiled packages and the application source code. No compilers, no development tools, no unnecessary files.

**Step 4: Add .dockerignore**

```
.git
.github
.vscode
__pycache__
*.pyc
.pytest_cache
htmlcov
.coverage
*.egg-info
dist
build
tests
docs
docker-compose*.yml
```

This excluded test files, documentation, and build artifacts from the Docker context.

The final image was 45 MB. Pushing to the registry took 8 seconds instead of 3 minutes. Pulling on the server took 12 seconds instead of 5 minutes. Cold starts took 3 seconds instead of 2 minutes. The deployment pipeline went from 15 minutes to 3 minutes.

The lesson: image optimization is not about clever tricks. It is about removing what you do not need. Every layer, every package, every file in the image adds size. Question every addition.

## Docker for Development vs Production

Docker is useful for both development and production, but the configurations differ significantly.

**Development** prioritizes developer experience: fast rebuilds, live code reloading, and easy debugging. Bind mounts let developers edit code on their host machine and see changes immediately in the container. Exposed ports allow direct access to databases and services for debugging.

**Production** prioritizes security, reliability, and performance: no bind mounts, no exposed internal ports, resource limits, restart policies, and health checks. The application is baked into the image during build time — no code changes at runtime.

The `target` argument in multi-stage builds supports this separation:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npm run build
USER node
CMD ["node", "dist/index.js"]
```

Build the development target for local work and the production target for deployment:

```bash
# Development
docker build --target development -t myapp:dev .

# Production
docker build --target production -t myapp:prod .
```

The development image includes devDependencies and hot-reload tools. The production image includes only the compiled application and production dependencies. Same Dockerfile, different outputs.

## Assessment

**Lab Task 1: Dockerfile Optimization (60 minutes)**

Given a Dockerfile that produces a 500+ MB image, optimize it to produce an image under 100 MB without breaking the application. The application is a Node.js web server with PostgreSQL and Redis dependencies.

Requirements:
1. Use multi-stage build
2. Use Alpine base image
3. Run as non-root user
4. Include a .dockerignore file
5. Document the before/after image sizes

Grading criteria: Image under 100 MB (30%), application still works (25%), multi-stage build used correctly (20%), non-root user (15%), documentation (10%).

**Lab Task 2: Container Security Hardening (45 minutes)**

Take a working Docker image and harden it:
1. Run as non-root user
2. Make filesystem read-only (with tmpfs for temp files)
3. Drop all capabilities except necessary ones
4. Add health check instruction
5. Scan the image and fix any HIGH or CRITICAL vulnerabilities

Document each security improvement and explain why it matters.

Grading criteria: All 5 hardening steps applied (50%), application still works (20%), explanation of each improvement (20%), vulnerability scan shows no HIGH/CRITICAL (10%).

**Lab Task 3: Docker Networking Lab (45 minutes)**

Create a Docker network with three containers:
1. A PostgreSQL container
2. A Redis container
3. A Node.js application that connects to both

Demonstrate:
1. Containers can communicate using container names
2. Only necessary ports are exposed to the host
3. Containers on different networks are isolated

Document the network configuration and explain how Docker DNS resolution works.

Grading criteria: All containers communicate correctly (35%), network isolation demonstrated (25%), port exposure is minimal (20%), documentation explains Docker networking (20%).

**Lab Task 4: Development vs Production Setup (60 minutes)**

Create two Docker Compose configurations for the same application:
1. A development configuration with hot reload, exposed ports, and local databases
2. A production configuration with resource limits, named volumes, and no exposed database ports

Demonstrate that both configurations work and explain the differences.

Grading criteria: Development config works (25%), production config works (25%), meaningful differences between configs (25%), documentation explains trade-offs (25%).

## Evidence

Docker's layered filesystem architecture is based on UnionFS (specifically OverlayFS in modern kernels). The layer caching mechanism is documented in Docker's official documentation. The multi-stage build feature was introduced in Docker 17.05 and is documented in the Dockerfile reference.

The optimization from 1.2 GB to 45 MB is based on common patterns observed when optimizing Docker images for production. The specific techniques (Alpine base, multi-stage builds, .dockerignore, dependency separation) are well-documented in Docker best practices guides and have been applied across thousands of production applications.

Container security best practices (non-root user, read-only filesystem, capability dropping, vulnerability scanning) are documented in the CIS Docker Benchmark, which is the industry standard for Docker security. The OWASP Docker Security Cheat Sheet provides additional guidance.

Docker networking modes (bridge, host, none) are documented in Docker's official documentation. The bridge network is the default and uses the Docker bridge driver, which provides DNS resolution between containers using the embedded DNS server (127.0.0.11).

The Docker Compose examples follow the Compose Specification, which is the standard for defining multi-container applications. The `depends_on` with `condition: service_healthy` ensures that dependent services are ready before the application starts, preventing startup failures due to unavailable dependencies.