const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const envVars = {
  ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
  ZOHO_ORG_ID: process.env.ZOHO_ORG_ID,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM
};

// Set each environment variable in Vercel
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    try {
      execSync(`vercel env add ${key} production`, { stdio: 'inherit' });
      console.log(`✅ Added ${key}`);
    } catch (error) {
      console.error(`❌ Failed to add ${key}:`, error.message);
    }
  } else {
    console.log(`⚠️ Skipping ${key} - no value found in .env`);
  }
});

console.log('\n🎉 Environment variables setup complete!'); 