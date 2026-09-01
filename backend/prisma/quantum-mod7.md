# Module 7 — Digital Signatures

## Digital Signatures in the Post-Quantum Era

A digital signature provides authentication (the signer is who they claim to be), integrity (the message has not been modified), and non-repudiation (the signer cannot deny signing). Classical digital signatures (RSA, ECDSA, EdDSA) rely on the difficulty of factoring or discrete logarithm problems, both of which are broken by Shor's algorithm.

Post-quantum digital signatures must resist quantum attacks while maintaining acceptable performance. NIST has standardized three post-quantum signature algorithms: CRYSTALS-Dilithium (primary), FALCON (alternative), and SPHINCS+ (conservative).

This module covers the implementation and analysis of post-quantum digital signatures, with emphasis on CRYSTALS-Dilithium.

## CRYSTALS-Dilithium: Deep Dive

### Mathematical Foundation

Dilithium operates over the same module lattice structure as Kyber. The key insight is that a digital signature can be constructed as a zero-knowledge proof of knowledge of a secret key, made non-interactive via the Fiat-Shamir transform.

The secret key is a matrix S ∈ R_q^{k×l} with small coefficients. The public key is t = A·S (mod q) where A ∈ R_q^{k×l} is a public matrix (generated from a seed).

### Key Generation

1. **Seed generation:** Generate a 32-byte random seed ρ and a 64-byte random seed ρ' (the extra 32 bytes are for the matrix A expansion).

2. **Matrix expansion:** Use SHAKE-128 with seed ρ to generate A ∈ R_q^{k×l}.

3. **Secret sampling:** Use seed ρ' with SHAKE-256 to generate the secret matrix S ∈ R_q^{k×l} and error matrix E ∈ R_q^{k×l}. Coefficients are sampled from the CBD (Centered Binomial Distribution) with parameter η.

4. **Public key computation:** Compute t = A·S + E (mod q).

5. **Output:** Public key pk = (ρ, t₁), Secret key sk = (ρ, ρ', k, l, t₁, s₁, s₂).

The public key is compressed: t₁ consists of the high-order bits of t (the top γ₁ bits for each coefficient). This compresses the public key at the cost of losing some low-order information, which is handled by the hint vector in signatures.

### Signing Process

Dilithium signing uses the "Fiat-Shamir with Aborts" technique:

1. **Nonce generation:** Use the secret nonce ρ' and the message M to generate a deterministic nonce ξ = H(ρ' || M).

2. **Random vector:** Generate y ∈ R_q^l with small coefficients using ξ.

3. **Commitment:** Compute w = A·y (mod q).

4. **Challenge:** Compute the challenge polynomial c = H(M || w₁) where w₁ is the high-order bits of w. The challenge c has exactly τ non-zero coefficients, each ±1.

5. **Response:** Compute z = y + c·S (mod q).

6. **Rejection sampling:** Check if z has small enough coefficients (all coefficients in [-γ₂ + q mod q, γ₂ + q mod q]). If any coefficient is too large, restart with a new y.

7. **Hint computation:** Compute a hint h that allows the verifier to recover w₁ from z and c. The hint indicates which low-order bits of Az - ct were rounded up.

8. **Output:** Signature σ = (z, h).

The rejection sampling is critical for security: without it, the distribution of signatures would depend on the secret key, leaking information. The probability of rejection is approximately 1 - 1/e ≈ 63% for Dilithium-3, meaning on average 2-3 attempts are needed per signature.

### Verification Process

1. **Input:** Public key (ρ, t₁), message M, signature (z, h).

2. **Reconstruct challenge:** Compute w' = A·z - c·t₁ (mod q) where c = H(M || w₁ + correction_from_h).

3. **Verify small norm:** Check that all coefficients of z are within the allowed range.

4. **Verify hint:** Check that h is valid (at most ω ones, and they indicate the correct positions).

5. **Check equation:** Verify that c = H(M || w₁) where w₁ is computed from w' and h.

### Dilithium Parameters

| Parameter | Security Level | Public Key (bytes) | Signature (bytes) |
|-----------|---------------|--------------------|--------------------|
| Dilithium-2 | NIST Level 2 | 1,312 | 2,420 |
| Dilithium-3 | NIST Level 3 | 1,952 | 3,293 |
| Dilithium-5 | NIST Level 5 | 2,592 | 4,595 |

Dilithium-3 provides approximately 192-bit classical security and approximately 185-bit quantum security. It is the recommended parameter set for most applications.

**Performance across parameter sets:**

| Metric | Dilithium-2 | Dilithium-3 | Dilithium-5 |
|--------|-------------|-------------|-------------|
| Keygen (cycles) | ~400,000 | ~600,000 | ~800,000 |
| Sign (cycles) | ~500,000 | ~750,000 | ~1,000,000 |
| Verify (cycles) | ~300,000 | ~450,000 | ~600,000 |
| Keygen (μs) | ~40 | ~60 | ~80 |
| Sign (μs) | ~50 | ~75 | ~100 |
| Verify (μs) | ~30 | ~45 | ~60 |

The performance difference between parameter sets is modest (approximately 2× from Dilithium-2 to Dilithium-5). This makes Dilithium-5 practical even for high-security applications.

**Choosing the right parameter set:**
- Dilithium-2: Suitable for resource-constrained environments (IoT, embedded systems)
- Dilithium-3: Recommended for general use (TLS, code signing, document signing)
- Dilithium-5: Maximum security margin (long-term archival, government applications)

### Security Analysis

The security of Dilithium reduces to the hardness of the Module-LWE problem. Specifically, forging a signature is at least as hard as solving Module-LWE. The reduction is tight: an adversary that can forge signatures with advantage ε can solve Module-LWE with advantage approximately ε/q.

Known attacks:
1. **Lattice reduction (BKZ):** The best classical attack requires approximately 2^{192} operations for Dilithium-3. Quantum BKZ reduces this to approximately 2^{185}.

2. **Side-channel attacks:** Power analysis and timing attacks can extract the secret key from faulty implementations. Constant-time implementation and masking counter these attacks.

3. **Fault attacks:** Injecting faults during signing can leak the secret key. The deterministic nonce generation in Dilithium provides some resilience, but additional countermeasures (redundant computation, verification) are needed.

## FALCON

### NTRU-Based Signatures

FALCON (Fast-Fourier Lattice-based Compact Signatures over NTRU) is based on the NTRU lattice problem. It uses the GPV framework (Gentry, Peikert, Vaikuntanathan) for trapdoor signatures.

**Key generation:**
1. Generate an NTRU lattice with a short basis B
2. The public key is h = g/f (mod q) where f and g are short polynomials
3. The secret key is the short basis B

**Signing:**
1. Generate a hash of the message: c = H(M)
2. Use the trapdoor (short basis B) to sample a short vector z such that Az = c (mod q) where A = (h, 1)
3. Apply rejection sampling to ensure z is short enough

**Verification:**
1. Check that z is short (all coefficients bounded)
2. Check that Az = c (mod q)

FALCON offers smaller signatures than Dilithium (approximately 666 bytes for FALCON-512) but requires complex floating-point arithmetic for signing, making implementation more challenging.

### FALCON Parameters

| Parameter | Security Level | Public Key (bytes) | Signature (bytes) |
|-----------|---------------|--------------------|--------------------|
| FALCON-512 | NIST Level 1 | 897 | 666 |
| FALCON-1024 | NIST Level 5 | 1,793 | 1,280 |

FALCON signatures are significantly smaller than Dilithium signatures but have larger public keys. The signing process is slower due to the complex sampling algorithm.

## Stateful Hash-Based Signatures

### XMSS (eXtended Merkle Signature Scheme)

XMSS is a stateful hash-based signature scheme standardized by NIST (SP 800-208). It builds on Merkle trees and WOTS+ (Winternitz One-Time Signature Scheme).

**Merkle Tree Construction:**
1. Generate n one-time key pairs (sk₀, pk₀), ..., (skₙ₋₁, pkₙ₋₁)
2. Compute leaf nodes: Lᵢ = H(pkᵢ)
3. Build tree by hashing pairs: H(L₂ᵢ || L₂ᵢ₊₁) for internal nodes
4. Root is the XMSS public key

**Signing with the i-th key pair:**
1. Sign message with one-time signature: σ_ot = WOTS+.Sign(skᵢ, M)
2. Provide authentication path: the set of sibling nodes on the path from leaf i to the root
3. Full signature: σ = (σ_ot, auth_path, i)

**Verification:**
1. Verify the one-time signature: WOTS+.Verify(pkᵢ, M, σ_ot)
2. Recompute the root using pkᵢ and the authentication path
3. Check that the recomputed root matches the public key

**State Management:**
The signer must maintain a counter of used key pairs. After using the i-th key pair, the counter is incremented to i+1. Reusing a key pair completely compromises the secret key.

This stateful property is a significant practical limitation. If the system crashes and the state is lost, or if the state is copied, key reuse can occur. XMSS-WOTS+ (the NIST standard) provides a "tree identifier" mechanism to handle multiple trees, but the state management burden remains.

### LMS (Leighton-Micali Signature)

LMS is another stateful hash-based signature scheme. It uses a hierarchy of Merkle trees, allowing for efficient revocation and key management.

LMS has two variants:
- **LMS-HSS:** Hierarchical Signature Scheme with multiple levels of trees
- **LMS-LM-OTS:** Uses the LM-OTS (Leighton-Micali One-Time Signature) scheme

LMS is used in firmware signing and other applications where state management is feasible (e.g., the system has persistent storage and does not need to sign frequently).

## Stateless Hash-Based Signatures

### SPHINCS+

SPHINCS+ eliminates the state management requirement of XMSS and LMS by using a forest of Merkle trees and selecting trees pseudo-randomly for each signature.

**SPHINCS+ architecture:**

1. **Hyper-tree:** A d-level tree of WOTS+ trees. The top level is a single Merkle tree. Each leaf of the top-level tree is the root of a level-(d-1) tree. And so on down to level 0.

2. **Tree selection:** For each signature, use a PRF (seeded with the secret key and a nonce) to select which tree and which leaf to use.

3. **Signing:**
   - Select a WOTS+ tree at level 0 using the PRF
   - Sign the message with WOTS+
   - Provide authentication paths through the hyper-tree (from the level-0 leaf to the top-level root)

4. **Verification:**
   - Reconstruct the authentication paths
   - Verify the WOTS+ signature
   - Check that the reconstructed top-level root matches the public key

**SPHINCS+ parameters:**

| Parameter | Security Level | Public Key (bytes) | Signature (bytes) |
|-----------|---------------|--------------------|--------------------|
| SPHINCS+-SHA2-128s | 1 (128-bit) | 32 | 7,856 |
| SPHINCS+-SHA2-128f | 1 (128-bit) | 32 | 17,088 |
| SPHINCS+-SHA2-192s | 3 (192-bit) | 48 | 16,224 |
| SPHINCS+-SHA2-256s | 5 (256-bit) | 64 | 16,224 |

The "s" variants optimize for signature size (slower signing). The "f" variants optimize for signing speed (larger signatures). SPHINCS+ provides conservative security because it relies only on the security of the hash function — no algebraic assumptions.

### Security Foundation

SPHINCS+ security reduces to the security of the underlying hash function. If SHA-256 is collision-resistant and preimage-resistant, SPHINCS+ is secure. This is the strongest possible security foundation — it does not rely on any number-theoretic or algebraic assumption.

The main disadvantage is signature size: SPHINCS+ signatures are much larger than Dilithium or FALCON signatures. This makes SPHINCS+ less suitable for bandwidth-constrained applications but ideal for high-security applications where the security foundation is paramount.

## Comparing Signature Schemes

### Performance Comparison

| Metric | Dilithium-3 | FALCON-512 | SPHINCS+-128s | ECDSA-256 |
|--------|-------------|------------|---------------|-----------|
| Public key | 1,952 bytes | 897 bytes | 32 bytes | 32 bytes |
| Signature | 3,293 bytes | 666 bytes | 7,856 bytes | 64 bytes |
| Sign (cycles) | ~10⁶ | ~10⁷ | ~10⁸ | ~10⁶ |
| Verify (cycles) | ~10⁶ | ~10⁶ | ~10⁷ | ~10⁶ |
| Security foundation | Module-LWE | NTRU | Hash function | ECDLP |

### Use Case Recommendations

**Web TLS certificates:** Dilithium-3 (balanced performance and security)

**Firmware signing (resource-constrained):** FALCON-512 (smallest signatures)

**Long-term document archiving:** SPHINCS+ (strongest security foundation)

**IoT devices:** Dilithium-2 (smaller keys, acceptable security)

**Blockchain/cryptocurrency:** Dilithium-3 or SPHINCS+ (depending on security requirements)

### Hybrid Signatures

Hybrid signatures combine classical and post-quantum algorithms. For example:

```
signature = ECDSA.sign(sk_classical, M) || Dilithium.sign(sk_pq, M)
```

Verification requires both signatures to be valid. This provides:
- Security against classical attacks (ECDSA)
- Security against quantum attacks (Dilithium)
- Backward compatibility (classical verifiers can still verify the ECDSA component)

Hybrid signatures are recommended during the transition period until post-quantum algorithms are widely deployed and trusted.

## Implementation Considerations

### Deterministic Nonces

Dilithium uses deterministic nonce generation: the nonce is derived from the secret key and the message, not from a random number generator. This eliminates the risk of nonce reuse, which is a catastrophic failure mode for ECDSA (reusing a nonce leaks the private key).

```python
def generate_nonce(secret_key, message):
    """Generate a deterministic nonce for signing."""
    return SHAKE-256(secret_seed, message, output_length=64)
```

### Constant-Time Implementation

All post-quantum signature implementations must be constant-time to resist timing side-channel attacks:

```python
def ct_verify(expected, received):
    """Constant-time verification of two byte strings."""
    if len(expected) != len(received):
        return False
    result = 0
    for x, y in zip(expected, received):
        result |= x ^ y
    return result == 0
```

### Side-Channel Countermeasures

1. **Masking:** Split sensitive values into random shares and perform all computations on shares independently. Combine shares only at the end.

2. **Blinding:** Multiply secret values by random blinding factors before computation, remove the blinding factor afterward.

3. **Redundant computation:** Perform critical operations multiple times and check consistency.

4. **Randomized timing:** Add random delays to operations to prevent timing attacks.

## Post-Quantum Signature Schemes: Comparison

### Security vs. Performance Tradeoffs

The choice of post-quantum signature scheme involves tradeoffs between security level, signature size, public key size, and computational cost.

**Lattice-based (Dilithium):**
- Best balance of performance and security
- Moderate signature sizes (2,420-4,595 bytes)
- Fast signing and verification
- Based on well-studied lattice problems

**NTRU-based (FALCON):**
- Smallest signatures (666-1,280 bytes)
- Larger public keys (897-1,793 bytes)
- Complex signing algorithm (floating-point arithmetic)
- Based on NTRU lattice problems

**Hash-based (SPHINCS+):**
- Largest signatures (7,856-35,664 bytes)
- Smallest public keys (32-64 bytes)
- Strongest security foundation (only hash function security)
- Conservative choice for high-security applications

### Stateful vs. Stateless

**Stateful (XMSS, LMS):**
- Efficient signatures and verification
- Requires careful state management
- Risk of key reuse if state is lost
- Suitable for controlled environments (firmware signing)

**Stateless (Dilithium, FALCON, SPHINCS+):**
- No state management required
- Higher computational cost (rejection sampling)
- Safer for general use
- Recommended for most applications

**State management challenges:**
- Storing state securely (encrypted, backed up)
- Synchronizing state across multiple devices
- Recovering state after system failure
- Preventing state rollback attacks

**Hybrid stateful/stateless approach:**
- Use stateful signatures for high-frequency signing (e.g., transaction signing)
- Use stateless signatures for low-frequency signing (e.g., certificate signing)
- This balances performance and security

### Hybrid Approaches

During the transition period, hybrid signatures combine classical and post-quantum algorithms:

**Example: Ed25519 + Dilithium-3**
- Signature size: 64 + 3,293 = 3,357 bytes
- Security: 128-bit classical + 192-bit post-quantum
- Backward compatibility: Ed25519 signature can be verified by older systems
- Forward security: Dilithium signature protects against quantum attacks

**Verification:** Both signatures must be valid. If either verification fails, the signature is rejected.

**Deployment:** Hybrid signatures can be deployed incrementally. Systems that support post-quantum can verify both signatures. Systems that do not support post-quantum can verify only the classical signature (providing backward compatibility but not quantum security).

### Signature Size Optimization

**Certificate transparency logs:** Larger Dilithium signatures increase the size of CT log entries. Optimize by using Dilithium-2 instead of Dilithium-3 for CT log entries.

**Code signing:** For firmware updates, the signature must be transmitted over bandwidth-constrained channels. Use Dilithium-2 to minimize transmission overhead.

**Document signing:** For long-term document archiving, signature size is less critical. Use Dilithium-5 for maximum security margin.

**Blockchain:** Transaction signatures must be stored on-chain, consuming limited block space. Use Dilithium-2 or SPHINCS+-128f to minimize on-chain storage.

### Signature Verification Performance

**Verification speed comparison:**
- Dilithium-3: 0.2 ms per verification
- ECDSA-256: 0.1 ms per verification
- RSA-2048: 0.01 ms per verification
- SPHINCS+-128s: 5.0 ms per verification

Dilithium-3 verification is approximately 2× slower than ECDSA-256 but provides quantum security. For high-throughput applications, consider batch verification: verify multiple signatures simultaneously to amortize the overhead.

**Batch verification:** Dilithium supports batch verification, where multiple signatures can be verified more efficiently than verifying each individually. For n signatures, batch verification is approximately n/2× faster than individual verification.

**Memory requirements:**
- Dilithium-3: 1.95 KB public key + 3.29 KB signature = 5.24 KB per signature
- ECDSA-256: 32 bytes public key + 64 bytes signature = 96 bytes per signature
- RSA-2048: 256 bytes public key + 256 bytes signature = 512 bytes per signature

The larger memory footprint of Dilithium must be considered for resource-constrained applications.

### Dilithium in TLS

Dilithium integrates into TLS 1.3 as a signature algorithm. The signature is included in the Certificate and CertificateVerify messages.

**Certificate size impact:**
- ECDSA-256 certificate: approximately 1 KB
- Dilithium-3 certificate: approximately 5 KB
- Certificate chain (3 certs): 15 KB for Dilithium vs. 3 KB for ECDSA

**Handshake size impact:**
- Client Hello: No change (signatures not included)
- Server Hello: Certificate (5 KB) + CertificateVerify (3.3 KB) = 8.3 KB increase
- Total handshake increase: approximately 11 KB for Dilithium vs. ECDSA

**Mitigation strategies:**
- Use certificate compression (TLS 1.3 supports this)
- Use shorter Dilithium parameters (Dilithium-2) for non-critical applications
- Implement certificate caching to reduce repeated downloads

## Dilithium Implementation Details

### Rejection Sampling Analysis

Dilithium's rejection sampling ensures that signatures do not leak information about the secret key. The rejection probability depends on the parameters:

For Dilithium-3:
- γ₁ = 2^17 = 131072 (high-order bits)
- γ₂ = (q-1)/88 = 38 (low-order bits)
- τ = 49 (number of non-zero challenge coefficients)
- The rejection probability is approximately 1 - 1/e ≈ 63%

This means on average 2-3 signing attempts are needed per signature. The rejection is deterministic: the same message and nonce always produce the same signature (or rejection).

### Hint Vector

The hint vector h in Dilithium signatures allows the verifier to recover the high-order bits of w from the signature. The hint indicates which coefficients of Az - ct have their low-order bits rounded up.

For Dilithium-3:
- h has at most ω = 55 ones
- The verifier uses h to correct the rounding in w₁
- If h has more than ω ones, the signature is rejected

### Security Reduction

The security of Dilithium reduces to the hardness of Module-LWE. Specifically:

**Unforgeability:** An adversary that can forge Dilithium signatures with advantage ε can solve Module-LWE with advantage approximately ε/q^l, where l is the number of columns in the secret matrix.

**Key recovery:** An adversary that can extract the secret key from many signatures can solve Module-LWE with advantage approximately 1/poly(n).

The reduction is tight: the security loss is polynomial, not exponential. This means the concrete security of Dilithium-3 (approximately 192 bits) is close to the theoretical security of Module-LWE (approximately 192 bits).

### Comparison with RSA and ECDSA

| Metric | RSA-2048 | ECDSA-256 | Dilithium-3 | SPHINCS+-128s |
|--------|----------|-----------|-------------|---------------|
| Public key | 256 bytes | 32 bytes | 1,952 bytes | 32 bytes |
| Signature | 256 bytes | 64 bytes | 3,293 bytes | 7,856 bytes |
| Sign (ms) | 1.0 | 0.1 | 0.5 | 50.0 |
| Verify (ms) | 0.01 | 0.1 | 0.2 | 5.0 |
| Quantum secure | No | No | Yes | Yes |

Dilithium-3 signatures are approximately 50× larger than ECDSA-256 signatures but provide quantum security. The signing and verification times are comparable to RSA-2048.

## Assessment

**Task 1: Dilithium Signature Implementation (60 minutes)**
Implement Dilithium-3 digital signature using the oqs-python library. Generate a key pair, sign a message, and verify the signature. Then attempt to forge a signature by modifying the message and verifying that verification fails. Measure the signing and verification times. Compare the performance with ECDSA-256.

**Task 2: Hash-Based Signature Construction (60 minutes)**
Implement a simplified Merkle tree signature scheme with 4 one-time key pairs using SHA-256. Generate 4 WOTS+ key pairs, build the Merkle tree, and create signatures for messages using each of the 4 key pairs. Verify each signature. Analyze the signature size and compare with the theoretical size. Discuss the state management requirement.

**Task 3: Signature Scheme Selection (45 minutes)**
For each of the following applications, recommend a specific post-quantum signature scheme and justify your choice: (a) TLS certificate for a high-traffic website, (b) firmware signing for an IoT device with 64 KB flash memory, (c) document signing for a legal archive with 50-year retention, (d) code signing for a software distribution platform. Create a decision matrix with criteria and weights.

**Task 4: Hybrid Signature Protocol (60 minutes)**
Design a hybrid signature protocol that combines Ed25519 and Dilithium-3. Specify: (a) the key generation process, (b) the signing algorithm, (c) the verification algorithm, (d) the security proof argument. Analyze the overhead (additional bytes, computation time) compared to using each algorithm alone. Discuss backward compatibility and migration strategy.

**Grading Criteria:**
- Dilithium implementation correctly performs signing and verification (25%)
- Merkle tree implementation is correct and demonstrates understanding of hash-based signatures (25%)
- Signature scheme selection demonstrates understanding of tradeoffs (25%)
- Hybrid protocol design is sound and security analysis is correct (25%)

## Evidence

- Ducas, L. et al. "CRYSTALS-Dilithium: A Lattice-Based Digital Signature Scheme." *IACR Transactions on Cryptographic Hardware and Embedded Systems* 2018, 238 (2018).
- NIST. "FIPS 204: Module-Lattice-Based Digital Signature Standard." August 2024.
- NIST. "SP 800-208: Recommendation for Stateful Hash-Based Signature Schemes." October 2020.
- Bernstein, D.J. et al. "SPHINCS+: Submission to the NIST Post-Quantum Cryptography Standardization Process." 2017.
- Stehlé, D. & Steinfeld, R. "Making NTRU as Secure as Factor-Worst-Case Lattice Problems." *EUROCRYPT 2007*, Lecture Notes in Computer Science, 275-292 (2007).
