# Module 7: Exchange Security

Cryptocurrency exchanges are high-value targets. They hold customer funds in hot wallets (online, accessible for withdrawals) and cold wallets (offline, for long-term storage). The security of an exchange depends on the balance between availability (hot wallets for instant withdrawals) and security (cold wallets for maximum protection). When this balance is wrong, the result is catastrophic: Mt. Gox lost 850,000 BTC, QuadrigaCX lost 190 million CAD, and FTX lost billions in customer deposits. This module covers the architecture, security controls, and operational procedures that secure an exchange.

## Exchange Architecture

A cryptocurrency exchange consists of several interconnected systems:

1. **Trading engine:** Matches buy and sell orders. Must be fast (sub-millisecond latency) and correct (never overfills or underfills orders).

2. **Wallet system:** Manages deposits, withdrawals, and internal transfers. Must maintain accurate balances and prevent double-spending.

3. **User management:** Authentication, authorization, KYC/AML compliance.

4. **Market data:** Real-time price feeds, order books, trade history.

5. **Risk management:** Position limits, margin calculations, liquidation engines.

6. **Settlement:** Processes deposits from the blockchain and initiates withdrawals to user addresses.

The wallet system is the primary security concern. It holds actual assets and interacts directly with the blockchain.

## Hot/Cold Storage Architecture

### Hot Wallet

A hot wallet is an online wallet that can process withdrawals immediately. It holds a small fraction of total assets (typically 1-5% of total holdings) to satisfy daily withdrawal demand.

**Security properties:**
- Online and accessible → vulnerable to network attacks.
- Can process withdrawals instantly → high availability.
- Small balance → limited loss if compromised.

**Typical hot wallet setup:**
- A multi-sig wallet (3-of-5 or similar).
- Automated signing with hardware security modules (HSMs).
- Strict withdrawal limits per address per day.
- Real-time monitoring and anomaly detection.
- Automatic rebalancing to maintain target balance.

The hot wallet is the first line of defense. It must be fast enough to process withdrawals within minutes but secure enough to resist unauthorized access. The key tradeoff is availability versus security: a fully offline wallet is maximally secure but cannot process withdrawals, while a fully online wallet is maximally available but maximally vulnerable. The warm wallet approach bridges this gap for mid-tier withdrawal amounts.

### Cold Wallet

A cold wallet is an offline wallet that requires manual intervention to sign transactions. It holds the majority of assets (95-99% of total holdings).

**Security properties:**
- Offline → immune to network attacks.
- Manual signing → slow (hours to days).
- Large balance → maximum security.

**Typical cold wallet setup:**
- Air-gapped computer (never connected to the internet).
- Multi-sig with geographic distribution.
- Transaction signing in a secure facility.
- Dual-control procedures (two authorized individuals must be present).
- Video recording of all signing sessions.
- Tamper-evident bags for hardware wallet storage.

The cold wallet is the ultimate backstop. It should never be accessed under normal operations: only during large rebalancing events or when the hot and warm wallets need replenishment. The signing ceremony for cold wallet transactions should be treated with the same formality as a bank vault opening: scheduled in advance, witnessed by multiple parties, and fully documented.

### Warm Wallet

A warm wallet is a middle ground: partially online with automated signing but stricter controls than a hot wallet. It might hold 5-10% of assets and process withdrawals above the hot wallet limit.

**Security properties:**
- Semi-online → moderate availability and security.
- Automated signing with additional verification → faster than cold.
- Moderate balance → balanced risk.

### Withdrawal Flow

A typical withdrawal flow involves multiple security controls:

1. **User request:** User submits a withdrawal request with amount and destination address.
2. **Internal validation:** Check user balance, verify address format, check against withdrawal limits.
3. **AML screening:** Check the destination address against sanctions lists and known illicit addresses.
4. **Risk assessment:** Evaluate the withdrawal based on amount, frequency, destination, and user behavior.
5. **Hot wallet approval:** If the amount is within hot wallet limits, the withdrawal is processed automatically.
6. **Cold wallet approval:** If the amount exceeds hot wallet limits, the withdrawal requires manual approval from cold wallet signers.
7. **Blockchain confirmation:** The transaction is broadcast to the network and confirmed.
8. **User notification:** The user is notified when the withdrawal is confirmed.

### Withdrawal Limits

Withdrawal limits are a critical security control:

- **Daily limit:** Maximum amount a user can withdraw per day (e.g., 100 BTC).
- **Per-transaction limit:** Maximum amount per single withdrawal (e.g., 10 BTC).
- **Address whitelist:** Users can only withdraw to pre-approved addresses.
- **Cooldown period:** New withdrawal addresses require a waiting period (e.g., 48 hours) before withdrawals can be made to them.
- **Velocity checks:** Unusual withdrawal patterns (sudden increase in amount or frequency) trigger manual review.

## Custody Solutions

### Self-Custody

The exchange holds all keys internally. This gives the exchange full control but concentrates risk.

**Security measures:**
- HSMs for key storage and signing.
- Multi-sig with geographic distribution.
- Strict access controls and audit logging.
- Regular key rotation.

### Third-Party Custody

The exchange uses a third-party custodian (BitGo, Fireblocks, Copper) to hold assets. The custodian provides institutional-grade security, insurance, and compliance.

**Advantages:**
- Professional custody with insurance.
- Reduced operational burden.
- Compliance with regulatory requirements.

**Disadvantages:**
- Counterparty risk (custodian could fail).
- Withdrawal delays (custodian must approve).
- Cost (custody fees).

### MPC (Multi-Party Computation) Wallets

MPC wallets split a private key into multiple shares, where no single share can reconstruct the key. Signing requires collaboration between multiple parties without ever reconstructing the full key.

```solidity
// Simplified MPC concept (not actual MPC implementation)
// In reality, MPC uses cryptographic protocols, not smart contracts

contract MPCWallet {
    // Each signer has a share of the key
    // Signing requires M-of-N shares
    // The full key is never assembled
    
    mapping(address => bool) public signers;
    uint256 public requiredSigners;
    
    // In practice, this would use threshold cryptography
    // This is a simplified representation
}
```

MPC provides:
- **Key security:** No single point of failure.
- **Operational flexibility:** Signers can be added or removed without changing the address.
- **Geographic distribution:** Signers can be in different locations.

## Hot Wallet Security Controls

### Rate Limiting

```solidity
contract WithdrawalLimiter {
    mapping(address => uint256) public dailyWithdrawn;
    mapping(address => uint256) public lastWithdrawalDay;
    
    uint256 public constant DAILY_LIMIT = 100 ether;
    uint256 public constant TX_LIMIT = 10 ether;
    
    function withdraw(address to, uint256 amount) external {
        require(amount <= TX_LIMIT, "Exceeds per-tx limit");
        
        uint256 today = block.timestamp / 1 days;
        if (lastWithdrawalDay[msg.sender] < today) {
            dailyWithdrawn[msg.sender] = 0;
            lastWithdrawalDay[msg.sender] = today;
        }
        
        require(
            dailyWithdrawn[msg.sender] + amount <= DAILY_LIMIT,
            "Exceeds daily limit"
        );
        
        dailyWithdrawn[msg.sender] += amount;
        // Process withdrawal...
    }
}
```

### Address Whitelisting

Users can only withdraw to pre-approved addresses. Adding a new address requires:
1. The user submits the new address.
2. A cooldown period (24-48 hours).
3. Email/SMS confirmation.
4. The address is added to the whitelist.

```solidity
contract AddressWhitelist {
    mapping(address => mapping(address => bool)) public whitelisted;
    mapping(address => mapping(address => uint256)) public pendingAddresses;
    
    uint256 public constant COOLDOWN = 48 hours;
    
    function requestAddress(address addr) external {
        pendingAddresses[msg.sender][addr] = block.timestamp;
    }
    
    function confirmAddress(address addr) external {
        require(
            pendingAddresses[msg.sender][addr] > 0 &&
            block.timestamp >= pendingAddresses[msg.sender][addr] + COOLDOWN,
            "Cooldown not met"
        );
        
        whitelisted[msg.sender][addr] = true;
        delete pendingAddresses[msg.sender][addr];
    }
    
    function withdraw(address to, uint256 amount) external {
        require(whitelisted[msg.sender][to], "Address not whitelisted");
        // Process withdrawal...
    }
}
```

### Withdrawal Queue

For high-value withdrawals, the exchange may use a queue system:

1. User submits withdrawal request.
2. Request enters the queue.
3. An automated system checks risk parameters.
4. If approved, the withdrawal is processed.
5. If flagged, the withdrawal is held for manual review.

```solidity
contract WithdrawalQueue {
    enum Status { Pending, Approved, Processing, Completed, Rejected }
    
    struct Withdrawal {
        address user;
        address token;
        uint256 amount;
        Status status;
        uint256 timestamp;
    }
    
    mapping(uint256 => Withdrawal) public withdrawals;
    uint256 public queueLength;
    
    function requestWithdrawal(address token, uint256 amount) external returns (uint256) {
        uint256 id = queueLength++;
        withdrawals[id] = Withdrawal({
            user: msg.sender,
            token: token,
            amount: amount,
            status: Status.Pending,
            timestamp: block.timestamp
        });
        emit WithdrawalRequested(id, msg.sender, token, amount);
        return id;
    }
    
    function approveWithdrawal(uint256 id) external onlyRiskEngine {
        require(withdrawals[id].status == Status.Pending);
        withdrawals[id].status = Status.Approved;
        emit WithdrawalApproved(id);
    }
    
    function processWithdrawal(uint256 id) external onlyWallet {
        require(withdrawals[id].status == Status.Approved);
        Withdrawal storage w = withdrawals[id];
        w.status = Status.Processing;
        
        // Execute the actual blockchain transfer
        IERC20(w.token).transfer(w.user, w.amount);
        
        w.status = Status.Completed;
        emit WithdrawalCompleted(id, w.user, w.token, w.amount);
    }
    
    function rejectWithdrawal(uint256 id, string calldata reason) external onlyRiskEngine {
        require(withdrawals[id].status == Status.Pending);
        withdrawals[id].status = Status.Rejected;
        emit WithdrawalRejected(id, reason);
    }
}
```

The queue system provides several benefits:
- **Audit trail:** Every withdrawal request is logged with a timestamp and status.
- **Risk assessment:** The risk engine can evaluate each request independently.
- **Batch processing:** Multiple withdrawals can be batched into a single blockchain transaction, reducing gas costs.
- **Rate limiting:** The queue can enforce daily withdrawal limits across all users.

### Hot Wallet Rebalancing

The hot wallet must be periodically rebalanced to maintain the target allocation. This involves moving funds between hot, warm, and cold wallets:

```solidity
contract WalletRebalancer {
    uint256 public hotWalletTarget = 100 ether;
    uint256 public warmWalletTarget = 400 ether;
    
    function rebalance() external onlyOperator {
        uint256 hotBalance = hotWallet.balance();
        uint256 warmBalance = warmWallet.balance();
        
        // If hot wallet is over target, move excess to warm
        if (hotBalance > hotWalletTarget * 110 / 100) {
            uint256 excess = hotBalance - hotWalletTarget;
            hotWallet.withdrawTo(warmWallet, excess);
        }
        
        // If warm wallet is over target, move excess to cold
        if (warmBalance > warmWalletTarget * 110 / 100) {
            uint256 excess = warmBalance - warmWalletTarget;
            warmWallet.withdrawTo(coldWallet, excess);
        }
        
        // If hot wallet is under target, pull from warm
        if (hotBalance < hotWalletTarget * 90 / 100) {
            uint256 needed = hotWalletTarget - hotBalance;
            warmWallet.withdrawTo(hotWallet, needed);
        }
    }
}
```

Rebalancing should be automated and triggered by threshold conditions, not by human operators. This reduces the risk of insider manipulation during the rebalancing process.

### Monitoring and Alerting

Real-time monitoring is critical for detecting attacks:

- **Balance monitoring:** Track hot wallet balance. Alert if it drops below threshold.
- **Transaction monitoring:** Track all deposits and withdrawals. Alert on unusual patterns.
- **User behavior monitoring:** Track withdrawal patterns per user. Alert on anomalies.
- **Blockchain monitoring:** Monitor the mempool for suspicious transactions targeting the exchange.
- **Access monitoring:** Track all access to signing systems. Alert on unauthorized access.

```solidity
// Simplified monitoring contract
contract ExchangeMonitor {
    uint256 public hotWalletBalance;
    uint256 public hotWalletThreshold = 100 ether;
    uint256 public maxSingleWithdrawal = 10 ether;
    
    event HotWalletLow(uint256 balance, uint256 threshold);
    event LargeWithdrawal(address indexed user, uint256 amount);
    event UnusualPattern(address indexed user, uint256 count, uint256 period);
    
    function checkHotWallet() external {
        if (hotWalletBalance < hotWalletThreshold) {
            emit HotWalletLow(hotWalletBalance, hotWalletThreshold);
        }
    }
    
    function checkWithdrawal(address user, uint256 amount) external {
        if (amount > maxSingleWithdrawal) {
            emit LargeWithdrawal(user, amount);
        }
    }
}
```

## Internal Controls and Access Management

### Role-Based Access Control

Exchanges must implement strict role-based access control (RBAC) across all systems:

1. **Trading engine access:** Developers can read logs and metrics but cannot modify trading logic in production without a multi-party code review and deployment approval process.
2. **Wallet system access:** Only designated operators can initiate withdrawals from hot wallets. Each operator has a unique key and their actions are logged and audited.
3. **Admin access:** System administrators can modify configurations but cannot access funds. Administrative actions require multi-factor authentication and are logged.
4. **Audit access:** Security team members have read-only access to all systems for monitoring and incident response.

### Separation of Duties

No single individual should have the ability to:

1. Create a withdrawal request AND approve it.
2. Modify the code AND deploy it.
3. Manage user accounts AND access wallet systems.
4. Set withdrawal limits AND override them.

This separation prevents insider threats and reduces the impact of compromised credentials.

### Insider Threat Mitigation

Insider threats are among the most dangerous risks for an exchange. Mitigations include:

1. **Background checks:** All employees with access to sensitive systems undergo thorough background checks.
2. **Least privilege:** Employees only have access to the systems they need for their specific role.
3. **Monitoring:** All access to sensitive systems is logged and monitored. Anomalous behavior triggers alerts.
4. **Key ceremony:** When generating new wallet keys, multiple employees must participate in a ceremony with physical presence, video recording, and independent verification.
5. **Time-locked changes:** Critical configuration changes (like withdrawal limits or access controls) require a 48-hour timelock, during which the change can be reviewed and cancelled.

### Audit Trail

Every action on the exchange must be logged with:

1. **Timestamp:** When the action occurred.
2. **Actor:** Who performed the action.
3. **Action:** What was done.
4. **Target:** Which system or account was affected.
5. **Result:** Whether the action succeeded or failed.

Logs must be stored in an immutable, append-only system (like a blockchain or a write-once storage medium). This prevents an attacker from covering their tracks by modifying logs.

## Insurance

Exchanges may carry insurance to cover losses from security incidents:

- **Hot wallet insurance:** Covers losses from hot wallet compromise.
- **Cold wallet insurance:** Covers losses from physical theft, employee theft, or other cold storage incidents.
- **Crime insurance:** Covers losses from employee fraud, social engineering, or other criminal activity.
- ** Custodial insurance:** Covers losses from third-party custodian failures.

Insurance does not replace security controls. It is a last resort. The premium is proportional to the exchange's security posture: better security means lower premiums. Major exchanges typically carry $100M+ in insurance coverage, with premiums ranging from 1-5% of coverage annually.

Insurance claims require detailed forensic analysis and documentation. Exchanges must maintain comprehensive records of security controls, access logs, and transaction history to support potential claims.

## Proof of Reserves

Proof of reserves (PoR) is a mechanism by which exchanges demonstrate that they hold sufficient assets to cover all customer deposits. This is critical for preventing fractional reserve practices, where an exchange lends out or invests customer funds without disclosure.

### How Proof of Reserves Works

1. **Merkle tree of balances:** The exchange creates a Merkle tree where each leaf is a user's balance (hashed with a unique identifier for privacy).
2. **On-chain verification:** The exchange publishes the on-chain addresses holding the reserve assets.
3. **Merkle proof:** Each user can verify that their balance is included in the Merkle tree.
4. **Independent audit:** A third-party auditor verifies that the total on-chain assets equal or exceed the total customer liabilities.

### Cryptographic Proof

```solidity
// Simplified proof of reserves
contract ProofOfReserves {
    bytes32 public merkleRoot;
    uint256 public totalReserves;
    
    event RootUpdated(bytes32 newRoot, uint256 reserves);
    
    function updateRoot(bytes32 newRoot, uint256 reserves) external {
        require(msg.sender == admin);
        merkleRoot = newRoot;
        totalReserves = reserves;
        emit RootUpdated(newRoot, reserves);
    }
    
    function verifyBalance(
        address user,
        uint256 balance,
        bytes32[] calldata proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(user, balance));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
}
```

### Limitations

Proof of reserves has several limitations:

1. **Liability verification:** PoR proves the exchange has assets, but does not prove it has disclosed all liabilities. An exchange could hide liabilities to make its reserves appear larger.
2. **Timing:** PoR is a snapshot in time. The exchange could borrow assets just for the audit and return them afterward.
3. **Cross-chain assets:** Exchanges holding assets across multiple chains must aggregate them, which complicates verification.
4. **Off-chain assets:** Assets held in traditional bank accounts or invested in other products cannot be verified on-chain.

## Real Scenario: Securing an Exchange

An exchange holds 10,000 BTC and 100,000 ETH across hot, warm, and cold wallets.

### Distribution

- **Hot wallet:** 100 BTC + 1,000 ETH (1% of holdings). Multi-sig 2-of-3, automated signing.
- **Warm wallet:** 400 BTC + 4,000 ETH (4% of holdings). Multi-sig 3-of-5, automated with additional verification.
- **Cold wallet:** 9,500 BTC + 95,000 ETH (95% of holdings). Multi-sig 4-of-7, manual signing.

### Hot Wallet Procedures

1. **Daily limit:** 50 BTC or 500 ETH per user per day.
2. **Per-transaction limit:** 10 BTC or 100 ETH.
3. **Address whitelist:** Required for all withdrawals.
4. **Cooldown:** 24 hours for new addresses.
5. **Monitoring:** Real-time alerts for balance drops, large withdrawals, and unusual patterns.

### Cold Wallet Procedures

1. **Signing location:** Secure facility with biometric access control.
2. **Dual control:** Two authorized signers must be present.
3. **Transaction verification:** Transaction details are verified against the withdrawal request.
4. **Hardware signing:** All signing done on air-gapped hardware wallets.
5. **Record keeping:** All signing sessions are logged and audited.

### Incident Response

If the hot wallet is compromised:

1. **Immediate freeze:** Disable all hot wallet withdrawals.
2. **Assessment:** Determine the scope of the compromise.
3. **Recovery:** Move remaining funds to cold wallet.
4. **Re-keying:** Generate new keys for all wallets.
5. **Communication:** Notify affected users and regulators.
6. **Forensic analysis:** Determine the root cause.

### Regulatory Compliance

Depending on jurisdiction, the exchange must comply with:

- **AML/KYC:** Verify user identity and screen for sanctions. This requires collecting government-issued ID, proof of address, and sometimes source-of-funds documentation. The exchange must also file Suspicious Activity Reports (SARs) for transactions that meet certain thresholds or patterns.
- **Reserve requirements:** Maintain sufficient reserves to cover all customer deposits. Some jurisdictions require proof of reserves through regular audits. The reserves must be held in secure, auditable accounts.
- **Reporting:** Report suspicious transactions to financial authorities. This includes large transactions, transactions involving sanctioned addresses, and transactions that match known money laundering patterns.
- **Auditing:** Regular third-party audits of reserves and security controls. Auditors verify that the exchange holds sufficient assets, that security controls are functioning, and that operational procedures are followed.
- **Data protection:** Comply with data protection regulations (GDPR, CCPA) for user data. This includes secure storage, access controls, and the right to deletion.
- **Licensing:** Obtain and maintain appropriate licenses for operating a cryptocurrency exchange. Requirements vary by jurisdiction but typically include minimum capital requirements, security standards, and compliance personnel.

The regulatory landscape for cryptocurrency exchanges is rapidly evolving. Exchanges must stay current with regulatory changes and adapt their compliance programs accordingly. Non-compliance can result in fines, license revocation, or criminal prosecution.

## Assessment

### Lab 1: Hot Wallet Security Configuration (90 minutes)

**Objective:** Configure and test hot wallet security controls.

**Tasks:**

1. Deploy a hot wallet contract with the following controls:
   - Multi-sig 2-of-3 for withdrawals.
   - Daily withdrawal limit of 100 ETH per user.
   - Per-transaction limit of 10 ETH.
   - Address whitelist with 24-hour cooldown.
   - Emergency pause functionality.

2. Write tests that verify:
   - Normal withdrawals within limits succeed.
   - Withdrawals exceeding daily limits fail.
   - Withdrawals to non-whitelisted addresses fail.
   - Withdrawals during cooldown fail.
   - Emergency pause stops all withdrawals.
   - Unpausing resumes withdrawals.

3. Write a monitoring script that:
   - Tracks hot wallet balance.
   - Logs all withdrawal requests.
   - Alerts on balance below threshold.
   - Alerts on unusual withdrawal patterns.

4. Measure the gas cost of each security control.

5. Write a 500-word analysis of the tradeoffs between security and usability for each control.

**Grading criteria:**
- All security controls implemented correctly (30%)
- Tests verify all security scenarios (25%)
- Monitoring script is functional (20%)
- Gas analysis is accurate (10%)
- Analysis is insightful and well-justified (15%)

### Lab 2: Cold Wallet Procedure Design (60 minutes)

**Objective:** Design cold wallet procedures for a specific exchange scenario.

**Tasks:**

1. You are given the following scenario:
   - Exchange holds 50,000 ETH and 5,000 BTC.
   - 5 authorized signers, located in 3 different countries.
   - Maximum cold wallet balance: 99% of total holdings.
   - Regulatory requirement: 24-hour withdrawal processing.

2. Design the cold wallet configuration:
   - Multi-sig threshold.
   - Key distribution strategy.
   - Signing procedures.
   - Backup and recovery plan.

3. Create a cold wallet signing workflow diagram.
4. Write the standard operating procedures (SOP) for:
   - Daily operations.
   - Emergency withdrawal.
   - Key compromise recovery.
   - Signer onboarding/offboarding.

5. Write a 1,000-word analysis of the security properties of your design.

**Grading criteria:**
- Cold wallet configuration is appropriate for the scenario (25%)
- Workflow diagram is clear and complete (20%)
- SOPs are comprehensive and actionable (30%)
- Security analysis is thorough (20%)
- Documentation quality (5%)

### Lab 3: Incident Response Exercise (90 minutes)

**Objective:** Respond to a simulated exchange security incident.

**Tasks:**

1. You are given the following scenario:
   - At 3:00 AM, the monitoring system alerts that the hot wallet balance dropped by 500 ETH in 10 minutes.
   - 50 withdrawals were processed in the last hour, all to new addresses.
   - The withdrawal limits were not exceeded (each withdrawal was under the per-transaction limit).
   - The signers report that they did not authorize these transactions.

2. Write an incident response plan including:
   - Immediate actions (first 15 minutes).
   - Assessment phase (first hour).
   - Containment measures.
   - Recovery procedures.
   - Communication plan (users, regulators, law enforcement).
   - Post-incident review.

3. Create a timeline of actions with specific responsibilities.
4. Write a forensic analysis checklist for investigating the breach.
5. Write a 500-word root cause analysis template.

**Grading criteria:**
- Incident response plan is comprehensive and realistic (30%)
- Timeline is clear and actionable (20%)
- Forensic checklist is thorough (20%)
- Communication plan addresses all stakeholders (15%)
- Root cause analysis template is useful (15%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Hot wallet security configuration** from Lab 1, with tests and monitoring.
2. **Cold wallet procedures** from Lab 2, with workflow diagrams and SOPs.
3. **Incident response plan** from Lab 3, with timeline and forensic checklist.
4. **Exchange security architecture diagram** showing hot, warm, and cold wallet flows.
5. **Regulatory compliance checklist** for cryptocurrency exchanges, covering AML/KYC, reserves, reporting, and auditing.

These artifacts demonstrate that you can design, implement, and operate exchange security systems, covering both technical controls and operational procedures.
