# Module 2: Ethereum and Smart Contracts

Smart contracts are autonomous programs deployed on the Ethereum blockchain. Once deployed, they execute exactly as written, cannot be modified (unless specifically designed to be upgradeable), and are called by users or other contracts through transactions. A smart contract vulnerability is not a bug you can patch on Tuesday: it is a permanent flaw in a system that holds real money. This module covers Solidity fundamentals, contract deployment mechanics, gas optimization, and the practical skills you need to read, write, and assess contracts.

## The EVM Execution Model

Before writing a single line of Solidity, you need to understand what happens when a contract is called. The Ethereum Virtual Machine is a stack-based interpreter. When a transaction targets a contract address, the EVM loads the contract's bytecode and executes it instruction by instruction.

The EVM has three storage areas:

1. **Stack:** A LIFO data structure with a maximum depth of 1024. Most operations push and pop values from the stack. You do not interact with the stack directly in Solidity, but understanding it explains why certain operations are cheap (stack operations cost 3 gas) and others are expensive (memory operations cost more).

2. **Memory:** A volatile byte array that is cleared after each transaction. Memory is addressed by byte offset and grows dynamically. Reading and writing to memory costs 3 gas per 32-byte word (after the first 724 words). Memory is used for intermediate computation and for passing data between functions.

3. **Storage:** A persistent key-value store that maps 256-bit keys to 256-bit values. Storage is where contract state variables live. Reading storage costs 2100 gas (cold access) or 100 gas (warm access). Writing to storage costs 20,000 gas (new slot) or 2,900 gas (update). Storage is the most expensive resource in the EVM, and this cost structure directly influences how you design contracts.

When a contract function is called, the EVM:

1. Receives the calldata (the ABI-encoded function selector and arguments).
2. Looks up the function selector in the contract's dispatch table.
3. Executes the corresponding function logic.
4. Modifies storage, memory, and emits logs as needed.
5. Returns data (if any) to the caller.

The execution is deterministic: given the same state and the same transaction, the EVM will always produce the same result. This determinism is what allows every node in the network to independently verify the state transition.

## Solidity Basics

Solidity is a statically typed, high-level language that compiles to EVM bytecode. It is the dominant language for Ethereum smart contracts. The syntax draws from C++, Python, and JavaScript, but the semantics are unique to the blockchain context.

### Contract Structure

A Solidity contract is the unit of deployment. It contains state variables, functions, modifiers, events, and error declarations.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Bank {
    // State variables live in storage
    mapping(address => uint256) public balances;
    
    // Events are emitted to the transaction log (cheap storage)
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    // Errors are cheaper than require strings (revert with error data)
    error InsufficientBalance(uint256 requested, uint256 available);
    error ZeroDeposit();
    
    // Payable modifier allows the function to receive ETH
    function deposit() external payable {
        if (msg.value == 0) revert ZeroDeposit();
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint256 amount) external {
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance(amount, balances[msg.sender]);
        }
        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawal(msg.sender, amount);
    }
    
    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }
}
```

This contract demonstrates several important patterns:

- **Public mapping:** `balances` has an automatic getter function. Anyone can read any address's balance. On a public blockchain, there are no secrets in storage.
- **Checks-Effects-Interactions pattern:** The `withdraw` function checks the balance, updates the state, and then makes the external call. This ordering is critical for preventing reentrancy (covered in Module 3).
- **Custom errors:** Starting from Solidity 0.8.4, custom errors are cheaper than require strings. The `InsufficientBalance` error encodes the relevant values, making debugging easier while costing less gas.

### Data Types and Layout

Solidity has value types (bool, uint, int, address, bytes32) and reference types (arrays, mappings, structs). Understanding how these map to storage is critical for gas optimization and security.

Storage slots are allocated sequentially for state variables. Variables that fit in 32 bytes (one slot) are packed together. For example:

```solidity
contract Packed {
    uint128 a;  // slot 0, lower 128 bits
    uint128 b;  // slot 0, upper 128 bits
    uint256 c;  // slot 1
}
```

Variables `a` and `b` share slot 0 because each is 128 bits (16 bytes), and they pack into a single 32-byte slot. This saves gas because reading slot 0 gives you both values. However, packing can create overflow vulnerabilities if you are not careful about the arithmetic.

### Function Modifiers

Modifiers are reusable code blocks that execute before, after, or around a function. They are commonly used for access control:

```solidity
contract Owned {
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function sensitiveAction() external onlyOwner {
        // Only the owner can call this
    }
}
```

The `_;` placeholder is where the function body executes. A modifier can run code before and after the function by placing `_;` at the desired position.

### Inheritance and Interfaces

Solidity supports multiple inheritance with the `is` keyword. When a contract inherits from multiple contracts, the C3 linearization algorithm determines the order of initialization.

```solidity
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

abstract contract ERC20 is IERC20 {
    mapping(address => uint256) internal _balances;
    uint256 internal _totalSupply;
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
}
```

Interfaces define the ABI (Application Binary Interface) without implementation. Abstract contracts provide partial implementation. Understanding interfaces is critical because contract interactions happen through the ABI: when contract A calls contract B, it ABI-encodes the function call and sends it as calldata.

## Contract Deployment

Deploying a contract is itself a transaction. The deployment transaction has an empty `to` address, and the contract's creation code is sent as the transaction's `data` field.

The deployment process:

1. The compiler generates two artifacts: **creation code** (the bytecode that runs once during deployment) and **runtime code** (the bytecode that runs every time the contract is called).
2. The creation code executes, initializing state variables and running the constructor.
3. The creation code returns the runtime bytecode, which is stored on-chain at the contract's address.
4. The contract's address is derived from the deployer's address and nonce (for EOAs) or from the factory contract's address and creation code hash (for CREATE2).

### Constructor

The constructor runs once during deployment and is used to initialize state:

```solidity
contract Token {
    address public immutable owner;
    uint256 public immutable totalSupply;
    mapping(address => uint256) public balances;
    
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply;
        balances[msg.sender] = _initialSupply;
    }
}
```

The `immutable` keyword marks variables that are set in the constructor and cannot change afterward. Immutable variables are embedded directly in the contract's bytecode, making reads essentially free (no SLOAD opcode). This is a significant gas optimization for values that never change.

### CREATE vs CREATE2

The standard deployment opcode is CREATE, which derives the contract address from the deployer's address and nonce. The address is deterministic but depends on the deployer's transaction history.

CREATE2 (introduced by EIP-1014) allows deterministic deployment regardless of the deployer's nonce:

```
address = keccak256(0xff ++ deployerAddress ++ salt ++ keccak256(creationCode))
```

This means you can compute the contract address before deployment, which enables:

- **Counterfactual deployment:** The contract address is known in advance, so users can interact with the address before the contract exists (useful for smart wallets).
- **Deterministic redeployment:** If a contract self-destructs, it can be redeployed to the same address with the same code.

The security implication: CREATE2 contracts can be redeployed. If a contract self-destructs and someone redeploys it with different code, users who trusted the original code may interact with the new code unknowingly. This is why self-destruct is being restricted in future EIPs.

## Gas Optimization

Gas is not just a cost: it is a security constraint. Transactions that consume too much gas are rejected, and contracts that waste gas are economically uncompetitive. Here are the most impactful optimization patterns.

### Storage Packing

As discussed earlier, state variables that fit in 32 bytes can share a storage slot. Organizing your state variables to maximize packing can save significant gas:

```solidity
// Bad: 4 storage slots
contract Unpacked {
    uint8 a;    // slot 0
    uint8 b;    // slot 1
    uint8 c;    // slot 2
    uint8 d;    // slot 3
}

// Good: 1 storage slot
contract Packed {
    uint8 a;    // slot 0
    uint8 b;    // slot 0
    uint8 c;    // slot 0
    uint8 d;    // slot 0
}
```

Four reads from `Unpacked` cost 4 × 2100 = 8400 gas. Four reads from `Packed` cost 1 × 2100 = 2100 gas (plus bit manipulation, which is negligible).

### Caching Storage Variables

Reading from storage is expensive. If a storage variable is read multiple times in a function, cache it in memory:

```solidity
// Bad
function process() external {
    for (uint i = 0; i < myArray.length; i++) {
        // myArray.length is read from storage every iteration
    }
}

// Good
function process() external {
    uint length = myArray.length; // Read once, cache in memory
    for (uint i = 0; i < length; i++) {
        // Use cached length
    }
}
```

### Calldata vs Memory

For function parameters that are only read (not modified), use `calldata` instead of `memory`. Calldata is read-only and does not require copying the data into memory:

```solidity
// Bad: copies entire array to memory
function sum(uint[] memory data) external view returns (uint) { ... }

// Good: reads directly from calldata
function sum(uint[] calldata data) external view returns (uint) { ... }
```

For a 100-element array, the gas savings can be several thousand gas. The difference matters most for view functions called frequently from off-chain and for functions that receive large arrays as input.

### String Concatenation

Solidity does not have native string concatenation. Many developers use `abi.encodePacked` to concatenate strings, but this creates a security vulnerability:

```solidity
// VULNERABLE: abi.encodePacked with dynamic types can cause hash collisions
bytes32 hash = keccak256(abi.encodePacked(name, symbol));
```

If `name` and `symbol` are dynamic types (strings or bytes), the concatenation can produce the same hash for different inputs. For example, `abi.encodePacked("abc", "def")` produces the same result as `abi.encodePacked("ab", "cdef")`. Use `abi.encode` instead of `abi.encodePacked` for hashing, or ensure that at least one of the arguments is a fixed-size type.

### Short-Circuit Evaluation

Solidity evaluates logical expressions left to right and short-circuits. Arrange conditions so that cheap checks come first:

```solidity
function doSomething(address user, uint amount) external {
    // Check balance first (2100 gas cold read)
    // then check if caller is authorized (2100 gas cold read)
    // Order matters if one is significantly cheaper
    require(balances[user] >= amount, "Insufficient balance");
    require(msg.sender == owner || managers[msg.sender], "Unauthorized");
}
```

### Storage Variable Ordering

The order in which you declare state variables affects gas costs due to storage packing. Variables that are frequently accessed together should be declared next to each other so they can share a storage slot. Variables that are rarely accessed should be declared last to avoid paying for unnecessary SLOAD operations when reading frequently accessed variables.

```solidity
// Optimized: frequently accessed variables packed together
contract OptimizedLayout {
    uint128 public totalDeposits;    // slot 0 (frequently read)
    uint128 public totalBorrows;     // slot 0 (frequently read)
    uint256 public lastUpdate;       // slot 1 (frequently read)
    address public owner;            // slot 2 (rarely read)
    bool public paused;              // slot 2 (rarely read)
    uint256 internal _unused1;       // slot 3 (internal)
}
```

### Unchecked Arithmetic

Starting from Solidity 0.8.0, arithmetic operations revert on overflow by default. This is a safety feature, but it adds gas cost. In loops where overflow is provably impossible, you can use `unchecked` blocks:

```solidity
function incrementAll(uint[] calldata data) external pure returns (uint[] memory) {
    uint[] memory result = new uint[](data.length);
    for (uint i = 0; i < data.length;) {
        unchecked {
            result[i] = data[i] + 1; // Safe: data[i] is at most uint256.max - 1 in practice
        }
        unchecked {
            i++; // Safe: i starts at 0 and data.length is at most uint256.max
        }
    }
    return result;
}
```

The `unchecked` block saves about 100 gas per operation by skipping the overflow check. Use this only when you are mathematically certain that overflow cannot occur.

### Transient Storage (EIP-1153)

Post-Cancun (EIP-1153), transient storage provides a temporary storage area that is cleared after each transaction. It is cheaper than regular storage for values that do not need to persist between transactions (like reentrancy guards):

```solidity
// EIP-1153 transient storage
uint256 constant LOCKED = 0;
uint256 constant UNLOCKED = 1;

modifier nonReentrant() {
    require(tload(LOCKED) == UNLOCKED, "Reentrant call");
    tstore(LOCKED, 1); // Lock
    _;
    tstore(LOCKED, 0); // Unlock
}
```

Transient storage costs 100 gas for both reads and writes, compared to 2100/20000 for cold storage reads/writes. This is a massive improvement for reentrancy guards and similar temporary state.

## Real Scenario: Writing a Simple Token Contract

Let us build a basic ERC-20 token from scratch, explaining every design decision.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    error InsufficientBalance(uint256 requested, uint256 available);
    error InsufficientAllowance(uint256 requested, uint256 available);
    
    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        if (balanceOf[msg.sender] < amount) {
            revert InsufficientBalance(amount, balanceOf[msg.sender]);
        }
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] < amount) {
            revert InsufficientAllowance(amount, allowance[from][msg.sender]);
        }
        if (balanceOf[from] < amount) {
            revert InsufficientBalance(amount, balanceOf[from]);
        }
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
```

Key design decisions:

1. **Constructor initializes total supply:** All tokens are minted to the deployer. This is a simple distribution model. In production, you might use a vesting contract or a crowdsale.

2. **Custom errors instead of require strings:** Custom errors are cheaper and more informative. The error data is ABI-encoded and can be decoded by the caller.

3. **No overflow checks in arithmetic:** Solidity 0.8+ has built-in overflow checks. The `balanceOf[msg.sender] -= amount` will revert if the balance is insufficient, because unsigned integer subtraction reverts on underflow. This eliminates the need for explicit balance checks, but the explicit checks are included here for clarity and gas efficiency (checking first and reverting with a custom error is cheaper than letting the underflow revert with a generic Panic error).

4. **Events for all state changes:** Every transfer and approval emits an event. Off-chain services (wallets, block explorers, indexers) rely on events to track token activity.

### Deployment and Verification

To deploy this contract, you need:

1. **A compiler:** Use solc 0.8.20 or later.
2. **Deployment tool:** Hardhat, Foundry, or Remix.
3. **Gas for deployment:** The contract creation bytecode is approximately 800 bytes, so deployment costs roughly 800 × 200 = 160,000 gas (the exact cost depends on the initialization code and constructor arguments).

After deployment, verify the contract on Etherscan by providing the source code and constructor arguments. Verification allows anyone to read and interact with the contract's source code, which is essential for transparency and security auditing.

## Testing Framework

A contract is not complete without tests. The two dominant testing frameworks are Foundry and Hardhat.

### Foundry

Foundry uses Solidity for both the contract and the test, which means you can test contracts without writing JavaScript:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SimpleToken.sol";

contract SimpleTokenTest is Test {
    SimpleToken token;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    
    function setUp() public {
        token = new SimpleToken("TestToken", "TT", 1000);
    }
    
    function testInitialSupply() public {
        assertEq(token.totalSupply(), 1000 ether);
        assertEq(token.balanceOf(address(this)), 1000 ether);
    }
    
    function testTransfer() public {
        token.transfer(alice, 100 ether);
        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.balanceOf(address(this)), 900 ether);
    }
    
    function testTransferInsufficientBalance() public {
        vm.expectRevert(abi.encodeWithSelector(
            SimpleToken.InsufficientBalance.selector, 
            100 ether, 
            0
        ));
        token.transfer(alice, 100 ether);
    }
    
    function testFuzzTransfer(uint256 amount) public {
        vm.assume(amount <= 1000 ether);
        token.transfer(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }
}
```

The `testFuzzTransfer` function is a fuzz test: Foundry generates random values for `amount` and runs the test with each value. The `vm.assume` call filters out invalid inputs. Fuzz testing is critical for finding edge cases that you might miss with fixed test cases.

### Hardhat

Hardhat uses JavaScript/TypeScript for testing, which is more familiar to web developers:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleToken", function () {
  let token, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("SimpleToken");
    token = await Token.deploy("TestToken", "TT", 1000);
  });

  it("Should transfer tokens correctly", async function () {
    await token.transfer(alice.address, 100);
    expect(await token.balanceOf(alice.address)).to.equal(100);
    expect(await token.balanceOf(owner.address)).to.equal(900);
  });

  it("Should revert on insufficient balance", async function () {
    await expect(
      token.connect(alice).transfer(bob.address, 100)
    ).to.be.revertedWithCustomError(token, "InsufficientBalance");
  });
});
```

## Assessment

### Lab 1: Contract Writing (90 minutes)

**Objective:** Write and deploy a basic token contract with specific requirements.

**Tasks:**

1. Write a Solidity contract that implements a simple token with the following features:
   - Mintable (only the owner can mint new tokens).
   - Burnable (any holder can burn their own tokens).
   - Pausable (the owner can pause all transfers).
   - Max supply cap of 1,000,000 tokens.
2. Write at least 10 unit tests covering:
   - Deployment (correct name, symbol, supply).
   - Minting (owner can mint, non-owner cannot).
   - Burning (holder can burn, non-holder cannot).
   - Transfers (correct balances, overflow protection).
   - Pause/unpause functionality.
3. Deploy to a local Hardhat network.
4. Optimize the contract for gas: the total deployment gas must be under 2 million gas.
5. Submit the contract address on the local network and the gas report.

**Grading criteria:**
- Contract implements all required features (30%)
- Test coverage is comprehensive (25%)
- Gas optimization is demonstrable (20%)
- Code follows best practices (naming, documentation, error handling) (15%)
- Deployment is successful (10%)

### Lab 2: Gas Analysis (60 minutes)

**Objective:** Analyze and optimize gas consumption for a given contract.

**Tasks:**

1. Given the following unoptimized contract, identify at least 5 gas optimization opportunities:

```solidity
contract Unoptimized {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    function batchTransfer(address[] memory recipients, uint256[] memory amounts) public {
        for (uint i = 0; i < recipients.length; i++) {
            require(balances[msg.sender] >= amounts[i]);
            balances[msg.sender] -= amounts[i];
            balances[recipients[i]] += amounts[i];
        }
    }
    
    function getAllowance(address owner, address spender) public view returns (uint256) {
        return allowances[owner][spender];
    }
}
```

2. Rewrite the contract with all optimizations applied.
3. Measure gas for `batchTransfer` with 10 recipients before and after optimization.
4. Document each optimization and its gas impact.
5. Write a 300-word explanation of which optimizations have the highest impact and why.

**Grading criteria:**
- All 5 optimizations identified (25%)
- Optimized contract compiles and is functionally equivalent (30%)
- Accurate gas measurements (20%)
- Quality of explanation (15%)
- Code readability maintained (10%)

### Lab 3: Contract Interaction (45 minutes)

**Objective:** Write a contract that interacts with another contract and analyze the gas implications.

**Tasks:**

1. Write a contract `TokenVault` that:
   - Accepts deposits of a specific ERC-20 token.
   - Tracks deposits per user.
   - Allows withdrawals with a 24-hour lockup.
   - Emits events for all deposits and withdrawals.
2. Use the `SimpleToken` from the scenario as the ERC-20 token.
3. Write tests that cover:
   - Depositing tokens.
   - Withdrawing before lockup expires (should fail).
   - Withdrawing after lockup expires (should succeed).
   - Multiple deposits from the same user.
4. Measure the gas cost of each operation.
5. Identify the most expensive operation and explain why.

**Grading criteria:**
- Vault contract is functionally correct (30%)
- Lockup mechanism works correctly (25%)
- Tests are comprehensive (20%)
- Gas analysis is accurate and insightful (15%)
- Code quality and security (10%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Token contract source code** from Lab 1, with deployment transaction hash and gas report.
2. **Gas optimization report** from Lab 2, including before/after comparisons and per-operation breakdowns.
3. **Vault contract and tests** from Lab 3, with gas measurements for each operation.
4. **Annotated Solidity code** showing your understanding of EVM execution, storage layout, and gas costs.
5. **Test coverage report** showing statement, branch, and function coverage for all contracts.

These artifacts demonstrate that you can write, deploy, test, and optimize Solidity contracts, which is the foundation for all subsequent security assessment work.
