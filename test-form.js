const puppeteer = require('puppeteer');

async function testFormSubmission() {
    console.log('Starting form submission test...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Enable request interception to see what's being sent
        await page.setRequestInterception(true);
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
            if (!response.ok()) {
                console.log(`Failed Response: ${response.url()} - Status: ${response.status()}`);
                try {
                    const text = await response.text();
                    console.log('Response body:', text);
                } catch (e) {
                    console.log('Could not get response body:', e.message);
                }
            } else {
                // Log successful responses too for debugging
                try {
                    const text = await response.text();
                    console.log(`Successful Response from ${response.url()}:`, text);
                } catch (e) {}
            }
        });

        console.log('Navigating to form page...');
        await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        console.log('Filling out form...');
        
        // Fill in the form fields with realistic test data
        await page.type('#firstName', 'John');  // Using firstName instead of employeeName
        await page.type('#lastName', 'Smith');  // Added lastName field
        await page.type('#email', 'test@seamlessms.net');
        await page.type('#phone', '7204887700'); // Removed hyphens
        
        // Select service type - using exact value from dropdown
        await page.select('#serviceType', 'Technical Support');
        
        await page.type('#subject', 'VoIP Service Issues'); // Added subject field
        await page.type('#description', 'Test ticket submission - VoIP service intermittent connection issues affecting multiple users. Priority support needed.');
        
        // Select priority from available options
        await page.select('#priority', 'High');

        console.log('Form data before submission:');
        const formData = await page.evaluate(() => {
            const form = document.querySelector('form');
            const data = {};
            const elements = form.elements;
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element.name && element.value) {
                    data[element.name] = element.value;
                }
            }
            return data;
        });
        console.log(formData);

        console.log('Submitting form...');
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

        // Check for success/error messages on the page
        const successMessage = await page.$('#successMessage');
        const errorMessage = await page.$('#errorMessage');
        
        if (successMessage) {
            const text = await page.evaluate(el => el.textContent, successMessage);
            console.log('Success message:', text);
        }
        
        if (errorMessage) {
            const text = await page.evaluate(el => el.textContent, errorMessage);
            console.log('Error message:', text);
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