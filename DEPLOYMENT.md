# Deployment Guide for Seamless Mobile Services

## Prerequisites
1. GoDaddy hosting account with Node.js support
2. Domain name configured in GoDaddy
3. SSH access to your hosting server
4. Production environment variables configured

## Step 1: Prepare Your Local Environment
1. Update `.env.production` with your production values:
   - Set `FRONTEND_URL` to your GoDaddy domain
   - Update all API keys and secrets
   - Configure email settings
   - Set proper CORS settings

2. Run the production build:
```bash
node scripts/build-production.js
```

This will create a `deploy` directory with all necessary files.

## Step 2: Configure GoDaddy Hosting
1. Log in to your GoDaddy hosting control panel
2. Enable Node.js support if not already enabled
3. Configure your domain's DNS settings:
   - Point your domain to the hosting server
   - Set up SSL certificate (recommended)

## Step 3: Deploy to GoDaddy
1. Connect to your hosting server via SSH
2. Navigate to your web root directory
3. Upload the contents of the `deploy` directory
4. Install dependencies:
```bash
npm ci --only=production
```

## Step 4: Configure Process Manager
1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the application:
```bash
pm2 start scripts/start-servers.js --name seamless-mobile
```

3. Save the PM2 process list:
```bash
pm2 save
```

4. Configure PM2 to start on server reboot:
```bash
pm2 startup
```

## Step 5: Configure Nginx (if needed)
Create an Nginx configuration file for your domain:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/payment {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Step 6: SSL Configuration
1. Install Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## Step 7: Verify Deployment
1. Check application logs:
```bash
pm2 logs seamless-mobile
```

2. Monitor application status:
```bash
pm2 status
```

3. Test your domain:
- Visit https://your-domain.com
- Test authentication
- Test payment processing
- Verify Zoho integration

## Maintenance Commands
- Restart application: `pm2 restart seamless-mobile`
- View logs: `pm2 logs seamless-mobile`
- Monitor resources: `pm2 monit`
- Update application: Follow steps 1-3 and restart

## Troubleshooting
1. Check application logs:
```bash
pm2 logs seamless-mobile
```

2. Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Verify environment variables:
```bash
pm2 env seamless-mobile
```

4. Check server resources:
```bash
pm2 monit
```

## Security Considerations
1. Keep Node.js and npm updated
2. Regularly update dependencies
3. Monitor error logs for suspicious activity
4. Keep SSL certificates up to date
5. Regularly backup your database and configuration 