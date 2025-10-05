import { http, createConfig } from 'wagmi'
import { localhost } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

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
  chains: [anvilLocal as any],
  connectors: [injected()],
  transports: {
    [anvilLocal.id]: http(),
  },
})

export const CONTRACTS = {
  SettlementToken: process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS as `0x${string}`,
  MarketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as `0x${string}`,
  TestMarket: process.env.NEXT_PUBLIC_TEST_MARKET_ADDRESS as `0x${string}`,
}
