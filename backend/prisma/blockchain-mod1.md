# Module 1 — Blockchain Fundamentals: Consensus, Transactions, and Blocks

## What You'll Actually Do

You'll trace a transaction from the moment a user signs it to the moment it's finalized on-chain. You'll run a local dev chain, mine blocks, inspect the block structure, and build a simple consensus simulator in Python. The goal is to understand exactly what a blockchain does under the hood — not the marketing version, the actual mechanics.

---

## How a Blockchain Actually Works

A blockchain is a append-only ledger of transactions, grouped into blocks, linked by cryptographic hashes. Every node in the network holds a copy. The hard problem isn't storing data — it's getting thousands of nodes to agree on what the ledger says. That's consensus.

### Block Structure

Every block contains:
- **Block header**: parent hash, timestamp, nonce, Merkle root of transactions
- **Transaction list**: ordered set of transactions included by the miner/validator
- **State root**: snapshot of the account state after executing all transactions

```
┌──────────────────────────────────────┐
│              BLOCK HEADER            │
│  parent_hash: 0x3a7f...c2           │
│  timestamp: 1693459200              │
│  nonce: 0x000000004b21f3            │
│  merkle_root: 0x8e2a...d1           │
│  state_root: 0x1c4b...e9            │
├──────────────────────────────────────┤
│          TRANSACTIONS                │
│  tx1: Alice → Bob, 2 ETH            │
│  tx2: Bob → Carol, 1 ETH            │
│  tx3: Dave → Alice, 0.5 ETH         │
└──────────────────────────────────────┘
```

### Transaction Lifecycle

1. User signs a transaction with their private key
2. Transaction is broadcast to the network via gossip protocol
3. Nodes validate the transaction (signature, nonce, balance)
4. Transactions sit in the mempool until a validator picks them up
5. Validator executes transactions, updates state, produces a block
6. Block propagates to the network, other nodes verify and accept it
7. After enough confirmations, the transaction is considered final

### Consensus Mechanisms

**Proof of Work (PoW)**: Miners compete to solve a hash puzzle. First to find a nonce that produces a hash below the difficulty target wins the block reward. Energy-intensive but battle-tested.

```
Block hash = SHA256(parent_hash + timestamp + merkle_root + nonce)

Target: hash must start with N zeros
Difficulty 10: hash < 0x0000000000000000000000000000000000000000000000000000000000000000

Miner tries: nonce = 1 → hash = 8f3a... (too high)
Miner tries: nonce = 2 → hash = 2b1c... (too high)
Miner tries: nonce = 3 → hash = 000000000000000000000000000000000000000000000000000000001f7e → valid!
```

**Proof of Stake (PoS)**: Validators lock up ETH as collateral. The protocol selects a validator to propose the next block based on their stake. Cheating gets you slashed — you lose your staked ETH.

```
Validator weight = staked ETH
Selection probability = validator_stake / total_staked

If validator proposes invalid block:
  Slashing penalty = up to 100% of stake
```

**Byzantine Fault Tolerance (BFT)**: Nodes vote on blocks. If 2/3+ of validators agree, the block is finalized. No forking, instant finality, but doesn't scale well to thousands of nodes.

---

## Hands-On: Running a Local Dev Chain

You'll use Ganache to spin up a local Ethereum blockchain with pre-funded accounts.

```bash
# Install Ganache CLI
npm install -g ganache

# Start a local chain with 10 accounts, each with 100 ETH
ganache --wallet.seed "test-seed-phrase" --chain.totalAccounts 10

# Output shows:
# - RPC URL: http://127.0.0.1:8545
# - Chain ID: 1337
# - Account addresses and private keys
# - Mnemonic phrase
```

```javascript
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

async function inspectChain() {
  const blockNumber = await provider.getBlockNumber();
  console.log("Current block:", blockNumber);

  const block = await provider.getBlock(blockNumber);
  console.log("Block hash:", block.hash);
  console.log("Parent hash:", block.parentHash);
  console.log("Timestamp:", new Date(block.timestamp * 1000).toISOString());
  console.log("Gas used:", block.gasUsed.toString());
  console.log("Transactions:", block.transactions.length);

  // Inspect each transaction
  for (const txHash of block.transactions) {
    const tx = await provider.getTransaction(txHash);
    console.log(`\nTx: ${txHash}`);
    console.log(`  From: ${tx.from}`);
    console.log(`  To: ${tx.to}`);
    console.log(`  Value: ${ethers.formatEther(tx.value)} ETH`);
    console.log(`  Gas price: ${ethers.formatUnits(tx.gasPrice, "gwei")} gwei`);
  }
}

inspectChain();
```

---

## Hands-On: Building a Consensus Simulator

Build a simple Python script that simulates PoW mining. This makes the mechanics concrete.

```python
import hashlib
import time
import json

class Block:
    def __init__(self, index, transactions, parent_hash, difficulty):
        self.index = index
        self.transactions = transactions
        self.parent_hash = parent_hash
        self.difficulty = difficulty
        self.nonce = 0
        self.timestamp = int(time.time())
        self.hash = self.compute_hash()

    def compute_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "transactions": self.transactions,
            "parent_hash": self.parent_hash,
            "nonce": self.nonce,
            "timestamp": self.timestamp,
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def mine(self):
        target = "0" * self.difficulty
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.compute_hash()
        return self.hash


class Blockchain:
    def __init__(self, difficulty=4):
        self.difficulty = difficulty
        self.chain = [self.create_genesis()]

    def create_genesis(self):
        return Block(0, ["genesis"], "0" * 64, self.difficulty)

    def add_block(self, transactions):
        parent = self.chain[-1]
        new_block = Block(
            index=len(self.chain),
            transactions=transactions,
            parent_hash=parent.hash,
            difficulty=self.difficulty,
        )
        print(f"Mining block {new_block.index}...")
        start = time.time()
        new_block.mine()
        elapsed = time.time() - start
        print(f"  Mined in {elapsed:.2f}s | Hash: {new_block.hash[:16]}...")
        self.chain.append(new_block)


# Run it
bc = Blockchain(difficulty=4)
bc.add_block(["Alice -> Bob: 5 ETH", "Carol -> Dave: 2 ETH"])
bc.add_block(["Dave -> Alice: 1 ETH"])

for block in bc.chain:
    print(f"Block {block.index}: {block.hash[:16]}... (nonce={block.nonce})")
```

**What to observe**: Higher difficulty = exponentially more mining time. This is why PoW consumes so much energy — the security comes from making it expensive to produce blocks.

---

## Assessment

**Lab Task — Transaction Trace and Consensus Comparison**

1. Start a Ganache local chain and send 3 ETH between accounts using ethers.js
2. Inspect the transaction receipt — document the gas used, gas price, and effective cost
3. Run the Python consensus simulator with difficulty 2, 4, and 6 — record mining times
4. Write a 1-page comparison of PoW vs PoS vs BFT: when each makes sense, what each trades off

**Time:** 60 minutes

**Grading (10 points):**
- 3 points: Transaction sent and receipt correctly inspected with all fields documented
- 3 points: Consensus simulator runs correctly, timing data recorded for all three difficulty levels
- 3 points: Comparison covers real tradeoffs (not just "PoW uses energy")
- 1 point: Clean code and clear documentation

**Evidence:** Screenshots of Ganache transaction receipt, Python simulator output with timing data, comparison document.
