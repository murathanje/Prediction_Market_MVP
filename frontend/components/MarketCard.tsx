'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { CONTRACTS } from '@/lib/wagmi'
import PredictionMarketABI from '@/lib/abi/PredictionMarket.json'
import SettlementTokenABI from '@/lib/abi/SettlementToken.json'

interface MarketCardProps {
  marketAddress: `0x${string}`
}

export function MarketCard({ marketAddress }: MarketCardProps) {
  const { address, isConnected } = useAccount()
  const [betAmount, setBetAmount] = useState('')
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: marketInfo, refetch: refetchMarketInfo } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'marketInfo',
  })

  const { data: userPosition, refetch: refetchUserPosition } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
  })

  const { data: yesPrice, refetch: refetchYesPrice } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'getPrice',
    args: [true],
  })

  const { data: noPrice, refetch: refetchNoPrice } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'getPrice',
    args: [false],
  })

  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { writeContract: buyPosition, data: buyHash } = useWriteContract()

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isBuying, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash })

  // Refresh all market data when bet succeeds
  useEffect(() => {
    if (isBuySuccess) {
      // Refetch all market data after successful bet
      refetchMarketInfo()
      refetchUserPosition()
      refetchYesPrice()
      refetchNoPrice()
      
      // Clear bet amount after successful bet
      setBetAmount('')
    }
  }, [isBuySuccess, refetchMarketInfo, refetchUserPosition, refetchYesPrice, refetchNoPrice])

  if (!mounted) {
    return <div className="text-center py-8">Loading market...</div>
  }

  if (!marketInfo) {
    return <div className="text-center py-8">Loading market...</div>
  }

  const [question, endTime, yesPool, noPool, , , status] = marketInfo as any[]

  const handleApprove = async () => {
    if (!betAmount) return
    
    approve({
      address: CONTRACTS.SettlementToken,
      abi: SettlementTokenABI,
      functionName: 'approve',
      args: [marketAddress, parseEther(betAmount)],
    })
  }

  const handleBet = async () => {
    if (!betAmount) return

    buyPosition({
      address: marketAddress,
      abi: PredictionMarketABI,
      functionName: 'buyPosition',
      args: [selectedOutcome === 'yes', parseEther(betAmount)],
    })
  }

  const yesPricePercent = yesPrice ? Number(yesPrice) / 100 : 50
  const noPricePercent = noPrice ? Number(noPrice) / 100 : 50

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{question}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Market: {marketAddress.slice(0, 6)}...{marketAddress.slice(-4)}</span>
          <span>•</span>
          <span>Ends: {new Date(Number(endTime) * 1000).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">YES</div>
          <div className="text-2xl font-bold text-green-600">{yesPricePercent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Pool: {formatEther(yesPool || 0n)} PMT</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">NO</div>
          <div className="text-2xl font-bold text-red-600">{noPricePercent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Pool: {formatEther(noPool || 0n)} PMT</div>
        </div>
      </div>

      {userPosition && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="text-sm font-semibold text-blue-900 mb-2">Your Position</div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-900 font-medium">
            <div>YES: {formatEther(userPosition[0] || 0n)} shares</div>
            <div>NO: {formatEther(userPosition[1] || 0n)} shares</div>
          </div>
        </div>
      )}

      {isConnected && status === 0 ? (
        <div className="space-y-4">
          {isApproveSuccess && !isBuySuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                ✓ Approved! Now place your bet →
              </span>
            </div>
          )}

          {isBuySuccess && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-blue-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-base font-bold text-blue-900">
                  🎉 Bet Placed Successfully!
                </span>
              </div>
              <p className="text-sm text-blue-800">
                Your position and market prices have been updated below.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedOutcome('yes')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                selectedOutcome === 'yes'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bet YES
            </button>
            <button
              onClick={() => setSelectedOutcome('no')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                selectedOutcome === 'no'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bet NO
            </button>
          </div>

          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="Amount in PMT"
            step="0.01"
            min="0.001"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
          />

          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isApproving || !betAmount}
              className={`flex-1 px-6 py-3 rounded-lg transition font-semibold ${
                isApproveSuccess 
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
              }`}
            >
              {isApproving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approving...
                </span>
              ) : isApproveSuccess ? (
                '✓ Approved'
              ) : (
                '1. Approve'
              )}
            </button>
            <button
              onClick={handleBet}
              disabled={isBuying || !betAmount}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
            >
              {isBuying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Betting...
                </span>
              ) : (
                '2. Place Bet'
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            {!isApproveSuccess 
              ? 'Step 1: Approve tokens • Step 2: Place your bet'
              : '✓ Approved! Now place your bet →'
            }
          </div>
        </div>
      ) : !isConnected ? (
        <div className="text-center text-gray-500 py-4">
          Connect your wallet to place bets
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          Market is {status === 1 ? 'Resolved' : 'Invalid'}
        </div>
      )}
    </div>
  )
}
