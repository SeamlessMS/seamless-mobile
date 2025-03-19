const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupDomain() {
  try {
    console.log('🌐 Custom Domain Setup\n');

    // Get domain from user
    const domain = await question('Enter your domain (e.g., app.seamlessmobile.com): ');
    
    // Add domain to Vercel project
    console.log('\nAdding domain to Vercel project...');
    execSync(`vercel domains add ${domain}`, { stdio: 'inherit' });

    // Get DNS records
    console.log('\n🔍 DNS Configuration Required:');
    console.log('Please add the following DNS records to your domain provider:');
    console.log('\n1. A Record:');
    console.log(`   Name: ${domain}`);
    console.log('   Value: 76.76.21.21');
    console.log('\n2. CNAME Record:');
    console.log(`   Name: www.${domain}`);
    console.log('   Value: cname.vercel-dns.com');
    
    // Verify domain
    console.log('\nVerifying domain...');
    execSync(`vercel domains verify ${domain}`, { stdio: 'inherit' });

    console.log('\n✅ Domain setup complete!');
    console.log('\nNext steps:');
    console.log('1. Add the DNS records to your domain provider');
    console.log('2. Wait for DNS propagation (can take up to 48 hours)');
    console.log('3. Visit your domain to verify it\'s working');
  } catch (error) {
    console.error('❌ Error setting up domain:', error.message);
  } finally {
    rl.close();
  }
}

setupDomain(); 