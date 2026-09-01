# Module 8 — Token Security

Tokens are the fundamental building blocks of the crypto ecosystem. ERC-20 tokens represent assets, governance rights, and access credentials. A single vulnerability in a token contract can drain millions of dollars from every holder, every DEX pool, and every protocol that integrates the token. This module covers ERC-20 vulnerabilities, approval mechanisms, token standards beyond ERC-20, and the real exploits that have leveraged token vulnerabilities to devastating effect.

## ERC-20 Standard

The ERC-20 standard defines the interface for fungible tokens on Ethereum. The standard specifies six functions and two events:

```solidity
interface IERC20 {
    // Required functions
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    // Required events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
```

These six functions and two events are all you need to implement a basic token. But the devil is in the details — how you implement these functions determines whether your token is secure or vulnerable.

## Approval Attacks

The `approve` function is the most dangerous function in ERC-20. It allows a spender to transfer up to a specified amount of tokens on behalf of the owner. The vulnerability arises when an owner wants to change an existing approval.

### The Approval Race Condition

Suppose Alice has approved Bob to spend 100 tokens. Alice wants to change the approval to 50 tokens. She calls `approve(bob, 50)`. But between the time Alice submits the transaction and it is mined, Bob can see the pending transaction and front-run it:

1. Bob sees Alice's `approve(bob, 50)` in the mempool.
2. Bob submits `transferFrom(alice, bob, 100)` with a higher gas price.
3. Bob's transfer executes first, spending the original 100-token approval.
4. Alice's `approve(bob, 50)` executes, setting a new approval.
5. Bob calls `transferFrom(alice, bob, 50)` to spend the new approval.

Net result: Bob spends 150 tokens instead of the intended 100.

### The Fix: IncreaseAllowance/DecreaseAllowance

The standard fix is to use `increaseAllowance` and `decreaseAllowance` instead of `approve`:

```solidity
function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
    allowance[msg.sender][spender] += addedValue;
    emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
    return true;
}

function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
    require(allowance[msg.sender][spender] >= subtractedValue, "Decreased allowance below zero");
    allowance[msg.sender][spender] -= subtractedValue;
    emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
    return true;
}
```

With these functions, the approval change is atomic — there is no window for front-running.

### OpenZeppelin's ERC20

OpenZeppelin's ERC20 implementation includes these protections:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SafeToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    
    // OpenZeppelin's ERC20 includes:
    // - _approve with internal access
    // - _spendAllowance with automatic decrease
    // - No approve race condition
}
```

OpenZeppelin's `_spendAllowance` automatically decreases the allowance after each `transferFrom`, preventing the race condition even when using the standard `approve` function:

```solidity
function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
    uint256 currentAllowance = allowance(owner, spender);
    if (currentAllowance != type(uint256).max) {
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        unchecked {
            _approve(owner, spender, currentAllowance - amount);
        }
    }
}
```

When the allowance is set to `type(uint256).max` (the maximum value), it is treated as an infinite approval and is not decreased. This is a gas optimization for protocols that need unlimited approval (like DEX aggregators), but it also means that if a spender is compromised, they can drain all tokens.

## Transfer Vulnerabilities

### Transfer to Zero Address

Sending tokens to the zero address (0x0000000000000000000000000000000000000000) effectively burns them. Some implementations do not check for this:

```solidity
// Vulnerable: no zero-address check
function transfer(address to, uint256 amount) external returns (bool) {
    balances[msg.sender] -= amount;
    balances[to] += amount;
    emit Transfer(msg.sender, to, amount);
    return true;
}
```

OpenZeppelin's implementation checks for this:

```solidity
function _transfer(address from, address to, uint256 amount) internal virtual {
    require(from != address(0), "ERC20: transfer from the zero address");
    require(to != address(0), "ERC20: transfer to the zero address");
    _beforeTokenTransfer(from, to, amount);
    // ...
}
```

### Transfer from Zero Address

The `transferFrom` function allows a spender to transfer tokens on behalf of the owner. If the owner is the zero address, the tokens are effectively minted:

```solidity
// Vulnerable: no zero-address check on 'from'
function transferFrom(address from, address to, uint256 amount) external returns (bool) {
    require(allowance[from][msg.sender] >= amount);
    balances[from] -= amount;
    balances[to] += amount;
    allowance[from][msg.sender] -= amount;
    emit Transfer(from, to, amount);
    return true;
}
```

If `from` is the zero address, the subtraction underflows (in pre-0.8.0 Solidity), potentially creating tokens out of thin air. In 0.8+, it reverts, but the check should be explicit.

### Balance Manipulation

Some token implementations use delegate calls or other external calls that can be exploited to manipulate balances:

```solidity
// Vulnerable: callback manipulation
function transfer(address to, uint256 amount) external returns (bool) {
    balances[msg.sender] -= amount;
    
    // External call allows reentrancy
    (bool success, ) = msg.sender.call(abi.encodeWithSignature("onTransfer()"));
    require(success);
    
    balances[to] += amount;
    return true;
}
```

An attacker's `onTransfer` callback could call `balanceOf` and see an inconsistent state (balance deducted from sender but not yet added to recipient).

## Fee-on-Transfer Tokens

Some tokens charge a fee on every transfer. The fee is deducted from the amount sent, so the recipient receives less than the sender specified. Fee-on-transfer tokens are common in deflationary token models and rebasing protocols. The fee can be sent to a burn address (deflationary), a treasury address (revenue generation), or distributed to existing holders (reflection tokens).

```solidity
contract FeeOnTransferToken is ERC20 {
    uint256 public constant FEE_PERCENT = 1;
    address public feeCollector;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        feeCollector = msg.sender;
        _mint(msg.sender, initialSupply);
    }
    
    function _transfer(address from, address to, uint256 amount) internal override {
        uint256 fee = (amount * FEE_PERCENT) / 100;
        uint256 transferAmount = amount - fee;
        
        super._transfer(from, feeCollector, fee);
        super._transfer(from, to, transferAmount);
    }
}
```

Fee-on-transfer tokens break many DeFi protocols because the actual amount received differs from the amount sent. Lending protocols, DEXes, and other contracts that rely on exact amounts may fail or behave unexpectedly.

**Mitigation:** Always check the actual balance change rather than trusting the transfer amount:

```solidity
// Vulnerable: trusts the transfer amount
function deposit(uint256 amount) external {
    token.transferFrom(msg.sender, address(this), amount);
    balances[msg.sender] += amount; // Wrong if fee-on-transfer
}

// Safe: checks actual balance change
function deposit(uint256 amount) external {
    uint256 balanceBefore = token.balanceOf(address(this));
    token.transferFrom(msg.sender, address(this), amount);
    uint256 balanceAfter = token.balanceOf(address(this));
    balances[msg.sender] += balanceAfter - balanceBefore; // Correct
}
```

The balance-checking pattern adds approximately 2,600 gas (two extra SLOAD operations) but provides correctness for any token type. This is a worthwhile tradeoff for any protocol that accepts arbitrary ERC-20 tokens.

## Rebasing Tokens

Rebasing tokens adjust their total supply periodically to maintain a target price. Each holder's balance is automatically adjusted:

```solidity
contract RebaseToken is ERC20 {
    uint256 public rebaseInterval = 1 days;
    uint256 public lastRebase;
    uint256 public targetPrice = 1e18; // $1.00
    
    function rebase() external {
        require(block.timestamp >= lastRebase + rebaseInterval);
        
        uint256 currentPrice = getCurrentPrice();
        
        if (currentPrice > targetPrice) {
            // Expand supply: increase all balances
            uint256 expansionRate = ((currentPrice - targetPrice) * 100) / targetPrice;
            _rebase(expansionRate, true);
        } else if (currentPrice < targetPrice) {
            // Contract supply: decrease all balances
            uint256 contractionRate = ((targetPrice - currentPrice) * 100) / targetPrice;
            _rebase(contractionRate, false);
        }
        
        lastRebase = block.timestamp;
    }
}
```

Rebasing tokens create complex security considerations:

1. **Approval manipulation:** If Alice approves Bob for 100 tokens, and the supply expands by 10%, Bob can now spend 110 tokens. The approval did not change, but the effective allowance did. This is because approvals are stored as absolute values, but rebasing changes the token's internal accounting. Protocols that interact with rebasing tokens must use "elastic" approval tracking that adjusts with rebases.

2. **Lending protocol issues:** If a user deposits 100 rebasing tokens as collateral, and the supply expands, the collateral value increases. But the debt does not change, potentially creating undercollateralized positions. Conversely, if supply contracts, the collateral value decreases, potentially triggering unnecessary liquidations. Lending protocols must account for rebasing by tracking the underlying value rather than the raw token balance.

3. **DEX pool imbalances:** Rebasing tokens can cause imbalances in liquidity pools, as one side of the pool rebases but the other does not. AMMs like Uniswap do not natively handle rebasing tokens, so liquidity providers may experience unexpected impermanent loss. Specialized DEXes like BeachSwap are designed specifically for rebasing tokens.

4. **Transfer accounting:** When transferring rebasing tokens, the sender's balance decreases by the transfer amount, but the recipient's balance may be different if a rebase occurs between the two balance checks. Protocols must use the actual balance change rather than the transfer amount.

### Rebasing Token Integration Patterns

If you are building a protocol that accepts rebasing tokens, use these patterns:

1. **Cache-and-check:** Before and after any operation, check the actual balance change rather than trusting the transfer amount.

```solidity
function deposit(address token, uint256 amount) external {
    uint256 balanceBefore = IERC20(token).balanceOf(address(this));
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    uint256 balanceAfter = IERC20(token).balanceOf(address(this));
    
    uint256 actualAmount = balanceAfter - balanceBefore;
    balances[msg.sender] += actualAmount;
}
```

2. **Elastic accounting:** Track positions in terms of "shares" rather than raw token amounts. When a rebase occurs, the share value changes, but the number of shares remains constant.

3. **Oracle integration:** Use rebasing-aware oracles that report the correct price accounting for the rebase mechanism.

## ERC-721 (NFT) Vulnerabilities

ERC-721 tokens represent unique, non-fungible assets. They have their own vulnerability class.

### Unsafe Transfers

The `safeTransferFrom` function calls the recipient's `onERC721Received` callback. If the recipient is a contract that does not implement this function, the transfer reverts. But if the contract implements it maliciously, it can re-enter:

```solidity
// Vulnerable NFT contract
contract VulnerableNFT is ERC721 {
    uint256 public nextTokenId;
    mapping(uint256 => uint256) public prices;
    
    function mint() external payable {
        require(msg.value >= 0.01 ether);
        _mint(msg.sender, nextTokenId++);
    }
    
    function buy(uint256 tokenId) external payable {
        require(msg.value >= prices[tokenId]);
        
        // Unsafe: calls recipient before state update
        _safeTransfer(address(this), msg.sender, tokenId);
        
        // State update after external call
        prices[tokenId] = 0;
    }
}
```

The attacker's `onERC721Received` callback can re-enter the `buy` function before the price is zeroed, purchasing the same NFT multiple times at the original price.

### Metadata Manipulation

Some NFT contracts use mutable metadata (token URIs that can be changed by the contract owner). This creates a risk:

```solidity
// Vulnerable: mutable metadata
contract MutableNFT is ERC721 {
    address public owner;
    mapping(uint256 => string) private _tokenURIs;
    
    function setTokenURI(uint256 tokenId, string calldata uri) external {
        require(msg.sender == owner);
        _tokenURIs[tokenId] = uri;
    }
}
```

The owner can change the metadata after sale, replacing legitimate artwork with something else. This is a trust issue — buyers must trust the owner not to alter metadata.

**Mitigation:** Use immutable metadata (IPFS hashes stored in the constructor) or decentralized metadata storage (IPFS with content-addressed URIs).

### Royalty Enforcement

ERC-2981 defines a royalty standard that allows NFTs to specify a royalty percentage for secondary sales. However, royalty enforcement is voluntary — marketplaces can choose not to honor it:

```solidity
// ERC-2981 royalty standard
contract RoyaltyNFT is ERC721, ERC2981 {
    constructor() ERC2981() {}
    
    function _mint(address to, uint256 tokenId) internal override {
        super._mint(to, tokenId);
        _setDefaultRoyalty(msg.sender, 500); // 5% royalty
    }
}
```

Some marketplaces (like OpenSea) enforce royalties at the protocol level, but others do not. This creates a race to the bottom where creators cannot guarantee they receive royalties on secondary sales.

### Batch Minting Vulnerabilities

Batch minting functions that mint multiple NFTs in a single transaction can have vulnerabilities:

```solidity
// Vulnerable: batch mint with unbounded loop
function batchMint(address to, uint256 quantity) external {
    require(msg.sender == owner);
    for (uint i = 0; i < quantity; i++) {
        _mint(to, nextTokenId++);
    }
}
```

If `quantity` is very large, the transaction exceeds the block gas limit and fails. An attacker could grief a batch mint by calling it with an enormous quantity, causing it to consume all gas and revert.

**Mitigation:** Set a maximum batch size:

```solidity
uint256 public constant MAX_BATCH_SIZE = 50;

function batchMint(address to, uint256 quantity) external {
    require(msg.sender == owner);
    require(quantity <= MAX_BATCH_SIZE, "Batch too large");
    for (uint i = 0; i < quantity; i++) {
        _mint(to, nextTokenId++);
    }
}
```

## ERC-1155 (Multi-Token) Vulnerabilities

ERC-1155 combines fungible and non-fungible tokens in a single contract. It is used for gaming assets, where a single contract manages multiple token types. The standard is more gas-efficient than deploying separate ERC-20 and ERC-721 contracts, but it introduces unique vulnerabilities.

### Batch Transfer Issues

```solidity
// Simplified ERC-1155 batch transfer
function safeBatchTransferFrom(
    address from,
    address to,
    uint256[] calldata ids,
    uint256[] calldata amounts,
    bytes calldata data
) external {
    require(ids.length == amounts.length, "Length mismatch");
    
    for (uint i = 0; i < ids.length; i++) {
        balances[from][ids[i]] -= amounts[i];
        balances[to][ids[i]] += amounts[i];
        emit TransferSingle(msg.sender, from, to, ids[i], amounts[i]);
    }
    
    if (data.length > 0) {
        require(
            IERC1155Receiver(to).onERC1155BatchReceived(
                msg.sender, from, ids, amounts, data
            ) == ERC1155_BATCH_RECEIVED_SELECTOR
        );
    }
}
```

The vulnerability: the batch transfer checks `ids.length == amounts.length` but does not check for duplicate IDs. An attacker could pass `[1, 1, 1]` as IDs and `[100, 100, 100]` as amounts, debiting 300 from the sender but crediting only 100 to the recipient (or vice versa, depending on implementation). This is because the loop updates the same storage slot three times, and the final balance depends on the order of operations.

The fix: check for duplicate IDs and revert if found:

```solidity
function safeBatchTransferFrom(...) external {
    require(ids.length == amounts.length, "Length mismatch");
    
    // Check for duplicate IDs
    for (uint i = 0; i < ids.length; i++) {
        for (uint j = i + 1; j < ids.length; j++) {
            require(ids[i] != ids[j], "Duplicate IDs");
        }
    }
    
    // Original transfer logic...
}
```

The duplicate check adds gas cost (O(n²) for the nested loop), but it prevents a critical vulnerability that could allow token theft.

### Reentrancy via Callbacks

ERC-1155's `onERC1155Received` and `onERC1155BatchReceived` callbacks can be exploited for reentrancy, just like ERC-721's `onERC721Received`. The callback is executed before the state is fully updated, allowing the recipient to re-enter the contract.

```solidity
// Vulnerable: callback before state update
function safeTransferFrom(
    address from,
    address to,
    uint256 id,
    uint256 amount,
    bytes calldata data
) external {
    // Check balance
    require(balances[from][id] >= amount, "Insufficient balance");
    
    // Callback before state update
    if (to.code.length > 0) {
        require(
            IERC1155Receiver(to).onERC1155Received(
                msg.sender, from, id, amount, data
            ) == ERC1155_RECEIVED_SELECTOR
        );
    }
    
    // State update after callback
    balances[from][id] -= amount;
    balances[to][id] += amount;
}
```

The fix: update state before the callback (Checks-Effects-Interactions pattern):

```solidity
function safeTransferFrom(...) external {
    require(balances[from][id] >= amount, "Insufficient balance");
    
    // State update BEFORE callback
    balances[from][id] -= amount;
    balances[to][id] += amount;
    
    // Callback after state update
    if (to.code.length > 0) {
        require(
            IERC1155Receiver(to).onERC1155Received(
                msg.sender, from, id, amount, data
            ) == ERC1155_RECEIVED_SELECTOR
        );
    }
}
```

### Minting Vulnerabilities

ERC-1155 contracts often have minting functions that are restricted to the contract owner. If the minting function does not validate inputs properly, an attacker could mint arbitrary tokens:

```solidity
// Vulnerable: no supply cap
function mint(address to, uint256 id, uint256 amount) external onlyOwner {
    balances[to][id] += amount;
    totalSupply[id] += amount;
    emit TransferSingle(msg.sender, address(0), to, id, amount);
}
```

An attacker who compromises the owner key could mint unlimited tokens, diluting all existing holders. The fix: implement a supply cap and verify it before minting:

```solidity
mapping(uint256 => uint256) public maxSupply;

function mint(address to, uint256 id, uint256 amount) external onlyOwner {
    require(totalSupply[id] + amount <= maxSupply[id], "Exceeds max supply");
    balances[to][id] += amount;
    totalSupply[id] += amount;
    emit TransferSingle(msg.sender, address(0), to, id, amount);
}
```

## Real Exploits

### Tether (USDT) Approval Vulnerability (2017)

Tether's original ERC-20 implementation did not properly handle approval changes. The `approve` function did not check for existing allowances, enabling the approval race condition. An attacker front-ran an approval change, spending both the old and new allowance.

### ERC-4626 Vault Exploits (2022)

Several yield vault implementations using the ERC-4626 standard had accounting vulnerabilities. The standard defines a tokenized vault where users deposit tokens and receive shares. The vulnerability arose from incorrect share price calculations:

```solidity
// Vulnerable: rounding error in share calculation
function deposit(uint256 assets) public returns (uint256 shares) {
    shares = (assets * totalSupply()) / totalAssets();
    _mint(msg.sender, shares);
    _depositUnchecked(msg.sender, assets);
}

function _depositUnchecked(address account, uint256 assets) internal {
    // If totalAssets() changes between the share calculation and the deposit,
    // the user may receive more or fewer shares than intended
}
```

The fix: use the exact assets being deposited rather than querying totalAssets:

```solidity
function deposit(uint256 assets) public returns (uint256 shares) {
    shares = previewDeposit(assets);
    _mint(msg.sender, shares);
    _deposit(msg.sender, assets);
}
```

### Multi-Token Exploits (2023)

Several gaming platforms using ERC-1155 experienced exploits due to batch transfer vulnerabilities. The exploit allowed attackers to transfer more tokens than they owned by passing duplicate token IDs in batch operations.

## Assessment

### Lab 1: Token Vulnerability Analysis (90 minutes)

**Objective:** Identify and exploit vulnerabilities in token contracts.

**Tasks:**

1. You are given three token contracts:

**Contract 1: Legacy Token**

```solidity
contract LegacyToken {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    function transfer(address to, uint256 amount) public returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }
}
```

**Contract 2: Fee Token**

```solidity
contract FeeToken {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    uint256 public constant FEE = 2;
    
    function transfer(address to, uint256 amount) public returns (bool) {
        uint256 fee = amount * FEE / 100;
        balances[msg.sender] -= amount;
        balances[to] += amount - fee;
        balances[address(this)] += fee;
        return true;
    }
}
```

**Contract 3: Rebasing Token**

```solidity
contract RebaseToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    uint256 public multiplier = 1e18;
    
    function rebase(uint256 newMultiplier) external {
        require(msg.sender == address(this));
        multiplier = newMultiplier;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return balances[account] * multiplier / 1e18;
    }
}
```

2. For each contract:
   - Identify all vulnerabilities.
   - Write an exploit contract that demonstrates each vulnerability.
   - Write a fixed version of the contract.
   - Write tests proving the exploit works and the fix prevents it.

3. Write a 500-word analysis of each vulnerability class.

**Grading criteria:**
- All vulnerabilities identified (30%)
- Exploit contracts demonstrate vulnerabilities (25%)
- Fixed contracts prevent vulnerabilities (25%)
- Analysis is accurate and insightful (15%)
- Tests prove exploit and fix (5%)

### Lab 2: Token Integration Security (60 minutes)

**Objective:** Assess the security of integrating a token into a DeFi protocol.

**Tasks:**

1. You are given a lending protocol that accepts any ERC-20 token as collateral:

```solidity
contract SimpleLending {
    mapping(address => mapping(address => uint256)) public collateral;
    mapping(address => mapping(address => uint256)) public debt;
    
    function depositCollateral(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        collateral[msg.sender][token] += amount;
    }
    
    function borrow(address token, uint256 amount) external {
        uint256 totalCollateral = 0;
        // Calculate total collateral value...
        require(totalCollateral >= amount * 2, "Insufficient collateral");
        
        IERC20(token).transfer(msg.sender, amount);
        debt[msg.sender][token] += amount;
    }
}
```

2. Identify at least 4 ways a malicious token contract could exploit this lending protocol.
3. Write exploit tokens that demonstrate each attack.
4. Write a secure version of the lending protocol that handles malicious tokens.
5. Write a 300-word guide for protocol developers on how to safely integrate arbitrary tokens.

**Grading criteria:**
- All 4 attack vectors identified (30%)
- Exploit tokens demonstrate attacks (25%)
- Secure lending protocol prevents attacks (25%)
- Integration guide is practical and comprehensive (20%)

### Lab 3: Token Standard Comparison (45 minutes)

**Objective:** Analyze the security properties of different token standards.

**Tasks:**

1. Compare the security properties of ERC-20, ERC-721, and ERC-1155:
   - Access control.
   - Transfer safety.
   - Approval mechanisms.
   - Callback vulnerabilities.
   - Gas efficiency.

2. For each standard, identify the top 3 vulnerabilities and their mitigations.

3. Write a decision matrix for choosing which token standard to use for:
   - A governance token.
   - A collectible NFT.
   - A gaming asset with both fungible and non-fungible variants.
   - A security token (regulated asset).

4. Write a 500-word analysis of how token standard vulnerabilities affect the broader DeFi ecosystem.

**Grading criteria:**
- Security comparison is accurate and comprehensive (30%)
- Vulnerabilities and mitigations are correctly identified (25%)
- Decision matrix is well-justified (25%)
- Ecosystem analysis is insightful (20%)

## Evidence

Collect the following artifacts for your portfolio:

1. **Token vulnerability analysis** from Lab 1, with exploit contracts and fixes.
2. **Integration security assessment** from Lab 2, with exploit tokens and secure protocol implementation.
3. **Token standard comparison** from Lab 3, with decision matrix and ecosystem analysis.
4. **Token security checklist** for developers, covering common vulnerabilities and best practices.
5. **Token audit template** for performing security reviews of token contracts.

These artifacts demonstrate that you can identify, exploit, and fix token vulnerabilities, and that you understand how token security affects the broader ecosystem.
