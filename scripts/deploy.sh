#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build frontend assets
echo "Building frontend assets..."
npm run build

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p logs
mkdir -p public/uploads

# Set proper permissions
echo "Setting proper permissions..."
chmod 755 public/uploads
chmod 644 .env

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 reload ecosystem.config.js --env production

# Check if services are running
echo "Checking service status..."
pm2 status

echo "Deployment completed successfully!" 