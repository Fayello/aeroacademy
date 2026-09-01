# Module 6: Security Misconfiguration

Security misconfiguration is the most common vulnerability class in web applications. It includes everything from default credentials on a database to missing security headers on an HTTP response. The breadth of this category means it touches every layer of the application stack: the operating system, web server, application server, database, framework, and application code. Most misconfigurations are not complex to exploit: they are complex to prevent because they require consistent attention across every component.

## Default Credentials

Every platform ships with default credentials. When these are not changed after installation, the application is trivially compromised.

Common default credentials across platforms:

| Platform | Username | Password |
|----------|----------|----------|
| MySQL | root | (empty) |
| PostgreSQL | postgres | postgres |
| MongoDB | admin | (empty) |
| Redis | (empty) | (empty) |
| phpMyAdmin | root | (empty) |
| Jenkins | admin | (initial password in secrets) |
| Elasticsearch | elastic | changeme |
| Grafana | admin | admin |
| Tomcat | admin | (empty) |
| WebLogic | weblogic | Oracle123 |
| WordPress (wp-admin) | admin | admin |
| Drupal | admin | admin |

The attack pattern is straightforward: find the service, try the default credentials, and log in. This works in production more often than anyone wants to admit. Services that are installed automatically (through Docker images, cloud AMIs, or configuration management) are particularly at risk because the default credentials are embedded in the image and never rotated.

### Discovery Methods

**Port scanning**: Nmap reveals open services:

```bash
nmap -sV -p 1-65535 target.com
```

The `-sV` flag detects service versions. If the scan reveals phpMyAdmin on port 8080, Jenkins on port 8081, or Redis on port 6379, try the default credentials.

**Directory brute-force**: Tools like ffuf, dirsearch, or gobuster find admin panels and management interfaces:

```bash
ffuf -u https://target.com/FUZZ -w common_admin_panels.txt -mc 200,301,302,403
```

Common paths to try:

```
/admin
/administrator
/phpmyadmin
/adminer
/jenkins
/kibana
/grafana
/swagger
/api-docs
/graphql
/.env
/config
/debug
/status
/health
/actuator
```

**Shodan**: Search engines like Shodan index internet-connected devices. Searching for a target's IP range can reveal exposed services with default credentials.

**Configuration file exposure**: Application configuration files often contain credentials. Common locations:

```
/.env
/config.yml
/config.json
/config.php
/application.yml
/application.properties
/settings.py
/database.yml
/wp-config.php
/.git/config
/docker-compose.yml
/Dockerfile
```

## Directory Listing

When directory listing is enabled on a web server, navigating to a directory without an index file shows all files and directories. This is a treasure trove for attackers.

Apache enables directory listing by default when no index file is present. The fix is to add `Options -Indexes` to the Apache configuration or `.htaccess` file. Nginx disables directory listing by default, but it can be accidentally enabled with `autoindex on;`.

Exposed directory listings reveal:

- Backup files (`.bak`, `.old`, `.save`)
- Configuration files
- Source code
- Log files
- Temporary files
- Database dumps

A directory listing of `/backup/` might show:

```
backup_2024_01_01.sql.gz
backup_2024_01_02.sql.gz
backup_2024_01_03.sql.gz
latest_backup.sql.gz
```

Each of these files can be downloaded. If the database backup contains user credentials, the attacker gains access to every user account in the system.

## Backup Files

Developers create backup files through various means:

- Text editor backups: `file.php~`, `file.php.swp`, `file.php.bak`
- Manual backups: `config.php.bak`, `database.yml.old`
- Version control artifacts: `.git/`, `.svn/`
- Build artifacts: `build/`, `dist/`
- Database dumps: `dump.sql`, `db_backup.sql`
- Archive files: `backup.zip`, `source.tar.gz`

The `.git` directory is particularly dangerous. If the `.git` directory is accessible via the web server, the attacker can reconstruct the entire source code:

```bash
# Using git-dumper to extract .git directory
python git_dumper.py https://target.com/.git/ ./extracted_source
```

The extracted source code reveals database credentials, API keys, internal logic, and hidden endpoints. This is a complete compromise of the application's confidentiality.

### Tools for Backup File Discovery

**ffuf with backup wordlist**:

```bash
ffuf -u https://target.com/FUZZ -w backup_files.txt -mc 200
```

**backup_words.txt sample**:

```
index.php.bak
index.php~
config.php.bak
config.php.old
config.php.save
web.config.bak
.env
.env.bak
.env.local
.env.production
dump.sql
backup.zip
source.tar.gz
.git/HEAD
.svn/entries
```

## Missing Security Headers

Security headers are HTTP response headers that instruct the browser to enforce security policies. Missing headers leave the application vulnerable to attacks that the browser would otherwise prevent.

**Security headers checklist**:

| Header | Purpose | Impact if Missing |
|--------|---------|-------------------|
| Strict-Transport-Security | Forces HTTPS | SSL stripping attacks |
| Content-Security-Policy | Restricts content sources | XSS exploitation |
| X-Content-Type-Options | Prevents MIME sniffing | Drive-by downloads |
| X-Frame-Options | Prevents clickjacking | Clickjacking attacks |
| Referrer-Policy | Controls referrer leakage | Token leakage |
| Permissions-Policy | Controls browser features | Camera/mic access |
| X-XSS-Protection | Legacy XSS filter | Some reflected XSS |
| Cache-Control | Prevents caching | Sensitive data in cache |

Testing for missing headers is straightforward with curl:

```bash
curl -I https://target.com | grep -iE "strict-transport|content-security|x-content-type|x-frame|referrer-policy|permissions-policy|cache-control"
```

A missing HSTS header means the first request to the application travels over HTTP (or can be intercepted and downgraded). An attacker performing a man-in-the-middle attack can strip TLS on the initial connection, capturing credentials and session tokens in plaintext.

A missing X-Frame-Options header means the application can be framed by any site. An attacker can embed the application in an iframe on their malicious page and trick users into clicking on hidden elements (clickjacking).

A missing Content-Security-Policy header means there is no defense-in-depth against XSS. Any injected script will execute without restriction.

## Verbose Error Messages

Applications that display detailed error messages reveal implementation information to attackers.

**Stack traces**: A full stack trace reveals the application framework, version, file paths, and internal architecture:

```
Traceback (most recent call last):
  File "/var/www/app/views/login.py", line 42, in login
    user = User.objects.get(username=request.POST['username'])
  File "/usr/lib/python3.9/site-packages/django/db/models/manager.py", line 85, in get
    return self.get_queryset().get(*args, **kwargs)
  File "/usr/lib/python3.9/site-packages/django/db/models/query.py", line 420, in get
    raise self.model.DoesNotExist.DoesNotExist
django.contrib.auth.models.User.DoesNotExist: User matching query does not exist.
```

This reveals: Python 3.9, Django, the file path of the login view, and the fact that the User model is from django.contrib.auth.

**Database errors**: SQL errors reveal the database type, table names, and column names:

```
ERROR: column "nonexistent" does not exist
LINE 1: SELECT id, username, email, password_hash FROM users WHERE ...
```

The attacker now knows the table name (users) and column names (id, username, email, password_hash).

**Framework version disclosure**: Some frameworks include version information in response headers or error pages:

```
X-Powered-By: Express 4.17.1
Server: Apache/2.4.41 (Ubuntu)
X-AspNet-Version: 4.0.30319
X-Generator: Drupal 7.68
```

This information helps attackers identify known vulnerabilities in specific framework versions.

**Debug mode**: Many frameworks have a debug mode that displays detailed error pages with request data, environment variables, and internal state. If debug mode is enabled in production:

```
# Django DEBUG=True shows full settings including SECRET_KEY, DATABASE_URL, etc.
# Flask DEBUG=True shows a debugger with interactive console
# Laravel APP_DEBUG=True shows full environment including DB credentials
```

The Flask interactive debugger is particularly dangerous because it allows arbitrary Python code execution. If the debugger PIN is weak or leaked, an attacker can execute system commands through the debugger console.

## Server and Version Disclosure

The `Server` header reveals the web server software and version:

```
Server: nginx/1.18.0
Server: Apache/2.4.41 (Ubuntu)
Server: Microsoft-IIS/10.0
```

Known vulnerabilities in specific versions can then be exploited. For example, Apache 2.4.49 has a path traversal vulnerability (CVE-2021-41773) that allows reading arbitrary files.

Removing or spoofing the Server header does not fix the underlying vulnerability, but it reduces information available to an attacker performing reconnaissance.

**Technology fingerprinting beyond headers**:

- Error page style: Different frameworks have distinctive default error pages.
- URL patterns: `.php` extensions indicate PHP, `/django/` in URL patterns indicates Django.
- Response header patterns: Different servers add different headers.
- Cookie names: `PHPSESSID` (PHP), `JSESSIONID` (Java), `connect.sid` (Express), `csrftoken` (Django).
- HTML comments: `<!-- WordPress -->`, `<!-- Powered by XYZ -->`.
- JavaScript file names and paths: React apps often have `main.js` or `bundle.js`, Angular apps have `polyfills.js` and `vendor.js`.

## Real Scenario: Finding Admin Panel via Directory Brute-Force

A financial services company had a customer portal at `https://portal.finserv.com`. The portal allowed customers to view account balances, transaction history, and download statements. The application was built with Spring Boot and deployed on Tomcat behind an Nginx reverse proxy.

**The reconnaissance**: The tester started with directory brute-force using ffuf and a common admin panel wordlist:

```bash
ffuf -u https://portal.finserv.com/FUZZ -w /usr/share/wordlists/admin_panels.txt -mc 200,301,302,403 -o results.txt
```

The scan revealed:

```
/admin          [Status: 403]
/admin/login    [Status: 200]
/actuator       [Status: 200]
/actuator/env   [Status: 200]
/swagger-ui     [Status: 200]
```

**The findings**:

1. **`/admin/login`**: An admin login page was accessible. The page used default Spring Security styling with no customization. The tester tried default credentials:

```
admin:admin → Success
```

The admin panel had full access to all customer accounts, the ability to create and modify user accounts, access to system configuration, and a database management tool. The panel was accessible because the Spring Security configuration had a path-based rule that was misconfigured:

```java
// MISCONFIGURED - the regex does not match /admin/login
http.authorizeRequests()
    .antMatchers("/admin/*").hasRole("ADMIN")
    .antMatchers("/admin/login").permitAll(); // Allows login page but not the path
```

The regex `/admin/*` matches `/admin/dashboard` but not `/admin/login`: and the login endpoint itself was left open. More critically, the login POST endpoint was not protected, allowing brute force and default credential testing.

2. **`/actuator`**: The Spring Boot Actuator was exposed without authentication. The `/actuator/env` endpoint revealed all environment variables, including:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://db.internal:5432/finserv
SPRING_DATASOURCE_USERNAME=finserv_admin
SPRING_DATASOURCE_PASSWORD=Pr0d_P@ssw0rd!
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Database credentials, AWS credentials, and internal network configuration were all exposed. The `/actuator/configprops` endpoint exposed additional configuration, and `/actuator/mappings` revealed all API endpoints including internal ones.

3. **`/swagger-ui`**: The Swagger API documentation was publicly accessible. This revealed every API endpoint, request/response schema, and authentication requirements. Internal endpoints like `/api/internal/admin/users` and `/api/internal/admin/audit` were documented, providing a complete roadmap for further exploitation.

**The impact**: The combination of the exposed admin panel with default credentials, the unauthenticated Actuator endpoints, and the public Swagger documentation gave the tester complete access to the application, its database, and the AWS account. In a real attack, this would result in:

- Access to all customer financial data (account numbers, balances, transaction history)
- The ability to modify customer accounts and initiate fraudulent transactions
- Access to AWS S3 buckets containing statement PDFs and KYC documents
- Lateral movement to other internal systems using the database credentials

**The fix**: Remove default credentials immediately after installation. Disable Actuator endpoints in production or secure them with Spring Security. Remove Swagger UI from production deployments. Implement proper authentication for all admin interfaces. Use network-level access controls to restrict admin panels to internal networks.

## Practical Exercise: Misconfiguration Lab

1. **Default credentials**: Scan the target application for common admin panels. Try default credentials on every login form found. Document which services accept default credentials.

2. **Directory brute-force**: Run a directory brute-force scan using ffuf or equivalent. Look for backup files, configuration files, source code, and hidden directories. Extract any files found.

3. **Header analysis**: Test all security headers. Document which headers are missing and which have insecure values. Write a recommendation for each missing header.

4. **Error handling**: Trigger errors by sending invalid input, malformed data, oversized payloads, and unexpected HTTP methods. Document the error messages returned and identify information disclosure.

5. **Technology fingerprinting**: Identify the technology stack using headers, error pages, cookie names, and HTML comments. Search for known vulnerabilities in the identified technologies.

6. **Configuration file discovery**: Search for .env files, .git directories, backup files, and configuration files. Extract any credentials or sensitive information found.

Time limit: 45 minutes. Grading criteria: default credential discovery (20%), directory brute-force results (25%), header analysis (15%), error handling analysis (15%), technology fingerprinting (15%), documentation (10%).
