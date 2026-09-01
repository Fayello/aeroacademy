# Module 3: Smart Contract Vulnerabilities

Smart contract vulnerabilities are not theoretical. They have resulted in billions of dollars in losses. The DAO hack in 2016 drained 3.6 million ETH. The Parity wallet freeze locked up 280 million USD permanently. The Wormhole bridge exploit drained 320 million USD in 2022. Each of these incidents exploited a vulnerability that was well-understood in the security community but was either overlooked or misimplemented in the deployed contract. This module covers the most critical vulnerability classes, explains the mechanics of each exploit, and provides code examples that you can use to practice identifying and fixing vulnerabilities in real contracts.

## Reentrancy

Reentrancy is the most famous smart contract vulnerability. It occurs when a contract makes an external call before updating its state, allowing the called contract to re-enter the original function before the first execution completes.

### The Mechanism

When contract A calls contract B, B's code executes. If B calls back into A (re-enters), A's function continues executing from the point of the external call, before the state was updated. The attacker deploys a malicious contract that, upon receiving ETH, calls back into the vulnerable function to withdraw again.

Here is the vulnerable pattern:

```solidity
contract VulnerableBank {
    mapping(address => uint256) public balances;
    
    function withdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");
        
        // External call BEFORE state update
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
        
        // State update happens AFTER the external call
        balances[msg.sender] = 0;
    }
}
```

The exploit:

```solidity
contract ReentrancyAttacker {
    VulnerableBank public bank;
    
    constructor(address _bank) {
        bank = VulnerableBank(_bank);
    }
    
    function attack() external payable {
        bank.deposit{value: 1 ether}();
        bank.withdraw();
    }
    
    receive() external payable {
        if (address(bank).balance >= 1 ether) {
            bank.withdraw(); // Re-enter before state is updated
        }
    }
    
    function getBalance() external returns (uint256) {
        return address(this).balance;
    }
}
```

When the attacker calls `attack()`, it deposits 1 ETH and then calls `withdraw()`. The `withdraw` function sends 1 ETH to the attacker's `receive` function. The attacker's `receive` function calls `withdraw()` again. Because the balance was not yet set to zero (the state update happens after the external call), the second withdrawal also succeeds. This repeats until the bank's balance is drained.

### The Fix: Checks-Effects-Interactions

The standard mitigation is the Checks-Effects-Interactions pattern: perform all state updates before the external call.

```solidity
contract SecureBank {
    mapping(address => uint256) public balances;
    
    function withdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");
        
        // State update BEFORE external call
        balances[msg.sender] = 0;
        
        // External call happens last
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
```

Now when the attacker re-enters, `balances[msg.sender]` is already 0, and the withdrawal fails.

### Cross-Function Reentrancy

Reentrancy does not require the same function to be called. If two functions share state, an attacker can re-enter through a different function:

```solidity
contract CrossFunctionReentrancy {
    mapping(address => uint256) public balances;
    
    function withdraw() external {
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success);
    }
    
    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

If the attacker's `receive` function calls `transfer` instead of `withdraw`, the attacker can move the same balance to a different address, effectively bypassing the withdrawal limit. The `withdraw` function zeroed the balance, but the `transfer` function increments the recipient's balance: and the attacker controls the recipient.

The fix is the same: update all shared state before any external call. Alternatively, use a reentrancy guard.

### Reentrancy Guard

The `nonReentrant` modifier is the standard defense:

```solidity
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;
    
    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
    
    constructor() {
        _status = NOT_ENTERED;
    }
}
```

The guard uses a storage variable as a mutex. Before the function body executes, the status is set to `ENTERED`. If a reentrant call is made, the `nonReentrant` modifier checks the status and reverts. After the function body completes, the status is reset to `NOT_ENTERED`.

The gas cost is approximately 2,600 gas (one cold SSTORE to set and one cold SSTORE to reset). With EIP-1153 (transient storage), this can be reduced to approximately 200 gas total, making the guard essentially free.

### Real-World Example: The DAO (2016)

The DAO (Decentralized Autonomous Organization) was a venture capital fund on Ethereum. It raised 150 million USD in ETH. The vulnerability was a reentrancy bug in the `splitDAO` function, which allowed an attacker to recursively drain funds.

The attacker drained 3.6 million ETH over several hours. The Ethereum community controversially hard-forked to reverse the theft, creating Ethereum Classic as the chain that preserved the original ledger.

The lesson: even with massive community oversight, reentrancy bugs can slip through. The attack was theoretically preventable, but the code was complex enough that the vulnerability was not caught before deployment.

## Integer Overflow and Underflow

Before Solidity 0.8.0, arithmetic operations did not revert on overflow or underflow. A `uint8` variable with value 255, incremented by 1, would silently wrap to 0. This led to numerous exploits.

### The Vulnerability

```solidity
// Pre-0.8.0 Solidity
contract VulnerableToken {
    mapping(address => uint256) public balances;
    uint8 public totalTokens = 200;
    
    function mint(address to, uint8 amount) external {
        totalTokens += amount;  // Can overflow!
        balances[to] += amount;
    }
}
```

If `totalTokens` is 200 and someone mints 56 tokens, `totalTokens` wraps to 0 (200 + 56 = 256, which overflows uint8). The contract thinks no tokens have been minted, but the recipient has 56 tokens. This can be repeated indefinitely.

### Solidity 0.8+ Protection

Starting from Solidity 0.8.0, arithmetic operations revert on overflow by default:

```solidity
// Solidity 0.8+
totalTokens += amount; // Reverts if totalTokens + amount > 255
```

This eliminates the class of vulnerability for new code. However, you must still be careful:

1. **Unchecked blocks:** If you use `unchecked { a += b; }`, overflow protection is disabled.
2. **Assembly:** Inline assembly does not have overflow protection.
3. **Legacy code:** Contracts compiled with pre-0.8.0 Solidity are still vulnerable.

### Deliberate Overflow in Unchecked Blocks

Some developers use `unchecked` blocks for gas optimization in loops:

```solidity
function incrementAll(uint[] calldata data) external pure returns (uint[] memory) {
    uint[] memory result = new uint[](data.length);
    for (uint i = 0; i < data.length;) {
        unchecked {
            result[i] = data[i] + 1; // Developer assumes no overflow
            i++;
        }
    }
    return result;
}
```

If `data[i]` is `type(uint256).max`, the increment wraps to 0. The developer may assume this is impossible, but if the function is called with arbitrary data (for example, as part of a larger system), the assumption may not hold.

## Front-Running

Front-running exploits the transparency of the mempool. When you submit a transaction, it is visible to all nodes before it is mined. An attacker can see your pending transaction, analyze its effect, and submit their own transaction with a higher gas price to be included first.

### The MEV Problem

Miner Extractable Value (MEV) is the profit that block producers (miners or validators) can extract by reordering, inserting, or censoring transactions within a block. MEV is not just front-running: it includes back-running (placing a transaction after yours to profit from the state change), sandwich attacks (placing transactions before and after yours), and time-bandit attacks (rewriting history to extract MEV from past blocks).

The most common MEV strategy is the sandwich attack on decentralized exchanges:

1. Alice submits a transaction to buy token X on Uniswap.
2. The attacker sees Alice's transaction in the mempool.
3. The attacker submits a buy transaction with a higher gas price (front-run).
4. Alice's transaction executes at a worse price (slippage).
5. The attacker submits a sell transaction (back-run) to profit from the price increase.

### Mitigation

1. **Commit-reveal schemes:** Submit a hash of your transaction first, then reveal it later. The validator cannot see the transaction content until it is revealed.

2. **Flashbots:** Use Flashbots or similar MEV protection services to submit transactions directly to validators, bypassing the public mempool.

3. **Slippage limits:** Set tight slippage tolerances on DEX trades. If the price moves beyond your tolerance, the transaction reverts.

4. **Private mempools:** Use private transaction relays (like Flashbots Protect or MEV Blocker) that do not broadcast to the public mempool.

5. **Batch auctions:** Protocols like CoW Swap batch orders and execute them at a uniform clearing price, eliminating the advantage of front-running.

## Access Control Vulnerabilities

Incorrect access control is one of the most common and most damaging vulnerability classes. If an attacker can call a function that should be restricted, they can drain funds, pause the contract, or destroy the system.

### Missing Access Control

```solidity
contract VulnerableVault {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function withdrawAll() external {
        // No access check! Anyone can call this.
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}
```

### Incorrect Access Control

```solidity
contract WrongAccessControl {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function withdrawAll() external {
        // BUG: only checks if sender is NOT the owner
        require(msg.sender != owner, "Only owner");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}
```

The `!=` should be `==`. This type of error is easy to miss in code review.

### tx.origin vs msg.sender

`tx.origin` is the address of the externally owned account (EOA) that initiated the transaction chain. `msg.sender` is the address that directly called the current function. Using `tx.origin` for access control is dangerous:

```solidity
contract VulnerableContract {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function withdraw() external {
        require(tx.origin == owner, "Not owner"); // VULNERABLE
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}
```

The attack: the attacker creates a malicious contract. When the owner interacts with the attacker's contract (even for something unrelated, like checking a token balance), the attacker's contract calls `withdraw`. Since `tx.origin` is the owner's EOA, the check passes.

The fix: always use `msg.sender` for access control:

```solidity
require(msg.sender == owner, "Not owner"); // Safe
```

### Delegatecall Vulnerabilities

`delegatecall` executes the target contract's code in the context of the calling contract. The target's code runs, but it modifies the caller's storage. This is powerful for proxy patterns but dangerous if the target is untrusted:

```solidity
contract VulnerableDelegate {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function execute(address target, bytes calldata data) external {
        // Delegatecall to arbitrary target
        (bool success, ) = target.delegatecall(data);
        require(success);
    }
}
```

An attacker can call `execute` with a target contract that contains:

```solidity
contract Attacker {
    address public owner;
    
    function attack() external {
        owner = msg.sender; // Overwrites the caller's storage slot 0
    }
}
```

When `delegatecall` executes `attack()`, it writes to slot 0 of the `VulnerableDelegate` contract, overwriting the `owner` variable. The attacker becomes the owner.

The fix: never delegatecall to untrusted targets. If delegatecall is necessary, use a whitelist of approved targets and validate the target address.

## Denial of Service

A denial of service (DoS) attack makes a contract function unusable. This can be through gas exhaustion, state manipulation, or external dependency failure.

### Gas Griefing

```solidity
contract VulnerableAirdrop {
    mapping(address => bool) public claimed;
    
    function claim(bytes32[] calldata proof) external {
        require(!claimed[msg.sender], "Already claimed");
        // Verify Merkle proof...
        claimed[msg.sender] = true;
        (bool success, ) = msg.sender.call{value: 1 ether}("");
        require(success);
    }
}
```

If `msg.sender` is a contract with a `receive` function that consumes all available gas, the `require(success)` will fail, and the airdrop claim reverts. The attacker can grief all recipients by making them unable to claim.

The fix: use a pull-over-push pattern. Instead of sending ETH directly, let users withdraw it themselves:

```solidity
mapping(address => uint256) public pendingWithdrawals;

function claim(bytes32[] calldata proof) external {
    // Verify proof...
    pendingWithdrawals[msg.sender] += 1 ether;
}

function withdraw() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "Nothing to withdraw");
    pendingWithdrawals[msg.sender] = 0;
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}
```

### Unbounded Loop DoS

```solidity
contract VulnerableVoting {
    address[] public voters;
    mapping(address => bool) public hasVoted;
    
    function vote() external {
        require(!hasVoted[msg.sender], "Already voted");
        hasVoted[msg.sender] = true;
        voters.push(msg.sender);
    }
    
    function tallyVotes() external view returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < voters.length; i++) { // Unbounded loop
            if (hasVoted[voters[i]]) count++;
        }
        return count;
    }
}
```

If enough voters participate, the loop in `tallyVotes` will exceed the block gas limit, making the function permanently unusable. The fix: maintain a counter that increments when a vote is cast and read it directly:

```solidity
uint256 public voteCount;

function vote() external {
    require(!hasVoted[msg.sender], "Already voted");
    hasVoted[msg.sender] = true;
    voteCount++;
}

function tallyVotes() external view returns (uint256) {
    return voteCount;
}
```

## Oracle Manipulation

Smart contracts cannot access off-chain data directly. They rely on oracles: services that provide external data (like token prices) to the blockchain. If the oracle can be manipulated, the contract's logic can be exploited. Oracle manipulation is one of the most common and most profitable attack vectors in DeFi, responsible for over $400 million in losses across multiple protocols.

### Spot Price Manipulation

Many DeFi protocols use the spot price from a DEX pool (like Uniswap) as a price oracle. The spot price is the ratio of reserves in the pool, which can be manipulated by a large trade.

```solidity
// Vulnerable: uses Uniswap spot price as oracle
function getPrice() public view returns (uint256) {
    (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
    return (reserve1 * 1e18) / reserve0;
}
```

An attacker can:

1. Take a large flash loan.
2. Swap a massive amount of token A for token B on Uniswap, moving the price.
3. Interact with a protocol that uses the manipulated spot price.
4. Swap back and repay the flash loan, keeping the profit.

The key insight is that the spot price changes instantly with each trade, but the protocol's accounting does not update until the next block. This one-block window is all an attacker needs. The cost of manipulation depends on the pool's liquidity: a pool with $10 million in liquidity might cost $500,000 in trading fees to move the price by 10%, while a pool with $100,000 in liquidity might cost only $5,000.

### Time-Weighted Average Price (TWAP)

TWAP oracles calculate the average price over a period of time, making spot price manipulation much more expensive (the attacker would need to maintain the manipulated price for the entire TWAP window).

```solidity
// More secure: uses TWAP
function getPrice() public view returns (uint256) {
    uint256 price0Cumulative = pair.price0CumulativeLast();
    uint256 price1Cumulative = pair.price1CumulativeLast();
    uint32 blockTimestamp = uint32(block.timestamp);
    
    // Calculate TWAP over the last 30 minutes
    (uint256 price0Average, uint256 price1Average) = IUniswapV2Pair(pair)
        .consult(
            address(token),
            30 minutes,
            blockTimestamp
        );
    
    return price0Average;
}
```

TWAP oracles are more secure than spot price oracles because they average the price over time. To manipulate a 30-minute TWAP, the attacker would need to maintain the manipulated price for 30 minutes, which requires continuous trading and incurs continuous fees. This is significantly more expensive than a single-block spot price manipulation.

However, TWAP oracles are not perfect. They have several weaknesses:

1. **Latency:** The TWAP reflects the average price over the past N minutes, not the current price. During rapid market moves, the TWAP may be significantly different from the true market price.
2. **Low liquidity manipulation:** If the pool has low liquidity, an attacker can maintain the manipulated price for extended periods at relatively low cost.
3. **Sandwich attacks on TWAP updates:** An attacker can front-run a TWAP update, profit from the stale price, and back-run the update to capture additional value.
4. **Oracle update frequency:** If the TWAP is checked infrequently (e.g., once per day), the attacker has a larger window to profit from manipulation.

For high-value protocols, the best practice is to combine TWAP with other oracle sources (like Chainlink) and implement circuit breakers that pause the protocol if the TWAP deviates significantly from the Chainlink price.

## Real CVE Examples

### CVE-2016-10745: The DAO Reentrancy

The DAO contract had a reentrancy vulnerability in the `splitDAO` function. The function transferred ETH to the caller before updating the balance. An attacker drained 3.6 million ETH by recursively calling the split function. The attack took several hours to execute, during which the Ethereum community watched in real-time as funds were drained. The eventual hard-fork to reverse the theft created Ethereum Classic and remains one of the most controversial decisions in blockchain history.

### CVE-2018-13095: Parity Multi-Sig Wallet

The Parity multi-sig wallet had a delegatecall vulnerability. The `initWallet` function could be called by anyone after deployment, allowing the attacker to overwrite the wallet's owners and become the sole owner. The attacker then drained 30 million USD. A second Parity vulnerability later that year froze 280 million USD permanently when a user accidentally self-destructed the library contract that all Parity multi-sig wallets depended on.

### CVE-2020-11655: YAM Protocol

The YAM protocol had a bug in its rebasing logic. The `rebase` function calculated the rebase amount incorrectly, minting an astronomically large number of tokens. The protocol was rendered unusable and the community had to migrate to YAM v2. This incident demonstrated how a single line of incorrect code can destroy a protocol worth hundreds of millions of dollars within hours of deployment.

### CVE-2021-3749: Visor Finance

Visor Finance used an external call to a user-provided address for reward distribution. An attacker deployed a malicious contract that re-entered the reward function, draining the entire reward pool. The exploit cost the attacker approximately $8.2 million and highlighted the danger of making external calls to untrusted addresses.

### CVE-2022-21612: Wormhole Bridge

The Wormhole bridge had a signature verification bypass. An attacker could submit a message with a fake guardian signature, which the bridge accepted, allowing the attacker to mint 120,000 wrapped ETH on Solana without depositing any ETH on Ethereum. The $320 million exploit was one of the largest in DeFi history and was eventually resolved by Jump Crypto, which replaced the stolen funds.

### CVE-2023-46737: BonqDAO

The BonqDAO exploit used oracle manipulation to inflate the value of the ALBT token collateral. The attacker manipulated the Tellor oracle price feed and then borrowed 120 million USD against the inflated collateral. The root cause was the reliance on a single, manipulable oracle for collateral valuation.

## Assessment

### Lab 1: Vulnerability Identification (60 minutes)

**Objective:** Identify and explain vulnerabilities in the following contracts.

**Tasks:**

For each contract below, identify the vulnerability, explain the attack scenario, and write a fix:

**Contract 1: Simple Bank**

```solidity
contract SimpleBank {
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        balances[msg.sender] -= amount;
        require(success);
    }
}
```

**Contract 2: Token Vesting**

```solidity
contract TokenVesting {
    address public beneficiary;
    uint256 public releaseTime;
    mapping(address => uint256) public released;
    
    constructor(address _beneficiary, uint256 _releaseTime) {
        beneficiary = _beneficiary;
        releaseTime = _releaseTime;
    }
    
    function release(uint256 amount) external {
        require(block.timestamp >= releaseTime);
        require(released[msg.sender] + amount <= address(this).balance);
        released[msg.sender] += amount;
        (bool success, ) = beneficiary.call{value: amount}("");
        require(success);
    }
}
```

**Contract 3: Governance**

```solidity
contract SimpleGovernance {
    address public executor;
    mapping(uint256 => bool) public executed;
    
    function executeProposal(uint256 proposalId, address target, bytes calldata data) external {
        require(!executed[proposalId]);
        executed[proposalId] = true;
        (bool success, ) = target.delegatecall(data);
        require(success);
    }
}
```

**Grading criteria:**
- Correct vulnerability identification for each contract (40%)
- Accurate attack scenario descriptions (30%)
- Effective fixes with explanations (20%)
- Code quality of fixes (10%)

### Lab 2: Exploit Development (90 minutes)

**Objective:** Write an exploit contract for the Simple Bank vulnerability.

**Tasks:**

1. Write a Foundry test that demonstrates the reentrancy attack on the `SimpleBank` contract.
2. The test should:
   - Deploy `SimpleBank`.
   - Deploy an attacker contract.
   - Fund the attacker contract with 1 ETH.
   - Execute the attack.
   - Verify that `SimpleBank`'s balance is 0 and the attacker contract has 1 ETH.
3. Write a modified version of `SimpleBank` that is not vulnerable.
4. Run the same exploit against the fixed version and verify it fails.
5. Measure the gas cost of the attack and the gas cost of the fix's `nonReentrant` modifier.

**Grading criteria:**
- Exploit contract correctly demonstrates the attack (30%)
- Test is well-structured and verifiable (25%)
- Fixed contract prevents the attack (25%)
- Gas comparison is accurate (15%)
- Code is clean and well-documented (5%)

### Lab 3: Vulnerability Research (60 minutes)

**Objective:** Research and document a recent smart contract exploit.

**Tasks:**

1. Choose a smart contract exploit from 2022-2025 (not covered in this module).
2. Write a technical analysis including:
   - Contract name and deployment date.
   - Vulnerability class (reentrancy, access control, etc.).
   - Technical root cause (what specific code was vulnerable?).
   - Attack flow (step-by-step exploitation).
   - Financial impact (amount lost).
   - Post-mortem fixes (what did the project do to prevent recurrence?).
3. Write a 500-word reflection on what the exploit teaches about smart contract security.
4. Cite your sources (blockchain explorers, post-mortems, security reports).

**Grading criteria:**
- Technical accuracy of the analysis (30%)
- Completeness of the attack flow (25%)
- Quality of the reflection (25%)
- Source citation and research quality (20%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Vulnerability analysis reports** from Lab 1, including identified vulnerabilities, attack scenarios, and fixes.
2. **Exploit contract and test** from Lab 2, with gas measurements.
3. **CVE analysis** from Lab 3, with technical details and lessons learned.
4. **Annotated code** of all vulnerable and fixed contracts, showing your understanding of each vulnerability class.
5. **Checklist** of vulnerability patterns to check during future code reviews, organized by category (reentrancy, access control, arithmetic, etc.).

These artifacts demonstrate that you can identify, exploit, and fix the most common smart contract vulnerabilities, which is the core skill for smart contract security assessment.
