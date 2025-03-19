require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
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

// Rate limiting configuration
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const paymentLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 payment attempts per hour

// Apply general rate limiting to all routes
app.use(generalLimiter);

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

// Create payment intent
app.post('/api/payment/create-intent', paymentLimiter, async (req, res, next) => {
    try {
        const { amount, currency = 'usd', description } = req.body;

        // Validate required fields
        if (!amount) {
            throw new APIError('Amount is required', 400);
        }

        // Validate amount is a positive number
        if (amount <= 0) {
            throw new APIError('Amount must be greater than 0', 400);
        }

        // Create a payment intent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            description: description,
            payment_method_types: ['card'],
            metadata: {
                integration_check: 'accept_a_payment'
            }
        });

        logger.info('Payment intent created', {
            paymentIntentId: paymentIntent.id,
            amount,
            currency
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
    } catch (error) {
        next(error);
    }
});

// Webhook to handle successful payments
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
            logger.info('Payment succeeded', {
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
            });
            // Here you would typically update your database or send notifications
            break;
        default:
            logger.info(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Apply error handling middleware
app.use(errorMonitor);
app.use(errorHandler);

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.post('/payment', paymentLimiter, (req, res) => {
    // Payment processing logic here
    res.json({ message: 'Payment endpoint' });
});

// Start system resource monitoring
setInterval(systemResourceMonitor, 60000); // Check every minute

const PORT = process.env.PAYMENT_PORT || 3002;
app.listen(PORT, () => {
    logger.info(`Payment API running on port ${PORT}`);
}); 