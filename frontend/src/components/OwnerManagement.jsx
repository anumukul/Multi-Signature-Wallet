
import React, { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from '../contracts/MultiSigWallet';
import { Users, Plus, Minus, RefreshCw, Settings, Shield, Crown, UserCheck } from 'lucide-react';

const OwnerManagement = () => {

   const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('owners');
  const [newOwner, setNewOwner] = useState('');
  const [ownerToRemove, setOwnerToRemove] = useState('');
  const [ownerToReplace, setOwnerToReplace] = useState('');
  const [replacementOwner, setReplacementOwner] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  
  return (
    <div>OwnerManagement</div>
  )
}

export default OwnerManagement
