# Module 8 — Migration: Hybrid Approaches and Crypto Agility

## What You'll Actually Do

You will audit a real codebase for quantum-vulnerable cryptography, design a hybrid encryption system that uses both classical and post-quantum algorithms, and build a crypto-agile framework that allows swapping algorithms without rewriting application code. This is the module that turns theory into deployment.

## Content

### Finding Quantum-Vulnerable Crypto in Real Code

```python
import re
import os

vulnerable_patterns = {
    "RSA":          r"RSA|PKCS1|rsa_decrypt|rsa_encrypt",
    "ECDSA":        r"ECDSA|ecdsa|secp256|secp384",
    "ECDH":         r"ECDH|ecdh|X25519|X448",
    "DH":           r"DHParameters|DiffieHellman|dh_generate",
    "DES":          r"DES|TripleDES|3DES",
    "AES-128":      r"AES-128|AES128|key_size.*128",
    "MD5":          r"MD5|md5",
    "SHA-1":        r"SHA-1|sha1",
}

def audit_file(filepath):
    findings = []
    with open(filepath, 'r', errors='ignore') as f:
        for line_num, line in enumerate(f, 1):
            for algo, pattern in vulnerable_patterns.items():
                if re.search(pattern, line, re.IGNORECASE):
                    findings.append({
                        "file": filepath,
                        "line": line_num,
                        "algorithm": algo,
                        "content": line.strip()[:80]
                    })
    return findings

# Scan a project
all_findings = []
for root, dirs, files in os.walk("."):
    for f in files:
        if f.endswith(('.py', '.js', '.ts', '.java', '.go')):
            all_findings.extend(audit_file(os.path.join(root, f)))

for finding in all_findings[:10]:
    print(f"{finding['file']}:{finding['line']} [{finding['algorithm']}] {finding['content']}")
```

### Building a Hybrid Encryption System

Hybrid encryption uses both classical and post-quantum algorithms. The data is safe if either algorithm remains secure.

```python
import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class HybridEncryptor:
    """Hybrid encryption: X25519 + Kyber-768 + AES-256-GCM."""

    def __init__(self):
        self.kem_algorithm = "Kyber-768"
        self.classical_algorithm = "X25519"
        self.sym_algorithm = "AES-256-GCM"

    def generate_classical_keypair(self):
        """Generate X25519 keypair (classical)."""
        from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
        private_key = X25519PrivateKey.generate()
        public_key = private_key.public_key()
        return private_key, public_key

    def hybrid_encapsulate(self, classical_pub, kyber_pub):
        """Encapsulate using both algorithms."""
        # Classical ECDH
        from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
        eph_priv = X25519PrivateKey.generate()
        classical_shared = eph_priv.exchange(classical_pub)

        # Post-quantum Kyber
        from pqcrypto.kem.kyber_768 import encapsulate
        kyber_ct, kyber_ss = encapsulate(kyber_pub)

        # Combine shared secrets with HKDF
        combined = classical_shared + kyber_ss
        derived_key = hashlib.sha256(combined).digest()

        return {
            "ephemeral_pub": eph_priv.public_key(),
            "kyber_ciphertext": kyber_ct,
            "derived_key": derived_key
        }

    def hybrid_decapsulate(self, classical_priv, kyber_priv, encapsulation):
        """Decapsulate using both algorithms."""
        from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PublicKey

        # Classical ECDH
        classical_shared = classical_priv.exchange(encapsulation["ephemeral_pub"])

        # Post-quantum Kyber
        from pqcrypto.kem.kyber_768 import decapsulate
        kyber_ss = decapsulate(kyber_priv, encapsulation["kyber_ciphertext"])

        # Combine
        combined = classical_shared + kyber_ss
        derived_key = hashlib.sha256(combined).digest()

        return derived_key

    def encrypt(self, key, plaintext):
        nonce = os.urandom(12)
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)
        return nonce + ciphertext

    def decrypt(self, key, data):
        nonce, ciphertext = data[:12], data[12:]
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext, None)

# Usage
hybrid = HybridEncryptor()
classical_priv, classical_pub = hybrid.generate_classical_keypair()
kyber_pub, kyber_priv = generate_keypair()  # From Kyber library

encap = hybrid.hybrid_encapsulate(classical_pub, kyber_pub)
key = encap["derived_key"]

ciphertext = hybrid.encrypt(key, b"hybrid encrypted message")
plaintext = hybrid.decrypt(key, ciphertext)
print(f"Decrypted: {plaintext.decode()}")
```

### Crypto Agility Framework

The goal: swap cryptographic algorithms without changing application code.

```python
from abc import ABC, abstractmethod

class CryptoBackend(ABC):
    @abstractmethod
    def generate_keypair(self): pass

    @abstractmethod
    def encapsulate(self, public_key): pass

    @abstractmethod
    def decapsulate(self, private_key, ciphertext): pass

class KyberBackend(CryptoBackend):
    name = "Kyber-768"

    def generate_keypair(self):
        from pqcrypto.kem.kyber_768 import generate_keypair
        return generate_keypair()

    def encapsulate(self, public_key):
        from pqcrypto.kem.kyber_768 import encapsulate
        return encapsulate(public_key)

    def decapsulate(self, private_key, ciphertext):
        from pqcrypto.kem.kyber_768 import decapsulate
        return decapsulate(private_key, ciphertext)

class HybridBackend(CryptoBackend):
    name = "Hybrid-X25519-Kyber"

    def __init__(self):
        self.classical_backend = X25519Backend()
        self.pq_backend = KyberBackend()

    def generate_keypair(self):
        return {
            "classical": self.classical_backend.generate_keypair(),
            "pq": self.pq_backend.generate_keypair()
        }

    def encapsulate(self, public_key):
        # Combine both
        pass  # Implementation follows HybridEncryptor pattern

# Swap backends without changing application code
def secure_communication(backend: CryptoBackend, peer_public_key):
    shared_secret = backend.encapsulate(peer_public_key)
    return shared_secret

# Currently using hybrid
backend = HybridBackend()
# Future: just swap this line
# backend = KyberBackend()
```

## Assessment

**Lab: Crypto Migration Project**

Audit a Python web application (provided) for quantum-vulnerable cryptography. Build a crypto-agile configuration system that supports at least three backends (classical, post-quantum, hybrid). Implement hybrid key exchange using both X25519 and Kyber. Write a migration plan document that prioritizes which components to migrate first and why.

- Time: 75 minutes
- Grading: Correct vulnerability audit (20%), working crypto-agile framework (25%), hybrid implementation (25%), migration plan with priorities (30%)

## Evidence

Upload your audit report, crypto-agile implementation, hybrid encryption code, and migration plan document.
