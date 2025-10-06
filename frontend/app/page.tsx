'use client'

import { useState } from 'react'
import { ConnectWallet } from '@/components/ConnectWallet'
import { MarketList } from '@/components/MarketList'
import { CreateMarket } from '@/components/CreateMarket'
import { CONTRACTS } from '@/lib/wagmi'
import { useReadContract } from 'wagmi'
import MarketFactoryABI from '@/lib/abi/MarketFactory.json'
import { MarketClaimCard } from '@/components/MarketClaimCard'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'markets' | 'create' | 'claim'>('markets')
  const [refreshKey, setRefreshKey] = useState(0)

  // Get all markets for claim page
  const { data: marketCount } = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'getMarketsCount',
  })

  const { data: allMarkets } = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'getMarketsPaginated',
    args: [0n, marketCount || 10n],
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Prediction Market
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bet on real-world events • Powered by blockchain
              </p>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('markets')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'markets'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Active Markets
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✨ Create Market
            </button>
            <button
              onClick={() => setActiveTab('claim')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'claim'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Claim Winnings
            </button>
          </div>

          {activeTab === 'markets' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Active Markets
              </h2>
              <p className="text-gray-600">
                All prediction markets - place your bets!
              </p>
            </>
          )}
          {activeTab === 'create' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create New Market
              </h2>
              <p className="text-gray-600">
                Start a new prediction market for others to participate
              </p>
            </>
          )}
          {activeTab === 'claim' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Resolve & Claim
              </h2>
              <p className="text-gray-600">
                Resolve your markets and claim winnings from positions
              </p>
            </>
          )}
        </div>

        <div className="space-y-6">
          {activeTab === 'markets' && (
            <MarketList key={refreshKey} />
          )}
          {activeTab === 'create' && (
            <CreateMarket 
              onSuccess={() => {
                setRefreshKey(prev => prev + 1)
                setActiveTab('markets')
              }}
            />
          )}
          {activeTab === 'claim' && (
            <div className="space-y-6">
              {allMarkets && (allMarkets as `0x${string}`[]).length > 0 ? (
                (allMarkets as `0x${string}`[]).map((marketAddress) => (
                  <MarketClaimCard key={marketAddress} marketAddress={marketAddress} />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Markets Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create a market or place bets to see them here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            How to Use (Local Anvil)
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <strong>Connect MetaMask to Anvil:</strong>
                <br />
                <span className="text-sm text-gray-600">
                  Network: Localhost 8545 • Chain ID: 31337 • Currency: ETH
                </span>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <strong>Import Anvil Account:</strong>
                <br />
                <span className="text-sm text-gray-600 font-mono">
                  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
                </span>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <strong>Get Test Tokens:</strong>
                <br />
                <span className="text-sm text-gray-600">
                  Run: <code className="bg-gray-100 px-2 py-1 rounded">cast send {CONTRACTS.SettlementToken} "mint(address,uint256)" YOUR_ADDRESS 1000000000000000000000 --private-key 0xac09...</code>
                </span>
              </div>
          </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div>
                <strong>Place Your Bet:</strong>
                <br />
                <span className="text-sm text-gray-600">
                  Approve tokens → Choose YES or NO → Enter amount → Place bet
                </span>
              </div>
          </li>
        </ol>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <strong className="text-yellow-900">Local Development Mode</strong>
              <p className="text-sm text-yellow-800 mt-1">
                Make sure Anvil is running on port 8545. Contracts are deployed at:
                <br />
                <span className="font-mono text-xs">Token: {CONTRACTS.SettlementToken}</span>
                <br />
                <span className="font-mono text-xs">Factory: {CONTRACTS.MarketFactory}</span>
                <br />
                <span className="font-mono text-xs">Market: {CONTRACTS.TestMarket}</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>Prediction Market MVP • Built with Foundry & Next.js</p>
        </div>
      </footer>
    </div>
  )
}