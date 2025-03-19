require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { requestMonitor, errorMonitor, rateLimitMonitor, systemResourceMonitor } = require('./utils/monitoring');
const { APIError, errorHandler } = require('./utils/errorHandler');
const { securityHeaders, createRateLimiter, corsOptions, xss, hpp, mongoSanitize } = require('./utils/security');

const app = express();
app.use(express.json());
app.use(cors(corsOptions));
app.use(xss());
app.use(hpp());
app.use(mongoSanitize());

// Apply monitoring middleware
app.use(requestMonitor);
app.use(rateLimitMonitor);

// Request logging middleware
app.use((req, res, next) => {
    logger.info({
        message: `${req.method} ${req.path}`,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        throw new APIError('Authentication required', 401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            throw new APIError('Invalid token', 403);
        }
        req.user = user;
        next();
    });
};

// Helper function to get Zoho access token
async function getZohoAccessToken() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });
        return response.data;
    } catch (error) {
        logger.error('Error getting Zoho access token:', error);
        throw new APIError('Failed to get Zoho access token', 500, error.response?.data);
    }
}

// Login endpoint
app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            throw new APIError('Email and password are required', 400);
        }

        // Get Zoho access token
        const auth = await getZohoAccessToken();

        // For testing purposes, we'll accept any password for the test user
        if (email === 'test@example.com' && password === 'test123') {
            const token = jwt.sign(
                { 
                    id: '1097773000000714085', // Test user ID from create-test-user.js
                    email: email,
                    name: 'Test User'
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            logger.info('User logged in successfully', { email });

            return res.json({
                success: true,
                token,
                user: {
                    id: '1097773000000714085',
                    email: email,
                    name: 'Test User'
                }
            });
        }

        throw new APIError('Invalid credentials', 401);
    } catch (error) {
        next(error);
    }
});

// Get account summary
app.get('/api/account/summary', authenticateToken, async (req, res, next) => {
    try {
        const auth = await getZohoAccessToken();

        // Get invoices from Zoho
        const invoicesResponse = await axios.get('https://desk.zoho.com/api/v1/invoices', {
            params: {
                contactId: req.user.id
            },
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });

        const invoices = invoicesResponse.data.data;
        
        // Calculate summary
        const currentBalance = invoices.reduce((sum, invoice) => {
            return sum + (invoice.status === 'Pending' ? invoice.amount : 0);
        }, 0);

        const lastPayment = invoices
            .filter(invoice => invoice.status === 'Paid')
            .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))[0]?.amount || 0;

        const nextBillDate = new Date();
        nextBillDate.setDate(nextBillDate.getDate() + 30); // Example: next bill in 30 days

        res.json({
            currentBalance,
            lastPayment,
            nextBillDate
        });
    } catch (error) {
        next(error);
    }
});

// Get invoices
app.get('/api/invoices', authenticateToken, async (req, res, next) => {
    try {
        const auth = await getZohoAccessToken();

        const response = await axios.get('https://desk.zoho.com/api/v1/invoices', {
            params: {
                contactId: req.user.id
            },
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });

        res.json({
            invoices: response.data.data.map(invoice => ({
                id: invoice.id,
                number: invoice.invoiceNumber,
                date: invoice.createdTime,
                amount: invoice.amount,
                status: invoice.status,
                pdfUrl: invoice.pdfUrl
            }))
        });
    } catch (error) {
        next(error);
    }
});

// Create payment intent
app.post('/api/payment/create-intent', authenticateToken, async (req, res, next) => {
    try {
        const { invoiceId, amount } = req.body;

        // Validate required fields
        if (!invoiceId || !amount) {
            throw new APIError('Invoice ID and amount are required', 400);
        }

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                invoiceId,
                customerId: req.user.id
            }
        });

        logger.info('Payment intent created', { 
            paymentIntentId: paymentIntent.id,
            invoiceId,
            amount 
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        next(error);
    }
});

// Webhook to handle Stripe events
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        logger.error('Webhook signature verification failed:', err);
        throw new APIError('Invalid webhook signature', 400);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            
            // Update invoice status in Zoho
            try {
                const auth = await getZohoAccessToken();
                await axios.put(
                    `https://desk.zoho.com/api/v1/invoices/${paymentIntent.metadata.invoiceId}`,
                    {
                        status: 'Paid',
                        paidDate: new Date().toISOString()
                    },
                    {
                        headers: {
                            'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                            'orgId': process.env.ZOHO_ORG_ID,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                logger.info('Invoice status updated after successful payment', {
                    invoiceId: paymentIntent.metadata.invoiceId,
                    paymentIntentId: paymentIntent.id
                });
            } catch (error) {
                logger.error('Error updating invoice status:', error);
                // Don't throw error here as the payment was successful
            }
            break;
        default:
            logger.info(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Password Reset Endpoint
app.post('/api/auth/reset-password', async (req, res, next) => {
    try {
        const { email, captcha } = req.body;

        // Validate required fields
        if (!email) {
            throw new APIError('Email is required', 400);
        }

        // Get Zoho access token
        const accessToken = await getZohoAccessToken();

        // Search for contact in Zoho
        const contactResponse = await axios.get(
            `https://desk.zoho.com/api/v1/contacts/search`,
            {
                params: {
                    email: email
                },
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': process.env.ZOHO_ORG_ID
                }
            }
        );

        if (contactResponse.data.data.length === 0) {
            // Don't reveal if email exists or not
            return res.status(200).json({ 
                message: 'If an account exists with this email, you will receive password reset instructions.' 
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { email, contactId: contactResponse.data.data[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token in Zoho contact notes
        await axios.put(
            `https://desk.zoho.com/api/v1/contacts/${contactResponse.data.data[0].id}`,
            {
                description: `Password reset token: ${resetToken} (expires in 1 hour)`
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': process.env.ZOHO_ORG_ID,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Send reset email
        // Note: In a production environment, you would use a proper email service
        // For now, we'll just log the reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
        logger.info('Password reset link generated', { email, resetLink });

        res.status(200).json({ 
            message: 'If an account exists with this email, you will receive password reset instructions.' 
        });
    } catch (error) {
        next(error);
    }
});

// Password reset confirmation endpoint
app.post('/api/auth/reset-password/confirm', async (req, res, next) => {
    try {
        const { token, password, captcha } = req.body;

        // Validate required fields
        if (!token || !password) {
            throw new APIError('Token and password are required', 400);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email, contactId } = decoded;

        // Get Zoho access token
        const zohoToken = await getZohoAccessToken();

        // Update contact's password in Zoho
        await axios.put(`https://www.zohoapis.com/crm/v2/Contacts/${contactId}`, {
            data: [{
                Password: password // Note: In a real implementation, this should be hashed
            }]
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${zohoToken}`,
                'Content-Type': 'application/json'
            }
        });

        logger.info('Password reset successful', { email, contactId });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
});

// Apply error handling middleware
app.use(errorMonitor);
app.use(errorHandler);

// Start system resource monitoring
setInterval(systemResourceMonitor, 60000); // Check every minute

const PORT = process.env.AUTH_PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Auth API running on port ${PORT}`);
}); 