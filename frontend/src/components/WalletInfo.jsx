import React from 'react';
import { useBalance, useReadContract, useAccount } from 'wagmi';
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from '../contracts/MultiSigWallet';
import { formatEther } from 'viem';
import { Wallet, Users, Shield, Clock } from 'lucide-react';

const WalletInfo = () => {
  const { address } = useAccount();
  
  const { data: balance } = useBalance({
    address: MULTISIG_CONTRACT_ADDRESS,
  });

  const { data: owners } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'getOwners',
  });

  const { data: required } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'required',
  });

  const { data: isOwner } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'isOwner',
    args: [address],
  });

  const { data: timeLockPeriod } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'timeLockPeriod',
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    </div>
  );
};

export default WalletInfo;