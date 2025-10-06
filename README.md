# Decentralized Prediction Market MVP

A full-stack decentralized prediction market platform built on EVM-compatible blockchains, allowing users to create, bet on, and resolve real-world event outcomes.

## 🌐 Live Deployment

**Ethereum Sepolia Testnet** (Verified ✅)

- **SettlementToken (PMT):** [`0x9587900CdA35308bfC14ea41Ccd0C1947b159Ecb`](https://sepolia.etherscan.io/address/0x9587900cda35308bfc14ea41ccd0c1947b159ecb)
- **MarketFactory:** [`0xDe2b5b73af47Ba81d8AeF7FBCF5B0cd06C9479b0`](https://sepolia.etherscan.io/address/0xde2b5b73af47ba81d8aef7fbcf5b0cd06c9479b0)

**Network Details:**
- Chain ID: 11155111
- RPC URL: Use your own Alchemy/Infura endpoint

## 🏗️ Project Structure

```
├── contracts/          # Smart contracts (Foundry/Solidity)
├── frontend/           # Web application (Next.js + TypeScript)
└── docs/              # System design documentation
```

## 🛠️ Technology Stack

### Smart Contracts
- **Framework:** Foundry
- **Language:** Solidity ^0.8.28
- **Libraries:** OpenZeppelin Contracts
- **Testing:** Forge Test Suite

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Web3:** wagmi + viem
- **State:** TanStack Query

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Foundry ([Installation](https://book.getfoundry.sh/getting-started/installation))
- MetaMask or any Web3 wallet
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Task
```

2. **Install contract dependencies**
```bash
cd contracts
forge install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
```

## 🎮 Usage Guide

### Option 1: Use Sepolia Testnet (Recommended for Testing)

The contracts are already deployed and verified on Ethereum Sepolia testnet!

#### Step 1: Configure MetaMask
Add Sepolia network to MetaMask:
- **Network Name:** Ethereum Sepolia
- **RPC URL:** `https://sepolia.infura.io/v3/YOUR_PROJECT_ID` (or your preferred provider)
- **Chain ID:** `11155111`
- **Currency Symbol:** ETH

#### Step 2: Get Test ETH
Get free Sepolia ETH from faucets:
- 🚰 https://sepoliafaucet.com/
- 🚰 https://www.alchemy.com/faucets/ethereum-sepolia

#### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

#### Step 4: Connect & Trade
1. Open http://localhost:3000
2. Connect your MetaMask wallet
3. Make sure you're on Sepolia network
4. Start creating markets or placing bets!

**Contract Addresses (Sepolia):**
- PMT Token: `0x9587900CdA35308bfC14ea41Ccd0C1947b159Ecb`
- Factory: `0xDe2b5b73af47Ba81d8AeF7FBCF5B0cd06C9479b0`

---

### Option 2: Local Development with Anvil

#### Step 1: Start Anvil (Local Ethereum Node)
```bash
cd contracts
anvil
```

Keep this terminal running. Anvil will start on `http://127.0.0.1:8545`

#### Step 2: Deploy Contracts (New Terminal)
```bash
cd contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast
```

#### Step 3: Configure MetaMask for Local Network
Add custom network:
- **Network Name:** Anvil Local
- **RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency Symbol:** ETH

Import Anvil's first account:
- **Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

This account has 10,000 ETH pre-funded!

#### Step 4: Mint Test Tokens
```bash
cd contracts
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  "mint(address,uint256)" \
  YOUR_ADDRESS \
  1000000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### Step 5: Start Frontend
```bash
cd frontend
npm run dev
```

#### Step 6: Use the App
1. Open http://localhost:3000
2. Connect MetaMask (select Anvil Local network)
3. Create markets and place bets!

---

## 🛠️ Development

### Smart Contracts

```bash
cd contracts

# Compile contracts
forge build

# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Run tests with coverage
forge coverage

# Deploy to testnet
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Verify contracts
forge verify-contract <CONTRACT_ADDRESS> src/SettlementToken.sol:SettlementToken --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY
```

### Frontend

```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🌍 Network Support

The frontend **automatically detects your MetaMask network** and uses the correct contract addresses:

- **Sepolia (Chain ID: 11155111)** → Uses Sepolia contracts
- **Anvil Local (Chain ID: 31337)** → Uses local contracts

Simply switch networks in MetaMask - no configuration needed!

## 📚 Documentation

Detailed documentation can be found in the `/docs` folder:
- [System Design](./docs/SYSTEM_DESIGN.md) - Architecture and design decisions
- [Oracle Integration](./docs/ORACLE_INTEGRATION.md) - Resolution mechanism
- [Evaluation](./docs/EVALUATION.md) - Project assessment and trade-offs

## 🧪 Testing

### Smart Contracts
All tests passing ✅ (49/49)

```bash
cd contracts

# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test testMarketCreation

# Gas report
forge test --gas-report

# Coverage report
forge coverage
```

**Test Coverage:**
- ✅ Token minting and transfers
- ✅ Market creation and validation
- ✅ Position buying with AMM pricing
- ✅ Market resolution (all outcomes)
- ✅ Winnings calculation and claims
- ✅ Access control and security
- ✅ Edge cases and error handling

## 🚢 Deployment

### Deployed Networks

✅ **Ethereum Sepolia (Testnet)**
- Deployed and verified on Etherscan
- Ready for testing with faucet ETH
- See contract addresses in [Live Deployment](#-live-deployment) section

### Deploy to Other Networks

```bash
cd contracts

# Set up environment variables
cp .env.example .env
# Edit .env with your private key and RPC URLs

# Deploy to Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy to other networks (Base, Arbitrum, etc.)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $YOUR_RPC_URL \
  --broadcast
```

## 🔑 Environment Variables

### Contracts (`contracts/.env`)
```env
PRIVATE_KEY=0xyour_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Frontend
**No environment variables needed!** The frontend automatically:
- Detects your MetaMask network (Sepolia or Local Anvil)
- Loads correct contract addresses from `deployments.json`
- Adapts UI based on connected network

Optional override (advanced):
```env
# frontend/.env.local
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x...
```

## 📋 Features

### Implemented ✅
- ✅ **Smart Contracts**
  - ERC-20 settlement token (SettlementToken with mint function)
  - Market creation factory (MarketFactory with registry)
  - AMM-based prediction markets (constant product formula)
  - Market resolution system (resolver role)
  - Comprehensive test suite (49/49 tests passing)
  
- ✅ **Frontend (Next.js 15)**
  - Wallet connection (MetaMask integration via wagmi)
  - Market creation interface with approval flow
  - Betting interface (YES/NO positions)
  - Real-time price display (AMM pricing)
  - Market resolution & claim winnings UI
  - Automatic network detection (Sepolia/Anvil)
  
- ✅ **Deployment & Verification**
  - Ethereum Sepolia testnet deployment
  - Etherscan contract verification
  - Automated deployment scripts
  - Multi-network support (local + testnet)

### Future Enhancements
- **Advanced AMM:** Implement LMSR (Logarithmic Market Scoring Rule) for better price discovery
- **Decentralized Oracles:** Integrate Chainlink Any API + UMA Optimistic Oracle with dispute mechanism
- **Multiple Outcomes:** Support more than binary (YES/NO) markets (3+ outcomes)
- **Conditional Markets:** Enable dependent markets (e.g., "If A happens, will B happen?")
- **Liquidity Mining:** Incentivize liquidity providers with rewards
- **Real-time Updates:** WebSocket integration for live price feeds
- **Mobile App:** React Native implementation
- **Advanced Analytics:** Historical data, profit/loss tracking, market statistics
- **Social Features:** Comments, market discussions, reputation system
- **Governance:** DAO for platform parameters and dispute resolution

## ⚠️ Known Limitations

### MVP Design Trade-offs
1. **Admin Oracle:** Resolution is centralized (resolver role). Production requires decentralized oracle (Chainlink/UMA).
2. **Single Market Type:** Only binary (YES/NO) outcomes supported. Future: multi-outcome markets.
3. **Basic AMM:** Simplified constant product formula (x*y=k). LMSR would provide better liquidity and price discovery.
4. **No Dispute Mechanism:** Resolution is final once set. Production needs challenge period and stake-based disputes.
5. **Limited Market Discovery:** No search, filtering, or categorization. Future: tags, categories, and advanced filtering.
6. **No Position Trading:** Cannot sell positions before market resolution. Future: secondary market for position trading.
7. **Fixed Initial Liquidity:** Cannot add/remove liquidity after creation. Future: continuous liquidity provision.

### Known Issues
- Auto-refresh every 10 seconds for market list (can be improved with WebSocket)
- Mobile UI not fully optimized (works but could be better)
- No transaction history tracking (only current positions shown)
- Limited error messages for failed transactions

### Security Considerations
- ⚠️ **NOT AUDITED:** This is a demonstration MVP - do not use with real funds on mainnet
- ⚠️ **For Testing Only:** Use Sepolia testnet or local Anvil for experimentation
- ⚠️ **Centralized Resolver:** Market creator has full resolution control (by design for MVP)
- ✅ **Security Measures:** Reentrancy guards, access control, input validation, pausability

## 🤝 Development Notes

This project was developed as an MVP demonstration of a decentralized prediction market, showcasing:
- Smart contract development with Foundry
- Web3 frontend integration with modern React patterns
- Multi-network deployment and verification
- Comprehensive testing and documentation

**Development Stack:**
- Smart Contracts: Solidity + Foundry + OpenZeppelin
- Frontend: Next.js 15 + TypeScript + Tailwind CSS
- Web3 Integration: wagmi + viem
- Testing: Forge test suite (49 tests)
- Deployment: Ethereum Sepolia (verified)

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Foundry team for excellent development tools
- wagmi and viem teams for Web3 tooling

## 📞 Contact

For questions or feedback, please open an issue in the repository.

---

**Note:** This is an MVP built for demonstration purposes. Not audited for production use.

