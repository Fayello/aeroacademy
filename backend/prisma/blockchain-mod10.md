# Module 10 — Incident Response

When a smart contract is exploited, the clock starts ticking immediately. Every second of delay means more funds at risk, more attackers potentially copying the exploit, and more damage to user trust. Incident response in blockchain is fundamentally different from traditional cybersecurity — there is no way to revoke access, reset passwords, or restore from backup. The blockchain is immutable, and every action is permanent. This module covers the unique challenges of blockchain incident response, including upgradeable contracts, emergency mechanisms, the mechanics of responding to an exploit, and real case studies of incidents handled well and poorly.

## Why Blockchain Incident Response Is Different

In traditional systems, incident response follows a predictable pattern: detect, contain, eradicate, recover, and improve. The tools are familiar — revoke credentials, take servers offline, restore from backups, patch vulnerabilities.

In blockchain, several constraints change the game:

1. **Immutability:** Once a transaction is confirmed, it cannot be reversed. If an attacker drains funds, those funds are gone unless the attacker returns them or the community hard-forks the chain.

2. **Transparency:** All actions are public. An attacker can monitor the mempool for your response actions and front-run them.

3. **Composability:** Other protocols may be integrated with the compromised contract. Pausing or upgrading the contract may break dependencies.

4. **Time pressure:** Blocks are produced every 12 seconds on Ethereum. Each block is another opportunity for the attacker to extract value.

5. **No central authority:** There is no "admin" who can override the blockchain. The contract executes exactly as written.

These constraints mean that prevention is far more effective than response. But when prevention fails, a well-rehearsed response plan can limit the damage.

## Upgradeable Contracts

Upgradeable contracts allow the logic to be changed after deployment. This is a powerful tool for incident response — you can patch a vulnerability without migrating all state.

### Proxy Pattern

The proxy pattern separates the contract's address (and state) from its logic:

```solidity
// Proxy contract - holds state and delegates calls to implementation
contract Proxy {
    address public implementation;
    address public admin;
    
    constructor(address _implementation) {
        implementation = _implementation;
        admin = msg.sender;
    }
    
    fallback() external payable {
        address impl = implementation;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    
    function upgrade(address newImplementation) external {
        require(msg.sender == admin, "Not admin");
        implementation = newImplementation;
    }
}
```

Users interact with the proxy address, which delegates all calls to the implementation contract. When a vulnerability is found, the admin can point the proxy to a new implementation with the fix.

### Transparent Proxy Pattern (OpenZeppelin)

The Transparent Proxy pattern prevents function selector clashing between the proxy and implementation:

```solidity
contract TransparentUpgradeableProxy is Proxy {
    function upgradeTo(address newImplementation) external {
        require(msg.sender == admin, "Not admin");
        implementation = newImplementation;
    }
    
    function upgradeToAndCall(address newImplementation, bytes calldata data) external {
        require(msg.sender == admin, "Not admin");
        implementation = newImplementation;
        if (data.length > 0) {
            (bool success, ) = newImplementation.delegatecall(data);
            require(success);
        }
    }
}
```

### UUPS (Universal Upgradeable Proxy Standard)

UUPS moves the upgrade logic into the implementation contract, reducing gas costs and making the proxy simpler:

```solidity
contract UUPSUpgradeable {
    address internal _implementation;
    
    function upgradeTo(address newImplementation) external {
        require(msg.sender == owner, "Not owner");
        _implementation = newImplementation;
    }
    
    function _authorizeUpgrade(address newImplementation) internal virtual {
        require(msg.sender == owner, "Not authorized");
    }
}
```

### Upgrade Security Considerations

1. **Storage layout:** The implementation contract's storage layout must be compatible with the proxy's storage. Changing the order of state variables or adding variables in the middle of the layout can corrupt state.

2. **Function selector clashes:** If the implementation has a function with the same selector as a proxy function, the proxy function takes precedence (in the transparent proxy pattern). This can cause unexpected behavior.

3. **Initializers:** Upgradeable contracts use initializers instead of constructors. The initializer can only be called once. If the initializer is not called during deployment, the contract is in an uninitialized state.

4. **Access control:** The upgrade function must be protected by robust access control. If an attacker can call `upgradeTo`, they can point the proxy to a malicious implementation and drain all funds.

```solidity
contract SecureProxy is Proxy {
    mapping(address => bool) public authorizedUpgraders;
    
    modifier onlyAuthorized() {
        require(authorizedUpgraders[msg.sender], "Not authorized");
        _;
    }
    
    function upgradeTo(address newImplementation) external onlyAuthorized {
        implementation = newImplementation;
    }
    
    function addAuthorizedUpgrader(address upgrader) external {
        require(msg.sender == admin, "Not admin");
        authorizedUpgrader[upgrader] = true;
    }
}
```

### Diamond Pattern (EIP-2535)

The Diamond pattern allows a single proxy to delegate to multiple implementation contracts:

```solidity
contract Diamond {
    // Function selector => implementation address
    mapping(bytes4 => address) public facetAddresses;
    
    fallback() external payable {
        address facet = facetAddresses[msg.sig];
        require(facet != address(0), "Function does not exist");
        
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    
    function facetForFunction(bytes4 selector) external view returns (address) {
        return facetAddresses[selector];
    }
}
```

Diamonds are useful for complex protocols that need many functions but want to keep individual facets small and manageable. They also allow partial upgrades — you can replace a single facet without affecting others.

## Emergency Mechanisms

### Circuit Breaker (Pausable)

A circuit breaker allows the contract to be paused during an emergency:

```solidity
abstract contract Pausable {
    bool public paused;
    address public pauser;
    
    event Paused(address account);
    event Unpaused(address account);
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier onlyPauser() {
        require(msg.sender == pauser, "Not pauser");
        _;
    }
    
    function pause() external onlyPauser {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyPauser {
        paused = false;
        emit Unpaused(msg.sender);
    }
}
```

**Usage:** When an exploit is detected, the pauser calls `pause()` to freeze all contract operations. This prevents further damage while the team investigates and develops a fix.

**Risks:** A compromised pauser can grief the protocol by pausing it permanently. The pauser should be a multi-sig or a governance-controlled address.

### Guardian Pattern

The guardian pattern provides a trusted entity with emergency powers:

```solidity
contract Guardian {
    address public guardian;
    address public owner;
    
    modifier onlyGuardian() {
        require(msg.sender == guardian || msg.sender == owner);
        _;
    }
    
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyGuardian {
        // Withdraw funds to a safe address during emergency
        IERC20(token).transfer(to, amount);
    }
    
    function emergencyPause() external onlyGuardian {
        // Pause the contract
        paused = true;
    }
}
```

The guardian should be a multi-sig with a timelock for non-emergency actions. This prevents a single compromised key from exploiting the emergency mechanism.

### Rate Limiting

Rate limiting restricts how much can be withdrawn or transferred in a given time period:

```solidity
contract RateLimited {
    mapping(address => uint256) public lastActionTime;
    uint256 public constant RATE_LIMIT = 1 hours;
    
    function withdraw(uint256 amount) external {
        require(block.timestamp >= lastActionTime[msg.sender] + RATE_LIMIT);
        lastActionTime[msg.sender] = block.timestamp;
        // Process withdrawal...
    }
}
```

Rate limiting slows down an attacker, giving the team time to respond. It also limits the damage from any single transaction.

### Timelock

Timelock adds a mandatory delay between an action being proposed and executed:

```solidity
contract Timelock {
    uint256 public constant DELAY = 48 hours;
    mapping(bytes32 => uint256) public pendingActions;
    
    function schedule(bytes32 actionHash, address target, bytes calldata data) external {
        pendingActions[actionHash] = block.timestamp + DELAY;
        emit ActionScheduled(actionHash, target, data);
    }
    
    function execute(bytes32 actionHash, address target, bytes calldata data) external {
        require(pendingActions[actionHash] != 0, "Not scheduled");
        require(block.timestamp >= pendingActions[actionHash], "Delay not reached");
        
        delete pendingActions[actionHash];
        (bool success, ) = target.call(data);
        require(success);
    }
    
    function cancel(bytes32 actionHash) external {
        delete pendingActions[actionHash];
    }
}
```

The timelock gives the community time to review and potentially cancel malicious actions. It also gives the team time to respond to exploit attempts.

## Real Scenario: Responding to an Exploit

### Timeline

**00:00:00 — Exploit detected**

The monitoring system alerts: unusual outflow from the lending protocol. 500 ETH moved to an unknown address in the last block.

**00:00:30 — Initial assessment**

The security team confirms the alert. The exploit is ongoing — the attacker is draining funds through a vulnerability in the price oracle.

**00:01:00 — Containment**

The team calls `pause()` on the vulnerable contract. All deposits and withdrawals are frozen. The attacker cannot extract more funds.

**00:01:30 — Investigation**

The team analyzes the exploit:
- The attacker is manipulating the spot price oracle.
- They are borrowing against inflated collateral.
- The exploit is possible because the contract uses Uniswap's spot price.

**00:05:00 — Communication**

The team posts on Twitter and Discord:
- "We have detected unusual activity and paused the protocol."
- "No further funds are at risk."
- "We are investigating and will provide updates."

**00:15:00 — Root cause identified**

The team confirms the vulnerability: the price oracle uses spot price, which can be manipulated via flash loans.

**00:30:00 — Fix developed**

The team develops a patch:
- Replace spot price oracle with Chainlink TWAP oracle.
- Add a circuit breaker for price deviations >5%.
- Add rate limiting on borrows.

**01:00:00 — Fix deployed**

The team upgrades the proxy to a new implementation with the fix.

**01:05:00 — Unpause**

The team unpauses the contract. Users can resume operations.

**01:15:00 — Post-mortem published**

The team publishes a detailed post-mortem:
- Timeline of events.
- Root cause analysis.
- Impact assessment (total funds lost).
- Actions taken.
- Lessons learned.

**02:00:00 — Recovery**

The team contacts the attacker through an on-chain message:
- "We have identified you. We are willing to negotiate a bug bounty of 10% if you return the funds."
- "If the funds are not returned within 48 hours, we will involve law enforcement."

### Post-Mortem Template

```markdown
# Post-Mortem: [Protocol Name] Exploit — [Date]

## Summary
- **Vulnerability:** [Description]
- **Impact:** [Amount lost]
- **Duration:** [Time from exploit start to containment]
- **Status:** [Resolved / Under investigation]

## Timeline
- [Time] — [Event]
- [Time] — [Event]

## Root Cause
[Technical description of the vulnerability]

## Impact
- Total funds lost: [Amount]
- Number of affected users: [Number]
- Other protocols affected: [If any]

## Response
1. [Action taken]
2. [Action taken]

## Remediation
1. [Fix implemented]
2. [Preventive measure added]

## Lessons Learned
1. [Lesson]
2. [Lesson]

## Acknowledgments
- [Team members who responded]
- [External parties who assisted]
```

## White Hat Recovery

When an exploit is discovered, the protocol team often attempts to negotiate with the attacker. This is called "white hat recovery" — the attacker returns the funds in exchange for a bug bounty.

### On-Chain Communication

```solidity
// The team sends an on-chain message to the attacker
contract MessageBoard {
    mapping(address => string[]) public messages;
    
    function postMessage(address to, string calldata message) external {
        messages[to].push(message);
    }
}

// Message: "We have identified your address. We are willing to negotiate a bug bounty of 10% if you return the funds. Contact us at security@protocol.com"
```

On-chain messaging is the most reliable way to reach an attacker because:
1. The attacker is monitoring the blockchain (they must, to manage the stolen funds).
2. The message is public and cannot be censored.
3. The message creates a permanent record of the negotiation attempt.

### White Hat Bounty Programs

Many protocols maintain standing bounty programs:

- **Immunefi:** The largest bug bounty platform for DeFi. Bounties range from $1,000 to $10 million depending on severity. Immunefi has facilitated over $80 million in bounty payouts.
- **Code4rena:** Competitive audit platform where auditors find vulnerabilities for bounties. Protocols post contests, and auditors compete to find the most and most severe issues.
- **Sherlock:** Audit contest platform with insurance coverage for identified vulnerabilities. Sherlock insures the protocols it audits, providing an additional layer of protection.

### Bug Bounty Economics

The economics of bug bounties are straightforward: paying a bounty is cheaper than losing funds to an exploit. A well-structured bounty program:

1. **Sets appropriate bounty amounts:** Critical vulnerabilities (full fund drainage) should offer bounties of 10% of at-risk funds, up to a maximum. This incentivizes white hat reporting over black hat exploitation.
2. **Defines clear scope:** Which contracts and functions are in scope. What constitutes a valid vulnerability.
3. **Provides response SLAs:** Acknowledge reports within 24 hours. Provide initial assessment within 72 hours. Pay bounties within 14 days of validation.
4. **Offers safe harbor:** Explicitly state that white hat researchers will not face legal action for good-faith vulnerability research.

### Legal Recovery

If negotiation fails, the protocol may pursue legal action:

1. **Blockchain forensics:** Companies like Chainalysis and Elliptic trace the flow of stolen funds through mixers, bridges, and exchanges.
2. **Law enforcement:** Report the theft to relevant authorities. The FBI, Europol, and national cybercrime units have increasingly sophisticated blockchain investigation capabilities.
3. **Exchange cooperation:** Work with centralized exchanges to freeze the attacker's funds if they attempt to cash out. Exchanges are legally required to comply with asset freeze orders in many jurisdictions.
4. **Civil litigation:** Sue the attacker for recovery of funds. In some jurisdictions, smart contract exploits are treated as theft or fraud, enabling civil recovery.

The success of legal recovery depends on:
- The jurisdiction of the protocol and the attacker.
- Whether the attacker's identity can be determined (through blockchain forensics, IP logs, or exchange KYC).
- Whether the stolen funds can be traced to identifiable accounts.
- The speed of the response — funds that pass through mixers or cross-chain bridges become much harder to trace.

### Recovery Success Rates

According to industry data, approximately 40-50% of stolen funds are recovered when the protocol responds quickly and offers a reasonable bounty. The recovery rate drops significantly if:
- The attacker is experienced and uses mixers immediately.
- The funds are moved across chain bridges.
- The protocol delays its response.
- The bounty offered is too low (less than 5% of stolen funds).

## Hard Fork Recovery

In extreme cases, the community may choose to hard-fork the blockchain to reverse the exploit. This happened once in Ethereum's history — The DAO hack in 2016.

### The DAO Precedent

The DAO was a decentralized venture capital fund on Ethereum. An attacker exploited a reentrancy vulnerability to drain 3.6 million ETH (approximately 50 million USD at the time).

The Ethereum community faced a choice:
1. Let the exploit stand (immutability).
2. Hard-fork to reverse the theft (intervention).

The community chose to hard-fork. The fork created a new chain where the attacker's transactions were reversed. Not all community members agreed — those who opposed the fork continued running the original chain, creating Ethereum Classic.

### When to Consider a Hard Fork

A hard fork should be considered only when:

1. The exploit affects a significant portion of the ecosystem (not just one protocol).
2. The stolen funds are in a contract that the community controls (not in the attacker's wallet).
3. There is broad consensus among the community, developers, and validators.
4. No other recovery mechanism is viable.

Hard forks are extremely disruptive and should be a last resort. They set a precedent that the blockchain's immutability can be overridden, which undermines trust in the entire system.

### Social Consensus Mechanisms

Before a hard fork, the community must achieve social consensus. This typically involves:

1. **Discussion period:** Open discussion on forums, Discord, and Twitter about the proposed fork.
2. **Developer sign-off:** Core developers must agree that the fork is technically sound and necessary.
3. **Validator signaling:** Validators must signal their intent to support the fork.
4. **Exchange coordination:** Major exchanges must agree to support the forked chain.
5. **User communication:** Clear communication to all users about the fork timeline and what they need to do.

The social consensus process is deliberately slow and deliberative. A rushed hard fork can split the community and create lasting damage to the protocol's credibility.

## Coordination with Other Protocols

When a vulnerability affects multiple protocols, incident response requires coordination:

### Cross-Protocol Communication

1. **Shared vulnerability databases:** Protocols share information about known vulnerabilities through industry groups and direct communication.
2. **Coordinated disclosure:** When a vulnerability affects multiple protocols, the discoverer coordinates disclosure to give all affected parties time to respond.
3. **Joint response:** Multiple protocols may need to respond simultaneously to prevent the attacker from exploiting one protocol while another is being fixed.

### Bridge Security

Cross-chain bridges are particularly vulnerable because they connect multiple chains:

1. **Single point of failure:** A bridge compromise on one chain affects all connected chains.
2. **Delayed response:** Coordinating response across multiple chains with different block times and governance structures is complex.
3. **Cascading failures:** A bridge exploit on one chain can trigger liquidations or failures on connected chains.

### DeFi Composability Risks

When protocols are composable (integrated), a vulnerability in one protocol can cascade:

1. **A affects B:** Protocol A is exploited, causing Protocol B (which uses A's token as collateral) to become undercollateralized.
2. **B affects C:** Protocol B's insolvency affects Protocol C (which lent to B).
3. **Systemic risk:** The cascade can affect the entire DeFi ecosystem if the protocols are sufficiently interconnected.

This is why incident response must consider the entire ecosystem, not just the affected protocol. Pausing one protocol may be necessary to prevent cascading failures in others.

## Building an Incident Response Team

### Team Composition

1. **Technical lead:** Coordinates the response, makes technical decisions.
2. **Smart contract engineer:** Analyzes the exploit and develops the fix.
3. **Security analyst:** Investigates the root cause and monitors the attacker's activity.
4. **Communications lead:** Manages external communications (users, media, regulators).
5. **Legal counsel:** Advises on legal options and regulatory obligations.
6. **Operations lead:** Manages internal coordination and resource allocation.

### Communication Protocols

1. **Internal:** Secure messaging (Signal, Keybase) for real-time coordination.
2. **External:** Twitter, Discord, and protocol website for user updates.
3. **Regulatory:** Direct communication with relevant regulatory bodies.
4. **Media:** Prepared statements and designated spokesperson.

### Runbook

Create a runbook for common incident types:

1. **Smart contract exploit:** Pause → investigate → fix → unpause → post-mortem.
2. **Key compromise:** Rotate keys → revoke access → investigate → notify users.
3. **Oracle manipulation:** Pause affected functions → switch oracle → unpause.
4. **Governance attack:** Activate emergency governance → cancel proposal → investigate.
5. **Bridge exploit:** Pause bridge → investigate → coordinate with other chain → recover.

## Assessment

### Lab 1: Incident Response Simulation (120 minutes)

**Objective:** Respond to a simulated smart contract exploit.

**Tasks:**

1. You are given the following scenario:
   - A lending protocol has been exploited.
   - The attacker drained 200 ETH through an oracle manipulation attack.
   - The protocol is upgradeable (transparent proxy).
   - The monitoring system alerted the team 2 minutes after the exploit started.

2. Execute the following response steps:
   - Pause the contract.
   - Analyze the exploit (review the contract code and the attacker's transactions).
   - Develop a fix (replace the spot price oracle with a TWAP oracle).
   - Deploy the fix via proxy upgrade.
   - Unpause the contract.
   - Write a post-mortem report.

3. Time each step and document the total response time.
4. Write a 500-word analysis of what went well and what could be improved.

**Grading criteria:**
- All response steps executed correctly (30%)
- Fix prevents the vulnerability (25%)
- Post-mortem is comprehensive (20%)
- Response time is documented (15%)
- Analysis is insightful (10%)

### Lab 2: Emergency Mechanism Design (90 minutes)

**Objective:** Design emergency mechanisms for a DeFi protocol.

**Tasks:**

1. You are given the following protocol:
   - DEX with liquidity pools.
   - Lending protocol with flash loans.
   - Governance with timelock.
   - Token with vesting schedules.

2. Design emergency mechanisms for each component:
   - DEX: Circuit breaker for unusual price movements.
   - Lending: Emergency pause for oracle failures.
   - Governance: Guardian veto for malicious proposals.
   - Token: Emergency pause for exploit in token contract.

3. For each mechanism, specify:
   - Who can activate it.
   - What it pauses/unpauses.
   - How it is deactivated.
   - What the risks are.

4. Write a comprehensive emergency response plan for each component.
5. Create a decision tree for determining which emergency mechanism to use.

**Grading criteria:**
- All components have appropriate emergency mechanisms (30%)
- Mechanisms are well-designed and secure (25%)
- Response plans are comprehensive (25%)
- Decision tree is clear and useful (20%)

### Lab 3: Post-Mortem Analysis (60 minutes)

**Objective:** Analyze real-world incident responses.

**Tasks:**

1. Choose 3 of the following incidents:
   - The DAO (2016)
   - Parity Multi-Sig Wallet (2017)
   - bZx Flash Loan Attack (2020)
   - Mango Markets (2022)
   - Euler Finance (2023)
   - Curve Finance (2023)

2. For each incident, write a post-mortem that includes:
   - Timeline (from detection to resolution).
   - Root cause analysis.
   - Impact assessment.
   - Response actions.
   - Recovery methods.
   - Lessons learned.

3. Compare the response quality across incidents:
   - Which incidents were handled best?
   - Which were handled worst?
   - What common patterns emerge?

4. Write a 500-word reflection on what these incidents teach about blockchain incident response.

**Grading criteria:**
- Post-mortems are accurate and comprehensive (40%)
- Comparison analysis is insightful (25%)
- Reflection is thoughtful and well-argued (25%)
- Sources are cited (10%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Incident response simulation** from Lab 1, with timeline, post-mortem, and analysis.
2. **Emergency mechanism design** from Lab 2, with specifications for each component.
3. **Post-mortem analyses** from Lab 3, covering 3 real-world incidents.
4. **Incident response runbook** for common blockchain incident types.
5. **Communication templates** for user notifications, regulatory reports, and media statements.

These artifacts demonstrate that you can plan for, respond to, and recover from blockchain security incidents, which is the final skill needed for comprehensive blockchain security competence.
