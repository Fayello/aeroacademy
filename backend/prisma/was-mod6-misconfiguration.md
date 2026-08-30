# Module 6 — Security Misconfiguration

**Course:** Web Application Security | **Path:** Web App Security (6 of 10)

---

## What You'll Actually Do

You'll find and fix security misconfigurations — default credentials, unnecessary services, missing headers, verbose error messages.

---

## Common Misconfigurations

**Default credentials:**
```text
admin/admin
root/root
admin/password
test/test
```

**Verbose errors:**
```text
SQL error: Table 'users' doesn't exist
Stack trace: com.example.UserServiceImpl.findUser(UserServiceImpl.java:42)
Server version: Apache/2.4.41 (Ubuntu)
```

**Missing security headers:**
```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Directory listing:**
```text
https://example.com/uploads/
Index of /uploads/
backup.sql
config.yml
```

---

## Scanning

```bash
# Nikto
nikto -h https://example.com

# Nmap scripts
nmap --script http-enum,http-headers,http-methods -p 443 example.com

# Manually check
curl -I https://example.com  # check headers
```

---

## Prevention

```nginx
# Disable server signature
server_tokens off;

# Security headers
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Disable directory listing
options -Indexes
```

---

## Assessment

**Lab task (20 min):**

1. Scan a web application for misconfigurations
2. Find default credentials
3. Identify missing security headers
4. Fix each misconfiguration
5. Verify fixes

**Grading:**
- Scan completed: 15%
- Credentials found: 20%
- Headers identified: 20%
- Fixes applied: 30%
- Verified: 15%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO6 — Security Misconfiguration`
