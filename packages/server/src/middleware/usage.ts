// ============================================================
// Usage Tracking Middleware - Enforce Daily Limits
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { getFirestore } from '../firebase.js';

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '7', 10);

export async function usageMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);
        const userDoc = await userRef.get();

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const userData = userDoc.data();

        // Check if user has their own API key (unlimited usage)
        if (userData?.customApiKey) {
            return next();
        }

        // Check daily usage for free tier
        const usageToday = userData?.dailyUsage?.[today] || 0;

        // TEMPORARILY DISABLED FOR TESTING
        // if (usageToday >= FREE_DAILY_LIMIT) {
        //     return res.status(429).json({
        //         error: 'Daily limit exceeded',
        //         message: `Free tier limit is ${FREE_DAILY_LIMIT} analyses per day. Add your own API key for unlimited usage.`,
        //         limit: FREE_DAILY_LIMIT,
        //         used: usageToday,
        //         resetsAt: getNextMidnight(),
        //     });
        // }

        // Increment usage counter
        await userRef.set({
            dailyUsage: {
                [today]: usageToday + 1,
            },
            lastActive: new Date().toISOString(),
        }, { merge: true });

        // Attach remaining usage to response
        res.locals.usageRemaining = FREE_DAILY_LIMIT - usageToday - 1;

        next();
    } catch (error) {
        console.error('Usage tracking error:', error);
        // Allow request to proceed if usage tracking fails
        next();
    }
}

function getNextMidnight(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
}
