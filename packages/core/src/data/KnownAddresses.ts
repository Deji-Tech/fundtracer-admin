/**
 * Known infrastructure addresses (Bridges, Exchanges, Mixers)
 * Used to identify terminals in funding trees and prevent false positives in risk scoring.
 */

import { ChainId } from '../types.js';

export type AddressType = 'bridge' | 'exchange' | 'mixer' | 'contract' | 'other';

export interface KnownAddress {
    name: string;
    type: AddressType;
    category?: string; // e.g., 'cex', 'dex', 'layer2'
}

// Map: ChainId -> Address (lowercase) -> Info
export const KNOWN_ADDRESSES: Record<string, Record<string, KnownAddress>> = {
    'ethereum': {
        '0x00000000219ab540356cbb839cbe05303d7705fa': { name: 'Beacon Deposit Contract', type: 'contract' },
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', type: 'contract' },
        '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', type: 'contract', category: 'dex' },
        '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap V3 Router', type: 'contract', category: 'dex' },
        '0x12b66ca9ebf262c5700486c8f6114e9d038759e4': { name: 'Tornado Cash Proxy', type: 'mixer' },
        // Exchanges (Hot Wallets - simplistic list)
        '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance 14', type: 'exchange', category: 'cex' },
        '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance 15', type: 'exchange', category: 'cex' },
        '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { name: 'Coinbase 1', type: 'exchange', category: 'cex' },
    },
    'linea': {
        // Linea Message Service / Bridges
        '0x508ca82df566dcd1b0de8296e70a96313eda5665': { name: 'Linea Message Service', type: 'bridge' },
        '0xde94...7106': { name: 'Linea Official Bridge', type: 'bridge' }, // Placeholder, often dynamic
        // Common tokens that might appear as large value transfers if native value bug persists (fixed now, but good to label)
    },
    'arbitrum': {
        '0x0000000000000000000000000000000000000064': { name: 'ArbSys', type: 'contract' },
    }
};

/**
 * Check if an address is a known infrastructure address
 */
export function getAddressInfo(address: string, chainId: ChainId | string): KnownAddress | null {
    const chainAddresses = KNOWN_ADDRESSES[chainId];
    if (!chainAddresses) return null;
    return chainAddresses[address.toLowerCase()] || null;
}
