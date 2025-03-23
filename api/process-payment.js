import Stripe from 'stripe';
import axios from 'axios';

// Version number for deployment tracking
const VERSION = '1.0.0';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

// Helper function to send CORS response
function sendCorsResponse(res, statusCode, body) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    res.setHeader('X-API-Version', VERSION);
    
    if (statusCode === 200 && !body) {
        res.status(statusCode).end();
    } else {
        res.status(statusCode).json(body);
    }
}

// Helper function to create a Zoho ticket
async function createPaymentTicket(paymentDetails) {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to get Zoho access token');
        }

        const ticketData = {
            subject: `Payment Received - ${paymentDetails.accountName}`,
            description: `Payment processed successfully\n\n` +
                        `Account Name: ${paymentDetails.accountName}\n` +
                        `Account Number: ${paymentDetails.accountNumber}\n` +
                        `Amount: $${paymentDetails.amount}\n` +
                        `Transaction ID: ${paymentDetails.chargeId}\n` +
                        `Date: ${new Date().toISOString()}`,
            email: paymentDetails.email || 'payments@seamlessms.net',
            departmentId: process.env.ZOHO_DEPARTMENT_ID,
            priority: 'Low',
            category: 'Payment',
            channel: 'Web',
            status: 'Open',
            customFields: {
                cf_payment_amount: paymentDetails.amount,
                cf_transaction_id: paymentDetails.chargeId,
                cf_account_number: paymentDetails.accountNumber
            }
        };

        const response = await axios({
            method: 'post',
            url: 'https://desk.zoho.com/api/v1/tickets',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json; charset=UTF-8',
                'Accept': 'application/json'
            },
            data: ticketData
        });

        console.log('Payment ticket created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating payment ticket:', error);
        // Don't throw the error - we don't want to affect the payment response
        return null;
    }
}

// Helper function to get Zoho access token
async function getAccessToken() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Zoho access token:', error);
        return null;
    }
}

export default async function handler(req, res) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        sendCorsResponse(res, 200);
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        sendCorsResponse(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        // Validate environment variables
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Stripe secret key is not configured');
        }

        // Initialize Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Validate request body
        const { token, amount, accountName, accountNumber } = req.body;
        if (!token || !amount || !accountName || !accountNumber) {
            sendCorsResponse(res, 400, { error: 'Missing required fields' });
            return;
        }

        // Create the charge
        const charge = await stripe.charges.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            source: token,
            description: `Payment for account ${accountNumber}`,
            metadata: {
                accountName,
                accountNumber
            }
        });

        // Create a Zoho ticket for the payment
        await createPaymentTicket({
            accountName,
            accountNumber,
            amount,
            chargeId: charge.id,
            email: charge.billing_details?.email
        });

        // Log successful payment
        console.log('Payment processed successfully:', {
            chargeId: charge.id,
            amount: charge.amount,
            accountNumber,
            status: charge.status
        });

        sendCorsResponse(res, 200, {
            success: true,
            chargeId: charge.id,
            message: 'Payment processed successfully'
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        sendCorsResponse(res, 500, {
            error: 'Payment processing failed',
            message: error.message
        });
    }
} 