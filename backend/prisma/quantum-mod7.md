# Module 7 — Digital Signatures: CRYSTALS-Dilithium and XMSS

## What You'll Actually Do

You will implement CRYSTALS-Dilithium signatures, build a hash-based signature scheme from scratch, and understand the trade-offs between lattice-based and hash-based approaches. You will measure signature sizes, verification speed, and key generation time.

## Content

### CRYSTALS-Dilithium Signatures

Dilithium is the NIST standard for post-quantum digital signatures. It uses the Module-LWE and Module-SIS problems.

```python
from pqcrypto.sign.dilithium2 import generate_keypair, sign, verify

# Key generation
public_key, secret_key = generate_keypair()
print(f"Public key: {len(public_key)} bytes")
print(f"Secret key: {len(secret_key)} bytes")

# Sign a message
message = b"post-quantum signature"
signature = sign(secret_key, message)
print(f"Signature: {len(signature)} bytes")

# Verify
try:
    verify(public_key, message, signature)
    print("Signature valid!")
except Exception:
    print("Signature invalid!")
```

### Dilithium Security Levels

```python
dilithium_params = {
    "Dilithium2": {"security": "NIST Level 2", "pk": 1312, "sk": 2528, "sig": 2420},
    "Dilithium3": {"security": "NIST Level 3", "pk": 1952, "sk": 4000, "sig": 3293},
    "Dilithium5": {"security": "NIST Level 5", "pk": 2592, "sk": 4864, "sig": 4595},
}

for name, params in dilithium_params.items():
    print(f"{name}: {params['security']}")
    print(f"  PK: {params['pk']} B, SK: {params['sk']} B, Sig: {params['sig']} B")
    print(f"  Total: {params['pk'] + params['sk'] + params['sig']} bytes")
```

### Building Hash-Based Signatures (XMSS)

XMSS is a stateful hash-based signature scheme standardized by NIST. It relies solely on hash function security.

```python
import hashlib
import os

class XMSSNode:
    """A single node in the XMSS Merkle tree."""
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

class SimpleXMSS:
    def __init__(self, height=4, hash_func=hashlib.sha256):
        self.height = height
        self.leaves = 2 ** height
        self.hash_func = hash_func
        self.state = 0  # Must increment after each signature
        self.private_keys = [os.urandom(32) for _ in range(self.leaves)]
        self.tree = self._build_tree()

    def _hash(self, data):
        return self.hash_func(data).digest()

    def _build_tree(self):
        leaves = [XMSSNode(self._hash(sk)) for sk in self.private_keys]
        nodes = leaves
        for _ in range(self.height):
            next_level = []
            for i in range(0, len(nodes), 2):
                combined = nodes[i].value + nodes[i+1].value
                parent = XMSSNode(self._hash(combined), nodes[i], nodes[i+1])
                next_level.append(parent)
            nodes = next_level
        return nodes[0]

    def get_auth_path(self, index):
        """Get the authentication path (Merkle proof) for leaf at index."""
        path = []
        node = self.tree
        for _ in range(self.height):
            if index % 2 == 0:
                path.append(node.right.value)
                node = node.left
            else:
                path.append(node.left.value)
                node = node.right
            index //= 2
        return path

    def sign(self, message):
        if self.state >= self.leaves:
            raise ValueError("Key exhausted - stateful scheme requires new keys")
        idx = self.state
        self.state += 1
        leaf_hash = self._hash(self.private_keys[idx])
        auth_path = self.get_auth_path(idx)
        return {
            "index": idx,
            "leaf": leaf_hash,
            "auth_path": auth_path,
            "message": message,
            "signature": self._hash(self.private_keys[idx] + message)
        }

xmss = SimpleXMSS(height=4)
sig = xmss.sign(b"quantum-safe message")
print(f"XMSS signature: index={sig['index']}, "
      f"auth_path={len(sig['auth_path'])} nodes")
```

### Stateful vs Stateless Hash Signatures

**XMSS (Stateful)**: Must track which leaf was used. Reusing a leaf destroys security. This is operationally dangerous—if the state is lost or duplicated, the scheme breaks.

**SPHINCS+ (Stateless)**: No state tracking needed. Uses a few-time signature scheme on top of a Merkle tree. Larger signatures but simpler to deploy.

```python
hash_sigs = {
    "XMSS":       {"type": "Stateful", "sig_size": "~2.5 KB", "pk_size": "~64 B", "security": "Conservative"},
    "SPHINCS+":   {"type": "Stateless", "sig_size": "~17-49 KB", "pk_size": "~32-64 B", "security": "Conservative"},
    "LMS":        {"type": "Stateful", "sig_size": "~2-8 KB", "pk_size": "~60 B", "security": "Conservative"},
}

for name, props in hash_sigs.items():
    print(f"{name}: {props['type']}, sig={props['sig_size']}, pk={props['pk_size']}")
```

### Dilithium vs Hash-Based Signatures

| Property | Dilithium2 | SPHINCS+-128s |
|---|---|---|
| Signature size | 2,420 bytes | 7,856 bytes |
| Public key | 1,312 bytes | 32 bytes |
| Secret key | 2,528 bytes | 64 bytes |
| Sign speed | Fast | Slow |
| Verify speed | Fast | Moderate |
| Assumption | Module-LWE/SIS | Hash function only |
| Stateful | No | No |

## Assessment

**Lab: Signature Showdown**

Implement Dilithium signing and verification (using the library). Build XMSS from scratch with height=4 (16 leaves). For each scheme: generate keys, sign 10 messages, verify all signatures, and measure timing. Compare Dilithium2, Dilithium3, and SPHINCS+ on all metrics. Write a recommendation for which scheme to use in a code signing system.

- Time: 60 minutes
- Grading: Working Dilithium implementation (25%), working XMSS from scratch (30%), benchmarking and comparison (25%), code signing recommendation (20%)

## Evidence

Upload your notebook with both implementations, benchmarking results, comparison table, and code signing recommendation.
