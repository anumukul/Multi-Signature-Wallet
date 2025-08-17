import { getDefaultConfig } from '@rainbow-me/rainbowkit';

import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';


export const config=getDefaultConfig({

    appName:"Multi-Sig Wallet",
    projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
    chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    ...(process.env.REACT_APP_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: false,
});
