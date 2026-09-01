# Module 9: Governance Attacks

Decentralized governance is the mechanism by which communities make collective decisions about protocol upgrades, parameter changes, and treasury spending. Governance tokens give holders voting power proportional to their holdings. When governance is secure, it enables decentralized coordination. When governance is vulnerable, it becomes an attack vector: allowing a single actor to seize control of a protocol worth hundreds of millions of dollars. This module covers voting mechanisms, governance attack vectors, real exploits, and the defenses that protect decentralized governance.

## Governance Mechanisms

### Token-Weighted Voting

The simplest governance model: each governance token represents one vote. The more tokens you hold, the more influence you have. This model is used by most major DeFi protocols including Compound, Uniswap, and Aave.

```solidity
contract SimpleGovernance {
    IERC20 public governanceToken;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    struct Proposal {
        address target;
        bytes data;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    function propose(address target, bytes calldata data, uint256 votingPeriod) external {
        uint256 proposalId = proposalCount++;
        Proposal storage p = proposals[proposalId];
        p.target = target;
        p.data = data;
        p.deadline = block.timestamp + votingPeriod;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp <= p.deadline, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");
        
        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");
        
        p.hasVoted[msg.sender] = true;
        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }
    }
    
    function execute(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");
        require(p.votesFor > p.votesAgainst, "Proposal rejected");
        
        p.executed = true;
        (bool success, ) = p.target.call(p.data);
        require(success, "Execution failed");
    }
}
```

Token-weighted voting is simple and aligns incentives: those with the most tokens have the most at stake. However, it is plutocratic: a single wealthy holder can dominate governance. This is acceptable for some protocols but problematic for others that aim for broader participation.

### Quadratic Voting

Quadratic voting reduces the influence of wealthy voters. The cost of N votes is N² tokens, making additional votes increasingly expensive:

```solidity
function getVotes(uint256 tokens) public pure returns (uint256) {
    return sqrt(tokens);
}

function sqrt(uint256 x) internal pure returns (uint256 y) {
    y = x;
    uint256 z = (x + 1) / 2;
    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    }
}
```

With quadratic voting, a holder with 1,000 tokens gets ~31 votes. A holder with 1,000,000 tokens gets ~1,000 votes. The second holder has 1,000x more tokens but only ~32x more votes.

### Conviction Voting

Conviction voting weights votes by the length of time a voter has staked their tokens. The longer you stake, the more weight your vote carries:

```solidity
struct Stake {
    uint256 amount;
    uint256 startTime;
}

mapping(address => Stake) public stakes;

function getConviction(address voter) public view returns (uint256) {
    Stake memory s = stakes[voter];
    uint256 duration = block.timestamp - s.startTime;
    // Conviction increases logarithmically with time
    return s.amount * (1 + duration / 1 days);
}
```

Conviction voting makes governance attacks more expensive because the attacker must stake tokens for a long period to accumulate sufficient voting power.

### Time-Locked Governance

Most governance systems include a timelock between the vote passing and execution. This gives the community time to react to malicious proposals:

```solidity
contract TimelockGovernance {
    uint256 public constant TIMELOCK = 48 hours;
    mapping(uint256 => uint256) public proposalExecutionTime;
    
    function executeProposal(uint256 proposalId) external {
        require(
            block.timestamp >= proposalExecutionTime[proposalId] + TIMELOCK,
            "Timelock not reached"
        );
        // Execute...
    }
}
```

## Governance Attack Vectors

### Flash Loan Governance

The most devastating governance attack uses flash loans to temporarily acquire enough voting power to pass a malicious proposal:

1. Attacker identifies a governance proposal they want to pass (or creates one).
2. Attacker flash-borrows a massive amount of governance tokens.
3. Attacker votes with the borrowed tokens.
4. If the governance system allows immediate execution, the attacker executes the proposal before repaying the flash loan.
5. The attacker repays the flash loan (with fee) and keeps the profit from the malicious proposal.

**Example:** The attacker proposes to drain the treasury to their address. They flash-borrow enough tokens to pass the proposal, execute it immediately, and walk away with the treasury.

**Mitigation:** Require tokens to be staked for a minimum period before voting power is granted. Flash loans cannot satisfy time-lock requirements.

```solidity
mapping(address => uint256) public stakedTokens;
mapping(address => uint256) public stakeTimestamp;
uint256 public constant MIN_STAKE_PERIOD = 7 days;

function stake(uint256 amount) external {
    governanceToken.transferFrom(msg.sender, address(this), amount);
    stakedTokens[msg.sender] += amount;
    stakeTimestamp[msg.sender] = block.timestamp;
}

function getVotingPower(address voter) public view returns (uint256) {
    if (block.timestamp < stakeTimestamp[voter] + MIN_STAKE_PERIOD) {
        return 0; // Not yet eligible
    }
    return stakedTokens[voter];
}
```

### Vote Buying

An attacker can buy votes directly by offering token holders compensation for voting a certain way. This can be done on-chain through vote-buying markets or off-chain through agreements.

**On-chain vote buying:**

```solidity
contract VoteBuyer {
    mapping(uint256 => uint256) public bidPerVote; // proposalId => price per vote
    
    function placeBid(uint256 proposalId, uint256 pricePerVote) external {
        bidPerVote[proposalId] = pricePerVote;
    }
    
    function sellVote(uint256 proposalId, bool support) external {
        require(bidPerVote[proposalId] > 0);
        
        uint256 votes = governanceToken.balanceOf(msg.sender);
        require(votes > 0);
        
        // Transfer tokens as payment
        uint256 payment = votes * bidPerVote[proposalId];
        IERC20(paymentToken).transfer(msg.sender, payment);
        
        // Vote on behalf of the buyer
        governance.vote(proposalId, support);
    }
}
```

### Governance Takeover

An attacker gradually acquires governance tokens over time, building up voting power until they can pass proposals unilaterally. This is a slow attack that may not be detected until it is too late.

**Detection:** Monitor governance token concentration. If a single address accumulates more than 33% of voting power, it becomes a critical risk.

```solidity
function checkGovernanceRisk() external view returns (string memory) {
    uint256 totalSupply = governanceToken.totalSupply();
    uint256 maxBalance = 0;
    address largestHolder;
    
    // In practice, you would track all holders
    // This is a simplified check
    
    if (maxBalance > totalSupply / 3) {
        return "CRITICAL: Single holder has >33% of votes";
    } else if (maxBalance > totalSupply / 5) {
        return "WARNING: Single holder has >20% of votes";
    }
    return "OK";
}
```

### Proposal Spam

An attacker floods the governance system with frivolous proposals, overwhelming the community and making it difficult to identify legitimate proposals. This can also be used to exhaust gas (if proposals require gas to submit).

**Mitigation:** Require a minimum token stake to submit proposals. Implement a proposal deposit that is returned only if the proposal reaches quorum. Use a proposal sponsor system where existing delegates must endorse new proposals.

```solidity
uint256 public constant PROPOSAL_THRESHOLD = 100000e18; // 100k tokens
uint256 public constant PROPOSAL_DEPOSIT = 1000e18; // 1k tokens deposit

function propose(address target, bytes calldata data, uint256 votingPeriod) external {
    require(
        governanceToken.balanceOf(msg.sender) >= PROPOSAL_THRESHOLD,
        "Below proposal threshold"
    );
    
    // Take deposit
    governanceToken.transferFrom(msg.sender, address(this), PROPOSAL_DEPOSIT);
    
    // Create proposal
    proposals[proposalCount].target = target;
    proposals[proposalCount].data = data;
    proposals[proposalCount].deadline = block.timestamp + votingPeriod;
    proposals[proposalCount].proposer = msg.sender;
    proposalCount++;
}

function refundDeposit(uint256 proposalId) external {
    Proposal storage p = proposals[proposalId];
    require(block.timestamp > p.deadline, "Voting not ended");
    require(p.votesFor + p.votesAgainst >= governanceToken.totalSupply() * QUORUM_PERCENT / 100, "No quorum");
    
    // Refund deposit if quorum was reached
    governanceToken.transfer(p.proposer, PROPOSAL_DEPOSIT);
}
```

### Delegate Manipulation

In systems where token holders can delegate their voting power, an attacker can:

1. Create many wallets, each with a small amount of governance tokens.
2. Delegate all votes to a single address.
3. Use the accumulated voting power to pass proposals.

**Mitigation:** Monitor delegation patterns. Alert when a single delegate accumulates excessive power.

### Time-of-Check to Time-of-Use (TOCTOU) in Governance

A proposal may check conditions at submission time that change before execution:

```solidity
// Vulnerable: condition checked at submission, not execution
function propose(address target, bytes calldata data) external {
    require(treasury.balance() >= 1000 ether, "Insufficient treasury");
    // Treasury could be drained before execution...
}
```

The TOCTOU vulnerability is particularly dangerous in governance because there is often a significant time delay between proposal submission and execution. During this window, the conditions that made the proposal valid may change. An attacker could:

1. Submit a proposal that checks a condition (e.g., treasury balance).
2. Wait for the voting period to end.
3. Manipulate the condition before execution (e.g., drain the treasury).
4. Execute the proposal with manipulated conditions.

**Mitigation:** Check conditions at execution time, not submission time:

```solidity
function executeProposal(uint256 proposalId) external {
    Proposal storage p = proposals[proposalId];
    require(treasury.balance() >= 1000 ether, "Insufficient treasury"); // Check at execution
    // Execute...
}
```

Additionally, implement a "state root verification" that checks critical conditions immediately before execution and reverts if they have changed since the vote passed. This prevents TOCTOU attacks while still allowing legitimate state changes between proposal and execution.

### Governor Contracts

OpenZeppelin's Governor contract is the most widely used governance framework. It implements a complete governance system with proposal creation, voting, timelock, and execution:

```solidity
// Simplified Governor pattern
contract MyGovernor is Governor, GovernorVotes, GovernorTimelockControl {
    constructor(IVotes _token, TimelockController _timelock)
        Governor("MyGovernor")
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
    {}
    
    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block delay
    }
    
    function votingPeriod() public pure override returns (uint256) {
        return 45818; // ~1 week
    }
    
    function quorum(uint256 blockNumber) public view override returns (uint256) {
        return token.getPastVotes(blockNumber, address(0)) * 4 / 100; // 4% of total supply
    }
}
```

Governor contracts provide battle-tested governance infrastructure, but they still require careful configuration. The parameters: voting delay, voting period, quorum threshold, and timelock duration: must be calibrated for the specific protocol's needs.

## Real Scenarios

### Scenario 1: Flash Loan Governance Attack

A DAO has a governance token with 10 million total supply. The governance system requires a simple majority (50% + 1) to pass proposals. There is no timelock and no staking requirement.

The attacker:

1. Creates a proposal to transfer 1,000 ETH from the treasury to their address.
2. Flash-borrows 5,000,001 governance tokens from a DEX pool.
3. Votes "for" on the proposal.
4. Executes the proposal immediately after the voting period ends.
5. Repays the flash loan.

**Total cost:** Flash loan fee (~0.09% of 5M tokens).
**Total profit:** 1,000 ETH.

This attack has been demonstrated in practice. In 2022, Beanstalk Finance lost $182 million through a flash loan governance attack. The attacker acquired 79% of governance voting power through flash loans, passed a proposal to transfer treasury funds to their address, and repaid the flash loan: all in a single transaction.

### Scenario 2: Gradual Governance Takeover

An attacker wants to seize control of a protocol. They:

1. Begin buying governance tokens on the open market over 6 months.
2. Use multiple wallets to avoid detection.
3. Once they control 51% of voting power, they propose to:
   - Change the protocol fee structure to direct all fees to their address.
   - Replace the admin key with their own address.
   - Mint new tokens to their address.

**Detection:** The community notices unusual trading volume and price appreciation of the governance token. An on-chain analysis reveals that a cluster of wallets has been accumulating tokens.

The key challenge with gradual takeover is detection. Unlike flash loan attacks, which happen in a single transaction, gradual accumulation occurs over months. The community must actively monitor token concentration and be prepared to act if a single entity approaches critical mass.

### Scenario 3: Malicious Proposal with Delegated Votes

A protocol allows vote delegation. An attacker:

1. Identifies a legitimate proposal that the community supports.
2. Creates a similar-looking proposal with a hidden malicious payload.
3. Campaigns for the malicious proposal, claiming it is the "official" version.
4. Voters who do not carefully review the proposal vote for the wrong one.
5. The malicious proposal passes and executes.

**Mitigation:** Clear proposal formatting, mandatory descriptions, and community review periods.

### Scenario 4: Governance Griefing

An attacker does not want to steal funds: they want to disrupt governance. They:

1. Submit dozens of spam proposals with confusing titles.
2. Legitimate proposals get buried in the noise.
3. Community members become frustrated and stop participating.
4. Quorum requirements cannot be met.
5. No legitimate proposals can pass.

This attack is cheap to execute because proposal submission typically costs only gas. The attacker does not need to acquire governance tokens: they just need to create confusion and frustration.

**Mitigation:** Require a minimum token stake to submit proposals. Implement proposal deposit that is returned only if the proposal reaches quorum. Use a proposal sponsor system where existing delegates must endorse new proposals. Rate-limit proposal submissions per address.

### Scenario 5: Vote Delegation Exploitation

An attacker targets a large token holder who has delegated their voting power:

1. The attacker contacts the delegator (often a venture capital firm or early contributor) and offers a bribe.
2. The delegator changes their delegation to the attacker's address.
3. The attacker uses the accumulated delegated votes to pass a malicious proposal.
4. The delegator receives the bribe and re-delegates to their original address.

This attack exploits the fact that delegation is a social contract, not a technical one. The delegator may not realize the impact of their delegation change.

**Mitigation:** Transparent delegation records. Public dashboards showing delegation changes. Community monitoring of large delegation shifts.

## Defenses

### Time-Lock Governance

Require a mandatory waiting period between a vote passing and execution. This gives the community time to review the proposal and react if it is malicious.

```solidity
contract Timelock {
    uint256 public constant MIN_DELAY = 2 days;
    uint256 public constant MAX_DELAY = 14 days;
    
    mapping(bytes32 => uint256) public pendingTransactions;
    
    function schedule(address target, bytes calldata data, uint256 delay) external {
        require(delay >= MIN_DELAY && delay <= MAX_DELAY);
        bytes32 txHash = keccak256(abi.encodePacked(target, data));
        pendingTransactions[txHash] = block.timestamp + delay;
    }
    
    function execute(address target, bytes calldata data) external {
        bytes32 txHash = keccak256(abi.encodePacked(target, data));
        require(pendingTransactions[txHash] != 0, "Not scheduled");
        require(block.timestamp >= pendingTransactions[txHash], "Timelock not reached");
        
        delete pendingTransactions[txHash];
        (bool success, ) = target.call(data);
        require(success);
    }
    
    function cancel(address target, bytes calldata data) external {
        bytes32 txHash = keccak256(abi.encodePacked(target, data));
        delete pendingTransactions[txHash];
    }
}
```

The timelock duration should be proportional to the risk of the action. Routine parameter changes might have a 24-hour timelock, while treasury transfers or admin key changes should have a 7-day or 14-day timelock. The timelock should be enforceable: meaning the contract itself checks the timelock before executing, not just the frontend.

### Quorum Requirements

Require a minimum percentage of total voting power to participate for a vote to be valid. This prevents a small group from passing proposals when most holders are not paying attention.

```solidity
uint256 public constant QUORUM_PERCENT = 4; // 4% of total supply

function executeProposal(uint256 proposalId) external {
    Proposal storage p = proposals[proposalId];
    require(p.votesFor + p.votesAgainst >= governanceToken.totalSupply() * QUORUM_PERCENT / 100, "No quorum");
    require(p.votesFor > p.votesAgainst, "Proposal rejected");
    // Execute...
}
```

Quorum requirements must be carefully calibrated. If the quorum is too high, governance becomes paralyzed because it is impossible to reach quorum for routine operations. If the quorum is too low, a small group of motivated attackers can pass proposals without broad community support. Most protocols use 3-10% of total supply as the quorum threshold.

### Vote Escrow (veToken Model)

The veToken model (popularized by Curve) requires users to lock tokens for a period to receive voting power. The longer the lock, the more voting power:

```solidity
function getVotingPower(address voter) public view returns (uint256) {
    uint256 balance = token.balanceOf(voter);
    uint256 lockEnd = lockEnds[voter];
    uint256 remaining = lockEnd - block.timestamp;
    uint256 maxLock = 4 * 365 days; // 4 years max
    
    // Voting power = balance * remaining / maxLock
    return balance * remaining / maxLock;
}
```

This makes flash loan attacks impossible (the lock period exceeds the flash loan duration) and makes gradual takeover more expensive (the attacker must lock tokens for years to accumulate maximum voting power). The tradeoff is reduced token liquidity: locked tokens cannot be sold, which reduces the token's market efficiency.

### Multi-Layer Defense

The strongest governance systems combine multiple defenses:

1. **Token lock (veToken):** Prevents flash loan attacks.
2. **Quorum requirement:** Ensures broad participation.
3. **Timelock:** Gives the community time to react.
4. **Guardian veto:** Provides an emergency safety valve.
5. **Proposal threshold:** Prevents proposal spam.

Each layer addresses a different attack vector. Removing any single layer creates a vulnerability. The key is to balance security with usability: too many layers make governance cumbersome and discourage participation.

### Delegation Security

If the governance system supports delegation, additional security measures are needed:

1. **Delegation transparency:** All delegations should be publicly visible on-chain. This allows the community to monitor delegation patterns.
2. **Delegation limits:** Consider limiting the number of tokens a single delegate can accumulate. If a delegate holds more than 20% of total voting power, additional scrutiny should be applied.
3. **Delegation revocation:** Token holders should be able to revoke delegation at any time. The delegation should be revocable without delay.
4. **Delegation audit:** Periodically audit delegation records for suspicious patterns, such as sudden large delegation changes or delegation to newly created addresses.

## Assessment

### Lab 1: Governance Attack Development (120 minutes)

**Objective:** Develop and demonstrate governance attacks against a vulnerable governance system.

**Tasks:**

1. You are given the following governance contract:

```solidity
contract VulnerableGovernance {
    IERC20 public token;
    uint256 public votingPeriod = 1 days;
    uint256 public proposalCount;
    address public executor;
    
    mapping(uint256 => Proposal) public proposals;
    
    struct Proposal {
        address target;
        bytes data;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    constructor(address _token, address _executor) {
        token = IERC20(_token);
        executor = _executor;
    }
    
    function propose(address target, bytes calldata data) external {
        proposals[proposalCount].target = target;
        proposals[proposalCount].data = data;
        proposals[proposalCount].deadline = block.timestamp + votingPeriod;
        proposalCount++;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp <= p.deadline);
        require(!p.hasVoted[msg.sender]);
        
        uint256 weight = token.balanceOf(msg.sender);
        p.hasVoted[msg.sender] = true;
        
        if (support) p.votesFor += weight;
        else p.votesAgainst += weight;
    }
    
    function execute(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.deadline);
        require(!p.executed);
        require(p.votesFor > p.votesAgainst);
        
        p.executed = true;
        (bool success, ) = p.target.call(p.data);
        require(success);
    }
}
```

2. Write a flash loan attack that:
   - Creates a malicious proposal to drain the treasury.
   - Flash-borrows enough tokens to pass the proposal.
   - Votes and executes the proposal.
   - Repays the flash loan.
   - Demonstrates profit extraction.

3. Write a fixed governance contract that prevents flash loan attacks:
   - Staking requirement (7-day minimum).
   - Timelock (48-hour delay).
   - Quorum requirement (4% of total supply).

4. Verify that the attack fails against the fixed contract.

**Grading criteria:**
- Flash loan attack successfully drains the treasury (25%)
- Attack is atomic (all in one transaction) (20%)
- Fixed governance prevents the attack (25%)
- All three defenses implemented correctly (20%)
- Tests verify attack and defense (10%)

### Lab 2: Governance Monitoring System (90 minutes)

**Objective:** Build a governance monitoring system that detects suspicious activity.

**Tasks:**

1. Write a monitoring contract that tracks:
   - Token concentration (largest holders and their percentages).
   - Delegation patterns (who has delegated to whom).
   - Proposal activity (frequency, vote patterns).
   - Treasury movements.

2. Write alert functions that trigger when:
   - A single address acquires >20% of voting power.
   - A single delegate accumulates >30% of delegated votes.
   - A proposal has unusual voting patterns (all votes in a short period).
   - Treasury funds are moved unexpectedly.

3. Write a Foundry test that simulates:
   - Gradual token accumulation and triggers the concentration alert.
   - Flash loan voting and triggers the pattern alert.
   - Malicious proposal and triggers the treasury alert.

4. Write a 500-word analysis of how the monitoring system would have detected real governance attacks.

**Grading criteria:**
- Monitoring contract tracks all required data (25%)
- Alert functions trigger correctly (30%)
- Tests demonstrate detection capabilities (25%)
- Analysis connects to real attacks (20%)

### Lab 3: Governance Design Review (60 minutes)

**Objective:** Review and improve a governance system design.

**Tasks:**

1. You are given the following governance design for a new DeFi protocol:
   - Token: 100 million total supply.
   - Voting: Token-weighted, simple majority.
   - Proposal threshold: 1 million tokens (1% of supply).
   - Voting period: 3 days.
   - Timelock: None.
   - Quorum: None.
   - Delegation: Allowed.

2. Identify at least 5 security weaknesses.
3. For each weakness, describe the attack and the impact.
4. Propose improvements for each weakness.
5. Write a 1,000-word governance security assessment.
6. Design an improved governance system with your recommendations.

**Grading criteria:**
- All 5 weaknesses identified (25%)
- Attack scenarios are realistic (25%)
- Improvements are effective (25%)
- Security assessment is comprehensive (15%)
- Improved design is well-justified (10%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Flash loan attack contract and test** from Lab 1, demonstrating governance exploitation.
2. **Fixed governance contract** from Lab 1, with all defenses implemented.
3. **Governance monitoring system** from Lab 2, with alert functions and detection tests.
4. **Governance security assessment** from Lab 3, identifying weaknesses and proposing improvements.
5. **Governance security checklist** for protocol designers, covering common attack vectors and defenses.

These artifacts demonstrate that you can identify, exploit, and defend against governance attacks, which is essential for designing and securing decentralized governance systems.
