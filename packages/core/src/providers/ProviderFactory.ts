// ============================================================
// FundTracer by DT - Provider Factory
// ============================================================

import { ChainId } from '../types.js';
import { BaseProvider } from './BaseProvider.js';
import {
    EtherscanProvider,
    LineascanProvider,
    ArbiscanProvider,
    BasescanProvider,
} from './ChainProviders.js';

export interface ApiKeyConfig {
    ethereum?: string;
    linea?: string;
    arbitrum?: string;
    base?: string;
    optimism?: string;
    polygon?: string;
}

/** Factory for creating chain-specific providers */
export class ProviderFactory {
    private apiKeys: ApiKeyConfig;
    private providers: Map<ChainId, BaseProvider> = new Map();

    constructor(apiKeys: ApiKeyConfig) {
        this.apiKeys = apiKeys;
    }

    /** Get provider for a specific chain */
    getProvider(chainId: ChainId): BaseProvider {
        // Return cached provider if exists
        const cached = this.providers.get(chainId);
        if (cached) return cached;

        // Create new provider
        const provider = this.createProvider(chainId);
        this.providers.set(chainId, provider);
        return provider;
    }

    /** Create a new provider instance */
    private createProvider(chainId: ChainId): BaseProvider {
        const apiKey = this.apiKeys[chainId];

        if (!apiKey) {
            throw new Error(`No API key configured for ${chainId}. Please add your API key.`);
        }

        switch (chainId) {
            case 'ethereum':
                return new EtherscanProvider(apiKey);
            case 'linea':
                return new LineascanProvider(apiKey);
            case 'arbitrum':
                return new ArbiscanProvider(apiKey);
            case 'base':
                return new BasescanProvider(apiKey);
            case 'optimism':
            case 'polygon':
                throw new Error(`${chainId} is coming soon!`);
            default:
                throw new Error(`Unknown chain: ${chainId}`);
        }
    }

    /** Update API key for a chain */
    setApiKey(chainId: ChainId, apiKey: string): void {
        this.apiKeys[chainId] = apiKey;
        // Clear cached provider to force recreation
        this.providers.delete(chainId);
    }

    /** Clear all cached providers */
    clearCache(): void {
        this.providers.forEach(p => p.clearCache());
    }
}

export { BaseProvider };
