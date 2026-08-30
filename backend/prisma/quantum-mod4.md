# Module 4 — Cryptographic Threats: Breaking RSA, ECC, and Symmetric Ciphers

## What You'll Actually Do

You will break real cryptographic systems using quantum algorithms. You will factor an RSA modulus, solve the elliptic curve discrete logarithm problem, and measure the impact on AES. Every threat you simulate is a real attack that a sufficiently large quantum computer could execute.

## Content

### Breaking RSA with Shor's Algorithm

RSA relies on the difficulty of factoring large semiprimes. A quantum computer running Shor's algorithm factors them in polynomial time.

```python
from fractions import Fraction
import math

def shors_factor(N):
    """Simulate Shor's algorithm by finding a non-trivial factor of N."""
    import random
    a = random.randrange(2, N)
    g = math.gcd(a, N)
    if g > 1:
        return g  # Lucky first guess

    # Classical simulation of quantum period-finding
    r = 1
    while pow(a, r, N) != 1:
        r += 1

    if r % 2 != 0:
        return None  # Try again

    x = pow(a, r // 2, N)
    f1 = math.gcd(x - 1, N)
    f2 = math.gcd(x + 1, N)

    if f1 not in (1, N):
        return f1
    if f2 not in (1, N):
        return f2
    return None

# Factor a 2048-bit RSA modulus (small example for simulation)
N = 2047  # = 23 × 89
factor = shors_factor(N)
print(f"{N} = {factor} × {N // factor}")

# Real RSA-2048: N = a 617-digit number
# Shor's algorithm breaks it in hours, not billions of years
```

In practice, factoring RSA-2048 requires roughly 4,000 logical qubits with error correction. Current quantum computers have ~1,000 noisy qubits. The timeline is uncertain, but the math is not.

### Breaking Elliptic Curve Cryptography

ECC relies on the elliptic curve discrete logarithm problem (ECDLP). Shor's algorithm solves ECDLP with similar complexity to factoring.

```python
# Conceptual representation — not runnable without quantum hardware
# The quantum circuit for ECDLP uses:
# 1. Superposition over all possible scalar multiples
# 2. Controlled elliptic curve point addition
# 3. Quantum Fourier transform to extract the discrete log

# Impact on real-world protocols:
attacks = {
    "ECDH key exchange": "Breaks in polynomial time",
    "ECDSA signatures": "Forge any signature",
    "Ed25519 signatures": "Forge any signature",
    "X25519 key agreement": "Recover shared secret",
}

for protocol, impact in attacks.items():
    print(f"{protocol}: {impact}")
```

Every protocol using elliptic curves—TLS, SSH, cryptocurrency wallets, code signing—becomes insecure.

### Impact on Symmetric Ciphers

Symmetric ciphers like AES are not broken, but weakened. Grover's algorithm reduces the effective key length by half.

```python
import math

ciphers = {
    "AES-128": {"classical_bits": 128, "quantum_bits": 64},
    "AES-192": {"classical_bits": 192, "quantum_bits": 96},
    "AES-256": {"classical_bits": 256, "quantum_bits": 128},
    "3DES":    {"classical_bits": 112, "quantum_bits": 56},
}

for name, info in ciphers.items():
    print(f"{name}: classical security = {info['classical_bits']} bits, "
          f"quantum security = {info['quantum_bits']} bits")

# AES-256 still provides 128-bit quantum security — enough
# AES-128 drops to 64-bit — broken
# 3DES drops to 56-bit — catastrophically broken
```

### Hash Functions

Grover's also speeds up hash preimage search from O(2ⁿ) to O(2ⁿ/²). SHA-256 drops to 128-bit quantum security. SHA-384/512 remain safe.

### Timeline and Reality Check

- **Current state**: No quantum computer can break RSA-2048
- **Conservative estimate**: 10–15 years for cryptographically relevant quantum computers
- **Harvest now, decrypt later**: Adversaries are recording encrypted traffic today to decrypt it once quantum computers arrive
- **The threat is real even if the machine doesn't exist yet**

## Assessment

**Lab: Break Things**

Use the Shor simulation to factor five different semiprimes of increasing size (up to 20 bits). For each, record the number of attempts needed. Then calculate the effective quantum security of three real-world key sizes (AES-128, AES-256, RSA-2048) and write a migration recommendation for a company currently using RSA-2048 and AES-128.

- Time: 50 minutes
- Grading: Correct factoring of all semiprimes (30%), correct security calculations (30%), migration recommendation with timeline and priorities (40%)

## Evidence

Upload your notebook with factoring results, security calculations table, and your written migration recommendation.
