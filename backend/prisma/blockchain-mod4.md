# Module 4 — Smart Contract Testing: Unit Tests, Fuzzing, and Formal Verification

## What You'll Actually Do

Write a comprehensive test suite for a smart contract using Hardhat, then fuzz it with Echidna, and check critical properties with the Certora prover. You'll learn that unit tests catch obvious bugs, fuzzing catches edge cases you didn't think of, and formal verification catches the entire class of bugs at once.

---

## Unit Testing with Hardhat

Unit tests call individual functions and verify outcomes. They're fast, deterministic, and catch 80% of bugs. The other 20% is where fuzzing and formal verification come in.

```javascript
// test/Vault.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Vault", function () {
  async function deployVaultFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy();
    return { vault, owner, alice, bob };
  }

  describe("Deposits", function () {
    it("should accept ETH and track balance", async () => {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
      expect(await vault.balances(alice.address)).to.equal(ethers.parseEther("1"));
    });

    it("should emit Deposited event", async () => {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(alice).deposit({ value: ethers.parseEther("1") }))
        .to.emit(vault, "Deposited")
        .withArgs(alice.address, ethers.parseEther("1"));
    });

    it("should reject zero-value deposits", async () => {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(alice).deposit({ value: 0 })).to.be.revertedWith(
        "Must send ETH"
      );
    });
  });

  describe("Withdrawals", function () {
    it("should withdraw full balance", async () => {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      await vault.connect(alice).deposit({ value: ethers.parseEther("2") });
      const balanceBefore = await ethers.provider.getBalance(alice.address);
      const tx = await vault.connect(alice).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(alice.address);
      expect(balanceAfter + gasCost - balanceBefore).to.equal(ethers.parseEther("2"));
    });

    it("should revert on zero balance withdrawal", async () => {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(alice).withdraw()).to.be.revertedWith("No balance");
    });
  });

  describe("Edge Cases", function () {
    it("should handle multiple deposits from same user", async () => {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
      await vault.connect(alice).deposit({ value: ethers.parseEther("2") });
      expect(await vault.balances(alice.address)).to.equal(ethers.parseEther("3"));
    });

    it("should handle concurrent users", async () => {
      const { vault, alice, bob } = await loadFixture(deployVaultFixture);
      await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
      await vault.connect(bob).deposit({ value: ethers.parseEther("3") });
      expect(await vault.balances(alice.address)).to.equal(ethers.parseEther("1"));
      expect(await vault.balances(bob.address)).to.equal(ethers.parseEther("3"));
    });
  });
});
```

**Key patterns:**
- Use `loadFixture` to snapshot and revert state between tests — avoids test pollution
- Test the happy path AND the revert paths
- Check events, not just state changes
- Calculate exact gas costs for withdrawal tests

---

## Fuzzing with Echidna

Echidna is a property-based fuzzer for Solidity. You define invariants (properties that must always hold), and Echidna tries to break them by calling random sequences of functions with random inputs.

```solidity
// contracts/Vault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vault {
    mapping(address => uint256) public balances;
    uint256 public totalDeposited;

    function deposit() external payable {
        require(msg.value > 0);
        balances[msg.sender] += msg.value;
        totalDeposited += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(amount > 0);
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        totalDeposited -= amount;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent);
    }

    // Invariant: totalDeposited must equal sum of all balances
    // (Echidna checks this automatically)
}
```

```yaml
# echidna-config.yaml
testMode: "property"
testLimit: 50000
prefix: "echidna_"
```

```solidity
// test/EchidnaTest.sol
contract EchidnaTest {
    Vault vault = new Vault();
    address[] users;

    // This must ALWAYS return true, or Echidna found a bug
    function echidna_total_matches_balances() public view returns (bool) {
        return vault.totalDeposited() >= 0;
    }

    // State-changing invariant check
    function check_total_consistency() public {
        // If this ever fails, Echidna reports it
    }

    function fossil_deposit() external payable {
        vault.deposit{value: msg.value}();
    }

    function fossil_withdraw(uint256 amount) external {
        if (address(this).balance >= amount) {
            vault.withdraw(amount);
        }
    }
}
```

```bash
# Run Echidna
echidna test/EchidnaTest.sol --contract EchidnaTest --config echidna-config.yaml
```

Echidna will call your functions thousands of times with random inputs and sequences. If any invariant returns false, it reports the sequence of calls that broke it.

---

## Formal Verification with Certora

Formal verification proves that properties hold for ALL possible inputs — not just the ones a fuzzer tries. The Certora Prover encodes your contract and properties as a mathematical formula and checks if a violating input exists.

```solidity
// specs/Vault.spec
methods {
    function balances(address) returns (uint256) envfree;
    function totalDeposited() returns (uint256) envfree;
}

// Property: totalDeposited is always >= 0
rule totalDepositedNonNegative(method f) {
    uint256 totalBefore = totalDeposited();
    env e;
    calldataarg args;
    f(e, args);
    uint256 totalAfter = totalDeposited();
    assert totalAfter >= 0, "totalDeposited went negative";
}

// Property: only the depositor can withdraw their funds
rule onlyOwnerCanWithdraw(method f) {
    address user;
    uint256 balanceBefore = balances(user);
    env e;
    calldataarg args;
    f(e, args);
    uint256 balanceAfter = balances(user);
    // Balance can only decrease if the user themselves called withdraw
    assert balanceAfter < balanceBefore => e.msg.sender == user,
        "Balance decreased without user calling withdraw";
}

// Property: withdraw cannot increase a user's balance
rule withdrawNeverIncreasesBalance() {
    address user;
    uint256 balanceBefore = balances(user);
    env e;
    uint256 amount;
    withdraw(e, amount);
    uint256 balanceAfter = balances(user);
    assert balanceAfter <= balanceBefore, "Withdraw increased balance";
}
```

```bash
certoraRun contracts/Vault.sol --verify Vault:specs/Vault.spec
```

If the prover finds a violation, it provides a counterexample — a specific sequence of calls and inputs that breaks the property. This is stronger than fuzzing because it's exhaustive.

---

## Assessment

**Lab Task — Test, Fuzz, and Verify a Token Contract**

You're given an ERC-20 token contract. Build a three-layer testing strategy:

1. Write unit tests covering: `transfer`, `approve`, `transferFrom`, edge cases (zero amounts, self-transfer, approve race)
2. Write an Echidna test contract with at least 3 invariants (total supply consistency, balance non-negativity, allowance integrity)
3. Write 2 Certora rules verifying that transferFrom cannot increase the caller's balance and that total supply is conserved

**Time:** 75 minutes

**Grading (10 points):**
- 3 points: Unit tests cover all required functions and edge cases, all passing
- 3 points: Echidna invariants are meaningful and the fuzzer runs without finding violations
- 2 points: Certora rules are correct and the prover verifies them
- 2 points: Tests are well-organized with clear descriptions

**Evidence:** Hardhat test output, Echidna run output with test limit reached, Certora verification report.
