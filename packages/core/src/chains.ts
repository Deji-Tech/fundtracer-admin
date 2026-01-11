// ============================================================
// FundTracer by DT - Chain Configuration
// ============================================================

import { ChainConfig, ChainId } from './types.js';

export const CHAINS: Record<ChainId, ChainConfig> = {
    ethereum: {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        explorer: 'https://etherscan.io',
        apiUrl: 'https://api.etherscan.io/api',
        enabled: true,
    },
    linea: {
        id: 'linea',
        name: 'Linea',
        symbol: 'ETH',
        explorer: 'https://lineascan.build',
        apiUrl: 'https://api.lineascan.build/api',
        enabled: true,
    },
    arbitrum: {
        id: 'arbitrum',
        name: 'Arbitrum One',
        symbol: 'ETH',
        explorer: 'https://arbiscan.io',
        apiUrl: 'https://api.arbiscan.io/api',
        enabled: true,
    },
    base: {
        id: 'base',
        name: 'Base',
        symbol: 'ETH',
        explorer: 'https://basescan.org',
        apiUrl: 'https://api.basescan.org/api',
        enabled: true,
    },
    optimism: {
        id: 'optimism',
        name: 'Optimism',
        symbol: 'ETH',
        explorer: 'https://optimistic.etherscan.io',
        apiUrl: 'https://api-optimistic.etherscan.io/api',
        enabled: false, // Coming soon
    },
    polygon: {
        id: 'polygon',
        name: 'Polygon',
        symbol: 'MATIC',
        explorer: 'https://polygonscan.com',
        apiUrl: 'https://api.polygonscan.com/api',
        enabled: false, // Coming soon
    },
};

export const getEnabledChains = (): ChainConfig[] =>
    Object.values(CHAINS).filter(c => c.enabled);

export const getChainConfig = (chainId: ChainId): ChainConfig =>
    CHAINS[chainId];
