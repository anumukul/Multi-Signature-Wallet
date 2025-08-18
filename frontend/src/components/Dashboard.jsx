import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import WalletInfo from './WalletInfo';
import TransactionList from './TransactionList';
import SubmitTransaction from './SubmitTransaction';
import OwnerManagement from './OwnerManagement';
import Settings from './Settings';
import { Wallet, Send, Users, Settings as SettingsIcon } from 'lucide-react';

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('transactions');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-primary-500" />
          <h1 className="text-3xl font-bold mb-4">Multisig Wallet</h1>
          <p className="text-gray-600 mb-8">Connect your wallet to access the multisig interface</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'transactions', label: 'Transactions', icon: Send },
    { id: 'owners', label: 'Owners', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Multisig Wallet</h1>
        <ConnectButton />
      </header>

      <WalletInfo />

      <div className="mt-8">
        <nav className="flex space-x-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
          {activeTab === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TransactionList />
              </div>
              <div>
                <SubmitTransaction />
              </div>
            </div>
          )}
          {activeTab === 'owners' && <OwnerManagement />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;