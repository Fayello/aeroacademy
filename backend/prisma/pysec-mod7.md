# Module 7 — Cryptography with Python

Cryptography protects data. It's how passwords are stored, how TLS secures HTTPS, how SSH tunnels work, how Bitcoin proves ownership. This module teaches you the practical cryptography you need as a security professional — hashing, encryption, key derivation, and digital signatures — using Python's `cryptography` library.

## Why Cryptography Matters for Security Professionals

You don't need to be a cryptographer. You need to use cryptographic tools correctly. The difference between secure and insecure systems is often just a configuration choice — using SHA-256 instead of MD5, using AES-GCM instead of AES-ECB, using Argon2 instead of plain hashing. These choices have massive security implications, and they're the kind of decisions security professionals make every day.

Cryptography shows up everywhere in security work. Password storage uses hashing and key derivation. Data protection uses symmetric encryption. Secure communications use TLS, which combines symmetric encryption, asymmetric encryption, and digital signatures. Forensic analysis involves recovering encrypted data or understanding how encryption was applied. Incident response often requires decrypting captured traffic or verifying data integrity with hashes.

The practical reality is that most security professionals don't implement cryptographic algorithms. They use libraries that implement them correctly. The `cryptography` library in Python is maintained by the Python Cryptographic Authority and has been audited by security researchers. It implements AES, RSA, ChaCha20, and other algorithms with secure defaults. Your job is to use the right algorithm for the right purpose and to handle keys securely.

This module teaches you the cryptographic primitives you need, when to use each one, and how to avoid the common mistakes that turn strong cryptography into weak security. You'll build a password manager that demonstrates proper key derivation, encryption, and authentication. The principles apply to every system that handles sensitive data.

## Hashing with hashlib

A hash function takes arbitrary input and produces a fixed-size string. The same input always produces the same output. A good hash function makes it computationally infeasible to find two different inputs that produce the same output (collision resistance).

```python
import hashlib

# MD5 (broken — don't use for security, but you'll encounter it)
md5 = hashlib.md5(b"password123")
print(f"MD5: {md5.hexdigest()}")

# SHA-1 (also broken for collision resistance)
sha1 = hashlib.sha1(b"password123")
print(f"SHA-1: {sha1.hexdigest()}")

# SHA-256 (current standard)
sha256 = hashlib.sha256(b"password123")
print(f"SHA-256: {sha256.hexdigest()}")

# SHA-512 (more bits, not necessarily better for most uses)
sha512 = hashlib.sha512(b"password123")
print(f"SHA-512: {sha512.hexdigest()}")
```

### Hashing Files

For large files, read in chunks to avoid loading everything into memory:

```python
import hashlib

def hash_file(filepath, algorithm="sha256"):
    """Hash a file in chunks"""
    hasher = hashlib.new(algorithm)

    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            hasher.update(chunk)

    return hasher.hexdigest()

# Usage
print(hash_file("/etc/passwd"))
print(hash_file("suspicious.exe", "sha512"))
```

### Why Not MD5 or SHA-1

MD5 and SHA-1 are broken. Collisions can be found in seconds on a laptop:

```python
# These two different files produce the same MD5:
# file1.bin and file2.bin (created to collide)
# md5(file1) == md5(file2)

# But their SHA-256 hashes are completely different
# sha256(file1) != sha256(file2)
```

Use SHA-256 for general hashing. Use SHA-3 or BLAKE2 if you need the latest algorithms. Never use MD5 or SHA-1 for anything security-related. You'll still see them in legacy systems — that's a finding in a security audit, not a practice to follow.

### HMAC — Authenticated Hashing

HMAC combines a hash with a secret key. It proves that data hasn't been tampered with AND that the creator knew the key:

```python
import hmac
import hashlib

def create_hmac(message, key):
    """Create an HMAC-SHA256"""
    return hmac.new(
        key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

def verify_hmac(message, key, expected_hmac):
    """Verify an HMAC"""
    computed = create_hmac(message, key)
    return hmac.compare_digest(computed, expected_hmac)

# Usage
key = "my-secret-key-123"
message = "Important data"

signature = create_hmac(message, key)
print(f"HMAC: {signature}")

# Verify
print(f"Valid: {verify_hmac(message, key, signature)}")
print(f"Tampered: {verify_hmac('Tampered data', key, signature)}")
```

`hmac.compare_digest` prevents timing attacks. Always use it for comparison instead of `==`.

### When to Use Hashing vs HMAC vs Encryption

Hashing verifies data integrity without secrecy. If you want to know whether a file has been modified, hash it. If the hash matches, the file is unchanged. Hashing is one-way — you cannot recover the original data from the hash.

HMAC adds authentication to hashing. If you want to verify that data hasn't been modified AND that the modifier knew a secret key, use HMAC. Without the key, an attacker can't generate a valid HMAC even if they know the hash algorithm.

Encryption provides confidentiality. If you want to store or transmit data that only authorized parties can read, encrypt it. Encryption is two-way — the authorized party can decrypt and recover the original data.

Common use cases: password storage uses hashing (specifically, password hashing like Argon2). API authentication uses HMAC. Data protection uses encryption. File integrity checking uses hashing. Code signing uses asymmetric encryption (digital signatures).

## Symmetric Encryption

Symmetric encryption uses the same key for encryption and decryption. It's fast and efficient for encrypting data at rest.

### Fernet (Easy Mode)

The `cryptography` library provides Fernet — authenticated symmetric encryption that handles key generation, padding, and authentication automatically:

```python
from cryptography.fernet import Fernet

# Generate a key
key = Fernet.generate_key()
print(f"Key: {key.decode()}")

# Create cipher
cipher = Fernet(key)

# Encrypt
plaintext = b"This is secret data"
ciphertext = cipher.encrypt(plaintext)
print(f"Encrypted: {ciphertext.decode()}")

# Decrypt
decrypted = cipher.decrypt(ciphertext)
print(f"Decrypted: {decrypted.decode()}")

# Save key to file (protect this file!)
with open("secret.key", "wb") as f:
    f.write(key)

# Load key
with open("secret.key", "rb") as f:
    loaded_key = f.read()

cipher = Fernet(loaded_key)
```

### AES (Advanced Mode)

For more control, use AES directly:

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import os

def encrypt_aes(plaintext, key):
    """Encrypt data with AES-CBC"""
    # Generate random IV
    iv = os.urandom(16)

    # Pad plaintext
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plaintext.encode()) + padder.finalize()

    # Encrypt
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    return iv + ciphertext

def decrypt_aes(ciphertext, key):
    """Decrypt AES-CBC data"""
    # Extract IV
    iv = ciphertext[:16]
    actual_ciphertext = ciphertext[16:]

    # Decrypt
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(actual_ciphertext) + decryptor.finalize()

    # Remove padding
    unpadder = padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded_data) + unpadder.finalize()

    return plaintext.decode()

# Usage
key = os.urandom(32)  # 256-bit key

encrypted = encrypt_aes("Sensitive data to protect", key)
print(f"Encrypted: {encrypted}")

decrypted = decrypt_aes(encrypted, key)
print(f"Decrypted: {decrypted}")
```

### AES-GCM (Authenticated Encryption)

AES-GCM provides both confidentiality and authenticity. It detects tampering:

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

def encrypt_aes_gcm(plaintext, key):
    """Encrypt with AES-GCM (authenticated encryption)"""
    nonce = os.urandom(12)  # 96-bit nonce
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return nonce + ciphertext

def decrypt_aes_gcm(ciphertext, key):
    """Decrypt AES-GCM data"""
    nonce = ciphertext[:12]
    actual_ciphertext = ciphertext[12:]
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, actual_ciphertext, None)
    return plaintext.decode()

# Usage
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

nonce = os.urandom(12)
ciphertext = aesgcm.encrypt(nonce, b"Secret message", None)
plaintext = aesgcm.decrypt(nonce, ciphertext, None)
print(f"Decrypted: {plaintext.decode()}")

# Tamper detection
try:
    tampered = bytearray(ciphertext)
    tampered[20] ^= 0xFF  # Flip a bit
    aesgcm.decrypt(nonce, bytes(tampered), None)
except Exception as e:
    print(f"Tamper detected: {e}")
```

## Asymmetric Encryption

Asymmetric encryption uses a key pair — public key encrypts, private key decrypts. It's slower than symmetric but solves the key distribution problem.

### RSA

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend

# Generate RSA key pair
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)
public_key = private_key.public_key()

# Encrypt with public key
plaintext = b"Secret message"
ciphertext = public_key.encrypt(
    plaintext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
print(f"Encrypted: {ciphertext.hex()}")

# Decrypt with private key
decrypted = private_key.decrypt(
    ciphertext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
print(f"Decrypted: {decrypted.decode()}")

# Save keys
with open("private_key.pem", "wb") as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ))

with open("public_key.pem", "wb") as f:
    f.write(public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ))
```

### Digital Signatures

Signatures prove who created data and that it hasn't been modified:

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

# Generate keys
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)
public_key = private_key.public_key()

# Sign data
message = b"Important document"
signature = private_key.sign(
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)
print(f"Signature: {signature.hex()}")

# Verify signature
try:
    public_key.verify(
        signature,
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    print("Signature VALID")
except Exception:
    print("Signature INVALID")

# Tamper with message
try:
    public_key.verify(
        signature,
        b"Tampered document",
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
except Exception:
    print("Tampering detected!")
```

## Key Derivation

You don't use passwords directly as encryption keys. Passwords are low-entropy — they're guessable. Key derivation functions (KDFs) stretch a password into a cryptographic key by applying repeated hashing.

### PBKDF2

```python
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import os

def derive_key_from_password(password, salt=None):
    """Derive a key from a password using PBKDF2"""
    if salt is None:
        salt = os.urandom(16)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,  # OWASP recommended minimum
        backend=default_backend()
    )

    key = kdf.derive(password.encode())
    return key, salt

# Usage
password = "user_password_123"
key, salt = derive_key_from_password(password)

print(f"Salt: {salt.hex()}")
print(f"Key: {key.hex()}")

# To verify, derive again with same salt
verify_key, _ = derive_key_from_password(password, salt)
print(f"Keys match: {key == verify_key}")
```

### Argon2 (Modern)

Argon2 is the current winner of the Password Hashing Competition. It's memory-hard, making GPU attacks expensive:

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Create hasher
ph = PasswordHasher(
    time_cost=3,        # Number of iterations
    memory_cost=65536,  # 64 MB
    parallelism=4,      # Number of threads
    hash_len=32,
    salt_len=16
)

# Hash a password
password = "secure_password_123"
hashed = ph.hash(password)
print(f"Hash: {hashed}")

# Verify
try:
    ph.verify(hashed, password)
    print("Password VALID")
except VerifyMismatchError:
    print("Password INVALID")

# Check if hash needs rehashing (e.g., after parameter change)
if ph.check_needs_rehash(hashed):
    print("Hash needs rehashing with new parameters")
    hashed = ph.hash(password)
```

## Real Scenario: Implementing a Password Manager

Build a password manager that encrypts credentials locally. It uses a master password to derive an encryption key, then uses that key to encrypt stored passwords.

```python
#!/usr/bin/env python3
"""
Simple Password Manager
Encrypts passwords using a master password.
"""

import json
import os
import hashlib
import base64
from pathlib import Path
from datetime import datetime
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend


class PasswordManager:
    def __init__(self, vault_file="vault.enc"):
        self.vault_file = Path(vault_file)
        self.salt_file = Path(vault_file + ".salt")
        self.fernet = None
        self.entries = {}

    def _derive_key(self, master_password, salt):
        """Derive encryption key from master password"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
        return key

    def _load_or_create_salt(self):
        """Load existing salt or create new one"""
        if self.salt_file.exists():
            return self.salt_file.read_bytes()
        else:
            salt = os.urandom(16)
            self.salt_file.write_bytes(salt)
            return salt

    def unlock(self, master_password):
        """Unlock the vault with master password"""
        salt = self._load_or_create_salt()
        key = self._derive_key(master_password, salt)
        self.fernet = Fernet(key)

        if self.vault_file.exists():
            self._load_vault()

        return True

    def _load_vault(self):
        """Load and decrypt vault"""
        encrypted = self.vault_file.read_bytes()
        decrypted = self.fernet.decrypt(encrypted)
        self.entries = json.loads(decrypted.decode())

    def _save_vault(self):
        """Encrypt and save vault"""
        data = json.dumps(self.entries, indent=2).encode()
        encrypted = self.fernet.encrypt(data)
        self.vault_file.write_bytes(encrypted)

    def add_entry(self, site, username, password, notes=""):
        """Add a new password entry"""
        self.entries[site] = {
            "username": username,
            "password": password,
            "notes": notes,
            "created": datetime.now().isoformat(),
            "modified": datetime.now().isoformat()
        }
        self._save_vault()
        print(f"Added: {site}")

    def get_entry(self, site):
        """Get a password entry"""
        if site in self.entries:
            entry = self.entries[site]
            print(f"Site:     {site}")
            print(f"Username: {entry['username']}")
            print(f"Password: {entry['password']}")
            if entry['notes']:
                print(f"Notes:    {entry['notes']}")
            return entry
        else:
            print(f"Entry not found: {site}")
            return None

    def list_entries(self):
        """List all entries"""
        if not self.entries:
            print("Vault is empty")
            return

        print(f"\n{'Site':<30} {'Username':<20}")
        print("-" * 50)
        for site, entry in sorted(self.entries.items()):
            print(f"{site:<30} {entry['username']:<20}")
        print(f"\nTotal: {len(self.entries)} entries")

    def delete_entry(self, site):
        """Delete an entry"""
        if site in self.entries:
            del self.entries[site]
            self._save_vault()
            print(f"Deleted: {site}")
        else:
            print(f"Entry not found: {site}")

    def generate_password(self, length=20):
        """Generate a random password"""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password


def main():
    import sys

    pm = PasswordManager()

    print("Password Manager")
    print("=" * 40)

    master_password = input("Master password: ")
    pm.unlock(master_password)

    while True:
        print("\nCommands: add, get, list, delete, generate, quit")
        command = input("> ").strip().lower()

        if command == "add":
            site = input("Site: ")
            username = input("Username: ")
            password = input("Password (or 'generate'): ")
            if password.lower() == "generate":
                password = pm.generate_password()
                print(f"Generated: {password}")
            notes = input("Notes (optional): ")
            pm.add_entry(site, username, password, notes)

        elif command == "get":
            site = input("Site: ")
            pm.get_entry(site)

        elif command == "list":
            pm.list_entries()

        elif command == "delete":
            site = input("Site: ")
            pm.delete_entry(site)

        elif command == "generate":
            length = input("Length (20): ").strip()
            length = int(length) if length else 20
            print(f"Generated: {pm.generate_password(length)}")

        elif command == "quit":
            break

        else:
            print("Unknown command")


if __name__ == "__main__":
    main()
```

## Secure Random Number Generation

Cryptographic security depends on random numbers. Use `os.urandom()` or `secrets`, never `random`.

```python
import os
import secrets
import random

# GOOD: Cryptographically secure random
key = os.urandom(32)           # 256-bit key
nonce = os.urandom(12)         # 96-bit nonce
token = secrets.token_urlsafe(32)  # URL-safe token
password = secrets.token_hex(16)   # 32-char hex string

# BAD: Not cryptographically secure
# random.randint(0, 255)  # Predictable PRNG
# random.choice(string.ascii_letters)  # Mersenne Twister is predictable

# Password generation with secrets
import string

def generate_password(length=20):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Verify it has at least one of each type
        if (any(c.islower() for c in password) and
            any(c.isupper() for c in password) and
            any(c.isdigit() for c in password)):
            return password
```

The `random` module uses the Mersenne Twister algorithm, which is deterministic — given the same seed, it produces the same sequence. An attacker who observes enough outputs can predict future values. `os.urandom()` reads from the operating system's entropy pool, which collects noise from hardware events. For security purposes, always use `os.urandom()` or the `secrets` module.

## Common Cryptographic Mistakes

These mistakes appear in real-world code and in security audits:

```python
# MISTAKE 1: Using MD5 for password hashing
import hashlib
# BAD: MD5 is fast and unsalted
# hash = hashlib.md5(password.encode()).hexdigest()
# GOOD: Use bcrypt, scrypt, or Argon2

# MISTAKE 2: ECB mode in AES
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
# BAD: ECB encrypts each block independently, revealing patterns
# cipher = Cipher(algorithms.AES(key), modes.ECB())
# GOOD: Use CBC or GCM with random IV

# MISTAKE 3: Encrypt-then-MAC vs MAC-then-encrypt
# BAD: MAC-then-encrypt (TLS 1.0 vulnerability)
# GOOD: Encrypt-then-MAC or use AEAD (AES-GCM, ChaCha20-Poly1305)

# MISTAKE 4: Hardcoded keys
# BAD: key = b"supersecretkey123"
# GOOD: Derive from password or load from secure storage

# MISTAKE 5: Short salt or no salt
# BAD: salt = b"ab"
# GOOD: salt = os.urandom(16)  # 128-bit minimum

# MISTAKE 6: Low PBKDF2 iterations
# BAD: iterations=1000
# GOOD: iterations=480000  # OWASP 2023 recommendation

# MISTAKE 7: Using random for IV generation
# BAD: iv = bytes(random.randint(0, 255) for _ in range(16))
# GOOD: iv = os.urandom(16)
```

## Encryption Best Practices

Always use authenticated encryption (AES-GCM or Fernet). Never roll your own crypto. Use established libraries. The `cryptography` library has been audited. Your custom implementation hasn't.

```python
# GOOD: Authenticated encryption
from cryptography.fernet import Fernet
key = Fernet.generate_key()
cipher = Fernet(key)
encrypted = cipher.encrypt(b"data")

# BAD: Unauthenticated encryption (CBC without MAC)
# An attacker can modify ciphertext without detection

# GOOD: Random IVs/nonces
import os
iv = os.urandom(12)  # Always random

# BAD: Reusing IVs
# The same key+IV = catastrophic key reuse

# GOOD: Separate keys for different purposes
encryption_key = os.urandom(32)  # For encrypting data
signing_key = os.urandom(32)     # For signing data
# BAD: Using the same key for both
```

### When to Use What

| Use Case | Algorithm | Mode | Notes |
|----------|-----------|------|-------|
| Password storage | Argon2 or bcrypt | N/A | Never store plaintext passwords |
| Data at rest | AES-256-GCM | GCM | Authenticated, fast |
| Data in transit | TLS 1.3 | AEAD | Don't implement your own TLS |
| File encryption | AES-256-GCM | GCM | Generate random key per file |
| Database encryption | AES-256-CBC | CBC | Use per-row keys |
| Token generation | secrets module | N/A | URL-safe, high entropy |
| API keys | secrets.token_urlsafe | N/A | 32+ bytes minimum |
| Session tokens | secrets.token_hex | N/A | Store hash, not plaintext |

## Assessment

### Lab Task: Encrypted File Storage

Build an encrypted file storage system. Time limit: 90 minutes.

**Requirements:**
1. Accept a master password to derive an encryption key
2. Encrypt files using AES-GCM (authenticated encryption)
3. Store encrypted files with metadata (original name, encryption timestamp)
4. Decrypt files back to original state
5. List all encrypted files
6. Verify file integrity after decryption

**Deliverables:**
- Source code (`secure_storage.py`)
- Demonstration encrypting and decrypting at least 3 files
- Written explanation of why authenticated encryption matters

**Grading Criteria:**
- Key derivation works correctly (20 points)
- Encryption/decryption works (25 points)
- Authentication detects tampering (20 points)
- File metadata is preserved (15 points)
- Code handles errors gracefully (20 points)

### Bonus Challenges

- Add file sharing (encrypt with recipient's public key)
- Implement key rotation (re-encrypt all files with new key)
- Add password strength estimation
- Implement secure deletion (overwrite before delete)

## Key Management

The hardest part of cryptography is not the algorithms — it's key management. An encrypted system with poorly managed keys is worse than an unencrypted system because it gives a false sense of security.

Key generation must use cryptographically secure random number generators. Never use `random` module for key generation. Never use a password directly as a key. Always derive keys from passwords using a KDF with a random salt.

Key storage must protect keys at rest. Keys in source code are compromised keys. Keys in environment variables are better but still accessible to processes running as the same user. Keys in hardware security modules or encrypted key vaults are ideal. For development, encrypted configuration files with restricted permissions are acceptable.

Key rotation must happen regularly. Encryption keys should have expiration dates. When a key expires, all data encrypted with it must be re-encrypted with a new key. This limits the damage from a compromised key — only data encrypted during the key's lifetime is affected.

Key revocation must be immediate when compromise is suspected. If you suspect a key has been compromised, rotate it immediately. Don't wait for the next scheduled rotation. Don't investigate first. Rotate, then investigate. The investigation can take days; the key compromise is happening now.

## Evidence

Cryptography is the foundation of data security. Every HTTPS connection, every encrypted database, every SSH tunnel relies on the primitives you learned here. The difference between a secure system and a vulnerable one is often just using the right mode of operation, the right key size, or the right KDF.

The key takeaway: never implement cryptography from scratch. Use established libraries. Understand the primitives so you can use them correctly, but let the library handle the math.

**Libraries covered:** hashlib, cryptography (Fernet, AES, RSA, PBKDF2), argon2, os, json

**Concepts covered:** Hashing (MD5, SHA-1, SHA-256), HMAC, symmetric encryption (Fernet, AES-CBC, AES-GCM), asymmetric encryption (RSA), digital signatures, key derivation (PBKDF2, Argon2), password storage