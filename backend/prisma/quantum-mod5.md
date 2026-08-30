# Module 5 — Post-Quantum Algorithms: Lattice, Hash, and Code-Based Cryptography

## What You'll Actually Do

You will implement and test post-quantum cryptographic primitives. You will understand why lattice problems are hard even for quantum computers, build a basic LWE-based key exchange, and compare the three main families of post-quantum algorithms.

## Content

### Why Lattice Problems Are Hard

Lattice-based cryptography relies on problems like the Learning With Errors (LWE) problem. Even with a quantum computer, no efficient algorithm is known for LWE.

```python
import numpy as np

def lwe_sample(n, q, sigma):
    """Generate an LWE sample: (a, b = <a, s> + e mod q)"""
    a = np.random.randint(0, q, size=n)
    s = np.random.randint(0, q, size=n)       # Secret key
    e = np.round(np.random.normal(0, sigma, size=n)).astype(int)
    b = (np.dot(a, s) + e) % q
    return a, b, s

# The LWE problem: given (a, b), find s
# Even with quantum computers, this takes 2^Ω(n) time
n = 256      # Dimension
q = 7681     # Modulus (prime)
sigma = 3.2  # Error standard deviation

a, b, s = lwe_sample(n, q, sigma)
print(f"Public key size: {a.nbytes + b.nbytes} bytes")
print(f"Secret key size: {s.nbytes} bytes")
```

### Building a Basic Key Exchange

The New Hope key exchange (simplified) demonstrates how LWE becomes a key exchange protocol:

```python
import numpy as np

class SimpleLWEKeyExchange:
    def __init__(self, n=256, q=7681, sigma=3.2):
        self.n = n
        self.q = q
        self.sigma = sigma

    def generate_keypair(self):
        a = np.random.randint(0, self.q, size=self.n)
        s = np.random.randint(0, self.q, size=self.n)
        e = np.round(np.random.normal(0, self.sigma, size=self.n)).astype(int)
        b = (np.dot(a, s) + e) % self.q
        return (a, b), s  # Public key, secret key

    def compute_shared_secret(self, public_key, secret_key):
        a, b = public_key
        e2 = np.round(np.random.normal(0, self.sigma, size=self.n)).astype(int)
        u = (np.dot(a, secret_key) + e2) % self.q
        v = (np.dot(b, secret_key)) % self.q  # Simplified
        return u, v

# Alice and Bob exchange keys
exchange = SimpleLWEKeyExchange()
alice_pub, alice_priv = exchange.generate_keypair()
bob_pub, bob_priv = exchange.generate_keypair()

alice_shared = exchange.compute_shared_secret(bob_pub, alice_priv)
bob_shared = exchange.compute_shared_secret(alice_pub, bob_priv)
print("Shared secrets match:", np.allclose(alice_shared, bob_shared))
```

### Hash-Based Signatures

Hash-based signatures rely only on the security of hash functions—no number theory assumptions.

```python
import hashlib
import os

class SimpleWOTS:
    """Simplified Winternitz One-Time Signature scheme."""
    def __init__(self, n=32):
        self.n = n

    def _hash_chain(self, x, length):
        h = x
        for _ in range(length):
            h = hashlib.sha256(h).digest()[:self.n]
        return h

    def keygen(self, seed=None):
        if seed is None:
            seed = os.urandom(self.n)
        private_key = [os.urandom(self.n) for _ in range(256)]
        public_key = [self._hash_chain(k, 255) for k in private_key]
        return private_key, public_key

    def sign(self, private_key, message):
        msg_hash = hashlib.sha256(message).digest()[:32]
        signature = []
        for i, sk in enumerate(private_key):
            chain_len = msg_hash[i % 32] % 16
            signature.append(self._hash_chain(sk, chain_len))
        return signature

wots = SimpleWOTS()
priv, pub = wots.keygen()
msg = b"quantum-resistant message"
sig = wots.sign(priv, msg)
print(f"Signature: {len(sig)} chains of {len(sig[0])} bytes each")
```

### Code-Based Cryptography

Code-based schemes like Classic McEliece rely on the difficulty of decoding random linear codes. The public key is enormous (hundreds of kilobytes), but the security assumption is well-studied.

### NIST Post-Quantum Standards

| Algorithm | Type | Use | NIST Status |
|---|---|---|---|
| CRYSTALS-Kyber | Lattice | Key encapsulation | Standard (FIPS 203) |
| CRYSTALS-Dilithium | Lattice | Digital signatures | Standard (FIPS 204) |
| SPHINCS+ | Hash | Digital signatures | Standard (FIPS 205) |
| Classic McEliece | Code-based | Key encapsulation | Round 4 |
| BIKE | Code-based | Key encapsulation | Round 4 |
| HQC | Code-based | Key encapsulation | Round 4 |

## Assessment

**Lab: Build a LWE Key Exchange**

Implement a complete LWE key exchange with key generation, encapsulation, and decapsulation. Test it with 5 different parameter sets (varying n and q). Measure key sizes, ciphertext sizes, and computation time. Then compare the three post-quantum families (lattice, hash, code-based) on key size, ciphertext size, and security assumptions.

- Time: 60 minutes
- Grading: Working key exchange with correct shared secrets (30%), parameter exploration with measurements (30%), family comparison table (20%), analysis of trade-offs (20%)

## Evidence

Upload your notebook with key exchange implementation, measurement table, and your family comparison with recommendations.
