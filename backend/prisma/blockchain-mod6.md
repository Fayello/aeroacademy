# Module 6 — Wallet Security: Key Management and Multi-Sig

## What You'll Actually Do

You will implement secure key management systems, set up multi-signature wallets, recover wallets from leaked private keys, and harden wallet infrastructure against common attack vectors like seed phrase theft and key generation weaknesses.

## Key Management Fundamentals

A wallet is only as secure as the randomness behind its keys. Poor entropy sources produce predictable keys that get drained.

### Weak vs Strong Key Generation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureCheckerLib.sol";

contract WeakWallet {
    // NEVER DO THIS — predictable private keys
    function generatePrivateKey(uint256 seed) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(seed)));
    }

    // NEVER DO THIS — using block.timestamp
    function generateFromBlock() public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao)));
    }
}

contract SecureWallet {
    ECDSA internal constant _ECDSA = ECDSA.recover;

    // Generate key pair from secure entropy
    function generateSecureKey(
        bytes32 entropy,
        uint256 index
    ) public pure returns (uint256 privateKey) {
        // Derive using BIP-32-like path with KMAC
        bytes32 derived = keccak256(
            abi.encodePacked("wallet", entropy, index)
        );
        privateKey = uint256(derived);

        // Ensure key is in valid secp256k1 range
        require(
            privateKey > 0 && privateKey < 115792089237316195423570985008687907852837564279074904382605163141518161494337,
            "Invalid key range"
        );
    }

    function signMessage(
        uint256 privateKey,
        bytes32 message
    ) public pure returns (bytes memory) {
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }
}
```

## Multi-Signature Wallet Setup

Multi-sig wallets require multiple approvals before executing a transaction. This eliminates single points of failure.

### Minimal Multi-Sig Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 approvalCount;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    mapping(uint256 => mapping(address => bool)) public approvals;
    Transaction[] public transactions;

    uint256 public required;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier onlyAfterTimelock(uint256 txId) {
        require(
            block.timestamp >= transactions[txId].createdAt + TIMELock,
            "Timelock active"
        );
        _;
    }

    uint256 public constant TIMELock = 1 days;
    uint256 public nonce;

    constructor(address[] memory _owners, uint256 _required) payable {
        require(_owners.length > 0, "Owners required");
        require(
            _required > 0 && _required <= _owners.length,
            "Invalid required count"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner returns (uint256) {
        uint256 txId = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            approvalCount: 0
        }));

        emit TransactionSubmitted(txId, _to, _value);
        return txId;
    }

    function approveTransaction(uint256 _txId) public onlyOwner {
        require(!approvals[_txId][msg.sender], "Already approved");
        require(!transactions[_txId].executed, "Already executed");

        approvals[_txId][msg.sender] = true;
        transactions[_txId].approvalCount++;

        emit TransactionApproved(_txId, msg.sender);

        if (transactions[_txId].approvalCount >= required) {
            _executeTransaction(_txId);
        }
    }

    function _executeTransaction(uint256 _txId) internal {
        Transaction storage txn = transactions[_txId];
        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Execution failed");

        emit TransactionExecuted(_txId);
    }

    // Revoke approval before execution
    function revokeApproval(uint256 _txId) public onlyOwner {
        require(approvals[_txId][msg.sender], "Not approved");
        require(!transactions[_txId].executed, "Already executed");

        approvals[_txId][msg.sender] = false;
        transactions[_txId].approvalCount--;
    }

    // Emergency owner removal
    function removeOwner(address _owner) public onlyOwner {
        require(isOwner[_owner], "Not owner");
        require(owners.length - 1 >= required, "Cannot go below threshold");

        isOwner[_owner] = false;

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(_owner);
    }

    receive() external payable {}
}
```

## Seed Phrase and Key Storage

```python
# BIP-39 mnemonic generation with proper entropy
from mnemonic import Mnemonic
import hashlib
import os

def generate_secure_mnemonic(strength=256):
    """Generate mnemonic with CSPRNG entropy"""
    entropy = os.urandom(strength // 8)
    mnemo = Mnemonic("english")
    return mnemo.to_mnemonic(entropy)

def derive_key_from_mnemonic(mnemonic_phrase, path="m/44'/60'/0'/0/0"):
    """Derive Ethereum key from mnemonic using BIP-44 path"""
    from eth_account import Account
    from bip_utils import Bip39MnemonicDecoder, Bip44

    # Decode mnemonic to seed
    mnemo = Mnemonic("english")
    seed = mnemo.to_seed(mnemonic_phrase)

    # Derive using BIP-44
    bip44_ctx = Bip44.FromSeed(seed, Bip44Coins.ETHEREUM)
    child = bip44_ctx.DerivePath(path)

    private_key = child.PrivateKey().Raw().ToHex()
    return private_key

def validate_mnemonic_strength(mnemonic_phrase):
    """Verify mnemonic entropy matches expected strength"""
    mnemo = Mnemonic("english")
    words = mnemonic_phrase.split()

    if len(words) == 12:
        return 128  # 128-bit entropy
    elif len(words) == 24:
        return 256  # 256-bit entropy
    else:
        raise ValueError(f"Invalid mnemonic length: {len(words)} words")

# Never store raw keys in files — use encrypted keystores
from eth_account import Account

def create_encrypted_keystore(password, private_key):
    """Create encrypted keystore file (Web3 Secret Storage)"""
    account = Account.from_key(private_key)
    keystore = account.encrypt(password)
    return keystore
```

## Key Recovery Patterns

```solidity
// Social recovery — guardians can restore wallet
contract SocialRecoveryWallet {
    address public owner;
    mapping(address => bool) public guardians;
    uint256 public guardianCount;
    uint256 public constant REQUIRED_CONFIRMATIONS = 3;

    mapping(bytes32 => uint256) public recoveryConfirmations;
    mapping(bytes32 => mapping(address => bool)) public guardianConfirmed;

    modifier onlyGuardian() {
        require(guardians[msg.sender], "Not guardian");
        _;
    }

    constructor(address[] memory _guardians) payable {
        owner = msg.sender;
        for (uint256 i = 0; i < _guardians.length; i++) {
            guardians[_guardians[i]] = true;
            guardianCount++;
        }
    }

    function initiateRecovery(address newOwner) external onlyGuardian {
        bytes32 recoveryHash = keccak256(abi.encodePacked(newOwner));

        require(!guardianConfirmed[recoveryHash][msg.sender], "Already confirmed");
        guardianConfirmed[recoveryHash][msg.sender] = true;
        recoveryConfirmations[recoveryHash]++;

        if (recoveryConfirmations[recoveryHash] >= REQUIRED_CONFIRMATIONS) {
            owner = newOwner;
            emit WalletRecovered(newOwner);
        }

        emit RecoveryInitiated(newOwner, msg.sender);
    }

    // Guardian management
    function addGuardian(address guardian) external onlyOwner {
        require(!guardians[guardian], "Already guardian");
        guardians[guardian] = true;
        guardianCount++;
    }

    function removeGuardian(address guardian) external onlyOwner {
        require(guardians[guardian], "Not guardian");
        guardians[guardian] = false;
        guardianCount--;
    }
}
```

## Assessment

**Lab Task:** Deploy a 3-of-5 multi-sig wallet, submit a transaction requiring approval from three different signers, then implement a social recovery mechanism that allows guardians to replace a compromised owner key. Document every step.

**Time:** 90 minutes

**Grading:**
- Multi-sig deployment with correct threshold (20 points)
- Transaction submission and multi-party approval flow (25 points)
- Social recovery mechanism with guardian confirmation (25 points)
- Key generation using secure entropy (15 points)
- Written analysis of key management risks mitigated (15 points)

## Evidence

- Multi-sig wallet contract with deployment configuration
- Transaction approval flow demonstration
- Social recovery execution showing owner replacement
- Secure key generation script or contract
- Risk analysis document covering key management threats
