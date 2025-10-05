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

  const { data: yesPrice } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'getPrice',
    args: [true],
  })

  const { data: noPrice } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'getPrice',
    args: [false],
  })

  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { writeContract: buyPosition, data: buyHash } = useWriteContract()

  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isBuying } = useWaitForTransactionReceipt({ hash: buyHash })

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
              className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
            >
              {isApproving ? 'Approving...' : '1. Approve'}
            </button>
            <button
              onClick={handleBet}
              disabled={isBuying || !betAmount}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
            >
              {isBuying ? 'Betting...' : '2. Place Bet'}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Step 1: Approve tokens • Step 2: Place your bet
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
