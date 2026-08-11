#!/usr/bin/env python3
"""Add Nginx Mastery lessons 3-4."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

lessons = [
{
  "title": "Reverse Proxying & Load Balancing", "order": 3, "lab": "nginxLab?.id",
  "content": "# Reverse Proxying & Load Balancing\n\n### Learning Objectives\n- Configure Nginx as a reverse proxy for backend applications\n- Set up upstream server groups with health checks\n- Implement load balancing algorithms (round-robin, least-connections, ip-hash)\n- Configure proxy buffering, timeouts, and WebSocket support\n\n### Section 1: Basic Reverse Proxy\n\nNginx excels as a reverse proxy, forwarding client requests to backend application servers:\n\n```nginx\nserver {\n    listen 80;\n    server_name app.example.com;\n\n    location / {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}\n```\n\n**Important:** Always set the proxy headers. Without them, the backend cannot see the original client IP or protocol.\n\n### Section 2: Upstream Server Groups\n\nDefine groups of backend servers for load balancing:\n\n```nginx\nupstream app_backend {\n    server 10.0.0.1:3000 weight=3;\n    server 10.0.0.2:3000 weight=2;\n    server 10.0.0.3:3000 weight=1;\n    server 10.0.0.4:3000 backup;  # Only used when others are down\n\n    keepalive 32;  # Connection pool to backends\n}\n\nserver {\n    listen 80;\n    location / {\n        proxy_pass http://app_backend;\n        proxy_http_version 1.1;\n        proxy_set_header Connection \"\";\n    }\n}\n```\n\n### Section 3: Load Balancing Algorithms\n\n| Algorithm | Directive | Description |\n|-----------|-----------|-------------|\n| Round-Robin | (default) | Distributes requests sequentially |\n| Least Connections | `least_conn;` | Sends to server with fewest active connections |\n| IP Hash | `ip_hash;` | Same client IP always hits same server (session persistence) |\n| Random | `random two least_conn;` | Random selection among least-loaded servers |\n\n```nginx\nupstream backend {\n    least_conn;\n    server 10.0.0.1:3000;\n    server 10.0.0.2:3000;\n    server 10.0.0.3:3000;\n}\n```\n\n### Section 4: Health Checks\n\nNginx performs passive health checks by default. Active health checks require Nginx Plus, but you can configure passive checks:\n\n```nginx\nupstream backend {\n    server 10.0.0.1:3000 max_fails=3 fail_timeout=30s;\n    server 10.0.0.2:3000 max_fails=3 fail_timeout=30s;\n}\n```\n\n`max_fails`: Number of failures before marking server as unavailable\n`fail_timeout`: Duration to mark server as unavailable after max_fails\n\n### Section 5: Proxy Buffering and Timeouts\n\n```nginx\nlocation / {\n    proxy_pass http://app_backend;\n\n    # Buffers\n    proxy_buffering on;\n    proxy_buffer_size 4k;\n    proxy_buffers 8 4k;\n\n    # Timeouts\n    proxy_connect_timeout 60s;\n    proxy_send_timeout 60s;\n    proxy_read_timeout 60s;\n\n    # Retry on failure\n    proxy_next_upstream error timeout http_502 http_503;\n    proxy_next_upstream_tries 3;\n}\n```\n\n### Section 6: WebSocket Proxying\n\n```nginx\nlocation /ws/ {\n    proxy_pass http://app_backend;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection \"upgrade\";\n    proxy_read_timeout 86400s;  # Keep WebSocket alive\n}\n```\n\n### Hands-On Practice\n\n1. Set up two Python Flask servers on different ports\n2. Configure Nginx as a reverse proxy with upstream\n3. Test load balancing by sending multiple requests\n4. Simulate a backend failure and observe failover\n5. Configure WebSocket proxying for a real-time app\n\n### Key Takeaways\n- Always set proxy headers (X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)\n- Use upstream blocks to group backend servers\n- least_conn is best for variable request times; ip_hash for session persistence\n- Configure timeouts and retry logic for resilience\n- WebSocket proxying requires Upgrade and Connection headers\n\n### References & Further Reading\n1. \"Nginx Cookbook\" by Alex Crawford — Chapter 3: Proxying\n2. [Nginx Proxy Documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)\n3. [Nginx Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)",
  "questions": [
    {"text": "Which directive is required for WebSocket proxying in Nginx?", "answers": [
      {"text": "proxy_set_header Upgrade $http_upgrade", "isCorrect": True},
      {"text": "proxy_websocket on", "isCorrect": False},
      {"text": "ws_upgrade on", "isCorrect": False},
      {"text": "proxy_set_header Upgrade websocket", "isCorrect": False}
    ]},
    {"text": "Which load balancing algorithm sends requests to the server with fewest active connections?", "answers": [
      {"text": "round-robin", "isCorrect": False},
      {"text": "ip_hash", "isCorrect": False},
      {"text": "least_conn", "isCorrect": True},
      {"text": "random", "isCorrect": False}
    ]},
    {"text": "What does max_fails=3 mean in an upstream server definition?", "answers": [
      {"text": "Server will handle exactly 3 requests", "isCorrect": False},
      {"text": "Server is marked down after 3 consecutive failures", "isCorrect": True},
      {"text": "Server will be removed after 3 minutes", "isCorrect": False},
      {"text": "Server accepts maximum 3 concurrent connections", "isCorrect": False}
    ]},
    {"text": "Why should you always set proxy_set_header Host $host?", "answers": [
      {"text": "To enable SSL on the backend", "isCorrect": False},
      {"text": "To preserve the original Host header for the backend", "isCorrect": True},
      {"text": "To enable compression", "isCorrect": False},
      {"text": "To set the server name in access logs", "isCorrect": False}
    ]},
    {"text": "What does proxy_next_upstream do?", "answers": [
      {"text": "Enables response caching", "isCorrect": False},
      {"text": "Forwards the request to the next backend on failure", "isCorrect": True},
      {"text": "Sends the request to all backends simultaneously", "isCorrect": False},
      {"text": "Load balances across multiple Nginx instances", "isCorrect": False}
    ]},
    {"text": "What is the purpose of the keepalive directive in an upstream block?", "answers": [
      {"text": "Keep client connections alive", "isCorrect": False},
      {"text": "Maintain a pool of connections to backend servers", "isCorrect": True},
      {"text": "Enable HTTP keepalive for Nginx itself", "isCorrect": False},
      {"text": "Prevent backend servers from shutting down", "isCorrect": False}
    ]}
  ]
},
{
  "title": "Caching & Performance Tuning", "order": 4, "lab": "nginxLab?.id",
  "content": "# Caching & Performance Tuning\n\n### Learning Objectives\n- Configure proxy caching to reduce backend load\n- Implement browser caching with expires headers\n- Optimize Nginx for high-throughput workloads\n- Use Gzip/Brotli compression effectively\n\n### Section 1: Proxy Cache Configuration\n\nNginx can cache responses from backend servers, reducing load and improving response times:\n\n```nginx\n# Define cache zone in http block\nproxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:100m\n    max_size=10g inactive=60m use_temp_path=off;\n\nserver {\n    location / {\n        proxy_pass http://app_backend;\n        proxy_cache my_cache;\n        proxy_cache_valid 200 302 10m;\n        proxy_cache_valid 404 1m;\n        proxy_cache_key \"$scheme$request_method$host$request_uri\";\n        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;\n        add_header X-Cache-Status $upstream_cache_status;\n    }\n}\n```\n\nCache status values: HIT, MISS, EXPIRED, STALE, UPDATING, BYPASS\n\n### Section 2: Cache Invalidation\n\n```bash\n# Purge cache for a specific URL (requires proxy_cache_purge module)\ncurl -X PURGE http://example.com/api/data\n\n# Skip cache for specific requests\nlocation /api/ {\n    proxy_cache off;\n    proxy_pass http://app_backend;\n}\n\n# Bypass cache with header\nproxy_cache_bypass $http_x_no_cache;\nproxy_no_cache $http_x_no_cache;\n```\n\n### Section 3: Browser Caching\n\n```nginx\n# Static assets - cache for 1 year\nlocation ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2)$ {\n    root /var/www/html;\n    expires 1y;\n    add_header Cache-Control \"public, immutable\";\n    access_log off;\n}\n\n# HTML - no cache\nlocation ~* \\.html$ {\n    expires -1;\n    add_header Cache-Control \"no-store, no-cache, must-revalidate\";\n}\n\n# API responses - no cache\nlocation /api/ {\n    proxy_pass http://app_backend;\n    add_header Cache-Control \"no-cache, no-store, must-revalidate\";\n}\n```\n\n### Section 4: Gzip Compression\n\n```nginx\nhttp {\n    gzip on;\n    gzip_vary on;\n    gzip_proxied any;\n    gzip_comp_level 6;\n    gzip_min_length 256;\n    gzip_types\n        text/plain text/css text/xml\n        application/json application/javascript\n        application/xml application/rss+xml\n        image/svg+xml;\n}\n```\n\n### Section 5: Brotli Compression\n\n```nginx\n# Requires ngx_brotli module\nbrotli on;\nbroli_comp_level 6;\nbrotli_types text/plain text/css application/json application/javascript;\n```\n\n### Section 6: Performance Tuning\n\n```nginx\nhttp {\n    # Sendfile for zero-copy file transfers\n    sendfile on;\n    tcp_nopush on;\n    tcp_nodelay on;\n\n    # Open file cache\n    open_file_cache max=10000 inactive=20s;\n    open_file_cache_valid 30s;\n    open_file_cache_min_uses 2;\n\n    # Buffer optimization\n    client_body_buffer_size 16k;\n    client_header_buffer_size 1k;\n    large_client_header_buffers 4 8k;\n\n    # Timeout tuning\n    client_body_timeout 12;\n    client_header_timeout 12;\n    keepalive_timeout 65;\n    send_timeout 10;\n}\n```\n\n### Hands-On Practice\n\n1. Configure proxy caching and verify with `X-Cache-Status` header\n2. Set up browser caching for static assets\n3. Enable gzip compression and test with `curl -H 'Accept-Encoding: gzip'`\n4. Benchmark before and after with `ab` or `wrk`\n\n### Key Takeaways\n- Proxy caching reduces backend load and improves response times\n- Use Cache-Control headers to control browser caching\n- Gzip/Brotli compression reduces bandwidth by 60-80%\n- sendfile enables zero-copy file transfers\n- Tune buffer sizes and timeouts for your workload\n\n### References & Further Reading\n1. \"Nginx Cookbook\" by Alex Crawford — Chapter 6: Caching\n2. [Nginx Caching Guide](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/)\n3. [PageSpeed Module for Nginx](https://developers.google.com/speed/pagespeed/module/)",
  "questions": [
    {"text": "What does proxy_cache_valid 200 10m mean?", "answers": [
      {"text": "Cache only lasts 10 minutes total", "isCorrect": False},
      {"text": "Cache 200 responses for 10 minutes", "isCorrect": True},
      {"text": "Cache for 10 minutes on port 200", "isCorrect": False},
      {"text": "Maximum 200 cached items for 10 minutes", "isCorrect": False}
    ]},
    {"text": "What header reveals whether a response was served from cache?", "answers": [
      {"text": "X-Cache", "isCorrect": False},
      {"text": "X-Cache-Status", "isCorrect": True},
      {"text": "Cache-Control", "isCorrect": False},
      {"text": "X-Proxy-Cache", "isCorrect": False}
    ]},
    {"text": "What does the sendfile directive do?", "answers": [
      {"text": "Enables file uploads", "isCorrect": False},
      {"text": "Uses kernel zero-copy for efficient file transfers", "isCorrect": True},
      {"text": "Sends files via email", "isCorrect": False},
      {"text": "Enables file compression", "isCorrect": False}
    ]},
    {"text": "Which gzip_comp_level provides the best balance of compression and CPU usage?", "answers": [
      {"text": "1 (fastest)", "isCorrect": False},
      {"text": "6 (balanced)", "isCorrect": True},
      {"text": "9 (maximum)", "isCorrect": False},
      {"text": "0 (disabled)", "isCorrect": False}
    ]},
    {"text": "What does proxy_cache_use_stale do?", "answers": [
      {"text": "Disables caching", "isCorrect": False},
      {"text": "Serves stale cached content when backend is unavailable", "isCorrect": True},
      {"text": "Deletes old cache entries", "isCorrect": False},
      {"text": "Forces cache refresh", "isCorrect": False}
    ]},
    {"text": "What is the correct Cache-Control header for immutable static assets?", "answers": [
      {"text": "no-cache, no-store", "isCorrect": False},
      {"text": "public, immutable", "isCorrect": True},
      {"text": "private, max-age=0", "isCorrect": False},
      {"text": "must-revalidate", "isCorrect": False}
    ]}
  ]
}
]

data["courses"][0]["sections"][0]["lessons"].extend(lessons)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"Added {len(lessons)} lessons to Course 3 Section 1")
