// ============================================================
// FundTracer by DT - Provider Factory
// Alchemy-only provider (fast, reliable)
// ============================================================

import { ChainId } from '../types.js';
import { ITransactionProvider } from './ITransactionProvider.js';
import { AlchemyProvider } from './AlchemyProvider.js';

export interface ApiKeyConfig {
    // Single Alchemy key (works for all chains)
    alchemy: string;
    // Optional Moralis key for optimized funding lookup
    moralis?: string;
}

/** Factory for creating chain-specific Alchemy providers */
export class ProviderFactory {
    private apiKey: string;
    private moralisKey?: string;
    private providers: Map<ChainId, ITransactionProvider> = new Map();

    constructor(apiKeys: ApiKeyConfig) {
        if (!apiKeys.alchemy) {
            throw new Error('Alchemy API key is required');
        }
        this.apiKey = apiKeys.alchemy;
        this.moralisKey = apiKeys.moralis;
    }

    /** Get provider for a specific chain */
    getProvider(chainId: ChainId): ITransactionProvider {
        // Return cached provider if exists
        const cached = this.providers.get(chainId);
        if (cached) return cached;

        // Create new Alchemy provider with Moralis optimization
        console.log(`[ProviderFactory] Creating Alchemy provider for ${chainId}`);
        const provider = new AlchemyProvider(chainId, this.apiKey, this.moralisKey);
        this.providers.set(chainId, provider);
        return provider;
    }

    /** Update API key */
    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        // Clear all cached providers to force recreation
        this.providers.clear();
    }

    /** Clear all cached providers */
    clearCache(): void {
        this.providers.forEach(p => {
            if (p.clearCache) {
                p.clearCache();
            }
        });
    }
}

export { AlchemyProvider };


