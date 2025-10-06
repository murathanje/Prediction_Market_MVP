'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useChainId } from 'wagmi'
import { getContractAddresses } from '@/lib/wagmi'
import MarketFactoryABI from '@/lib/abi/MarketFactory.json'
import { MarketCard } from './MarketCard'

export function MarketList() {
  const chainId = useChainId()
  const CONTRACTS = getContractAddresses(chainId)
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get total market count
  const { data: marketCount } = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'getMarketsCount',
  })

  // Get paginated markets (get all markets for now)
  const { data: marketAddresses, refetch } = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'getMarketsPaginated',
    args: [0n, marketCount || 10n], // offset: 0, limit: marketCount
  })

  // Refresh markets every 10 seconds
  useEffect(() => {
    if (mounted) {
      const interval = setInterval(() => {
        refetch()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [mounted, refetch])

  if (!mounted) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  const markets = (marketAddresses as `0x${string}`[]) || []
  const count = Number(marketCount || 0)

  if (count === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Markets Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Be the first to create a prediction market!
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            Total Markets:
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
            {count}
          </span>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {markets.map((marketAddress, index) => (
        <MarketCard key={marketAddress} marketAddress={marketAddress} />
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800">
          💡 Markets auto-refresh every 10 seconds
        </p>
      </div>
    </div>
  )
}

