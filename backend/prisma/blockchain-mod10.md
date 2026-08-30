# Module 10 — Incident Response: Upgradeable Contracts and Emergency Stops

## What You'll Actually Do

You will deploy upgradeable contracts using proxy patterns, implement emergency stop mechanisms, execute live contract upgrades, and build incident response playbooks for real-world scenarios like key compromise and exploit recovery.

## Proxy Upgrade Patterns

### UUPS Proxy Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract UpgradeableVaultV1 is
    Initializable,
    UUPSUpgradeable,
    Ownable2StepUpgradeable,
    PausableUpgradeable
{
    uint256 public totalDeposits;
    mapping(address => uint256) public balances;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __Pausable_init();
    }

    function deposit() external payable whenNotPaused {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        totalDeposits -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    // Emergency pause
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // UUPS authorization
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
}

// V2: Add emergency withdrawal and time-locked withdrawals
contract UpgradeableVaultV2 is
    Initializable,
    UUPSUpgradeable,
    Ownable2StepUpgradeable,
    PausableUpgradeable
{
    uint256 public totalDeposits;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public withdrawalLocks;

    uint256 public constant WITHDRAWAL_DELAY = 1 days;
    bool public emergencyMode;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public reinitializer(2) {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __Pausable_init();
    }

    function deposit() external payable whenNotPaused {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // V2: Time-locked withdrawal
    function requestWithdrawal(uint256 amount) external whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        withdrawalLocks[msg.sender] = block.timestamp + WITHDRAWAL_DELAY;
        emit WithdrawalRequested(msg.sender, amount);
    }

    function executeWithdrawal() external whenNotPaused {
        require(
            block.timestamp >= withdrawalLocks[msg.sender],
            "Withdrawal locked"
        );
        require(balances[msg.sender] > 0, "No balance");

        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        totalDeposits -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    // V2: Emergency withdrawal for all users
    function emergencyWithdraw() external {
        require(emergencyMode, "Not in emergency mode");
        require(balances[msg.sender] > 0, "No balance");

        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        totalDeposits -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function enterEmergencyMode() external onlyOwner {
        emergencyMode = true;
        _pause();
        emit EmergencyModeActivated(block.timestamp);
    }

    function exitEmergencyMode() external onlyOwner {
        emergencyMode = false;
        _unpause();
        emit EmergencyModeDeactivated();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event WithdrawalRequested(address indexed user, uint256 amount);
    event EmergencyModeActivated(uint256 timestamp);
    event EmergencyModeDeactivated();
}
```

## Emergency Stop and Circuit Breaker

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CircuitBreaker {
    address public guardian;
    address[] public multisig;

    uint256 public constant CIRCUIT_BREAKER_THRESHOLD = 50 ether;
    uint256 public constant COOLDOWN_PERIOD = 1 hours;
    uint256 public lastLargeMovement;

    bool public circuitBroken;
    uint256 public breakTimestamp;

    mapping(address => bool) public suspended;

    // Anomaly triggers circuit breaker
    event CircuitBroken(uint256 timestamp, uint256 triggerAmount);
    event CircuitReset(uint256 timestamp);
    event AccountSuspended(address indexed account);
    event EmergencyWithdrawal(address indexed account, uint256 amount);

    constructor(address[] memory _multisig) {
        guardian = msg.sender;
        for (uint256 i = 0; i < _multisig.length; i++) {
            multisig.push(_multisig[i]);
        }
    }

    modifier onlyGuardianOrMultisig() {
        require(
            msg.sender == guardian || _isMultisig(msg.sender),
            "Not authorized"
        );
        _;
    }

    function _isMultisig(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < multisig.length; i++) {
            if (multisig[i] == addr) return true;
        }
        return false;
    }

    // Auto-trigger on large movement
    function checkMovement(uint256 amount) external {
        if (amount >= CIRCUIT_BREAKER_THRESHOLD && !circuitBroken) {
            circuitBroken = true;
            breakTimestamp = block.timestamp;
            lastLargeMovement = block.timestamp;
            emit CircuitBroken(block.timestamp, amount);
        }
    }

    // Manual trigger
    function breakCircuit() external onlyGuardianOrMultisig {
        circuitBroken = true;
        breakTimestamp = block.timestamp;
        emit CircuitBroken(block.timestamp, 0);
    }

    function resetCircuit() external onlyGuardianOrMultisig {
        require(
            block.timestamp >= breakTimestamp + COOLDOWN_PERIOD,
            "Cooldown active"
        );
        circuitBroken = false;
        emit CircuitReset(block.timestamp);
    }

    // Suspend suspicious accounts
    function suspendAccount(address account) external onlyGuardianOrMultisig {
        suspended[account] = true;
        emit AccountSuspended(account);
    }

    function unsuspendAccount(address account) external onlyGuardianOrMultisig {
        suspended[account] = false;
    }

    // Emergency withdrawal — bypass normal restrictions
    function emergencyWithdraw(
        address vault,
        address token,
        uint256 amount
    ) external onlyGuardianOrMultisig {
        require(circuitBroken, "Circuit not broken");
        require(!suspended[msg.sender], "Account suspended");

        IERC20(token).transferFrom(vault, msg.sender, amount);
        emit EmergencyWithdrawal(msg.sender, amount);
    }
}
```

## Incident Response Playbook

```python
import json
from datetime import datetime
from enum import Enum

class Severity(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class IncidentResponse:
    def __init__(self, contract_address, chain):
        self.contract_address = contract_address
        self.chain = chain
        self.incident_id = f"INC-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.timeline = []
        self.actions_taken = []

    def log(self, action, details):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details
        }
        self.timeline.append(entry)
        print(f"[{self.incident_id}] {action}: {details}")

    def assess_severity(self, exploit_type, affected_amount, is_active):
        if is_active and affected_amount > 1000000e18:
            return Severity.CRITICAL
        elif is_active:
            return Severity.HIGH
        elif affected_amount > 100000e18:
            return Severity.HIGH
        elif exploit_type in ["reentrancy", "flash_loan"]:
            return Severity.CRITICAL
        else:
            return Severity.MEDIUM

    # Step 1: Detect and contain
    def detect(self, exploit_type, tx_hash):
        self.log("DETECT", f"Exploit detected: {exploit_type}, tx: {tx_hash}")
        self.log("CONTAIN", "Activating circuit breaker")
        # Call circuitBreaker.breakCircuit()
        self.log("CONTAIN", "Pausing contract operations")
        # Call vault.pause()

    # Step 2: Assess damage
    def assess(self, pre_balance, post_balance):
        loss = pre_balance - post_balance
        severity = self.assess_severity("unknown", loss, True)
        self.log("ASSESS", f"Loss: {loss} wei, Severity: {severity.name}")
        return loss, severity

    # Step 3: Notify stakeholders
    def notify(self, severity):
        channels = {
            Severity.LOW: ["internal"],
            Severity.MEDIUM: ["internal", "community"],
            Severity.HIGH: ["internal", "community", "auditors"],
            Severity.CRITICAL: ["internal", "community", "auditors", "emergency_services"]
        }
        self.log("NOTIFY", f"Alerting: {', '.join(channels[severity])}")

    # Step 4: Upgrade and fix
    def upgrade(self, new_implementation):
        self.log("UPGRADE", f"Deploying new implementation: {new_implementation}")
        # Call proxy.upgradeTo(new_implementation)
        self.log("UPGRADE", "Implementation updated")

    # Step 5: Resume operations
    def resume(self):
        self.log("RESUME", "Clearing circuit breaker")
        # Call circuitBreaker.resetCircuit()
        self.log("RESUME", "Unpausing contract")
        # Call vault.unpause()
        self.log("RESUME", "Operations resumed")

    # Step 6: Post-incident
    def post_mortem(self):
        report = {
            "incident_id": self.incident_id,
            "contract": self.contract_address,
            "chain": self.chain,
            "timeline": self.timeline,
            "root_cause": "TBD",
            "recommendations": [
                "Schedule external audit",
                "Review all similar patterns",
                "Update monitoring thresholds",
                "Consider bug bounty expansion"
            ]
        }
        self.log("REPORT", f"Post-mortem generated: {self.incident_id}")
        return report

    def run_full_response(self, exploit_type, tx_hash, pre_balance, post_balance, new_impl):
        self.log("PHASE 1", "=== INCIDENT RESPONSE STARTED ===")
        self.detect(exploit_type, tx_hash)
        loss, severity = self.assess(pre_balance, post_balance)
        self.notify(severity)
        self.upgrade(new_impl)
        self.resume()
        report = self.post_mortem()
        self.log("PHASE 6", "=== INCIDENT RESPONSE COMPLETE ===")
        return report

# Usage
incident = IncidentResponse("0x1234...5678", "ethereum")
report = incident.run_full_response(
    exploit_type="reentrancy",
    tx_hash="0xabc...def",
    pre_balance=1000000e18,
    post_balance=500000e18,
    new_impl="0xabcd...1234"
)
print(json.dumps(report, indent=2))
```

## Upgrade Safety Checks

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract SafeUpgradeableVault is
    Initializable,
    UUPSUpgradeable,
    Ownable2StepUpgradeable,
    PausableUpgradeable
{
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    uint256 public constant UPGRADE_COOLDOWN = 7 days;
    uint256 public lastUpgradeTime;
    address public pendingImplementation;

    event UpgradeProposed(address indexed newImpl, uint256 executeAfter);
    event UpgradeExecuted(address indexed oldImpl, address indexed newImpl);
    event UpgradeCancelled();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __Pausable_init();
    }

    // Time-locked upgrade with veto period
    function proposeUpgrade(address newImplementation) external onlyOwner {
        require(
            block.timestamp >= lastUpgradeTime + UPGRADE_COOLDOWN,
            "Upgrade cooldown active"
        );
        pendingImplementation = newImplementation;
        emit UpgradeProposed(
            newImplementation,
            block.timestamp + UPGRADE_COOLDOWN
        );
    }

    function executeUpgrade() external onlyOwner {
        require(
            pendingImplementation != address(0),
            "No pending upgrade"
        );
        require(
            block.timestamp >= lastUpgradeTime + UPGRADE_COOLDOWN,
            "Veto period active"
        );

        address oldImpl = implementation();
        lastUpgradeTime = block.timestamp;

        _upgradeTo(pendingImplementation);
        delete pendingImplementation;

        emit UpgradeExecuted(oldImpl, msg.sender);
    }

    function cancelUpgrade() external onlyOwner {
        delete pendingImplementation;
        emit UpgradeCancelled();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function deposit() external payable whenNotPaused {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    function withdraw(uint256 amount) external whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient");
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
    }
}
```

## Assessment

**Lab Task:** Deploy an upgradeable vault using UUPS proxy. Simulate a security incident: detect an exploit, pause the contract, assess the damage, propose and execute an upgrade, then resume operations. Implement a circuit breaker that auto-triggers on large movements. Build a full incident response report using the playbook.

**Time:** 140 minutes

**Grading:**
- UUPS proxy deployment and V1 implementation (15 points)
- Simulated exploit detection and circuit breaker activation (20 points)
- Damage assessment and stakeholder notification (15 points)
- Upgrade proposal with time-lock and execution (20 points)
- Incident response report with timeline and recommendations (15 points)
- Full lifecycle demonstration from detection to resume (15 points)

## Evidence

- Upgradeable vault V1 and V2 contracts
- Circuit breaker contract with auto-trigger
- Incident response playbook output with timeline
- Upgrade execution logs showing old and new implementations
- Post-mortem report with root cause analysis
