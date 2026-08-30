# Module 2 — Ethereum and Smart Contracts: Solidity Basics

## What You'll Actually Do

Write, compile, and deploy a smart contract on a local test chain. You'll learn Solidity syntax by building a simple escrow contract — where two parties lock funds and a third party releases them. This covers the core language features: state variables, functions, modifiers, events, and the critical difference between `view` and state-changing calls.

---

## Solidity Fundamentals

Solidity is a statically-typed, contract-oriented language that compiles to EVM bytecode. It looks like JavaScript but behaves nothing like it.

### Contract Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    // State variables stored on-chain (costs gas to write)
    address public buyer;
    address public seller;
    address public arbiter;
    uint256 public amount;
    bool public released;

    // Events — off-chain log entries, much cheaper than storage
    event FundsDeposited(address buyer, uint256 amount);
    event FundsWithdrawn(address to, uint256 amount);
    event FundsReleased(address arbiter, address to, uint256 amount);

    // Modifiers — reusable precondition checks
    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter can call this");
        _;
    }

    // Constructor runs once at deploy time
    constructor(address _seller, address _arbiter) {
        buyer = msg.sender;
        seller = _seller;
        arbiter = _arbiter;
        released = false;
    }

    // Payable function — can receive ETH
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        require(msg.sender == buyer, "Only buyer can deposit");
        amount += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    // View function — reads state, no gas cost when called externally
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // State-changing function — costs gas
    function releaseToSeller() external onlyArbiter {
        require(amount > 0, "No funds to release");
        released = true;
        (bool sent, ) = seller.call{value: amount}("");
        require(sent, "Transfer failed");
        emit FundsReleased(msg.sender, seller, amount);
    }

    // Refund buyer if deal falls through
    function refundBuyer() external onlyArbiter {
        require(amount > 0, "No funds to refund");
        (bool sent, ) = buyer.call{value: amount}("");
        require(sent, "Transfer failed");
        emit FundsWithdrawn(buyer, amount);
    }
}
```

### Key Concepts

**State variables** live on-chain. Reading them is free (via `view`/`pure`). Writing them costs gas because every node must update their copy.

**`msg.sender`** is the address calling the function. **`msg.value`** is the ETH sent with the call. These are set by the EVM — you can't fake them.

**`require()`** reverts the entire transaction if the condition is false. All state changes are rolled back, but gas is consumed.

**`view` functions** don't modify state and can be called for free off-chain. **`pure` functions** don't even read state.

**Events** are logs. They're cheap to write and can be filtered by address and topic. Off-chain services (indexers, UIs) read events — don't use storage for data you only need to display.

---

## The EVM Execution Model

Every transaction executes in a sandboxed environment. Each operation (opcode) costs gas. The total gas used × gas price = transaction fee.

```
Transaction flow:
1. Caller signs tx with private key
2. Tx enters mempool
3. Validator executes tx in EVM
4. EVM runs opcodes sequentially
5. If any opcode reverts, entire tx reverts
6. Gas consumed × gas price = fee paid to validator
7. State changes committed to world state
```

### Gas Costs to Remember

| Operation | Gas Cost |
|-----------|----------|
| SSTORE (write to storage) | 20,000 (new) / 5,000 (update) |
| SLOAD (read from storage) | 2,100 |
| Transaction base | 21,000 |
| LOG (emit event) | 375 + 375 per topic + 8 per byte of data |
| CALL (external call) | 100 + cost of called function |

This is why you never store data on-chain that you don't need to. Storage is expensive.

---

## Hands-On: Deploy and Test the Escrow

```bash
# Initialize a Hardhat project
npx hardhat init
npm install @nomicfoundation/hardhat-toolbox

# Compile the contract
npx hardhat compile
```

```javascript
// test/Escrow.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
  let escrow, buyer, seller, arbiter;

  beforeEach(async () => {
    [buyer, seller, arbiter] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(seller.address, arbiter.address);
  });

  it("should accept deposits from buyer", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });
    expect(await escrow.getBalance()).to.equal(ethers.parseEther("1"));
  });

  it("should reject deposits from non-buyer", async () => {
    await expect(
      escrow.connect(seller).deposit({ value: ethers.parseEther("1") })
    ).to.be.revertedWith("Only buyer can deposit");
  });

  it("should release funds to seller", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("2") });
    const balanceBefore = await ethers.provider.getBalance(seller.address);
    await escrow.connect(arbiter).releaseToSeller();
    const balanceAfter = await ethers.provider.getBalance(seller.address);
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("2"));
  });

  it("should refund buyer", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });
    await escrow.connect(arbiter).refundBuyer();
    expect(await escrow.getBalance()).to.equal(0);
  });
});
```

```bash
npx hardhat test
```

---

## Assessment

**Lab Task — Escrow Contract with Time Lock**

Extend the escrow contract with a time-lock feature: if the arbiter doesn't release or refund within 7 days, the buyer can claim a refund directly.

1. Add a `deadline` state variable set to `block.timestamp + 7 days` on deposit
2. Add a `claimRefund()` function that checks `block.timestamp > deadline`
3. Write tests for both the happy path (arbiter releases) and the timeout path (buyer claims)
4. Deploy to the Hardhat local network and interact via the console

**Time:** 60 minutes

**Grading (10 points):**
- 3 points: Time-lock logic correctly implemented with `block.timestamp` comparison
- 3 points: `claimRefund()` properly guarded and tested
- 2 points: Tests cover both paths (release and timeout)
- 2 points: Contract compiles and all tests pass

**Evidence:** Hardhat test output showing all passing tests, console session showing deployment and interaction.
