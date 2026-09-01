# Module 5: Post-Quantum Algorithms

## The Post-Quantum Cryptography Landscape

Post-quantum cryptography (PQC) refers to cryptographic algorithms that are secure against both classical and quantum adversaries. These algorithms are designed to run on classical computers: they do not require quantum hardware. The security of PQC algorithms relies on mathematical problems that are believed to be hard for both classical and quantum computers.

NIST initiated a standardization process for PQC in 2016, culminating in the selection of several algorithms for standardization in 2022-2024. The selected algorithms are based on four mathematical foundations: lattices, hashes, codes, and isogenies.

This module examines the mathematical foundations, security properties, and practical characteristics of the main PQC algorithm families.

## Lattice-Based Cryptography

### The Learning With Errors Problem

The Learning With Errors (LWE) problem is the foundation of most lattice-based PQC algorithms. Given a system of noisy linear equations:

A·s + e = b (mod q)

where A is a random m×n matrix over Z_q, s is a secret vector, e is a small error vector (each component drawn from a discrete Gaussian distribution), and b is the result vector. The goal is to find s given (A, b).

The hardness of LWE comes from the error vector e. Without the error, the system is a simple linear system solvable by Gaussian elimination. With the error, the system becomes noisy, and finding s requires solving a lattice problem.

**Key-LWE (Ring-LWE variant):** The Ring-LWE problem operates over polynomial rings, providing efficiency gains. Given polynomials a(x), s(x), e(x) in R_q = Z_q[x]/(x^n + 1):

a(x)·s(x) + e(x) = b(x) (mod q)

Ring-LWE is as hard as the worst-case lattice problem (approximate shortest vector problem), providing a strong security foundation.

### NTRU

NTRU (Nth-degree Truncated polynomial Ring Units) was one of the first lattice-based cryptographic systems, proposed in 1996. NTRU operates over the polynomial ring Z[x]/(x^n - 1) (or in modern variants, Z[x]/(x^n + 1)).

**Key generation:**
1. Choose small polynomials f and g (coefficients from {-1, 0, 1})
2. Compute h = g · f⁻¹ (mod q) in the ring
3. Public key: h. Private key: f and g.

**Encryption (of message m):**
1. Choose small random polynomial r
2. c = r · h + m · (q/2) (mod q)

**Decryption:**
1. a = f · c (mod q) = f · r · g · f⁻¹ + f · m · (q/2) = r · g + f · m · (q/2) (mod q)
2. Since r · g and f · m · (q/2) have different coefficient ranges, m can be recovered by rounding

NTRU is efficient (fast encryption/decryption, small keys) but has known security issues in some parameter sets. NTRU has been submitted to the NIST PQC process as NTRU-HRSS and NTRU-HPS variants.

### CRYSTALS-Kyber

CRYSTALS-Kyber is the NIST-selected algorithm for key encapsulation. It is based on the Module-LWE problem, which is a structured variant of LWE operating over modules of polynomial rings.

**Kyber parameters:**

| Parameter | Security Level | Public Key Size | Ciphertext Size | Shared Secret Size |
|-----------|---------------|-----------------|-----------------|-------------------|
| Kyber-512 | 1 (128-bit classical) | 800 bytes | 768 bytes | 32 bytes |
| Kyber-768 | 3 (192-bit classical) | 1184 bytes | 1088 bytes | 32 bytes |
| Kyber-1024 | 5 (256-bit classical) | 1568 bytes | 1568 bytes | 32 bytes |

**Key generation:**
1. Generate random seed ρ (32 bytes) and noise seed σ (32 bytes)
2. Use ρ to generate matrix A (via Expandable Output Function XOF)
3. Use σ to generate secret vector s and error vector e (from centered binomial distribution)
4. Compute t = A·s + e (mod q)
5. Public key: (ρ, t). Secret key: s.

**Encapsulation:**
1. Generate random message m (32 bytes)
2. Use m as seed to generate noise vectors r and e₁
3. Compute u = Aᵀ·r + e₁ (mod q)
4. Compute v = tᵀ·r + e₂ + Encode(m) (mod q)
5. Ciphertext: (u, v)
6. Shared secret: Hash(m)

**Decapsulation:**
1. Compute m' = Decode(v - sᵀ·u) (mod q)
2. Recompute (u', v') using m' and re-encrypt
3. If (u', v') = (u, v), output Hash(m'). Otherwise, output Hash(Hash(ciphertext)).

The re-encryption step in decapsulation provides implicit rejection: if the ciphertext is invalid (possibly tampered), the decapsulation outputs a pseudorandom shared secret instead of failing, preventing certain side-channel attacks.

### CRYSTALS-Dilithium

CRYSTALS-Dilithium is the NIST-selected algorithm for digital signatures. It is also based on the Module-LWE problem, but uses the "Fiat-Shamir with Aborts" technique to construct a zero-knowledge proof of knowledge of a secret key.

**Dilithium parameters:**

| Parameter | Security Level | Public Key Size | Signature Size |
|-----------|---------------|-----------------|----------------|
| Dilithium-2 | 2 (128-bit) | 1312 bytes | 2420 bytes |
| Dilithium-3 | 3 (192-bit) | 1952 bytes | 3293 bytes |
| Dilithium-5 | 5 (256-bit) | 2592 bytes | 4595 bytes |

**Signing process:**
1. Generate random nonce y
2. Compute w = A·y (mod q)
3. Compute challenge c = Hash(M || w) (Fiat-Shamir transform)
4. Compute z = y + c·s (mod q)
5. Check if z has small coefficients (rejection sampling). If not, restart with new y.
6. Check if hint h reveals information about s. If so, restart.
7. Signature: (z, h)

**Verification:**
1. Check that z has small coefficients
2. Compute w' = A·z - c·t (mod q)
3. Verify that c = Hash(M || w' + correction_from_h)

The rejection sampling in the signing process ensures that signatures do not leak information about the secret key, even when many signatures are observed.

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

### NIST Standardization Status

**FIPS 203 (ML-KEM):** Standardized in August 2024. Defines Kyber-512, Kyber-768, Kyber-1024 as ML-KEM-512, ML-KEM-768, ML-KEM-1024.

**FIPS 204 (ML-DSA):** Standardized in August 2024. Defines Dilithium-2, Dilithium-3, Dilithium-5 as ML-DSA-44, ML-DSA-65, ML-DSA-87.

**FIPS 205 (SLH-DSA):** Standardized in August 2024. Defines SPHINCS+ variants as SLH-DSA.

**FALCON:** Under review for standardization. Expected to be standardized as FN-DSA.

These standards provide a clear path for organizations to adopt post-quantum cryptography. FIPS compliance is required for US government applications and is recommended for all critical infrastructure.

## Hash-Based Signatures

### XMSS (eXtended Merkle Signature Scheme)

XMSS is a stateful hash-based signature scheme standardized by NIST (SP 800-208). It builds on Merkle trees (also called hash trees) to construct a one-time signature scheme that can be used many times.

**Merkle Tree Construction:**
1. Generate n one-time key pairs (using WOTS+, a one-time signature scheme)
2. Hash each public key to get leaf nodes
3. Build a binary tree by hashing pairs of children: H(left || right)
4. The root of the tree is the XMSS public key

**Signing:**
1. Use the i-th one-time key pair to sign the message
2. Provide the authentication path: the siblings of each node on the path from the i-th leaf to the root
3. The verifier can recompute the root using the message, signature, and authentication path, and check it matches the public key

**State Management:**
XMSS is stateful: the signer must keep track of which one-time key pairs have been used. Reusing a one-time key pair completely compromises the secret key. This is a significant practical concern: a system crash or bug could cause key reuse.

XMSS-WOTS+ (with Winternitz One-Time Signatures) is the specific variant standardized by NIST. It uses a Winternitz parameter w that trades signature size for computation time.

### LMS (Leighton-Micali Signature)

LMS is another stateful hash-based signature scheme standardized by NIST (SP 800-208). It is similar to XMSS but uses a different tree structure and one-time signature scheme.

LMS uses a Hors one-time signature (or its variant HORS) combined with a Merkle tree. The key advantage of LMS over XMSS is that LMS can use a hierarchy of trees, allowing for efficient revocation and key management.

### SPHINCS+

SPHINCS+ is the NIST-selected algorithm for stateless hash-based signatures. Unlike XMSS and LMS, SPHINCS+ does not require state management. It achieves this by using a forest of Merkle trees and selecting trees pseudo-randomly for each signature.

**SPHINCS+ parameters:**

| Parameter | Security Level | Public Key Size | Signature Size |
|-----------|---------------|-----------------|----------------|
| SPHINCS+-SHA2-128s | 1 (128-bit) | 32 bytes | 7856 bytes |
| SPHINCS+-SHA2-128f | 1 (128-bit) | 32 bytes | 17088 bytes |
| SPHINCS+-SHA2-256s | 3 (192-bit) | 64 bytes | 16224 bytes |
| SPHINCS+-SHA2-256f | 3 (192-bit) | 64 bytes | 35664 bytes |

SPHINCS+ uses several layers of Merkle trees (a "hyper-tree") to achieve efficiency. The signing process involves:
1. Use a PRF to select which tree and leaf to use
2. Sign with WOTS+ (a one-time signature scheme)
3. Provide authentication paths through the hyper-tree

The "s" variants are smaller but slower. The "f" variants are faster but larger. SPHINCS+ provides conservative security because it relies only on the security of the underlying hash function: no algebraic assumptions.

## Code-Based Cryptography

### The McEliece Cryptosystem

The McEliece cryptosystem, proposed in 1978, is one of the oldest post-quantum cryptographic systems. Its security relies on the difficulty of decoding a random linear code (the syndrome decoding problem).

**Key generation:**
1. Choose a Goppa code C with parameters [n, k, t] (length n, dimension k, error-correcting capability t)
2. Generate a random invertible matrix S (k×k) and a random permutation matrix P (n×n)
3. Compute G' = S · G · P (where G is the generator matrix of C)
4. Public key: G'. Secret key: (S, G, P, t).

**Encryption (of message m):**
1. Choose random error vector e of weight t
2. c = m · G' + e (mod 2)

**Decryption:**
1. Compute c · P⁻¹ = m · S · G + e · P⁻¹
2. Decode using the Goppa code to recover m · S
3. Multiply by S⁻¹ to recover m

The McEliece cryptosystem has stood for over 40 years without significant quantum attacks. However, it has large public keys (typically hundreds of thousands to millions of bits).

### Classic McEliece

Classic McEliece is the NIST finalist based on binary Goppa codes. Parameter sets:

| Parameter | Security Level | Public Key Size | Ciphertext Size |
|-----------|---------------|-----------------|-----------------|
| mceliece348864 | 1 (128-bit) | 261,120 bytes | 128 bytes |
| mceliece460896 | 3 (192-bit) | 524,160 bytes | 192 bytes |
| mceliece6960119 | 5 (256-bit) | 1,047,319 bytes | 240 bytes |

The public key sizes are enormous compared to lattice-based schemes. However, the ciphertext sizes are very small, and the encryption/decryption speeds are fast.

### BIKE and HQC

BIKE (Bit Flipping Key Encapsulation) is a code-based KEM based on quasi-cyclic moderate-density parity-check (QC-MDPC) codes. It has smaller key sizes than Classic McEliece but larger ciphertexts.

HQC (Hamming Quasi-Cyclic) is another code-based KEM that uses the syndrome decoding problem for quasi-cyclic codes. It was selected by NIST as an additional KEM standard in 2024.

## Isogeny-Based Cryptography

### SIDH and SIKE

SIDH (Supersingular Isogeny Diffie-Hellman) was a promising post-quantum key exchange protocol based on the difficulty of computing isogenies between supersingular elliptic curves. It offered very small key sizes (under 400 bytes for both public keys and ciphertexts).

In 2022, a devastating attack by Castryck and Decru broke SIDH in subexponential time using auxiliary torsion point information. This led to the withdrawal of SIKE (the NIST candidate based on SIDH) from the standardization process.

The lesson from SIDH/SIKE is important: even algorithms that resist known attacks for decades can suddenly fall to new mathematical techniques. This motivates the use of conservative parameter sets and multiple independent security assumptions.

## Comparative Analysis

### Security Assumptions

| Algorithm Family | Mathematical Problem | Best Known Quantum Attack | Security Foundation |
|-----------------|---------------------|--------------------------|-------------------|
| Lattice (Kyber, Dilithium) | Module-LWE | Subexponential (Grover-like) | Worst-case to average-case reduction |
| Hash (SPHINCS+) | Hash function security | Grover's (quadratic speedup) | Minimal assumptions |
| Code (McEliece) | Syndrome decoding | No significant quantum speedup | Decades of analysis |
| Isogeny (broken) | Isogeny computation | Subexponential classical attack | N/A (SIDH broken) |

**Comparing security foundations:**

Lattice-based cryptography has the strongest theoretical foundation: the security of Ring-LWE reduces to the worst-case hardness of the approximate shortest vector problem (SVP). This means that breaking Kyber is at least as hard as solving a worst-case lattice problem, which is believed to be very hard.

Hash-based cryptography has the most conservative security foundation: SPHINCS+ security depends only on the security of the underlying hash function (SHA-256 or SHAKE-256). If the hash function is secure, SPHINCS+ is secure. No algebraic assumptions are needed.

Code-based cryptography has a long history of analysis: McEliece was proposed in 1978 and has resisted all attacks for over 45 years. The syndrome decoding problem is NP-hard, and no efficient quantum algorithm is known.

**Conservative approach:** Use multiple algorithm families for critical applications. If one family is broken, the others provide backup security.

### Performance Comparison

**Key encapsulation (Kyber vs. Classic McEliece vs. BIKE):**

| Metric | Kyber-768 | Classic McEliece-460896 | BIKE-3 |
|--------|-----------|------------------------|--------|
| Public key | 1,184 bytes | 524,160 bytes | 1,527 bytes |
| Ciphertext | 1,088 bytes | 192 bytes | 2,447 bytes |
| Keygen (cycles) | ~10⁶ | ~10⁸ | ~10⁷ |
| Encaps (cycles) | ~10⁶ | ~10⁶ | ~10⁷ |
| Decaps (cycles) | ~10⁶ | ~10⁶ | ~10⁷ |

**Digital signatures (Dilithium vs. SPHINCS+):**

| Metric | Dilithium-3 | SPHINCS+-SHA2-128s |
|--------|-------------|-------------------|
| Public key | 1,952 bytes | 32 bytes |
| Signature | 3,293 bytes | 7,856 bytes |
| Sign (cycles) | ~10⁶ | ~10⁸ |
| Verify (cycles) | ~10⁶ | ~10⁷ |

### Selection Criteria for PQC Algorithms

When choosing PQC algorithms, consider:

1. **Security margin:** How well-studied is the underlying problem? Lattice problems have been studied since the 1990s. Hash-based signatures have the strongest security foundation (only relying on hash function security).

2. **Performance:** Key size, ciphertext/signature size, and computational speed. Lattice-based algorithms offer the best balance. Code-based algorithms have large keys but fast operations.

3. **Implementation security:** Resistance to side-channel attacks, ease of constant-time implementation. Lattice-based algorithms are generally easier to implement securely.

4. **Standardization status:** NIST-selected algorithms are preferred for new deployments. Kyber and Dilithium are the primary standards.

5. **Backward compatibility:** Hybrid approaches with existing algorithms provide transitional security.

## Lattice-Based Cryptography: Deeper Dive

### The Shortest Vector Problem

The security of lattice-based cryptography ultimately rests on the hardness of the Shortest Vector Problem (SVP): given a lattice L (a discrete subgroup of Rⁿ), find the shortest non-zero vector in L.

**Exact SVP:** Find the shortest vector exactly. This is NP-hard under randomized reductions.

**Approximate SVP (SVP_γ):** Find a vector v such that ||v|| ≤ γ · λ₁(L) where λ₁(L) is the length of the shortest vector and γ is the approximation factor. For γ = poly(n), this is believed to be hard.

The best known algorithms for SVP are lattice reduction algorithms:

**LLL algorithm (1982):** Finds a vector within 2^((n-1)/2) of the shortest. Runs in polynomial time. Too weak for cryptography.

**BKZ algorithm (1996):** Block Korkine-Zolotarev. Finds a vector within β^(n/(2β)) of the shortest, where β is the block size. Runs in time O(β^(O(β)) · poly(n)). For β = 400, this gives a 128-bit security level.

**Quantum BKZ:** Uses quantum algorithms to speed up the SVP subroutine in BKZ. Provides approximately 2× speedup, reducing the effective security by approximately 1 bit.

### The Learning With Errors Problem

The LWE problem is: given (A, b = A·s + e mod q), find s. The error e makes this problem hard.

**Decisional LWE:** Distinguish (A, A·s + e) from (A, u) where u is uniform. This is the version used in cryptographic constructions.

**Search LWE:** Find s given (A, A·s + e). This is the version used in key exchange.

The hardness of LWE depends on:
1. The dimension n (larger = harder)
2. The modulus q (larger = easier, but needed for correctness)
3. The error distribution (larger errors = harder, but too large breaks correctness)

**Concrete security:** For Kyber-768 (n = 768, q = 3329, η = 2), the best known attack requires approximately 2^185 quantum operations. This provides approximately 185-bit quantum security.

### Ring-LWE and Module-LWE

**Ring-LWE:** Operates over polynomial rings R_q = Z_q[x]/(x^n + 1). The ring structure allows efficient multiplication using the Number Theoretic Transform (NTT), reducing the computational cost from O(n²) to O(n log n).

**Module-LWE:** Operates over modules of polynomial rings. Provides a middle ground between unstructured LWE (most secure, least efficient) and Ring-LWE (least secure, most efficient). Kyber uses Module-LWE with k = 3 (for Kyber-768).

The security reduction is: Module-LWE is at least as hard as solving SVP_γ on certain lattices. For Kyber-768, γ ≈ 2^(64), meaning solving Module-LWE is at least as hard as solving approximate SVP with approximation factor 2^(64).

## Code-Based Cryptography: Deeper Dive

### The Syndrome Decoding Problem

The security of code-based cryptography relies on the Syndrome Decoding Problem (SDP): given a random linear code C with generator matrix G and parity check matrix H, and a syndrome s = H·e where e is a low-weight error vector, find e.

**Hardness:** The SDP is NP-hard for general codes. The best known algorithms are information set decoding (ISD) algorithms, which run in exponential time.

**Quantum speedup:** Quantum algorithms for SDP provide only a modest speedup (approximately 2×), similar to Grover's speedup for search. This makes code-based cryptography one of the most quantum-resistant families.

### McEliece Variants

**Original McEliece (1978):** Uses binary Goppa codes. Public key size: 261,120-1,047,319 bytes. Ciphertext size: 128-240 bytes. Encryption/decryption speed: fast.

**Niederreiter variant:** Uses the dual of the Goppa code. Same security as McEliece but with smaller ciphertexts (equal to the error-correcting capability).

**QC-MDPC (BIKE):** Uses quasi-cyclic moderate-density parity-check codes. Smaller key sizes than Classic McEliece but larger ciphertexts. Faster key generation.

**QC-LDPC (HQC):** Uses quasi-cyclic low-density parity-check codes. Similar performance to BIKE but with different security properties.

### Code-Based Signatures

Code-based digital signatures are less developed than lattice-based or hash-based signatures. The few proposals (e.g., CFS, Wave) have large signatures or slow signing times.

**CFS (Courtois-Finiasz-Sendrier):** Uses the Niederreiter cryptosystem for signatures. Large signatures (approximately 100 KB) and slow signing (approximately 1 second).

**Wave:** Uses a different code structure for smaller signatures (approximately 5 KB) but is less well-studied.

Code-based signatures are not recommended for general use due to their large size and slow performance. Lattice-based (Dilithium) or hash-based (SPHINCS+) signatures are preferred.

## Assessment

**Task 1: Lattice Problem Analysis (45 minutes)**
Implement a toy version of the LWE problem with n = 4, q = 7, and error drawn from {-1, 0, 1}. Generate a random LWE instance and solve it using brute force (enumerate all possible secret vectors). Show that the problem becomes harder as n increases by running for n = 4, 6, 8, and timing the brute-force solution. Discuss how this relates to the security of Kyber.

**Task 2: SPHINCS+ Structure (60 minutes)**
Implement a simplified version of a Merkle tree with 8 leaves using SHA-256. Generate 8 one-time key pairs, build the tree, and create a signature for a message using the 3rd leaf. Verify the signature by recomputing the tree root. Measure the signature size and compare with the theoretical size for a tree of this height. Discuss how SPHINCS+ extends this to a forest of trees.

**Task 3: Algorithm Comparison (45 minutes)**
Compare Kyber-768, Classic McEliece-460896, and BIKE-3 on the following criteria: key size, ciphertext size, encryption speed, decryption speed, and security level. Create a decision matrix with weighted criteria (you choose the weights) and recommend which algorithm to use for each of the following scenarios: (a) TLS key exchange, (b) IoT device communication, (c) firmware update signing, (d) long-term document archiving.

**Task 4: Security Analysis (60 minutes)**
For each PQC algorithm family (lattice, hash, code), identify the best known quantum attack and estimate the quantum resources required to break a concrete parameter set. Compare the security margin of each family. Discuss what would happen if a new mathematical breakthrough reduced the security of lattice-based cryptography by 50 bits. How would this affect the recommended parameter sets?

**Grading Criteria:**
- LWE implementation correctly demonstrates the hardness of the problem (25%)
- Merkle tree implementation is correct and signature verification works (25%)
- Algorithm comparison demonstrates understanding of tradeoffs (25%)
- Security analysis shows depth of understanding of quantum threats to each family (25%)

## Evidence

- NIST. "Post-Quantum Cryptography Standardization." https://csrc.nist.gov/projects/post-quantum-cryptography
- Peikert, C. "A Decade of Lattice Cryptography." *Foundations and Trends in Theoretical Computer Science* 10, 283 (2016).
- Bernstein, D.J. et al. "SPHINCS+: Submission to the NIST Post-Quantum Cryptography Standardization Process." 2017.
- McEliece, R.J. "A Public-Key Cryptosystem Based on Algebraic Coding Theory." *DSN Progress Report* 42-44, 114 (1978).
- Castryck, W. & Decru, T. "An Efficient Key Recovery Attack on SIDH." *EUROCRYPT 2022*, Lecture Notes in Computer Science, 448-467 (2022).
