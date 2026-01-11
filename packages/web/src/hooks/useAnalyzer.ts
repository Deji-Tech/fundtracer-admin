import { useState, useCallback } from 'react';
import {
    WalletAnalyzer,
    AnalysisResult,
    MultiWalletResult,
    ChainId,
    ApiKeyConfig,
    ProgressCallback,
} from '@fundtracer/core';

interface Progress {
    stage: string;
    current: number;
    total: number;
    message: string;
}

interface UseAnalyzerReturn {
    analyzing: boolean;
    progress: Progress | null;
    singleResult: AnalysisResult | null;
    multiResult: MultiWalletResult | null;
    error: string | null;
    analyzeSingle: (address: string, chain: ChainId) => Promise<void>;
    analyzeMulti: (addresses: string[], chain: ChainId) => Promise<void>;
}

// Get API keys from localStorage or prompt user
const getApiKeys = (): ApiKeyConfig => {
    const stored = localStorage.getItem('fundtracer_api_keys');
    if (stored) {
        return JSON.parse(stored);
    }

    // Default demo keys (rate limited)
    return {
        ethereum: localStorage.getItem('etherscan_api_key') || 'YourApiKeyToken',
        linea: localStorage.getItem('lineascan_api_key') || 'YourApiKeyToken',
        arbitrum: localStorage.getItem('arbiscan_api_key') || 'YourApiKeyToken',
        base: localStorage.getItem('basescan_api_key') || 'YourApiKeyToken',
    };
};

export function useAnalyzer(): UseAnalyzerReturn {
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [singleResult, setSingleResult] = useState<AnalysisResult | null>(null);
    const [multiResult, setMultiResult] = useState<MultiWalletResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleProgress: ProgressCallback = useCallback((p) => {
        setProgress({
            stage: p.stage,
            current: p.current,
            total: p.total,
            message: p.message,
        });
    }, []);

    const analyzeSingle = useCallback(async (address: string, chain: ChainId) => {
        setAnalyzing(true);
        setError(null);
        setSingleResult(null);
        setMultiResult(null);
        setProgress({ stage: 'Starting', current: 0, total: 6, message: 'Initializing...' });

        try {
            const apiKeys = getApiKeys();
            const analyzer = new WalletAnalyzer(apiKeys, handleProgress);

            const result = await analyzer.analyze(address, chain, {
                treeConfig: {
                    maxDepth: 3, // Start with depth 3 for performance
                },
            });

            setSingleResult(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Analysis failed';
            setError(message);
        } finally {
            setAnalyzing(false);
            setProgress(null);
        }
    }, [handleProgress]);

    const analyzeMulti = useCallback(async (addresses: string[], chain: ChainId) => {
        setAnalyzing(true);
        setError(null);
        setSingleResult(null);
        setMultiResult(null);
        setProgress({ stage: 'Starting', current: 0, total: addresses.length * 6, message: 'Initializing...' });

        try {
            const apiKeys = getApiKeys();
            const analyzer = new WalletAnalyzer(apiKeys, handleProgress);

            const result = await analyzer.compareWallets(addresses, chain, {
                treeConfig: {
                    maxDepth: 2, // Lower depth for multi-wallet
                },
            });

            setMultiResult(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Analysis failed';
            setError(message);
        } finally {
            setAnalyzing(false);
            setProgress(null);
        }
    }, [handleProgress]);

    return {
        analyzing,
        progress,
        singleResult,
        multiResult,
        error,
        analyzeSingle,
        analyzeMulti,
    };
}
