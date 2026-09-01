# Module 5 — DeFi Security

Decentralized finance protocols manage billions of dollars in assets. They compose complex financial primitives — lending, borrowing, trading, derivatives — without intermediaries. This composability is DeFi's strength and its greatest vulnerability. A single vulnerability in one protocol can cascade across every protocol that integrates with it. This module covers the attack vectors specific to DeFi: flash loan exploits, price oracle manipulation, lending protocol attacks, DEX vulnerabilities, and the real exploits that have drained hundreds of millions from supposedly secure protocols.

## Flash Loans

Flash loans are uncollateralized loans that must be borrowed and repaid within a single atomic transaction. If the borrower cannot repay the loan plus fees by the end of the transaction, the entire transaction reverts as if it never happened.

### How Flash Loans Work

When you borrow via flash loan:

1. The lending pool transfers tokens to your contract.
2. Your contract executes arbitrary logic (swap, arbitrage, liquidate, etc.).
3. Your contract repays the loan plus a fee (typically 0.09% - 0.3%).
4. If repayment fails at any point, the entire transaction reverts.

The key property: the lender bears zero risk. The loan either succeeds completely or reverts completely. There is no partial execution.

```solidity
// Simplified flash loan interface
interface IFlashLender {
    function flashLoan(
        address receiverAddress,
        address token,
        uint256 amount,
        bytes calldata params
    ) external returns (bool);
}

// Your flash loan receiver contract
contract FlashLoanReceiver is IFlashBorrower {
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external returns (bytes32) {
        // 1. Execute your strategy here
        // 2. Ensure you have enough to repay
        // 3. Approve repayment
        
        IERC20(token).approve(msg.sender, amount + fee);
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}
```

### Flash Loan Attack Patterns

Flash loans enable attacks that require massive capital but no collateral. The attacker borrows a large amount, uses it to manipulate a protocol, extracts value, repays the flash loan, and keeps the profit — all in one transaction.

**Pattern 1: Price Oracle Manipulation**

The attacker borrows a large amount of tokens via flash loan, swaps them on a DEX to manipulate the spot price, uses the inflated price to borrow more than they should from a lending protocol, and repays the flash loan. This is the most common flash loan attack pattern and has been responsible for hundreds of millions of dollars in losses across DeFi.

**Pattern 2: Governance Attack**

The attacker borrows a massive amount of governance tokens via flash loan, uses them to vote on a proposal (or create and pass one), and repays the tokens — all in one transaction. If the governance system has no staking requirement or timelock, this attack is trivially executable.

**Pattern 3: Liquidation Exploitation**

The attacker uses a flash loan to acquire enough tokens to trigger liquidations on a lending protocol, collecting the liquidation bonus. During market crashes, this can be particularly profitable as many positions become undercollateralized simultaneously.

**Pattern 4: Liquidity Manipulation**

The attacker borrows liquidity from a pool, uses it to manipulate another pool's price, and profits from arbitrage. This is essentially a sophisticated form of MEV extraction using flash loans as the capital source.

### Flash Loan Economics

Flash loan fees vary by protocol and network:

- **Aave V3:** 0.05% fee on flash loans (Ethereum mainnet).
- **Balancer:** 0% fee on flash loans (the protocol subsidizes the cost to attract usage).
- **dYdX:** 0% fee (flash loans were historically free on dYdX).

The fee structure affects the economics of flash loan attacks. A 0.05% fee on a $10 million flash loan costs $5,000, which must be exceeded by the attack profit for the attack to be economically rational. This means flash loan attacks are only profitable when the vulnerability being exploited has a sufficient margin.

## Price Oracle Manipulation

Price oracles provide off-chain data to on-chain contracts. The most common oracle attack is spot price manipulation — using a large trade to temporarily move a DEX pool's price.

### Spot Price Attack Mechanics

Consider a lending protocol that uses Uniswap's spot price as its oracle:

```solidity
// Vulnerable: spot price oracle
function getCollateralValue(address token, uint256 amount) public view returns (uint256) {
    (uint256 reserve0, uint256 reserve1, ) = uniswapPair.getReserves();
    uint256 spotPrice = (reserve1 * 1e18) / reserve0;
    return (amount * spotPrice) / 1e18;
}
```

The attack:

1. Flash borrow 10,000 ETH worth of token A.
2. Swap all token A for token B on Uniswap, dramatically moving the price.
3. The lending protocol now values the attacker's collateral at the inflated price.
4. Borrow the maximum amount against the inflated collateral.
5. Swap back to recover the original token amounts.
6. Repay the flash loan.

The attacker has effectively borrowed more than their collateral is worth, and the lending protocol absorbs the loss. The key insight is that the protocol trusts a single, manipulable data source for its most critical calculation — collateral valuation.

The economic analysis of this attack:
- Flash loan fee: 0.05% of 10,000 ETH = 5 ETH.
- Trading fees on Uniswap: 0.3% of 10,000 ETH = 30 ETH.
- Total attack cost: approximately 35 ETH.
- Profit: whatever the lending protocol loses from the undercollateralized loan.
- For a protocol with $100M TVL, the potential profit could be tens of millions of dollars.

This extreme risk-reward ratio is why oracle security is the single most critical factor in DeFi protocol design.

### TWAP Oracle

Time-Weighted Average Price (TWAP) oracles calculate the average price over a time window. This makes spot manipulation much more expensive — the attacker would need to maintain the manipulated price for the entire TWAP window (often 30 minutes to 24 hours).

```solidity
// TWAP oracle
function getPrice() public view returns (uint256) {
    uint256 priceCumulative0 = pair.price0CumulativeLast();
    uint256 priceCumulative1 = pair.price1CumulativeLast();
    uint32 blockTimestamp = uint32(block.timestamp);
    
    // Get the price at the start of the window
    uint256 priceAtStart = IUniswapV2Pair(pair)
        .consult(address(token), 30 minutes, blockTimestamp);
    
    return priceAtStart;
}
```

However, TWAP oracles are not immune. If the attacker can maintain the manipulated price for the entire TWAP window (through sustained trading), the TWAP still reflects the manipulated price. This is called a "long-duration manipulation" attack.

### Chainlink Oracles

Chainlink is the most widely used decentralized oracle network. It aggregates data from multiple independent nodes, making manipulation significantly harder.

```solidity
// Chainlink price feed
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract SecureLending {
    AggregatorV3Interface public priceFeed;
    
    function getCollateralValue(address token, uint256 amount) public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        
        // Staleness check
        require(block.timestamp - updatedAt < 1 hours, "Price stale");
        
        // Circuit breaker: reject prices that deviate too much
        require(price > 0, "Invalid price");
        
        return (amount * uint256(price)) / (10 ** uint256(priceFeed.decimals()));
    }
}
```

Chainlink oracles are not perfect. They have:
- **Latency:** Price updates are not instant. During high volatility, the oracle price may lag the market.
- **Cost:** Each oracle update costs gas, so updates are periodic (every block or every few minutes).
- **Centralization risk:** The oracle network is controlled by a set of node operators. If enough operators collude, they can report incorrect prices.
- **Staleness:** If the oracle stops updating (due to network congestion or operator failure), the price becomes stale.

## Lending Protocol Attacks

Lending protocols like Aave, Compound, and MakerDAO allow users to deposit collateral and borrow against it. The security of these protocols depends on accurate collateral valuation, liquidation mechanisms, and interest rate models.

### Undercollateralized Borrowing

If the collateral valuation can be manipulated (through oracle attacks or market manipulation), an attacker can borrow more than their collateral is worth. The lending protocol absorbs the loss when the collateral is eventually liquidated at its true market value.

### Liquidation Cascades

When collateral value drops below the liquidation threshold, the position is liquidated. Liquidators repay the debt and receive the collateral plus a bonus (typically 5-15%). During market crashes, many positions become undercollateralized simultaneously, triggering mass liquidations.

Mass liquidations can create a death spiral:
1. Price drops → positions become undercollateralized.
2. Liquidations force selling of collateral → price drops further.
3. More positions become undercollateralized → more liquidations.

This cascade can cause the lending protocol to accumulate bad debt (debt that cannot be covered by the liquidated collateral).

### Interest Rate Manipulation

Some lending protocols use utilization-based interest rates. If an attacker can manipulate the utilization ratio (by depositing or borrowing a large amount), they can influence interest rates to their benefit.

```solidity
// Simplified interest rate model
function getSupplyRate(uint256 utilization) public pure returns (uint256) {
    if (utilization <= 8000) { // 80% target utilization
        return utilization * 4 / 100; // 0.04% per unit
    } else {
        return 320 + (utilization - 8000) * 75 / 100; // Steep increase above 80%
    }
}
```

An attacker could borrow a large amount to push utilization above 80%, earn high interest on their supply, and then repay the borrow to collect the profit.

## DEX Vulnerabilities

Decentralized exchanges have their own attack surface.

### Sandwich Attacks

As discussed in Module 3, sandwich attacks exploit the transparency of the mempool. The attacker sees a pending DEX trade, places a buy order before it (front-run), lets the victim's trade execute at a worse price, and then sells immediately after (back-run).

### Impermanent Loss Exploitation

Liquidity providers in AMMs (Automated Market Makers) face impermanent loss — the loss in value compared to simply holding the tokens. Sophisticated traders can extract value from LPs by executing trades that move the price, causing impermanent loss, and then reversing the trade at the new price.

### Flash Swap Attacks

Flash swaps are the AMM equivalent of flash loans. You can withdraw tokens from a pool without upfront capital, as long as you either return the tokens or complete the corresponding swap in the same transaction.

```solidity
// Flash swap attack example
contract FlashSwapAttacker {
    function attack(address pair, address token0, address token1) external {
        // 1. Flash swap: withdraw token0 without paying
        uint256 amount0 = 1000 ether;
        IUniswapV2Pair(pair).swap(
            amount0, 
            0, 
            address(this), 
            ""
        );
        
        // 2. Use token0 to manipulate another protocol
        // 3. Convert profits back to token1
        // 4. Repay the flash swap
        
        uint256 amount1Owed = (amount0 * 1003) / 1000; // 0.3% fee
        IERC20(token1).approve(pair, amount1Owed);
    }
}
```

## Real Exploits

### bZx Flash Loan Attack (2020)

An attacker used a flash loan to borrow 10,000 ETH. With this ETH:
1. Swapped half for sUSD on Fulcrum (bZx), pushing the price up.
2. Used the remaining ETH as collateral on bZx to borrow more sUSD.
3. The inflated sUSD price meant the attacker could borrow more than their collateral was worth.
4. Sold the borrowed sUSD on Synthetix for profit.
5. Repaid the flash loan.

Total profit: ~$8 million. The attack exploited the fact that Fulcrum used a single DEX as its price oracle.

### Pancake Bunny (2021)

An attacker used a flash loan to manipulate the BNB/USD price on PancakeSwap by swapping a massive amount of BNB. This inflated the value of the attacker's collateral in the Pancake Bunny lending pool. The attacker borrowed against the inflated collateral and extracted 45 million USD.

The root cause: Pancake Bunny used PancakeSwap's spot price as its oracle.

### Mango Markets (2022)

An attacker deposited a large amount of MNGO tokens as collateral. They then manipulated the MNGO price on Mango's own order book, inflating the value of their collateral. With the inflated collateral, they borrowed the entire protocol's liquidity — approximately 114 million USD across multiple assets.

The root cause: Mango Markets used its own order book for price discovery, which could be manipulated by a single large actor.

### Euler Finance (2023)

An attacker exploited a vulnerability in Euler's donation mechanism. The protocol allowed users to donate tokens to reduce their own debt. The attacker:
1. Borrowed a large amount from Euler.
2. Donated tokens to inflate the protocol's internal accounting.
3. Exploited the inflated accounting to extract funds from the protocol.

Total loss: approximately 197 million USD.

### BonqDAO (2023)

An oracle manipulation attack on BonqDAO exploited the Tellor oracle. The attacker manipulated the price of the ALBT token by exploiting the oracle's price feed. They then used the inflated collateral value to borrow 120 million USD from the protocol.

The root cause: Tellor's oracle used a spot price mechanism that could be manipulated with a single trade.

## Mitigation Strategies

### Use Decentralized Oracles

Chainlink, Band Protocol, and other decentralized oracle networks aggregate data from multiple sources. They are more expensive than spot price reads but significantly more secure. Chainlink data feeds pull from 21-101 independent node operators, each sourcing data from multiple off-chain APIs. The median of all responses is used, making manipulation require compromising a majority of independent operators simultaneously. For high-value protocols, Chainlink also offers Proof of Reserve feeds that verify off-chain collateral backing, adding another layer of assurance.

### Implement Price Checks

```solidity
function executeOperation(
    address token,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata data
) external {
    // Check that the oracle price is reasonable
    uint256 oraclePrice = oracle.getPrice(token);
    uint256 dexPrice = getDEXPrice(token);
    
    // Reject if oracle and DEX prices deviate significantly
    require(
        oraclePrice * 95 / 100 <= dexPrice && 
        dexPrice <= oraclePrice * 105 / 100,
        "Price deviation too large"
    );
    
    // Proceed with operation...
}
```

Multi-oracle validation is even stronger. Require agreement from at least 2 of 3 independent oracle sources before accepting a price. This means an attacker must compromise multiple oracle networks simultaneously, which is exponentially more expensive.

### Use TWAP Oracles with Sufficient Window

The TWAP window should be long enough to make manipulation prohibitively expensive. A 30-minute TWAP requires maintaining the manipulated price for 30 minutes, which costs continuous trading fees and gas. A 24-hour TWAP makes manipulation practically impossible for all but the deepest liquidity pools. The tradeoff is latency — longer windows mean slower price updates, which can be dangerous during genuine market volatility. Most protocols use 30 minutes to 2 hours as a reasonable balance.

### Circuit Breakers

Implement circuit breakers that pause the protocol when anomalous conditions are detected:

```solidity
function executeOperation(...) external {
    require(!circuitBreaker.isActive(), "Circuit breaker active");
    
    uint256 priceChange = calculatePriceChange(token);
    if (priceChange > MAX_PRICE_CHANGE) {
        circuitBreaker.activate();
        revert("Price change too large");
    }
    
    // Proceed with operation...
}
```

Circuit breakers should be calibrated carefully. If the threshold is too sensitive, normal market volatility triggers false positives and disrupts legitimate operations. If too loose, real attacks slip through. A 10% price change in a single block is almost certainly manipulation for most assets, while a 10% change over 24 hours during a market crash is legitimate volatility.

### Rate Limiting

Limit the amount that can be borrowed or withdrawn in a single transaction. This reduces the impact of flash loan attacks:

```solidity
uint256 public constant MAX_BORROW_PER_TX = 100 ether;

function borrow(uint256 amount) external {
    require(amount <= MAX_BORROW_PER_TX, "Borrow exceeds limit");
    // Proceed with borrow...
}
```

Additionally, implement per-address daily limits and protocol-wide daily limits. If the protocol-wide limit is reached, new borrows are paused until the next day. This caps the maximum possible loss from any single attack vector.

### Economic Security Analysis

Before deploying a DeFi protocol, calculate the cost of attacking it. If the cost of attack is less than the potential profit, the protocol is vulnerable. Economic security analysis considers:

1. **Flash loan cost:** The fee for borrowing the required capital (typically 0.09-0.3% of the loan amount).
2. **Gas cost:** The gas required to execute the attack (varies by complexity, typically 0.01-0.5 ETH).
3. **Market impact:** The cost of moving the price enough to exploit the vulnerability (depends on pool depth and liquidity).
4. **Opportunity cost:** The capital locked during the attack and any opportunity costs.

If the total attack cost is less than the potential profit, the protocol needs additional defenses. The goal is to make the cost of attack exceed the potential profit by a significant margin — ideally 10x or more.

## Assessment

### Lab 1: Flash Loan Attack Development (120 minutes)

**Objective:** Develop a flash loan attack against a vulnerable lending protocol.

**Tasks:**

1. You are given the following vulnerable lending protocol:

```solidity
contract VulnerableLending {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;
    IERC20 public token;
    IUniswapV2Pair public pair;
    
    constructor(address _token, address _pair) {
        token = IERC20(_token);
        pair = IUniswapV2Pair(_pair);
    }
    
    function deposit(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }
    
    function borrow(uint256 amount) external {
        uint256 collateral = getCollateralValue(msg.sender);
        require(collateral >= amount * 2, "Insufficient collateral");
        
        borrows[msg.sender] += amount;
        token.transfer(msg.sender, amount);
    }
    
    function getCollateralValue(address user) public view returns (uint256) {
        // VULNERABLE: uses DEX spot price
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        uint256 spotPrice = (reserve1 * 1e18) / reserve0;
        return (deposits[user] * spotPrice) / 1e18;
    }
}
```

2. Write a flash loan attack contract that:
   - Borrows via flash loan.
   - Manipulates the spot price.
   - Borrows more than the collateral is worth.
   - Repays the flash loan.
   - Extracts the profit.

3. Write a Foundry test that demonstrates the attack.
4. Measure the profit from the attack.
5. Write a fixed version of the lending protocol that prevents the attack.

**Grading criteria:**
- Attack contract successfully drains the lending pool (30%)
- Attack is executed atomically (flash loan) (20%)
- Test demonstrates the attack clearly (20%)
- Fixed protocol prevents the attack (20%)
- Analysis of the root cause and mitigation (10%)

### Lab 2: Oracle Security Assessment (90 minutes)

**Objective:** Assess the security of different oracle implementations.

**Tasks:**

1. Given three oracle implementations (spot price, TWAP, Chainlink), analyze the attack cost for each:
   - Spot price: How much does it cost to manipulate the price by 10%?
   - TWAP (30-minute window): How much does it cost to manipulate the TWAP by 10%?
   - Chainlink: What are the requirements to compromise the oracle?

2. For each oracle, identify the conditions under which it can be exploited:
   - Market conditions (volatility, liquidity).
   - Protocol conditions (TVL, borrow limits).
   - Oracle conditions (update frequency, staleness threshold).

3. Write a 1,000-word security assessment recommending which oracle to use for a lending protocol with $100M TVL, justifying your recommendation.

4. Design a hybrid oracle that combines TWAP and Chainlink, with a circuit breaker mechanism. Write the Solidity implementation.

**Grading criteria:**
- Accurate cost analysis for each oracle (30%)
- Comprehensive exploitation conditions (25%)
- Well-justified recommendation (25%)
- Hybrid oracle implementation is secure and functional (20%)

### Lab 3: DeFi Protocol Security Review (120 minutes)

**Objective:** Perform a security review of a DeFi protocol.

**Tasks:**

1. You are given a simplified DEX protocol:

```solidity
contract SimpleDEX {
    struct Pool {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalLP;
        mapping(address => uint256) lpBalances;
    }
    
    mapping(bytes32 => Pool) public pools;
    
    function createPool(address token0, address token1) external returns (bytes32) {
        bytes32 poolId = keccak256(abi.encodePacked(token0, token1));
        Pool storage pool = pools[poolId];
        require(pool.totalLP == 0, "Pool exists");
        
        pool.token0 = token0;
        pool.token1 = token1;
        return poolId;
    }
    
    function addLiquidity(bytes32 poolId, uint256 amount0, uint256 amount1) external {
        Pool storage pool = pools[poolId];
        
        if (pool.totalLP == 0) {
            pool.reserve0 = amount0;
            pool.reserve1 = amount1;
            pool.totalLP = amount0 + amount1;
            pool.lpBalances[msg.sender] = amount0 + amount1;
        } else {
            // PROPORTIONAL deposit
            uint256 lpTokens = (amount0 * pool.totalLP) / pool.reserve0;
            pool.reserve0 += amount0;
            pool.reserve1 += amount1;
            pool.totalLP += lpTokens;
            pool.lpBalances[msg.sender] += lpTokens;
        }
        
        IERC20(pool.token0).transferFrom(msg.sender, address(this), amount0);
        IERC20(pool.token1).transferFrom(msg.sender, address(this), amount1);
    }
    
    function swap(bytes32 poolId, address tokenIn, uint256 amountIn) external returns (uint256) {
        Pool storage pool = pools[poolId];
        
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == pool.token0 
            ? (pool.reserve0, pool.reserve1) 
            : (pool.reserve1, pool.reserve0);
        
        uint256 amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
        
        if (tokenIn == pool.token0) {
            pool.reserve0 += amountIn;
            pool.reserve1 -= amountOut;
        } else {
            pool.reserve1 += amountIn;
            pool.reserve0 -= amountOut;
        }
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn == pool.token0 ? pool.token1 : pool.token0).transfer(msg.sender, amountOut);
        
        return amountOut;
    }
    
    function removeLiquidity(bytes32 poolId, uint256 lpAmount) external {
        Pool storage pool = pools[poolId];
        
        uint256 amount0 = (lpAmount * pool.reserve0) / pool.totalLP;
        uint256 amount1 = (lpAmount * pool.reserve1) / pool.totalLP;
        
        pool.reserve0 -= amount0;
        pool.reserve1 -= amount1;
        pool.totalLP -= lpAmount;
        pool.lpBalances[msg.sender] -= lpAmount;
        
        IERC20(pool.token0).transfer(msg.sender, amount0);
        IERC20(pool.token1).transfer(msg.sender, amount1);
    }
}
```

2. Identify at least 5 security issues in this protocol.
3. For each issue, describe:
   - The vulnerability.
   - The attack scenario.
   - The impact.
   - The fix.
4. Write a 1,500-word security report.

**Grading criteria:**
- All 5 vulnerabilities correctly identified (25%)
- Attack scenarios are realistic and detailed (25%)
- Impact assessment is accurate (20%)
- Fixes are effective and well-explained (20%)
- Report quality and organization (10%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Flash loan attack contract and test** from Lab 1, demonstrating the exploit.
2. **Oracle security assessment** from Lab 2, with cost analysis and recommendations.
3. **DEX security report** from Lab 3, identifying vulnerabilities and proposing fixes.
4. **DeFi attack database** documenting at least 10 real-world DeFi exploits, including root cause, attack flow, and lessons learned.
5. **Mitigation checklist** for DeFi protocols, organized by vulnerability class (oracle manipulation, flash loan, liquidation, etc.).

These artifacts demonstrate that you can identify and mitigate the most common DeFi-specific attack vectors, which is essential for securing the rapidly evolving DeFi ecosystem.
