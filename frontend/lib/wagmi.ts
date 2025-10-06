import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import deployments from './deployments.json'

export const anvilLocal = {
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
} as const

export const config = createConfig({
  chains: [anvilLocal, sepolia],
  connectors: [injected()],
  transports: {
    [anvilLocal.id]: http(),
    [sepolia.id]: http(),
  },
})

// Get contract addresses based on the connected chain ID
export function getContractAddresses(chainId: number | undefined) {
  // Default to local if no chain connected
  if (!chainId) {
    return {
      SettlementToken: deployments.local.settlementToken as `0x${string}`,
      MarketFactory: deployments.local.marketFactory as `0x${string}`,
      TestMarket: (deployments.local.testMarket || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    }
  }

  // Sepolia
  if (chainId === 11155111) {
    return {
      SettlementToken: deployments.sepolia.settlementToken as `0x${string}`,
      MarketFactory: deployments.sepolia.marketFactory as `0x${string}`,
      TestMarket: (deployments.sepolia.testMarket || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    }
  }

  // Anvil Local
  if (chainId === 31337) {
    return {
      SettlementToken: deployments.local.settlementToken as `0x${string}`,
      MarketFactory: deployments.local.marketFactory as `0x${string}`,
      TestMarket: (deployments.local.testMarket || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    }
  }

  // Default fallback to local
  return {
    SettlementToken: deployments.local.settlementToken as `0x${string}`,
    MarketFactory: deployments.local.marketFactory as `0x${string}`,
    TestMarket: (deployments.local.testMarket || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  }
}
