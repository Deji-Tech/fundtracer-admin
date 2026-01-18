// ============================================================
// Web3Modal Configuration for WalletConnect Support
// ============================================================

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react';

// Get project ID from environment or use placeholder
// Get project ID from environment or use default
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'f55ba487b823b0308e4621a87d4ebf76';

// Linea chain config
const linea = {
    chainId: 59144,
    name: 'Linea',
    currency: 'ETH',
    explorerUrl: 'https://lineascan.build',
    rpcUrl: 'https://rpc.linea.build'
};

// Metadata for WalletConnect
const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: 'https://fundtracer-by-dt.pxxl.click',
    icons: ['https://fundtracer-by-dt.pxxl.click/logo.png']
};

// Create modal config
const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true, // Enables EIP-6963 wallet discovery
    enableInjected: true, // Enables injected wallets (MetaMask extension)
    enableCoinbase: true, // Enables Coinbase Wallet
});

// Initialize Web3Modal
createWeb3Modal({
    ethersConfig,
    chains: [linea],
    projectId,
    enableAnalytics: false,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#22c55e',
        '--w3m-border-radius-master': '8px',
    }
});

export { projectId };
