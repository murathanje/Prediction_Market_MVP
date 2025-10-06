# Decentralized Prediction Market MVP

A full-stack decentralized prediction market platform built on EVM-compatible blockchains, allowing users to create, bet on, and resolve real-world event outcomes.

## 🏗️ Project Structure

```
├── contracts/          # Smart contracts (Foundry/Solidity)
├── frontend/           # Web application (Next.js + TypeScript)
├── docs/              # System design documentation
└── TODO.md            # Project task breakdown
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

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Foundry ([Installation](https://book.getfoundry.sh/getting-started/installation))
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
cd ../frontend
npm install
```

### Development

#### Smart Contracts

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
```

#### Frontend

```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation

Detailed documentation can be found in the `/docs` folder:
- System Architecture
- Smart Contract Design
- Liquidity Mechanism
- Oracle Strategy
- Deployment Guide

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
forge test -vvv
```

### Frontend
```bash
cd frontend
npm run test
```

## 🚢 Deployment

### Testnet Deployment

Contracts are deployed to:
- **Base Sepolia:** [Coming Soon]
- **Arbitrum Sepolia:** [Coming Soon]

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## 🔑 Environment Variables

### Contracts (`contracts/.env`)
```env
PRIVATE_KEY=your_private_key
BASE_SEPOLIA_RPC_URL=your_base_sepolia_rpc
ARBITRUM_SEPOLIA_RPC_URL=your_arbitrum_sepolia_rpc
BASESCAN_API_KEY=your_basescan_key
ARBISCAN_API_KEY=your_arbiscan_key
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS=deployed_address
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=deployed_address
```

## 📋 Features

### Implemented
- ✅ Project structure and initialization
- ✅ ERC-20 settlement token (SettlementToken contract)
- ✅ Market creation contract (MarketFactory)
- ✅ Position buying (betting with AMM pricing)
- ✅ Market resolution (admin oracle)
- ✅ Winnings claim (with UI)
- ✅ Wallet connection UI (MetaMask support)
- ✅ Betting interface (place bet flow)
- ✅ Market creation UI
- ✅ Comprehensive test suite (49/49 tests passing)
- ⚠️ Local deployment only (Anvil)

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

### MVP Simplifications
1. **Admin Oracle:** Resolution is centralized (resolver role). Production needs decentralized oracle.
2. **Single Market Type:** Only binary (YES/NO) outcomes supported
3. **Basic AMM:** Simplified constant product formula. LMSR would provide better liquidity
4. **No Dispute Mechanism:** Resolution is final. Need challenge period in production
5. **Limited Market Discovery:** No search, filtering, or categorization  
6. **No Position Trading:** Cannot sell positions before market resolution
7. **Fixed Initial Liquidity:** Cannot add/remove liquidity after creation

### Known Issues
- Market creation requires page refresh to see new market
- No real-time price updates (need to refresh manually)
- Mobile responsiveness not optimized
- Transaction errors don't show detailed messages

### Security Notes
- ⚠️ **NOT AUDITED:** Do not use with real funds on mainnet
- ⚠️ **Testnet/Local Only:** This is a demonstration/MVP implementation
- ⚠️ **Centralized Elements:** Resolver role has significant control

## 🔐 Security Considerations

**Implemented Protections:**
- ✅ Reentrancy guards on all state-changing functions
- ✅ Role-based access control  
- ✅ Input validation and sanitization
- ✅ Pausability mechanism
- ✅ Comprehensive test coverage (49/49 tests passing)

## 🤝 AI Tools Used

This project was developed with AI assistance to accelerate development and ensure best practices:

### Claude Sonnet 4.5 (via Cursor)
**Primary Use:** Architecture and implementation
- **System Design:** Architectural decisions, trade-off analysis, AMM design, oracle strategy
- **Smart Contracts:** Full implementation of SettlementToken, PredictionMarket, MarketFactory
- **Testing:** Complete test suite design and implementation (49 tests)
- **Frontend:** React components, Web3 integration (wagmi/viem), UI/UX implementation
- **Documentation:** System design document, README, code comments
- **Code Review:** Security analysis, gas optimization suggestions, best practices
- **Problem Solving:** Debugging hydration errors, deployment scripts, contract integration

### GitHub Copilot
**Secondary Use:** Code completion and productivity
- Boilerplate generation for standard patterns
- Auto-completion of repetitive code
- Solidity NatSpec comments
- TypeScript type definitions

### Development Approach
- **Human-Led:** All architectural decisions and trade-off reasoning
- **AI-Assisted:** Implementation speed and code quality
- **Iterative:** Continuous refinement based on requirements and testing

This approach allowed focusing on system design and architectural thinking while accelerating implementation.

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

