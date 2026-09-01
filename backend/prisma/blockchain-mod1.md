# Module 1: Blockchain Fundamentals

A blockchain is a distributed, append-only ledger maintained by a network of nodes that agree on a shared state without a central authority. Before you can assess the security of smart contracts or decentralized protocols, you need a working mental model of how blocks are created, how transactions propagate and get finalized, and why certain design decisions in consensus and data structure lead to real attack surfaces. This module gives you that foundation by walking through the internals of Bitcoin and Ethereum, examining Merkle trees, and tracing a single Ether transfer from wallet signature to confirmed state change.

## Why Blockchain Security Is Different

In traditional client-server systems, a compromised database can be rolled back, permissions can be revoked, and traffic can be filtered at the network perimeter. On a public blockchain, code is immutable once deployed, transactions are irreversible, and every node in the world can observe your state transitions. That means vulnerabilities are not theoretical: they are permanent and exploitable at scale. A single reentrancy bug cost Ethereum users over 150 million ETH in 2016. A misconfigured access control on a bridge led to a 600 million dollar loss in 2021. Understanding the low-level mechanics is not optional; it is the prerequisite for every other module in this course.

## Consensus Mechanisms

Consensus is the process by which independent nodes agree on which block is the canonical next block. Without consensus, the network would fork into incompatible histories and lose the property of a single, agreed-upon state. There are three families of consensus you will encounter in production systems: Proof of Work, Proof of Stake, and Byzantine Fault Tolerant algorithms.

### Proof of Work

Proof of Work (PoW) was the first practical solution to the Byzantine Generals Problem applied to digital currency. In PoW, miners compete to solve a computational puzzle: finding a nonce such that the SHA-256 hash of the block header is below a target difficulty. The probability of finding a valid nonce is proportional to the hash rate a miner controls.

The security argument for PoW is economic: rewriting history requires re-mining every block after the point you want to change, which costs real electricity. The longer a transaction has been confirmed, the more cumulative work an attacker must redo to reverse it. This is why exchanges wait for multiple confirmations before crediting a deposit.

Bitcoin uses PoW with a 10-minute block time and a difficulty adjustment every 2016 blocks. The difficulty recalibration targets a 2-week epoch, dynamically adjusting based on the total network hash rate. If hash rate drops (for example, after a mining ban in a major country), blocks slow down until the next difficulty adjustment. If hash rate surges, blocks speed up temporarily.

The critical security properties of PoW are:

1. **Sybil resistance.** You cannot cheaply create many identities to dominate the network. Each identity must burn real energy.
2. **Immutability through cumulative work.** The chain with the most accumulated work is canonical. Reversing a transaction means outpacing the honest network's cumulative work.
3. **Permissionless participation.** Anyone can mine without asking permission, which makes censorship difficult.

The weakness is energy consumption and centralization of mining hardware. ASIC-resistant algorithms (like Ethash, used by Ethereum before the Merge) tried to keep mining accessible to GPU miners, but ultimately proved temporary as specialized hardware caught up.

### Proof of Stake

Proof of Stake (PoS) replaces computational work with economic collateral. Validators lock up a minimum amount of the native currency (32 ETH on Ethereum) as a security deposit. The protocol pseudo-randomly selects a validator to propose the next block, and other validators attest to its validity. If a validator proposes an invalid block or attests to conflicting blocks, their stake is slashed: partially or fully destroyed.

Ethereum's PoS implementation, launched in September 2022 via the Merge, uses a mechanism called LMD-GHOST (Latest Message Driven - Greedy Heaviest Observed Subtree) for fork choice and Casper FFG (Friendly Finality Gadget) for finality. In practical terms, this means:

- **Slot time:** 12 seconds. One validator is randomly selected to propose a block each slot.
- **Epoch:** 32 slots (6.4 minutes). At the end of each epoch, finality is checked.
- **Finality:** A block is finalized when two-thirds of the total staked ETH (by weight) have attested to it across two consecutive epochs. Finalized blocks cannot be reverted without at least one-third of all staked ETH being slashed.

The security model of PoS is different from PoS. In PoW, attacking the network requires ongoing energy expenditure. In PoS, attacking requires acquiring and locking one-third of all staked ETH: a one-time capital cost that is then at risk of slashing. The "nothing at stake" problem (where validators could cheaply support multiple forks) is addressed by slashing conditions that penalize validators who sign conflicting blocks.

A key difference for security assessment: in PoS, validator behavior is monitored by the protocol itself, and misbehavior results in automatic economic penalties. In PoW, the only penalty for misbehavior is wasted electricity. This means PoS has more protocol-level enforcement mechanisms, but also more complexity in the slashing logic.

### Byzantine Fault Tolerant Consensus

BFT algorithms like PBFT (Practical Byzantine Fault Tolerance) and its derivatives (Tendermint, HotStuff) provide immediate finality and can tolerate up to one-third of validators being malicious. Unlike PoW and PoS, where finality is probabilistic (the probability of reversal decreases exponentially with confirmations), BFT consensus gives deterministic finality: once a block is committed, it cannot be reverted.

BFT consensus works through a multi-round communication protocol:

1. **Pre-prepare:** The leader proposes a block.
2. **Prepare:** Validators verify the proposal and broadcast prepare messages.
3. **Commit:** Once a validator receives prepare messages from two-thirds of the network, it broadcasts a commit message.
4. **Finalize:** Once a validator receives commit messages from two-thirds of the network, the block is finalized.

The tradeoff is scalability. BFT algorithms require O(n²) message complexity in the basic form, which limits the validator set to a few hundred nodes in practice. This is why BFT is used in permissioned chains (Hyperledger Fabric) and as a component of hybrid systems (Cosmos uses Tendermint as the consensus engine but limits the active validator set to 150).

For security assessment, BFT systems have a different attack surface: compromised validators can stall the network (liveness attacks) if they control more than one-third of voting power, but they cannot finalize invalid blocks unless they control two-thirds. The communication complexity also means that network partitions can be more disruptive.

## Transactions

A transaction in Bitcoin is a data structure that describes the movement of UTXOs (Unspent Transaction Outputs). Each transaction has inputs (references to previous UTXOs) and outputs (new UTXOs being created). The difference between the sum of inputs and the sum of outputs is the transaction fee, claimed by the miner.

A Bitcoin transaction looks like this conceptually:

```
Input:  txid:3a8f...9c2, output_index: 0, unlocking_script: <signature> <pubkey>
Output: amount: 0.5 BTC, locking_script: OP_DUP OP_HASH160 <pubkeyhash> OP_EQUALVERIFY OP_CHECKSIG
Output: amount: 0.48 BTC, locking_script: OP_DUP OP_HASH160 <pubkeyhash> OP_EQUALVERIFY OP_CHECKSIG
```

The locking script on the output defines the conditions for spending. The unlocking script on the input provides the data to satisfy those conditions. In the most common case, the locking script requires a signature from a specific public key, and the unlocking script provides that signature.

Ethereum transactions are account-based rather than UTXO-based. An Ethereum transaction contains:

- **From:** The sender's address (derived from the public key).
- **To:** The recipient's address (or null for contract creation).
- **Value:** The amount of ETH to transfer (in wei, where 1 ETH = 10^18 wei).
- **Data:** Arbitrary calldata (used to invoke contract functions).
- **Gas limit:** Maximum gas the transaction can consume.
- **Gas price:** Price per unit of gas (in gwei, where 1 gwei = 10^-9 ETH).
- **Nonce:** Sender's transaction count (prevents replay attacks).
- **V, R, S:** The ECDSA signature components.

When you send ETH, the transaction is signed with your private key using ECDSA (Elliptic Curve Digital Signature Algorithm) over the secp256k1 curve. The signature proves you own the private key without revealing it. The transaction is then broadcast to the network, where nodes validate it (checking the signature, nonce, and balance) and add it to the mempool (the pool of pending transactions).

## Blocks

A block is a container for transactions. In Bitcoin, a block consists of:

- **Block header:** Contains the previous block hash, Merkle root of all transactions, timestamp, difficulty target, and nonce.
- **Transaction list:** All transactions included in the block, ordered with the coinbase transaction first.

The block size in Bitcoin is limited to 1 MB (or about 4 MB with SegWit witness data). This limit exists to prevent spam and ensure that nodes can propagate blocks quickly across the network.

In Ethereum, blocks contain:

- **Block header:** Parent hash, state root (root of the state trie), transactions root (root of the transaction trie), receipts root (root of the receipt trie), timestamp, gas limit, gas used, and various other fields.
- **Transaction list:** All transactions executed in this block.
- **Uncle list:** References to stale blocks (Ethereum used to reward uncle blocks to reduce the advantage of miners with lower latency).

Ethereum does not have a hard block size limit. Instead, it has a gas limit per block (currently around 30 million gas). Each transaction specifies how much gas it is willing to use, and the total gas of all transactions in a block cannot exceed the block gas limit. This means the number of transactions per block varies depending on the gas cost of each transaction.

## Merkle Trees

A Merkle tree is a binary hash tree where every leaf node is a hash of a transaction, and every non-leaf node is a hash of its two children. The root of the tree (the Merkle root) is included in the block header. This structure provides efficient and secure verification of transaction inclusion.

The key property: if a single transaction is modified, the Merkle root changes. This means a light client can verify that a transaction is included in a block by downloading only the block header and a logarithmic number of hashes (the Merkle proof), rather than the entire block.

For a block with 1,000 transactions, a Merkle proof requires about 10 hashes (log₂(1000) ≈ 10). Each hash is 32 bytes, so a Merkle proof is roughly 320 bytes: trivial to transmit and verify.

Ethereum uses a modified Merkle structure called a Merkle Patricia Trie for three different tries:

1. **State trie:** Maps every account address to its state (balance, nonce, code hash, storage root).
2. **Transaction trie:** Maps transaction indices to transaction objects.
3. **Receipt trie:** Maps transaction indices to transaction receipts (status, gas used, logs).

The use of a Patricia trie (a radix tree) allows efficient updates, insertions, and lookups on the state, which is critical because Ethereum's state changes with every block.

## Ethereum vs Bitcoin

Bitcoin and Ethereum serve different purposes and make different architectural tradeoffs.

**Bitcoin** is designed as digital gold: a store of value and medium of exchange. Its scripting language is intentionally limited (Turing incomplete) to reduce the attack surface. Bitcoin scripts can enforce conditions like multi-signature requirements, time locks, and hash locks, but they cannot implement arbitrary logic. This limitation is a security feature: the simpler the scripting language, the fewer bugs are possible.

**Ethereum** is designed as a world computer: a platform for arbitrary computation via smart contracts. The Ethereum Virtual Machine (EVM) is Turing complete, meaning it can execute any computable program given enough gas. This flexibility enables decentralized applications (DeFi, NFTs, DAOs) but dramatically increases the attack surface. Every new opcode, every interaction between contracts, and every external call is a potential vulnerability.

The practical differences that matter for security:

| Property | Bitcoin | Ethereum |
|---|---|---|
| UTXO vs Account | UTXO (stateless) | Account (stateful) |
| Scripting | Limited, stack-based | EVM, Turing complete |
| Finality | Probabilistic (6 confirmations ≈ 1 hour) | PoS finality (~15 minutes for 2 epochs) |
| Transaction throughput | ~7 TPS | ~15-30 TPS (Layer 1) |
| Smart contracts | Limited ( multisig, timelocks) | Full programmability |
| Attack surface | Small (script interpreter, P2P) | Large (EVM, precompiles, oracles, bridges) |

For a security assessor, the key insight is that Bitcoin's security model is well-understood and relatively simple: protect your private keys, verify transaction signatures, and wait for sufficient confirmations. Ethereum's security model is vastly more complex: you must understand the EVM execution model, gas mechanics, storage patterns, contract interactions, and the economic incentives of validators and users.

## Real Scenario: Tracing an Ethereum Transaction

Let us walk through what happens when Alice sends 1.5 ETH to Bob's contract, step by step.

**Step 1: Transaction creation**

Alice's wallet constructs a transaction:

```javascript
const tx = {
  from: "0xalice...",
  to: "0xbobcontract...",
  value: ethers.utils.parseEther("1.5"),
  data: "0x",  // empty data = simple ETH transfer
  gasLimit: 21000,
  gasPrice: ethers.utils.parseUnits("30", "gwei"),
  nonce: await provider.getTransactionCount(alice.address),
  chainId: 1,  // Ethereum mainnet
};
```

**Step 2: Signing**

Alice's wallet signs the transaction with her private key. The signing process:

1. RLP-encode the transaction fields (excluding V, R, S).
2. Compute the Keccak-256 hash of the encoded transaction.
3. Sign the hash with the secp256k1 private key.
4. The resulting signature (V, R, S) is appended to the transaction.

The private key never leaves Alice's wallet. The signature proves that Alice authorized this specific transaction on this specific chain (chain ID prevents cross-chain replay attacks).

**Step 3: Broadcasting**

The signed transaction is broadcast to the Ethereum network. Alice's wallet connects to an Ethereum node (either her own or an RPC provider like Infura/Alchemy) and submits the transaction via `eth_sendRawTransaction`. The node validates the transaction:

- Valid signature.
- Nonce matches the sender's current nonce.
- Sender has sufficient balance to cover the value plus gas cost.
- Gas limit is at least 21000 (the minimum for a simple transfer).
- Gas price is above the node's minimum accepted price.

If valid, the node adds the transaction to its mempool and propagates it to peers.

**Step 4: Mempool and front-running**

Before the transaction is mined, it sits in the mempool, which is publicly observable. This creates the front-running attack surface: an attacker can see Alice's pending transaction, and if it interacts with a DEX, the attacker can submit their own transaction with a higher gas price to be included first, profiting from Alice's trade.

For a simple ETH transfer, front-running is not a concern (you cannot front-run a transfer: the recipient is fixed). But for contract interactions, front-running is a critical vulnerability that we will cover in Module 3.

**Step 5: Block inclusion**

A validator proposes a block containing Alice's transaction. The validator checks the transaction, executes it, and includes it in the block. The execution:

1. Deduct 1.5 ETH from Alice's balance.
2. Add 1.5 ETH to Bob's contract balance.
3. Deduct gas cost (21000 gas × 30 gwei = 0.00063 ETH) from Alice's balance.
4. Credit the gas cost to the validator.

The state trie is updated with new balances for Alice, Bob's contract, and the validator.

**Step 6: Confirmation and finality**

The block is added to the chain. Other validators attest to the block. After two epochs (~15 minutes), the block is finalized: meaning it cannot be reverted without at least one-third of all staked ETH being slashed.

For a simple transfer, 12-30 confirmations (2-6 minutes) is generally considered safe for most purposes. For high-value transfers, waiting for finality is recommended.

**Step 7: Receipt**

Alice's wallet receives a transaction receipt containing:

- **status:** 1 (success) or 0 (revert).
- **gasUsed:** Actual gas consumed (21000 for a simple transfer).
- **logs:** Events emitted during execution (none for a simple transfer).
- **blockNumber:** The block containing the transaction.
- **transactionHash:** The unique identifier of the transaction.

Alice can verify the receipt to confirm that the transaction succeeded and the ETH was transferred. The transaction hash is a permanent, immutable record of the transfer. Anyone can look up this hash on Etherscan or any other block explorer to verify the transaction details independently. This transparency is a core property of public blockchains: every transaction is publicly verifiable, though the identities behind the addresses remain pseudonymous.

## Gas Economics

Gas is Ethereum's mechanism for allocating computational resources and preventing denial-of-service attacks. Every operation in the EVM has a fixed gas cost. When you submit a transaction, you specify a gas limit (maximum gas you are willing to spend) and a gas price (how much you pay per unit of gas). The total cost is gas_used × gas_price.

The gas limit exists to prevent infinite loops. If a contract contains a loop that never terminates, the transaction will run out of gas and revert. The gas cost of each operation is designed to reflect its computational cost:

- Adding two numbers: 3 gas
- Reading storage: 2100 gas (cold) / 100 gas (warm)
- Writing to storage: 20,000 gas (new) / 2,900 gas (update)
- Creating a contract: 32,000 gas + data cost

Understanding gas costs is critical for security assessment because gas griefing attacks exploit underpriced operations. If a contract allows external calls with a fixed gas stipend, an attacker can craft a recipient contract that consumes more gas than expected, causing the caller to overpay or fail.

Post-EIP-1559, the gas price is split into a base fee (burned, set by the protocol based on block utilization) and a priority fee (paid to the validator, set by the user). This creates a more predictable fee market and reduces the effectiveness of gas price manipulation attacks.

## Assessment

### Lab 1: Transaction Analysis (45 minutes)

**Objective:** Trace a real Ethereum transaction and identify its components.

**Tasks:**

1. Go to Etherscan and find a transaction that interacted with a smart contract (not a simple ETH transfer). Record the transaction hash.
2. Identify the following fields: sender, recipient (contract address), value, gas limit, gas used, status, and input data.
3. Decode the input data using the contract's ABI (available on Etherscan). What function was called? What were the arguments?
4. Find the block number and timestamp. How many confirmations does this transaction have?
5. Examine the internal transactions. Were there any sub-calls to other contracts?
6. Write a 500-word analysis of what this transaction accomplished, including any security observations.

**Grading criteria:**
- Correct identification of all transaction fields (30%)
- Accurate ABI decoding (25%)
- Identification of internal calls and their purpose (25%)
- Quality of security observations (20%)

### Lab 2: Merkle Proof Verification (60 minutes)

**Objective:** Implement a Merkle proof verifier in Python.

**Tasks:**

1. Write a Python function that computes the Keccak-256 hash of arbitrary data.
2. Implement a Merkle tree builder that takes a list of transaction hashes and returns the Merkle root.
3. Implement a Merkle proof verifier that takes a leaf hash, a proof (list of sibling hashes and positions), and the Merkle root, and returns whether the proof is valid.
4. Create a test dataset with at least 16 transactions.
5. Generate a valid proof for one leaf and verify it.
6. Modify one bit of the leaf hash and verify that the proof fails.
7. Measure the proof size for trees of depth 10, 20, and 30.

**Grading criteria:**
- Correct Merkle tree construction (30%)
- Correct proof verification (30%)
- Proper handling of edge cases (odd number of leaves) (20%)
- Performance measurement and analysis (20%)

### Lab 3: Consensus Comparison (30 minutes)

**Objective:** Analyze the security properties of different consensus mechanisms.

**Tasks:**

1. A PoW network has 100 EH/s of total hash rate. An attacker has 40 EH/s. What is the probability that the attacker can create 6 confirmations faster than the honest network? Use the formula P = (q/p)^z where q is attacker hash rate ratio and z is confirmations.
2. A PoS network has 10 million ETH staked. An attacker acquires 3.4 million ETH (34%). Can they finalize invalid blocks? Can they prevent finality? What is the slashing penalty?
3. A BFT network has 100 validators. How many must be compromised to prevent finality? To finalize invalid blocks? What happens to liveness if 35 validators go offline simultaneously?
4. Write a 300-word comparison of which consensus mechanism is most appropriate for a high-value financial application, justifying your choice.

**Grading criteria:**
- Correct probability calculation (25%)
- Correct analysis of PoS attack scenarios (25%)
- Correct analysis of BFT fault tolerance (25%)
- Quality of comparative analysis (25%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Transaction analysis report** from Lab 1, including the transaction hash and decoded input data.
2. **Merkle proof implementation** from Lab 2, with test cases and proof size measurements.
3. **Consensus security comparison** from Lab 3, with calculations and recommendations.
4. **Annotated diagrams** of the Ethereum transaction lifecycle, from creation to finality.
5. **Gas cost breakdown** of at least 5 different transaction types, showing how gas allocation affects transaction cost.

These artifacts demonstrate that you understand the foundational mechanics of blockchain systems, which is the basis for all subsequent security analysis work in this course.
