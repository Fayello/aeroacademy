# Module 7 — Cryptography: What You Actually Need

Cryptography is one of the most misunderstood areas of security engineering. Developers either avoid it entirely (reinventing insecure schemes) or over-apply it (encrypting everything without understanding what encryption actually protects). The reality is that most applications need a small set of well-understood cryptographic operations used correctly. You do not need to understand the mathematics of elliptic curves or the proofs of IND-CPA security. You need to know which algorithm to use, how to use it correctly, and how to manage the keys.

The most dangerous cryptographic code is the code you write yourself. Every year, researchers find vulnerabilities in custom cryptographic implementations — timing side channels, padding oracle attacks, nonce reuse, key derivation flaws. The solution is to use established libraries and well-understood algorithms. The goal of this module is to give you the knowledge to make informed choices about which algorithms and libraries to use and how to use them correctly.

## Symmetric vs Asymmetric Encryption

Symmetric encryption uses the same key for encryption and decryption. Both parties must share the secret key, which creates a key distribution problem — how do you securely share the key with the recipient? Symmetric encryption is fast and efficient, making it suitable for encrypting large amounts of data.

Asymmetric encryption (public-key cryptography) uses a key pair: a public key for encryption and a private key for decryption. The public key can be shared openly. Anyone can encrypt a message with the public key, but only the holder of the private key can decrypt it. Asymmetric encryption is slow (roughly 1000x slower than symmetric encryption), making it unsuitable for encrypting large amounts of data directly.

In practice, you use both. Asymmetric encryption solves the key distribution problem: you use the recipient's public key to encrypt a symmetric key, then use the symmetric key to encrypt the actual data. This hybrid approach combines the security of asymmetric encryption with the performance of symmetric encryption. TLS uses this approach: the handshake uses asymmetric encryption to exchange a symmetric key, and the data transfer uses symmetric encryption with that key.

Digital signatures use asymmetric cryptography for authentication and integrity. The signer uses their private key to sign a message, and anyone with the public key can verify the signature. This proves the message came from the claimed sender (authentication) and has not been modified (integrity). Signatures do not provide confidentiality — the message is readable by anyone.

## AES-GCM vs ChaCha20-Poly1305

AES-GCM and ChaCha20-Poly1305 are the two recommended authenticated encryption algorithms. Both provide confidentiality (encryption) and integrity (authentication) in a single operation, eliminating the dangerous pattern of encrypt-then-MAC or MAC-then-encrypt.

### AES-GCM

AES-GCM (Galois/Counter Mode) is the most widely used authenticated encryption algorithm. It is hardware-accelerated on modern processors (Intel AES-NI), making it extremely fast on server hardware. AES-GCM uses a 128-bit block cipher (AES) in counter mode for encryption and a GHASH function for authentication.

AES-GCM requires a unique nonce (number used once) for each encryption operation with the same key. If a nonce is reused with the same key, the authentication is completely broken — an attacker can recover the authentication key and forge arbitrary ciphertexts. Nonce reuse is the most common and most catastrophic AES-GCM implementation error.

Recommended configuration:
- Key size: 256 bits (AES-256-GCM)
- Nonce size: 96 bits (the standard size for GCM)
- Tag size: 128 bits (the full GHASH output)

AES-GCM is the best choice when hardware acceleration is available (server-side applications). It is less suitable for mobile devices and embedded systems without AES-NI.

### ChaCha20-Poly1305

ChaCha20-Poly1305 is an alternative authenticated encryption algorithm designed by Daniel Bernstein. ChaCha20 is a stream cipher, and Poly1305 is a one-time MAC. Together, they provide authenticated encryption with security comparable to AES-GCM.

ChaCha20-Poly1305 does not require hardware acceleration for good performance. It is designed to be constant-time, making it resistant to timing side-channel attacks. This makes it particularly suitable for devices without AES-NI (mobile phones, embedded systems, older processors).

Recommended configuration:
- Key size: 256 bits
- Nonce size: 96 bits
- Tag size: 128 bits

ChaCha20-Poly1305 is the best choice for mobile applications, embedded systems, and environments where constant-time implementation is critical. Google adopted it for TLS in Android and Chrome, and it is widely supported in modern TLS libraries.

### Which to Choose

For server-side applications with AES-NI: AES-256-GCM. For mobile applications or environments without hardware acceleration: ChaCha20-Poly1305. For applications that must support both: negotiate the preferred algorithm during the TLS handshake (TLS 1.3 supports both).

Never use AES in ECB mode (each block is encrypted independently, leaking patterns). Never use AES in CBC mode without authenticated encryption (vulnerable to padding oracle attacks). Never use RC4, 3DES, or other legacy algorithms. Use authenticated encryption: AES-GCM or ChaCha20-Poly1305.

## RSA vs ECC vs Ed25519

RSA, ECC, and Ed25519 are asymmetric algorithms used for key exchange, digital signatures, and encryption.

### RSA

RSA is the oldest widely-deployed asymmetric algorithm. Its security is based on the difficulty of factoring large numbers. RSA key sizes of 2048 bits are considered the minimum acceptable; 4096 bits provide additional margin.

RSA is slow compared to ECC. A 2048-bit RSA operation takes roughly 1000x longer than an equivalent ECC operation. RSA signatures are large (256 bytes for 2048-bit keys), and RSA encryption is limited to messages smaller than the key size (245 bytes for 2048-bit keys with OAEP padding).

RSA is being phased out in favor of ECC and Ed25519 in most applications. If you are implementing a new system, use ECC or Ed25519. If you are maintaining an existing system that uses RSA, 2049-bit or larger keys remain secure.

### ECC (Elliptic Curve Cryptography)

ECC provides the same security as RSA with smaller key sizes. A 256-bit ECC key provides security equivalent to a 3072-bit RSA key. Smaller keys mean faster operations, smaller signatures, and less bandwidth.

The most commonly used ECC curve is P-256 (also known as secp256r1 or NIST P-256). It is supported by all major cryptographic libraries and is the default curve in most TLS implementations.

The concern with P-256 is that the curve parameters were generated by NIST, and some researchers believe the parameters may contain a backdoor. While no backdoor has been found, the concern has led to increased adoption of Curve25519, which has transparently generated parameters.

### Ed25519

Ed25519 is a digital signature algorithm based on Curve25519. It provides 128-bit security with small keys (32 bytes), small signatures (64 bytes), and fast signing and verification operations.

Ed25519 is designed to be resistant to implementation errors. It uses a deterministic nonce (derived from the private key and message), eliminating the nonce reuse vulnerability that affects ECDSA. It is constant-time by design, resisting timing attacks. It uses a twist-secure curve, resisting invalid curve attacks.

Ed25519 is the recommended algorithm for new applications that need digital signatures. It is supported by most modern cryptographic libraries (libsodium, OpenSSL 1.1.1+, BoringSSL, Go's crypto/ed25519).

For key exchange, X25519 (the Diffie-Hellman function on Curve25519) is the recommended algorithm. It provides the same security properties as Ed25519 for key agreement.

### Recommendation

For new applications: Ed25519 for signatures, X25519 for key exchange, AES-256-GCM or ChaCha20-Poly1305 for symmetric encryption. For applications that must interoperate with legacy systems: RSA with 2048+ bit keys or ECDSA with P-256.

## Key Management

Key management is the most critical aspect of cryptography and the most frequently neglected. A perfectly implemented encryption algorithm with a poorly managed key provides no security. Key management encompasses generation, storage, rotation, and destruction.

### Key Generation

Keys must be generated using cryptographically secure random number generators. Never use `Math.random()`, `random.randint()`, `System.currentTimeMillis()`, or any other non-cryptographic source of randomness.

In Python: `secrets.token_bytes(32)` for a 256-bit key. In Node.js: `crypto.randomBytes(32)`. In Go: `crypto/rand.Read(make([]byte, 32))`. In Java: `KeyGenerator.getInstance("AES").generateKey()`.

The key generation environment matters. Keys generated on a compromised system may be predictable. For high-security applications, generate keys in a hardware security module (HSM) or a trusted execution environment (TEE).

### Key Storage

Keys must be stored securely, with access controls that limit who and what can access them. The storage mechanism depends on the use case and security requirements.

**Environment variables:** Suitable for development and low-security applications. Not suitable for production because environment variables are accessible to any process running as the same user and are often logged in debugging output.

**Secrets management systems:** HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, and GCP Secret Manager provide centralized key storage with access controls, audit logging, and automatic rotation. These are the recommended approach for production applications.

**Hardware security modules (HSMs):** FIPS 140-2 Level 3 certified devices that store keys in tamper-resistant hardware. Keys never leave the HSM — all cryptographic operations happen inside the device. HSMs are required for some regulatory frameworks (PCI DSS for payment processing) and are the most secure key storage option.

**Encrypted file storage:** Keys encrypted with a master key and stored on the file system. The master key must be protected separately (HSM, environment variable, or secrets management system). Suitable for applications that cannot use external secrets management services.

### Key Rotation

Keys must be rotated periodically to limit the impact of key compromise. The rotation frequency depends on the key type and the security requirements:

- Symmetric encryption keys: every 90 days for high-security applications, every 365 days for standard applications
- API keys: every 90 days
- TLS certificates: every 90 days (automated with Let's Encrypt)
- Signing keys: every 365 days
- Password hashing salts: generated per-password, no rotation needed

Key rotation must be seamless — the application must continue to function during rotation. For symmetric encryption, this means supporting multiple active keys during the rotation period: decrypt with both the old and new key, encrypt with the new key only. After all data has been re-encrypted with the new key, the old key can be destroyed.

### Key Destruction

When a key is no longer needed, it must be destroyed securely. Simply deleting the key is not sufficient — the data may still exist in backups, logs, or swap space. Secure destruction means ensuring the key cannot be recovered from any storage medium.

For software-stored keys, overwrite the memory holding the key before freeing it. Most cryptographic libraries provide functions for this (e.g., `sodium_memzero()` in libsodium). For HSM-stored keys, use the HSM's key destruction function, which typically involves a multi-step process with authorization requirements.

## TLS 1.3 Internals

TLS 1.3 is the current version of the Transport Layer Security protocol, providing encryption, authentication, and integrity for network communications. Understanding TLS 1.3 internals is important for configuring secure communications and debugging connectivity issues.

### TLS 1.3 Handshake

The TLS 1.3 handshake is simpler and faster than TLS 1.2. It completes in one round trip (1-RTT) instead of two:

1. The client sends a ClientHello with supported cipher suites, key share (for the preferred key exchange), and other parameters.
2. The server responds with a ServerHello, selected cipher suite, key share, certificate, and finished message.
3. The client verifies the server's certificate, derives the session keys, and sends its finished message.

The key improvement in TLS 1.3 is that all handshake messages after the ServerHello are encrypted, including the certificate. In TLS 1.2, the certificate was sent in plaintext, allowing network observers to see which certificate was presented (and therefore which site was being visited).

### Cipher Suites

TLS 1.3 defines five cipher suites, all of which use authenticated encryption:

- `TLS_AES_256_GCM_SHA384`
- `TLS_AES_128_GCM_SHA256`
- `TLS_CHACHA20_POLY1305_SHA256`
- `TLS_AES_128_CCM_SHA256`
- `TLS_AES_128_CCM_8_SHA256`

The first three are the most commonly used. The choice between AES-GCM and ChaCha20-Poly1305 depends on hardware support — AES-GCM is faster on hardware with AES-NI, while ChaCha20-Poly1305 is faster without it.

### TLS 1.3 Configuration

Recommended TLS 1.3 configuration:

```
TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256
```

Disable TLS 1.2 and below. While TLS 1.2 with modern cipher suites is still secure, TLS 1.3 is simpler, faster, and eliminates known vulnerabilities in the TLS 1.2 handshake.

## Digital Certificates

Digital certificates bind a public key to an identity (a domain name, an organization, or a person). They are signed by a certificate authority (CA), which vouches for the binding. The relying party (typically a browser or client application) verifies the CA's signature to trust the certificate.

### X.509

X.509 is the standard format for digital certificates. An X.509 certificate contains the subject (who the certificate is for), the public key, the issuer (which CA signed it), the validity period, and extensions (key usage, subject alternative names, etc.).

Certificate chains link end-entity certificates to root certificates. An end-entity certificate is signed by an intermediate CA, which is signed by a root CA. The relying party verifies the chain by checking each signature up to a trusted root CA. Root CAs are distributed in browser and operating system trust stores.

### Let's Encrypt

Let's Encrypt provides free, automated TLS certificates. Its ACME protocol enables automated certificate issuance and renewal, eliminating the manual process of generating CSRs, submitting them to a CA, and installing the resulting certificates.

Let's Encrypt certificates are trusted by all major browsers and have a 90-day validity period. The short validity period encourages automation — manual renewal every 90 days is impractical, so organizations must automate the renewal process.

Certbot is the most common client for Let's Encrypt. A typical automated renewal:

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d example.com -d www.example.com

# Verify auto-renewal
certbot renew --dry-run
```

### Certificate Pinning

Certificate pinning restricts which certificates a client will accept for a particular server. Instead of trusting any certificate signed by a trusted CA, the client only accepts a specific certificate or a certificate signed by a specific intermediate CA.

Certificate pinning was popularized as a defense against CA compromises and man-in-the-middle attacks using fraudulent certificates. However, it has largely been abandoned because it creates operational challenges — when the pinned certificate expires or the CA changes, all pinned clients break.

The modern alternative is Certificate Transparency (CT), which logs all issued certificates in public, append-only logs. CT does not prevent fraudulent certificates but makes them detectable. Combined with HTTP Public Key Pinning (HPKP) alternatives like CTA (Certificate Transparency Awareness), CT provides similar security benefits without the operational risks of pinning.

## Real Scenario: Implementing End-to-End Encryption

Consider implementing end-to-end encryption for a messaging application. The goal is that messages are encrypted on the sender's device and decrypted only on the recipient's device. The server never sees plaintext messages.

The protocol uses the Signal Protocol, which combines X25519 key agreement, AES-256-CBC encryption (with HMAC-SHA256 for authentication), and a double ratchet for forward secrecy.

**Key Generation:** Each user generates a long-term identity key pair (Ed25519 for signing, X25519 for key agreement). The public keys are registered with the server. Each user also generates a signed pre-key (X25591, rotated periodically) and a set of one-time pre-keys (X25519, consumed during session establishment).

**Session Establishment:** When Alice wants to message Bob, she fetches Bob's identity key, signed pre-key, and a one-time pre-key from the server. She performs an X25519 key agreement between her ephemeral key and Bob's keys, deriving a shared secret. She encrypts the first message using this shared secret.

**Ratchet:** After the initial key agreement, each party advances a symmetric ratchet with each message. Each message uses a new encryption key derived from the ratchet state. This provides forward secrecy — if a key is compromised, only the messages encrypted with that key are exposed, not future or past messages.

**Key Verification:** Users can verify each other's identity keys out-of-band (comparing key fingerprints in person or via a trusted channel). This prevents man-in-the-middle attacks during session establishment.

The implementation challenges: managing the one-time pre-key inventory on the server, handling device synchronization (multiple devices per user), and providing a recovery mechanism for lost devices without breaking forward secrecy.

## Common Crypto Mistakes in Production

**Using MD5 or SHA1 for anything security-sensitive.** These algorithms are broken for collision resistance and too fast for password hashing. Use SHA-256 or SHA-3 for integrity checking, Argon2id or bcrypt for password hashing.

**Rolling your own crypto.** Custom encryption algorithms, custom key exchange protocols, and custom random number generators are almost always broken. Use established libraries (libsodium, OpenSSL, BoringSSL, Go's crypto) and established algorithms.

**ECB mode.** AES in ECB mode encrypts each block independently, preserving patterns in the plaintext. Use AES-GCM or ChaCha20-Poly1305 instead.

**Static IVs/nonces.** Reusing an IV or nonce with the same key completely breaks authentication in GCM and ChaCha20-Poly1305. Generate a unique nonce for each encryption operation. For GCM, use a 96-bit random nonce or a counter.

**Hardcoded keys.** Keys in source code are accessible to anyone with repository access. Use environment variables, secrets management, or HSMs.

**Encrypting then authenticating (or vice versa) incorrectly.** The safe approach is authenticated encryption: use AES-GCM or ChaCha20-Poly1305, which handle both encryption and authentication correctly. If you must use separate encryption and authentication, encrypt-then-MAC is the correct order.

**Timing side channels.** Comparing secrets using `==` in most languages is not constant-time — it returns false as soon as it finds a difference, leaking information about the secret through timing. Use constant-time comparison functions (`hmac.compare_digest()` in Python, `crypto.timingSafeEqual()` in Node.js).

## Assessment

**Lab 7.1 — Encryption Implementation (60 minutes)**
Implement a file encryption system that uses AES-256-GCM for encryption and Argon2id for key derivation from a password. The system must encrypt a file, generate a secure random nonce, derive the encryption key from a password using Argon2id, and produce an encrypted file that includes the nonce and salt. It must also decrypt the file, verifying the authentication tag. Test with known test vectors and verify that tampered ciphertext is rejected.

**Grading criteria:**
- Correct AES-256-GCM encryption and decryption (15 points)
- Correct Argon2id key derivation with appropriate parameters (10 points)
- Secure random nonce and salt generation (10 points)
- Proper handling of authentication tag verification (10 points)
- Rejection of tampered ciphertext (5 points)

**Lab 7.2 — TLS Configuration Analysis (45 minutes)**
Analyze the TLS configuration of three provided web servers (configurations provided as text files). For each server, identify the TLS versions supported, cipher suites enabled, certificate details, and any security issues. Recommend specific configuration changes to harden each server.

**Grading criteria:**
- Correct identification of TLS versions and cipher suites (10 points per server, 30 total)
- Identification of security issues (5 points per server, 15 total)
- Specific, implementable hardening recommendations (5 points per server, 15 total)

**Lab 7.3 — Key Management Design (45 minutes)**
Design a key management system for a multi-region payment processing application. The system must support key generation, storage, rotation, and destruction for encryption keys, signing keys, and API keys. The design must address key storage in three regions, key rotation without downtime, key destruction verification, and audit logging of all key operations. Produce a design document with architecture diagrams and implementation guidelines.

**Grading criteria:**
- Comprehensive key lifecycle management (15 points)
- Multi-region key storage architecture (10 points)
- Zero-downtime key rotation mechanism (10 points)
- Key destruction verification process (5 points)
- Audit logging design (5 points)
- Implementation guidelines with specific technology recommendations (5 points)

## Evidence

Cryptography is the foundation of data security. Without it, all other security controls protect data only while it resides within the controlled environment. The moment data leaves the perimeter — transmitted over a network, stored on a mobile device, shared with a third party — cryptography is the only protection.

The common mistakes in this module are not hypothetical. In 2023, a major retailer suffered a breach because their payment processing system used ECB mode for card number encryption, allowing attackers to identify duplicate card numbers from the ciphertext. A healthcare provider lost 50,000 patient records because API keys were hardcoded in source code that was inadvertently pushed to a public repository. A financial institution's TLS configuration allowed downgrade attacks because TLS 1.0 and 1.1 were still enabled alongside TLS 1.3.

The lesson is that cryptography is not a magic shield. It is a set of tools that must be used correctly. The algorithms are well-understood and secure. The implementations are well-tested and reliable. The failures occur in the application of these tools — using the wrong algorithm, managing keys incorrectly, or configuring TLS with legacy protocols and weak ciphers. Understanding what you actually need from cryptography, and using it correctly, is the core competency of security engineering.

## Summary

Cryptography is the set of tools that protects data beyond the perimeter. Symmetric encryption (AES-256-GCM, ChaCha20-Poly1305) provides confidentiality and integrity. Asymmetric encryption (Ed25519, X25519) solves the key distribution problem and provides digital signatures. The choice between algorithms depends on the use case and hardware capabilities.

Key management is the most critical aspect of cryptography. Keys must be generated using cryptographically secure random number generators, stored securely in secrets management systems or HSMs, rotated regularly, and destroyed securely when no longer needed. The security of every encryption operation depends on the security of the key management.

TLS 1.3 provides the foundation for secure network communication. Proper configuration — modern cipher suites, disabled legacy protocols, valid certificates — is essential for protecting data in transit. Common cryptographic mistakes (MD5, ECB mode, hardcoded keys, timing side channels) are preventable with knowledge and discipline.

The practical advice is simple: use established libraries, use established algorithms, manage keys correctly, and never implement cryptography from scratch. The failures in this module are all failures of application, not theory. Understanding the theory is necessary but not sufficient — you must apply it correctly in practice.