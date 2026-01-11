// ============================================================
// Analyze Routes - Wallet & Contract Analysis Endpoints
// All requests use server-side API keys (never exposed to client)
// ============================================================

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getFirestore } from '../firebase.js';
import {
    WalletAnalyzer,
    ChainId,
    FilterOptions
} from '@fundtracer/core';

const router = Router();

// Get the appropriate API key for a user
async function getApiKeyForUser(userId: string): Promise<string> {
    try {
        const db = getFirestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // Use user's custom API key if available
        if (userData?.customApiKey) {
            return userData.customApiKey;
        }
    } catch (error) {
        console.error('Error fetching user API key:', error);
    }

    // Fall back to default API key
    return process.env.DEFAULT_ETHERSCAN_API_KEY || '';
}

// Analyze a single wallet
router.post('/wallet', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { address, chain, options } = req.body;

    if (!address || !chain) {
        return res.status(400).json({ error: 'Address and chain are required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    try {
        const apiKey = await getApiKeyForUser(req.user.uid);

        const analyzer = new WalletAnalyzer({
            [chain]: apiKey,
        });

        const result = await analyzer.analyze(address, chain as ChainId, options);

        res.json({
            success: true,
            result,
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Wallet analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
});

// Compare multiple wallets
router.post('/compare', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { addresses, chain, options } = req.body;

    if (!addresses || !Array.isArray(addresses) || addresses.length < 2) {
        return res.status(400).json({ error: 'At least 2 addresses are required' });
    }

    // Validate all addresses
    for (const addr of addresses) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
            return res.status(400).json({ error: `Invalid address format: ${addr}` });
        }
    }

    try {
        const apiKey = await getApiKeyForUser(req.user.uid);

        const analyzer = new WalletAnalyzer({
            [chain]: apiKey,
        });

        const result = await analyzer.compareWallets(addresses, chain as ChainId, options);

        res.json({
            success: true,
            result,
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Comparison error:', error);
        res.status(500).json({
            error: 'Comparison failed',
            message: error.message
        });
    }
});

// Analyze contract interactors
router.post('/contract', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { contractAddress, chain, options } = req.body;

    if (!contractAddress || !chain) {
        return res.status(400).json({ error: 'Contract address and chain are required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        return res.status(400).json({ error: 'Invalid contract address format' });
    }

    try {
        const apiKey = await getApiKeyForUser(req.user.uid);

        // TODO: Implement contract analysis in core
        // For now, return a placeholder
        res.json({
            success: true,
            result: {
                contractAddress,
                chain,
                totalInteractors: 0,
                interactors: [],
                sharedFundingGroups: [],
                suspiciousPatterns: [],
            },
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Contract analysis error:', error);
        res.status(500).json({
            error: 'Contract analysis failed',
            message: error.message
        });
    }
});

export { router as analyzeRoutes };
