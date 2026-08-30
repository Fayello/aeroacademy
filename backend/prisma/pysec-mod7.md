# Module 7 — Cryptography with Python

## What You'll Actually Do

Implement hashing, symmetric/asymmetric encryption, key derivation, and digital signatures using Python's standard library and pycryptodome. You'll understand what's happening under the hood, not just call functions.

## Hashing — integrity verification

```python
import hashlib

def hash_file(path, algorithm='sha256'):
    """Hash a file using any hashlib algorithm."""
    h = hashlib.new(algorithm)
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def hash_string(text, algorithm='sha256'):
    """Hash a string."""
    return hashlib.new(algorithm, text.encode()).hexdigest()

# Compare hashes
known_hash = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
test_hash = hash_string("hello")
print(f"Match: {test_hash == known_hash}")

# Different algorithms, different use cases
text = "password123"
print(f"MD5:    {hashlib.md5(text.encode()).hexdigest()}")
print(f"SHA1:   {hashlib.sha1(text.encode()).hexdigest()}")
print(f"SHA256: {hashlib.sha256(text.encode()).hexdigest()}")
print(f"SHA512: {hashlib.sha512(text.encode()).hexdigest()}")
```

## HMAC — authenticated hashing

```python
import hmac
import hashlib

def create_hmac(key, message):
    """Create HMAC-SHA256 for message authentication."""
    return hmac.new(
        key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

def verify_hmac(key, message, expected):
    """Constant-time comparison to prevent timing attacks."""
    actual = create_hmac(key, message)
    return hmac.compare_digest(actual, expected)

# Usage
secret = "my-secret-key"
message = "transfer $1000 to account 123"
sig = create_hmac(secret, message)
print(f"HMAC: {sig}")

# Verify
print(f"Valid: {verify_hmac(secret, message, sig)}")
print(f"Tampered: {verify_hmac(secret, message + '!', sig)}")
```

## Symmetric encryption — AES

```python
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import base64

def aes_encrypt(plaintext, key):
    """AES-CBC encryption with PKCS7 padding."""
    if len(key) not in (16, 24, 32):
        key = hashlib.sha256(key.encode()).digest()  # Derive key from passphrase

    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct = cipher.encrypt(pad(plaintext.encode(), AES.block_size))
    return base64.b64encode(iv + ct).decode()

def aes_decrypt(ciphertext, key):
    """AES-CBC decryption."""
    if len(key) not in (16, 24, 32):
        key = hashlib.sha256(key.encode()).digest()

    raw = base64.b64decode(ciphertext)
    iv, ct = raw[:16], raw[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt.decode()

# Example
key = "my-secret-key"
encrypted = aes_encrypt("Top secret data", key)
print(f"Encrypted: {encrypted}")
decrypted = aes_decrypt(encrypted, key)
print(f"Decrypted: {decrypted}")

# AES-GCM — authenticated encryption (recommended)
def aes_gcm_encrypt(plaintext, key):
    """AES-GCM — provides both encryption and authentication."""
    if len(key) not in (16, 24, 32):
        key = hashlib.sha256(key.encode()).digest()

    cipher = AES.new(key, AES.MODE_GCM)
    ct, tag = cipher.encrypt_and_digest(plaintext.encode())
    return base64.b64encode(cipher.nonce + tag + ct).decode()

def aes_gcm_decrypt(ciphertext, key):
    """AES-GCM decryption with authentication."""
    if len(key) not in (16, 24, 32):
        key = hashlib.sha256(key.encode()).digest()

    raw = base64.b64decode(ciphertext)
    nonce, tag, ct = raw[:16], raw[16:32], raw[32:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    pt = cipher.decrypt_and_verify(ct, tag)
    return pt.decode()

encrypted = aes_gcm_encrypt("Authenticated data", key)
print(f"GCM Encrypted: {encrypted}")
decrypted = aes_gcm_decrypt(encrypted, key)
print(f"GCM Decrypted: {decrypted}")
```

## Asymmetric encryption — RSA

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

def generate_rsa_keypair(bits=2048):
    """Generate RSA key pair."""
    key = RSA.generate(bits)
    private_key = key.export_key()
    public_key = key.publickey().export_key()
    return private_key, public_key

def rsa_encrypt(message, public_key_pem):
    """Encrypt with public key — only private key can decrypt."""
    public_key = RSA.import_key(public_key_pem)
    cipher = PKCS1_OAEP.new(public_key)
    ct = cipher.encrypt(message.encode())
    return base64.b64encode(ct).decode()

def rsa_decrypt(ciphertext, private_key_pem):
    """Decrypt with private key."""
    private_key = RSA.import_key(private_key_pem)
    cipher = PKCS1_OAEP.new(private_key)
    pt = cipher.decrypt(base64.b64decode(ciphertext))
    return pt.decode()

def rsa_sign(message, private_key_pem):
    """Create a digital signature."""
    private_key = RSA.import_key(private_key_pem)
    h = SHA256.new(message.encode())
    signature = pkcs1_15.new(private_key).sign(h)
    return base64.b64encode(signature).decode()

def rsa_verify(message, signature, public_key_pem):
    """Verify a digital signature."""
    public_key = RSA.import_key(public_key_pem)
    h = SHA256.new(message.encode())
    try:
        pkcs1_15.new(public_key).verify(h, base64.b64decode(signature))
        return True
    except (ValueError, TypeError):
        return False

# Generate keys
private_key, public_key = generate_rsa_keypair()

# Encrypt/decrypt
encrypted = rsa_encrypt("Secret message", public_key)
decrypted = rsa_decrypt(encrypted, private_key)
print(f"RSA decrypted: {decrypted}")

# Sign/verify
sig = rsa_sign("Important data", private_key)
print(f"Signature valid: {rsa_verify('Important data', sig, public_key)}")
print(f"Tampered valid: {rsa_verify('Tampered data', sig, public_key)}")
```

## Key derivation — passwords to keys

```python
import hashlib
import os

def derive_key_pbkdf2(password, salt=None, iterations=100000):
    """PBKDF2 — standard password-based key derivation."""
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, iterations)
    return salt, key

def derive_key_scrypt(password, salt=None):
    """scrypt — memory-hard, better against GPU attacks."""
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return salt, key

def verify_password(password, stored_hash, salt, algorithm='pbkdf2'):
    """Verify a password against stored hash."""
    if algorithm == 'pbkdf2':
        _, key = derive_key_pbkdf2(password, salt)
    else:
        _, key = derive_key_scrypt(password, salt)
    return key == stored_hash

# Store a password securely
password = "user_password_123"
salt, key = derive_key_pbkdf2(password)
print(f"Salt: {salt.hex()}")
print(f"Key:  {key.hex()}")

# Verify
print(f"Correct: {verify_password(password, key, salt)}")
print(f"Wrong:   {verify_password('wrong_password', key, salt)}")
```

## Secure file encryption

```python
import os
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import hashlib
import base64

class SecureFileEncryptor:
    """Encrypt/decrypt files with password-derived keys."""

    def __init__(self, password):
        # Derive key from password
        self.salt = os.urandom(16)
        self.key = hashlib.pbkdf2_hmac(
            'sha256', password.encode(), self.salt, 100000
        )

    def encrypt_file(self, input_path, output_path):
        """Encrypt a file with AES-GCM."""
        with open(input_path, 'rb') as f:
            data = f.read()

        cipher = AES.new(self.key, AES.MODE_GCM)
        ct, tag = cipher.encrypt_and_digest(data)

        with open(output_path, 'wb') as f:
            f.write(self.salt)            # 16 bytes
            f.write(cipher.nonce)         # 16 bytes
            f.write(tag)                  # 16 bytes
            f.write(ct)                   # encrypted data

        print(f"Encrypted {input_path} -> {output_path}")

    def decrypt_file(self, input_path, output_path):
        """Decrypt a file."""
        with open(input_path, 'rb') as f:
            salt = f.read(16)
            nonce = f.read(16)
            tag = f.read(16)
            ct = f.read()

        key = hashlib.pbkdf2_hmac('sha256', b'', salt, 100000)  # Need original password
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        data = cipher.decrypt_and_verify(ct, tag)

        with open(output_path, 'wb') as f:
            f.write(data)

        print(f"Decrypted {input_path} -> {output_path}")

# Usage
enc = SecureFileEncryptor("strong_password_here")
enc.encrypt_file('sensitive.txt', 'sensitive.enc')
enc.decrypt_file('sensitive.enc', 'sensitive_decrypted.txt')
```

## Assessment

**Lab Task — Cryptography implementation (75 minutes)**

1. Write a script that hashes a file and displays the hash in multiple algorithms (MD5, SHA1, SHA256, SHA512)
2. Implement AES encryption/decryption that takes a passphrase and encrypts/decrypts a text file
3. Generate an RSA key pair and demonstrate encrypt/decrypt and sign/verify
4. Implement a password storage system using PBKDF2 with random salts
5. Write a secure file encryptor that combines all the above

**Grading:**
- File hashing with multiple algorithms: 15 pts
- AES encrypt/decrypt works correctly: 20 pts
- RSA key generation and operations: 20 pts
- PBKDF2 password storage with verification: 15 pts
- Secure file encryption combining everything: 20 pts
- Proper error handling: 10 pts

## Evidence

- Your cryptography scripts
- Output showing hash comparison for the same input
- RSA key pair generation output
- Encrypted/decrypted file comparison
- Notes explaining why you'd use PBKDF2 vs scrypt vs bcrypt
