#!/usr/bin/env python3
"""Add Node.js Application Deployment lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Node.js Application Deployment

### Learning Objectives
- Deploy Node.js applications behind Nginx
- Configure PM2 process manager for production
- Set up environment variables and secrets management
- Implement logging and monitoring

### Section 1: Deployment Architecture

```
Client -> Nginx (port 80/443) -> Node.js (port 3000) -> Database
```

Nginx handles SSL termination, static files, load balancing, and rate limiting while Node.js focuses on application logic.

### Section 2: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start app.js --name "myapi" -i max

# Cluster mode (one process per CPU core)
pm2 start app.js --name "myapi" --instances max --exec-mode cluster

# Save and restore
pm2 save
pm2 startup

# Monitor
pm2 monit
pm2 logs myapi
pm2 status
```

### Section 3: Nginx Configuration for Node.js

```nginx
upstream node_backend {
    least_conn;
    server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://node_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /static/ {
        alias /var/www/myapp/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Section 4: Environment Variables

```bash
# .env file (never commit to git)
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
JWT_SECRET=your-secret-key

# Load with dotenv
require('dotenv').config();
```

### Section 5: Logging with Winston

```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/log/myapp/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/myapp/combined.log' }),
  ],
});
```

### Key Takeaways
- Use PM2 in cluster mode for multi-core utilization
- Let Nginx handle SSL, rate limiting, and static files
- Always use environment variables for secrets
- Implement structured logging for debugging and monitoring
- Configure keepalive connections between Nginx and Node.js

### References
1. [PM2 Documentation](https://pm2.keymetrics.io/docs/)
2. [Nginx Proxy Configuration](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
3. [Node.js Production Best Practices](https://github.com/goldbergyoni/nodebestpractices)"""

questions = [
    {"text": "What does PM2 cluster mode do?", "answers": [
        {"text": "Runs multiple Node.js instances on different machines", "isCorrect": False},
        {"text": "Runs one process per CPU core", "isCorrect": True},
        {"text": "Creates a backup of the application", "isCorrect": False},
        {"text": "Monitors application health", "isCorrect": False}
    ]},
    {"text": "Why should Nginx handle SSL instead of Node.js?", "answers": [
        {"text": "Node.js cannot handle SSL", "isCorrect": False},
        {"text": "Nginx is optimized for SSL termination and performs better", "isCorrect": True},
        {"text": "SSL requires root privileges only Nginx has", "isCorrect": False},
        {"text": "There is no difference", "isCorrect": False}
    ]},
    {"text": "What does the pm2 save command do?", "answers": [
        {"text": "Saves application code", "isCorrect": False},
        {"text": "Saves the process list for automatic restart", "isCorrect": True},
        {"text": "Creates a database backup", "isCorrect": False},
        {"text": "Saves environment variables", "isCorrect": False}
    ]},
    {"text": "What is the purpose of proxy_http_version 1.1 in Nginx?", "answers": [
        {"text": "Enables HTTP/2", "isCorrect": False},
        {"text": "Required for keepalive connections to upstream", "isCorrect": True},
        {"text": "Forces clients to use HTTP/1.1", "isCorrect": False},
        {"text": "Enables WebSocket support", "isCorrect": False}
    ]},
    {"text": "Where should secrets like JWT_SECRET be stored?", "answers": [
        {"text": "In the source code", "isCorrect": False},
        {"text": "In environment variables", "isCorrect": True},
        {"text": "In the Nginx configuration", "isCorrect": False},
        {"text": "In the database", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Node.js Application Deployment", "order": 1, "lab": "undefined",
    "content": content, "questions": questions
}
data["courses"][0]["sections"][2]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Node.js Application Deployment lesson")
