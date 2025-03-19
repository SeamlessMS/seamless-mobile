# Seamless Mobile Support System

A production-ready support ticket management system with integrated authentication and payment processing.

## Features

- Support ticket submission and management
- User authentication and authorization
- Secure payment processing with Stripe
- Zoho Desk integration for ticket management
- Zoho Books integration for invoice generation
- Real-time monitoring and alerting
- Rate limiting and security measures
- Comprehensive logging system

## Prerequisites

- Node.js v18 or higher
- npm v8 or higher
- Zoho Desk account
- Zoho Books account
- Stripe account

## Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Ports
   PORT=3000
   AUTH_PORT=3001
   PAYMENT_PORT=3002

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Zoho Configuration
   ZOHO_CLIENT_ID=your_zoho_client_id
   ZOHO_CLIENT_SECRET=your_zoho_client_secret
   ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
   ZOHO_ORG_ID=your_zoho_org_id
   ZOHO_DEPARTMENT_ID=your_zoho_department_id

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

## Development

To start all servers in development mode:

```bash
# Windows
.\start-servers.ps1

# Linux/Mac
npm run dev & npm run dev:auth & npm run dev:payment
```

## Production Deployment

1. Set environment variables for production
2. Build the application:
   ```bash
   npm run build
   ```
3. Start the servers:
   ```bash
   npm start
   ```

## Monitoring

The system includes comprehensive monitoring with the following features:

- Error rate monitoring (threshold: 5% in production)
- Response time monitoring
  - Critical endpoints: 500ms
  - Normal endpoints: 1s
  - Heavy operations: 2s
- Rate limit monitoring
- System resource monitoring
- Automatic Zoho ticket creation for issues

## Security Features

- Rate limiting on all endpoints
- JWT-based authentication
- Secure password hashing
- CORS protection
- Input validation
- XSS protection
- CSRF protection

## Logging

Logs are stored in the `logs` directory:
- `combined.log`: All logs
- `error.log`: Error-level logs only
- Log rotation: 5MB max size, 5 files

## API Documentation

API documentation is available at:
- Main API: `http://localhost:3000/api-docs`
- Auth API: `http://localhost:3001/api-docs`
- Payment API: `http://localhost:3002/api-docs`

## Testing

Run the test suite:
```bash
npm test
```

Run alert system tests:
```bash
npm run test:alerts
```

## Support

For support, please contact the system administrator or create a ticket in Zoho Desk. 