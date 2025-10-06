'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import PredictionMarketABI from '@/lib/abi/PredictionMarket.json'

interface ResolveMarketProps {
  marketAddress: `0x${string}`
}

export function ResolveMarket({ marketAddress }: ResolveMarketProps) {
  const { address } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: marketInfo, refetch: refetchMarketInfo } = useReadContract({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'marketInfo',
  })

  const { writeContract: resolveMarket, data: resolveHash } = useWriteContract()
  const { isLoading: isResolving, isSuccess: isResolveSuccess } = useWaitForTransactionReceipt({ 
    hash: resolveHash 
  })

  // Refresh market info after resolution
  useEffect(() => {
    if (isResolveSuccess) {
      refetchMarketInfo()
    }
  }, [isResolveSuccess, refetchMarketInfo])

  if (!mounted || !marketInfo) return null

  const [question, endTime, yesPool, noPool, , , status, outcome, resolver] = marketInfo as any[]

  const isResolver = address?.toLowerCase() === resolver?.toLowerCase()
  const isActive = status === 0
  const isResolved = status === 1 || status === 2
  const hasEnded = Date.now() / 1000 > Number(endTime)

  const handleResolve = () => {
    if (selectedOutcome === null) return
    
    resolveMarket({
      address: marketAddress,
      abi: PredictionMarketABI,
      functionName: 'resolveMarket',
      args: [selectedOutcome],
    })
  }

  const handleMarkInvalid = () => {
    resolveMarket({
      address: marketAddress,
      abi: PredictionMarketABI,
      functionName: 'markAsInvalid',
    })
  }

  if (!isResolver) {
    return null // Not the resolver, don't show controls
  }

  if (isResolved) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold text-green-900">Market Resolved</p>
            <p className="text-sm text-green-800">
              Outcome: <span className="font-bold">{outcome ? 'YES' : 'NO'}</span>
              {status === 2 && ' (Invalid)'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasEnded) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-900">Market Still Active</p>
            <p className="text-xs text-yellow-800">
              Ends: {new Date(Number(endTime) * 1000).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-lg font-bold text-purple-900">
            Resolver Controls
          </h3>
        </div>
        <p className="text-sm text-purple-800">
          You created this market. Choose the outcome to resolve it.
        </p>
      </div>

      {isResolveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-green-800">
            ✓ Market resolved successfully! Participants can now claim.
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Select Outcome:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedOutcome(true)}
              className={`py-3 px-4 rounded-lg font-semibold transition ${
                selectedOutcome === true
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✓ YES Won
            </button>
            <button
              onClick={() => setSelectedOutcome(false)}
              className={`py-3 px-4 rounded-lg font-semibold transition ${
                selectedOutcome === false
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✗ NO Won
            </button>
          </div>
        </div>

        <button
          onClick={handleResolve}
          disabled={selectedOutcome === null || isResolving}
          className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-bold text-lg shadow-md"
        >
          {isResolving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resolving...
            </span>
          ) : (
            'Resolve Market'
          )}
        </button>

        <button
          onClick={handleMarkInvalid}
          disabled={isResolving}
          className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold text-sm"
        >
          Mark as Invalid (Refund All)
        </button>

        <p className="text-xs text-center text-gray-600">
          Total pool: {formatEther((yesPool || 0n) + (noPool || 0n))} PMT
        </p>
      </div>
    </div>
  )
}

