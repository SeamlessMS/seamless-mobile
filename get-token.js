const axios = require('axios');

async function getRefreshToken() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                code: '1000.5ce3e26c2ca80d61e07b1b04dbd775bf.e863b391f33c3ff2bf157b219b424e12',
                client_id: '1000.I9NDMDUJLLPL5B6E9BDRSVLT6VEIEB',
                client_secret: 'ede0306a021e87a94a2a219e663669c3cbfc882156',
                grant_type: 'authorization_code'
            }
        });
        
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

getRefreshToken(); 