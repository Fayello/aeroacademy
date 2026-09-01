# Module 6: Wallet Security

A wallet is the primary interface between a user and the blockchain. It holds the private keys that control all assets on the account. Lose the private key, lose the funds permanently. Have the private key stolen, and the attacker controls everything. Unlike a bank account, there is no customer service to call, no chargeback to request, no password to reset. This module covers key management, hardware wallets, multi-signature schemes, social recovery, and the practical patterns for securing large treasury holdings.

## Key Management

Every Ethereum account is controlled by a private key. The private key is a 256-bit random number (32 bytes). From this single number, you derive:

1. **Public key:** Using the secp256k1 elliptic curve. The public key is 64 bytes (uncompressed) or 33 bytes (compressed).
2. **Address:** The last 20 bytes of the Keccak-256 hash of the public key.

The relationship is one-way: you can derive the public key from the private key, and the address from the public key, but you cannot reverse the process.

### Key Generation

A private key must be generated with sufficient randomness. The entropy source is critical:

```javascript
// GOOD: Using cryptographically secure random number generator
const privateKey = ethers.utils.randomBytes(32);

// BAD: Using Math.random(): predictable, never use for key generation
const privateKey = Buffer.from(
  Math.random().toString(36).substring(2).padEnd(64, '0'),
  'hex'
);
```

If the randomness source is predictable, an attacker can predict the private key. In 2019, a vulnerability in the Android SecureRandom implementation led to the theft of funds from wallets that used the flawed random number generator.

### Mnemonic Phrases (BIP-39)

Instead of storing the raw private key, most wallets use a mnemonic phrase (BIP-39): a human-readable sequence of 12 or 24 words that encodes the entropy:

```
witch collapse practice feed reprovision sawthuffle shutter sled unconcern mysterious
```

These 24 words encode 256 bits of entropy, which is used to derive a hierarchical deterministic (HD) wallet (BIP-32). From this single seed, you can derive an unlimited number of key pairs, organized in a tree structure:

```
m/44'/60'/0'/0/0 : First ETH address
m/44'/60'/0'/0/1 : Second ETH address
m/44'/60'/0'/0/2 : Third ETH address
```

This means you only need to back up the 24 words, and you can restore all your accounts on any compatible wallet software.

**Critical security points:**

1. The mnemonic phrase IS the private key. Anyone with the phrase has full control of all derived accounts. Never type it into a website, never store it digitally, never photograph it.

2. The derivation path (m/44'/60'/0'/0/) determines which addresses are generated. Different wallet software may use different derivation paths. Verify the derivation path before restoring a wallet.

3. The order of words matters. A single word out of order produces a completely different set of keys.

### Seed Phrase Storage

The mnemonic phrase must be stored securely. Common approaches:

1. **Metal stamping:** Stamp the words onto a metal plate (steel, titanium) that is resistant to fire, water, and physical damage. Commercial products like Cryptosteel or Billfodl provide standardized solutions.

2. **Paper backup:** Write the words on paper and store in a secure location (safe deposit box, fireproof safe). Paper is vulnerable to fire, water, and degradation over time.

3. **Shamir's Secret Sharing (SSS):** Split the seed into N shares, where K shares are required to reconstruct the seed. For example, split into 5 shares with a threshold of 3. Store each share in a different location. If one or two shares are compromised, the seed remains secure.

4. **Multi-location storage:** Store copies in different physical locations (home, office, safe deposit box, trusted family member). This protects against single-location disasters.

5. **Never store digitally:** Do not save the mnemonic in a password manager, cloud storage, email, phone notes, or any digital medium. Digital storage is vulnerable to hacking, malware, and unauthorized access.

### Key Derivation Functions (BIP-32/44)

HD wallets use a hierarchical structure:

```
Master Seed
├── m/44'/60'/0'/0  (Account 0)
│   ├── 0x1234...  (Address 0)
│   ├── 0x5678...  (Address 1)
│   └── 0x9abc...  (Address 2)
├── m/44'/60'/1'/0  (Account 1)
│   ├── 0xdef0...  (Address 0)
│   └── 0x1111...  (Address 1)
```

Each level of the hierarchy is derived using HMAC-SHA512. The hardened derivation (indicated by the ' suffix) prevents a compromised child key from revealing the parent key. Always use hardened derivation at the account level (m/44'/60'/0').

### Key Security Properties

The secp256k1 elliptic curve used by Ethereum has specific security properties that are worth understanding:

1. **One-way function:** You can compute a public key from a private key, but not vice versa. The discrete logarithm problem on elliptic curves is computationally infeasible to solve with current technology.

2. **256-bit security:** The private key space is 2^256, which is approximately 10^77. For comparison, the number of atoms in the observable universe is approximately 10^80. Brute-forcing a private key is practically impossible.

3. **Random distribution:** Each possible private key is equally likely. There are no "weak" keys in the mathematical sense. However, human-generated keys (choosing numbers that feel random) are predictably biased and should never be used.

4. **Collision resistance:** The probability of two different private keys generating the same address is approximately 1/2^160, which is negligible.

The practical risk is not mathematical weakness but operational compromise: malware, phishing, social engineering, or physical theft. Your security posture should focus on protecting the key from these threats rather than worrying about cryptographic attacks.

### Seed Phrase Security Deep Dive

The BIP-39 standard uses a specific process to convert entropy into a mnemonic phrase:

1. Generate N bits of entropy (128 bits for 12 words, 256 bits for 24 words).
2. Compute the SHA-256 hash of the entropy.
3. Append the first N/32 bits of the hash to the entropy (this is the checksum).
4. Split the resulting N + N/32 bits into groups of 11 bits.
5. Map each 11-bit group to a word from the BIP-39 wordlist (2048 words).

The checksum ensures that any error in the mnemonic (a misspelled word, a missing word) is detected with probability 1/16 per word. This is why 24-word mnemonics are more secure than 12-word mnemonics: they have 256 bits of entropy versus 128 bits, making brute-force attacks exponentially harder.

Common mistakes that compromise seed phrase security:

1. **Taking a photo of the seed phrase:** Phone cameras upload to cloud services. A compromised phone exposes the seed.
2. **Storing in a password manager:** Password managers are online services that can be compromised. If the manager is breached, all stored seed phrases are exposed.
3. **Emailing the seed phrase:** Email is not end-to-end encrypted by default. A compromised email account exposes all seed phrases sent via email.
4. **Using a weak passphrase:** BIP-39 supports an optional passphrase that adds an extra layer of security. Without a passphrase, anyone with the 24 words has full access. With a passphrase, the attacker also needs the passphrase.

## Hardware Wallets

Hardware wallets store private keys on a dedicated, tamper-resistant device. The private key never leaves the device: all signing operations happen on the hardware. Even if the connected computer is compromised, the private key remains secure.

### How Hardware Wallets Work

1. The user connects the hardware wallet to a computer via USB or Bluetooth.
2. The wallet software (e.g., Ledger Live, MetaMask with Ledger) constructs the transaction.
3. The transaction is sent to the hardware wallet for review.
4. The user verifies the transaction details on the hardware wallet's screen.
5. The user presses a physical button on the device to approve the signing.
6. The hardware wallet signs the transaction with the private key stored on the device.
7. The signed transaction is sent back to the computer and broadcast to the network.

At no point does the private key leave the hardware device. Even if the computer is infected with malware, the attacker cannot extract the key.

### Hardware Wallet Security Model

Hardware wallets have specific security properties:

1. **Tamper resistance:** The device is designed to resist physical attacks. Opening the case or probing the芯片triggers key erasure.

2. **Secure element:** Many hardware wallets use a secure element (SE) chip: the same type used in credit cards and passports. The SE provides hardware-level protection against side-channel attacks.

3. **Firmware verification:** The hardware wallet verifies its own firmware on boot. If the firmware is modified, the device refuses to operate.

4. **PIN protection:** The device requires a PIN to unlock. After a configurable number of failed attempts, the device wipes itself.

5. **Recovery phrase:** If the device is lost or destroyed, the recovery phrase (mnemonic) can restore the keys on a new device.

### Popular Hardware Wallets

- **Ledger Nano S/X:** Uses a secure element (SE). Supports 5,500+ coins. Bluetooth on the Nano X. Firmware is open source but the secure element firmware is closed source.

- **Trezor Model One/Model T:** Fully open source (hardware and firmware). No secure element: relies on a general-purpose microcontroller. Supports fewer coins than Ledger but provides full transparency.

- **GridPlus Lattice1:** Designed for institutional use. Supports multiple key storage methods and has a large touchscreen. Integrates with MetaMask.

- **Keystone:** Air-gapped (no USB/Bluetooth). Uses QR codes for communication. Fully open source.

### Hardware Wallet Threats

1. **Supply chain attacks:** An attacker intercepts the hardware wallet during shipping, extracts the seed during initial setup, and repackages the device. The user receives a compromised wallet. **Mitigation:** Buy directly from the manufacturer. Verify the device has not been tampered with (tamper-evident packaging). Initialize the wallet yourself: never use a pre-configured device. Some manufacturers (like Ledger) include a "sealed" sticker that shows evidence of tampering.

2. **Firmware attacks:** A compromised firmware update could exfiltrate the seed. **Mitigation:** Only install firmware from official sources. Verify firmware signatures. Use open-source hardware wallets where you can verify the code. Keep firmware updated: updates often include security patches.

3. **Physical attacks:** An attacker with physical access to the device can attempt side-channel attacks (power analysis, electromagnetic analysis) to extract the key. **Mitigation:** Use a hardware wallet with a secure element. Enable PIN protection. Set a high PIN length. Never leave the device unattended.

4. **Social engineering:** An attacker tricks the user into entering their seed phrase on a malicious website or device. **Mitigation:** Never enter your seed phrase into any software, website, or device other than the original hardware wallet during recovery. No legitimate service will ever ask for your seed phrase. Hardware wallets display the seed phrase on their own screen during initial setup: never trust a seed phrase displayed on a computer or phone screen.

5. **Clipboard hijacking:** Malware replaces Ethereum addresses in the clipboard with the attacker's address. When the user pastes the address, they send funds to the attacker. **Mitigation:** Always verify the address on the hardware wallet's screen before confirming the transaction. The hardware wallet shows the full address, not a truncated version.

## Multi-Signature Wallets

A multi-signature (multi-sig) wallet requires M-of-N signatures to authorize a transaction. For example, a 2-of-3 multi-sig requires any 2 of the 3 key holders to sign.

### Why Multi-Sig Matters

Single-signature wallets have a single point of failure. If the key is lost, stolen, or compromised, all funds are at risk. Multi-sig eliminates this risk by distributing control.

Use cases:
- **Treasury management:** A DAO treasury controlled by 5-of-9 multi-sig, where the 9 signers are elected council members.
- **Personal security:** A 2-of-3 multi-sig where the user holds 2 keys and a trusted party holds the backup key.
- **Exchange cold storage:** A 4-of-7 multi-sig where the exchange holds 4 keys and a third-party custodian holds 3.

### Gnosis Safe (Safe)

Gnosis Safe (now rebranded as Safe) is the most widely used multi-sig wallet on Ethereum. It is a smart contract wallet that supports:

- M-of-N signature schemes.
- Transaction proposals and approvals.
- DeFi integrations (swap, bridge, delegate).
- Modules for extensions (recovery, spending limits).
- ERC-4337 account abstraction support.

```solidity
// Simplified Safe transaction execution
contract Safe {
    mapping(bytes32 => uint256) public signedMessages;
    
    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) public returns (bool) {
        bytes32 txHash = keccak256(abi.encodePacked(
            address(this),
            to,
            value,
            data,
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            block.chainid
        ));
        
        require(checkSignatures(txHash, signatures), "Invalid signatures");
        
        // Execute the transaction
        (bool success, ) = to.call{value: value}(data);
        require(success, "Transaction failed");
        
        return true;
    }
}
```

### Multi-Sig Configuration Best Practices

1. **Threshold selection:** Use the minimum number of signers necessary for security, but not so many that operations become impractical. For a treasury, 3-of-5 or 5-of-9 are common.

2. **Key distribution:** Store each signer key in a different physical location, controlled by a different person. Never store multiple keys in the same location.

3. **Key rotation:** Periodically rotate keys (change the set of signers). This limits the window of exposure if a key is compromised without the owner's knowledge.

4. **Timelock:** Add a timelock to multi-sig transactions. A 24-48 hour delay allows the community to detect and block malicious transactions before they execute.

5. **Emergency recovery:** Define a recovery process for lost or compromised keys. This might involve a higher threshold (e.g., 5-of-7 for normal operations, 7-of-9 for recovery).

## Social Recovery

Social recovery allows a user to regain access to their wallet by having a quorum of trusted contacts ("guardians") approve the recovery. This is an alternative to seed phrases, which are difficult to secure for non-technical users.

### How Social Recovery Works

1. The user designates N guardians (typically 3-5 friends, family members, or institutions).
2. Each guardian holds a unique key or approval code.
3. If the user loses access to their wallet, they can request recovery.
4. When M-of N guardians approve the recovery, the wallet's owner is changed to the user's new address.

```solidity
// Simplified social recovery wallet
contract SocialRecoveryWallet {
    address public owner;
    mapping(address => bool) public guardians;
    uint256 public guardianCount;
    uint256 public constant RECOVERY_THRESHOLD = 3;
    
    mapping(bytes32 => uint256) public recoveryApprovals;
    
    constructor(address[] memory _guardians) {
        owner = msg.sender;
        for (uint i = 0; i < _guardians.length; i++) {
            guardians[_guardians[i]] = true;
            guardianCount++;
        }
    }
    
    function initiateRecovery(address newOwner) external {
        require(msg.sender == owner, "Not owner");
        bytes32 recoveryId = keccak256(abi.encodePacked(newOwner, block.timestamp));
        recoveryApprovals[recoveryId] = 1; // Owner's approval
    }
    
    function approveRecovery(bytes32 recoveryId) external {
        require(guardians[msg.sender], "Not guardian");
        recoveryApprovals[recoveryId]++;
        
        if (recoveryApprovals[recoveryId] >= RECOVERY_THRESHOLD) {
            // Extract new owner from recovery ID
            // In practice, this would be more carefully implemented
            owner = address(uint160(uint256(recoveryId)));
        }
    }
}
```

### Argent Wallet

Argent is a smart contract wallet that implements social recovery. Users designate "guardians" (other Argent wallets or hardware wallets). If the user loses their phone, the guardians can transfer ownership to a new device. The recovery process takes 36 hours, during which the user can cancel if the recovery was initiated by an attacker.

### Social Recovery Threats

1. **Guardian collusion:** If enough guardians collude, they can steal the wallet. Mitigation: choose guardians who do not know each other (reducing the chance of collusion). Use a higher threshold (3-of-5 is better than 2-of-3). Select guardians from different social circles, geographic locations, and professional backgrounds.

2. **Guardian compromise:** If an attacker compromises enough guardians, they can initiate a recovery. Mitigation: store guardian keys securely. Use hardware wallets for guardians. Monitor for recovery requests. Educate guardians about phishing and social engineering attacks.

3. **Social engineering:** An attacker tricks guardians into approving a recovery. Mitigation: establish a verification process for recovery requests. Use a timelock to allow cancellation. Require guardians to verify the request through a secondary channel (phone call, in-person meeting).

4. **Guardian unavailability:** If guardians are unreachable (lost phone, moved, deceased), recovery may fail. Mitigation: maintain more guardians than the threshold (5 guardians with a threshold of 3 provides 2 backups). Designate backup guardians who can step in if primary guardians are unavailable.

5. **Recovery request spoofing:** An attacker creates a fake recovery request that looks legitimate. Mitigation: use unique identifiers for each recovery request. Require guardians to verify the request ID matches the one initiated by the owner. Implement a verification step where the owner confirms the recovery request through a secondary channel.

## Real Scenario: Securing a Treasury

A DAO treasury holds 50,000 ETH (approximately 100 million USD at current prices). The treasury must be secured against:

- Private key theft.
- Insider threats (malicious signers).
- Operational failures (lost keys, unavailable signers).
- Governance attacks (malicious proposals).

### Design

**Multi-sig configuration:** 4-of-7 Gnosis Safe.

**Signer selection:**
1. DAO core team member 1 (hardware wallet, secure location).
2. DAO core team member 2 (hardware wallet, different secure location).
3. DAO core team member 3 (hardware wallet, third secure location).
4. DAO council member 1 (hardware wallet, office safe).
5. DAO council member 2 (hardware wallet, home safe).
6. Third-party custodian (institutional custody solution).
7. DAO community-elected representative (hardware wallet, verified identity).

**Security measures:**

1. **Timelock:** All transactions require a 48-hour timelock. During this period, the community can review and object.

2. **Spending limits:** Transactions under 10 ETH do not require timelock. Transactions between 10-100 ETH require 2 signers. Transactions over 100 ETH require 4 signers and timelock.

3. **Whitelist:** Only pre-approved addresses can receive funds. Adding a new address to the whitelist requires 4 signers and a 7-day timelock.

4. **Monitoring:** Real-time alerts for all transactions. Anomaly detection for unusual patterns (large transfers, new addresses, multiple transactions in rapid succession).

5. **Key backup:** Each signer's key is backed up using Shamir's Secret Sharing (3-of-5), stored in different geographic locations.

6. **Recovery plan:** If a signer's key is compromised:
   - Immediately remove the compromised key from the multi-sig.
   - Add a replacement key.
   - Review recent transactions for unauthorized activity.
   - Notify the community.

### Operational Procedures

1. **Quarterly key review:** Verify all signers still have access to their keys. Rotate any keys that may have been compromised.

2. **Annual disaster recovery drill:** Simulate a key compromise and execute the recovery process.

3. **Transaction review protocol:** Before signing any transaction, verify:
   - The recipient address is correct.
   - The amount is within the expected range.
   - The transaction matches a discussed or voted-upon proposal.

4. **Signer onboarding/offboarding:** When a signer leaves the DAO, remove their key and add a replacement within 24 hours.

## Assessment

### Lab 1: Key Management Exercise (60 minutes)

**Objective:** Demonstrate proper key management practices.

**Tasks:**

1. Generate a BIP-39 mnemonic phrase using a hardware wallet or a verified tool (like Ian Coleman's BIP-39 tool, run offline).
2. Derive the first 3 Ethereum addresses using the BIP-44 derivation path (m/44'/60'/0'/0/).
3. Verify that the addresses match across different wallet software (MetaMask, Ledger Live, Trezor).
4. Import the mnemonic into MetaMask and verify the same addresses appear.
5. Export the public key (not the private key) from one of the addresses.
6. Write a 500-word guide explaining the importance of secure key storage, including at least 3 real-world examples of key management failures.

**Grading criteria:**
- Correct mnemonic generation (20%)
- Correct address derivation (25%)
- Cross-wallet verification (20%)
- Guide quality and real-world examples (25%)
- Security awareness (10%)

### Lab 2: Multi-Sig Setup (90 minutes)

**Objective:** Configure and test a multi-signature wallet.

**Tasks:**

1. Deploy a Gnosis Safe on a local Hardhat network with a 2-of-3 multi-sig configuration.
2. Create 3 test accounts with different Ethereum addresses.
3. Execute the following scenarios:
   - **Normal transaction:** 2 signers approve a 1 ETH transfer. Verify it succeeds.
   - **Insufficient signatures:** 1 signer attempts a transfer. Verify it fails.
   - **All signers:** All 3 signers approve a transfer. Verify it succeeds.
   - **Different signers:** Use different combinations of 2 signers for different transactions. Verify all combinations work.
4. Add a fourth signer to the safe. Verify that 3-of-4 is now required.
5. Remove a signer. Verify that the old signer can no longer approve transactions.
6. Write a 300-word analysis of the security properties of the multi-sig configuration.

**Grading criteria:**
- Multi-sig deployed correctly (20%)
- All scenarios execute as expected (30%)
- Signer management (add/remove) works correctly (20%)
- Analysis is accurate and insightful (20%)
- Code quality and documentation (10%)

### Lab 3: Security Assessment (60 minutes)

**Objective:** Assess the security of a given wallet configuration.

**Tasks:**

1. You are given the following wallet setup for a DAO treasury:
   - 3-of-5 multi-sig.
   - All 5 signers use the same hardware wallet model.
   - All 5 signers store their backup seed phrases in the same office safe.
   - No timelock on transactions.
   - No spending limits.

2. Identify at least 6 security issues with this configuration.
3. For each issue:
   - Explain the risk.
   - Describe a realistic attack scenario.
   - Recommend a mitigation.
4. Design a secure alternative configuration, justifying each decision.
5. Write a 1,000-word security assessment report.

**Grading criteria:**
- All 6 issues correctly identified (30%)
- Realistic attack scenarios (25%)
- Effective mitigations (25%)
- Alternative configuration is well-designed (15%)
- Report quality (5%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Key management guide** from Lab 1, with real-world examples of failures.
2. **Multi-sig configuration** from Lab 2, with deployment details and security analysis.
3. **Security assessment report** from Lab 3, identifying vulnerabilities and proposing mitigations.
4. **Wallet security checklist** for personal and institutional use, covering key generation, storage, recovery, and operational procedures.
5. **Incident response plan** for a compromised wallet, including detection, containment, recovery, and post-mortem.

These artifacts demonstrate that you can design, implement, and assess wallet security configurations for both individual and institutional use cases.
