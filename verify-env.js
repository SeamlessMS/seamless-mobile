require('dotenv').config();

console.log('Checking environment variables...\n');

const requiredVars = [
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET',
    'ZOHO_REFRESH_TOKEN',
    'ZOHO_DEPARTMENT_ID'
];

let allPresent = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    const isPresent = !!value;
    const displayValue = isPresent ? value.substring(0, 10) + '...' : 'NOT SET';
    
    console.log(`${varName}: ${isPresent ? '✓' : '✗'} (${displayValue})`);
    
    if (!isPresent) {
        allPresent = false;
    }
});

console.log('\nSummary:');
console.log(allPresent ? '✓ All required environment variables are set' : '✗ Some environment variables are missing'); 