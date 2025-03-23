const puppeteer = require('puppeteer');

async function debugPaymentPage() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable request interception
        await page.setRequestInterception(true);
        
        // Log all requests
        page.on('request', request => {
            console.log(`Request: ${request.method()} ${request.url()}`);
            request.continue();
        });
        
        // Log all responses
        page.on('response', response => {
            console.log(`Response: ${response.status()} ${response.url()}`);
        });
        
        // Log console messages
        page.on('console', msg => console.log('Browser console:', msg.text()));
        
        // Log errors
        page.on('pageerror', error => {
            console.error('Page error:', error.message);
        });

        // Navigate to payment page
        console.log('Navigating to payment page...');
        await page.goto('https://www.seamlessms.net/payment.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for and check important elements
        console.log('Checking page elements...');
        const elements = await page.evaluate(() => {
            return {
                form: !!document.getElementById('payment-form'),
                cardNumber: !!document.getElementById('card-number-element'),
                cardExpiry: !!document.getElementById('card-expiry-element'),
                cardCvc: !!document.getElementById('card-cvc-element'),
                alerts: !!document.getElementById('payment-alerts')
            };
        });
        
        console.log('Page elements status:', elements);

        // Check network requests
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');
        
        client.on('Network.requestWillBeSent', request => {
            if (request.request.url.includes('/api/')) {
                console.log('API Request:', {
                    url: request.request.url,
                    method: request.request.method,
                    headers: request.request.headers
                });
            }
        });

        client.on('Network.responseReceived', response => {
            if (response.response.url.includes('/api/')) {
                console.log('API Response:', {
                    url: response.response.url,
                    status: response.response.status,
                    headers: response.response.headers
                });
            }
        });

        // Wait for potential errors
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('Debug script error:', error);
    } finally {
        await browser.close();
    }
}

debugPaymentPage(); 