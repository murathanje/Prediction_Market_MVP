'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { CONTRACTS } from '@/lib/wagmi'
import MarketFactoryABI from '@/lib/abi/MarketFactory.json'
import SettlementTokenABI from '@/lib/abi/SettlementToken.json'

interface CreateMarketProps {
  onSuccess?: () => void
}

export function CreateMarket({ onSuccess }: CreateMarketProps) {
  const [question, setQuestion] = useState('')
  const [duration, setDuration] = useState('7')
  const [initialLiquidity, setInitialLiquidity] = useState('100')
  const [isApproved, setIsApproved] = useState(false)
  const [newMarketAddress, setNewMarketAddress] = useState<string>('')

  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { writeContract: createMarket, data: createHash } = useWriteContract()
  
  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ 
    hash: approveHash,
  })
  
  const { isLoading: isCreating, isSuccess: isCreateSuccess, data: createReceipt } = useWaitForTransactionReceipt({ 
    hash: createHash,
  })

  // Update isApproved when approval succeeds
  useEffect(() => {
    if (isApproveSuccess && !isApproved) {
      setIsApproved(true)
    }
  }, [isApproveSuccess, isApproved])

  // Extract market address when creation succeeds
  useEffect(() => {
    if (isCreateSuccess && createReceipt && !newMarketAddress) {
      // Try to extract market address from logs
      const logs = createReceipt.logs
      if (logs && logs.length > 0) {
        // Find the new market contract deployment (last contract created)
        const contractCreatedLog = logs.find((log: any) => log.address && log.address !== CONTRACTS.MarketFactory)
        if (contractCreatedLog) {
          setNewMarketAddress(contractCreatedLog.address)
        } else {
          // Fallback: just show success
          setNewMarketAddress('success')
        }
      } else {
        setNewMarketAddress('success')
      }
      
      // Call onSuccess callback after short delay
      setTimeout(() => {
        onSuccess?.()
      }, 3000) // Give user time to see the success message
    }
  }, [isCreateSuccess, createReceipt, newMarketAddress, onSuccess])

  const handleApprove = () => {
    if (!initialLiquidity) return
    
    approve({
      address: CONTRACTS.SettlementToken,
      abi: SettlementTokenABI,
      functionName: 'approve',
      args: [CONTRACTS.MarketFactory, parseEther(initialLiquidity)],
    })
  }

  const handleCreate = () => {
    if (!question || !duration || !initialLiquidity) return

    const endTime = Math.floor(Date.now() / 1000) + Number(duration) * 24 * 60 * 60

    createMarket({
      address: CONTRACTS.MarketFactory,
      abi: MarketFactoryABI,
      functionName: 'createMarket',
      args: [question, endTime, parseEther(initialLiquidity)],
    })
  }

  const isFormValid = question.length > 10 && Number(duration) > 0 && Number(initialLiquidity) >= 1

  if (newMarketAddress) {
    return (
      <div className="bg-green-50 rounded-xl p-6 border-2 border-green-300">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Market Created!
          </h3>
          <p className="text-gray-700 mb-4">
            Your prediction market has been successfully created
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Market Address</p>
            <p className="text-xs font-mono text-gray-900 break-all">
              {newMarketAddress}
            </p>
          </div>
          <button
            onClick={() => {
              setNewMarketAddress('')
              setQuestion('')
              setInitialLiquidity('100')
              setIsApproved(false)
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Another Market
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create New Market
        </h2>
        <p className="text-gray-600">
          Set up a new prediction market for others to bet on
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Market Question *
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Will Bitcoin reach $100,000 by end of 2025?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {question.length}/200 characters (minimum 10)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration (days) *
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="7"
              min="1"
              max="365"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Market will end in {duration} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Initial Liquidity (PMT) *
            </label>
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(e.target.value)}
              placeholder="100"
              min="1"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Split 50/50 between YES/NO
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Important Notes:</p>
              <ul className="space-y-1 text-blue-800">
                <li>• You will be the resolver of this market</li>
                <li>• Initial liquidity is locked until resolution</li>
                <li>• You can resolve the market after it ends</li>
                <li>• Minimum liquidity: 1 PMT</li>
              </ul>
            </div>
          </div>
        </div>

        {isApproveSuccess && isApproved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              ✓ Approval successful! You can now create your market.
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={!isFormValid || isApproving || isApproved}
            className={`flex-1 px-6 py-3 rounded-lg transition font-semibold ${
              isApproved 
                ? 'bg-green-600 text-white cursor-not-allowed' 
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
            ) : isApproved ? (
              '✓ Approved'
            ) : (
              '1. Approve PMT'
            )}
          </button>
          <button
            onClick={handleCreate}
            disabled={!isApproved || isCreating || !isFormValid}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              '2. Create Market'
            )}
          </button>
        </div>

        <div className="text-xs text-center text-gray-500">
          {!isApproved 
            ? 'Step 1: Approve tokens • Step 2: Create your market'
            : '✓ Approved! Now create your market →'
          }
        </div>
      </div>
    </div>
  )
}
