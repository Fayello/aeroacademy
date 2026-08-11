#!/usr/bin/env python3
"""Add Alternative Web Servers lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Alternative Web Servers

### Learning Objectives
- Compare Caddy, HAProxy, and Traefik as web server alternatives
- Understand when to use each server
- Configure automatic HTTPS with Caddy
- Set up HAProxy for TCP/HTTP load balancing

### Section 1: Caddy

Caddy is a modern web server with automatic HTTPS via Let's Encrypt:

```caddy
# Caddyfile
example.com {
    root * /var/www/html
    file_server
    encode gzip

    tls {
        protocols tls1.2 tls1.3
    }

    log {
        output file /var/log/caddy/access.log
    }
}

api.example.com {
    reverse_proxy localhost:3000
}
```

**Caddy vs Nginx:**
- Caddy automatically obtains and renews SSL certificates
- Caddy uses a simpler configuration syntax
- Nginx has better performance under extreme load
- Nginx has a larger module ecosystem

### Section 2: HAProxy

HAProxy specializes in load balancing and proxying:

```haproxy
# /etc/haproxy/haproxy.cfg
global
    maxconn 50000
    log /dev/log local0

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s

frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/example.pem
    redirect scheme https if !{ ssl_fc }
    default_backend web_servers

backend web_servers
    balance roundrobin
    option httpchk GET /health
    server web1 10.0.0.1:8080 check
    server web2 10.0.0.2:8080 check
    server web3 10.0.0.3:8080 check backup

listen stats
    bind *:8404
    stats enable
    stats uri /stats
```

### Section 3: Traefik

Traefik is designed for containerized environments:

```yaml
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    exposedByDefault: false
```

### Section 4: Comparison Matrix

| Feature | Nginx | Apache | Caddy | HAProxy | Traefik |
|---------|-------|--------|-------|---------|--------|
| Performance | Excellent | Good | Good | Excellent | Good |
| Auto HTTPS | No | No | Yes | No | Yes |
| Config Simplicity | Medium | Complex | Simple | Medium | Simple |
| Container Support | Good | Poor | Good | Good | Excellent |
| Load Balancing | Good | Limited | Basic | Excellent | Good |

### Key Takeaways
- Caddy provides automatic HTTPS with zero configuration
- HAProxy excels at load balancing with health checks
- Traefik integrates natively with Docker and Kubernetes
- Choose the right tool based on your specific use case

### References
1. [Caddy Documentation](https://caddyserver.com/docs/)
2. [HAProxy Configuration Manual](https://www.haproxy.org/#docs)
3. [Traefik Documentation](https://doc.traefik.io/traefik/)"""

questions = [
    {"text": "Which web server automatically obtains SSL certificates?", "answers": [
        {"text": "Nginx", "isCorrect": False},
        {"text": "Apache", "isCorrect": False},
        {"text": "Caddy", "isCorrect": True},
        {"text": "LiteSpeed", "isCorrect": False}
    ]},
    {"text": "What is HAProxy primarily designed for?", "answers": [
        {"text": "Serving static files", "isCorrect": False},
        {"text": "Load balancing and reverse proxying", "isCorrect": True},
        {"text": "Running PHP applications", "isCorrect": False},
        {"text": "Managing DNS records", "isCorrect": False}
    ]},
    {"text": "Which server is best for Docker and Kubernetes environments?", "answers": [
        {"text": "Nginx", "isCorrect": False},
        {"text": "Apache", "isCorrect": False},
        {"text": "Lighttpd", "isCorrect": False},
        {"text": "Traefik", "isCorrect": True}
    ]},
    {"text": "What configuration file does Caddy use?", "answers": [
        {"text": "nginx.conf", "isCorrect": False},
        {"text": "httpd.conf", "isCorrect": False},
        {"text": "Caddyfile", "isCorrect": True},
        {"text": "caddy.yml", "isCorrect": False}
    ]},
    {"text": "What does HAProxy httpchk option do?", "answers": [
        {"text": "Checks HTTP headers", "isCorrect": False},
        {"text": "Performs HTTP health checks on backends", "isCorrect": True},
        {"text": "Validates HTTP requests", "isCorrect": False},
        {"text": "Enables HTTP logging", "isCorrect": False}
    ]},
    {"text": "Why choose Nginx over Caddy in production?", "answers": [
        {"text": "Caddy cannot handle HTTPS", "isCorrect": False},
        {"text": "Nginx has better performance at scale and more modules", "isCorrect": True},
        {"text": "Caddy does not support Linux", "isCorrect": False},
        {"text": "Nginx is simpler to configure", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Alternative Web Servers", "order": 2, "lab": "undefined",
    "content": content, "questions": questions
}
data["courses"][0]["sections"][1]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Alternative Web Servers lesson")
