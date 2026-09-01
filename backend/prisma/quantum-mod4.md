# Module 4: Cryptographic Threats

## The Quantum Threat to Cryptography

Modern cryptography rests on the computational difficulty of certain mathematical problems. RSA relies on the difficulty of factoring large integers. Elliptic curve cryptography (ECC) relies on the difficulty of the discrete logarithm problem on elliptic curves. Diffie-Hellman key exchange relies on the discrete logarithm problem in finite fields. These assumptions have held for decades, but quantum computing fundamentally changes the landscape.

Shor's algorithm provides an exponential speedup for both integer factoring and discrete logarithms. A sufficiently large quantum computer running Shor's algorithm could break RSA, ECC, and Diffie-Hellman in polynomial time. This is not a theoretical curiosity: it is a concrete threat to the infrastructure that secures internet communications, financial transactions, and government secrets.

The threat is not limited to Shor's algorithm. Grover's algorithm provides a quadratic speedup for brute-force search, which reduces the effective security of symmetric key algorithms by half. A 128-bit AES key would provide only 64 bits of security against a quantum adversary.

This module analyzes the specific quantum threats to each category of cryptographic algorithm and quantifies the impact.

## Breaking RSA with Shor's Algorithm

### RSA Background

RSA encryption uses a public key (N, e) and a private key d. Encryption: c = mᵉ mod N. Decryption: m = cᵈ mod N. The security relies on the difficulty of computing d from (N, e), which requires factoring N = p·q.

For RSA-2048, N is a 2048-bit number (approximately 617 decimal digits). The best classical factoring algorithm (general number field sieve) has a running time of:

L_N[1/3, (64/9)^(1/3)] ≈ e^(1.923 · (ln N)^(1/3) · (ln ln N)^(2/3))

For N ≈ 2²⁰⁴⁸, this is approximately 2¹¹² operations: computationally infeasible with current or near-term classical computers.

### Shor's Algorithm for RSA

Shor's algorithm factors N in O(n² log n log log n) time, where n = log₂ N. For RSA-2048, this is approximately 2048² ≈ 4 million quantum gate operations (plus overhead for error correction).

The quantum circuit for factoring RSA-2048 requires:
- Approximately 4096 qubits for the two quantum registers
- Additional qubits for error correction (estimated 10-20 million physical qubits total)
- Modular exponentiation circuit depth of approximately O(n³) ≈ 8 billion gate operations
- Quantum Fourier Transform of approximately O(n²) ≈ 4 million gate operations

**Resource estimates for factoring RSA-2048:**

| Resource | Estimate |
|----------|----------|
| Logical qubits | ~4096 |
| Physical qubits (with error correction) | ~10-20 million |
| Quantum gate depth | ~10⁹-10¹⁰ |
| Wall-clock time (with parallelism) | ~8-24 hours |
| Classical post-processing | Negligible |

These estimates assume fault-tolerant quantum computing with a physical error rate of approximately 10⁻³ (below the threshold for surface code error correction). Current quantum computers have error rates of approximately 10⁻³-10⁻² for two-qubit gates, which is near but below the threshold.

### Timeline Estimates

Multiple organizations have published estimates of when a cryptographically relevant quantum computer (CRQC) might be built:

- Gidney & Ekerå (2021): 20 million noisy qubits in 8 hours, or 20 million error-corrected logical qubits
- NSA (2022): "Current classical public key algorithms... will be vulnerable" within the foreseeable future
- NIST (2022): Recommends transitioning to post-quantum cryptography by 2035
- Various industry estimates: 2030-2045 for a CRQC

The "harvest now, decrypt later" attack is already a concern: adversaries can collect encrypted communications today and decrypt them once a CRQC is available. This makes the threat immediate, even though the quantum computer does not yet exist. Sensitive data with long-term confidentiality requirements: such as government secrets, health records, intellectual property, and financial data: is particularly vulnerable to this attack vector. Adversaries with sufficient storage capacity can archive intercepted traffic for years or decades until quantum computers become available.

## Breaking ECC

### ECC Background

Elliptic curve cryptography uses the elliptic curve discrete logarithm problem (ECDLP): given points P and Q on an elliptic curve where Q = kP (scalar multiplication), find k. The best classical algorithm for ECDLP on a curve of order n is Pollard's rho algorithm, requiring O(√n) operations. For a 256-bit curve, this is approximately 2¹²⁸ operations: infeasible classically.

### Shor's Algorithm for ECC

Shor's algorithm can be adapted to solve the ECDLP. The quantum period finding step applies to the group structure of elliptic curves. The quantum circuit for ECDLP requires:

- Approximately 2n qubits for an n-bit curve
- Modular arithmetic on the curve, which is more complex than integer arithmetic
- The same O(n² log n log log n) complexity as integer factoring

For a 256-bit elliptic curve (ECC-256, commonly used in TLS), Shor's algorithm requires:
- Approximately 512 logical qubits
- Approximately 5-10 million physical qubits with error correction
- Similar wall-clock time as RSA factoring

**Key insight:** ECC keys are shorter than RSA keys for equivalent classical security. A 256-bit ECC key provides the same classical security as a 3072-bit RSA key. However, quantum attacks are equally effective against both: Shor's algorithm breaks ECC-256 with the same ease as RSA-2048.

### Comparison of Quantum Attacks on Public Key Algorithms

| Algorithm | Classical Security | Quantum Attack | Qubits Needed (Logical) | Qubits Needed (Physical) |
|-----------|-------------------|----------------|------------------------|--------------------------|
| RSA-2048 | 112 bits | Shor's factoring | ~4096 | ~10-20 million |
| ECC-256 | 128 bits | Shor's ECDLP | ~512 | ~5-10 million |
| DH-2048 | 112 bits | Shor's DLP | ~4096 | ~10-20 million |
| DSA-2048 | 112 bits | Shor's DLP | ~4096 | ~10-20 million |

All public key algorithms based on factoring or discrete logarithms are broken by Shor's algorithm. This includes RSA, ECC, Diffie-Hellman, DSA, ECDSA, and EdDSA.

## Symmetric Key Threats

### Grover's Algorithm and Symmetric Keys

Grover's algorithm provides a quadratic speedup for brute-force search. For a symmetric key of length k bits, the classical brute-force attack requires O(2ᵏ) operations. Grover's algorithm requires O(2^(k/2)) operations.

**Impact on specific algorithms:**

| Algorithm | Key Length | Classical Security | Quantum Security (Grover's) | Status |
|-----------|-----------|-------------------|---------------------------|--------|
| AES-128 | 128 bits | 128 bits | 64 bits | Insecure |
| AES-192 | 192 bits | 192 bits | 96 bits | Insecure |
| AES-256 | 256 bits | 256 bits | 128 bits | Secure |
| 3DES | 168 bits | 112 bits | 56 bits | Insecure |
| ChaCha20-256 | 256 bits | 256 bits | 128 bits | Secure |

AES-256 retains 128-bit security against quantum attacks, which is considered sufficient. AES-128 is reduced to 64-bit security, which is below the minimum acceptable threshold.

### Grover's Limitations

The quadratic speedup from Grover's is the best possible quantum speedup for unstructured search. This is proven by a lower bound argument: any quantum algorithm requires Ω(√N) queries to find a marked item in an unstructured database of N items.

However, Grover's speedup can be combined with structural attacks on specific algorithms. For example:
- A meet-in-the-middle attack on 2-key 3DES uses O(2^(k/2)) classical time. Grover's does not improve this because the attack already achieves the √N bound.
- Birthday attacks on hash functions use O(2^(n/2)) classical time. Grover's provides no speedup for finding collisions (the BHT algorithm does, but only provides a quadratic speedup for a different problem).

### Impact on Hash Functions

Hash functions face two quantum threats:

**Preimage resistance:** Finding an input that hashes to a specific output. Classical: O(2ⁿ). Quantum (Grover's): O(2^(n/2)). Impact: SHA-256 provides 128-bit quantum preimage security.

**Collision resistance:** Finding two inputs that hash to the same output. Classical: O(2^(n/2)) using birthday attack. Quantum (BHT algorithm): O(2^(n/3)). Impact: SHA-256 provides ~85-bit quantum collision security. SHA-384 provides ~128-bit quantum collision security.

NIST recommends:
- SHA-256: 128-bit quantum preimage security, acceptable
- SHA-384: 192-bit quantum preimage security, comfortable
- SHA-512: 256-bit quantum preimage security, maximum margin

### Impact on HMAC and Authentication

HMAC security depends on both the hash function and the key length. If the hash function has n-bit quantum security, HMAC provides min(k/2, n/2) bits of quantum security. For HMAC-SHA256 with a 256-bit key, quantum security is 128 bits: sufficient.

**Key derivation functions:**
- HKDF-SHA256: Provides 128-bit quantum security. Sufficient for most applications.
- HKDF-SHA384: Provides 192-bit quantum security. Recommended for long-term security.
- PBKDF2: With sufficient iterations (100,000+), provides adequate quantum security for password hashing.
- Argon2: Memory-hard function, provides quantum security through computational cost.

**Digital signature verification:**
- RSA-2048: Broken by Shor's algorithm. Replace with Dilithium-3.
- ECDSA-256: Broken by Shor's algorithm. Replace with Dilithium-3.
- EdDSA-25519: Broken by Shor's algorithm. Replace with Dilithium-2 or Dilithium-3.
- Dilithium-3: Provides 192-bit quantum security. Recommended for general use.
- SPHINCS+-128s: Provides 128-bit quantum security. Conservative choice for high-security applications.

**Transport layer security:**
- TLS 1.3 with X25519: Broken by Shor's algorithm. Deploy hybrid X25519Kyber768.
- TLS 1.3 with RSA: Broken by Shor's algorithm. Deploy hybrid RSAKyber768.
- SSH with Diffie-Hellman: Broken by Shor's algorithm. Deploy hybrid sntrup761x25519.
- IPsec with IKEv2: Broken by Shor's algorithm. Deploy hybrid Kyber-768.

## Practical Quantum Attack Analysis

### Current State of Quantum Hardware

As of 2025, the largest quantum processors have approximately 1000+ physical qubits. The error rates for two-qubit gates are approximately 10⁻³-10⁻². Breaking RSA-2048 requires approximately 10-20 million physical qubits with error rates below 10⁻³.

The gap between current and required hardware is approximately 4-5 orders of magnitude in qubit count and 1-2 orders of magnitude in error rate. This gap is closing, but current estimates suggest a CRQC is 10-20+ years away.

### The Harvest Now, Decrypt Later Threat

The most immediate threat is not a quantum computer attacking today's communications, but rather adversaries recording encrypted communications today and decrypting them in the future when a CRQC is available.

**Vulnerable data types:**
- Government classified information (typically needs to remain secret for 25-50+ years)
- Financial records and trade secrets (10-20 year sensitivity)
- Personal health records (lifetime sensitivity)
- Intellectual property (10-30 year sensitivity)

**Not vulnerable:**
- Short-lived session keys (TLS session keys that expire in hours)
- Data that will be public soon
- Data with no long-term value

**Vulnerable data retention periods:**
- Government classified: 25-75 years
- Financial records: 7-10 years
- Medical records: Lifetime + 50 years
- Intellectual property: 20-50 years
- Trade secrets: Indefinite

Organizations handling sensitive long-term data should begin transitioning to post-quantum cryptography immediately, regardless of when a CRQC becomes available.

### Organizational Impact Assessment

**Critical infrastructure:** Power grids, water systems, and telecommunications rely on SCADA systems with long-lived certificates. These systems are difficult to update and may require hardware replacement.

**Healthcare:** Electronic health records must be protected for the patient's lifetime plus 50 years. A breach today could expose data that remains sensitive for decades.

**Legal:** Attorney-client privilege communications may need to remain confidential indefinitely. Legal holds may preserve data for decades.

**Defense:** Military communications and intelligence data may be classified for 50-75 years. The quantum threat is immediate for these applications.

### Hybrid Cryptographic Approaches

The immediate response to the quantum threat is hybrid cryptography: using both classical and post-quantum algorithms simultaneously. A hybrid key exchange combines, for example, X25519 (classical ECC) with Kyber-768 (post-quantum). The combined key is secure if either algorithm is secure.

This approach provides:
- Backward compatibility: classical algorithms still work
- Forward security: post-quantum algorithms protect against quantum attacks
- Conservative security: the combined key is at least as secure as the stronger individual algorithm

Hybrid approaches are already being deployed in TLS 1.3 (Google Chrome, Cloudflare) and in messaging protocols (Signal, WhatsApp).

## Case Study: Quantum Threats to a Financial System

Consider a typical banking system that uses:
- TLS 1.3 with X25519 for key exchange
- ECDSA-256 for digital signatures
- AES-256-GCM for symmetric encryption
- SHA-256 for hashing
- RSA-2048 for certificate chains

**Quantum vulnerability assessment:**

1. **Key exchange (X25519):** Broken by Shor's algorithm. A CRQC can compute the shared secret from the public key. Impact: complete loss of confidentiality.

2. **Digital signatures (ECDSA-256):** Broken by Shor's algorithm. A CRQC can forge signatures. Impact: complete loss of authentication and non-repudiation.

3. **Certificate chains (RSA-2048):** Broken by Shor's algorithm. A CRQC can forge certificates. Impact: complete loss of trust infrastructure.

4. **Symmetric encryption (AES-256-GCM):** Reduced to 128-bit security by Grover's. Impact: still secure for practical purposes.

5. **Hashing (SHA-256):** Reduced to 128-bit preimage security, 85-bit collision security. Impact: still acceptable for most applications.

**Mitigation strategy:**
- Replace X25519 with Kyber-768 (or hybrid X25519+Kyber)
- Replace ECDSA-256 with Dilithium-3 (or hybrid ECDSA+Dilithium)
- Replace RSA-2048 with Dilithium-3 or Falcon-512
- Keep AES-256-GCM (still secure)
- Consider upgrading to SHA-384 for additional collision resistance margin

**Timeline and cost:**
- Phase 1 (immediate): Deploy hybrid key exchange in TLS
- Phase 2 (1-2 years): Deploy hybrid signatures in certificate infrastructure
- Phase 3 (3-5 years): Full migration to post-quantum algorithms
- Cost: Significant engineering effort for protocol changes, certificate infrastructure updates, and backward compatibility

## Quantum Threats to Specific Protocols

### SSH (Secure Shell)

SSH uses Diffie-Hellman key exchange and RSA/ECDSA signatures. Both are vulnerable to quantum attacks.

**Current SSH security:**
- Key exchange: Diffie-Hellman (broken by Shor's)
- Server authentication: RSA-2048 or ECDSA-256 (broken by Shor's)
- Session encryption: AES-256-CTR or ChaCha20-Poly1305 (secure)

**Quantum-safe SSH:**
- Key exchange: CRYSTALS-Kyber-768 (or hybrid X25519Kyber768)
- Server authentication: CRYSTALS-Dilithium-3 (or hybrid Ed25519Dilithium3)
- Session encryption: AES-256-CTR or ChaCha20-Poly1305 (unchanged)

OpenSSH 9.0+ supports hybrid key exchange (sntrup761x25519-sha512). This provides quantum resistance while maintaining backward compatibility.

### VPN (Virtual Private Network)

IPsec and WireGuard use Diffie-Hellman key exchange and ECDSA signatures. Both are vulnerable to quantum attacks.

**Current VPN security:**
- Key exchange: ECDH (broken by Shor's)
- Authentication: ECDSA-256 (broken by Shor's)
- Tunnel encryption: AES-256-GCM (secure)

**Quantum-safe VPN:**
- Key exchange: Kyber-768 (or hybrid X25519Kyber768)
- Authentication: Dilithium-3 (or hybrid Ed25519Dilithium3)
- Tunnel encryption: AES-256-GCM (unchanged)

WireGuard's simple protocol design makes it easier to integrate post-quantum algorithms. The key exchange can be updated without changing the tunnel encryption.

### Blockchain and Cryptocurrency

Bitcoin and Ethereum use ECDSA-256 for transaction signatures. This is vulnerable to quantum attacks.

**Current blockchain security:**
- Transaction signatures: ECDSA-256 (broken by Shor's)
- Address generation: SHA-256 and RIPEMD-160 (reduced security)
- Mining: SHA-256 (reduced security but still practical)

**Quantum-safe blockchain:**
- Transaction signatures: Dilithium-3 or SPHINCS+
- Address generation: SHA-384 or SHA-512
- Mining: Unchanged (ASIC-resistant algorithms may need updates)

The transition is challenging because blockchain is decentralized. All nodes must agree on the new signature scheme, requiring a hard fork. Some cryptocurrencies (e.g., QRL, IOTA) are already using post-quantum signatures.

## Quantum-Safe Symmetric Algorithms

### AES in the Post-Quantum World

AES (Advanced Encryption Standard) remains secure against quantum attacks when using sufficient key lengths. The key insight is that Grover's algorithm provides only a quadratic speedup for brute-force search, not an exponential one.

**AES-128:** Provides 64-bit quantum security. This is below the minimum acceptable threshold (80 bits). AES-128 should be considered insecure against quantum adversaries.

**AES-192:** Provides 96-bit quantum security. This is borderline acceptable for near-term applications but insufficient for long-term security.

**AES-256:** Provides 128-bit quantum security. This is the recommended minimum for post-quantum security. AES-256 is the standard choice for encrypting data that must remain confidential for decades.

**Key rotation:** Even with AES-256, key rotation is important. The longer a key is in use, the more ciphertext an attacker can collect, increasing the chances of related-key attacks. For post-quantum security, rotate AES-256 keys at least annually.

### Hash Function Selection

Hash functions face two quantum threats: preimage resistance (reduced by Grover's) and collision resistance (reduced by BHT algorithm).

**SHA-256:** Provides 128-bit quantum preimage security and 85-bit quantum collision security. Acceptable for most applications but consider SHA-384 for long-term security.

**SHA-384:** Provides 192-bit quantum preimage security and 128-bit quantum collision security. Recommended for applications requiring long-term security.

**SHA-512:** Provides 256-bit quantum preimage security and 128-bit quantum collision security. Maximum margin for quantum security.

**SHA-3 (Keccak):** Similar security properties to SHA-2 but with a different internal structure. Provides algorithm diversity, which is valuable if a weakness is found in SHA-2.

### Post-Quantum MAC Algorithms

HMAC (Hash-based Message Authentication Code) security depends on both the hash function and the key length. For post-quantum security:

**HMAC-SHA256:** With a 256-bit key, provides 128-bit quantum security. Acceptable.

**HMAC-SHA384:** With a 384-bit key, provides 192-bit quantum security. Recommended.

**KMAC (Keccak MAC):** Based on SHA-3, provides similar security to HMAC but with different security properties. Good for algorithm diversity.

### Symmetric Encryption Mode Selection

The encryption mode affects security. For post-quantum applications:

**AES-GCM:** Provides both encryption and authentication. The 96-bit IV should be managed carefully to avoid nonce reuse. For post-quantum security, use AES-256-GCM with a 256-bit key.

**AES-GCM-SIV:** Provides nonce-misuse resistance. More robust against implementation errors than AES-GCM. Recommended for applications where nonce management is challenging.

**ChaCha20-Poly1305:** Alternative to AES-GCM with similar security properties. Software-friendly and resistant to timing attacks. Good choice for software implementations.

**AES-CCM:** Combines CBC encryption with CMAC authentication. Used in IoT and wireless protocols. Acceptable for post-quantum security.

**Key management for post-quantum symmetric encryption:**
- Rotate keys annually for long-term security
- Use separate keys for encryption and authentication
- Store keys in hardware security modules (HSMs)
- Implement key escrow for disaster recovery

### Symmetric Algorithm Performance Comparison

| Algorithm | Key Size | Block Size | Speed (software) | Speed (hardware) |
|-----------|----------|------------|------------------|------------------|
| AES-128 | 128 bits | 128 bits | 1 GB/s | 10 GB/s |
| AES-256 | 256 bits | 128 bits | 800 MB/s | 8 GB/s |
| ChaCha20 | 256 bits | 64 bits | 1.2 GB/s | N/A |
| 3DES | 168 bits | 64 bits | 50 MB/s | 500 MB/s |

AES-256 is the recommended choice for post-quantum symmetric encryption. It provides 128-bit quantum security with excellent performance on both software and hardware.

## Post-Quantum TLS Considerations

### Cipher Suite Negotiation

TLS 1.3 cipher suite negotiation must be updated to support post-quantum algorithms. The cipher suite format is:

```
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_GCM_SHA256
```

For post-quantum, new cipher suites are being defined:
```
TLS_ML_KEM_768_AES_256_GCM_SHA384
TLS_ML_KEM_1024_AES_256_GCM_SHA384
```

The key exchange algorithm is negotiated separately from the symmetric encryption algorithm, allowing hybrid approaches.

### Handshake Performance

Post-quantum key exchange adds overhead to the TLS handshake:

**Kyber-768:** Adds approximately 1.2 KB to ClientHello and 1.1 KB to ServerHello. Computation time: approximately 1 millisecond.

**Hybrid X25519Kyber768:** Adds approximately 1.2 KB to ClientHello (client key share) and 1.1 KB to ServerHello (server key share). The total handshake overhead is approximately 2.3 KB.

**Impact on latency:** For high-latency connections (mobile networks), the additional 2.3 KB is negligible compared to network round-trip time. For low-latency connections (data centers), the overhead may be noticeable but acceptable.

### Session Resumption

TLS session resumption (using pre-shared keys or session tickets) reduces the need for full handshakes. Post-quantum session tickets use Kyber-768 to encrypt the session state, providing post-quantum forward secrecy for resumed sessions.

## Assessment

**Task 1: Quantum Threat Analysis (45 minutes)**
Select a real-world cryptographic protocol (e.g., TLS 1.3, SSH, Signal, Bitcoin) and analyze its quantum vulnerability. Identify which components are broken by quantum attacks and which are not. Propose a specific migration strategy with timeline and algorithm choices. Write a 2-page analysis.

**Task 2: Grover's Attack on AES (60 minutes)**
Implement a simplified version of Grover's algorithm that searches for a 3-bit AES key. The "encryption" function is a simple substitution cipher (S-box). Implement the oracle that checks if the guessed key decrypts a known plaintext correctly. Run the circuit and verify that Grover's algorithm finds the key in approximately 2 iterations instead of the classical 4. Discuss the implications for AES-128.

**Task 3: Resource Estimation (60 minutes)**
Using the resource estimation tools available in the Qiskit Nature module or the paper by Gidney & Ekerå, estimate the quantum resources required to break RSA-2048. Report the number of logical qubits, physical qubits (with surface code error correction), circuit depth, and wall-clock time. Compare with RSA-1024 and RSA-4096. Discuss the feasibility of each.

**Task 4: Hybrid Protocol Design (45 minutes)**
Design a hybrid key exchange protocol that combines X25519 with Kyber-768. Define the key derivation function that combines the two shared secrets. Analyze the security of the hybrid protocol: what happens if each individual algorithm is broken? What is the minimum security guarantee? Write a formal specification of the protocol.

**Grading Criteria:**
- Threat analysis correctly identifies vulnerable and secure components (25%)
- Grover's attack implementation is correct and results match predictions (25%)
- Resource estimates are accurate and well-justified (25%)
- Hybrid protocol design is sound and security analysis is correct (25%)

## Evidence

- Shor, P.W. "Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer." *SIAM Journal on Computing* 26, 1484 (1999).
- Grover, L.K. "A fast quantum mechanical algorithm for database search." *Proceedings of the 28th Annual ACM Symposium on Theory of Computing*, 212-219 (1996).
- Gidney, C. & Ekerå, M. "How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits." *Quantum* 5, 433 (2021).
- NIST. "Post-Quantum Cryptography: FAQ." https://csrc.nist.gov/projects/post-quantum-cryptography
- Mosca, M. "Cybersecurity in an era with quantum computers: will we be ready?" *IEEE Security & Privacy* 16, 38-41 (2018).
