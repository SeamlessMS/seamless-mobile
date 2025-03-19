const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vercel deployment process...\n');

// Step 1: Install dependencies
console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Step 2: Set up environment variables
console.log('\n🔐 Setting up environment variables...');
execSync('node scripts/setup-vercel-env.js', { stdio: 'inherit' });

// Step 3: Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');
execSync('vercel deploy --prod', { stdio: 'inherit' });

// Step 4: Verify deployment
console.log('\n✅ Deployment complete!');
console.log('\nNext steps:');
console.log('1. Visit your Vercel dashboard to verify the deployment');
console.log('2. Test your API endpoints');
console.log('3. Set up your custom domain if needed'); 