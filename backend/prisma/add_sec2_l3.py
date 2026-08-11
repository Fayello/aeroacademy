#!/usr/bin/env python3
"""Add Containerized Web Deployment lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Containerized Web Deployment

### Learning Objectives
- Deploy web applications using Docker containers
- Configure Nginx as a Docker reverse proxy
- Use Docker Compose for multi-container deployments
- Implement container health checks and restart policies

### Section 1: Docker Basics for Web Servers

```bash
# Pull and run Nginx
docker pull nginx:latest
docker run -d --name web -p 80:80 -p 443:443 \\
    -v /etc/nginx/conf.d:/etc/nginx/conf.d \\
    -v /var/www/html:/usr/share/nginx/html \\
    nginx:latest

# Run a Node.js app
docker run -d --name api -p 3000:3000 \\
    -e NODE_ENV=production \\
    myapp:latest
```

### Section 2: Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certs:/etc/nginx/certs
      - ./www:/var/www/html
    depends_on:
      - api
      - app
    restart: always

  api:
    build: ./api
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    restart: always

  app:
    build: ./frontend
    restart: always

  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
    restart: always

volumes:
  pgdata:
```

### Section 3: Nginx Docker Configuration

```nginx
# nginx/conf.d/default.conf
upstream api_backend {
    server api:3000;
}

upstream frontend {
    server app:8080;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://api_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Section 4: Health Checks and Restart Policies

```yaml
services:
  api:
    build: ./api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  nginx:
    image: nginx:latest
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
```

### Key Takeaways
- Docker provides consistent deployment across environments
- Docker Compose simplifies multi-container orchestration
- Use volumes for persistent data and configuration files
- Health checks ensure containers are running properly
- Restart policies handle automatic recovery from failures

### References
1. [Docker Documentation](https://docs.docker.com/)
2. [Docker Compose Specification](https://docs.docker.com/compose/)
3. [Nginx Docker Hub](https://hub.docker.com/_/nginx/)"""

questions = [
    {"text": "What Docker flag maps container ports to host ports?", "answers": [
        {"text": "-v", "isCorrect": False},
        {"text": "-p", "isCorrect": True},
        {"text": "--expose", "isCorrect": False},
        {"text": "--link", "isCorrect": False}
    ]},
    {"text": "What Docker Compose directive defines service dependencies?", "answers": [
        {"text": "links", "isCorrect": False},
        {"text": "depends_on", "isCorrect": True},
        {"text": "requires", "isCorrect": False},
        {"text": "needs", "isCorrect": False}
    ]},
    {"text": "What does the restart: unless-stopped policy do?", "answers": [
        {"text": "Never restarts containers", "isCorrect": False},
        {"text": "Restarts containers unless manually stopped", "isCorrect": True},
        {"text": "Always restarts containers", "isCorrect": False},
        {"text": "Restarts only on system reboot", "isCorrect": False}
    ]},
    {"text": "What is the purpose of Docker volumes?", "answers": [
        {"text": "Increase CPU allocation", "isCorrect": False},
        {"text": "Persist data beyond container lifecycle", "isCorrect": True},
        {"text": "Enable networking between containers", "isCorrect": False},
        {"text": "Build container images", "isCorrect": False}
    ]},
    {"text": "In Docker Compose, how do services reference other containers by name?", "answers": [
        {"text": "By IP address", "isCorrect": False},
        {"text": "By service name as hostname", "isCorrect": True},
        {"text": "By container ID", "isCorrect": False},
        {"text": "By environment variable", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Containerized Web Deployment", "order": 3, "lab": "undefined",
    "content": content, "questions": questions
}
data["courses"][0]["sections"][1]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Containerized Web Deployment lesson")
