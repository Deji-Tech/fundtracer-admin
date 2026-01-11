// ============================================================
// FundTracer CLI - Utilities
// ============================================================

import fs from 'fs';
import path from 'path';
import os from 'os';
import { ApiKeyConfig, ChainId } from '@fundtracer/core';

const CONFIG_FILE = path.join(os.homedir(), '.fundtracer', 'config.json');

export function getApiKeys(): ApiKeyConfig {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            const config = JSON.parse(data);
            return config.apiKeys || {};
        }
    } catch {
        // Ignore
    }

    // Fallback to environment variables
    return {
        ethereum: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken',
        linea: process.env.LINEASCAN_API_KEY || 'YourApiKeyToken',
        arbitrum: process.env.ARBISCAN_API_KEY || 'YourApiKeyToken',
        base: process.env.BASESCAN_API_KEY || 'YourApiKeyToken',
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
