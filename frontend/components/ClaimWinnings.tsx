'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import PredictionMarketABI from '@/lib/abi/PredictionMarket.json'

interface ClaimWinningsProps {
  marketAddress: `0x${string}`
}

export function ClaimWinnings({ marketAddress }: ClaimWinningsProps) {
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

  const { data: winnings } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'calculateWinnings',
    args: address ? [address] : undefined,
  })

  const { data: hasClaimed } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
  })

  const { writeContract: claim, data: claimHash } = useWriteContract()
  const { isLoading: isClaiming } = useWaitForTransactionReceipt({ hash: claimHash })

  if (!mounted || !marketInfo) return null

  const [, , , , , , status, outcome] = marketInfo as any[]

  const handleClaim = () => {
    claim({
      address: marketAddress,
      abi: PredictionMarketABI,
      functionName: 'claimWinnings',
    })
  }

  const isResolved = status === 1 || status === 2
  const isInvalid = status === 2
  const winningsAmount = winnings ? formatEther(winnings as bigint) : '0'
  const hasWinnings = Number(winningsAmount) > 0

  if (!isResolved) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-600">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-gray-900">Market Not Resolved Yet</p>
          <p className="text-sm mt-1">Wait for the market to be resolved to claim your winnings</p>
        </div>
      </div>
    )
  }

  if (hasClaimed) {
    return (
      <div className="bg-green-50 rounded-lg p-6 text-center border-2 border-green-200">
        <div className="text-green-800">
          <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-bold text-lg">Already Claimed!</p>
          <p className="text-sm mt-1">You have already claimed your winnings from this market</p>
        </div>
      </div>
    )
  }

  if (!hasWinnings) {
    return (
      <div className="bg-red-50 rounded-lg p-6 text-center border-2 border-red-200">
        <div className="text-red-800">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="font-bold text-lg">No Winnings</p>
          <p className="text-sm mt-1">
            {isInvalid 
              ? 'Market was marked as invalid - no winnings available'
              : 'Your prediction was incorrect - better luck next time!'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-lg">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Congratulations!
        </h3>
        <p className="text-gray-700">
          Market Outcome: <span className="font-bold">{outcome ? 'YES' : 'NO'}</span>
          {isInvalid && ' (Invalid - Refund)'}
        </p>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Your Winnings</p>
          <p className="text-4xl font-bold text-green-600">
            {winningsAmount} PMT
          </p>
        </div>
      </div>

      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-bold text-lg shadow-md"
      >
        {isClaiming ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Claiming...
          </span>
        ) : (
          'Claim Winnings'
        )}
      </button>

      <p className="text-xs text-center text-gray-600 mt-3">
        Click to transfer your winnings to your wallet
      </p>
    </div>
  )
}
