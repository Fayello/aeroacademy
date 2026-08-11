#!/usr/bin/env python3
"""Add Nginx Mastery lessons 1-2."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

lessons = [
{
  "title": "Nginx Architecture", "order": 1, "lab": "nginxLab?.id",
  "content": "# Nginx Architecture\n\n### Learning Objectives\n- Understand the master-worker process model\n- Learn how Nginx handles concurrent connections\n- Configure worker processes and connection limits\n- Monitor Nginx process health and resource usage\n\n### Section 1: The Master-Worker Model\n\nNginx uses an event-driven, asynchronous architecture that differs fundamentally from traditional process-based web servers like Apache prefork model. At its core, Nginx employs a master-worker process hierarchy:\n\n**Master Process:** The master process runs as root and handles privileged operations including reading and validating configuration files, binding to privileged ports (80, 443), managing worker processes (start, stop, reload), opening log files, and handling signals (SIGHUP for reload, SIGTERM for shutdown).\n\n**Worker Processes:** Worker processes run as unprivileged users and handle actual request processing. Each worker is a single-threaded process that handles thousands of connections using an event-driven model.\n\n```bash\n# Check Nginx process hierarchy\nps aux | grep nginx\n# Output example:\n# root     1234  0.0  0.1  nginx: master process /usr/sbin/nginx\n# www-data 1235  0.0  0.2  nginx: worker process\n# www-data 1236  0.0  0.2  nginx: worker process\n```\n\n### Section 2: Event-Driven Processing\n\nUnlike thread-per-connection models, Nginx workers use epoll (Linux) or kqueue (BSD/macOS) to monitor file descriptors for events. This allows a single worker to handle 10,000+ concurrent connections:\n\n```nginx\n# /etc/nginx/nginx.conf\nworker_processes auto;       # Match CPU cores\nworker_rlimit_nofile 65535;  # Max open files per worker\n\nevents {\n    worker_connections 4096;  # Max connections per worker\n    multi_accept on;          # Accept multiple connections at once\n    use epoll;                # Linux event mechanism\n}\n```\n\n**Total concurrent connections = worker_processes x worker_connections**\n\n### Section 3: Connection Processing Pipeline\n\nWhen a request arrives, Nginx processes it through a defined pipeline:\n\n1. **Accept** — Worker accepts the connection from the listen socket\n2. **Read** — Request headers are read from the socket\n3. **Process** — Nginx matches the request to a location block, applies access controls, rewrites URIs\n4. **Generate** — Content is generated from static files or proxied to a backend\n5. **Send** — Response headers and body are written to the socket\n\nEach phase is non-blocking. If a phase would block (e.g., reading from a slow backend), the worker registers a callback and moves on to handle other connections.\n\n### Section 4: Key Configuration Directives\n\n```nginx\nworker_processes auto;           # Auto-detect CPU cores\nworker_cpu_affinity auto;        # Pin workers to cores\nworker_rlimit_nofile 65535;      # File descriptor limit\n\nevents {\n    worker_connections 4096;\n    multi_accept on;\n    use epoll;\n}\n\nhttp {\n    sendfile on;                 # Kernel-level file transfer\n    tcp_nopush on;               # Optimize packet sending\n    tcp_nodelay on;              # Disable Nagle algorithm\n    keepalive_timeout 65;        # Client keepalive\n    keepalive_requests 1000;     # Max requests per keepalive\n}\n```\n\n### Section 5: Monitoring and Status\n\n```nginx\n# Enable the stub_status module\nlocation /nginx_status {\n    stub_status;\n    allow 127.0.0.1;\n    deny all;\n}\n```\n\n```bash\n# View status output\ncurl http://localhost/nginx_status\n# Active connections: 291\n# server accepts handled requests\n#  16630948 16630948 31070465\n# Reading: 6 Writing: 179 Waiting: 106\n```\n\n### Hands-On Practice\n\n1. Install Nginx and inspect the process hierarchy with `ps aux | grep nginx`\n2. Edit `worker_processes` and reload with `nginx -s reload`\n3. Enable `stub_status` and verify with `curl`\n4. Run `ab -n 10000 -c 100 http://localhost/` to test concurrent connections\n5. Monitor with `watch -n1 'cat /proc/$(pgrep -o nginx)/limits'`\n\n### Key Takeaways\n- Nginx uses a master-worker process model with event-driven processing\n- Worker processes handle thousands of connections via epoll/kqueue\n- Total capacity equals worker_processes multiplied by worker_connections\n- The stub_status module provides runtime connection metrics\n- sendfile and tcp_nopush optimize static file delivery\n\n### References & Further Reading\n**Textbooks:**\n1. \"Mastering Nginx\" by Dimitri Aivaliotis — Chapter 2: Nginx Mechanics, pages 25-60\n2. \"Nginx Cookbook\" by Alex Crawford — Chapter 1: Basic Configuration, pages 1-20\n3. \"High Performance Browser Networking\" by Ilya Grigorik — Chapter 12: Optimizing for TLS\n\n**Online Resources:**\n1. [Nginx Official Documentation — Tuning](https://nginx.org/en/docs/ngx_core_module.html)\n2. [Nginx Architecture](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/)\n3. [Linux epoll man page](https://man7.org/linux/man-pages/man7/epoll.7.html)",
  "questions": [
    {"text": "What process model does Nginx use?", "answers": [
      {"text": "Thread-per-connection model", "isCorrect": False},
      {"text": "Master-worker event-driven model", "isCorrect": True},
      {"text": "Single-process model", "isCorrect": False},
      {"text": "Fork-per-request model", "isCorrect": False}
    ]},
    {"text": "Which system call does Nginx use on Linux for event notification?", "answers": [
      {"text": "select", "isCorrect": False},
      {"text": "poll", "isCorrect": False},
      {"text": "epoll", "isCorrect": True},
      {"text": "kqueue", "isCorrect": False}
    ]},
    {"text": "What does worker_cpu_affinity do?", "answers": [
      {"text": "Limits CPU usage per worker", "isCorrect": False},
      {"text": "Pins workers to specific CPU cores", "isCorrect": True},
      {"text": "Sets CPU priority for workers", "isCorrect": False},
      {"text": "Enables CPU load balancing", "isCorrect": False}
    ]},
    {"text": "How do you calculate maximum concurrent connections?", "answers": [
      {"text": "worker_connections only", "isCorrect": False},
      {"text": "worker_processes + worker_connections", "isCorrect": False},
      {"text": "worker_processes x worker_connections", "isCorrect": True},
      {"text": "worker_processes x worker_rlimit_nofile", "isCorrect": False}
    ]},
    {"text": "What signal triggers a graceful reload of Nginx?", "answers": [
      {"text": "SIGTERM", "isCorrect": False},
      {"text": "SIGQUIT", "isCorrect": False},
      {"text": "SIGHUP", "isCorrect": True},
      {"text": "SIGUSR1", "isCorrect": False}
    ]},
    {"text": "Which directive enables efficient file transfers?", "answers": [
      {"text": "directio on", "isCorrect": False},
      {"text": "sendfile on", "isCorrect": True},
      {"text": "aio on", "isCorrect": False},
      {"text": "tcp_nodelay on", "isCorrect": False}
    ]},
    {"text": "What is the purpose of the stub_status module?", "answers": [
      {"text": "Enable SSL termination", "isCorrect": False},
      {"text": "Provide runtime statistics", "isCorrect": True},
      {"text": "Load balance requests", "isCorrect": False},
      {"text": "Cache static files", "isCorrect": False}
    ]}
  ]
},
{
  "title": "Virtual Hosts & SSL", "order": 2, "lab": "nginxLab?.id",
  "content": "# Virtual Hosts & SSL Configuration\n\n### Learning Objectives\n- Configure server blocks to host multiple domains\n- Set up Let's Encrypt SSL certificates with auto-renewal\n- Implement HTTP to HTTPS redirects\n- Configure OCSP stapling and SSL session caching\n\n### Section 1: Server Blocks (Virtual Hosts)\n\nNginx uses \"server blocks\" instead of Apache VirtualHost directives:\n\n```nginx\n# /etc/nginx/sites-available/example.com\nserver {\n    listen 80;\n    server_name example.com www.example.com;\n    root /var/www/example.com/html;\n    index index.html index.htm;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n\n    error_page 404 /404.html;\n    error_page 500 502 503 504 /50x.html;\n}\n\n# Enable the site\nsudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/\nsudo nginx -t && sudo systemctl reload nginx\n```\n\n### Section 2: SSL Certificate Setup with Let's Encrypt\n\n```bash\n# Install Certbot\nsudo apt install certbot python3-certbot-nginx\n\n# Obtain certificate (auto-configures Nginx)\nsudo certbot --nginx -d example.com -d www.example.com\n\n# Manual certificate request\nsudo certbot certonly --webroot -w /var/www/example.com/html -d example.com\n\n# Certificates stored in:\nls /etc/letsencrypt/live/example.com/\n# cert.pem, chain.pem, fullchain.pem, privkey.pem\n```\n\n### Section 3: Complete SSL Configuration\n\n```nginx\nserver {\n    listen 443 ssl http2;\n    server_name example.com www.example.com;\n\n    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;\n\n    ssl_protocols TLSv1.2 TLSv1.3;\n    ssl_prefer_server_ciphers on;\n    ssl_session_timeout 1d;\n    ssl_session_cache shared:SSL:50m;\n    ssl_session_tickets off;\n\n    ssl_stapling on;\n    ssl_stapling_verify on;\n    resolver 8.8.8.8 8.8.4.4 valid=300s;\n\n    add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains\" always;\n    add_header X-Frame-Options DENY always;\n    add_header X-Content-Type-Options nosniff always;\n}\n\n# HTTP to HTTPS redirect\nserver {\n    listen 80;\n    server_name example.com www.example.com;\n    return 301 https://$host$request_uri;\n}\n```\n\n### Section 4: Auto-Renewal\n\n```bash\n# Test renewal\nsudo certbot renew --dry-run\n\n# Check timer\nsystemctl status certbot.timer\n\n# Manual renewal\nsudo certbot renew\n```\n\n### Hands-On Practice\n\n1. Create a server block for a test domain\n2. Use Certbot to obtain a certificate\n3. Verify SSL with `openssl s_client -connect localhost:443`\n4. Test auto-renewal with `certbot renew --dry-run`\n\n### Key Takeaways\n- Server blocks define virtual hosts in Nginx\n- Let's Encrypt provides free SSL certificates\n- SSL should use only TLSv1.2 and TLSv1.3\n- OCSP stapling and session caching improve performance\n- HSTS headers protect against downgrade attacks\n\n### References & Further Reading\n1. \"Nginx Cookbook\" by Alex Crawford — Chapter 5: SSL/TLS\n2. [Nginx SSL Documentation](https://nginx.org/en/docs/http/configuring_https_servers.html)\n3. [Let's Encrypt Documentation](https://letsencrypt.org/docs/)\n4. [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)",
  "questions": [
    {"text": "What directive defines a virtual host in Nginx?", "answers": [
      {"text": "VirtualHost", "isCorrect": False},
      {"text": "server", "isCorrect": True},
      {"text": "host", "isCorrect": False},
      {"text": "vhost", "isCorrect": False}
    ]},
    {"text": "Which SSL protocols should be enabled in production?", "answers": [
      {"text": "SSLv3, TLSv1.0, TLSv1.1", "isCorrect": False},
      {"text": "TLSv1.0, TLSv1.1, TLSv1.2", "isCorrect": False},
      {"text": "TLSv1.2, TLSv1.3 only", "isCorrect": True},
      {"text": "TLSv1.3 only", "isCorrect": False}
    ]},
    {"text": "What does OCSP stapling improve?", "answers": [
      {"text": "Certificate encryption strength", "isCorrect": False},
      {"text": "SSL handshake performance", "isCorrect": True},
      {"text": "Key exchange security", "isCorrect": False},
      {"text": "Certificate renewal speed", "isCorrect": False}
    ]},
    {"text": "What header prevents clickjacking attacks?", "answers": [
      {"text": "X-XSS-Protection", "isCorrect": False},
      {"text": "X-Content-Type-Options", "isCorrect": False},
      {"text": "X-Frame-Options", "isCorrect": True},
      {"text": "Content-Security-Policy", "isCorrect": False}
    ]},
    {"text": "How do you redirect HTTP to HTTPS in Nginx?", "answers": [
      {"text": "return 301 https://$host$request_uri;", "isCorrect": True},
      {"text": "rewrite ^ https://$host$request_uri;", "isCorrect": False},
      {"text": "proxy_pass https://$host;", "isCorrect": False},
      {"text": "redirect https://$host;", "isCorrect": False}
    ]},
    {"text": "What is the purpose of ssl_session_cache?", "answers": [
      {"text": "Store SSL certificates", "isCorrect": False},
      {"text": "Cache SSL session parameters for reuse", "isCorrect": True},
      {"text": "Encrypt session cookies", "isCorrect": False},
      {"text": "Manage SSL certificate revocation", "isCorrect": False}
    ]},
    {"text": "Which command obtains a certificate using DNS validation?", "answers": [
      {"text": "certbot --nginx", "isCorrect": False},
      {"text": "certbot certonly --webroot", "isCorrect": False},
      {"text": "certbot certonly --manual --preferred-challenges dns", "isCorrect": True},
      {"text": "certbot --apache", "isCorrect": False}
    ]}
  ]
}
]

data["courses"][0]["sections"][0]["lessons"] = lessons

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"Added {len(lessons)} lessons to Course 3 Section 1")
