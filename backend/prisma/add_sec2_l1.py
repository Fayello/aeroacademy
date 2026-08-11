#!/usr/bin/env python3
"""Add Apache httpd Configuration lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Apache httpd Configuration

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

```bash
# Check current MPM
apachectl -V | grep MPM

# Switch MPM (Debian/Ubuntu)
sudo a2dismod mpm_prefork
sudo a2enmod mpm_worker
sudo systemctl restart apache2
```

### Section 2: VirtualHosts

```apache
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

    ErrorLog ${APACHE_LOG_DIR}/example.com-error.log
    CustomLog ${APACHE_LOG_DIR}/example.com-access.log combined
</VirtualHost>

# Enable the site
sudo a2ensite example.com.conf
sudo systemctl reload apache2
```

### Section 3: .htaccess Configuration

```apache
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
```

### Section 4: Authentication

```bash
# Create password file
sudo htpasswd -c /etc/apache2/.htpasswd admin

# Add more users
sudo htpasswd /etc/apache2/.htpasswd user2
```

### Section 5: Performance Tuning

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# Connection keep-alive
KeepAlive On
KeepAliveTimeout 5
MaxKeepAliveRequests 100
```

### Key Takeaways
- Apache MPMs determine connection handling (prefork, worker, event)
- VirtualHosts allow hosting multiple sites on one server
- .htaccess provides directory-level configuration
- Apache offers flexible authentication and access control

### References
1. "Apache Cookbook" by Ken Coar
2. [Apache httpd Documentation](https://httpd.apache.org/docs/2.4/)
3. [Apache MPM Comparison](https://httpd.apache.org/docs/2.4/mpm.html)"""

questions = [
    {"text": "Which Apache MPM is best for high concurrency with minimal memory?", "answers": [
        {"text": "prefork", "isCorrect": False},
        {"text": "worker", "isCorrect": False},
        {"text": "event", "isCorrect": True},
        {"text": "itk", "isCorrect": False}
    ]},
    {"text": "What directive enables .htaccess processing?", "answers": [
        {"text": "Options +Includes", "isCorrect": False},
        {"text": "AllowOverride All", "isCorrect": True},
        {"text": "AccessFileName .htaccess", "isCorrect": False},
        {"text": "EnableHtaccess On", "isCorrect": False}
    ]},
    {"text": "Which command creates an Apache password file?", "answers": [
        {"text": "htpasswd -c /path/file user", "isCorrect": True},
        {"text": "apache-passwd create user", "isCorrect": False},
        {"text": "htpasswd create user /path/file", "isCorrect": False},
        {"text": "echo 'user:pass' > /path/file", "isCorrect": False}
    ]},
    {"text": "What does Options -Indexes do?", "answers": [
        {"text": "Enables directory listing", "isCorrect": False},
        {"text": "Disables directory listing when no index file exists", "isCorrect": True},
        {"text": "Enables indexing for search engines", "isCorrect": False},
        {"text": "Disables all directory options", "isCorrect": False}
    ]},
    {"text": "Which Apache module provides URL rewriting?", "answers": [
        {"text": "mod_rewrite", "isCorrect": True},
        {"text": "mod_redirect", "isCorrect": False},
        {"text": "mod_alias", "isCorrect": False},
        {"text": "mod_proxy", "isCorrect": False}
    ]},
    {"text": "What is the difference between ServerName and ServerAlias?", "answers": [
        {"text": "No difference", "isCorrect": False},
        {"text": "ServerName is primary, ServerAlias is additional names", "isCorrect": True},
        {"text": "ServerAlias is the primary domain", "isCorrect": False},
        {"text": "ServerName handles HTTP, ServerAlias handles HTTPS", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Apache httpd Configuration", "order": 1, "lab": "undefined",
    "content": content, "questions": questions
}
data["courses"][0]["sections"][1]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Apache httpd Configuration lesson")
