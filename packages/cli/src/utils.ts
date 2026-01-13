// ============================================================
// FundTracer CLI - Utilities
// ============================================================

import fs from 'fs';
import path from 'path';
import os from 'os';
import { ApiKeyConfig, ChainId } from '@fundtracer/core';

const CONFIG_FILE = path.join(os.homedir(), '.fundtracer', 'config.json');

export function getApiKeys(): ApiKeyConfig {
    let config: any = {};

    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            config = JSON.parse(data);
        }
    } catch {
        // Ignore
    }

    const keys = config.apiKeys || {};

    // Merge config file keys with environment variables (env takes precedence)
    return {
        alchemy: process.env.ALCHEMY_API_KEY || keys.alchemy,
        moralis: process.env.MORALIS_API_KEY || keys.moralis,
        dune: process.env.DUNE_API_KEY || keys.dune,
        etherscan: process.env.ETHERSCAN_API_KEY || keys.etherscan,
        lineascan: process.env.LINEASCAN_API_KEY || keys.lineascan,
        arbiscan: process.env.ARBISCAN_API_KEY || keys.arbiscan,
        basescan: process.env.BASESCAN_API_KEY || keys.basescan,
        optimism: process.env.OPTIMISM_API_KEY || keys.optimism,
        polygonscan: process.env.POLYGONSCAN_API_KEY || keys.polygonscan,
    };
}

export function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(value: number): string {
    if (value === 0) return '0';
    if (value < 0.0001) return '<0.0001';
    if (value < 1) return value.toFixed(4);
    if (value < 100) return value.toFixed(3);
    return value.toFixed(2);
}

export function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
