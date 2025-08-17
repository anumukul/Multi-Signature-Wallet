import { useState } from 'react'

import './App.css'
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WagmiProvider } from 'wagmi';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './wagmi';

import Dashboard from './components/Dashboard';

const queryClient = new QueryClient();

function App() {
  

  return (
    <>

    <WagmiProvider config={config}>

      <QueryClientProvider client={queryClient}>


        <RainbowKitProvider>

          <div className="min-h-screen bg-gray-50">
            <Dashboard />
          </div>


        </RainbowKitProvider>
      </QueryClientProvider>




    </WagmiProvider>
     
      
    </>
  )
}

export default App
