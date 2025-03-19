#!/bin/bash

# Stop any running instances
pm2 stop seamless-mobile || true
pm2 delete seamless-mobile || true

# Install dependencies
npm install --production

# Create necessary directories
mkdir -p logs uploads

# Set proper permissions
chmod 755 logs uploads

# Start the application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup | tail -n 1 > pm2-startup.sh
chmod +x pm2-startup.sh
./pm2-startup.sh 