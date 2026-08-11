import { PrismaClient } from '@prisma/client';

export async function seedLinuxCoursesPart2(prisma: PrismaClient, labs: any[]) {
  console.log('Seeding Linux courses (Part 2)...');

  const nginxLab = labs[6];
  const storageLab = labs[7];
  const netSecLab = labs[14];

  async function createCourseWithQuizzes(
    title: string, description: string,
    sectionsData: Array<{
      title: string; order: number;
      lessons: Array<{
        title: string; order: number; labId?: string; content: string;
        questions: Array<{ text: string; answers: Array<{ text: string; isCorrect: boolean }> }>
      }>
    }>
  ) {
    const course = await prisma.course.create({
      data: {
        title, description,
        sections: {
          create: sectionsData.map(s => ({
            title: s.title, order: s.order,
            lessons: {
              create: s.lessons.map(les => ({
                title: les.title, order: les.order, labId: les.labId, content: les.content,
              })),
            },
          })),
        },
      },
    });
    const allLessons = await prisma.lesson.findMany({ where: { section: { courseId: course.id } } });
    for (const lesson of allLessons) {
      const sectionData = sectionsData.find(s => s.lessons.some(l => l.title === lesson.title));
      const lessonData = sectionData?.lessons.find(l => l.title === lesson.title);
      if (lessonData && lessonData.questions.length > 0) {
        await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            questions: { create: lessonData.questions.map(q => ({ text: q.text, answers: { create: q.answers } })) },
          },
        });
      }
    }
    return course;
  }


  // ============================================================
  // COURSE 3: WEB SERVER ADMINISTRATION
  // ============================================================

  await createCourseWithQuizzes(

    'Web Server Administration',
    'Master web server technologies from Nginx to Apache, learn reverse proxying, load balancing, SSL configuration, and modern application deployment patterns including containerized solutions.',
    [
      {
        title: 'Nginx Mastery', order: 1,
        lessons: [
          {
            title: 'Nginx Architecture', order: 1, labId: nginxLab?.id,
            content: `# Nginx Architecture

### Learning Objectives
- Understand the master-worker process model
- Learn how Nginx handles concurrent connections
- Configure worker processes and connection limits
- Monitor Nginx process health and resource usage

### Section 1: The Master-Worker Model

Nginx uses an event-driven, asynchronous architecture that differs fundamentally from traditional process-based web servers like Apache prefork model. At its core, Nginx employs a master-worker process hierarchy:

**Master Process:** The master process runs as root and handles privileged operations including reading and validating configuration files, binding to privileged ports (80, 443), managing worker processes (start, stop, reload), opening log files, and handling signals (SIGHUP for reload, SIGTERM for shutdown).

**Worker Processes:** Worker processes run as unprivileged users and handle actual request processing. Each worker is a single-threaded process that handles thousands of connections using an event-driven model.

\`\`\`bash
# Check Nginx process hierarchy
ps aux | grep nginx
# Output example:
# root     1234  0.0  0.1  nginx: master process /usr/sbin/nginx
# www-data 1235  0.0  0.2  nginx: worker process
# www-data 1236  0.0  0.2  nginx: worker process
\`\`\`

### Section 2: Event-Driven Processing

Unlike thread-per-connection models, Nginx workers use epoll (Linux) or kqueue (BSD/macOS) to monitor file descriptors for events. This allows a single worker to handle 10,000+ concurrent connections:

\`\`\`nginx
# /etc/nginx/nginx.conf
worker_processes auto;       # Match CPU cores
worker_rlimit_nofile 65535;  # Max open files per worker

events {
    worker_connections 4096;  # Max connections per worker
    multi_accept on;          # Accept multiple connections at once
    use epoll;                # Linux event mechanism
}
\`\`\`

**Total concurrent connections = worker_processes x worker_connections**

### Section 3: Connection Processing Pipeline

When a request arrives, Nginx processes it through a defined pipeline:

1. **Accept** — Worker accepts the connection from the listen socket
2. **Read** — Request headers are read from the socket
3. **Process** — Nginx matches the request to a location block, applies access controls, rewrites URIs
4. **Generate** — Content is generated from static files or proxied to a backend
5. **Send** — Response headers and body are written to the socket

Each phase is non-blocking. If a phase would block (e.g., reading from a slow backend), the worker registers a callback and moves on to handle other connections.

### Section 4: Key Configuration Directives

\`\`\`nginx
worker_processes auto;           # Auto-detect CPU cores
worker_cpu_affinity auto;        # Pin workers to cores
worker_rlimit_nofile 65535;      # File descriptor limit

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;                 # Kernel-level file transfer
    tcp_nopush on;               # Optimize packet sending
    tcp_nodelay on;              # Disable Nagle algorithm
    keepalive_timeout 65;        # Client keepalive
    keepalive_requests 1000;     # Max requests per keepalive
}
\`\`\`

### Section 5: Monitoring and Status

\`\`\`nginx
# Enable the stub_status module
location /nginx_status {
    stub_status;
    allow 127.0.0.1;
    deny all;
}
\`\`\`

\`\`\`bash
# View status output
curl http://localhost/nginx_status
# Active connections: 291
# server accepts handled requests
#  16630948 16630948 31070465
# Reading: 6 Writing: 179 Waiting: 106
\`\`\`

### Hands-On Practice

1. Install Nginx and inspect the process hierarchy with \`ps aux | grep nginx\`
2. Edit \`worker_processes\` and reload with \`nginx -s reload\`
3. Enable \`stub_status\` and verify with \`curl\`
4. Run \`ab -n 10000 -c 100 http://localhost/\` to test concurrent connections
5. Monitor with \`watch -n1 'cat /proc/$(pgrep -o nginx)/limits'\`

### Key Takeaways
- Nginx uses a master-worker process model with event-driven processing
- Worker processes handle thousands of connections via epoll/kqueue
- Total capacity equals worker_processes multiplied by worker_connections
- The stub_status module provides runtime connection metrics
- sendfile and tcp_nopush optimize static file delivery

### References & Further Reading
**Textbooks:**
1. "Mastering Nginx" by Dimitri Aivaliotis — Chapter 2: Nginx Mechanics, pages 25-60
2. "Nginx Cookbook" by Alex Crawford — Chapter 1: Basic Configuration, pages 1-20
3. "High Performance Browser Networking" by Ilya Grigorik — Chapter 12: Optimizing for TLS

**Online Resources:**
1. [Nginx Official Documentation — Tuning](https://nginx.org/en/docs/ngx_core_module.html)
2. [Nginx Architecture](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/)
3. [Linux epoll man page](https://man7.org/linux/man-pages/man7/epoll.7.html)`,
            questions: [
              { text: 'What process model does Nginx use?', answers: [
                { text: 'Thread-per-connection model', isCorrect: false },
                { text: 'Master-worker event-driven model', isCorrect: true },
                { text: 'Single-process model', isCorrect: false },
                { text: 'Fork-per-request model', isCorrect: false },
              ]},
              { text: 'Which system call does Nginx use on Linux for event notification?', answers: [
                { text: 'select', isCorrect: false },
                { text: 'poll', isCorrect: false },
                { text: 'epoll', isCorrect: true },
                { text: 'kqueue', isCorrect: false },
              ]},
              { text: 'What does worker_cpu_affinity do?', answers: [
                { text: 'Limits CPU usage per worker', isCorrect: false },
                { text: 'Pins workers to specific CPU cores', isCorrect: true },
                { text: 'Sets CPU priority for workers', isCorrect: false },
                { text: 'Enables CPU load balancing', isCorrect: false },
              ]},
              { text: 'How do you calculate maximum concurrent connections?', answers: [
                { text: 'worker_connections only', isCorrect: false },
                { text: 'worker_processes + worker_connections', isCorrect: false },
                { text: 'worker_processes x worker_connections', isCorrect: true },
                { text: 'worker_processes x worker_rlimit_nofile', isCorrect: false },
              ]},
              { text: 'What signal triggers a graceful reload of Nginx?', answers: [
                { text: 'SIGTERM', isCorrect: false },
                { text: 'SIGQUIT', isCorrect: false },
                { text: 'SIGHUP', isCorrect: true },
                { text: 'SIGUSR1', isCorrect: false },
              ]},
              { text: 'Which directive enables efficient file transfers?', answers: [
                { text: 'directio on', isCorrect: false },
                { text: 'sendfile on', isCorrect: true },
                { text: 'aio on', isCorrect: false },
                { text: 'tcp_nodelay on', isCorrect: false },
              ]},
              { text: 'What is the purpose of the stub_status module?', answers: [
                { text: 'Enable SSL termination', isCorrect: false },
                { text: 'Provide runtime statistics', isCorrect: true },
                { text: 'Load balance requests', isCorrect: false },
                { text: 'Cache static files', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Virtual Hosts & SSL', order: 2,
            content: `# Virtual Hosts & SSL Configuration

### Learning Objectives
- Configure server blocks to host multiple domains
- Set up Let's Encrypt SSL certificates with auto-renewal
- Implement HTTP to HTTPS redirects
- Configure OCSP stapling and SSL session caching

### Section 1: Server Blocks (Virtual Hosts)

Nginx uses "server blocks" instead of Apache VirtualHost directives:

\`\`\`nginx
# /etc/nginx/sites-available/example.com
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

### Section 2: SSL Certificate Setup with Let's Encrypt

\`\`\`bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate (auto-configures Nginx)
sudo certbot --nginx -d example.com -d www.example.com

# Manual certificate request
sudo certbot certonly --webroot -w /var/www/example.com/html -d example.com

# Certificates stored in:
ls /etc/letsencrypt/live/example.com/
# cert.pem, chain.pem, fullchain.pem, privkey.pem
\`\`\`

### Section 3: Complete SSL Configuration

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}
\`\`\`

### Section 4: Auto-Renewal

\`\`\`bash
# Test renewal
sudo certbot renew --dry-run

# Check timer
systemctl status certbot.timer

# Manual renewal
sudo certbot renew
\`\`\`

### Hands-On Practice

1. Create a server block for a test domain
2. Use Certbot to obtain a certificate
3. Verify SSL with \`openssl s_client -connect localhost:443\`
4. Test auto-renewal with \`certbot renew --dry-run\`

### Key Takeaways
- Server blocks define virtual hosts in Nginx
- Let's Encrypt provides free SSL certificates
- SSL should use only TLSv1.2 and TLSv1.3
- OCSP stapling and session caching improve performance
- HSTS headers protect against downgrade attacks

### References & Further Reading
1. "Nginx Cookbook" by Alex Crawford — Chapter 5: SSL/TLS
2. [Nginx SSL Documentation](https://nginx.org/en/docs/http/configuring_https_servers.html)
3. [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
4. [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)`,
            questions: [
              { text: 'What directive defines a virtual host in Nginx?', answers: [
                { text: 'VirtualHost', isCorrect: false },
                { text: 'server', isCorrect: true },
                { text: 'host', isCorrect: false },
                { text: 'vhost', isCorrect: false },
              ]},
              { text: 'Which SSL protocols should be enabled in production?', answers: [
                { text: 'SSLv3, TLSv1.0, TLSv1.1', isCorrect: false },
                { text: 'TLSv1.0, TLSv1.1, TLSv1.2', isCorrect: false },
                { text: 'TLSv1.2, TLSv1.3 only', isCorrect: true },
                { text: 'TLSv1.3 only', isCorrect: false },
              ]},
              { text: 'What does OCSP stapling improve?', answers: [
                { text: 'Certificate encryption strength', isCorrect: false },
                { text: 'SSL handshake performance', isCorrect: true },
                { text: 'Key exchange security', isCorrect: false },
                { text: 'Certificate renewal speed', isCorrect: false },
              ]},
              { text: 'What header prevents clickjacking attacks?', answers: [
                { text: 'X-XSS-Protection', isCorrect: false },
                { text: 'X-Content-Type-Options', isCorrect: false },
                { text: 'X-Frame-Options', isCorrect: true },
                { text: 'Content-Security-Policy', isCorrect: false },
              ]},
              { text: 'How do you redirect HTTP to HTTPS in Nginx?', answers: [
                { text: 'return 301 https://$host$request_uri;', isCorrect: true },
                { text: 'rewrite ^ https://$host$request_uri;', isCorrect: false },
                { text: 'proxy_pass https://$host;', isCorrect: false },
                { text: 'redirect https://$host;', isCorrect: false },
              ]},
              { text: 'What is the purpose of ssl_session_cache?', answers: [
                { text: 'Store SSL certificates', isCorrect: false },
                { text: 'Cache SSL session parameters for reuse', isCorrect: true },
                { text: 'Encrypt session cookies', isCorrect: false },
                { text: 'Manage SSL certificate revocation', isCorrect: false },
              ]},
              { text: 'Which command obtains a certificate using DNS validation?', answers: [
                { text: 'certbot --nginx', isCorrect: false },
                { text: 'certbot certonly --webroot', isCorrect: false },
                { text: 'certbot certonly --manual --preferred-challenges dns', isCorrect: true },
                { text: 'certbot --apache', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Reverse Proxying & Load Balancing', order: 3,
            content: `# Reverse Proxying & Load Balancing

### Learning Objectives
- Configure Nginx as a reverse proxy for backend applications
- Set up upstream server groups with health checks
- Implement load balancing algorithms (round-robin, least-connections, ip-hash)
- Configure proxy buffering, timeouts, and WebSocket support

### Section 1: Basic Reverse Proxy

Nginx excels as a reverse proxy, forwarding client requests to backend application servers:

\`\`\`nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

**Important:** Always set the proxy headers. Without them, the backend cannot see the original client IP or protocol.

### Section 2: Upstream Server Groups

Define groups of backend servers for load balancing:

\`\`\`nginx
upstream app_backend {
    server 10.0.0.1:3000 weight=3;
    server 10.0.0.2:3000 weight=2;
    server 10.0.0.3:3000 weight=1;
    server 10.0.0.4:3000 backup;  # Only used when others are down

    keepalive 32;  # Connection pool to backends
}

server {
    listen 80;
    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
\`\`\`

### Section 3: Load Balancing Algorithms

| Algorithm | Directive | Description |
|-----------|-----------|-------------|
| Round-Robin | (default) | Distributes requests sequentially |
| Least Connections | \`least_conn;\` | Sends to server with fewest active connections |
| IP Hash | \`ip_hash;\` | Same client IP always hits same server (session persistence) |
| Random | \`random two least_conn;\` | Random selection among least-loaded servers |

\`\`\`nginx
upstream backend {
    least_conn;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}
\`\`\`

### Section 4: Health Checks

Nginx performs passive health checks by default. Active health checks require Nginx Plus, but you can configure passive checks:

\`\`\`nginx
upstream backend {
    server 10.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:3000 max_fails=3 fail_timeout=30s;
}
\`\`\`

\`max_fails\`: Number of failures before marking server as unavailable
\`fail_timeout\`: Duration to mark server as unavailable after max_fails

### Section 5: Proxy Buffering and Timeouts

\`\`\`nginx
location / {
    proxy_pass http://app_backend;

    # Buffers
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Retry on failure
    proxy_next_upstream error timeout http_502 http_503;
    proxy_next_upstream_tries 3;
}
\`\`\`

### Section 6: WebSocket Proxying

\`\`\`nginx
location /ws/ {
    proxy_pass http://app_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;  # Keep WebSocket alive
}
\`\`\`

### Hands-On Practice

1. Set up two Python Flask servers on different ports
2. Configure Nginx as a reverse proxy with upstream
3. Test load balancing by sending multiple requests
4. Simulate a backend failure and observe failover
5. Configure WebSocket proxying for a real-time app

### Key Takeaways
- Always set proxy headers (X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
- Use upstream blocks to group backend servers
- least_conn is best for variable request times; ip_hash for session persistence
- Configure timeouts and retry logic for resilience
- WebSocket proxying requires Upgrade and Connection headers

### References & Further Reading
1. "Nginx Cookbook" by Alex Crawford — Chapter 3: Proxying
2. [Nginx Proxy Documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
3. [Nginx Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)`,
            questions: [
              { text: 'Which directive is required for WebSocket proxying in Nginx?', answers: [
                { text: 'proxy_set_header Upgrade $http_upgrade', isCorrect: true },
                { text: 'proxy_websocket on', isCorrect: false },
                { text: 'ws_upgrade on', isCorrect: false },
                { text: 'proxy_set_header Upgrade websocket', isCorrect: false },
              ]},
              { text: 'Which load balancing algorithm sends requests to the server with fewest active connections?', answers: [
                { text: 'round-robin', isCorrect: false },
                { text: 'ip_hash', isCorrect: false },
                { text: 'least_conn', isCorrect: true },
                { text: 'random', isCorrect: false },
              ]},
              { text: 'What does max_fails=3 mean in an upstream server definition?', answers: [
                { text: 'Server will handle exactly 3 requests', isCorrect: false },
                { text: 'Server is marked down after 3 consecutive failures', isCorrect: true },
                { text: 'Server will be removed after 3 minutes', isCorrect: false },
                { text: 'Server accepts maximum 3 concurrent connections', isCorrect: false },
              ]},
              { text: 'Why should you always set proxy_set_header Host $host?', answers: [
                { text: 'To enable SSL on the backend', isCorrect: false },
                { text: 'To preserve the original Host header for the backend', isCorrect: true },
                { text: 'To enable compression', isCorrect: false },
                { text: 'To set the server name in access logs', isCorrect: false },
              ]},
              { text: 'What does proxy_next_upstream do?', answers: [
                { text: 'Enables response caching', isCorrect: false },
                { text: 'Forwards the request to the next backend on failure', isCorrect: true },
                { text: 'Sends the request to all backends simultaneously', isCorrect: false },
                { text: 'Load balances across multiple Nginx instances', isCorrect: false },
              ]},
              { text: 'What is the purpose of the keepalive directive in an upstream block?', answers: [
                { text: 'Keep client connections alive', isCorrect: false },
                { text: 'Maintain a pool of connections to backend servers', isCorrect: true },
                { text: 'Enable HTTP keepalive for Nginx itself', isCorrect: false },
                { text: 'Prevent backend servers from shutting down', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Caching & Performance Tuning', order: 4,
            content: `# Caching & Performance Tuning

### Learning Objectives
- Configure proxy caching to reduce backend load
- Implement browser caching with expires headers
- Optimize Nginx for high-throughput workloads
- Use Gzip/Brotli compression effectively

### Section 1: Proxy Cache Configuration

Nginx can cache responses from backend servers, reducing load and improving response times:

\`\`\`nginx
# Define cache zone in http block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:100m
    max_size=10g inactive=60m use_temp_path=off;

server {
    location / {
        proxy_pass http://app_backend;
        proxy_cache my_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
\`\`\`

Cache status values: HIT, MISS, EXPIRED, STALE, UPDATING, BYPASS

### Section 2: Cache Invalidation

\`\`\`bash
# Purge cache for a specific URL (requires proxy_cache_purge module)
curl -X PURGE http://example.com/api/data

# Skip cache for specific requests
location /api/ {
    proxy_cache off;
    proxy_pass http://app_backend;
}

# Bypass cache with header
proxy_cache_bypass $http_x_no_cache;
proxy_no_cache $http_x_no_cache;
\`\`\`

### Section 3: Browser Caching

\`\`\`nginx
# Static assets - cache for 1 year
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    root /var/www/html;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# HTML - no cache
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}

# API responses - no cache
location /api/ {
    proxy_pass http://app_backend;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
\`\`\`

### Section 4: Gzip Compression

\`\`\`nginx
http {
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain text/css text/xml
        application/json application/javascript
        application/xml application/rss+xml
        image/svg+xml;
}
\`\`\`

### Section 5: Brotli Compression

\`\`\`nginx
# Requires ngx_brotli module
brotli on;
broli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript;
\`\`\`

### Section 6: Performance Tuning

\`\`\`nginx
http {
    # Sendfile for zero-copy file transfers
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # Open file cache
    open_file_cache max=10000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;

    # Buffer optimization
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;

    # Timeout tuning
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 65;
    send_timeout 10;
}
\`\`\`

### Hands-On Practice

1. Configure proxy caching and verify with \`X-Cache-Status\` header
2. Set up browser caching for static assets
3. Enable gzip compression and test with \`curl -H 'Accept-Encoding: gzip'\`
4. Benchmark before and after with \`ab\` or \`wrk\`

### Key Takeaways
- Proxy caching reduces backend load and improves response times
- Use Cache-Control headers to control browser caching
- Gzip/Brotli compression reduces bandwidth by 60-80%
- sendfile enables zero-copy file transfers
- Tune buffer sizes and timeouts for your workload

### References & Further Reading
1. "Nginx Cookbook" by Alex Crawford — Chapter 6: Caching
2. [Nginx Caching Guide](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/)
3. [PageSpeed Module for Nginx](https://developers.google.com/speed/pagespeed/module/)`,
            questions: [
              { text: 'What does proxy_cache_valid 200 10m mean?', answers: [
                { text: 'Cache only lasts 10 minutes total', isCorrect: false },
                { text: 'Cache 200 responses for 10 minutes', isCorrect: true },
                { text: 'Cache for 10 minutes on port 200', isCorrect: false },
                { text: 'Maximum 200 cached items for 10 minutes', isCorrect: false },
              ]},
              { text: 'What header reveals whether a response was served from cache?', answers: [
                { text: 'X-Cache', isCorrect: false },
                { text: 'X-Cache-Status', isCorrect: true },
                { text: 'Cache-Control', isCorrect: false },
                { text: 'X-Proxy-Cache', isCorrect: false },
              ]},
              { text: 'What does the sendfile directive do?', answers: [
                { text: 'Enables file uploads', isCorrect: false },
                { text: 'Uses kernel zero-copy for efficient file transfers', isCorrect: true },
                { text: 'Sends files via email', isCorrect: false },
                { text: 'Enables file compression', isCorrect: false },
              ]},
              { text: 'Which gzip_comp_level provides the best balance of compression and CPU usage?', answers: [
                { text: '1 (fastest)', isCorrect: false },
                { text: '6 (balanced)', isCorrect: true },
                { text: '9 (maximum)', isCorrect: false },
                { text: '0 (disabled)', isCorrect: false },
              ]},
              { text: 'What does proxy_cache_use_stale do?', answers: [
                { text: 'Disables caching', isCorrect: false },
                { text: 'Serves stale cached content when backend is unavailable', isCorrect: true },
                { text: 'Deletes old cache entries', isCorrect: false },
                { text: 'Forces cache refresh', isCorrect: false },
              ]},
              { text: 'What is the correct Cache-Control header for immutable static assets?', answers: [
                { text: 'no-cache, no-store', isCorrect: false },
                { text: 'public, immutable', isCorrect: true },
                { text: 'private, max-age=0', isCorrect: false },
                { text: 'must-revalidate', isCorrect: false },
              ]},
            ],
          },
        ],
      },
      {
        title: 'Apache & Alternatives', order: 2,
        lessons: [
          {
            title: 'Apache httpd Configuration', order: 1, labId: undefined,
            content: `# Apache httpd Configuration

### Learning Objectives
- Understand Apache MPM modules (prefork, worker, event)
- Configure VirtualHosts for multiple sites
- Set up .htaccess for directory-level configuration
- Implement authentication and access control

### Section 1: MPM Modules

Apache uses Multi-Processing Modules (MPMs) to handle connections. Unlike Nginx, Apache supports multiple MPMs:

| MPM | Model | Best For |
|-----|-------|----------|
| prefork | Process-per-connection | Stability, mod_php |
| worker | Threaded with process pool | Balanced performance |
| event | Async keep-alive handling | High concurrency |

\`\`\`bash
# Check current MPM
apachectl -V | grep MPM

# Switch MPM (Debian/Ubuntu)
sudo a2dismod mpm_prefork
sudo a2enmod mpm_worker
sudo systemctl restart apache2
\`\`\`

### Section 2: VirtualHosts

\`\`\`apache
# /etc/apache2/sites-available/example.com.conf
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com
    DocumentRoot /var/www/example.com/html

    <Directory /var/www/example.com/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/example.com-error.log
    CustomLog \${APACHE_LOG_DIR}/example.com-access.log combined
</VirtualHost>

# Enable the site
sudo a2ensite example.com.conf
sudo systemctl reload apache2
\`\`\`

### Section 3: .htaccess Configuration

\`\`\`apache
# URL Rewriting
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php/$1 [L]

# Basic Authentication
AuthType Basic
AuthName "Restricted Area"
AuthUserFile /etc/apache2/.htpasswd
Require valid-user
\`\`\`

### Section 4: Authentication

\`\`\`bash
# Create password file
sudo htpasswd -c /etc/apache2/.htpasswd admin

# Add more users
sudo htpasswd /etc/apache2/.htpasswd user2
\`\`\`

### Section 5: Performance Tuning

\`\`\`apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# Connection keep-alive
KeepAlive On
KeepAliveTimeout 5
MaxKeepAliveRequests 100
\`\`\`

### Key Takeaways
- Apache MPMs determine connection handling (prefork, worker, event)
- VirtualHosts allow hosting multiple sites on one server
- .htaccess provides directory-level configuration
- Apache offers flexible authentication and access control

### References
1. "Apache Cookbook" by Ken Coar
2. [Apache httpd Documentation](https://httpd.apache.org/docs/2.4/)
3. [Apache MPM Comparison](https://httpd.apache.org/docs/2.4/mpm.html)`,
            questions: [
              { text: 'Which Apache MPM is best for high concurrency with minimal memory?', answers: [
                { text: 'prefork', isCorrect: false },
                { text: 'worker', isCorrect: false },
                { text: 'event', isCorrect: true },
                { text: 'itk', isCorrect: false },
              ]},
              { text: 'What directive enables .htaccess processing?', answers: [
                { text: 'Options +Includes', isCorrect: false },
                { text: 'AllowOverride All', isCorrect: true },
                { text: 'AccessFileName .htaccess', isCorrect: false },
                { text: 'EnableHtaccess On', isCorrect: false },
              ]},
              { text: 'Which command creates an Apache password file?', answers: [
                { text: 'htpasswd -c /path/file user', isCorrect: true },
                { text: 'apache-passwd create user', isCorrect: false },
                { text: 'htpasswd create user /path/file', isCorrect: false },
                { text: 'echo \'user:pass\' > /path/file', isCorrect: false },
              ]},
              { text: 'What does Options -Indexes do?', answers: [
                { text: 'Enables directory listing', isCorrect: false },
                { text: 'Disables directory listing when no index file exists', isCorrect: true },
                { text: 'Enables indexing for search engines', isCorrect: false },
                { text: 'Disables all directory options', isCorrect: false },
              ]},
              { text: 'Which Apache module provides URL rewriting?', answers: [
                { text: 'mod_rewrite', isCorrect: true },
                { text: 'mod_redirect', isCorrect: false },
                { text: 'mod_alias', isCorrect: false },
                { text: 'mod_proxy', isCorrect: false },
              ]},
              { text: 'What is the difference between ServerName and ServerAlias?', answers: [
                { text: 'No difference', isCorrect: false },
                { text: 'ServerName is primary, ServerAlias is additional names', isCorrect: true },
                { text: 'ServerAlias is the primary domain', isCorrect: false },
                { text: 'ServerName handles HTTP, ServerAlias handles HTTPS', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Alternative Web Servers', order: 2, labId: undefined,
            content: `# Alternative Web Servers

### Learning Objectives
- Compare Caddy, HAProxy, and Traefik as web server alternatives
- Understand when to use each server
- Configure automatic HTTPS with Caddy
- Set up HAProxy for TCP/HTTP load balancing

### Section 1: Caddy

Caddy is a modern web server with automatic HTTPS via Let's Encrypt:

\`\`\`caddy
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
\`\`\`

**Caddy vs Nginx:**
- Caddy automatically obtains and renews SSL certificates
- Caddy uses a simpler configuration syntax
- Nginx has better performance under extreme load
- Nginx has a larger module ecosystem

### Section 2: HAProxy

HAProxy specializes in load balancing and proxying:

\`\`\`haproxy
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
\`\`\`

### Section 3: Traefik

Traefik is designed for containerized environments:

\`\`\`yaml
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
\`\`\`

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
3. [Traefik Documentation](https://doc.traefik.io/traefik/)`,
            questions: [
              { text: 'Which web server automatically obtains SSL certificates?', answers: [
                { text: 'Nginx', isCorrect: false },
                { text: 'Apache', isCorrect: false },
                { text: 'Caddy', isCorrect: true },
                { text: 'LiteSpeed', isCorrect: false },
              ]},
              { text: 'What is HAProxy primarily designed for?', answers: [
                { text: 'Serving static files', isCorrect: false },
                { text: 'Load balancing and reverse proxying', isCorrect: true },
                { text: 'Running PHP applications', isCorrect: false },
                { text: 'Managing DNS records', isCorrect: false },
              ]},
              { text: 'Which server is best for Docker and Kubernetes environments?', answers: [
                { text: 'Nginx', isCorrect: false },
                { text: 'Apache', isCorrect: false },
                { text: 'Lighttpd', isCorrect: false },
                { text: 'Traefik', isCorrect: true },
              ]},
              { text: 'What configuration file does Caddy use?', answers: [
                { text: 'nginx.conf', isCorrect: false },
                { text: 'httpd.conf', isCorrect: false },
                { text: 'Caddyfile', isCorrect: true },
                { text: 'caddy.yml', isCorrect: false },
              ]},
              { text: 'What does HAProxy httpchk option do?', answers: [
                { text: 'Checks HTTP headers', isCorrect: false },
                { text: 'Performs HTTP health checks on backends', isCorrect: true },
                { text: 'Validates HTTP requests', isCorrect: false },
                { text: 'Enables HTTP logging', isCorrect: false },
              ]},
              { text: 'Why choose Nginx over Caddy in production?', answers: [
                { text: 'Caddy cannot handle HTTPS', isCorrect: false },
                { text: 'Nginx has better performance at scale and more modules', isCorrect: true },
                { text: 'Caddy does not support Linux', isCorrect: false },
                { text: 'Nginx is simpler to configure', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Containerized Web Deployment', order: 3, labId: undefined,
            content: `# Containerized Web Deployment

### Learning Objectives
- Deploy web applications using Docker containers
- Configure Nginx as a Docker reverse proxy
- Use Docker Compose for multi-container deployments
- Implement container health checks and restart policies

### Section 1: Docker Basics for Web Servers

\`\`\`bash
# Pull and run Nginx
docker pull nginx:latest
docker run -d --name web -p 80:80 -p 443:443 \
    -v /etc/nginx/conf.d:/etc/nginx/conf.d \
    -v /var/www/html:/usr/share/nginx/html \
    nginx:latest

# Run a Node.js app
docker run -d --name api -p 3000:3000 \
    -e NODE_ENV=production \
    myapp:latest
\`\`\`

### Section 2: Docker Compose Setup

\`\`\`yaml
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
\`\`\`

### Section 3: Nginx Docker Configuration

\`\`\`nginx
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
\`\`\`

### Section 4: Health Checks and Restart Policies

\`\`\`yaml
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
\`\`\`

### Key Takeaways
- Docker provides consistent deployment across environments
- Docker Compose simplifies multi-container orchestration
- Use volumes for persistent data and configuration files
- Health checks ensure containers are running properly
- Restart policies handle automatic recovery from failures

### References
1. [Docker Documentation](https://docs.docker.com/)
2. [Docker Compose Specification](https://docs.docker.com/compose/)
3. [Nginx Docker Hub](https://hub.docker.com/_/nginx/)`,
            questions: [
              { text: 'What Docker flag maps container ports to host ports?', answers: [
                { text: '-v', isCorrect: false },
                { text: '-p', isCorrect: true },
                { text: '--expose', isCorrect: false },
                { text: '--link', isCorrect: false },
              ]},
              { text: 'What Docker Compose directive defines service dependencies?', answers: [
                { text: 'links', isCorrect: false },
                { text: 'depends_on', isCorrect: true },
                { text: 'requires', isCorrect: false },
                { text: 'needs', isCorrect: false },
              ]},
              { text: 'What does the restart: unless-stopped policy do?', answers: [
                { text: 'Never restarts containers', isCorrect: false },
                { text: 'Restarts containers unless manually stopped', isCorrect: true },
                { text: 'Always restarts containers', isCorrect: false },
                { text: 'Restarts only on system reboot', isCorrect: false },
              ]},
              { text: 'What is the purpose of Docker volumes?', answers: [
                { text: 'Increase CPU allocation', isCorrect: false },
                { text: 'Persist data beyond container lifecycle', isCorrect: true },
                { text: 'Enable networking between containers', isCorrect: false },
                { text: 'Build container images', isCorrect: false },
              ]},
              { text: 'In Docker Compose, how do services reference other containers by name?', answers: [
                { text: 'By IP address', isCorrect: false },
                { text: 'By service name as hostname', isCorrect: true },
                { text: 'By container ID', isCorrect: false },
                { text: 'By environment variable', isCorrect: false },
              ]},
            ],
          },
        ],
      },
      {
        title: 'Application Deployment', order: 3,
        lessons: [
          {
            title: 'Node.js Application Deployment', order: 1, labId: undefined,
            content: `# Node.js Application Deployment

### Learning Objectives
- Deploy Node.js applications behind Nginx
- Configure PM2 process manager for production
- Set up environment variables and secrets management
- Implement logging and monitoring

### Section 1: Deployment Architecture

\`\`\`
Client -> Nginx (port 80/443) -> Node.js (port 3000) -> Database
\`\`\`

Nginx handles SSL termination, static files, load balancing, and rate limiting while Node.js focuses on application logic.

### Section 2: PM2 Process Manager

\`\`\`bash
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
\`\`\`

### Section 3: Nginx Configuration for Node.js

\`\`\`nginx
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
\`\`\`

### Section 4: Environment Variables

\`\`\`bash
# .env file (never commit to git)
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
JWT_SECRET=your-secret-key

# Load with dotenv
require('dotenv').config();
\`\`\`

### Section 5: Logging with Winston

\`\`\`javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/log/myapp/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/myapp/combined.log' }),
  ],
});
\`\`\`

### Key Takeaways
- Use PM2 in cluster mode for multi-core utilization
- Let Nginx handle SSL, rate limiting, and static files
- Always use environment variables for secrets
- Implement structured logging for debugging and monitoring
- Configure keepalive connections between Nginx and Node.js

### References
1. [PM2 Documentation](https://pm2.keymetrics.io/docs/)
2. [Nginx Proxy Configuration](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
3. [Node.js Production Best Practices](https://github.com/goldbergyoni/nodebestpractices)`,
            questions: [
              { text: 'What does PM2 cluster mode do?', answers: [
                { text: 'Runs multiple Node.js instances on different machines', isCorrect: false },
                { text: 'Runs one process per CPU core', isCorrect: true },
                { text: 'Creates a backup of the application', isCorrect: false },
                { text: 'Monitors application health', isCorrect: false },
              ]},
              { text: 'Why should Nginx handle SSL instead of Node.js?', answers: [
                { text: 'Node.js cannot handle SSL', isCorrect: false },
                { text: 'Nginx is optimized for SSL termination and performs better', isCorrect: true },
                { text: 'SSL requires root privileges only Nginx has', isCorrect: false },
                { text: 'There is no difference', isCorrect: false },
              ]},
              { text: 'What does the pm2 save command do?', answers: [
                { text: 'Saves application code', isCorrect: false },
                { text: 'Saves the process list for automatic restart', isCorrect: true },
                { text: 'Creates a database backup', isCorrect: false },
                { text: 'Saves environment variables', isCorrect: false },
              ]},
              { text: 'What is the purpose of proxy_http_version 1.1 in Nginx?', answers: [
                { text: 'Enables HTTP/2', isCorrect: false },
                { text: 'Required for keepalive connections to upstream', isCorrect: true },
                { text: 'Forces clients to use HTTP/1.1', isCorrect: false },
                { text: 'Enables WebSocket support', isCorrect: false },
              ]},
              { text: 'Where should secrets like JWT_SECRET be stored?', answers: [
                { text: 'In the source code', isCorrect: false },
                { text: 'In environment variables', isCorrect: true },
                { text: 'In the Nginx configuration', isCorrect: false },
                { text: 'In the database', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Python/Django Deployment', order: 2, labId: undefined,
            content: `# Python/Django Deployment

### Learning Objectives
- Deploy Django applications with Gunicorn and Nginx
- Configure Gunicorn workers and binding
- Serve Django static and media files through Nginx
- Implement Django security settings for production

### Section 1: Deployment Stack

\`\`\`
Client -> Nginx -> Gunicorn -> Django -> Database
           |-> Static Files
           |-> Media Files
\`\`\`

### Section 2: Gunicorn Setup

\`\`\`bash
# Install Gunicorn
pip install gunicorn

# Run Django with Gunicorn
gunicorn myproject.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 4 \
    --worker-class gevent \
    --timeout 120 \
    --access-logfile /var/log/gunicorn/access.log \
    --error-logfile /var/log/gunicorn/error.log
\`\`\`

**Worker Calculation:** workers = (2 x CPU cores) + 1

### Section 3: Systemd Service

\`\`\`ini
# /etc/systemd/system/myapp.service
[Unit]
Description=Gunicorn Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/myapp
ExecStart=/var/www/myapp/venv/bin/gunicorn \
    myproject.wsgi:application \
    --bind unix:/run/gunicorn/myapp.sock \
    --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
\`\`\`

### Section 4: Nginx Configuration for Django

\`\`\`nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Static files
    location /static/ {
        alias /var/www/myapp/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/myapp/media/;
        expires 7d;
    }

    # Django application
    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn/myapp.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

### Section 5: Django Production Settings

\`\`\`python
# settings.py (production overrides)
DEBUG = False
ALLOWED_HOSTS = ['example.com', 'www.example.com']

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/myapp/staticfiles/'
MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/myapp/media/'
\`\`\`

### Key Takeaways
- Gunicorn is the standard WSGI server for Django
- Use systemd to manage Gunicorn as a service
- Nginx serves static/media files directly for performance
- Always disable DEBUG and enable HTTPS in production
- Use Unix sockets instead of TCP for local Gunicorn-Nginx communication

### References
1. [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
2. [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/settings.html)
3. [Deploying Django with Gunicorn and Nginx](https://uwsgi-docs.readthedocs.io/en/latest/tutorials/Django_and_nginx.html)`,
            questions: [
              { text: 'What is the recommended Gunicorn worker count formula?', answers: [
                { text: 'Number of CPU cores', isCorrect: false },
                { text: '(2 x CPU cores) + 1', isCorrect: true },
                { text: 'Number of RAM GB', isCorrect: false },
                { text: '10 workers', isCorrect: false },
              ]},
              { text: 'Why use Unix sockets instead of TCP for Gunicorn-Nginx communication?', answers: [
                { text: 'Sockets are more secure', isCorrect: false },
                { text: 'Unix sockets are faster with lower overhead', isCorrect: true },
                { text: 'TCP does not work with Gunicorn', isCorrect: false },
                { text: 'Sockets support more workers', isCorrect: false },
              ]},
              { text: 'What Django setting should be False in production?', answers: [
                { text: 'ALLOWED_HOSTS', isCorrect: false },
                { text: 'DEBUG', isCorrect: true },
                { text: 'STATIC_URL', isCorrect: false },
                { text: 'DATABASES', isCorrect: false },
              ]},
              { text: 'What does the collectstatic command do?', answers: [
                { text: 'Collects user data', isCorrect: false },
                { text: 'Gathers all static files into STATIC_ROOT', isCorrect: true },
                { text: 'Downloads static assets from CDN', isCorrect: false },
                { text: 'Compresses static files', isCorrect: false },
              ]},
              { text: 'What systemd directive ensures the service starts on boot?', answers: [
                { text: 'Restart=always', isCorrect: false },
                { text: 'WantedBy=multi-user.target', isCorrect: true },
                { text: 'After=network.target', isCorrect: false },
                { text: 'ExecStart', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Container Orchestration', order: 3, labId: undefined,
            content: `# Container Orchestration

### Learning Objectives
- Understand Kubernetes architecture for web applications
- Deploy applications using Kubernetes manifests
- Configure Ingress controllers for HTTP routing
- Implement horizontal pod autoscaling

### Section 1: Kubernetes Architecture

\`\`\`
Master Node: API Server, etcd, Scheduler, Controller Manager
Worker Nodes: kubelet, kube-proxy, Container Runtime
\`\`\`

**Key Resources:**
- **Pod**: Smallest deployable unit, one or more containers
- **Deployment**: Manages pod replicas and updates
- **Service**: Stable network endpoint for pods
- **Ingress**: HTTP/HTTPS routing rules

### Section 2: Deployment Manifest

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
\`\`\`

### Section 3: Service and Ingress

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - example.com
    secretName: example-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
\`\`\`

### Section 4: Horizontal Pod Autoscaler

\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
\`\`\`

### Section 5: Useful Commands

\`\`\`bash
# Deploy and check
kubectl apply -f deployment.yaml
kubectl get pods -n production
kubectl describe pod <pod-name> -n production

# Scale manually
kubectl scale deployment web-app --replicas=5 -n production

# Logs and debugging
kubectl logs -f deployment/web-app -n production
kubectl exec -it <pod-name> -n production -- /bin/bash

# Update and rollback
kubectl set image deployment/web-app nginx=nginx:1.26 -n production
kubectl rollout undo deployment/web-app -n production
\`\`\`

### Key Takeaways
- Kubernetes provides automated deployment, scaling, and management
- Deployments manage pod replicas and rolling updates
- Services provide stable networking for pods
- Ingress controllers handle HTTP/HTTPS routing and SSL termination
- HPA automatically scales based on CPU/memory usage

### References
1. [Kubernetes Documentation](https://kubernetes.io/docs/)
2. [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
3. [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)`,
            questions: [
              { text: 'What is the smallest deployable unit in Kubernetes?', answers: [
                { text: 'Container', isCorrect: false },
                { text: 'Pod', isCorrect: true },
                { text: 'Node', isCorrect: false },
                { text: 'Cluster', isCorrect: false },
              ]},
              { text: 'What Kubernetes resource provides stable network access to pods?', answers: [
                { text: 'Deployment', isCorrect: false },
                { text: 'ConfigMap', isCorrect: false },
                { text: 'Service', isCorrect: true },
                { text: 'Volume', isCorrect: false },
              ]},
              { text: 'What does HPA stand for in Kubernetes?', answers: [
                { text: 'High Performance Allocation', isCorrect: false },
                { text: 'Horizontal Pod Autoscaler', isCorrect: true },
                { text: 'High Priority Application', isCorrect: false },
                { text: 'Host Path Access', isCorrect: false },
              ]},
              { text: 'What command rolls back a Kubernetes deployment?', answers: [
                { text: 'kubectl rollback deployment/web-app', isCorrect: false },
                { text: 'kubectl rollout undo deployment/web-app', isCorrect: true },
                { text: 'kubectl undo deployment/web-app', isCorrect: false },
                { text: 'kubectl revert deployment/web-app', isCorrect: false },
              ]},
              { text: 'What Kubernetes resource handles HTTP/HTTPS routing?', answers: [
                { text: 'Service', isCorrect: false },
                { text: 'Pod', isCorrect: false },
                { text: 'Ingress', isCorrect: true },
                { text: 'ConfigMap', isCorrect: false },
              ]},
            ],
          },
        ],
      },
    ],
  );

  // ============================================================
  // COURSE 4: NETWORKING & SECURITY
  // ============================================================

  await createCourseWithQuizzes(

    'Networking & Security',
    'Learn Linux networking fundamentals, firewall configuration with iptables and nftables, VPN setup, intrusion detection with Snort and Suricata, and network troubleshooting tools.',
    [
      {
        title: 'Network Fundamentals', order: 1,
        lessons: [
          {
            title: 'TCP/IP Fundamentals', order: 1, labId: netSecLab?.id,
            content: `# TCP/IP Fundamentals

### Learning Objectives
- Understand the TCP/IP model and its four layers
- Know the differences between TCP and UDP
- Identify common port numbers and their services
- Use netstat and ss to inspect network connections

### Section 1: The TCP/IP Model

| Layer | Name | Protocols | Description |
|-------|------|-----------|-------------|
| 4 | Application | HTTP, DNS, SSH, FTP, SMTP | User-facing services |
| 3 | Transport | TCP, UDP | End-to-end communication |
| 2 | Internet | IP, ICMP, ARP | Routing and addressing |
| 1 | Network Access | Ethernet, Wi-Fi | Physical transmission |

### Section 2: TCP vs UDP

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best-effort delivery |
| Ordering | Ordered | No ordering |
| Speed | Slower (overhead) | Faster (minimal overhead) |
| Use Cases | Web, email, file transfer | DNS, video streaming, gaming |

### Section 3: Common Ports

\`\`\`bash
# Well-known ports
22   - SSH
25   - SMTP
53   - DNS
80   - HTTP
443  - HTTPS
3306 - MySQL
5432 - PostgreSQL
6379 - Redis
8080 - HTTP Alt
\`\`\`

### Section 4: Inspecting Connections

\`\`\`bash
# Show all listening ports
ss -tlnp

# Show established connections
ss -tnp state established

# Using netstat
netstat -tlnp
netstat -anp | grep ESTABLISHED

# Check specific port
ss -tlnp | grep :443
\`\`\`

### Section 5: Network Interfaces

\`\`\`bash
# Show interfaces
ip addr show

# Bring interface up/down
sudo ip link set eth0 up
sudo ip link set eth0 down

# Set IP address
sudo ip addr add 192.168.1.100/24 dev eth0

# Show routing table
ip route show

# Add static route
sudo ip route add 10.0.0.0/8 via 192.168.1.1
\`\`\`

### Key Takeaways
- TCP/IP has four layers: Application, Transport, Internet, Network Access
- TCP provides reliable, ordered delivery; UDP is faster but unreliable
- Common ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL)
- Use ss and ip commands for modern network inspection

### References
1. "TCP/IP Illustrated" by W. Richard Stevens
2. [Linux ip command documentation](https://man7.org/linux/man-pages/man8/ip.8.html)
3. [ss command documentation](https://man7.org/linux/man-pages/man8/ss.8.html)`,
            questions: [
              { text: 'Which TCP/IP layer handles HTTP, DNS, and SSH?', answers: [
                { text: 'Transport', isCorrect: false },
                { text: 'Internet', isCorrect: false },
                { text: 'Application', isCorrect: true },
                { text: 'Network Access', isCorrect: false },
              ]},
              { text: 'What is the main difference between TCP and UDP?', answers: [
                { text: 'TCP is faster', isCorrect: false },
                { text: 'TCP provides reliable delivery, UDP is best-effort', isCorrect: true },
                { text: 'UDP supports encryption', isCorrect: false },
                { text: 'TCP is connectionless', isCorrect: false },
              ]},
              { text: 'Which port is used by HTTPS?', answers: [
                { text: '80', isCorrect: false },
                { text: '443', isCorrect: true },
                { text: '8080', isCorrect: false },
                { text: '8443', isCorrect: false },
              ]},
              { text: 'Which command shows listening TCP ports on modern Linux?', answers: [
                { text: 'netstat -tlnp', isCorrect: false },
                { text: 'ss -tlnp', isCorrect: true },
                { text: 'ip ports', isCorrect: false },
                { text: 'tcpdump ports', isCorrect: false },
              ]},
              { text: 'What command shows the routing table?', answers: [
                { text: 'ip route show', isCorrect: true },
                { text: 'route list', isCorrect: false },
                { text: 'ip addr show', isCorrect: false },
                { text: 'netstat -r', isCorrect: false },
              ]},
              { text: 'Which port does DNS typically use?', answers: [
                { text: '53', isCorrect: true },
                { text: '80', isCorrect: false },
                { text: '25', isCorrect: false },
                { text: '110', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'DNS and Name Resolution', order: 2,
            content: `# DNS and Name Resolution

### Learning Objectives
- Understand DNS hierarchy and resolution process
- Configure local DNS resolution with /etc/hosts and /etc/resolv.conf
- Use dig, nslookup, and host to query DNS
- Set up a local DNS cache with systemd-resolved

### Section 1: DNS Hierarchy

\`\`\`
Root (.)
  -> TLD (.com, .org, .net)
    -> Authoritative (example.com)
      -> Specific (www.example.com)
\`\`\`

### Section 2: DNS Resolution Process

1. Browser checks browser cache
2. OS checks /etc/hosts
3. OS queries configured DNS server (from /etc/resolv.conf)
4. DNS server checks cache, then recurses up the hierarchy
5. IP address returned to browser

### Section 3: Configuration Files

\`\`\`bash
# /etc/resolv.conf - DNS servers
nameserver 8.8.8.8
nameserver 1.1.1.1
search example.com

# /etc/hosts - Local resolution
127.0.0.1   localhost
192.168.1.10 myserver.local myserver
192.168.1.20 db.local db
\`\`\`

### Section 4: DNS Lookup Tools

\`\`\`bash
# dig - most comprehensive
dig example.com
dig +short example.com
dig @8.8.8.8 example.com
dig example.com MX
dig -x 93.184.216.34  # Reverse lookup

# nslookup
nslookup example.com
nslookup -type=MX example.com

# host
host example.com
host -t MX example.com
\`\`\`

### Section 5: Local DNS Cache

\`\`\`bash
# Check systemd-resolved status
resolvectl status

# Flush DNS cache
resolvectl flush-caches

# Test with specific server
resolvectl query example.com
\`\`\`

### Section 6: DNS Record Types

| Record | Purpose | Example |
|--------|---------|---------|
| A | Maps domain to IPv4 | example.com -> 93.184.216.34 |
| AAAA | Maps domain to IPv6 | example.com -> 2606:2800:220:1:... |
| CNAME | Alias to another domain | www.example.com -> example.com |
| MX | Mail server | example.com -> mail.example.com |
| TXT | Text data (SPF, DKIM) | example.com -> "v=spf1 ..." |
| NS | Nameserver | example.com -> ns1.example.com |

### Key Takeaways
- DNS resolves domain names to IP addresses through a hierarchical system
- /etc/resolv.conf configures DNS servers; /etc/hosts provides local overrides
- dig is the most powerful DNS lookup tool
- systemd-resolved provides local DNS caching
- Common record types: A, AAAA, CNAME, MX, TXT, NS

### References
1. "DNS and BIND" by Paul Albitz
2. [dig man page](https://man7.org/linux/man-pages/man1/dig.1.html)
3. [Linux DNS How-To](https://tldp.org/HOWTO/DNS-HOWTO/)`,
            questions: [
              { text: 'Which file configures which DNS servers to use?', answers: [
                { text: '/etc/hosts', isCorrect: false },
                { text: '/etc/resolv.conf', isCorrect: true },
                { text: '/etc/dns.conf', isCorrect: false },
                { text: '/etc/nameserver', isCorrect: false },
              ]},
              { text: 'What DNS record type maps a domain to an IPv4 address?', answers: [
                { text: 'AAAA', isCorrect: false },
                { text: 'CNAME', isCorrect: false },
                { text: 'A', isCorrect: true },
                { text: 'MX', isCorrect: false },
              ]},
              { text: 'Which command performs a DNS reverse lookup?', answers: [
                { text: 'dig -x IP', isCorrect: true },
                { text: 'dig reverse IP', isCorrect: false },
                { text: 'nslookup -reverse IP', isCorrect: false },
                { text: 'host -r IP', isCorrect: false },
              ]},
              { text: 'What does the /etc/hosts file do?', answers: [
                { text: 'Configures DNS servers', isCorrect: false },
                { text: 'Provides local hostname-to-IP mappings', isCorrect: true },
                { text: 'Stores DNS cache', isCorrect: false },
                { text: 'Lists remote DNS zones', isCorrect: false },
              ]},
              { text: 'Which tool flushes the systemd-resolved DNS cache?', answers: [
                { text: 'resolvectl flush-caches', isCorrect: true },
                { text: 'systemd-resolve --flush', isCorrect: false },
                { text: 'dns-flush', isCorrect: false },
                { text: 'resolvectl clear-cache', isCorrect: false },
              ]},
              { text: 'What MX record specifies for a domain?', answers: [
                { text: 'The mail server address', isCorrect: true },
                { text: 'The web server address', isCorrect: false },
                { text: 'The nameserver', isCorrect: false },
                { text: 'The IPv6 address', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Network Configuration', order: 3,
            content: `# Network Configuration

### Learning Objectives
- Configure network interfaces using netplan and nmcli
- Set up static IP addresses and DNS resolution
- Manage network connections with NetworkManager
- Configure bonding and VLANs for advanced networking

### Section 1: Netplan (Ubuntu)

\`\`\`yaml
# /etc/netplan/01-config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
        search: [example.com]
\`\`\`

\`\`\`bash
# Apply netplan configuration
sudo netplan apply
sudo netplan try  # Temporary for testing
\`\`\`

### Section 2: NetworkManager (nmcli)

\`\`\`bash
# Show connections
nmcli connection show
nmcli device status

# Add static connection
nmcli connection add type ethernet con-name office \
    ifname eth0 \
    ipv4.addresses 192.168.1.100/24 \
    ipv4.gateway 192.168.1.1 \
    ipv4.dns "8.8.8.8 1.1.1.1" \
    ipv4.method manual

# Activate connection
nmcli connection up office

# Modify existing connection
nmcli connection modify office ipv4.dns "8.8.8.8"
\`\`\`

### Section 3: Network Bonding

\`\`\`yaml
# /etc/netplan/02-bonding.yaml
network:
  version: 2
  bonds:
    bond0:
      interfaces: [eth0, eth1]
      addresses: [10.0.0.10/24]
      gateway4: 10.0.0.1
      parameters:
        mode: 802.3ad  # LACP
        mii-monitor-interval: 100
      nameservers:
        addresses: [8.8.8.8]
\`\`\`

### Section 4: VLAN Configuration

\`\`\`yaml
# /etc/netplan/03-vlan.yaml
network:
  version: 2
  vlans:
    vlan100:
      id: 100
      link: eth0
      addresses: [10.100.0.10/24]
    vlan200:
      id: 200
      link: eth0
      addresses: [10.200.0.10/24]
\`\`\`

### Section 5: Diagnostic Commands

\`\`\`bash
# Check connectivity
ping -c 4 8.8.8.8
traceroute example.com
mtr example.com  # Real-time traceroute

# Check DNS resolution
resolvectl query example.com

# Check interface statistics
ip -s link show eth0
ethtool eth0
\`\`\`

### Key Takeaways
- Netplan is the modern network configuration tool for Ubuntu
- nmcli provides command-line NetworkManager management
- Bonding combines multiple interfaces for redundancy and throughput
- VLANs segment networks for security and organization
- Use mtr for real-time network path analysis

### References
1. [Netplan Documentation](https://netplan.io/)
2. [NetworkManager nmcli](https://networkmanager.dev/docs/api/latest/nmcli.html)
3. [Linux Networking Documentation](https://www.kernel.org/doc/Documentation/networking/)`,
            questions: [
              { text: 'What is the correct netplan configuration command?', answers: [
                { text: 'netplan set', isCorrect: false },
                { text: 'netplan apply', isCorrect: true },
                { text: 'netplan config', isCorrect: false },
                { text: 'netplan load', isCorrect: false },
              ]},
              { text: 'What does nmcli connection up do?', answers: [
                { text: 'Creates a new connection', isCorrect: false },
                { text: 'Activates a network connection', isCorrect: true },
                { text: 'Updates connection settings', isCorrect: false },
                { text: 'Shows connection details', isCorrect: false },
              ]},
              { text: 'What is network bonding used for?', answers: [
                { text: 'Encrypting network traffic', isCorrect: false },
                { text: 'Combining multiple interfaces for redundancy/performance', isCorrect: true },
                { text: 'Creating virtual machines', isCorrect: false },
                { text: 'Configuring DNS', isCorrect: false },
              ]},
              { text: 'What netplan mode provides LACP bonding?', answers: [
                { text: 'mode: balance-rr', isCorrect: false },
                { text: 'mode: active-backup', isCorrect: false },
                { text: 'mode: 802.3ad', isCorrect: true },
                { text: 'mode: balance-xor', isCorrect: false },
              ]},
              { text: 'What tool provides real-time network path analysis?', answers: [
                { text: 'ping', isCorrect: false },
                { text: 'traceroute', isCorrect: false },
                { text: 'mtr', isCorrect: true },
                { text: 'curl', isCorrect: false },
              ]},
              { text: 'What does the ip -s link show command display?', answers: [
                { text: 'IP addresses only', isCorrect: false },
                { text: 'Interface statistics including packet counts', isCorrect: true },
                { text: 'Routing table', isCorrect: false },
                { text: 'DNS configuration', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'SSH Configuration and Security', order: 4,
            content: `# SSH Configuration and Security

### Learning Objectives
- Generate and manage SSH key pairs
- Configure SSH server for hardened security
- Set up SSH jump hosts and tunneling
- Use ssh-agent and config for efficient workflows

### Section 1: SSH Key Management

\`\`\`bash
# Generate ED25519 key pair (recommended)
ssh-keygen -t ed25519 -C "user@example.com"

# Generate RSA key pair (4096-bit)
ssh-keygen -t rsa -b 4096 -C "user@example.com"

# Copy public key to server
ssh-copy-id user@server

# List keys
ssh-add -l
\`\`\`

### Section 2: Hardened sshd_config

\`\`\`bash
# /etc/ssh/sshd_config

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
MaxAuthTries 3
MaxSessions 5

# Access Control
AllowUsers admin deploy
AllowGroups sshusers

# Cryptography
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Session
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 30

# Forwarding
AllowTcpForwarding no
X11Forwarding no
AllowAgentForwarding no

# Logging
LogLevel VERBOSE
\`\`\`

### Section 3: SSH Config for Efficiency

\`\`\`bash
# ~/.ssh/config
Host server1
    HostName 192.168.1.10
    User admin
    Port 2222
    IdentityFile ~/.ssh/server1_key

Host jump
    HostName jump.example.com
    User admin

Host internal-*
    ProxyJump jump
    User admin

Host internal-db
    HostName 10.0.0.50
\`\`\`

\`\`\`bash
# Connect using config aliases
ssh server1
ssh internal-db  # Automatically jumps through jump host
\`\`\`

### Section 4: SSH Tunneling

\`\`\`bash
# Local port forwarding (access remote MySQL locally)
ssh -L 3306:localhost:3306 user@db-server

# Remote port forwarding (expose local service)
ssh -R 8080:localhost:3000 user@public-server

# Dynamic SOCKS proxy
ssh -D 1080 user@server

# Use with proxychains
proxychains curl http://internal-service.local
\`\`\`

### Section 5: SSH Agent

\`\`\`bash
# Start agent
eval "$(ssh-agent -s)"

# Add key
ssh-add ~/.ssh/id_ed25519

# Forward agent to server
ssh -A user@server

# List loaded keys
ssh-add -l
\`\`\`

### Key Takeaways
- Use ED25519 keys for best performance and security
- Disable password authentication in production
- Use SSH config files to simplify complex connection patterns
- SSH tunneling provides secure access to internal services
- Limit root login and use AllowUsers/AllowGroups for access control

### References
1. "SSH, The Secure Shell" by Daniel Barrett
2. [OpenSSH Server Configuration](https://man.openbsd.org/sshd_config)
3. [SSH Tunneling Guide](https://www.ssh.com/ssh/tunneling/)`,
            questions: [
              { text: 'Which SSH key type is recommended for modern use?', answers: [
                { text: 'RSA 2048', isCorrect: false },
                { text: 'DSA', isCorrect: false },
                { text: 'ED25519', isCorrect: true },
                { text: 'ECDSA', isCorrect: false },
              ]},
              { text: 'What sshd_config directive disables root login?', answers: [
                { text: 'DenyRoot yes', isCorrect: false },
                { text: 'PermitRootLogin no', isCorrect: true },
                { text: 'RootAccess disabled', isCorrect: false },
                { text: 'LoginAsRoot no', isCorrect: false },
              ]},
              { text: 'What does ssh-copy-id do?', answers: [
                { text: 'Creates a new SSH key', isCorrect: false },
                { text: 'Copies public key to remote server', isCorrect: true },
                { text: 'Copies private key securely', isCorrect: false },
                { text: 'Generates SSH config', isCorrect: false },
              ]},
              { text: 'What does ProxyJump in SSH config enable?', answers: [
                { text: 'Direct connection', isCorrect: false },
                { text: 'Jump host/bastion access pattern', isCorrect: true },
                { text: 'SOCKS proxy', isCorrect: false },
                { text: 'Agent forwarding', isCorrect: false },
              ]},
              { text: 'What does the -L flag do in SSH?', answers: [
                { text: 'Local port forwarding', isCorrect: true },
                { text: 'List all connections', isCorrect: false },
                { text: 'Login with specific user', isCorrect: false },
                { text: 'Local agent forwarding', isCorrect: false },
              ]},
              { text: 'Why should AgentForwarding be disabled on production servers?', answers: [
                { text: 'It reduces performance', isCorrect: false },
                { text: 'A compromised server could use forwarded agent keys', isCorrect: true },
                { text: 'It only works with RSA keys', isCorrect: false },
                { text: 'It conflicts with firewall rules', isCorrect: false },
              ]},
            ],
          },
        ],
      },
      {
        title: 'Firewalls & VPNs', order: 2,
        lessons: [
          {
            title: 'iptables Fundamentals', order: 1,
            content: `# iptables Fundamentals

### Learning Objectives
- Understand iptables chains and tables
- Create rules for input filtering and port blocking
- Configure NAT for port forwarding and masquerading
- Save and restore iptables rules

### Section 1: Tables and Chains

| Table | Purpose | Chains |
|-------|---------|--------|
| filter | Packet filtering (default) | INPUT, OUTPUT, FORWARD |
| nat | Network address translation | PREROUTING, OUTPUT, POSTROUTING |
| mangle | Packet modification | All chains |
| raw | Connection tracking bypass | PREROUTING, OUTPUT |

**Packet Flow:** PREROUTING -> ROUTING -> FORWARD/INPUT -> LOCAL PROCESS -> OUTPUT -> POSTROUTING

### Section 2: Basic Rules

\`\`\`bash
# Show current rules
sudo iptables -L -n -v

# Allow all traffic (default policy)
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT

# Drop all incoming traffic (lockdown mode)
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP

# Allow established connections
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow ICMP (ping)
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT
\`\`\`

### Section 3: Rate Limiting and Anti-Brute-Force

\`\`\`bash
# Rate limit SSH connections
sudo iptables -A INPUT -p tcp --dport 22 \
    -m conntrack --ctstate NEW \
    -m recent --set --name SSH

sudo iptables -A INPUT -p tcp --dport 22 \
    -m conntrack --ctstate NEW \
    -m recent --update --seconds 60 --hitcount 4 --name SSH -j DROP

# Limit new connections per IP
sudo iptables -A INPUT -p tcp --dport 443 \
    -m connlimit --connlimit-above 50 --connlimit-mask 32 -j DROP
\`\`\`

### Section 4: NAT Configuration

\`\`\`bash
# Enable IP forwarding
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward

# Masquerade (hide internal network)
sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE

# Port forwarding (8080 -> internal:80)
sudo iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 192.168.1.10:80
sudo iptables -A FORWARD -p tcp -d 192.168.1.10 --dport 80 -j ACCEPT
\`\`\`

### Section 5: Save and Restore

\`\`\`bash
# Save rules (Debian/Ubuntu)
sudo iptables-save > /etc/iptables/rules.v4
sudo ip6tables-save > /etc/iptables/rules.v6

# Restore rules
sudo iptables-restore < /etc/iptables/rules.v4

# Install persistence package
sudo apt install iptables-persistent
\`\`\`

### Key Takeaways
- iptables uses tables (filter, nat, mangle) and chains (INPUT, OUTPUT, FORWARD)
- Default policies determine what happens to unmatched traffic
- Rate limiting protects against brute-force attacks
- NAT enables masquerading and port forwarding
- Always save rules for persistence across reboots

### References
1. [iptables man page](https://man7.org/linux/man-pages/man8/iptables.8.html)
2. [Linux Firewalls by Steve Suehring](https://www.netfilter.org/)
3. [iptables Tutorial](https://www.frozentux.net/iptables-tutorial/)`,
            questions: [
              { text: 'Which iptables table handles packet filtering?', answers: [
                { text: 'nat', isCorrect: false },
                { text: 'mangle', isCorrect: false },
                { text: 'filter', isCorrect: true },
                { text: 'raw', isCorrect: false },
              ]},
              { text: 'What does the -A flag do in iptables?', answers: [
                { text: 'Append a rule', isCorrect: true },
                { text: 'Delete a rule', isCorrect: false },
                { text: 'List all rules', isCorrect: false },
                { text: 'Apply a rule', isCorrect: false },
              ]},
              { text: 'Which chain handles incoming packets destined for the local system?', answers: [
                { text: 'FORWARD', isCorrect: false },
                { text: 'OUTPUT', isCorrect: false },
                { text: 'INPUT', isCorrect: true },
                { text: 'PREROUTING', isCorrect: false },
              ]},
              { text: 'What does iptables MASQUERADE do?', answers: [
                { text: 'Blocks all traffic', isCorrect: false },
                { text: 'Hides internal IP addresses behind the router', isCorrect: true },
                { text: 'Encrypts network traffic', isCorrect: false },
                { text: 'Logs all connections', isCorrect: false },
              ]},
              { text: 'Which command saves iptables rules?', answers: [
                { text: 'iptables save', isCorrect: false },
                { text: 'iptables-save > file', isCorrect: true },
                { text: 'iptables -save', isCorrect: false },
                { text: 'iptables store', isCorrect: false },
              ]},
              { text: 'What does -m conntrack --ctstate ESTABLISHED,RELATED match?', answers: [
                { text: 'New connections only', isCorrect: false },
                { text: 'Packets belonging to existing or related connections', isCorrect: true },
                { text: 'All packets', isCorrect: false },
                { text: 'Invalid packets', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'nftables Modern Firewall', order: 2,
            content: `# nftables Modern Firewall

### Learning Objectives
- Understand nftables as the successor to iptables
- Write nftables rulesets with tables, chains, and rules
- Migrate from iptables to nftables
- Use nftables for packet filtering and NAT

### Section 1: nftables vs iptables

| Feature | iptables | nftables |
|---------|----------|----------|
| Performance | Slower (per-rule evaluation) | Faster (rule concatenation) |
| Syntax | Verbose | Cleaner, more consistent |
| Sets | Limited | Built-in, efficient |
| IPv4/IPv6 | Separate tools | Unified |
| Atomic ruleset | No | Yes |

### Section 2: Basic nftables Rules

\`\`\`bash
# List all rules
sudo nft list ruleset

# Create a table and chain
sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'

# Allow established connections
sudo nft add rule inet filter input ct state established,related accept

# Allow loopback
sudo nft add rule inet filter input iif lo accept

# Allow SSH
sudo nft add rule inet filter input tcp dport 22 accept

# Allow HTTP/HTTPS
sudo nft add rule inet filter input tcp dport { 80, 443 } accept

# Allow ICMP
sudo nft add rule inet filter input ip protocol icmp accept
\`\`\`

### Section 3: Complete Ruleset File

\`\`\`nft
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    set blacklist {
        type ipv4_addr
        flags timeout
        timeout 1h
    }

    chain input {
        type filter hook input priority 0; policy drop;

        # Allow established
        ct state established,related accept

        # Drop invalid
        ct state invalid drop

        # Loopback
        iif lo accept

        # Anti-spoofing
        iif != lo ip saddr 127.0.0.0/8 drop

        # Rate limit ICMP
        ip protocol icmp limit rate 10/second accept

        # Drop blacklisted IPs
        ip saddr @blacklist drop

        # SSH with rate limit
        tcp dport 22 ct state new limit rate 3/minute accept

        # HTTP/HTTPS
        tcp dport { 80, 443 } accept

        # Log and drop everything else
        limit rate 5/minute log prefix "DROPPED: " counter drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}
\`\`\`

### Section 4: NAT with nftables

\`\`\`nft
table ip nat {
    chain prerouting {
        type nat hook prerouting priority -100;
        tcp dport 8080 dnat to 192.168.1.10:80
    }

    chain postrouting {
        type nat hook postrouting priority 100;
        oif eth0 masquerade
    }
}
\`\`\`

### Section 5: Management Commands

\`\`\`bash
# Load ruleset
sudo nft -f /etc/nftables.conf

# Add rule interactively
sudo nft add rule inet filter input tcp dport 8443 accept

# Delete rule by handle
sudo nft -a list chain inet filter input  # Show handles
sudo nft delete rule inet filter input handle 5

# Monitor changes
nft monitor
\`\`\`

### Key Takeaways
- nftables is the modern replacement for iptables
- Unified handling of IPv4 and IPv6 with cleaner syntax
- Sets provide efficient IP matching for blacklists and whitelists
- Atomic ruleset replacement ensures consistent configuration
- Built-in rate limiting and logging capabilities

### References
1. [nftables Wiki](https://wiki.nftables.org/)
2. [nftables man page](https://man7.org/linux/man-pages/man8/nft.8.html)
3. [How to migrate from iptables to nftables](https://wiki.nftables.org/wiki-nftables/index.php/Migrating_rules_from_iptables_to_nftables)`,
            questions: [
              { text: 'What is the primary advantage of nftables over iptables?', answers: [
                { text: 'More tables', isCorrect: false },
                { text: 'Faster performance and cleaner syntax', isCorrect: true },
                { text: 'Better Windows support', isCorrect: false },
                { text: 'More chain types', isCorrect: false },
              ]},
              { text: 'What command flushes all nftables rules?', answers: [
                { text: 'nft flush', isCorrect: false },
                { text: 'nft flush ruleset', isCorrect: true },
                { text: 'nft -F', isCorrect: false },
                { text: 'nft delete all', isCorrect: false },
              ]},
              { text: 'How do you define a drop chain in nftables?', answers: [
                { text: 'nft add chain inet filter input \'{ type filter hook input priority 0; policy drop; }\'', isCorrect: true },
                { text: 'nft create chain inet filter input DROP', isCorrect: false },
                { text: 'nft set policy drop input', isCorrect: false },
                { text: 'nft chain input policy drop', isCorrect: false },
              ]},
              { text: 'What does the \'ct state established,related accept\' rule do?', answers: [
                { text: 'Blocks all traffic', isCorrect: false },
                { text: 'Allows packets belonging to existing connections', isCorrect: true },
                { text: 'Accepts only new connections', isCorrect: false },
                { text: 'Logs all connection states', isCorrect: false },
              ]},
              { text: 'What nftables feature provides efficient IP blacklisting?', answers: [
                { text: 'Lists', isCorrect: false },
                { text: 'Sets', isCorrect: true },
                { text: 'Maps', isCorrect: false },
                { text: 'Queues', isCorrect: false },
              ]},
              { text: 'What does \'nft monitor\' do?', answers: [
                { text: 'Monitors CPU usage', isCorrect: false },
                { text: 'Shows real-time rule changes', isCorrect: true },
                { text: 'Lists all tables', isCorrect: false },
                { text: 'Checks ruleset syntax', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'VPN Configuration', order: 3,
            content: `# VPN Configuration

### Learning Objectives
- Understand VPN technologies (OpenVPN, WireGuard, IPSec)
- Configure a WireGuard VPN server
- Set up OpenVPN with certificate-based authentication
- Implement split tunneling and routing

### Section 1: VPN Technologies Comparison

| Feature | WireGuard | OpenVPN | IPSec |
|---------|-----------|---------|-------|
| Speed | Fastest | Good | Good |
| Codebase | ~4,000 lines | ~100,000 lines | Complex |
| Configuration | Simple | Moderate | Complex |
| UDP Only | Yes | TCP/UDP | UDP |
| Mobile Support | Excellent | Good | Good |

### Section 2: WireGuard Server Setup

\`\`\`bash
# Install WireGuard
sudo apt install wireguard

# Generate server keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <server_private_key>
PostUp = iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE

[Peer]
PublicKey = <client_public_key>
AllowedIPs = 10.0.0.2/32
\`\`\`

### Section 3: WireGuard Client Configuration

\`\`\`ini
# /etc/wireguard/wg0.conf (client)
[Interface]
Address = 10.0.0.2/24
PrivateKey = <client_private_key>
DNS = 8.8.8.8

[Peer]
PublicKey = <server_public_key>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0  # Route all traffic through VPN
PersistentKeepalive = 25
\`\`\`

### Section 4: OpenVPN Server Setup

\`\`\`bash
# Install OpenVPN and Easy-RSA
sudo apt install openvpn easy-rsa

# Initialize PKI
make-cadir ~/openvpn-ca
cd ~/openvpn-ca
./easyrsa init-pki
./easyrsa build-ca
./easyrsa gen-req server nopass
./easyrsa sign-req server server
openvpn --genkey secret /etc/openvpn/ta.key

# Generate client certificate
./easyrsa gen-req client1 nopass
./easyrsa sign-req client client1
\`\`\`

### Section 5: OpenVPN Server Configuration

\`\`\`conf
# /etc/openvpn/server.conf
port 1194
proto udp
dev tun

ca /etc/openvpn/ca.crt
cert /etc/openvpn/server.crt
key /etc/openvpn/server.key
dh /etc/openvpn/dh2048.pem
tls-auth /etc/openvpn/ta.key 0

server 10.8.0.0 255.255.255.0
push "redirect-gateway def1"
push "dhcp-option DNS 8.8.8.8"

keepalive 10 120
cipher AES-256-GCM
user nobody
group nogroup
persist-key
persist-tun
status /var/log/openvpn-status.log
verb 3
\`\`\`

### Section 6: Management Commands

\`\`\`bash
# WireGuard
sudo wg-quick up wg0
sudo wg-quick down wg0
sudo wg show

# OpenVPN
sudo systemctl start openvpn@server
sudo systemctl status openvpn@server
\`\`\`

### Key Takeaways
- WireGuard is faster and simpler than OpenVPN
- OpenVPN offers more flexibility with TCP/UDP and extensive configuration
- Use certificate-based authentication for both
- Split tunneling routes only specific traffic through VPN
- Always use TLS authentication in addition to certificates

### References
1. [WireGuard Documentation](https://www.wireguard.com/)
2. [OpenVPN How-To](https://openvpn.net/community-resources/)
3. [WireGuard vs OpenVPN comparison](https://www.wireguard.com/performances/)`,
            questions: [
              { text: 'What is the main advantage of WireGuard over OpenVPN?', answers: [
                { text: 'Supports more protocols', isCorrect: false },
                { text: 'Faster performance and simpler configuration', isCorrect: true },
                { text: 'Better Windows support', isCorrect: false },
                { text: 'Supports more encryption algorithms', isCorrect: false },
              ]},
              { text: 'What does AllowedIPs = 0.0.0.0/0 mean in WireGuard?', answers: [
                { text: 'Block all traffic', isCorrect: false },
                { text: 'Route all IPv4 traffic through the VPN', isCorrect: true },
                { text: 'Only allow local traffic', isCorrect: false },
                { text: 'Allow traffic to any single IP', isCorrect: false },
              ]},
              { text: 'What does the PostUp directive do in WireGuard?', answers: [
                { text: 'Starts the VPN tunnel', isCorrect: false },
                { text: 'Runs a command after the interface is up', isCorrect: true },
                { text: 'Updates the server configuration', isCorrect: false },
                { text: 'Connects to a peer', isCorrect: false },
              ]},
              { text: 'What tool is used to manage OpenVPN certificates?', answers: [
                { text: 'openssl', isCorrect: false },
                { text: 'easy-rsa', isCorrect: true },
                { text: 'certbot', isCorrect: false },
                { text: 'ca-certificates', isCorrect: false },
              ]},
              { text: 'What does push \'redirect-gateway def1\' do in OpenVPN?', answers: [
                { text: 'Redirects DNS only', isCorrect: false },
                { text: 'Routes all client traffic through the VPN', isCorrect: true },
                { text: 'Redirects specific subnets', isCorrect: false },
                { text: 'Enables split tunneling', isCorrect: false },
              ]},
              { text: 'Which command shows WireGuard interface status?', answers: [
                { text: 'wg status', isCorrect: false },
                { text: 'wg show', isCorrect: true },
                { text: 'wireguard status', isCorrect: false },
                { text: 'ip link show wg0', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Firewall Hardening', order: 4,
            content: `# Firewall Hardening

### Learning Objectives
- Implement defense-in-depth firewall strategies
- Configure fail2ban for automatic IP banning
- Set up intrusion prevention with firewall rules
- Create rules for application hardening

### Section 1: Defense-in-Depth

Layer 1: Network firewall (cloud provider)
Layer 2: Host firewall (iptables/nftables)
Layer 3: Application firewall (fail2ban)
Layer 4: Service-level restrictions (sshd_config)

### Section 2: fail2ban Setup





### Section 3: Custom fail2ban Filters



### Section 4: Application Hardening



### Section 5: Monitoring



### Key Takeaways
- Apply defense-in-depth with multiple firewall layers
- fail2ban automatically bans IPs based on log patterns
- Rate limiting prevents brute-force and DoS attacks
- Monitor logs regularly for suspicious activity

### References
1. fail2ban Documentation
2. nftables Wiki
3. Linux Security Hardening Guide`,
            questions: [
              { text: 'What is the default action of fail2ban when maxretry is reached?', answers: [
                { text: 'Log the IP address', isCorrect: false },
                { text: 'Ban the IP address', isCorrect: true },
                { text: 'Block the port', isCorrect: false },
                { text: 'Restart the service', isCorrect: false },
              ]},
              { text: 'What does fail2ban filter regex <HOST> represent?', answers: [
                { text: 'The server hostname', isCorrect: false },
                { text: 'The attacking IP address', isCorrect: true },
                { text: 'The attacked port', isCorrect: false },
                { text: 'The fail2ban server', isCorrect: false },
              ]},
              { text: 'What does bantime=86400 mean in fail2ban?', answers: [
                { text: 'Ban for 86 minutes', isCorrect: false },
                { text: 'Ban for 24 hours', isCorrect: true },
                { text: 'Ban for 8640 seconds', isCorrect: false },
                { text: 'Ban permanently', isCorrect: false },
              ]},
              { text: 'What is defense-in-depth in firewall strategy?', answers: [
                { text: 'Using one strong firewall', isCorrect: false },
                { text: 'Multiple layers of security controls', isCorrect: true },
                { text: 'Only using cloud firewalls', isCorrect: false },
                { text: 'Disabling unused services', isCorrect: false },
              ]},
              { text: 'Which command unbans an IP from fail2ban sshd jail?', answers: [
                { text: 'fail2ban-client set sshd unbanip IP', isCorrect: true },
                { text: 'fail2ban-client banremove IP', isCorrect: false },
                { text: 'fail2ban-client delete sshd IP', isCorrect: false },
                { text: 'fail2ban-client unban sshd IP', isCorrect: false },
              ]},
            ],
          },
        ],
      },
      {
        title: 'Intrusion Detection & Monitoring', order: 3,
        lessons: [
          {
            title: 'Snort Intrusion Detection', order: 1,
            content: `# Snort Intrusion Detection

### Learning Objectives
- Install and configure Snort as an IDS/IPS
- Write custom Snort rules for network monitoring
- Analyze Snort alerts and logs
- Integrate Snort with logging infrastructure

### Section 1: Snort Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Sniffer | Reads packets and displays them | Real-time debugging |
| Packet Logger | Logs packets to disk | Forensics |
| NIDS | Network intrusion detection | Production monitoring |
| NIPS | Network intrusion prevention | Inline blocking |

### Section 2: Installation and Basic Configuration

\`\`\`bash
# Install Snort
sudo apt install snort

# Verify installation
snort --version

# Test in sniffer mode
sudo snort -v -i eth0

# Test in packet logger mode
sudo snort -dev -l /var/log/snort
\`\`\`

### Section 3: NIDS Configuration

\`\`\`bash
# /etc/snort/snort.conf
# Set network variables
var HOME_NET 192.168.1.0/24
var EXTERNAL_NET !$HOME_NET

# Configure rules
include /etc/snort/rules/local.rules
include /etc/snort/rules/community.rules

# Output plugins
output unified2: filename snort.log, limit 128
\`\`\`

### Section 4: Writing Custom Rules

\`\`\`bash
# /etc/snort/rules/local.rules

# Detect SSH brute force
alert tcp any any -> $HOME_NET 22 (msg:"SSH Brute Force Attempt";     flags:S; threshold:type threshold, track by_src, count 5, seconds 60;     sid:1000001; rev:1;)

# Detect SQL injection attempts
alert http any any -> $HOME_NET 80 (msg:"SQL Injection Attempt";     content:"SELECT"; nocase; content:"FROM"; nocase;     content:"UNION"; nocase;     sid:1000002; rev:1;)

# Detect port scanning
alert tcp any any -> $HOME_NET any (msg:"Port Scan Detected";     flags:S; threshold:type threshold, track by_src, count 20, seconds 10;     sid:1000003; rev:1;)

# Detect DNS tunneling
alert udp any any -> any 53 (msg:"Possible DNS Tunneling";     content:"|01 00|"; depth:2; byte_test:1,>,12,2;     sid:1000004; rev:1;)
\`\`\`

### Section 5: Running Snort as NIDS

\`\`\`bash
# Run Snort with specific configuration
sudo snort -c /etc/snort/snort.conf -i eth0 -A fast

# Daemon mode
sudo snort -c /etc/snort/snort.conf -i eth0 -D

# Check Snort status
sudo systemctl status snort
\`\`\`

### Section 6: Analyzing Alerts

\`\`\`bash
# View alert log
tail -f /var/log/snort/alert

# Parse unified2 logs
sudo snort -r /var/log/snort/snort.log.1234567890 -c /etc/snort/snort.conf

# Use Barnyard2 for log processing
sudo barnyard2 -c /etc/snort/barnyard2.conf -d /var/log/snort -w /var/log/snort/barnyard2
\`\`\`

### Key Takeaways
- Snort can operate in sniffer, logger, IDS, or IPS mode
- Custom rules enable detection of specific attack patterns
- Threshold-based rules prevent alert flooding
- Unified2 format provides detailed packet logging
- Regular rule updates are essential for effective detection

### References
1. [Snort Documentation](https://www.snort.org/documents)
2. [Snort Rules Tutorial](https://www.snort.org/documents#11)
3. [Oinkmaster for rule updates](https://oisf.net/idspup/)`,
            questions: [
              { text: 'What Snort mode runs inline and can block packets?', answers: [
                { text: 'NIDS', isCorrect: false },
                { text: 'Sniffer', isCorrect: false },
                { text: 'NIPS', isCorrect: true },
                { text: 'Packet Logger', isCorrect: false },
              ]},
              { text: 'What does the threshold directive in Snort rules do?', answers: [
                { text: 'Limits alert frequency', isCorrect: true },
                { text: 'Sets packet capture size', isCorrect: false },
                { text: 'Defines rule priority', isCorrect: false },
                { text: 'Configures log rotation', isCorrect: false },
              ]},
              { text: 'What format does Snort use for detailed packet logging?', answers: [
                { text: 'syslog', isCorrect: false },
                { text: 'unified2', isCorrect: true },
                { text: 'CSV', isCorrect: false },
                { text: 'JSON', isCorrect: false },
              ]},
              { text: 'What does var HOME_NET define in snort.conf?', answers: [
                { text: 'The external network to monitor', isCorrect: false },
                { text: 'The internal network being protected', isCorrect: true },
                { text: 'The Snort server IP', isCorrect: false },
                { text: 'The log directory path', isCorrect: false },
              ]},
              { text: 'Which flag in a Snort rule specifies the rule identifier?', answers: [
                { text: 'rev:', isCorrect: false },
                { text: 'msg:', isCorrect: false },
                { text: 'sid:', isCorrect: true },
                { text: 'class:', isCorrect: false },
              ]},
              { text: 'What tool processes unified2 logs for database storage?', answers: [
                { text: 'snort-log', isCorrect: false },
                { text: 'Barnyard2', isCorrect: true },
                { text: 'logparser', isCorrect: false },
                { text: 'snortdb', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Suricata Intrusion Detection', order: 2,
            content: `# Suricata Intrusion Detection

### Learning Objectives
- Understand Suricata as a multi-threaded IDS/IPS
- Configure Suricata rules and detection engine
- Use EVE JSON logging for SIEM integration
- Compare Suricata vs Snort

### Section 1: Suricata vs Snort

| Feature | Suricata | Snort |
|---------|----------|-------|
| Threading | Multi-threaded | Single-threaded |
| Performance | Better on multi-core | Good on single core |
| Protocol Analysis | HTTP, TLS, DNS, SMB | Basic |
| Lua Scripting | Yes | No |
| Rule Compatibility | Snort rules | Native |

### Section 2: Installation

\`\`\`bash
# Install Suricata
sudo apt install suricata

# Update rules
sudo suricata-update

# Verify installation
suricata --build-info
\`\`\`

### Section 3: Configuration

\`\`\`yaml
# /etc/suricata/suricata.yaml
stats:
  enabled: yes
  interval: 30

outputs:
  - fast:
      enabled: yes
      filename: fast.log
  - eve-log:
      enabled: yes
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - files
  - unified2:
      enabled: no

af-packet:
  - interface: eth0
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes

detect:
  profile: medium
  sgh-mpm-context: auto

mpm-algo: auto
spm-algo: auto
\`\`\`

### Section 4: Rule Writing

\`\`\`bash
# /etc/suricata/rules/local.rules

# Detect malicious User-Agent
alert http any any -> any any (msg:"Malicious User-Agent";     http.header; content:"curl"; nocase;     sid:2000001; rev:1;)

# Detect SMB exploits
alert smb any any -> any any (msg:"SMB Vulnerability Exploit";     flow:to_server; content:"|FF|SMB"; depth:4;     byte_test:1,&,0x80,4;     sid:2000002; rev:1;)

# Detect DNS exfiltration
alert dns any any -> any any (msg:"Possible DNS Exfiltration";     dns.query; pcre:"/^[a-z0-9]{30,}\.[a-z]+$/";     sid:2000003; rev:1;)
\`\`\`

### Section 5: EVE JSON for SIEM Integration

\`\`\`bash
# Query EVE JSON with jq
cat /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
cat /var/log/suricata/eve.json | jq 'select(.event_type=="http")'

# Filter by alert severity
cat /var/log/suricata/eve.json | jq 'select(.alert.severity <= 2)'
\`\`\`

### Section 6: Running Suricata

\`\`\`bash
# Test configuration
sudo suricata -T -c /etc/suricata/suricata.yaml

# Run in IDS mode
sudo suricata -c /etc/suricata/suricata.yaml -i eth0

# Run as service
sudo systemctl start suricata
sudo systemctl enable suricata

# Update rules
sudo suricata-update
sudo systemctl restart suricata
\`\`\`

### Key Takeaways
- Suricata offers multi-threaded performance advantages over Snort
- EVE JSON provides structured logging ideal for SIEM integration
- af-packet provides zero-copy packet capture for high performance
- Suricata is compatible with Snort rules
- Regular rule updates via suricata-update are essential

### References
1. [Suricata Documentation](https://suricata.readthedocs.io/)
2. [Suricata Rule Writing](https://suricata.readthedocs.io/en/latest/rules/)
3. [EVE JSON Format](https://suricata.readthedocs.io/en/latest/output/eve/eve-json-format.html)`,
            questions: [
              { text: 'What is Suricata\'s main advantage over Snort?', answers: [
                { text: 'Better rule syntax', isCorrect: false },
                { text: 'Multi-threaded performance', isCorrect: true },
                { text: 'Smaller binary size', isCorrect: false },
                { text: 'More output formats', isCorrect: false },
              ]},
              { text: 'What does suricata-update do?', answers: [
                { text: 'Updates the Suricata binary', isCorrect: false },
                { text: 'Downloads and installs latest detection rules', isCorrect: true },
                { text: 'Updates the configuration file', isCorrect: false },
                { text: 'Patches the kernel', isCorrect: false },
              ]},
              { text: 'What logging format is recommended for SIEM integration?', answers: [
                { text: 'fast.log', isCorrect: false },
                { text: 'unified2', isCorrect: false },
                { text: 'EVE JSON', isCorrect: true },
                { text: 'syslog', isCorrect: false },
              ]},
              { text: 'What does af-packet provide in Suricata?', answers: [
                { text: 'Application filtering', isCorrect: false },
                { text: 'Zero-copy packet capture', isCorrect: true },
                { text: 'Auto-filter packets', isCorrect: false },
                { text: 'Application firewall', isCorrect: false },
              ]},
              { text: 'How do you test Suricata configuration syntax?', answers: [
                { text: 'suricata --test', isCorrect: false },
                { text: 'suricata -T -c config.yaml', isCorrect: true },
                { text: 'suricata --validate', isCorrect: false },
                { text: 'suricata -C config.yaml', isCorrect: false },
              ]},
              { text: 'Can Suricata use Snort rules?', answers: [
                { text: 'No, they are incompatible', isCorrect: false },
                { text: 'Yes, Suricata is compatible with Snort rules', isCorrect: true },
                { text: 'Only with a conversion tool', isCorrect: false },
                { text: 'Only for basic rules', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Log Analysis and SIEM', order: 3,
            content: `# Log Analysis and SIEM

### Learning Objectives
- Centralize system and security logs with rsyslog
- Use grep, awk, and journalctl for log analysis
- Understand SIEM concepts and ELK stack basics
- Create log-based alerting rules

### Section 1: Linux Log Locations

| Log File | Content |
|----------|---------|
| /var/log/syslog | General system messages |
| /var/log/auth.log | Authentication events |
| /var/log/kern.log | Kernel messages |
| /var/log/nginx/ | Nginx access/error logs |
| /var/log/fail2ban.log | fail2ban ban actions |
| journalctl | Systemd journal |

### Section 2: Log Analysis with Command Line

\`\`\`bash
# Find failed SSH logins
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head

# Count requests by IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head

# Find 500 errors
awk '$9 >= 500 {print $0}' /var/log/nginx/access.log

# Monitor real-time logs
tail -f /var/log/nginx/access.log | grep "POST"

# Journalctl filtering
journalctl -u nginx --since "1 hour ago"
journalctl -p err --since today
journalctl -f -u sshd
\`\`\`

### Section 3: Centralized Logging with rsyslog

\`\`\`bash
# /etc/rsyslog.d/50-forwarding.conf
# Forward logs to central server
*.* @@192.168.1.200:514

# Or TCP
*.* @@192.168.1.200:514
\`\`\`

\`\`\`bash
# On central server - enable receiving
# /etc/rsyslog.d/10-receiving.conf
module(load="imudp")
input(type="imudp" port="514")
module(load="imtcp")
input(type="imtcp" port="514")

# Store by hostname
template RemoteLogs,"/var/log/remote/%HOSTNAME%/%PROGRAMNAME%.log"
*.* ?RemoteLogs
\`\`\`

### Section 4: ELK Stack Overview

\`\`\`
Elasticsearch - Storage and search engine
Logstash      - Log processing pipeline
Kibana        - Visualization dashboard
\`\`\`

\`\`\`yaml
# Filebeat agent configuration
# /etc/filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/nginx/access.log
  fields:
    type: nginx-access

- type: log
  enabled: true
  paths:
    - /var/log/auth.log
  fields:
    type: auth

output.elasticsearch:
  hosts: ["localhost:9200"]
\`\`\`

### Section 5: Log-Based Alerting

\`\`\`bash
# Simple cron-based alert
# /etc/cron.d/security-alert
*/5 * * * * root /usr/local/bin/check-auth.sh

# /usr/local/bin/check-auth.sh
#!/bin/bash
FAILED=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ "$FAILED" -gt 50 ]; then
    echo "ALERT: $FAILED failed SSH attempts in 5 minutes" | \
    mail -s "Security Alert" admin@example.com
fi
\`\`\`

### Key Takeaways
- Centralized logging enables correlation across multiple servers
- grep, awk, and journalctl are essential log analysis tools
- ELK stack provides powerful search, visualization, and alerting
- Regular log review is critical for security monitoring
- Forward logs to an external server to prevent tampering

### References
1. [rsyslog Documentation](https://www.rsyslog.com/doc/)
2. [Elastic Stack Documentation](https://www.elastic.co/guide/)
3. [Linux Log Files Guide](https://www.digitalocean.com/community/tutorials/linux-logs)`,
            questions: [
              { text: 'Which file contains SSH authentication events on Debian/Ubuntu?', answers: [
                { text: '/var/log/syslog', isCorrect: false },
                { text: '/var/log/auth.log', isCorrect: true },
                { text: '/var/log/secure', isCorrect: false },
                { text: '/var/log/messages', isCorrect: false },
              ]},
              { text: 'What does the ELK stack consist of?', answers: [
                { text: 'Elasticsearch, Logstash, Kibana', isCorrect: true },
                { text: 'Elasticsearch, Linux, Kubernetes', isCorrect: false },
                { text: 'Elastic, Log, Kibana', isCorrect: false },
                { text: 'Event, Log, Knowledge', isCorrect: false },
              ]},
              { text: 'What command shows journal entries from the last hour?', answers: [
                { text: 'journalctl -f', isCorrect: false },
                { text: 'journalctl --since \'1 hour ago\'', isCorrect: true },
                { text: 'journalctl -r 1h', isCorrect: false },
                { text: 'journalctl --last-hour', isCorrect: false },
              ]},
              { text: 'Why should logs be forwarded to a remote server?', answers: [
                { text: 'To save disk space', isCorrect: false },
                { text: 'To prevent attackers from deleting evidence', isCorrect: true },
                { text: 'To improve performance', isCorrect: false },
                { text: 'To enable compression', isCorrect: false },
              ]},
              { text: 'What is the purpose of Filebeat in the ELK stack?', answers: [
                { text: 'Search and query logs', isCorrect: false },
                { text: 'Visualize data', isCorrect: false },
                { text: 'Ship logs to Elasticsearch', isCorrect: true },
                { text: 'Parse log formats', isCorrect: false },
              ]},
              { text: 'What awk command filters Nginx 500+ errors?', answers: [
                { text: 'awk \'$9 >= 500\'', isCorrect: true },
                { text: 'awk \'/500/\'', isCorrect: false },
                { text: 'awk \'error >= 500\'', isCorrect: false },
                { text: 'awk \'status == 500\'', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Network Monitoring', order: 4,
            content: `# Network Monitoring

### Learning Objectives
- Capture and analyze network traffic with tcpdump
- Use nmap for network discovery and port scanning
- Set up network monitoring with Prometheus and Grafana
- Detect anomalies in network traffic patterns

### Section 1: tcpdump Packet Capture

\`\`\`bash
# Capture all traffic on interface
sudo tcpdump -i eth0

# Capture specific port
sudo tcpdump -i eth0 port 443

# Capture traffic from specific host
sudo tcpdump -i eth0 src host 192.168.1.100

# Write to file for analysis
sudo tcpdump -i eth0 -w /tmp/capture.pcap

# Read from file
tcpdump -r /tmp/capture.pcap

# Display in human-readable form
sudo tcpdump -i eth0 -A port 80
\`\`\`

### Section 2: nmap Network Scanning

\`\`\`bash
# Scan a target
nmap 192.168.1.1

# Scan entire subnet
nmap 192.168.1.0/24

# Service version detection
nmap -sV 192.168.1.1

# OS detection
nmap -O 192.168.1.1

# Stealth scan
nmap -sS 192.168.1.1

# Script scanning
nmap --script vuln 192.168.1.1
\`\`\`

### Section 3: Prometheus Network Metrics

\`\`\`yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
\`\`\`

\`\`\`bash
# Install node_exporter for system metrics
sudo apt install prometheus-node-exporter

# Install nginx-exporter
sudo apt install prometheus/nginx-exporter
\`\`\`

### Section 4: Grafana Dashboard

\`\`\`bash
# Install Grafana
sudo apt install grafana

# Start service
sudo systemctl start grafana-server

# Access at http://localhost:3000
# Default credentials: admin/admin

# Import dashboard ID 1860 (Node Exporter Full)
# Import dashboard ID 12708 (Nginx)
\`\`\`

### Section 5: Anomaly Detection

\`\`\`bash
# Simple anomaly detection script
#!/bin/bash
# Monitor connection count
while true; do
    CONNS=$(ss -s | awk '/^TCP:/ {print $4}' | tr -d ',')
    if [ "$CONNS" -gt 1000 ]; then
        echo "$(date): High connection count: $CONNS" >> /var/log/anomaly.log
    fi
    sleep 60
done
\`\`\`

### Key Takeaways
- tcpdump captures packets for offline analysis
- nmap discovers hosts, ports, and services on networks
- Prometheus and Grafana provide real-time network monitoring
- Node exporter exposes system metrics for Prometheus
- Baseline your normal traffic to detect anomalies

### References
1. [tcpdump man page](https://man7.org/linux/man-pages/man1/tcpdump.1.html)
2. [nmap Documentation](https://nmap.org/book/)
3. [Prometheus Documentation](https://prometheus.io/docs/)
4. [Grafana Documentation](https://grafana.com/docs/)`,
            questions: [
              { text: 'What tcpdump flag writes captured packets to a file?', answers: [
                { text: '-f', isCorrect: false },
                { text: '-w', isCorrect: true },
                { text: '-o', isCorrect: false },
                { text: '-d', isCorrect: false },
              ]},
              { text: 'What nmap flag performs service version detection?', answers: [
                { text: '-sS', isCorrect: false },
                { text: '-O', isCorrect: false },
                { text: '-sV', isCorrect: true },
                { text: '-A', isCorrect: false },
              ]},
              { text: 'What does Prometheus node_exporter do?', answers: [
                { text: 'Exports Prometheus config', isCorrect: false },
                { text: 'Exposes system metrics for scraping', isCorrect: true },
                { text: 'Monitors network nodes', isCorrect: false },
                { text: 'Exports Grafana dashboards', isCorrect: false },
              ]},
              { text: 'What is the default Grafana port?', answers: [
                { text: '80', isCorrect: false },
                { text: '9090', isCorrect: false },
                { text: '3000', isCorrect: true },
                { text: '8080', isCorrect: false },
              ]},
              { text: 'What nmap flag performs a stealth SYN scan?', answers: [
                { text: '-sT', isCorrect: false },
                { text: '-sV', isCorrect: false },
                { text: '-sS', isCorrect: true },
                { text: '-sU', isCorrect: false },
              ]},
              { text: 'What does the -A flag in tcpdump do?', answers: [
                { text: 'Captures all traffic', isCorrect: false },
                { text: 'Prints packets in ASCII', isCorrect: true },
                { text: 'Enables ARP resolution', isCorrect: false },
                { text: 'Appends to existing file', isCorrect: false },
              ]},
            ],
          },
        ],
      },
      {
        title: 'Network Troubleshooting', order: 4,
        lessons: [
          {
            title: 'Network Diagnostic Tools', order: 1,
            content: `# Network Diagnostic Tools

### Learning Objectives
- Master ping, traceroute, and mtr for connectivity testing
- Use curl and wget for HTTP debugging
- Debug DNS issues with dig and host
- Diagnose connection problems systematically

### Section 1: Connectivity Testing

\`\`\`bash
# Basic ping
ping -c 4 8.8.8.8

# Ping with specific packet size
ping -s 1472 -M do 8.8.8.8  # Test MTU

# Traceroute
traceroute example.com
traceroute -T example.com  # Use TCP

# Real-time route analysis
mtr example.com
mtr -r -c 100 example.com  # Report mode
\`\`\`

### Section 2: HTTP Debugging

\`\`\`bash
# Verbose HTTP request
curl -v https://example.com

# Show response headers
curl -I https://example.com

# Follow redirects
curl -L https://example.com

# Custom headers
curl -H "Authorization: Bearer token" https://api.example.com

# POST with data
curl -X POST -d '{"key":"value"}' -H "Content-Type: application/json" https://api.example.com

# Download with wget
wget --no-check-certificate https://example.com/file.zip
wget -r -l 1 https://example.com/  # Recursive download
\`\`\`

### Section 3: DNS Debugging

\`\`\`bash
# Query specific DNS server
dig @8.8.8.8 example.com

# Check specific record type
dig example.com MX
dig example.com TXT

# Trace full resolution path
dig +trace example.com

# Reverse DNS lookup
dig -x 93.184.216.34

# Quick lookup
host example.com
\`\`\`

### Section 4: Port and Connection Testing

\`\`\`bash
# Test port connectivity
nc -zv 192.168.1.1 80
nc -zv 192.168.1.1 22

# Telnet to port
telnet 192.168.1.1 443

# Test SSL certificate
openssl s_client -connect example.com:443 -servername example.com

# Check what's listening
ss -tlnp | grep :80
lsof -i :80
\`\`\`

### Section 5: Systematic Troubleshooting

\`\`\`
Step 1: Verify physical/data link
  ip link show eth0

Step 2: Verify IP configuration
  ip addr show eth0

Step 3: Verify default gateway
  ip route show

Step 4: Test gateway connectivity
  ping <gateway-ip>

Step 5: Test DNS resolution
  dig example.com

Step 6: Test remote host connectivity
  ping <remote-ip>

Step 7: Test specific service
  curl -v https://example.com
  nc -zv example.com 443
\`\`\`

### Key Takeaways
- mtr combines ping and traceroute for comprehensive path analysis
- curl -v provides detailed HTTP request/response debugging
- dig +trace shows the complete DNS resolution path
- Always test from physical layer up to application layer
- nc and openssl are invaluable for testing specific services

### References
1. [curl Documentation](https://curl.se/docs/)
2. [dig man page](https://man7.org/linux/man-pages/man1/dig.1.html)
3. [mtr documentation](https://www.bitwizard.nl/mtr/)`,
            questions: [
              { text: 'What does mtr combine into a single tool?', answers: [
                { text: 'ping and curl', isCorrect: false },
                { text: 'ping and traceroute', isCorrect: true },
                { text: 'dig and host', isCorrect: false },
                { text: 'ss and netstat', isCorrect: false },
              ]},
              { text: 'What curl flag follows HTTP redirects?', answers: [
                { text: '-v', isCorrect: false },
                { text: '-I', isCorrect: false },
                { text: '-L', isCorrect: true },
                { text: '-k', isCorrect: false },
              ]},
              { text: 'What does dig +trace show?', answers: [
                { text: 'Only the final answer', isCorrect: false },
                { text: 'The complete DNS resolution path from root servers', isCorrect: true },
                { text: 'DNS server configuration', isCorrect: false },
                { text: 'Network latency to DNS servers', isCorrect: false },
              ]},
              { text: 'What is the correct order for systematic network troubleshooting?', answers: [
                { text: 'Application -> Transport -> Network -> Link', isCorrect: false },
                { text: 'Physical -> Link -> Network -> Transport -> Application', isCorrect: true },
                { text: 'DNS -> Gateway -> Host -> Service', isCorrect: false },
                { text: 'Service -> Protocol -> Network -> Physical', isCorrect: false },
              ]},
              { text: 'What command tests SSL certificate validity?', answers: [
                { text: 'curl -I', isCorrect: false },
                { text: 'openssl s_client -connect host:443', isCorrect: true },
                { text: 'dig +short host', isCorrect: false },
                { text: 'nc -zv host 443', isCorrect: false },
              ]},
              { text: 'What curl flag shows verbose request/response headers?', answers: [
                { text: '-d', isCorrect: false },
                { text: '-H', isCorrect: false },
                { text: '-v', isCorrect: true },
                { text: '-x', isCorrect: false },
              ]},
            ],
          },
          {
            title: 'Common Network Issues', order: 2,
            content: `# Common Network Issues

### Learning Objectives
- Diagnose DNS resolution failures
- Troubleshoot firewall-related connectivity issues
- Resolve SSL/TLS certificate problems
- Fix common routing and MTU issues

### Section 1: DNS Issues

\`\`\`bash
# Symptoms: Cannot resolve hostnames
# Check DNS configuration
cat /etc/resolv.conf
resolvectl status

# Test DNS resolution
dig example.com
nslookup example.com

# Fix: Update DNS servers
sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'

# Flush DNS cache
resolvectl flush-caches

# Check /etc/hosts entries
grep example.com /etc/hosts
\`\`\`

### Section 2: Firewall Blocking

\`\`\`bash
# Symptoms: Connection refused or timeout
# Check if port is listening
ss -tlnp | grep :443

# Check iptables rules
sudo iptables -L -n | grep 443
sudo nft list ruleset | grep 443

# Test if firewall is blocking
sudo iptables -I INPUT -s <client-ip> -j ACCEPT  # Temporarily allow

# Check cloud provider firewall (AWS SG, GCP FW)
\`\`\`

### Section 3: SSL/TLS Certificate Issues

\`\`\`bash
# Check certificate validity
openssl s_client -connect example.com:443 </dev/null 2>/dev/null | \
    openssl x509 -noout -dates

# Check certificate chain
openssl s_client -connect example.com:443 -showcerts

# Verify certificate matches domain
openssl s_client -connect example.com:443 -servername example.com

# Common issues:
# 1. Expired certificate
# 2. Wrong certificate for domain
# 3. Missing intermediate certificate
# 4. Self-signed certificate
\`\`\`

### Section 4: Connection Timeouts

\`\`\`bash
# Symptoms: Slow connections or timeouts
# Check TCP connection state
ss -tnp | awk '{print $1}' | sort | uniq -c | sort -rn

# High SYN_RECV = possible SYN flood
# High TIME_WAIT = too many short-lived connections

# Fix: Increase connection tracking
sudo sysctl -w net.netfilter.nf_conntrack_max=262144
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65536

# Check connection limits
ulimit -n
cat /proc/sys/net/core/somaxconn
\`\`\`

### Section 5: MTU Issues

\`\`\`bash
# Symptoms: Connections hang or fail for large transfers
# Test MTU
ping -M do -s 1472 8.8.8.8

# If fails, reduce MTU
sudo ip link set eth0 mtu 1400

# Common MTU values:
# Ethernet: 1500
# PPPoE: 1492
# VPN: varies (often 1400)
# Cloud VPC: 9001 (Jumbo frames)
\`\`\`

### Section 6: Service-Specific Issues

\`\`\`bash
# Nginx 502 Bad Gateway
# Backend not running or not responding
sudo systemctl status my-backend
curl -v http://localhost:3000/health

# Nginx 504 Gateway Timeout
# Backend too slow
# Increase proxy_read_timeout in nginx.conf

# Connection refused
# Service not listening
ss -tlnp | grep :80
sudo systemctl start nginx
\`\`\`

### Key Takeaways
- DNS issues are the most common cause of "cannot connect" errors
- Always check firewall rules before assuming network issues
- SSL certificate problems often stem from missing intermediaries
- High TIME_WAIT counts indicate connection recycling issues
- MTU problems manifest as hanging transfers, not outright failures

### References
1. [Linux Network Troubleshooting Guide](https://www.tecmint.com/linux-network-configuration-and-troubleshooting-commands/)
2. [SSL/TLS Debugging with OpenSSL](https://www.openssl.org/docs/manmaster/man1/openssl-s_client.html)
3. [conntrack tuning](https://www.nixcraft.com/t/linux-tuning-nf-conntrack-max/3778)`,
            questions: [
              { text: 'What is the most common cause of \'cannot resolve hostname\' errors?', answers: [
                { text: 'Wrong IP address', isCorrect: false },
                { text: 'DNS configuration issues', isCorrect: true },
                { text: 'Firewall blocking', isCorrect: false },
                { text: 'MTU mismatch', isCorrect: false },
              ]},
              { text: 'What does a high TIME_WAIT count indicate?', answers: [
                { text: 'DDoS attack', isCorrect: false },
                { text: 'Too many short-lived connections', isCorrect: true },
                { text: 'DNS failure', isCorrect: false },
                { text: 'Firewall blocking', isCorrect: false },
              ]},
              { text: 'What command tests if a specific port is listening?', answers: [
                { text: 'ping host', isCorrect: false },
                { text: 'curl host', isCorrect: false },
                { text: 'ss -tlnp | grep :port', isCorrect: true },
                { text: 'dig host', isCorrect: false },
              ]},
              { text: 'What does Nginx 502 Bad Gateway usually mean?', answers: [
                { text: 'Nginx is not running', isCorrect: false },
                { text: 'The backend application is not responding', isCorrect: true },
                { text: 'The client sent a bad request', isCorrect: false },
                { text: 'SSL certificate is invalid', isCorrect: false },
              ]},
              { text: 'What MTU test command detects MTU mismatches?', answers: [
                { text: 'ping -c 4 host', isCorrect: false },
                { text: 'traceroute host', isCorrect: false },
                { text: 'ping -M do -s 1472 host', isCorrect: true },
                { text: 'mtr host', isCorrect: false },
              ]},
              { text: 'What system call limit affects maximum connections?', answers: [
                { text: 'ulimit -n', isCorrect: true },
                { text: 'ulimit -u', isCorrect: false },
                { text: 'ulimit -s', isCorrect: false },
                { text: 'ulimit -f', isCorrect: false },
              ]},
            ],
          },
        ],
      },
    ],
  );

  console.log('Linux courses Part 2 seeded successfully.');
}
