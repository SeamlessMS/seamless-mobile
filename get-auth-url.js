const ZOHO_CLIENT_ID = '1000.HTS1Y0I5ZVSCXB5LW4D4BNFRKJ8LON';

const SCOPES = [
    'Desk.tickets.READ',
    'Desk.tickets.CREATE',
    'Desk.tickets.UPDATE',
    'Desk.contacts.READ',
    'Desk.contacts.CREATE'
].join(',');

const authUrl = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${ZOHO_CLIENT_ID}&scope=${SCOPES}&redirect_uri=http://localhost:3000/callback`;

console.log('\nPlease follow these steps:');
console.log('1. Open this URL in your browser:');
console.log(authUrl);
console.log('\n2. Log in to your Zoho account if needed');
console.log('3. Authorize the application');
console.log('4. Copy the code from the URL you are redirected to');
console.log('\nThe URL will look something like:');
console.log('http://localhost:3000/callback?code=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'); 