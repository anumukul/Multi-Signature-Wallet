

import React, { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from '../contracts/MultiSigWallet';
import { formatEther, formatUnits } from 'viem';
import { Clock, CheckCircle, XCircle, Play, RotateCcw, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';

const TransactionList = () => {

    const { address } = useAccount();
  const [filter, setFilter] = useState('all'); 
  const [selectedTx, setSelectedTx] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState({});

  const { data: transactionCount } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'transactionCount',
    watch: true,
  });

  const { data: transactionIds } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'getTransactionIds',
    args: [0n, transactionCount || 0n, filter === 'pending' || filter === 'all', filter === 'executed' || filter === 'all'],
    enabled: !!transactionCount,
    watch: true,
  });

  const { writeContract: confirmTx, isPending: isConfirming } = useWriteContract();
  const { writeContract: revokeTx, isPending: isRevoking } = useWriteContract();
  const { writeContract: executeTx, isPending: isExecuting } = useWriteContract();

  useEffect(() => {
    if (transactionIds && transactionIds.length > 0) {
      transactionIds.forEach(txId => {
        
      });
    }
  }, [transactionIds]);

   const handleConfirm = (transactionId) => {
    confirmTx({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'confirmTransaction',
      args: [transactionId],
    });
  };

  const handleRevoke = (transactionId) => {
    revokeTx({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'revokeConfirmation',
      args: [transactionId],
    });
  };

  const handleExecute = (transactionId) => {
    executeTx({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'executeTransaction',
      args: [transactionId],
    });
  };


  return (
  

      <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="executed">Executed</option>
          </select>
        </div>
      </div>

      {!transactionIds || transactionIds.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transactions found</p>
          <p className="text-sm mt-2">Submit your first transaction to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactionIds.map((txId) => (
            <TransactionItem
              key={txId.toString()}
              transactionId={txId}
              onConfirm={handleConfirm}
              onRevoke={handleRevoke}
              onExecute={handleExecute}
              isConfirming={isConfirming}
              isRevoking={isRevoking}
              isExecuting={isExecuting}
              userAddress={address}
            />
          ))}
        </div>
      )}
    </div>


    


  )
}


const TransactionItem = ({ 
  transactionId, 
  onConfirm, 
  onRevoke, 
  onExecute, 
  isConfirming, 
  isRevoking, 
  isExecuting,
  userAddress 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  
  const { data: transaction } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'getTransaction',
    args: [transactionId],
    watch: true,
  });

  
  const { data: confirmationCount } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'getConfirmationCount',
    args: [transactionId],
    watch: true,
  });

  
  const { data: required } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'required',
  });

 
  const { data: userConfirmed } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'confirmations',
    args: [transactionId, userAddress],
    enabled: !!userAddress,
    watch: true,
  });

  
  const { data: confirmations } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'getConfirmations',
    args: [transactionId],
    enabled: showDetails,
  });

  if (!transaction) {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const [destination, value, data, executed] = transaction;
  const isExecuted = executed;
  const canExecute = confirmationCount >= required && !isExecuted;
  const valueInEth = value ? formatEther(value) : '0';

  
  const getStatusInfo = () => {
    if (isExecuted) return { color: 'bg-green-500', icon: CheckCircle, text: 'Executed' };
    if (canExecute) return { color: 'bg-yellow-500', icon: Play, text: 'Ready to Execute' };
    return { color: 'bg-gray-400', icon: Clock, text: 'Pending' };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">TX #{transactionId.toString()}</span>
              <StatusIcon className={`w-4 h-4 ${isExecuted ? 'text-green-500' : canExecute ? 'text-yellow-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>To: {destination?.slice(0, 6)}...{destination?.slice(-4)}</p>
              <p>Value: {parseFloat(valueInEth).toFixed(4)} ETH</p>
              <p className="text-xs">Status: {statusInfo.text}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
        
          <div className="text-center">
            <span className="text-sm bg-gray-100 px-2 py-1 rounded font-medium">
              {confirmationCount?.toString() || '0'}/{required?.toString() || '0'}
            </span>
            <p className="text-xs text-gray-500 mt-1">confirmations</p>
          </div>
          
         
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-secondary p-2"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

         
            <>
              {!userConfirmed ? (
                <button
                  onClick={() => onConfirm(transactionId)}
                  disabled={isConfirming}
                  className="btn-primary text-sm px-3 py-1"
                  title="Confirm Transaction"
                >
                  {isConfirming ? 'Confirming...' : 'Confirm'}
                </button>
              ) : (
                <button
                  onClick={() => onRevoke(transactionId)}
                  disabled={isRevoking}
                  className="btn-secondary text-sm px-3 py-1"
                  title="Revoke Confirmation"
                >
                  {isRevoking ? 'Revoking...' : 'Revoke'}
                </button>
              )}

              {canExecute && (
                <button
                  onClick={() => onExecute(transactionId)}
                  disabled={isExecuting}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  title="Execute Transaction"
                >
                  {isExecuting ? 'Executing...' : 'Execute'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      
      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Destination:</span>
              <p className="text-gray-600 break-all font-mono text-xs mt-1">{destination}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Value:</span>
              <p className="text-gray-600 mt-1">{valueInEth} ETH</p>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Data:</span>
              <p className="text-gray-600 break-all font-mono text-xs mt-1 bg-gray-50 p-2 rounded">
                {data || '0x'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                isExecuted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isExecuted ? 'Executed' : 'Pending'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Progress:</span>
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((Number(confirmationCount) / Number(required)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {confirmationCount?.toString()}/{required?.toString()} confirmations
                </p>
              </div>
            </div>
          </div>

          
          {confirmations && confirmations.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 text-sm">Confirmed by:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {confirmations.map((addr, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                    title={addr}
                  >
                    {addr.slice(0, 6)}...{addr.slice(-4)}
                    {addr.toLowerCase() === userAddress?.toLowerCase() && ' (You)'}
                  </span>
                ))}
              </div>
            </div>
          )}

         
          {canExecute && !isExecuted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-green-800 text-sm font-medium">
                  Ready to Execute
                </span>
              </div>
              <p className="text-green-700 text-xs mt-1">
                This transaction has enough confirmations and can be executed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};



export default TransactionList