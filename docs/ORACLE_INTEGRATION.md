# 🔮 Oracle Integration Strategy

## Current State (MVP): Admin-Controlled

### Implementation
```solidity
contract PredictionMarket {
    address public resolver; // Market creator
    
    function resolveMarket(bool outcome) external {
        require(msg.sender == resolver, "Unauthorized");
        require(block.timestamp > marketInfo.endTime, "Market still active");
        
        marketInfo.outcome = outcome;
        marketInfo.status = MarketStatus.RESOLVED;
        
        emit MarketResolved(outcome);
    }
}
```

### Limitations
- ❌ **Centralized:** Single point of failure
- ❌ **Trust required:** Resolver could be biased
- ❌ **No verification:** No proof of correctness
- ❌ **Dispute risk:** No challenge mechanism

### Why This is OK for MVP
✅ Simple implementation
✅ No external dependencies
✅ Fast iteration
✅ Demonstrates core mechanics
✅ Requirements allow it

---

## 🎯 Production Solution: Hybrid Oracle System

### Architecture
```
┌─────────────────────────────────────────────────────┐
│                 HYBRID ORACLE SYSTEM                │
└─────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │Chainlink│     │   UMA   │     │ Manual  │
   │Any API  │     │Optimistic│    │ Backup  │
   └────┬────┘     └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │Aggregator│
                    │ Contract │
                    └────┬────┘
                         │
                 ┌───────▼────────┐
                 │PredictionMarket│
                 └────────────────┘
```

---

## 🔗 Option 1: Chainlink Any API

### Use Case
Fetch real-world data from any API endpoint

### Implementation
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

contract ChainlinkOracle is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    // Oracle configuration
    bytes32 private jobId;
    uint256 private fee;
    
    // Market => Oracle response
    mapping(address => OracleResponse) public responses;
    
    struct OracleResponse {
        bool outcome;
        uint256 timestamp;
        bool fulfilled;
    }
    
    event RequestFulfilled(
        bytes32 indexed requestId,
        address indexed market,
        bool outcome
    );
    
    constructor() ConfirmedOwner(msg.sender) {
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB); // Sepolia LINK
        setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD); // Chainlink operator
        jobId = "ca98366cc7314957b8c012c72f05aeeb"; // HTTP GET > Bool
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0.1 LINK
    }
    
    /**
     * @notice Request outcome from external API
     * @param market Address of prediction market
     * @param apiUrl URL to fetch data from
     * @param jsonPath Path to boolean value in JSON response
     */
    function requestOutcome(
        address market,
        string memory apiUrl,
        string memory jsonPath
    ) public returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        
        // Set the URL to perform the GET request on
        req.add("get", apiUrl);
        
        // Set the path to find the desired data in the API response
        req.add("path", jsonPath);
        
        // Store market address in the request
        req.add("market", addressToString(market));
        
        // Send the request
        return sendChainlinkRequest(req, fee);
    }
    
    /**
     * @notice Callback function called by Chainlink oracle
     */
    function fulfill(
        bytes32 requestId,
        bool outcome
    ) public recordChainlinkFulfillment(requestId) {
        address market = requestIdToMarket[requestId];
        
        responses[market] = OracleResponse({
            outcome: outcome,
            timestamp: block.timestamp,
            fulfilled: true
        });
        
        emit RequestFulfilled(requestId, market, outcome);
    }
    
    /**
     * @notice Get oracle response for a market
     */
    function getOutcome(address market) 
        external 
        view 
        returns (bool outcome, bool fulfilled) 
    {
        OracleResponse memory response = responses[market];
        return (response.outcome, response.fulfilled);
    }
}
```

### Example API Endpoints
```javascript
// Bitcoin price check
{
  "apiUrl": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
  "jsonPath": "bitcoin.usd",
  "condition": "> 100000"
}

// Sports result
{
  "apiUrl": "https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/2025-12-31",
  "jsonPath": "games[0].winner",
  "condition": "== 'LAL'"
}

// Weather data
{
  "apiUrl": "https://api.weather.com/v3/wx/forecast/daily/5day",
  "jsonPath": "temperature.max[0]",
  "condition": "> 30"
}
```

### Pros
✅ Can fetch ANY external data
✅ Fast (minutes)
✅ Flexible
✅ Wide ecosystem support

### Cons
❌ Costs LINK tokens per request
❌ Single oracle = centralization risk
❌ API endpoint must be reliable

---

## 🏛️ Option 2: UMA Optimistic Oracle

### Use Case
Decentralized verification with economic guarantees

### Implementation
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@uma/core/contracts/oracle/interfaces/OptimisticOracleV3Interface.sol";

contract UMAOracle {
    OptimisticOracleV3Interface public oo;
    IERC20 public bondToken;
    uint256 public bondAmount = 100e18; // 100 tokens
    
    struct Assertion {
        address market;
        bytes32 assertionId;
        bool outcome;
        uint256 timestamp;
        bool settled;
    }
    
    mapping(address => Assertion) public marketAssertions;
    
    event AssertionMade(
        address indexed market,
        bytes32 indexed assertionId,
        bool outcome
    );
    
    event AssertionSettled(
        address indexed market,
        bool finalOutcome
    );
    
    constructor(address _optimisticOracle, address _bondToken) {
        oo = OptimisticOracleV3Interface(_optimisticOracle);
        bondToken = IERC20(_bondToken);
    }
    
    /**
     * @notice Propose an outcome for a market
     * @param market Address of prediction market
     * @param outcome Proposed outcome (true/false)
     * @param description Human-readable description of the claim
     */
    function proposeOutcome(
        address market,
        bool outcome,
        string memory description
    ) external returns (bytes32 assertionId) {
        // Bond tokens must be approved first
        bondToken.transferFrom(msg.sender, address(this), bondAmount);
        bondToken.approve(address(oo), bondAmount);
        
        // Create assertion
        assertionId = oo.assertTruth(
            abi.encodePacked(description),
            msg.sender,
            address(this),
            address(0), // No sovereign security
            7200, // 2 hour challenge period
            bondToken,
            bondAmount,
            bytes32(0), // No domain
            bytes32(0)  // No identifier
        );
        
        marketAssertions[market] = Assertion({
            market: market,
            assertionId: assertionId,
            outcome: outcome,
            timestamp: block.timestamp,
            settled: false
        });
        
        emit AssertionMade(market, assertionId, outcome);
    }
    
    /**
     * @notice Settle assertion after challenge period
     */
    function settleAssertion(address market) external {
        Assertion storage assertion = marketAssertions[market];
        require(!assertion.settled, "Already settled");
        
        // Check if assertion was disputed
        bool disputed = oo.getAssertion(assertion.assertionId).escalationManagerSettings.discardOracle;
        
        if (!disputed) {
            // Assertion was not challenged - it's true
            assertion.settled = true;
            emit AssertionSettled(market, assertion.outcome);
        } else {
            // Assertion was disputed - use DVM result
            // (More complex logic needed here)
        }
    }
    
    /**
     * @notice Get oracle outcome for a market
     */
    function getOutcome(address market) 
        external 
        view 
        returns (bool outcome, bool settled) 
    {
        Assertion memory assertion = marketAssertions[market];
        return (assertion.outcome, assertion.settled);
    }
}
```

### How It Works
```
1. Anyone proposes outcome + bonds tokens
   ├─> If correct: Get bond back + reward
   └─> If incorrect: Lose bond

2. Challenge period (2-24 hours)
   ├─> No challenge: Outcome accepted ✅
   └─> Challenge: Goes to dispute resolution

3. Dispute resolution (if needed)
   ├─> UMA token holders vote
   └─> Majority decides outcome
```

### Pros
✅ Decentralized
✅ Economic security (bonds)
✅ Dispute mechanism
✅ Flexible (any question)

### Cons
❌ 2+ hour delay (challenge period)
❌ Requires bond tokens
❌ More complex integration

---

## 🎯 Recommended: Hybrid Approach

### Architecture
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ChainlinkOracle.sol";
import "./UMAOracle.sol";
import "./PredictionMarket.sol";

contract HybridOracle {
    ChainlinkOracle public chainlink;
    UMAOracle public uma;
    
    enum OracleType {
        CHAINLINK_PRIMARY,
        UMA_PRIMARY,
        BOTH_REQUIRED
    }
    
    struct MarketOracle {
        OracleType oracleType;
        bool chainlinkResult;
        bool umaResult;
        bool chainlinkFulfilled;
        bool umaFulfilled;
    }
    
    mapping(address => MarketOracle) public marketOracles;
    
    /**
     * @notice Request outcome from both oracles
     */
    function requestOutcome(
        address market,
        OracleType oracleType
    ) external {
        marketOracles[market].oracleType = oracleType;
        
        if (oracleType == OracleType.CHAINLINK_PRIMARY || 
            oracleType == OracleType.BOTH_REQUIRED) {
            // Request from Chainlink
            chainlink.requestOutcome(market, apiUrl, jsonPath);
        }
        
        if (oracleType == OracleType.UMA_PRIMARY || 
            oracleType == OracleType.BOTH_REQUIRED) {
            // Anyone can propose via UMA
            // (Incentivized by market fees)
        }
    }
    
    /**
     * @notice Check if outcome is ready
     */
    function canResolve(address market) external view returns (bool) {
        MarketOracle memory mo = marketOracles[market];
        
        if (mo.oracleType == OracleType.CHAINLINK_PRIMARY) {
            return mo.chainlinkFulfilled;
        }
        
        if (mo.oracleType == OracleType.UMA_PRIMARY) {
            return mo.umaFulfilled;
        }
        
        // BOTH_REQUIRED: Need both and they must agree
        if (mo.oracleType == OracleType.BOTH_REQUIRED) {
            return mo.chainlinkFulfilled && 
                   mo.umaFulfilled && 
                   (mo.chainlinkResult == mo.umaResult);
        }
        
        return false;
    }
    
    /**
     * @notice Get final outcome
     */
    function getOutcome(address market) external view returns (bool) {
        MarketOracle memory mo = marketOracles[market];
        
        if (mo.oracleType == OracleType.CHAINLINK_PRIMARY) {
            return mo.chainlinkResult;
        }
        
        if (mo.oracleType == OracleType.UMA_PRIMARY) {
            return mo.umaResult;
        }
        
        // BOTH_REQUIRED: They already agreed (checked in canResolve)
        return mo.chainlinkResult;
    }
}
```

### Decision Matrix
| Market Type | Oracle | Why |
|-------------|--------|-----|
| **Price-based** (BTC > $100k) | Chainlink Primary + UMA Backup | Fast, verifiable data feeds |
| **Subjective** (Who wins election?) | UMA Primary | Needs human judgment |
| **High-value** (>$100k TVL) | BOTH_REQUIRED | Maximum security |
| **Low-value** (<$1k TVL) | Manual Backup | Not worth oracle costs |

---

## 🔧 Off-Chain Data Fetching

### Method 1: Chainlink Functions (Recommended)
```javascript
// Chainlink Function (runs off-chain)
const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`;
const response = await Functions.makeHttpRequest({ url: apiUrl });
const price = response.data.bitcoin.usd;

// Return to on-chain
return Functions.encodeUint256(price);
```

### Method 2: Subgraph + Oracle
```
1. The Graph indexes on-chain events
2. Backend watches subgraph for "market ended" events
3. Backend fetches off-chain data from APIs
4. Backend submits to oracle contract
```

### Method 3: Keeper Network
```solidity
// Chainlink Keeper compatible
function checkUpkeep(bytes calldata) 
    external 
    view 
    returns (bool upkeepNeeded, bytes memory performData) 
{
    // Check if any market needs resolution
    for (uint i = 0; i < markets.length; i++) {
        if (shouldResolve(markets[i])) {
            upkeepNeeded = true;
            performData = abi.encode(markets[i]);
            break;
        }
    }
}

function performUpkeep(bytes calldata performData) external {
    address market = abi.decode(performData, (address));
    // Trigger oracle request
    oracle.requestOutcome(market);
}
```

---

## 💰 Cost Analysis

### Chainlink Any API
- **Per request:** 0.1 LINK (~$1-2)
- **Speed:** 1-5 minutes
- **Best for:** Automated, high-volume

### UMA Optimistic Oracle
- **Per assertion:** Bond amount (e.g., 100 USDC)
- **Get back if correct:** Yes + share of market fees
- **Speed:** 2-24 hours
- **Best for:** High-value, subjective

### Manual (Current MVP)
- **Cost:** $0
- **Speed:** Instant (when resolver acts)
- **Best for:** MVP, testing, low-volume

---

## 🚀 Migration Path

### Phase 1: MVP (Current) ✅
```
Admin resolver → Manual resolution
```

### Phase 2: Hybrid (Next)
```
Admin resolver + Chainlink option
└─> Market creator chooses oracle type
```

### Phase 3: Decentralized
```
Chainlink + UMA with automatic failover
└─> No admin needed
```

### Phase 4: Fully Automated
```
Keeper network + Multiple oracles + Aggregation
└─> Zero human intervention
```

---

## 📝 Implementation Checklist

### To Add Oracle Support:

#### Smart Contracts
- [ ] Create `IOracle.sol` interface
- [ ] Implement `ChainlinkOracle.sol`
- [ ] Implement `UMAOracle.sol`
- [ ] Add oracle selection to `MarketFactory`
- [ ] Update `PredictionMarket.sol` to accept oracle input

#### Frontend
- [ ] Oracle type selector in market creation
- [ ] Oracle status display
- [ ] Challenge interface (for UMA)
- [ ] Manual fallback UI

#### Infrastructure
- [ ] Deploy oracle contracts
- [ ] Fund with LINK tokens
- [ ] Set up keeper automation
- [ ] Monitor oracle health

#### Testing
- [ ] Oracle integration tests
- [ ] Challenge scenario tests
- [ ] Failover tests
- [ ] Gas cost analysis

---

## 🎯 Recommendation for This Project

### For MVP Submission: Keep Current ✅
**Reasons:**
1. Requirements explicitly allow it
2. Demonstrates core betting mechanics
3. No external dependencies
4. Focus on smart contract quality
5. Can explain production plan (this document!)

### For Production: Start with Chainlink
**Phase 1 Implementation (2-3 days):**
1. Add Chainlink Any API integration
2. Keep manual as backup
3. Let market creator choose

**Why Chainlink First:**
- Easier integration
- Faster resolution
- Good for price-based markets
- Wide adoption

**Then Add UMA (1 week later):**
- For subjective questions
- Better decentralization
- Dispute mechanism

---

## 🔗 Resources

### Chainlink
- [Any API Docs](https://docs.chain.link/any-api/introduction)
- [Functions Docs](https://docs.chain.link/chainlink-functions)
- [Keeper Docs](https://docs.chain.link/chainlink-automation/introduction)

### UMA
- [Optimistic Oracle V3](https://docs.umaproject.org/developers/optimistic-oracle-v3)
- [Integration Tutorial](https://docs.umaproject.org/developers/quick-start)

### Examples
- [Polymarket](https://polymarket.com/) - Uses UMA
- [Augur](https://augur.net/) - Custom oracle system
- [Hedgehog Markets](https://hedgehog.markets/) - Hybrid approach

---

## 📊 Conclusion

**Current MVP:** Admin oracle is PERFECT for demonstration ✅

**Production:** Hybrid Chainlink + UMA system provides:
- ✅ Decentralization
- ✅ Speed (Chainlink)
- ✅ Security (UMA disputes)
- ✅ Flexibility (multiple oracle types)
- ✅ Cost optimization (choose per market)

**Next Step:** Complete testnet deployment, THEN add oracle integration as enhancement.

