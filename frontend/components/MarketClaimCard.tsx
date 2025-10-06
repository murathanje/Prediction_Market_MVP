'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import PredictionMarketABI from '@/lib/abi/PredictionMarket.json'
import { ResolveMarket } from './ResolveMarket'
import { ClaimWinnings } from './ClaimWinnings'

interface MarketClaimCardProps {
  marketAddress: `0x${string}`
}

export function MarketClaimCard({ marketAddress }: MarketClaimCardProps) {
  const { address } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: marketInfo } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'marketInfo',
  })

  const { data: userPosition } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
  })

  if (!mounted || !marketInfo) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const [question, endTime, yesPool, noPool, , , status, , resolver] = marketInfo as any[]
  
  const isResolver = address?.toLowerCase() === resolver?.toLowerCase()
  const hasPosition = userPosition && (userPosition[0] > 0n || userPosition[1] > 0n)
  
  // Show card only if user is resolver OR has a position
  if (!isResolver && !hasPosition) {
    return null
  }

  const isActive = status === 0
  const isResolved = status === 1 || status === 2

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Market Info */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {question}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ends: {new Date(Number(endTime) * 1000).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Pool: {formatEther((yesPool || 0n) + (noPool || 0n))} PMT</span>
          </div>
          <div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isActive ? 'bg-blue-100 text-blue-800' :
              isResolved ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {isActive ? 'Active' : isResolved ? 'Resolved' : 'Ended'}
            </span>
          </div>
        </div>
      </div>

      {/* Your Position */}
      {hasPosition && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
          <div className="text-sm font-semibold text-blue-900 mb-2">Your Position</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-blue-700">YES Shares</div>
              <div className="text-lg font-bold text-blue-900">
                {formatEther(userPosition[0] || 0n)}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700">NO Shares</div>
              <div className="text-lg font-bold text-blue-900">
                {formatEther(userPosition[1] || 0n)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolver Controls */}
      {isResolver && (
        <div className="mb-6">
          <ResolveMarket marketAddress={marketAddress} />
        </div>
      )}

      {/* Claim Controls */}
      {hasPosition && (
        <div>
          <ClaimWinnings marketAddress={marketAddress} />
        </div>
      )}

      {/* Market Address */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Market: <span className="font-mono">{marketAddress.slice(0, 10)}...{marketAddress.slice(-8)}</span>
        </p>
      </div>
    </div>
  )
}

