#!/usr/bin/env python3
"""Add Python/Django Deployment lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Python/Django Deployment

### Learning Objectives
- Deploy Django applications with Gunicorn and Nginx
- Configure Gunicorn workers and binding
- Serve Django static and media files through Nginx
- Implement Django security settings for production

### Section 1: Deployment Stack

```
Client -> Nginx -> Gunicorn -> Django -> Database
           |-> Static Files
           |-> Media Files
```

### Section 2: Gunicorn Setup

```bash
# Install Gunicorn
pip install gunicorn

# Run Django with Gunicorn
gunicorn myproject.wsgi:application \\
    --bind 127.0.0.1:8000 \\
    --workers 4 \\
    --worker-class gevent \\
    --timeout 120 \\
    --access-logfile /var/log/gunicorn/access.log \\
    --error-logfile /var/log/gunicorn/error.log
```

**Worker Calculation:** workers = (2 x CPU cores) + 1

### Section 3: Systemd Service

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=Gunicorn Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/myapp
ExecStart=/var/www/myapp/venv/bin/gunicorn \\
    myproject.wsgi:application \\
    --bind unix:/run/gunicorn/myapp.sock \\
    --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

### Section 4: Nginx Configuration for Django

```nginx
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
```

### Section 5: Django Production Settings

```python
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
```

### Key Takeaways
- Gunicorn is the standard WSGI server for Django
- Use systemd to manage Gunicorn as a service
- Nginx serves static/media files directly for performance
- Always disable DEBUG and enable HTTPS in production
- Use Unix sockets instead of TCP for local Gunicorn-Nginx communication

### References
1. [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
2. [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/settings.html)
3. [Deploying Django with Gunicorn and Nginx](https://uwsgi-docs.readthedocs.io/en/latest/tutorials/Django_and_nginx.html)"""

questions = [
    {"text": "What is the recommended Gunicorn worker count formula?", "answers": [
        {"text": "Number of CPU cores", "isCorrect": False},
        {"text": "(2 x CPU cores) + 1", "isCorrect": True},
        {"text": "Number of RAM GB", "isCorrect": False},
        {"text": "10 workers", "isCorrect": False}
    ]},
    {"text": "Why use Unix sockets instead of TCP for Gunicorn-Nginx communication?", "answers": [
        {"text": "Sockets are more secure", "isCorrect": False},
        {"text": "Unix sockets are faster with lower overhead", "isCorrect": True},
        {"text": "TCP does not work with Gunicorn", "isCorrect": False},
        {"text": "Sockets support more workers", "isCorrect": False}
    ]},
    {"text": "What Django setting should be False in production?", "answers": [
        {"text": "ALLOWED_HOSTS", "isCorrect": False},
        {"text": "DEBUG", "isCorrect": True},
        {"text": "STATIC_URL", "isCorrect": False},
        {"text": "DATABASES", "isCorrect": False}
    ]},
    {"text": "What does the collectstatic command do?", "answers": [
        {"text": "Collects user data", "isCorrect": False},
        {"text": "Gathers all static files into STATIC_ROOT", "isCorrect": True},
        {"text": "Downloads static assets from CDN", "isCorrect": False},
        {"text": "Compresses static files", "isCorrect": False}
    ]},
    {"text": "What systemd directive ensures the service starts on boot?", "answers": [
        {"text": "Restart=always", "isCorrect": False},
        {"text": "WantedBy=multi-user.target", "isCorrect": True},
        {"text": "After=network.target", "isCorrect": False},
        {"text": "ExecStart", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Python/Django Deployment", "order": 2, "lab": "undefined",
    "content": content, "questions": questions
}
data["courses"][0]["sections"][2]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Python/Django Deployment lesson")
