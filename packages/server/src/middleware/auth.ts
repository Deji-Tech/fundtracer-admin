// ============================================================
// Authentication Middleware - Verify Firebase ID Token
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../firebase.js';

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email: string;
        name?: string;
    };
}

export async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authentication token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            name: decodedToken.name,
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid authentication token' });
    }
}
