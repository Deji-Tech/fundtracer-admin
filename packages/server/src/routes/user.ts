// ============================================================
// User Routes - API Key Management & Account Info
// ============================================================

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getFirestore } from '../firebase.js';
import axios from 'axios';

const router = Router();

// Get user profile and usage info
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        const today = new Date().toISOString().split('T')[0];
        const usageToday = userData?.dailyUsage?.[today] || 0;
        const dailyLimit = parseInt(process.env.FREE_DAILY_LIMIT || '7', 10);

        res.json({
            uid: req.user.uid,
            email: req.user.email,
            name: req.user.name,
            hasCustomApiKey: !!userData?.customApiKey,
            usage: {
                today: usageToday,
                limit: userData?.customApiKey ? 'unlimited' : dailyLimit,
                remaining: userData?.customApiKey ? 'unlimited' : Math.max(0, dailyLimit - usageToday),
            },
            createdAt: userData?.createdAt,
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Add custom API key
router.post('/api-key', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: 'API key is required' });
    }

    // Validate API key format (basic check)
    if (apiKey.length < 20 || apiKey.length > 50) {
        return res.status(400).json({ error: 'Invalid API key format' });
    }

    try {
        // Validate API key by making a test request to Etherscan
        const isValid = await validateEtherscanApiKey(apiKey);

        if (!isValid) {
            return res.status(400).json({
                error: 'Invalid Etherscan API key',
                message: 'The API key could not be verified. Please ensure you entered a valid Etherscan API key.'
            });
        }

        // Save API key (encrypted in production)
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);

        await userRef.set({
            customApiKey: apiKey, // In production, encrypt this
            apiKeyAddedAt: new Date().toISOString(),
        }, { merge: true });

        res.json({
            success: true,
            message: 'API key saved successfully. You now have unlimited usage.'
        });
    } catch (error) {
        console.error('API key save error:', error);
        res.status(500).json({ error: 'Failed to save API key' });
    }
});

// Remove custom API key
router.delete('/api-key', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);
        const { FieldValue } = await import('firebase-admin/firestore');

        await userRef.update({
            customApiKey: FieldValue.delete(),
            apiKeyAddedAt: FieldValue.delete(),
        });

        res.json({ success: true, message: 'API key removed' });
    } catch (error) {
        console.error('API key delete error:', error);
        res.status(500).json({ error: 'Failed to remove API key' });
    }
});

// Validate Etherscan API key by making a test request
async function validateEtherscanApiKey(apiKey: string): Promise<boolean> {
    try {
        // Make a simple request to Etherscan API
        const response = await axios.get('https://api.etherscan.io/api', {
            params: {
                module: 'account',
                action: 'balance',
                address: '0x0000000000000000000000000000000000000000',
                apikey: apiKey,
            },
            timeout: 10000,
        });

        // Check if API key is valid
        // Invalid keys return: { status: "0", message: "NOTOK", result: "Invalid API Key" }
        // Valid keys return: { status: "1", message: "OK", result: "..." }
        if (response.data.message === 'OK' || response.data.status === '1') {
            return true;
        }

        if (response.data.result && response.data.result.includes('Invalid API Key')) {
            return false;
        }

        // If we get a rate limit message, the key is valid but rate limited
        if (response.data.result && response.data.result.includes('rate limit')) {
            return true;
        }

        return response.data.status === '1';
    } catch (error) {
        console.error('API key validation error:', error);
        return false;
    }
}

export { router as userRoutes };
