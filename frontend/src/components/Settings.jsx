import React, { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useWatchContractEvent } from 'wagmi';
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from '../contracts/MultiSigWallet';
import { formatEther, parseEther } from 'viem';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Clock, 
  DollarSign, 
  Pause, 
  Play, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info 
} from 'lucide-react';

const Settings = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('limits');
  const [dailyLimit, setDailyLimit] = useState('');
  const [weeklyLimit, setWeeklyLimit] = useState('');
  const [timeLockPeriod, setTimeLockPeriod] = useState('');

  
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  useWatchContractEvent({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    eventName: [
      'TimeLockPeriodChanged', 'PauseStateChanged', 'RequirementChange',
      'Execution', 'Submission', 'Confirmation', 'Revocation'
    ],
    onLogs: () => setRefetchTrigger(t => t + 1),
  });

  const { data: isOwner } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'isOwner',
    args: [address],
    enabled: !!address,
    scopeKey: refetchTrigger,
  });

  const { data: currentDailyLimit } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'dailyLimit',
    scopeKey: refetchTrigger,
  });

  const { data: currentWeeklyLimit } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'weeklyLimit',
    scopeKey: refetchTrigger,
  });

  const { data: dailySpent } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'dailySpent',
    scopeKey: refetchTrigger,
  });

  const { data: weeklySpent } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'weeklySpent',
    scopeKey: refetchTrigger,
  });

  const { data: currentTimeLock } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'timeLockPeriod',
    scopeKey: refetchTrigger,
  });

  const { data: isPaused } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: 'paused',
    scopeKey: refetchTrigger,
  });

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSetDailyLimit = (e) => {
    e.preventDefault();
    if (!dailyLimit) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'setDailyLimit',
      args: [parseEther(dailyLimit)],
    });
  };

  const handleSetWeeklyLimit = (e) => {
    e.preventDefault();
    if (!weeklyLimit) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'setWeeklyLimit',
      args: [parseEther(weeklyLimit)],
    });
  };

  const handleSetTimeLock = (e) => {
    e.preventDefault();
    if (!timeLockPeriod) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'setTimeLockPeriod',
      args: [parseInt(timeLockPeriod)],
    });
  };

  const handlePause = () => {
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'pause',
    });
  };

  const handleUnpause = () => {
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: 'unpause',
    });
  };

  React.useEffect(() => {
    if (isSuccess) {
      setDailyLimit('');
      setWeeklyLimit('');
      setTimeLockPeriod('');
    }
  }, [isSuccess]);

  if (!isOwner) {
    return (
      <div className="card text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2 text-gray-700">Access Restricted</h3>
        <p className="text-gray-600 mb-4">Only wallet owners can modify settings.</p>
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
    { id: 'limits', label: 'Spending Limits', icon: DollarSign },
    { id: 'timelock', label: 'Time Lock', icon: Clock },
    { id: 'security', label: 'Security Controls', icon: Shield },
  ];

  const formatTimelock = (seconds) => {
    if (!seconds || seconds === 0n) return '0 seconds';
    const numSeconds = Number(seconds);
    const days = Math.floor(numSeconds / 86400);
    const hours = Math.floor((numSeconds % 86400) / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    const secs = numSeconds % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
  };

  const calculateProgress = (spent, limit) => {
    if (!spent || !limit || limit === 0n) return 0;
    return Math.min((Number(formatEther(spent)) / Number(formatEther(limit))) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Daily Limit</p>
                <p className="text-lg font-semibold">
                  {currentDailyLimit ? parseFloat(formatEther(currentDailyLimit)).toFixed(2) : '0'} ETH
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Spent: {dailySpent ? parseFloat(formatEther(dailySpent)).toFixed(4) : '0'} ETH</span>
              <span>{Math.round(calculateProgress(dailySpent, currentDailyLimit))}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(calculateProgress(dailySpent, currentDailyLimit))}`}
                style={{ width: `${calculateProgress(dailySpent, currentDailyLimit)}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Weekly Limit</p>
                <p className="text-lg font-semibold">
                  {currentWeeklyLimit ? parseFloat(formatEther(currentWeeklyLimit)).toFixed(2) : '0'} ETH
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Spent: {weeklySpent ? parseFloat(formatEther(weeklySpent)).toFixed(4) : '0'} ETH</span>
              <span>{Math.round(calculateProgress(weeklySpent, currentWeeklyLimit))}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(calculateProgress(weeklySpent, currentWeeklyLimit))}`}
                style={{ width: `${calculateProgress(weeklySpent, currentWeeklyLimit)}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Time Lock</p>
              <p className="text-lg font-semibold">
                {formatTimelock(currentTimeLock)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentTimeLock && Number(currentTimeLock) > 0 ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            {isPaused ? (
              <Pause className="w-8 h-8 text-red-500" />
            ) : (
              <Play className="w-8 h-8 text-green-500" />
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Wallet Status</p>
              <p className={`text-lg font-semibold ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
                {isPaused ? 'Paused' : 'Active'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isPaused ? 'All operations blocked' : 'Fully operational'}
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
        {activeTab === 'limits' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                Daily Spending Limit
              </h3>
              <form onSubmit={handleSetDailyLimit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Daily Limit (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p><strong>Current Limit:</strong> {currentDailyLimit ? formatEther(currentDailyLimit) : '0'} ETH</p>
                    <p><strong>Today's Spending:</strong> {dailySpent ? formatEther(dailySpent) : '0'} ETH</p>
                    <p><strong>Remaining Today:</strong> {currentDailyLimit && dailySpent ? 
                      Math.max(0, parseFloat(formatEther(currentDailyLimit)) - parseFloat(formatEther(dailySpent))).toFixed(4) : '0'} ETH</p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming || !dailyLimit}
                  className="btn-primary"
                >
                  {isPending || isConfirming ? 'Updating...' : 'Set Daily Limit'}
                </button>
              </form>
            </div>
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
                Weekly Spending Limit
              </h3>
              <form onSubmit={handleSetWeeklyLimit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Weekly Limit (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={weeklyLimit}
                    onChange={(e) => setWeeklyLimit(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p><strong>Current Limit:</strong> {currentWeeklyLimit ? formatEther(currentWeeklyLimit) : '0'} ETH</p>
                    <p><strong>This Week's Spending:</strong> {weeklySpent ? formatEther(weeklySpent) : '0'} ETH</p>
                    <p><strong>Remaining This Week:</strong> {currentWeeklyLimit && weeklySpent ? 
                      Math.max(0, parseFloat(formatEther(currentWeeklyLimit)) - parseFloat(formatEther(weeklySpent))).toFixed(4) : '0'} ETH</p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming || !weeklyLimit}
                  className="btn-primary"
                >
                  {isPending || isConfirming ? 'Updating...' : 'Set Weekly Limit'}
                </button>
              </form>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-800">About Spending Limits</h4>
                  <ul className="text-blue-700 text-sm mt-2 space-y-1">
                    <li>• Limits reset automatically (daily at midnight, weekly on Mondays)</li>
                    <li>• Transactions exceeding limits will be rejected during execution</li>
                    <li>• Set to 0 to disable limit checking</li>
                    <li>• Weekly limit should typically be higher than daily limit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'timelock' && (
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Transaction Time Lock
            </h3>
            <form onSubmit={handleSetTimeLock} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Lock Period (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={timeLockPeriod}
                  onChange={(e) => setTimeLockPeriod(e.target.value)}
                  placeholder="3600"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <p><strong>Current Time Lock:</strong> {formatTimelock(currentTimeLock)}</p>
                  <p><strong>Common Values:</strong></p>
                  <div className="ml-4 space-y-1">
                    <p>• 0 = No delay (immediate execution)</p>
                    <p>• 3600 = 1 hour delay</p>
                    <p>• 86400 = 24 hours delay</p>
                    <p>• 604800 = 1 week delay</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'No Delay', value: '0' },
                  { label: '1 Hour', value: '3600' },
                  { label: '24 Hours', value: '86400' },
                  { label: '1 Week', value: '604800' },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setTimeLockPeriod(preset.value)}
                    className="btn-secondary text-sm"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-medium text-blue-800">Time Lock Security</h4>
                    <div className="text-blue-700 text-sm mt-2 space-y-2">
                      <p><strong>Purpose:</strong> Adds a mandatory delay between transaction submission and execution</p>
                      <p><strong>Benefits:</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• Provides time to review transactions before execution</li>
                        <li>• Allows detection and prevention of malicious transactions</li>
                        <li>• Gives all owners time to confirm or object</li>
                      </ul>
                      <p><strong>Trade-offs:</strong> Higher security vs. slower operations</p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending || isConfirming || timeLockPeriod === ''}
                className="btn-primary w-full"
              >
                {isPending || isConfirming ? 'Updating...' : 'Set Time Lock'}
              </button>
            </form>
          </div>
        )}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-500" />
              Emergency Controls
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-800">⚠️ Critical Warning</h4>
                  <div className="text-yellow-700 text-sm mt-2 space-y-1">
                    <p><strong>Pausing the wallet will:</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• Block ALL transaction submissions and executions</li>
                      <li>• Prevent owner management operations</li>
                      <li>• Stop all wallet functionality except unpause</li>
                      <li>• Require owner signature to unpause</li>
                    </ul>
                    <p className="mt-2"><strong>Use only in genuine emergencies!</strong></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-lg">Wallet Emergency Control</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Current Status: <span className={`font-medium ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
                      {isPaused ? 'PAUSED - All operations disabled' : 'ACTIVE - Fully operational'}
                    </span>
                  </p>
                  {isPaused && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ Wallet is currently paused. Click "Unpause" to restore functionality.
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <button
                    onClick={isPaused ? handleUnpause : handlePause}
                    disabled={isPending || isConfirming}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      isPaused 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    } disabled:opacity-50`}
                  >
                    {isPending || isConfirming 
                      ? 'Processing...' 
                      : isPaused 
                        ? '▶️ Unpause Wallet' 
                        : '⏸️ Pause Wallet'
                    }
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Security Best Practices</h4>
              <div className="text-gray-700 text-sm space-y-2">
                <p><strong>When to pause:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Suspected compromise of owner accounts</li>
                  <li>• Detection of suspicious transaction activity</li>
                  <li>• Smart contract vulnerabilities discovered</li>
                  <li>• During investigation of potential threats</li>
                </ul>
                <p className="mt-3"><strong>Recovery process:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Investigate the security issue thoroughly</li>
                  <li>• Ensure all owner accounts are secure</li>
                  <li>• Update any compromised keys or addresses</li>
                  <li>• Only unpause when threat is fully resolved</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 mr-2" />
              <div>
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
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Settings Updated</h3>
                <p className="text-green-700 text-sm mt-1">
                  Your wallet settings have been updated successfully!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;