// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
};

// Helper function to send CORS response
function sendCorsResponse(res, statusCode, body) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    
    if (statusCode === 200 && !body) {
        res.status(statusCode).end();
    } else {
        res.status(statusCode).json(body);
    }
}

export default async function handler(req, res) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        sendCorsResponse(res, 200);
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        sendCorsResponse(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        // Validate environment variables
        if (!process.env.STRIPE_PUBLISHABLE_KEY) {
            throw new Error('Stripe publishable key is not configured');
        }

        // Return the publishable key
        sendCorsResponse(res, 200, {
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
    } catch (error) {
        console.error('Error in payment config:', error);
        sendCorsResponse(res, 500, {
            error: 'Internal server error',
            message: error.message
        });
    }
} 