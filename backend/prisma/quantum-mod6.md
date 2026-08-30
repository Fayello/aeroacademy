# Module 6 — Key Exchange: CRYSTALS-Kyber and NIST Standards

## What You'll Actually Do

You will implement CRYSTALS-Kyber key encapsulation, understand the Module-LWE problem it relies on, and test it with real parameters. You will measure performance, key sizes, and compare Kyber with classical key exchange.

## Content

### How Kyber Works

Kyber is a key encapsulation mechanism (KEM) based on the Module-LWE problem. It generates a shared secret that two parties can use to encrypt communication.

```python
# Using the pqcrypto library (pip install pqcrypto)
from pqcrypto.kem.kyber_512 import generate_keypair, encapsulate, decapsulate

# Key generation
public_key, secret_key = generate_keypair()
print(f"Public key: {len(public_key)} bytes")
print(f"Secret key: {len(secret_key)} bytes")

# Alice encapsulates a shared secret using Bob's public key
ciphertext, shared_secret_alice = encapsulate(public_key)
print(f"Ciphertext: {len(ciphertext)} bytes")
print(f"Shared secret: {len(shared_secret_alice)} bytes")

# Bob decapsulates using his secret key
shared_secret_bob = decapsulate(secret_key, ciphertext)

# Shared secrets must match
assert shared_secret_alice == shared_secret_bob
print("Shared secrets match!")
```

### Security Levels

Kyber comes in three parameter sets, each targeting a different NIST security level:

```python
security_levels = {
    "Kyber-512":  {"security": "NIST Level 1 (AES-128 equivalent)", "pk": 800, "ct": 768, "ss": 32},
    "Kyber-768":  {"security": "NIST Level 3 (AES-192 equivalent)", "pk": 1184, "ct": 1088, "ss": 32},
    "Kyber-1024": {"security": "NIST Level 5 (AES-256 equivalent)", "pk": 1568, "ct": 1568, "ss": 32},
}

for name, params in security_levels.items():
    print(f"{name}: {params['security']}")
    print(f"  Public key: {params['pk']} bytes, Ciphertext: {params['ct']} bytes")
```

### The Module-LWE Problem

Kyber's security relies on the Module-LWE problem: given a matrix A and vectors b = As + e (where s is the secret and e is small error), find s. The "module" part means working over polynomial rings for efficiency.

```python
import numpy as np

def module_lwe_sample(n, k, q, sigma):
    """Generate a Module-LWE sample for Kyber-like parameters."""
    # k × k matrix of polynomials
    A = np.random.randint(0, q, size=(k, k))
    # Secret vector of polynomials
    s = np.random.randint(-2, 3, size=(k))  # Small entries
    # Error vector
    e = np.round(np.random.normal(0, sigma, size=k)).astype(int)
    # Compute b = A·s + e (mod q)
    b = (A @ s + e) % q
    return A, b, s

# Kyber-512 uses k=2, n=256, q=3329
A, b, s = module_lwe_sample(256, 2, 3329, 1.0)
print(f"Matrix A shape: {A.shape}")
print(f"Public key (A, b) size: {A.nbytes + b.nbytes} bytes")
```

### Encapsulation and Decapsulation

The KEM workflow is simple:

1. **KeyGen**: Generate (public_key, secret_key)
2. **Encapsulate**: Using public_key, produce (ciphertext, shared_secret)
3. **Decapsulate**: Using secret_key and ciphertext, recover shared_secret

```python
# Performance benchmarking
import time

iterations = 1000

start = time.time()
for _ in range(iterations):
    pk, sk = generate_keypair()
keygen_time = (time.time() - start) / iterations

start = time.time()
for _ in range(iterations):
    ct, ss = encapsulate(pk)
encap_time = (time.time() - start) / iterations

start = time.time()
for _ in range(iterations):
    _ = decapsulate(sk, ct)
decap_time = (time.time() - start) / iterations

print(f"KeyGen:  {keygen_time*1000:.3f} ms")
print(f"Encaps:  {encap_time*1000:.3f} ms")
print(f"Decaps:  {decap_time*1000:.3f} ms")
```

### Kyber vs X25519

| Property | X25519 | Kyber-768 |
|---|---|---|
| Public key | 32 bytes | 1184 bytes |
| Ciphertext | 32 bytes | 1088 bytes |
| Shared secret | 32 bytes | 32 bytes |
| Quantum safe | No | Yes |
| Key generation | ~50 μs | ~100 μs |
| Operations | Scalar mult | Polynomial operations |

Kyber is larger and slower than X25519, but it survives quantum attacks.

## Assessment

**Lab: Kyber in Practice**

Implement Kyber-512, Kyber-768, and Kyber-1024. For each: generate 100 keypairs, measure key sizes and timing, encapsulate and decapsulate, verify shared secrets match. Then compare Kyber-768 with X25519 on all metrics. Write a 300-word recommendation for which Kyber parameter set to use in a TLS deployment.

- Time: 50 minutes
- Grading: Correct implementation across all three parameter sets (30%), accurate benchmarking (30%), comparison table (20%), deployment recommendation (20%)

## Evidence

Upload your notebook with benchmarking results, comparison table, and deployment recommendation.
