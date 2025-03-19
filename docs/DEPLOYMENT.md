# Production Deployment Guide

This guide outlines the steps to deploy the Seamless Mobile Support System to production.

## Prerequisites

- Docker and Docker Compose installed on the production server
- Node.js v18 or higher (if deploying without Docker)
- Access to required API keys and credentials
- SSL/TLS certificates for HTTPS

## Deployment Options

### Option 1: Docker Deployment (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd seamless-mobile-support
   ```

2. Copy the production environment template:
   ```bash
   cp .env.production .env
   ```

3. Update the `.env` file with your production credentials:
   - Replace all placeholder values with actual production credentials
   - Ensure all URLs are using HTTPS
   - Set appropriate rate limiting values
   - Configure monitoring thresholds

4. Build and start the Docker containers:
   ```bash
   # Build the images
   npm run docker:build

   # Start the containers
   npm run docker:up
   ```

5. Verify the deployment:
   ```bash
   # Check container status
   docker-compose ps

   # View logs
   npm run docker:logs
   ```

### Option 2: Manual Deployment

1. Install dependencies:
   ```bash
   npm ci --only=production
   ```

2. Set up environment variables:
   ```bash
   cp .env.production .env
   # Edit .env with production values
   ```

3. Start the servers:
   ```bash
   npm start
   ```

## SSL/TLS Configuration

1. Obtain SSL certificates (e.g., from Let's Encrypt)
2. Configure your reverse proxy (e.g., Nginx) with SSL:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /auth {
           proxy_pass http://localhost:3001;
           # ... same proxy settings as above
       }

       location /payment {
           proxy_pass http://localhost:3002;
           # ... same proxy settings as above
       }
   }
   ```

## Monitoring Setup

1. Configure monitoring thresholds in `.env`:
   ```env
   ERROR_RATE_THRESHOLD=0.05
   RESPONSE_TIME_THRESHOLD=1000
   CRITICAL_RESPONSE_TIME_THRESHOLD=500
   RATE_LIMIT_BREACH_THRESHOLD=5
   ```

2. Set up log rotation:
   ```bash
   # Install logrotate
   sudo apt-get install logrotate

   # Create logrotate configuration
   sudo nano /etc/logrotate.d/seamless-mobile
   ```

   Add the following configuration:
   ```
   /path/to/your/app/logs/*.log {
       daily
       rotate 7
       compress
       delaycompress
       missingok
       notifempty
       create 0640 nodejs nodejs
   }
   ```

## Backup Strategy

1. Database backups (if using a database)
2. Log file backups
3. Environment file backups
4. SSL certificate backups

## Security Considerations

1. Firewall configuration:
   ```bash
   # Allow only necessary ports
   sudo ufw allow 443/tcp
   sudo ufw allow 80/tcp
   ```

2. Regular security updates:
   ```bash
   # Update system packages
   sudo apt-get update
   sudo apt-get upgrade

   # Update npm packages
   npm audit fix
   ```

3. Monitor for security alerts:
   - Subscribe to security bulletins for Node.js
   - Monitor npm security advisories
   - Regular security audits

## Maintenance

1. Regular health checks:
   ```bash
   # Check server health
   curl http://localhost:3000/health
   curl http://localhost:3001/health
   curl http://localhost:3002/health

   # Check logs
   npm run docker:logs
   ```

2. Performance monitoring:
   - Monitor response times
   - Check error rates
   - Review rate limit breaches

3. Backup verification:
   - Test backup restoration
   - Verify data integrity

## Troubleshooting

1. Common issues:
   - Port conflicts
   - SSL certificate expiration
   - Rate limit issues
   - Memory leaks

2. Log analysis:
   ```bash
   # View error logs
   tail -f logs/error.log

   # Search for specific errors
   grep "ERROR" logs/combined.log
   ```

3. Performance issues:
   - Check system resources
   - Monitor response times
   - Review rate limiting settings

## Rollback Procedure

1. Stop the current deployment:
   ```bash
   npm run docker:down
   ```

2. Restore from backup:
   ```bash
   # Restore environment file
   cp .env.backup .env

   # Restore logs if needed
   cp -r logs.backup/* logs/
   ```

3. Deploy previous version:
   ```bash
   git checkout <previous-version>
   npm run docker:up
   ```

## Support

For deployment support:
1. Check the logs for errors
2. Review the monitoring dashboard
3. Contact system administrator
4. Create a support ticket in Zoho Desk 