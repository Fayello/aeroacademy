# Module 7 — Exchange Security: Hot/Cold Storage and Withdrawal Policies

## What You'll Actually Do

You will design exchange-grade custody systems with hot/cold wallet separation, implement withdrawal controls with rate limiting and anomaly detection, and build monitoring systems that detect suspicious fund movements before they leave the platform.

## Hot/Cold Wallet Architecture

Hot wallets hold small balances for daily operations. Cold wallets store the majority of funds in air-gapped environments.

### Wallet Vault Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ExchangeVault {
    address public owner;
    address public hotWallet;
    address[] public coldWallets;

    uint256 public hotWalletLimit = 100 ether;
    uint256 public coldWalletThreshold = 1000 ether;

    mapping(address => uint256) public lastWithdrawal;
    uint256 public cooldownPeriod = 1 hours;

    struct WithdrawalRequest {
        address to;
        uint256 amount;
        address requestedBy;
        uint256 timestamp;
        bool executed;
    }

    WithdrawalRequest[] public pendingWithdrawals;
    mapping(address => uint256) public dailyWithdrawn;
    mapping(address => uint256) public dailyLimit;

    uint256 public constant MAX_SINGLE_WITHDRAWAL = 50 ether;
    uint256 public constant DAILY_LIMIT = 200 ether;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier rateLimited(address user) {
        require(
            block.timestamp >= lastWithdrawal[user] + cooldownPeriod,
            "Cooldown active"
        );
        _;
    }

    constructor(address _hotWallet, address[] memory _coldWallets) payable {
        owner = msg.sender;
        hotWallet = _hotWallet;

        for (uint256 i = 0; i < _coldWallets.length; i++) {
            coldWallets.push(_coldWallets[i]);
        }
    }

    function requestWithdrawal(
        address to,
        uint256 amount
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        require(amount <= MAX_SINGLE_WITHDRAWAL, "Exceeds single limit");
        require(
            dailyWithdrawn[msg.sender] + amount <= dailyLimit[msg.sender],
            "Exceeds daily limit"
        );

        uint256 requestId = pendingWithdrawals.length;
        pendingWithdrawals.push(WithdrawalRequest({
            to: to,
            amount: amount,
            requestedBy: msg.sender,
            timestamp: block.timestamp,
            executed: false
        }));

        return requestId;
    }

    // Cold storage transfer — requires timelock
    function transferToCold(
        uint256 coldWalletIndex,
        uint256 amount
    ) external onlyOwner rateLimited(msg.sender) {
        require(
            coldWalletIndex < coldWallets.length,
            "Invalid cold wallet"
        );
        require(address(this).balance >= amount, "Insufficient balance");

        (bool success, ) = coldWallets[coldWalletIndex].call{value: amount}("");
        require(success, "Transfer failed");

        lastWithdrawal[msg.sender] = block.timestamp;
        emit ColdStorageTransfer(coldWallets[coldWalletIndex], amount);
    }

    // Auto-rebalance: move excess to cold storage
    function rebalance() external onlyOwner {
        uint256 balance = address(this).balance;
        uint256 excess = balance - hotWalletLimit;

        if (excess > 0 && coldWallets.length > 0) {
            (bool success, ) = coldWallets[0].call{value: excess}("");
            require(success, "Rebalance failed");
            emit Rebalance(excess);
        }
    }

    // Anomaly detection hook
    function detectAnomaly(address user, uint256 amount) internal view returns (bool) {
        // Unusual withdrawal size
        if (amount > MAX_SINGLE_WITHDRAWAL * 2) return true;

        // Rapid successive withdrawals
        if (block.timestamp - lastWithdrawal[user] < 60 seconds) return true;

        // Daily limit approaching
        if (dailyWithdrawn[user] > DAILY_LIMIT * 0.8) return true;

        return false;
    }

    receive() external payable {}
}
```

## Withdrawal Rate Limiting and Anomaly Detection

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WithdrawalGuard {
    struct WithdrawalPolicy {
        uint256 maxAmount;
        uint256 timeWindow;
        uint256 maxTransactions;
        bool active;
    }

    address public operator;
    WithdrawalPolicy public defaultPolicy;

    mapping(address => uint256[]) public withdrawalHistory;
    mapping(address => uint256) public suspiciousScore;

    uint256 public constant SUSPICIOUS_THRESHOLD = 10;

    event WithdrawalAllowed(address indexed user, uint256 amount);
    event WithdrawalBlocked(address indexed user, uint256 amount, string reason);
    event AccountFlagged(address indexed user, uint256 score);

    constructor() {
        operator = msg.sender;
        defaultPolicy = WithdrawalPolicy({
            maxAmount: 50 ether,
            timeWindow: 1 hours,
            maxTransactions: 5,
            active: true
        });
    }

    function checkWithdrawal(
        address user,
        uint256 amount
    ) external returns (bool allowed) {
        require(defaultPolicy.active, "Policy disabled");

        // Check single transaction limit
        if (amount > defaultPolicy.maxAmount) {
            emit WithdrawalBlocked(user, amount, "Exceeds single limit");
            return false;
        }

        // Check time window frequency
        uint256[] storage history = withdrawalHistory[user];
        uint256 count = 0;
        uint256 cutoff = block.timestamp - defaultPolicy.timeWindow;

        for (uint256 i = history.length; i > 0; i--) {
            if (history[i - 1] >= cutoff) {
                count++;
            } else {
                break;
            }
        }

        if (count >= defaultPolicy.maxTransactions) {
            suspiciousScore[user] += 3;
            emit WithdrawalBlocked(user, amount, "Too frequent");
            emit AccountFlagged(user, suspiciousScore[user]);
            return false;
        }

        // Record withdrawal
        history.push(block.timestamp);

        // Check anomaly patterns
        if (_isAnomalous(user, amount, count)) {
            suspiciousScore[user] += 5;
            emit AccountFlagged(user, suspiciousScore[user]);

            if (suspiciousScore[user] >= SUSPICIOUS_THRESHOLD) {
                // Auto-freeze account
                _freezeAccount(user);
                return false;
            }
        }

        emit WithdrawalAllowed(user, amount);
        return true;
    }

    function _isAnomalous(
        address user,
        uint256 amount,
        uint256 recentCount
    ) internal view returns (bool) {
        // Pattern 1: Unusually large amount for this user
        if (amount > defaultPolicy.maxAmount / 2 && recentCount > 1) {
            return true;
        }

        // Pattern 2: Spike in withdrawal frequency
        if (recentCount > defaultPolicy.maxTransactions / 2) {
            return true;
        }

        return false;
    }

    function _freezeAccount(address user) internal {
        // Block all withdrawals for this account
        emit AccountFrozen(user, "Anomaly detected — manual review required");
    }

    // Manual operator controls
    function clearSuspiciousScore(address user) external {
        require(msg.sender == operator, "Not operator");
        suspiciousScore[user] = 0;
    }

    function setPolicy(
        uint256 maxAmount,
        uint256 timeWindow,
        uint256 maxTransactions
    ) external {
        require(msg.sender == operator, "Not operator");
        defaultPolicy = WithdrawalPolicy({
            maxAmount: maxAmount,
            timeWindow: timeWindow,
            maxTransactions: maxTransactions,
            active: true
        });
    }

    event AccountFrozen(address indexed user, string reason);
}
```

## Hot/Cold Wallet Monitoring

```python
import time
import json
from web3 import Web3
from collections import defaultdict

class WalletMonitor:
    def __init__(self, rpc_url, hot_wallet, cold_wallets):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.hot_wallet = hot_wallet.lower()
        self.cold_wallets = [w.lower() for w in cold_wallets]
        self.alerts = []
        self.tx_history = defaultdict(list)

    def check_balance_anomaly(self, wallet, threshold_pct=10):
        """Alert if balance drops by more than threshold_pct in one block"""
        current = self.w3.eth.get_balance(Web3.to_checksum_address(wallet))
        previous = self.tx_history.get(f"balance_{wallet}", [current])[-1]

        if previous > 0:
            change_pct = ((previous - current) / previous) * 100
            if change_pct > threshold_pct:
                self.alerts.append({
                    "type": "BALANCE_DROP",
                    "wallet": wallet,
                    "change_pct": change_pct,
                    "timestamp": int(time.time())
                })

        self.tx_history[f"balance_{wallet}"].append(current)

    def check_large_transfer(self, wallet, max_amount_wei):
        """Alert on transfers exceeding threshold"""
        block = self.w3.eth.block_number
        txs = self.w3.eth.get_block_transactions(block)

        for tx in txs:
            if tx.get("from", "").lower() == wallet:
                if tx["value"] > max_amount_wei:
                    self.alerts.append({
                        "type": "LARGE_TRANSFER",
                        "wallet": wallet,
                        "amount": str(tx["value"]),
                        "to": tx["to"],
                        "hash": tx["hash"].hex()
                    })

    def check_cold_storage_movement(self):
        """Monitor cold wallets for unauthorized transfers"""
        for cold_wallet in self.cold_wallets:
            block = self.w3.eth.block_number
            txs = self.w3.eth.get_block_transactions(block)

            for tx in txs:
                if tx.get("from", "").lower() == cold_wallet:
                    self.alerts.append({
                        "type": "COLD_STORAGE_MOVEMENT",
                        "wallet": cold_wallet,
                        "amount": str(tx["value"]),
                        "to": tx["to"],
                        "severity": "CRITICAL"
                    })

    def run_monitoring_loop(self, interval=12):
        """Continuously monitor wallets every block"""
        print(f"Monitoring {len(self.cold_wallets) + 1} wallets...")

        while True:
            try:
                self.check_balance_anomaly(self.hot_wallet)
                self.check_cold_storage_movement()

                for alert in self.alerts:
                    print(f"[ALERT] {alert['type']}: {json.dumps(alert, indent=2)}")

                self.alerts = []
                time.sleep(interval)

            except Exception as e:
                print(f"Monitor error: {e}")
                time.sleep(5)
```

## Assessment

**Lab Task:** Deploy a complete exchange custody system with one hot wallet and three cold wallets. Implement withdrawal rate limiting that blocks accounts after suspicious patterns. Build a monitoring script that detects cold storage movements. Demonstrate a full lifecycle: deposit, request withdrawal, rate limit trigger, and cold storage rebalance.

**Time:** 150 minutes

**Grading:**
- Hot/cold wallet deployment and rebalance logic (25 points)
- Withdrawal rate limiting with cooldown enforcement (25 points)
- Anomaly detection that freezes suspicious accounts (25 points)
- Monitoring script detecting cold storage movement (25 points)

## Evidence

- ExchangeVault contract with hot/cold architecture
- WithdrawalGuard contract with rate limiting
- Python monitoring script with alert system
- Test transactions demonstrating rate limit triggers
- Cold storage movement detection output
