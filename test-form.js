const puppeteer = require('puppeteer');

async function testFormSubmission() {
    console.log('Starting form submission test...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Enable request interception
        await page.setRequestInterception(true);
        
        // Log all requests
        page.on('request', request => {
            if (request.url().includes('/api/submit-ticket')) {
                console.log('\nForm submission details:');
                console.log('URL:', request.url());
                console.log('Method:', request.method());
                console.log('Headers:', request.headers());
                console.log('Post Data:', request.postData());
            }
            request.continue();
        });

        // Enable detailed logging
        page.on('console', msg => console.log('Browser Console:', msg.text()));
        page.on('pageerror', err => console.error('Page Error:', err.message));
        page.on('requestfailed', request => 
            console.log('Failed Request:', request.url(), request.failure()?.errorText || 'Unknown error')
        );
        page.on('response', async response => {
            const url = response.url();
            if (!response.ok()) {
                console.log(`Failed Response: ${url} - Status: ${response.status()}`);
                try {
                    const text = await response.text();
                    console.log('Response body:', text);
                } catch (e) {
                    console.log('Could not get response body:', e.message);
                }
            }
        });

        console.log('Navigating to form page...');
        await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Wait for form elements to be present
        await page.waitForSelector('#employeeName');
        await page.waitForSelector('#email');
        await page.waitForSelector('#phone');
        await page.waitForSelector('#serviceType');
        await page.waitForSelector('#followUpContact');
        await page.waitForSelector('#issueDescription');
        await page.waitForSelector('#priority');
        
        console.log('Filling out form...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '1234567890');
        await page.select('#serviceType', 'Apple');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'Medium');

        console.log('Submitting form...');
        
        // Get the form data that will be submitted
        const formData = await page.evaluate(() => {
            const form = document.querySelector('form');
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        });
        console.log('Form data being submitted:', formData);

        // Submit and wait for response
        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/api/submit-ticket')),
            page.click('button[type="submit"]')
        ]);

        console.log('Response status:', response.status());
        try {
            const responseData = await response.text();
            console.log('Response data:', responseData);
        } catch (error) {
            console.log('Could not read response:', error.message);
        }

    } catch (error) {
        console.error('Test failed:', error);
        if (error.message.includes('timeout')) {
            console.log('The form submission timed out. This could mean:');
            console.log('1. The server is not responding');
            console.log('2. The form submission endpoint is incorrect');
            console.log('3. There was no network request matching the expected pattern');
        }
    } finally {
        await browser.close();
    }
}

testFormSubmission(); 