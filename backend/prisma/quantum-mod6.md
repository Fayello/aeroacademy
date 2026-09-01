# Module 6: Key Exchange

## The Key Exchange Problem

Two parties who have never communicated before need to establish a shared secret key over an insecure channel. An eavesdropper can observe all messages but cannot compute the shared secret. This is the key exchange problem, solved classically by Diffie-Hellman (1976) and elliptic curve Diffie-Hellman (1985).

The quantum threat to key exchange is immediate: Shor's algorithm breaks both Diffie-Hellman and elliptic curve Diffie-Hellman. A quantum computer can compute the discrete logarithm, recovering the private key from the public key.

Post-quantum key exchange must resist both classical and quantum attacks. CRYSTALS-Kyber, selected by NIST as the primary post-quantum key encapsulation mechanism (KEM), is the focus of this module.

## CRYSTALS-Kyber: Deep Dive

### Mathematical Foundation

Kyber operates over the ring R_q = Z_q[x]/(x^n + 1) where q = 3329 and n = 256. Elements of R_q are polynomials of degree at most 255 with coefficients in {0, 1, ..., 3328}.

The security of Kyber relies on the Module-LWE problem: given a matrix A ∈ R_q^{k×k} and a vector t = A·s + e where s is a secret vector and e is a small error vector, find s. The parameter k controls the security level: k = 2 (Kyber-512), k = 3 (Kyber-768), k = 4 (Kyber-1024).

### Key Generation

The key generation process:

1. **Seed generation:** Generate a 32-byte random seed ρ and a 32-byte random seed σ.

2. **Matrix expansion:** Use the XOF (Extendable Output Function) based on SHAKE-128 with seed ρ to generate the matrix A ∈ R_q^{k×k}. Each entry of A is a uniformly random polynomial in R_q, but it is generated from the seed (so A does not need to be stored: it is regenerated on demand).

3. **Secret and error sampling:** Use seed σ with a PRF (Pseudorandom Function) to generate the secret vector s ∈ R_q^k and error vector e ∈ R_q^k. The coefficients of s and e are sampled from a centered binomial distribution (CBD) with parameter η (η = 2 for Kyber-512/768, η = 3 for Kyber-1024). The CBD produces small coefficients centered around 0.

4. **Public key computation:** Compute t = A·s + e (mod q).

5. **Output:** Public key pk = (ρ, t), Secret key sk = s.

The public key is compressed: t is represented using fewer bits per coefficient (12 bits per coefficient for Kyber-512/768, 11 bits for Kyber-1024). This introduces a small amount of additional noise that does not affect security.

**Why seed-based generation?** The matrix A is typically large (for Kyber-768, it contains 9 polynomials of degree 255 = 2,304 coefficients). Storing A explicitly would require approximately 4.6 KB. By generating A from a seed, the public key only needs to store the seed (32 bytes) and the vector t (approximately 1.1 KB for Kyber-768). This significantly reduces the public key size.

**Security margin analysis:** The best known attack on Kyber-768 requires approximately 2^185 quantum operations. This provides a comfortable security margin above the 128-bit minimum for post-quantum security. Even if a new attack reduces the security by 50 bits, Kyber-768 would still provide 135-bit quantum security.

**Key generation timing:** Key generation takes approximately 75 microseconds for Kyber-768. This is fast enough for real-time applications like TLS handshakes. The key generation involves matrix expansion (using SHAKE-128), secret and error sampling (using CBD), and public key computation (using NTT-based polynomial multiplication).

### Encapsulation

The encapsulation process generates a ciphertext and a shared secret:

1. **Message generation:** Generate a random 32-byte message m.

2. **Noise generation:** Use m as a seed to generate random vectors r ∈ R_q^k and e₁ ∈ R_q^k (with CBD sampling), and a scalar e₂ ∈ R_q (also CBD).

3. **Ciphertext computation:**
   - u = Aᵀ·r + e₁ (mod q): compressed to 10 bits per coefficient (Kyber-512/768) or 9 bits (Kyber-1024)
   - v = tᵀ·r + e₂ + ⌈q/2⌋·m (mod q): compressed to 4 bits per coefficient

4. **Ciphertext:** ct = (Compress(u), Compress(v))

5. **Shared secret derivation:** Use SHA3-256 to hash the message: K = SHA3-256(m)

The compression functions reduce ciphertext size at the cost of introducing quantization noise. This noise is small enough that it does not affect the correctness of decapsulation.

### Decapsulation

The decapsulation process recovers the shared secret from the ciphertext:

1. **Compute noise:** Compute a = v - sᵀ·u (mod q)

2. **Recover message:** The message m is encoded in the low-order bits of v. Compute m' = Round(a · 2/ q): this extracts the message by rounding.

3. **Re-encryption:** Using m', re-encapsulate to get (u', v').

4. **Validation:** Check if (u', v') equals (u, v) from the ciphertext (after decompression).

5. **Output:** If valid, output K = SHA3-256(m'). If invalid, output K = SHA3-256(Hash(ct)): this is the implicit rejection mechanism.

The implicit rejection is critical: if an attacker sends a malformed ciphertext, the decapsulation produces a pseudorandom shared secret instead of failing. This prevents attackers from distinguishing valid from invalid ciphertexts, which would leak information.

### Correctness Analysis

For correct decapsulation, the noise introduced by the error terms must be small enough that rounding recovers the correct message. The noise budget is:

noise = sᵀ·e₁ - eᵀ·r + e₂ + rounding_error

For Kyber-768, the standard deviation of this noise is approximately 3.2, and the noise is bounded (with overwhelming probability) by q/4 = 832. Since the message is encoded as ⌈q/2⌋·m ≈ 1665·m, the noise is well within the decoding threshold.

The correctness failure probability (the probability that noise exceeds the decoding threshold) is negligible: less than 2⁻¹³⁹ for Kyber-768.

### Security Analysis

The security of Kyber depends on the hardness of the Module-LWE problem. The best known attacks are:

1. **Lattice reduction (BKZ algorithm):** The Block Korkine-Zolotarev (BKZ) algorithm is the best known lattice reduction algorithm. For Module-LWE with dimension n·k and modulus q, BKZ requires approximately 2^{0.292·min(n·k, log₂(q))} operations.

2. **Quantum speedup:** Quantum lattice reduction provides a modest speedup (roughly 2×) for BKZ, but does not change the asymptotic complexity.

For Kyber-768 (n·k = 768, q = 3329):
- Classical security: approximately 192 bits
- Quantum security: approximately 185 bits (conservative estimate)

The security margin is comfortable: the best known attacks require approximately 2¹⁸⁵ quantum operations, well above the 128-bit minimum for post-quantum security.

## NIST Standardization

### The NIST PQC Process

NIST initiated the PQC standardization process in 2016, receiving 82 submissions. Through multiple rounds of evaluation:

**Round 1 (2017-2019):** 69 complete submissions, 26 alternatives. Evaluated for correctness, security, and performance.

**Round 2 (2019-2020):** 26 candidates. Focused on deeper security analysis.

**Round 3 (2020-2022):** 7 finalists and 8 alternates. Selected for standardization:

**KEM Standards:**
- CRYSTALS-Kyber (primary): FIPS 203
- ML-KEM (Module-Lattice-based Key-Encapsulation Mechanism): the standardized version of Kyber

**Signature Standards:**
- CRYSTALS-Dilithium (primary): FIPS 204
- FALCON (alternative): based on NTRU lattices, more complex but smaller signatures
- SPHINCS+ (stateless hash-based): FIPS 205

**Additional candidates under evaluation:**
- Classic McEliece (code-based)
- BIKE (code-based)
- HQC (code-based)

### FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism

FIPS 203 standardizes Kyber under the name ML-KEM. The standard defines three parameter sets:

| Parameter Set | Security Level | pk (bytes) | ct (bytes) | ss (bytes) |
|--------------|---------------|------------|------------|------------|
| ML-KEM-512 | 1 (NIST Level 1) | 800 | 768 | 32 |
| ML-KEM-768 | 3 (NIST Level 3) | 1184 | 1088 | 32 |
| ML-KEM-1024 | 5 (NIST Level 5) | 1568 | 1568 | 32 |

The standard specifies:
- Exact algorithms for key generation, encapsulation, and decapsulation
- Test vectors for validation
- Constant-time implementation requirements
- Random number generation requirements

**Standard compliance requirements:**
- All implementations must pass the NIST test vectors
- Random number generation must use NIST-approved DRBGs (Deterministic Random Bit Generators)
- Side-channel resistance is required for security-critical applications
- Interoperability between different implementations is guaranteed by the standard

**Implementation validation:**
- NIST provides reference implementations for each parameter set
- The ACVP (Automated Cryptographic Validation Protocol) testing framework validates implementations
- CAVP (Cryptographic Algorithm Validation Program) certificates are required for FIPS compliance

## Hybrid Approaches

### Why Hybrid?

A hybrid key exchange combines a classical algorithm (like X25519) with a post-quantum algorithm (like Kyber-768). The combined shared secret is secure if either algorithm is secure.

**Advantages of hybrid approaches:**
1. **Backward compatibility:** Classical algorithms still work against classical adversaries
2. **Forward security:** Post-quantum algorithms protect against quantum adversaries
3. **Conservative security:** The combined key is at least as secure as the stronger individual algorithm
4. **Deployment flexibility:** Can be implemented without changing the entire infrastructure

### Hybrid Key Derivation

The hybrid shared secret is derived from both individual shared secrets using a Key Derivation Function (KDF):

```
hybrid_ss = KDF(classical_ss || pq_ss, context)
```

The specific KDF construction matters. The IETF draft "Hybrid Key Exchange in TLS 1.3" recommends:

```
hybrid_ss = HKDF-Extract(salt, class_ss || pq_ss)
```

where class_ss and pq_ss are the 32-byte shared secrets from the classical and post-quantum key exchanges, respectively.

### Signal Protocol Example

The Signal messaging protocol uses a hybrid key exchange in its X3DH (Extended Triple Diffie-Hellman) protocol:

1. Each user has a classical identity key (X25519) and a post-quantum identity key (Kyber-768)
2. Pre-key bundles include both classical and post-quantum public keys
3. The key agreement computes:
   - DH1 = X25519(ik_A, spk_B)
   - DH2 = X25519(ek_A, ik_B)
   - DH3 = X25519(ek_A, spk_B)
   - KEM = Kyber-Decaps(ek_A, ct_B)
   - SK = KDF(DH1 || DH2 || DH3 || KEM)

This provides forward secrecy (through ephemeral keys), post-quantum security (through Kyber), and backward compatibility (through classical DH).

### Chrome and Cloudflare Deployment

Google Chrome and Cloudflare have deployed X25519Kyber768 hybrid key exchange in TLS 1.3:

1. **Client Hello:** Client advertises support for X25519Kyber768
2. **Server Hello:** Server selects X25519Kyber768
3. **Key exchange:** Both X25519 and Kyber-768 are performed
4. **Key derivation:** The shared secrets are combined using HKDF

This deployment demonstrates that hybrid approaches can be implemented without breaking existing infrastructure. The overhead is minimal: approximately 1.2 KB additional data in the handshake and approximately 1 millisecond additional computation.

## Implementing Kyber: A Practical Guide

### Using the oqs-python Library

The Open Quantum Safe (OQS) project provides implementations of Kyber and other PQC algorithms:

```python
from oqs import KeyEncapsulation
import hashlib

# Initialize Kyber
kem = KeyEncapsulation("Kyber768")

# Key generation
public_key = kem.generate_keypair()
secret_key = kem.export_secret_key()

# Encapsulation
ciphertext, shared_secret_enc = kem.encapsulate(public_key)

# Decapsulation
shared_secret_dec = kem.decapsulate(ciphertext)

# Verify shared secrets match
assert shared_secret_enc == shared_secret_dec
print(f"Shared secret: {shared_secret_enc.hex()}")
print(f"Public key size: {len(public_key)} bytes")
print(f"Ciphertext size: {len(ciphertext)} bytes")
```

### Using the pqcrypto Library

```python
from pqcrypto.kem.kyber768 import generate_keypair, encrypt, decrypt

# Key generation
public_key, secret_key = generate_keypair()

# Encryption
ciphertext, shared_secret_enc = encrypt(public_key)

# Decryption
shared_secret_dec = decrypt(secret_key, ciphertext)

assert shared_secret_enc == shared_secret_dec
```

### Performance Benchmarking

```python
import time
from oqs import KeyEncapsulation

def benchmark_kem(algorithm_name, iterations=10000):
    kem = KeyEncapsulation(algorithm_name)
    
    # Benchmark key generation
    start = time.time()
    for _ in range(iterations):
        pk = kem.generate_keypair()
    keygen_time = (time.time() - start) / iterations * 1000
    
    # Benchmark encapsulation
    start = time.time()
    for _ in range(iterations):
        ct, ss = kem.encapsulate(pk)
    encap_time = (time.time() - start) / iterations * 1000
    
    # Benchmark decapsulation
    start = time.time()
    for _ in range(iterations):
        ss2 = kem.decapsulate(ct)
    decap_time = (time.time() - start) / iterations * 1000
    
    print(f"{algorithm_name}:")
    print(f"  Key generation: {keygen_time:.3f} ms")
    print(f"  Encapsulation:  {encap_time:.3f} ms")
    print(f"  Decapsulation:  {decap_time:.3f} ms")
    print(f"  Public key: {len(pk)} bytes")
    print(f"  Ciphertext: {len(ct)} bytes")

benchmark_kem("Kyber512")
benchmark_kem("Kyber768")
benchmark_kem("Kyber1024")
benchmark_kem("X25519Kyber768")
```

### Constant-Time Implementation

Kyber must be implemented in constant time to resist timing side-channel attacks. Key implementation guidelines:

1. **Avoid secret-dependent branches:** Never branch on secret data (secret key, ciphertext bits)
2. **Avoid secret-dependent memory access:** Never index arrays with secret data
3. **Use constant-time primitives:** All arithmetic operations (modular reduction, polynomial multiplication) must execute in constant time
4. **Constant-time comparison:** Use constant-time comparison functions for ciphertext validation

```python
def ct_compare(a: bytes, b: bytes) -> bool:
    """Constant-time comparison of two byte strings."""
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= x ^ y
    return result == 0
```

### Side-Channel Attacks on Kyber

Known side-channel attacks on Kyber implementations include:

**Timing attacks:** Measure the time taken for decapsulation to distinguish valid from invalid ciphertexts. Countermeasure: constant-time implementation.

**Power analysis:** Analyze power consumption during NTT computation to extract secret key coefficients. Countermeasure: masking (splitting secrets into random shares).

**Fault attacks:** Inject faults during decapsulation to recover the secret key. Countermeasure: redundant computation and verification.

**Cache attacks:** Monitor cache access patterns to extract information about secret operations. Countermeasure: constant-time memory access patterns.

### Kyber in TLS 1.3

Kyber integrates into TLS 1.3 as a key exchange algorithm. The integration uses the same key_share extension as classical algorithms.

**ClientHello:**
```
Extension: key_share
  Named Group: x25519kyber768 (1216 bytes)
```

**ServerHello:**
```
Extension: key_share
  Named Group: x25519kyber768 (1120 bytes)
```

**Key derivation:**
```
early_secret = HKDF-Extract(0, 0)
binder_key = HKDF-Extract(early_secret, "res binder")
handshake_secret = HKDF-Extract(early_secret, x25519_shared || kyber_shared)
master_secret = HKDF-Extract(handshake_secret, 0)
```

The hybrid approach combines X25519 and Kyber shared secrets using HKDF, providing security against both classical and quantum attacks.

## Quantum Key Exchange vs. Classical Key Exchange

### Security Comparison

**Classical key exchange (X25519):**
- Based on the Elliptic Curve Diffie-Hellman (ECDH) problem
- Broken by Shor's algorithm on a quantum computer
- 256-bit key provides 128-bit classical security
- No quantum security

**Post-quantum key exchange (Kyber-768):**
- Based on the Module-LWE problem
- No known efficient quantum algorithm
- 1184-byte public key provides approximately 192-bit quantum security
- Secure against both classical and quantum attacks

**Hybrid key exchange (X25519Kyber768):**
- Combines both algorithms
- Secure if either algorithm is secure
- Provides backward compatibility and quantum resistance
- Recommended for transition period

### Performance Comparison

| Metric | X25519 | Kyber-512 | Kyber-768 | Kyber-1024 | X25519Kyber768 |
|--------|--------|-----------|-----------|------------|----------------|
| Public key | 32 bytes | 800 bytes | 1184 bytes | 1568 bytes | 1216 bytes |
| Ciphertext | 32 bytes | 768 bytes | 1088 bytes | 1568 bytes | 1120 bytes |
| Keygen | ~10 μs | ~100 μs | ~150 μs | ~200 μs | ~160 μs |
| Encaps | ~10 μs | ~100 μs | ~150 μs | ~200 μs | ~160 μs |
| Decaps | ~10 μs | ~100 μs | ~150 μs | ~200 μs | ~160 μs |

Kyber is approximately 10× slower than X25519 but provides quantum security. The overhead is acceptable for most applications.

### Deployment Considerations

**Bandwidth:** Kyber adds approximately 1.2 KB to the TLS handshake. This is acceptable for web browsing but may be significant for IoT devices with limited bandwidth.

**Latency:** Kyber adds approximately 1 millisecond to the handshake. This is negligible for most applications but may matter for real-time communication.

**Compatibility:** Older clients that do not support Kyber cannot connect to servers using Kyber-only key exchange. Hybrid approaches solve this by supporting both classical and post-quantum algorithms.

**Migration:** Organizations should deploy hybrid key exchange now to protect against harvest-now-decrypt-later attacks. Full migration to post-quantum algorithms can follow as the technology matures.

**Regulatory compliance:** Many regulations (GDPR, HIPAA, PCI-DSS) require encryption of sensitive data. Post-quantum cryptography ensures continued compliance as quantum computing advances.

**Vendor support:** Major cloud providers (AWS, Azure, Google Cloud) are adding support for post-quantum key exchange. Check your provider's roadmap for Kyber support.

**Open source libraries:** The liboqs (Open Quantum Safe) library provides implementations of Kyber and other post-quantum algorithms. It integrates with OpenSSL, BoringSSL, and other TLS libraries.

**Kyber reference implementation:** The official Kyber reference implementation is available on GitHub. It provides clean, well-documented code for all Kyber operations.

**Performance optimization:** For high-performance applications, use optimized implementations with AVX2 or NEON instructions. The optimized implementations are 2-5× faster than the reference implementation.

**Testing and validation:** Use the NIST test vectors to validate your Kyber implementation. The test vectors cover key generation, encapsulation, and decapsulation for all parameter sets.

**Kyber vs. Classic McEliece:**
- Kyber: Smaller keys (1.2 KB vs. 524 KB), larger ciphertexts (1.1 KB vs. 192 bytes)
- Classic McEliece: Larger keys, smaller ciphertexts
- For web browsing: Kyber is better (smaller handshake)
- For file encryption: Classic McEliece may be better (smaller ciphertext overhead)

**Kyber vs. BIKE:**
- Kyber: More studied, better understood security
- BIKE: Smaller key sizes (1.5 KB vs. 1.2 KB for comparable security)
- For most applications: Kyber is recommended (better understood, NIST standard)
- For specific use cases: BIKE may be preferred (smaller keys)

## Kyber Implementation Details

### Centered Binomial Distribution

Kyber uses the Centered Binomial Distribution (CBD) for sampling secret and error vectors. The CBD with parameter η produces coefficients in {-η, -(η-1), ..., η-1} with probabilities:

P(k) = C(2η, η+k) / 2^(2η)

For η = 2: P(-2) = 1/16, P(-1) = 4/16, P(0) = 6/16, P(1) = 4/16, P(2) = 1/16

The CBD is chosen because:
1. It produces small coefficients (important for correctness)
2. It is easy to sample efficiently (using uniform random bits)
3. It has good statistical properties (centered around 0, bounded support)

### Number Theoretic Transform

Kyber uses the Number Theoretic Transform (NTT) for efficient polynomial multiplication. The NTT is the finite-field analog of the Fast Fourier Transform (FFT).

For polynomials in R_q = Z_q[x]/(x^256 + 1), the NTT computes the product a(x)·b(x) mod (x^256 + 1) mod q in O(n log n) time instead of O(n²) time.

The NTT requires that q ≡ 1 (mod 2n), which is satisfied by q = 3329 and n = 256 (3329 ≡ 1 (mod 512)).

### Compression and Decompression

Kyber uses compression to reduce public key and ciphertext sizes. The compression function is:

Compress_d(x) = ⌈(2^d / q) · x⌋ mod 2^d

Decompress_d(x) = ⌈(q / 2^d) · x⌋

The compression introduces quantization noise, which is small enough that it does not affect correctness. For Kyber-768:
- Public key compression: 12 bits per coefficient (11-bit for Kyber-1024)
- Ciphertext u-compression: 10 bits per coefficient (9-bit for Kyber-1024)
- Ciphertext v-compression: 4 bits per coefficient

**Compression tradeoffs:**
- More compression: Smaller keys/ciphertexts, but more quantization noise
- Less compression: Larger keys/ciphertexts, but less quantization noise
- The current compression levels are carefully chosen to balance size and correctness

### Implicit Rejection

Kyber's decapsulation uses implicit rejection: if the ciphertext is invalid, the decapsulation outputs a pseudorandom shared secret instead of failing. This prevents attackers from distinguishing valid from invalid ciphertexts.

The implicit rejection is implemented by computing:
K = SHA3-256(Hash(ct)) if validation fails
K = SHA3-256(m') if validation succeeds

Both cases produce a 32-byte shared secret, but the invalid case produces a pseudorandom value that is unrelated to the secret key. This indistinguishability between valid and invalid ciphertexts is essential for achieving CCA2 security.

## Assessment

**Task 1: Kyber Implementation (60 minutes)**
Implement Kyber-768 key exchange between two parties using the oqs-python library. Generate key pairs for Alice and Bob, perform encapsulation/decapsulation, and verify the shared secrets match. Then perform a man-in-the-middle attack attempt: have Eve intercept the public key and ciphertext, and show that Eve cannot compute the shared secret. Measure the performance and compare with X25519.

**Task 2: Hybrid Key Exchange (60 minutes)**
Implement a hybrid key exchange that combines X25519 and Kyber-768. Use HKDF to combine the two shared secrets. Analyze the security: what happens if X25519 is broken? What happens if Kyber is broken? What happens if both are broken? Provide specific examples of attacks that each component protects against.

**Task 3: Side-Channel Analysis (45 minutes)**
Research the known side-channel attacks against Kyber implementations. Identify at least 3 specific attack vectors (e.g., timing attacks on the rejection sampling, power analysis on the NTT computation, fault attacks on the decapsulation). For each attack, describe the implementation vulnerability and propose a countermeasure. Write a security implementation checklist for a Kyber deployment.

**Task 4: TLS Integration Analysis (45 minutes)**
Analyze the overhead of adding Kyber-768 to a TLS 1.3 handshake. Calculate: (a) additional bytes in Client Hello and Server Hello, (b) additional computation time for key generation, encapsulation, and decapsulation, (c) impact on connection establishment latency. Compare with the overhead of adding RSA-2048 to TLS. Discuss whether the overhead is acceptable for different deployment scenarios (web browsing, IoT, real-time communication).

**Grading Criteria:**
- Kyber implementation correctly performs key exchange and shared secret derivation (25%)
- Hybrid key exchange properly combines classical and post-quantum shared secrets (25%)
- Side-channel analysis identifies real vulnerabilities and proposes valid countermeasures (25%)
- TLS analysis provides accurate performance measurements and reasonable conclusions (25%)

## Evidence

- Bos, J. et al. "CRYSTALS-Kyber: a CCA-secure module-lattice-based KEM." *IEEE Transactions on Computers* 72, 345 (2023).
- NIST. "FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard." August 2024.
- Campagna, M. et al. "Quantum Resistant Cryptography in TLS 1.3." IETF Draft, 2024.
- Stebila, D. & Mosca, M. "Post-quantum key exchange for the Internet and the Open Quantum Safe Project." *International Conference on Selected Areas in Cryptography*, 144-174 (2016).
- Bindel, N. et al. "Hybrid Key Encapsulation Mechanisms and Authenticated Key Exchange." *Post-Quantum Cryptography*, Lecture Notes in Computer Science, 206-226 (2019).
