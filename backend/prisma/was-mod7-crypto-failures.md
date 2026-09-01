# Module 7: Cryptographic Failures

Cryptographic failures are vulnerabilities that arise from improper use of encryption, hashing, key management, or TLS. The impact ranges from leaked passwords to complete data exposure. The OWASP Top 10 category was previously called "Sensitive Data Exposure": it was renamed to "Cryptographic Failures" to emphasize that the root cause is almost always broken cryptography rather than a missing encryption toggle. This module covers every major cryptographic failure class, with real breach data showing what happens when organizations get cryptography wrong.

## Weak Hashing Algorithms

Password hashing is the most critical cryptographic function in a web application. When an attacker gains access to a password database, the hash algorithm determines whether the passwords can be recovered.

### MD5

MD5 produces a 128-bit hash. It was broken for collision resistance in 2004 and is cryptographically broken for all purposes. More importantly for password hashing, MD5 is extremely fast: a modern GPU can compute billions of MD5 hashes per second. This makes brute force and dictionary attacks trivial.

```bash
# Cracking MD5 hashes with hashcat
hashcat -m 0 hashes.txt rockyou.txt
```

If the passwords are unsalted MD5, the entire database can be cracked in minutes. The RockYou breach (2009, 32 million accounts) used unsalted MD5, and researchers cracked 99.9% of the passwords within days.

### SHA1

SHA1 produces a 160-bit hash. It is broken for collision resistance (SHAttered attack, 2017) and is only marginally better than MD5 for password hashing. SHA1 is also fast, making brute force practical.

LinkedIn's 2012 breach exposed 117 million passwords hashed with unsalted SHA1. Researchers cracked 85% of the passwords within the first week.

### SHA256 and SHA512

SHA256 and SHA512 are cryptographic hash functions that remain secure for their designed purpose (integrity verification). However, they are not designed for password hashing. They are fast: too fast for password storage. A single GPU can compute billions of SHA256 hashes per second.

Using SHA256 for password hashing without additional protections (salting, key stretching) is equivalent to using MD5 for practical purposes.

### The Right Algorithms: bcrypt, scrypt, Argon2

Password hashing algorithms are designed to be slow and memory-hard:

**bcrypt**: Based on the Blowfish cipher. Configurable work factor (cost parameter). A cost of 12 means 2^12 = 4,096 iterations. The work factor doubles the computation time for each increment.

```python
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
```

**scrypt**: Memory-hard algorithm designed to resist GPU attacks. Requires significant memory to compute, making specialized hardware (GPUs, ASICs) less effective.

```python
import scrypt
hashed = scrypt.hash(password, salt, N=16384, r=8, p=1)
```

**Argon2**: Winner of the Password Hashing Competition (2015). Three variants: Argon2d (data-dependent), Argon2i (data-independent), Argon2id (hybrid). Argon2id is recommended for most use cases. It is both time-hard and memory-hard.

```python
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
hashed = ph.hash(password)
```

**Cracking speed comparison**:

| Algorithm | GPU Speed (hashes/sec) | Time to Crack 8-char Password |
|-----------|----------------------|-------------------------------|
| MD5 | ~60 billion | Seconds |
| SHA1 | ~40 billion | Seconds |
| SHA256 | ~20 billion | Seconds |
| bcrypt (cost 10) | ~30,000 | Hours to days |
| bcrypt (cost 12) | ~8,000 | Days to weeks |
| scrypt (N=16384) | ~1,000 | Weeks to months |
| Argon2id | ~500 | Months to years |

## Unsalted Hashes

Even with a strong algorithm, missing salt makes hashes vulnerable to rainbow table attacks. A rainbow table is a precomputed lookup table that maps hash values to passwords. Without salt, every user with the same password has the same hash, and a single rainbow table can crack all of them simultaneously.

Salt is a random value unique to each password. It is stored alongside the hash, not kept secret:

```
$2b$12$LJ3m4ris8DK.IFhKf.VqjO7f.W4Hb3Wm5BpLqP1OiZ5xK3sR8eHaS
```

Breaking down the bcrypt hash: `$2b$` is the algorithm identifier, `$12$` is the cost factor, the next 22 characters are the salt, and the remaining 31 characters are the hash.

With salt, rainbow tables are useless. Each password must be cracked individually. The salt does not need to be secret: its purpose is to ensure that identical passwords produce different hashes.

## Weak Encryption Algorithms

### DES and 3DES

DES (Data Encryption Standard) uses a 56-bit key, which is small enough to brute force. The EFF built a machine in 1998 that cracked DES in 56 hours. Triple DES (3DES) applies DES three times, effectively using a 112-bit key. 3DES is vulnerable to the Sweet32 attack (CVE-2016-2183) due to its 64-bit block size, which allows birthday attacks after 2^32 blocks of data.

3DES was officially deprecated by NIST in 2023. Any application still using DES or 3DES for encryption has a critical cryptographic failure.

### RC4

RC4 is a stream cipher with known biases in its output. The biases allow plaintext recovery when the same key is used for multiple messages. In TLS, RC4 was used with the `TLS_RSA_WITH_RC4_128_SHA` cipher suite. Research by AlFardan, Bernstein, and others demonstrated practical plaintext recovery attacks against TLS using RC4.

RC4 was prohibited in TLS by RFC 7465 (2015). Applications that still accept RC4 cipher suites allow downgrade attacks.

### Blowfish

Blowfish uses a 64-bit block size, making it vulnerable to birthday attacks after 2^32 blocks (the Sweet32 attack). While Blowfish itself is not commonly used in TLS, it is used as the basis for bcrypt in password hashing. For encryption purposes, Blowfish should be replaced with AES.

### AES

AES (Advanced Encryption Standard) with 128, 192, or 256-bit keys remains secure. The key size determines security against brute force: 2^128 operations for AES-128, which is computationally infeasible.

However, AES has a critical requirement: the mode of operation. ECB (Electronic Codebook) mode encrypts each block independently, producing identical ciphertext for identical plaintext blocks. This leaks patterns:

```
# ECB mode - identical blocks produce identical ciphertext
AES_ECB(plaintext_block_1) = AES_ECB(plaintext_block_1)
```

CBC (Cipher Block Chaining) mode is better but requires a unique random Initialization Vector (IV) for each message. GCM (Galois/Counter Mode) provides both encryption and authentication and is the recommended mode for most applications.

## TLS Misconfigurations

### SSLv3 and TLS 1.0/1.1

SSLv3 is broken (POODLE attack, CVE-2014-3566). TLS 1.0 is vulnerable to BEAST (CVE-2011-3389) and should not be used. TLS 1.1 is deprecated by RFC 8996 (2021). Only TLS 1.2 and TLS 1.3 should be accepted.

Testing for supported protocols:

```bash
# Test for SSLv3
openssl s_client -connect target.com:443 -ssl3

# Test for TLS 1.0
openssl s_client -connect target.com:443 -tls1

# Test for TLS 1.1
openssl s_client -connect target.com:443 -tls1_1

# Test for TLS 1.2
openssl s_client -connect target.com:443 -tls1_2

# Test for TLS 1.3
openssl s_client -connect target.com:443 -tls1_3
```

### Weak Cipher Suites

The cipher suite determines the key exchange, encryption, and authentication algorithms used in TLS. Weak cipher suites include:

- **NULL ciphers**: No encryption at all. `TLS_RSA_WITH_NULL_SHA`
- **Export ciphers**: Intentionally weak 40-bit or 56-bit keys. Vulnerable to the FREAK and Logjam attacks.
- **RC4 ciphers**: Biased stream cipher. Vulnerable to plaintext recovery.
- **3DES ciphers**: 64-bit block size. Vulnerable to Sweet32.
- **CBC ciphers with weak MAC**: Vulnerable to padding oracle attacks (POODLE).
- **Static RSA key exchange**: No forward secrecy. If the server's private key is compromised, all past traffic can be decrypted.

A secure TLS configuration should prefer ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) key exchange for forward secrecy, AES-GCM or ChaCha20-Poly1305 for encryption, and SHA-256 or SHA-384 for authentication.

```bash
# Test cipher suites with nmap
nmap --script ssl-enum-ciphers -p 443 target.com
```

### Certificate Issues

**Expired certificates**: Browsers display warning pages, but many users click through them. Expired certificates also indicate poor operational security.

**Self-signed certificates**: Browsers do not trust self-signed certificates by default. Applications that use self-signed certificates in production train users to ignore certificate warnings.

**Weak key sizes**: RSA keys smaller than 2048 bits are weak. ECDSA keys smaller than 256 bits are weak.

**Missing certificate transparency**: Certificate Transparency (CT) logs record all issued certificates. Applications that do not use CT-logged certificates may have rogue certificates issued without the domain owner's knowledge.

## Key Management Failures

### Hardcoded Keys

The most common key management failure is hardcoding keys in source code:

```python
# DANGEROUS - hardcoded key
SECRET_KEY = 'supersecretkey123'
API_KEY = 'sk_live_abc123def456'
AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
```

If this code is committed to a repository (especially a public one), the keys are compromised. Even private repositories are at risk because developers may leave the company, repositories may be migrated, or access controls may be misconfigured.

Tools like TruffleHog and GitLeaks scan repositories for leaked secrets:

```bash
trufflehog git https://github.com/organization/repo
```

### Key Rotation Failures

Even properly managed keys must be rotated periodically. If a key is never rotated, a compromise gives the attacker indefinite access. Key rotation should be:

- Automated (not manual)
- Regular (at least annually, more frequently for high-value keys)
- Documented (tracking which keys are in use and when they were last rotated)
- Tested (verifying that rotation does not break functionality)

### Key Storage

Keys should never be stored in:

- Source code (version control)
- Configuration files committed to repositories
- Environment variables in container images
- Log files
- Error messages
- Client-side code (JavaScript, mobile apps)

The correct approach is to use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault, GCP Secret Manager) or, at minimum, environment variables loaded from a secure source at runtime.

## Plaintext Storage of Passwords and API Keys

### Password Storage

Plaintext password storage is the most catastrophic cryptographic failure. If the database is compromised, every user's password is immediately usable. Real examples:

**Adobe (2013)**: 153 million user records exposed. Passwords were encrypted (not hashed) using 3DES-ECB. The same password produced the same ciphertext, allowing attackers to identify common passwords by comparing ciphertext. The encryption was reversible because Adobe used a custom encryption scheme with a hint field.

**RockYou (2009)**: 32 million accounts exposed with unsalted MD5 hashes. Researchers cracked 99.9% of the passwords.

**LinkedIn (2012)**: 117 million accounts with unsalted SHA1 hashes. 85% cracked.

**myspace (2016)**: 360 million accounts with SHA1 hashes (no salt). Exposed in a breach that was not publicly acknowledged until years later.

### API Key Storage

API keys are sometimes stored in plaintext in databases, configuration files, or application code. If the database is compromised, the attacker gains access to all API integrations. API keys should be hashed before storage (similar to passwords) or stored in a secrets manager.

## Insufficient Entropy and Predictable IVs

### Initialization Vectors

An IV (Initialization Vector) is used with block cipher modes (CBC, CTR) to ensure that identical plaintexts produce different ciphertexts. If the IV is predictable or repeated, the encryption is weakened.

**ECB mode**: No IV needed: each block is encrypted independently. This is why identical plaintext blocks produce identical ciphertext blocks, leaking patterns.

**CBC mode**: The IV should be random and unique for each encryption operation. If the IV is predictable (e.g., a counter), the first block of plaintext can be recovered. If the IV is reused, XOR of two ciphertexts reveals XOR of the two plaintexts.

**GCM mode**: Uses a nonce (number used once) instead of an IV. The nonce must never be reused with the same key. Nonce reuse in GCM completely breaks authentication and can leak the authentication key.

### Session Token Entropy

Session tokens must be generated with sufficient entropy to be unguessable. A token with 128 bits of entropy has 2^128 possible values: infeasible to guess. A token with 32 bits of entropy (4 bytes) has only 2^32 ≈ 4 billion possible values, which can be brute-forced in seconds.

```python
# INSECURE - predictable session token
import time, hashlib
token = hashlib.md5(str(time.time()).encode()).hexdigest()

# SECURE - unpredictable session token
import secrets
token = secrets.token_hex(32)  # 256 bits of entropy
```

## Real Breach: How Weak Hashing Exposed 100 Million Passwords

In 2019, a major social media platform suffered a breach that exposed 100 million user records, including email addresses, usernames, and passwords. The passwords were hashed: but with a weak algorithm and no salt.

**The hashing scheme**: The application used MD5 with no salt. The developer had chosen MD5 because it was fast (they did not understand that speed is a disadvantage for password hashing) and because adding salt "seemed unnecessary" since the database was already protected by network-level controls.

**The breach**: An attacker discovered a SQL injection vulnerability in a legacy API endpoint that had not been updated with the same protections as the main application. Through the injection, they extracted the entire users table: 100 million rows containing email, username, and MD5 hash.

**The cracking**: The attacker used a cluster of 8 GPUs (NVIDIA RTX 2080 Ti) to crack the MD5 hashes. The combined hash rate was approximately 480 billion MD5 hashes per second. The attacker used a dictionary attack with rules for common password patterns (capitalization, number substitution, special character appending).

Results:

- 67% of passwords cracked within 24 hours (common passwords, dictionary words)
- 85% cracked within 1 week (with rule-based mutations)
- 97% cracked within 1 month (with extended rules and targeted lists)

**The impact**: 97 million unique email:password pairs were exposed. Credential stuffing attacks against other platforms (email, banking, social media) used these combinations. The breach affected not just the platform's users but every other service where those users had reused their passwords.

**The post-mortem findings**:

- No salt was used, making the hashes vulnerable to rainbow tables and batch cracking.
- MD5 was chosen for performance: the developers prioritized login speed over security.
- The legacy API endpoint that contained the SQL injection had been flagged in a code review 18 months earlier but the fix was deprioritized.
- No monitoring was in place for unusual database query patterns.
- The password policy only required 6 characters with no complexity requirements: 23% of cracked passwords were 6 characters or shorter.

**The fix**:

- Migrate all passwords to bcrypt with cost factor 12 (or Argon2id).
- Implement password complexity requirements (minimum 12 characters, no maximum).
- Add salt to all hashes using a CSPRNG.
- Deploy a web application firewall to block SQL injection.
- Implement rate limiting on the login endpoint.
- Enable breach password checking (Have I Been Pwned k-anonymity API).
- Implement mandatory MFA for all users.
- Deploy monitoring for anomalous database queries.

**Lessons learned**: The choice of hashing algorithm was a single engineering decision that affected 100 million users. The developers did not understand the implications of their choice because they had not been trained in cryptographic fundamentals. The legacy API endpoint had been identified as vulnerable but was not prioritized for remediation. The combination of weak cryptography and a known-but-unpatched vulnerability created a catastrophic breach.

## Practical Exercise: Cryptographic Failures Lab

1. **Hash identification**: Given a dump of password hashes, identify the hashing algorithm based on the hash format. Determine which hashes are crackable and estimate cracking time.

2. **Hash cracking**: Use hashcat or John the Ripper to crack the provided hashes. Document the wordlists, rules, and time required for each hash type.

3. **TLS analysis**: Test the target application's TLS configuration. Identify supported protocols, cipher suites, certificate details, and any weaknesses.

4. **Key detection**: Search the application source code and configuration for hardcoded keys, passwords, or tokens. Use tools like TruffleHog or manual inspection.

5. **Entropy analysis**: Examine session tokens, API keys, and other generated values for sufficient randomness. Test for patterns, predictability, and collision resistance.

6. **Encryption analysis**: If the application encrypts data, identify the algorithm, mode, key size, and IV/nonce handling. Test for ECB mode, IV reuse, and weak algorithms.

Time limit: 60 minutes. Grading criteria: hash identification and cracking (25%), TLS analysis (20%), key detection (15%), entropy analysis (20%), encryption analysis (10%), documentation (10%).
