# Module 7 — Cryptographic Failures

**Course:** Web Application Security | **Path:** Web App Security (7 of 10)

---

## What You'll Actually Do

You'll find and fix cryptographic weaknesses — weak algorithms, improper key storage, missing encryption, broken implementations.

---

## Common Failures

**Weak algorithms:**
```text
MD5, SHA1 for password hashing → use argon2
DES, 3DES for encryption → use AES-256-GCM
RC4 for TLS → use TLS 1.3
```

**Plaintext storage:**
```text
Passwords in database without hashing
Credit cards in plaintext
API keys in source code
```

**Improper key management:**
```text
Keys in version control
Same key for all environments
No key rotation
```

**TLS misconfigurations:**
```text
SSLv3, TLS 1.0, TLS 1.1 → use TLS 1.2+
Weak ciphers → use AES-GCM, ChaCha20
Self-signed certificates in production
```

---

## Detection

```bash
# Test TLS configuration
testssl.sh https://example.com

# Check for weak ciphers
nmap --script ssl-enum-ciphers -p 443 example.com

# Find secrets in code
trufflehog filesystem .
```

---

## Prevention

```python
# Password hashing
from argon2 import PasswordHasher
ph = PasswordHasher()
hashed = ph.hash(password)

# Encryption
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)
encrypted = aesgcm.encrypt(nonce, data, aad)

# TLS
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384;
```

---

## Assessment

**Lab task (20 min):**

1. Test TLS configuration of a web server
2. Find weak algorithms in use
3. Check for plaintext secrets
4. Fix cryptographic issues
5. Verify fixes with testssl.sh

**Grading:**
- TLS tested: 20%
- Weak algorithms found: 20%
- Secrets found: 15%
- Fixes applied: 30%
- Verified: 15%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO7 — Cryptographic Failures`
