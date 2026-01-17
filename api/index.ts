// Standalone Vercel API handler - no server dependencies
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const path = req.url || '/';

    // Health check
    if (path === '/api/health' || path === '/api') {
        return res.status(200).json({
            status: 'ok',
            message: 'FundTracer API is running on Vercel',
            timestamp: new Date().toISOString()
        });
    }

    // For now, return a message that the API is being set up
    return res.status(200).json({
        message: 'FundTracer API',
        path: path,
        note: 'Full API coming soon. Frontend should work!'
    });
}
