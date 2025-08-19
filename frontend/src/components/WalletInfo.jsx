import React, { useState } from 'react';
import { useBalance, useReadContract, useAccount, useWatchContractEvent } from 'wagmi';
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from '../contracts/MultiSigWallet';
import { formatEther } from 'viem';
import { Wallet, Users, Shield, Clock, Copy } from 'lucide-react';

const WalletInfo = () => {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  useWatchContractEvent({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    eventName: [
      'Execution', 'Deposit', 'Submission', 'Revocation', 'Confirmation',
      'TimeLockPeriodChanged', 'PauseStateChanged', 'RequirementChange'
    ],
    onLogs: () => setRefetchTrigger(t => t + 1),
  });

  const { data: balance } = useBalance({
    address: MULTISIG_CONTRACT_ADDRESS,
    scopeKey: refetchTrigger,
  });

  const { data: owners } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'getOwners',
    scopeKey: refetchTrigger,
  });

  const { data: required } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'required',
    scopeKey: refetchTrigger,
  });

  const { data: isOwner } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'isOwner',
    args: [address],
    scopeKey: refetchTrigger,
  });

  const { data: timeLockPeriod } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'timeLockPeriod',
    scopeKey: refetchTrigger,
  });

  
  const handleCopy = () => {
    navigator.clipboard.writeText(MULTISIG_CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
     
      <div className="card">
        <div className="flex items-center">
          <Wallet className="w-8 h-8 text-green-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
            <p className="text-2xl font-semibold">
              {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH` : '0 ETH'}
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-blue-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Owners</p>
            <p className="text-2xl font-semibold">
              {owners ? `${required}/${owners.length}` : '0/0'}
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center">
          <Shield className="w-8 h-8 text-purple-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Your Status</p>
            <p className="text-2xl font-semibold">
              {isOwner ? 'Owner' : 'Non-Owner'}
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center">
          <Clock className="w-8 h-8 text-orange-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Time Lock</p>
            <p className="text-2xl font-semibold">
              {timeLockPeriod ? `${timeLockPeriod}s` : '0s'}
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center">
          <Wallet className="w-8 h-8 text-gray-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Wallet Address</p>
            <div className="flex items-center">
              <span
                className="font-mono text-xs break-all text-gray-800"
                title={MULTISIG_CONTRACT_ADDRESS}
              >
                {MULTISIG_CONTRACT_ADDRESS}
              </span>
              <button
                onClick={handleCopy}
                title="Copy to clipboard"
                className="ml-2 p-1 hover:bg-gray-100 rounded"
                aria-label="Copy wallet address"
              >
                <Copy className="w-4 h-4 inline-block text-gray-500" />
              </button>
              {copied && (
                <span className="ml-2 text-xs text-green-600 font-semibold">Copied!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;