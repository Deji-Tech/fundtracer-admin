// ============================================================
// API Client - Communicates with FundTracer Server
// ============================================================

import { getIdToken } from './firebase';
import { ChainId, AnalysisResult, MultiWalletResult } from '@fundtracer/core';

// In production, assume the API is on the same domain if not specified (e.g., via proxy)
// Or use a hardcoded production URL if frontend/backend are separate
// In production, endpoints already include '/api' prefix, so base should be empty
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

interface ApiResponse<T> {
    success: boolean;
    result?: T;
    error?: string;
    message?: string;
    usageRemaining?: number | 'unlimited';
}

interface UserProfile {
    uid: string;
    email: string;
    name?: string;
    hasCustomApiKey: boolean;
    usage: {
        today: number;
        limit: number | 'unlimited';
        remaining: number | 'unlimited';
    };
}

async function apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any
): Promise<T> {
    const token = await getIdToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.details || data.message || data.error || 'Request failed';
        throw new Error(errorMessage);
    }

    return data;
}

// User endpoints
export async function getProfile(): Promise<UserProfile> {
    return apiRequest('/api/user/profile');
}

// Alchemy API key management
export async function saveAlchemyKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    return apiRequest('/api/user/alchemy-api-key', 'POST', { apiKey });
}

export async function removeAlchemyKey(): Promise<{ success: boolean; message: string }> {
    return apiRequest('/api/user/alchemy-api-key', 'DELETE');
}

// Analysis endpoints
export async function analyzeWallet(
    address: string,
    chain: ChainId,
    options?: any
): Promise<ApiResponse<AnalysisResult>> {
    return apiRequest('/api/analyze/wallet', 'POST', { address, chain, options });
}

export async function compareWallets(
    addresses: string[],
    chain: ChainId,
    options?: any
): Promise<ApiResponse<MultiWalletResult>> {
    return apiRequest('/api/analyze/compare', 'POST', { addresses, chain, options });
}

export async function analyzeContract(
    contractAddress: string,
    chain: ChainId,
    options?: any
): Promise<ApiResponse<any>> {
    return apiRequest('/api/analyze/contract', 'POST', { contractAddress, chain, options });
}

export async function analyzeSybil(
    contractAddress: string,
    chain: ChainId,
    options?: { maxInteractors?: number; minClusterSize?: number }
): Promise<ApiResponse<any>> {
    return apiRequest('/api/analyze/sybil', 'POST', { contractAddress, chain, options });
}

/** Analyze a list of addresses directly (paste from Dune) */
export async function analyzeSybilAddresses(
    addresses: string[],
    chain: ChainId,
    options?: { minClusterSize?: number }
): Promise<ApiResponse<any>> {
    return apiRequest('/api/analyze/sybil-addresses', 'POST', { addresses, chain, options });
}

/** Fetch contract interactors from Dune Analytics */
export async function fetchDuneInteractors(
    contractAddress: string,
    chain: ChainId,
    options?: { limit?: number; customApiKey?: string }
): Promise<{ success: boolean; wallets?: string[]; count?: number; error?: string }> {
    return apiRequest('/api/dune/fetch', 'POST', {
        contractAddress,
        chain,
        limit: options?.limit || 1000,
        customApiKey: options?.customApiKey,
    });
}
