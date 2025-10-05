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
- [ ] ERC-20 settlement token
- [ ] Market creation contract
- [ ] Position buying (betting)
- [ ] Market resolution
- [ ] Winnings claim
- [ ] Wallet connection UI
- [ ] Betting interface
- [ ] Testnet deployment

### Future Enhancements
- Advanced liquidity mechanisms (AMM)
- Decentralized oracle integration (Chainlink/UMA)
- Market creation UI
- Real-time market updates
- Mobile responsive design
- Advanced analytics dashboard

## 🔐 Security Considerations

- Reentrancy guards on all state-changing functions
- Role-based access control
- Input validation and sanitization
- Pausability mechanism
- Comprehensive test coverage

## 🤝 AI Tools Used

This project was developed with the assistance of:
- **Claude Sonnet 4.5** (via Cursor): Architecture design, smart contract implementation, code review
- **GitHub Copilot**: Code completion and boilerplate generation

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

