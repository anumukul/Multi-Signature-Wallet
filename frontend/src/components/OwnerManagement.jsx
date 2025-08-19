
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

   const { data: owners } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'getOwners',
    watch: true,
  });

  const { data: required } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'required',
    watch: true,
  });

  const { data: isOwner } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'isOwner',
    args: [address],
    enabled: !!address,
  });

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleAddOwner = (e) => {
    e.preventDefault();
    if (!newOwner) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'addOwner',
      args: [newOwner],
    });
  };

  const handleRemoveOwner = (e) => {
    e.preventDefault();
    if (!ownerToRemove) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'removeOwner',
      args: [ownerToRemove],
    });
  };

  const handleReplaceOwner = (e) => {
    e.preventDefault();
    if (!ownerToReplace || !replacementOwner) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'replaceOwner',
      args: [ownerToReplace, replacementOwner],
    });
  };

  const handleChangeRequirement = (e) => {
    e.preventDefault();
    if (!newRequirement) return;


     writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'changeRequirement',
      args: [parseInt(newRequirement)],
    });
  };

 
  React.useEffect(() => {
    if (isSuccess) {
      setNewOwner('');
      setOwnerToRemove('');
      setOwnerToReplace('');
      setReplacementOwner('');
      setNewRequirement('');
    }
  }, [isSuccess]);

    if (!isOwner) {
    return (
      <div className="card text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2 text-gray-700">Access Restricted</h3>
        <p className="text-gray-600 mb-4">Only wallet owners can manage owner settings.</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Your Status:</strong> Non-Owner<br/>
            <strong>Required Access:</strong> Owner privileges needed
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'owners', label: 'Current Owners', icon: Users },
    { id: 'add', label: 'Add Owner', icon: Plus },
    { id: 'remove', label: 'Remove Owner', icon: Minus },
    { id: 'replace', label: 'Replace Owner', icon: RefreshCw },
    { id: 'requirement', label: 'Change Requirement', icon: Settings },
  ];

  const getSecurityLevel = () => {
    if (!owners?.length || !required) return 'Unknown';
    const ratio = Number(required) / owners.length;
    if (ratio >= 0.75) return 'Very High';
    if (ratio >= 0.5) return 'High';
    if (ratio >= 0.33) return 'Medium';
    return 'Low';
  };

  const securityLevel = getSecurityLevel();
  const securityColor = {
    'Very High': 'text-green-600',
    'High': 'text-blue-600',
    'Medium': 'text-yellow-600',
    'Low': 'text-red-600',
    'Unknown': 'text-gray-600'
  }[securityLevel];




  return (
    <div>
    
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Owners</p>
              <p className="text-2xl font-semibold">{owners?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Required Signatures</p>
              <p className="text-2xl font-semibold">{required?.toString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Security Ratio</p>
              <p className="text-2xl font-semibold">
                {owners?.length && required ? 
                  `${Math.round((Number(required) / owners.length) * 100)}%` : '0%'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Crown className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Security Level</p>
              <p className={`text-lg font-semibold ${securityColor}`}>
                {securityLevel}
              </p>
            </div>
          </div>
        </div>
      </div>

      
      <div className="card">
        <nav className="flex space-x-8 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>

       
        {activeTab === 'owners' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Current Owners</h3>
              <div className="text-sm text-gray-600">
                {owners?.length || 0} owner{(owners?.length || 0) !== 1 ? 's' : ''} • {required?.toString() || 0} required
              </div>
            </div>
            
            <div className="space-y-3">
              {owners?.map((owner, index) => (
                <div key={owner} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 truncate">{owner}</p>
                        {owner.toLowerCase() === address?.toLowerCase() && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="w-3 h-3 mr-1" />
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Owner #{index + 1} • Added to multisig wallet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setActiveTab('replace');
                        setOwnerToReplace(owner);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('remove');
                        setOwnerToRemove(owner);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {owners?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No owners found</p>
              </div>
            )}
          </div>
        )}

    
        {activeTab === 'add' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Add New Owner</h3>
            <form onSubmit={handleAddOwner} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Address *
                </label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the Ethereum address of the new owner
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Before adding a new owner:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Verify the address is correct and controlled by a trusted party</li>
                  <li>• Consider if the current signature requirement needs adjustment</li>
                  <li>• New owner will immediately have full wallet privileges</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="btn-primary w-full"
              >
                {isPending || isConfirming ? 'Adding Owner...' : 'Add Owner'}
              </button>
            </form>
          </div>
        )}

    
        {activeTab === 'remove' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Remove Owner</h3>
            <form onSubmit={handleRemoveOwner} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner to Remove *
                </label>
                <select
                  value={ownerToRemove}
                  onChange={(e) => setOwnerToRemove(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select owner to remove...</option>
                  {owners?.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner} {owner.toLowerCase() === address?.toLowerCase() ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warning</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Removing an owner is irreversible</li>
                  <li>• Ensure remaining owners can still meet the signature requirement</li>
                  <li>• Current requirement: {required?.toString()}, owners after removal: {(owners?.length || 1) - 1}</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isPending || isConfirming || !ownerToRemove}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium w-full transition-colors disabled:opacity-50"
              >
                {isPending || isConfirming ? 'Removing Owner...' : 'Remove Owner'}
              </button>
            </form>
          </div>
        )}

     
        {activeTab === 'replace' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Replace Owner</h3>
            <form onSubmit={handleReplaceOwner} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner to Replace *
                </label>
                <select
                  value={ownerToReplace}
                  onChange={(e) => setOwnerToReplace(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select owner to replace...</option>
                  {owners?.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner} {owner.toLowerCase() === address?.toLowerCase() ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Owner Address *
                </label>
                <input
                  type="text"
                  value={replacementOwner}
                  onChange={(e) => setReplacementOwner(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the address of the replacement owner
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Replacement Process:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Old owner will be removed immediately</li>
                  <li>• New owner will gain full privileges</li>
                  <li>• Total owner count remains the same</li>
                  <li>• Signature requirement stays unchanged</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isPending || isConfirming || !ownerToReplace || !replacementOwner}
                className="btn-primary w-full"
              >
                {isPending || isConfirming ? 'Replacing Owner...' : 'Replace Owner'}
              </button>
            </form>
          </div>
        )}

     
        {activeTab === 'requirement' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Change Signature Requirement</h3>
            <form onSubmit={handleChangeRequirement} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Signatures *
                </label>
                <input
                  type="number"
                  min="1"
                  max={owners?.length || 1}
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p><strong>Current:</strong> {required?.toString()} signatures required</p>
                  <p><strong>Maximum:</strong> {owners?.length || 0} (total owners)</p>
                  <p><strong>Minimum:</strong> 1 signature</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Security Guidelines:</h4>
                <div className="text-green-700 text-sm space-y-2">
                  <p><strong>Low Security (1-33%):</strong> Fast operations, higher risk</p>
                  <p><strong>Medium Security (34-49%):</strong> Balanced approach</p>
                  <p><strong>High Security (50-74%):</strong> Strong protection, slower operations</p>
                  <p><strong>Very High Security (75%+):</strong> Maximum security, requires most owners</p>
                </div>
              </div>

              {newRequirement && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Preview:</h4>
                  <div className="text-blue-700 text-sm">
                    <p>New requirement: {newRequirement}/{owners?.length || 0} signatures</p>
                    <p>Security ratio: {owners?.length ? Math.round((parseInt(newRequirement) / owners.length) * 100) : 0}%</p>
                    <p>Security level: {(() => {
                      if (!owners?.length || !newRequirement) return 'Unknown';
                      const ratio = parseInt(newRequirement) / owners.length;
                      if (ratio >= 0.75) return 'Very High';
                      if (ratio >= 0.5) return 'High';
                      if (ratio >= 0.33) return 'Medium';
                      return 'Low';
                    })()}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || isConfirming || !newRequirement}
                className="btn-primary w-full"
              >
                {isPending || isConfirming ? 'Updating Requirement...' : 'Update Requirement'}
              </button>
            </form>
          </div>
        )}

       
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Operation Failed</h3>
                <p className="text-red-700 text-sm mt-1">
                  {error.shortMessage || error.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Operation Successful</h3>
                <p className="text-green-700 text-sm mt-1">
                  Owner management operation completed successfully!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerManagement;
