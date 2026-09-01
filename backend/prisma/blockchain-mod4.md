# Module 4: Contract Testing

Testing smart contracts is fundamentally different from testing traditional software. You cannot patch a deployed contract, and every testnet deployment costs real ETH. A comprehensive test suite is your only safety net before committing code to mainnet. This module covers unit testing, fuzz testing, property-based testing, formal verification, and the practical patterns that catch real vulnerabilities before they cost real money.

## Why Testing Is Critical

In traditional software, a bug in production can be fixed with a hotfix deploy. In smart contracts, a bug in production is permanent. The DAO hack could have been caught with a simple reentrancy test. The Parity wallet freeze could have been prevented with an access control test. The Wormhole bridge exploit could have been caught with a signature verification test.

Testing smart contracts is also different because of the deterministic nature of the EVM. Every transaction produces exactly the same result given the same initial state. This means tests are reproducible: but it also means that bugs are deterministic. If your test does not cover a specific state transition, the bug will exist in production with 100% certainty.

## Unit Testing

Unit tests verify individual functions and state transitions in isolation. The goal is to test every code path, boundary condition, and error case.

### Foundry Testing

Foundry's test framework is the most popular for Solidity-native testing. Tests are written in Solidity, which means you can interact with contracts using the same language they are written in.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Vault.sol";

contract VaultTest is Test {
    Vault vault;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    IERC20 token;
    
    function setUp() public {
        vault = new Vault();
        // Deploy a mock ERC-20 token
        token = new MockToken("MockToken", "MTK", 1000000 ether);
        // Mint tokens to test accounts
        token.mint(alice, 10000 ether);
        token.mint(bob, 10000 ether);
    }
    
    function testDeposit() public {
        vm.startPrank(alice);
        token.approve(address(vault), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        
        assertEq(token.balanceOf(alice), 9000 ether);
        assertEq(vault.deposits(alice, address(token)), 1000 ether);
        assertEq(vault.totalDeposits(address(token)), 1000 ether);
    }
    
    function testWithdraw() public {
        vm.startPrank(alice);
        token.approve(address(vault), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        
        vault.withdraw(address(token), 500 ether);
        
        assertEq(token.balanceOf(alice), 9500 ether);
        assertEq(vault.deposits(alice, address(token)), 500 ether);
    }
    
    function testWithdrawExceedsBalance() public {
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(Vault.InsufficientBalance.selector));
        vault.withdraw(address(token), 1000 ether);
    }
    
    function testMultipleDeposits() public {
        vm.startPrank(alice);
        token.approve(address(vault), 3000 ether);
        
        vault.deposit(address(token), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        
        assertEq(vault.deposits(alice, address(token)), 3000 ether);
        assertEq(vault.totalDeposits(address(token)), 3000 ether);
    }
    
    function testMultipleUsers() public {
        vm.startPrank(alice);
        token.approve(address(vault), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        
        vm.stopPrank();
        
        vm.startPrank(bob);
        token.approve(address(vault), 2000 ether);
        vault.deposit(address(token), 2000 ether);
        
        assertEq(vault.deposits(alice, address(token)), 1000 ether);
        assertEq(vault.deposits(bob, address(token)), 2000 ether);
        assertEq(vault.totalDeposits(address(token)), 3000 ether);
    }
    
    function testWithdrawAll() public {
        vm.startPrank(alice);
        token.approve(address(vault), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        
        vault.withdraw(address(token), 1000 ether);
        
        assertEq(vault.deposits(alice, address(token)), 0);
        assertEq(token.balanceOf(alice), 10000 ether);
    }
    
    function testCannotWithdrawOtherUsersBalance() public {
        vm.startPrank(alice);
        token.approve(address(vault), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        
        vm.stopPrank();
        
        vm.startPrank(bob);
        vm.expectRevert(abi.encodeWithSelector(Vault.InsufficientBalance.selector));
        vault.withdraw(address(token), 1000 ether);
    }
}
```

Key testing patterns:

1. **setUp():** Runs before each test function. Deploys fresh contracts for each test, preventing state pollution between tests.

2. **vm.prank():** Sets `msg.sender` for the next call. This allows you to test functions as if you were different users.

3. **vm.expectRevert():** Expects the next call to revert. The test passes if the revert happens; fails if it does not.

4. **assertEq():** Asserts that two values are equal. Foundry provides assertEq for all value types and dynamic types.

5. **Test naming convention:** Functions starting with `test` are test functions. Functions starting with `testFuzz` are fuzz tests.

### Test Coverage

Test coverage measures which lines of code are executed by your tests. The goal is not 100% coverage (which is often impossible and always expensive) but coverage of all critical code paths. In practice, 90%+ line coverage and 80%+ branch coverage is a reasonable target for most smart contracts.

```bash
# Generate coverage report
forge coverage --report lcov

# View coverage in terminal
forge coverage
```

Focus coverage on:

1. **All public/external functions:** Every entry point must be tested. These are the functions that users and other contracts will call.
2. **All error conditions:** Every `require`, `revert`, and custom error must be triggered. Testing only the happy path misses the most critical vulnerabilities.
3. **Edge cases:** Zero values, maximum values, boundary conditions. Many vulnerabilities occur at the boundaries (e.g., transferring exactly the full balance, or calling a function with the maximum allowed amount).
4. **State transitions:** Every state change must be verified. If a function changes the contract's state, the test should verify the state before and after the call.
5. **Access control:** Every modifier must be tested with authorized and unauthorized callers. Verify that unauthorized callers cannot call restricted functions.
6. **Reentrancy paths:** If the contract makes external calls, test that reentrancy is handled correctly.
7. **Gas consumption:** Measure gas for each function to ensure operations do not exceed block gas limits.

Coverage tools like `forge coverage` produce reports showing which lines and branches are covered by tests. Lines that are not covered represent untested code paths: potential locations for undiscovered vulnerabilities. Focus your testing effort on uncovered lines, especially those involving financial calculations or access control.

## Fuzz Testing

Fuzz testing generates random inputs and feeds them to your functions. The goal is to find inputs that cause unexpected behavior: crashes, incorrect state, or violated invariants.

### Property-Based Testing

Property-based testing defines invariants (properties that must always hold) and verifies them against random inputs:

```solidity
contract VaultFuzzTest is Test {
    Vault vault;
    IERC20 token;
    
    function setUp() public {
        vault = new Vault();
        token = new MockToken("MockToken", "MTK", 1000000 ether);
    }
    
    function testFuzz_DepositNeverExceedsBalance(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 10000 ether);
        token.mint(address(this), amount);
        token.approve(address(vault), amount);
        
        vault.deposit(address(token), amount);
        
        assertEq(token.balanceOf(address(vault)), amount);
    }
    
    function testFuzz_WithdrawNeverExceedsDeposit(uint256 deposit, uint256 withdraw) public {
        vm.assume(deposit > 0 && deposit <= 10000 ether);
        vm.assume(withdraw > 0 && withdraw <= deposit);
        
        token.mint(address(this), deposit);
        token.approve(address(vault), deposit);
        vault.deposit(address(token), deposit);
        
        vault.withdraw(address(token), withdraw);
        
        assertEq(vault.deposits(address(this), address(token)), deposit - withdraw);
    }
    
    function testFuzz_TotalDepositsAlwaysEqualsSum(uint256 a, uint256 b) public {
        vm.assume(a > 0 && a <= 5000 ether);
        vm.assume(b > 0 && b <= 5000 ether);
        
        token.mint(address(this), a + b);
        token.approve(address(vault), a + b);
        
        vault.deposit(address(token), a);
        vault.deposit(address(token), b);
        
        assertEq(vault.totalDeposits(address(token)), a + b);
    }
    
    function testFuzz_NoOneCanWithdrawMoreThanTheyDeposited(
        address user, 
        uint256 deposit, 
        uint256 withdraw
    ) public {
        vm.assume(deposit > 0 && deposit <= 10000 ether);
        vm.assume(withdraw > deposit);
        
        vm.deal(user, deposit);
        vm.startPrank(user);
        token.mint(user, deposit);
        token.approve(address(vault), deposit);
        vault.deposit(address(token), deposit);
        
        vm.expectRevert();
        vault.withdraw(address(token), withdraw);
    }
}
```

### Invariant Testing

Foundry's invariant testing is a specialized form of fuzz testing that verifies system-level properties across many function calls:

```solidity
contract VaultInvariantTest is Test {
    Vault vault;
    IERC20 token;
    address[] users;
    
    function setUp() public {
        vault = new Vault();
        token = new MockToken("MockToken", "MTK", 1000000 ether);
        
        for (uint i = 0; i < 5; i++) {
            address user = makeAddr(string(abi.encodePacked("user", i)));
            users.push(user);
            token.mint(user, 10000 ether);
            vm.prank(user);
            token.approve(address(vault), type(uint256).max);
        }
    }
    
    // Invariant: totalDeposits always equals sum of individual deposits
    function invariant_TotalDepositsConsistent() public {
        uint256 totalFromMapping = vault.totalDeposits(address(token));
        uint256 totalCalculated = 0;
        
        for (uint i = 0; i < users.length; i++) {
            totalCalculated += vault.deposits(users[i], address(token));
        }
        
        assertEq(totalFromMapping, totalCalculated);
    }
    
    // Invariant: vault balance never exceeds total deposits
    function invariant_VaultBalanceConsistent() public {
        assertGe(token.balanceOf(address(vault)), vault.totalDeposits(address(token)));
    }
    
    // Invariant: user can never withdraw more than they deposited
    function invariant_NoOverwithdrawal() public {
        for (uint i = 0; i < users.length; i++) {
            assertLe(
                vault.deposits(users[i], address(token)), 
                vault.totalDeposits(address(token))
            );
        }
    }
    
    // Handler: defines the valid function calls that fuzzing should make
    function targetDeposit(uint256 userIndex, uint256 amount) public {
        vm.assume(userIndex < users.length);
        vm.assume(amount > 0 && amount <= 1000 ether);
        
        vm.prank(users[userIndex]);
        vault.deposit(address(token), amount);
    }
    
    function targetWithdraw(uint256 userIndex, uint256 amount) public {
        vm.assume(userIndex < users.length);
        
        uint256 deposited = vault.deposits(users[userIndex], address(token));
        vm.assume(amount > 0 && amount <= deposited);
        
        vm.prank(users[userIndex]);
        vault.withdraw(address(token), amount);
    }
}
```

The `invariant_` functions are run after every sequence of calls generated by the fuzzer. If any invariant is violated, the test fails, and Foundry reports the sequence of calls that caused the failure.

### Fuzz Testing Best Practices

1. **Define meaningful bounds:** Use `vm.assume()` to constrain inputs to realistic ranges. Random `uint256` values are rarely useful.

2. **Test both success and failure paths:** Use `vm.assume()` to generate inputs that should succeed AND inputs that should revert.

3. **Seed reproducibility:** Foundry uses a seed to generate random inputs. If a fuzz test fails, record the seed so you can reproduce the failure.

4. **Run for sufficient iterations:** The default is 256 iterations. For critical code, increase to 10,000 or more.

5. **Use the invariant fuzzer for system-level properties:** The invariant fuzzer is more powerful than simple fuzz tests because it explores sequences of operations, not just individual inputs.

## Formal Verification

Formal verification mathematically proves that a contract satisfies a specification. Unlike testing, which can only show the absence of bugs for the specific inputs tested, formal verification can prove the absence of bugs for ALL possible inputs.

### The Certora Prover

Certora is the most widely used formal verification tool for Solidity. It takes a contract and a specification (written in the Certora Verification Language, CVL) and uses a constraint solver to prove or disprove the specification.

```cvl
// Certora specification for a token contract
methods {
    function totalSupply() external returns (uint256) envfree;
    function balanceOf(address) external returns (uint256) envfree;
    function transfer(address, uint256) external returns (bool);
}

// Rule: total supply never changes
rule totalSupplyNeverChanges(method f) {
    uint256 totalBefore = totalSupply();
    
    env e;
    calldataarg args;
    f(e, args);
    
    uint256 totalAfter = totalSupply();
    assert totalBefore == totalAfter, "Total supply changed";
}

// Rule: transfer preserves total balance
rule transferPreservesTotalBalance(address to, uint256 amount) {
    env e;
    
    uint256 sumBefore = 0;
    uint256 balanceFromBefore = balanceOf(e.msg.sender);
    uint256 balanceToBefore = balanceOf(to);
    
    transfer(e, to, amount);
    
    uint256 balanceFromAfter = balanceOf(e.msg.sender);
    uint256 balanceToAfter = balanceOf(to);
    
    assert balanceFromBefore + balanceToBefore == balanceFromAfter + balanceToAfter,
        "Transfer did not preserve total balance";
}

// Rule: cannot transfer more than balance
rule cannotTransferMoreThanBalance(address to, uint256 amount) {
    env e;
    
    require balanceOf(e.msg.sender) < amount;
    
    transfer@withrevert(e, to, amount);
    
    assert lastReverted, "Should revert when transferring more than balance";
}
```

### Solidity SMTChecker

The SMTChecker is built into the Solidity compiler. It automatically generates formal verification constraints and tries to prove them:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SMTCheckerExample {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount);
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        return true;
    }
}
```

With `--model-checker-engine all`, the compiler attempts to prove:

1. No arithmetic overflow occurs in `balanceOf[to] += amount`.
2. The function always reverts if the balance is insufficient.
3. State transitions are consistent.

The SMTChecker has limitations: it can only handle contracts within a certain complexity bound, and it may not be able to prove properties involving unbounded loops or external calls. But for simple contracts, it provides a useful first-pass verification.

### How to Use Formal Verification

1. **Start with invariants:** Define the properties that must always hold. Examples:
   - Total supply never exceeds the maximum.
   - User balances never exceed total supply.
   - Locked tokens cannot be transferred.
   - Only authorized users can call restricted functions.

2. **Write rules for each function:** For each state-changing function, define what should be true after the function executes.

3. **Run the prover:** The prover will either prove the rule holds for all inputs or provide a counterexample showing how the rule can be violated.

4. **Fix counterexamples:** If the prover finds a counterexample, fix the contract and re-verify.

5. **Iterate:** Formal verification is an iterative process. Start with simple rules and gradually increase complexity.

## Gas Testing

Gas tests verify that contract operations do not exceed gas limits and that gas costs are predictable. Unexpected gas costs can cause transactions to fail or make the contract economically uncompetitive.

```solidity
contract GasTest is Test {
    Vault vault;
    IERC20 token;
    
    function setUp() public {
        vault = new Vault();
        token = new MockToken("MockToken", "MTK", 1000000 ether);
    }
    
    function testGas_Deposit() public {
        token.mint(address(this), 1000 ether);
        token.approve(address(vault), 1000 ether);
        
        uint256 gasBefore = gasleft();
        vault.deposit(address(token), 1000 ether);
        uint256 gasUsed = gasBefore - gasleft();
        
        // Assert gas usage is within acceptable bounds
        assertLe(gasUsed, 100000, "Deposit used too much gas");
    }
    
    function testGas_Withdraw() public {
        token.mint(address(this), 1000 ether);
        token.approve(address(vault), 1000 ether);
        vault.deposit(address(token), 1000 ether);
        
        uint256 gasBefore = gasleft();
        vault.withdraw(address(token), 1000 ether);
        uint256 gasUsed = gasBefore - gasleft();
        
        assertLe(gasUsed, 100000, "Withdraw used too much gas");
    }
    
    function testGas_BatchOperations() public {
        token.mint(address(this), 10000 ether);
        token.approve(address(vault), 10000 ether);
        
        uint256 gasBefore = gasleft();
        for (uint i = 0; i < 10; i++) {
            vault.deposit(address(token), 1000 ether);
        }
        uint256 gasUsed = gasBefore - gasleft();
        
        // Batch operations should be more efficient than individual calls
        assertLe(gasUsed, 500000, "Batch deposit used too much gas");
    }
}
```

## Integration Testing

Integration tests verify that multiple contracts work together correctly. In DeFi, contracts rarely operate in isolation: they interact with tokens, oracles, DEXes, and other protocols.

```solidity
contract IntegrationTest is Test {
    Vault vault;
    LendingPool pool;
    IERC20 token;
    MockOracle oracle;
    
    function setUp() public {
        oracle = new MockOracle();
        token = new MockToken("MockToken", "MTK", 1000000 ether);
        pool = new LendingPool(address(token), address(oracle));
        vault = new Vault();
        
        // Wire contracts together
        vault.setLendingPool(address(pool));
    }
    
    function testDepositAndLend() public {
        // User deposits to vault
        vm.startPrank(alice);
        token.mint(alice, 10000 ether);
        token.approve(address(vault), 10000 ether);
        vault.deposit(address(token), 10000 ether);
        
        // Vault lends deposited tokens to pool
        vault.lendToPool(address(token), 5000 ether);
        
        // Verify state
        assertEq(vault.deposits(alice, address(token)), 10000 ether);
        assertEq(pool.totalDeposits(address(token)), 5000 ether);
        assertEq(token.balanceOf(address(pool)), 5000 ether);
    }
    
    function testBorrowAndRepay() public {
        // Setup: user deposits, vault lends
        vm.startPrank(alice);
        token.mint(alice, 10000 ether);
        token.approve(address(vault), 10000 ether);
        vault.deposit(address(token), 10000 ether);
        vault.lendToPool(address(token), 5000 ether);
        
        // Bob borrows from pool
        vm.stopPrank();
        vm.startPrank(bob);
        token.mint(bob, 1000 ether); // Collateral
        token.approve(address(pool), 1000 ether);
        pool.depositCollateral(address(token), 1000 ether);
        pool.borrow(address(token), 500 ether);
        
        // Verify
        assertEq(token.balanceOf(bob), 500 ether);
        assertEq(pool.totalBorrows(address(token)), 500 ether);
        
        // Bob repays
        token.approve(address(pool), 500 ether);
        pool.repay(address(token), 500 ether);
        
        assertEq(pool.totalBorrows(address(token)), 0);
    }
}
```

## Real Scenario: Testing a Contract

Let us walk through the complete testing process for a real contract: a simple escrow.

**Step 1: Define requirements**

The escrow contract should:

- Accept deposits from a buyer.
- Allow the seller to release funds when goods are delivered.
- Allow the buyer to refund if goods are not delivered.
- Enforce a timeout: if neither party acts, the buyer can refund.
- Charge a 1% fee on release.

**Step 2: Write the contract**

```solidity
contract Escrow {
    address public buyer;
    address public seller;
    uint256 public feePercent = 1;
    uint256 public deadline;
    uint256 public constant MAX_FEE = 5;
    
    enum State { Created, Funded, Released, Refunded, Expired }
    State public state;
    
    constructor(address _seller, uint256 _duration) {
        buyer = msg.sender;
        seller = _seller;
        deadline = block.timestamp + _duration;
        state = State.Created;
    }
    
    function fund() external payable {
        require(state == State.Created, "Not created");
        require(msg.sender == buyer, "Not buyer");
        require(msg.value > 0, "No value");
        state = State.Funded;
    }
    
    function release() external {
        require(state == State.Funded, "Not funded");
        require(msg.sender == seller, "Not seller");
        require(block.timestamp < deadline, "Expired");
        
        uint256 fee = (address(this).balance * feePercent) / 100;
        uint256 sellerAmount = address(this).balance - fee;
        
        state = State.Released;
        
        (bool success1, ) = seller.call{value: sellerAmount}("");
        require(success1, "Seller transfer failed");
        
        (bool success2, ) = payable(buyer).call{value: fee}("");
        require(success2, "Fee transfer failed");
    }
    
    function refund() external {
        require(state == State.Funded, "Not funded");
        require(msg.sender == buyer, "Not buyer");
        
        if (block.timestamp >= deadline) {
            state = State.Expired;
        } else {
            state = State.Refunded;
        }
        
        (bool success, ) = payable(buyer).call{value: address(this).balance}("");
        require(success, "Refund failed");
    }
}
```

**Step 3: Write unit tests**

```solidity
contract EscrowTest is Test {
    Escrow escrow;
    address seller = makeAddr("seller");
    
    function setUp() public {
        escrow = new Escrow(seller, 7 days);
    }
    
    function testFund() public {
        escrow.fund{value: 10 ether}();
        assertEq(address(escrow).balance, 10 ether);
        assertEq(escrow.state(), Escrow.State.Funded);
    }
    
    function testFundNotBuyer() public {
        vm.prank(seller);
        vm.expectRevert("Not buyer");
        escrow.fund{value: 10 ether}();
    }
    
    function testFundZeroValue() public {
        vm.expectRevert("No value");
        escrow.fund{value: 0}();
    }
    
    function testRelease() public {
        escrow.fund{value: 10 ether}();
        
        vm.prank(seller);
        escrow.release();
        
        assertEq(seller.balance, 9.9 ether); // 10 - 1% fee
        assertEq(address(this).balance, 0.1 ether); // Fee
    }
    
    function testReleaseNotFunded() public {
        vm.prank(seller);
        vm.expectRevert("Not funded");
        escrow.release();
    }
    
    function testReleaseNotSeller() public {
        escrow.fund{value: 10 ether}();
        vm.expectRevert("Not seller");
        escrow.release();
    }
    
    function testReleaseExpired() public {
        escrow.fund{value: 10 ether}();
        vm.warp(block.timestamp + 7 days);
        
        vm.prank(seller);
        vm.expectRevert("Expired");
        escrow.release();
    }
    
    function testRefund() public {
        escrow.fund{value: 10 ether}();
        escrow.refund();
        
        assertEq(address(this).balance, 10 ether);
        assertEq(escrow.state(), Escrow.State.Refunded);
    }
    
    function testRefundAfterDeadline() public {
        escrow.fund{value: 10 ether}();
        vm.warp(block.timestamp + 7 days);
        
        escrow.refund();
        
        assertEq(escrow.state(), Escrow.State.Expired);
    }
    
    function testRefundNotBuyer() public {
        escrow.fund{value: 10 ether}();
        vm.prank(seller);
        vm.expectRevert("Not buyer");
        escrow.refund();
    }
}
```

**Step 4: Write fuzz tests**

```solidity
contract EscrowFuzzTest is Test {
    Escrow escrow;
    address seller = makeAddr("seller");
    
    function setUp() public {
        escrow = new Escrow(seller, 7 days);
    }
    
    function testFuzz_FeeNeverExceedsBalance(uint256 deposit) public {
        vm.assume(deposit > 0 && deposit <= 100 ether);
        
        escrow.fund{value: deposit}();
        
        vm.prank(seller);
        escrow.release();
        
        uint256 fee = deposit * 1 / 100;
        uint256 sellerAmount = deposit - fee;
        
        assertEq(seller.balance, sellerAmount);
    }
    
    function testFuzz_RefundAlwaysReturnsFullAmount(uint256 deposit) public {
        vm.assume(deposit > 0 && deposit <= 100 ether);
        
        escrow.fund{value: deposit}();
        escrow.refund();
        
        assertEq(address(this).balance, deposit);
    }
    
    function testFuzz_StateTransitionsAreConsistent(uint256 deposit) public {
        vm.assume(deposit > 0 && deposit <= 100 ether);
        
        assertEq(uint(escrow.state()), uint(Escrow.State.Created));
        
        escrow.fund{value: deposit}();
        assertEq(uint(escrow.state()), uint(Escrow.State.Funded));
        
        escrow.refund();
        assertEq(uint(escrow.state()), uint(Escrow.State.Refunded));
    }
}
```

**Step 5: Run all tests**

```bash
forge test -vvv
```

Review the output for any failures, then run gas reports and coverage:

```bash
forge test --gas-report
forge coverage
```

## Assessment

### Lab 1: Complete Test Suite (120 minutes)

**Objective:** Write a comprehensive test suite for a given contract.

**Tasks:**

1. You are given the following `PriceOracle` contract:

```solidity
contract PriceOracle {
    mapping(address => uint256) public prices;
    mapping(address => bool) public authorizedUpdaters;
    address public owner;
    uint256 public lastUpdate;
    uint256 public constant MIN_UPDATE_INTERVAL = 1 hours;
    
    error NotAuthorized();
    error UpdateTooFrequent();
    error InvalidPrice();
    
    constructor() {
        owner = msg.sender;
    }
    
    function authorizeUpdater(address updater) external {
        require(msg.sender == owner);
        authorizedUpdaters[updater] = true;
    }
    
    function updatePrice(address token, uint256 price) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();
        if (block.timestamp - lastUpdate < MIN_UPDATE_INTERVAL) revert UpdateTooFrequent();
        if (price == 0) revert InvalidPrice();
        
        prices[token] = price;
        lastUpdate = block.timestamp;
    }
    
    function getPrice(address token) external view returns (uint256) {
        return prices[token];
    }
}
```

2. Write a complete test suite with at least 15 tests covering:
   - Deployment (correct owner, no authorized updaters).
   - Authorization (owner can authorize, non-owner cannot).
   - Price updates (authorized updaters can update, unauthorized cannot).
   - Update interval (updates within 1 hour are rejected).
   - Invalid prices (zero price is rejected).
   - View function (returns correct prices).
   - Edge cases (multiple tokens, multiple updaters).

3. Write at least 5 fuzz tests verifying invariants.

4. Write a formal verification specification (either Certora CVL or SMTChecker annotations) for the following properties:
   - Only authorized updaters can change prices.
   - Prices are never zero after an update.
   - The update interval is always respected.

5. Achieve at least 90% line coverage.

**Grading criteria:**
- Test suite is comprehensive and well-organized (30%)
- Fuzz tests verify meaningful invariants (25%)
- Formal verification specifications are correct (20%)
- Coverage meets the 90% target (15%)
- Code quality and documentation (10%)

### Lab 2: Gas Optimization Testing (60 minutes)

**Objective:** Identify gas inefficiencies through testing and optimize them.

**Tasks:**

1. Given the following contract, measure gas for each function:

```solidity
contract GasInefficient {
    mapping(address => uint256[]) public history;
    mapping(address => uint256) public totals;
    
    function record(address user, uint256 amount) external {
        history[user].push(amount);
        uint256 total = 0;
        for (uint i = 0; i < history[user].length; i++) {
            total += history[user][i];
        }
        totals[user] = total;
    }
    
    function getHistory(address user) external view returns (uint256[] memory) {
        return history[user];
    }
    
    function getTotal(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < history[user].length; i++) {
            total += history[user][i];
        }
        return total;
    }
}
```

2. Rewrite the contract with gas optimizations:
   - Cache storage reads in memory.
   - Maintain running totals instead of recalculating.
   - Use calldata instead of memory where appropriate.
   - Pack storage variables if possible.

3. Measure gas for the optimized contract.
4. Create a comparison table showing gas before and after for each function.
5. Write a 300-word analysis of the optimizations.

**Grading criteria:**
- All optimizations correctly implemented (30%)
- Accurate gas measurements (25%)
- Comparison table is clear and complete (20%)
- Analysis is insightful and accurate (15%)
- Code readability maintained (10%)

### Lab 3: Test-Driven Development (90 minutes)

**Objective:** Implement a contract using test-driven development.

**Tasks:**

1. You are given the following specification for a `Raffle` contract:
   - Users can buy tickets for 0.01 ETH each.
   - There is a maximum of 100 tickets per user.
   - The owner can draw a winner after a minimum of 10 tickets are sold.
   - The winner receives 95% of the pot. 5% goes to the owner.
   - If fewer than 10 tickets are sold, all buyers can claim a refund.

2. Write tests FIRST (before writing the contract) that capture these requirements. You should have at least 20 tests.

3. Write the contract to make all tests pass.

4. Add fuzz tests to verify invariants:
   - Total ticket count always equals sum of individual ticket counts.
   - Winner receives exactly 95% of the pot.
   - Refund returns exactly the amount the user paid.

5. Run all tests and verify they pass.

**Grading criteria:**
- Tests are written before the contract (20%)
- All requirements are covered by tests (25%)
- Contract makes all tests pass (25%)
- Fuzz tests verify meaningful invariants (15%)
- Code follows TDD red-green-refactor cycle (15%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Complete test suite** from Lab 1, with coverage report and formal verification specifications.
2. **Gas optimization report** from Lab 2, with before/after comparisons and analysis.
3. **TDD artifacts** from Lab 3, including test-first commits and final passing test suite.
4. **Test strategy document** explaining your approach to testing smart contracts, including coverage targets, fuzz testing strategy, and formal verification priorities.
5. **Bug reports** documenting any issues found during testing, with severity classification and recommended fixes.

These artifacts demonstrate that you can systematically test smart contracts, find vulnerabilities through testing, and build confidence in contract correctness before deployment.
