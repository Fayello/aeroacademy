# Module 7 — Cryptography: What You Actually Need

**Course:** Security Engineering | **Path:** Security Engineering (7 of 10)

---

## What You'll Actually Do

You'll encrypt data at rest and in transit, manage keys properly, and understand the difference between encryption, hashing, and signing. Not crypto theory — practical implementation.

---

## Hashing — One-Way Transformation

```python
import hashlib

# SHA-256 for file integrity
file_hash = hashlib.sha256(file_content).hexdigest()

# Verify integrity
if hashlib.sha256(received_content).hexdigest() == expected_hash:
    print("Integrity verified")
```

**Use cases:** File integrity, password storage (with salt/argon2), checksums

**Not use cases:** Password storage (use argon2), encryption (can't reverse)

---

## Encryption — Reversible Transformation

**Symmetric (same key for encrypt/decrypt):**
```python
from cryptography.fernet import Fernet

key = Fernet.generate_key()
f = Fernet(key)
encrypted = f.encrypt(b"secret data")
decrypted = f.decrypt(encrypted)
```

**Asymmetric (public/private key pair):**
```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

# Generate key pair
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

# Encrypt with public key
encrypted = public_key.encrypt(b"secret", padding.OAEP(...))

# Decrypt with private key
decrypted = private_key.decrypt(encrypted, padding.OAEP(...))
```

---

## TLS — Encryption in Transit

```text
Client → ServerHello (cipher suite) → Certificate → Key Exchange → Encrypted channel
```

**Configure properly:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers on;
ssl_stapling on;
```

---

## Key Management

```text
Rule 1: Never hardcode keys in source code
Rule 2: Use environment variables or secret managers
Rule 3: Rotate keys periodically
Rule 4: Different keys for different purposes
Rule 5: Back up keys securely
```

**AWS KMS / HashiCorp Vault / environment variables:**
```python
import os
db_password = os.environ["DB_PASSWORD"]  # from secret manager
```

---

## Digital Signatures — Integrity + Non-Repudiation

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes

# Sign
signature = private_key.sign(data, ec.ECDSA(hashes.SHA256()))

# Verify
public_key.verify(signature, data, ec.ECDSA(hashes.SHA256()))
```

**Use cases:** Code signing, JWT signatures, Git commits

---

## Assessment

**Lab task (20 min):**

1. Hash a file with SHA-256 and verify integrity
2. Encrypt data with AES and decrypt it
3. Generate RSA key pair and encrypt/decrypt
4. Configure TLS on a web server
5. Sign and verify a document

**Grading:**
- Hashing correct: 15%
- Symmetric encryption: 20%
- Asymmetric encryption: 20%
- TLS configured: 25%
- Signatures working: 20%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO7 — Practical Cryptography`
