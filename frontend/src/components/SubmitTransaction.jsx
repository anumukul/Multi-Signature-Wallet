import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from '../contracts/MultiSigWallet';
import { parseEther } from 'viem';
import { Send } from 'lucide-react';

const SubmitTransaction = () => {
  const [destination, setDestination] = useState('');
  const [value, setValue] = useState('');
  const [data, setData] = useState('0x');

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      
      const valueWei = value ? parseEther(value.toString()) : 0n;
      writeContract({
        address: MULTISIG_CONTRACT_ADDRESS,
        abi: MULTISIG_ABI,
        functionName: 'submitTransaction',
        args: [destination, valueWei, data || '0x'],
      });
    } catch (err) {
      console.error('Error submitting transaction:', err);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <Send className="w-6 h-6 text-primary-500 mr-2" />
        <h2 className="text-xl font-semibold">Submit Transaction</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination Address
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data (optional)
          </label>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="0x"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming || !destination}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? 'Submitting...' : 'Submit Transaction'}
        </button>

        {error && (
          <div className="text-red-600 text-sm mt-2">
            Error: {error.shortMessage || error.message}
          </div>
        )}

        {isSuccess && (
          <div className="text-green-600 text-sm mt-2">
            Transaction submitted successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default SubmitTransaction;