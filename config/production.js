module.exports = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0'
    },
    
    // Database Configuration
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    },
    
    // Zoho Desk Configuration
    zoho: {
        clientId: process.env.ZOHO_CLIENT_ID,
        clientSecret: process.env.ZOHO_CLIENT_SECRET,
        refreshToken: process.env.ZOHO_REFRESH_TOKEN,
        organizationId: process.env.ZOHO_ORG_ID
    },
    
    // Stripe Configuration
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h'
    },
    
    // Email Configuration
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM
    },
    
    // Logging Configuration
    logging: {
        level: 'info',
        filename: 'logs/app.log',
        maxSize: '10m',
        maxFiles: '7d'
    }
}; 