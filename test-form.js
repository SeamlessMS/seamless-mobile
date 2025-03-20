const puppeteer = require('puppeteer');

async function testTicketForm() {
    console.log('Starting form submission test...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    try {
        // Enable request interception
        await page.setRequestInterception(true);

        // Handle requests
        page.on('request', request => {
            if (request.resourceType() === 'image') {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Enable detailed logging
        page.on('console', msg => console.log('Browser Console:', msg.text()));
        page.on('pageerror', err => console.error('Page Error:', err.message));
        page.on('requestfailed', request => 
            console.log('Failed Request:', request.url(), request.failure()?.errorText || 'Unknown error')
        );
        page.on('response', async response => {
            const url = response.url();
            if (!response.ok() && !url.includes('images/')) {
                console.log(`Failed Response: ${url} - Status: ${response.status()}`);
                try {
                    const text = await response.text();
                    console.log('Response body:', text);
                } catch (e) {
                    console.log('Could not get response body:', e.message);
                }
            }
        });

        // Navigate to form
        console.log('Navigating to form...');
        await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Fill out form
        console.log('Filling out form...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '1234567890');
        await page.select('#serviceType', 'Apple');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'Medium');

        // Submit form directly using fetch
        console.log('Submitting form...');
        const result = await page.evaluate(async () => {
            const formData = {
                employeeName: 'Test User',
                email: 'test@example.com',
                phone: '1234567890',
                serviceType: 'Apple',
                followUpContact: 'Test Contact',
                issueDescription: 'This is a test ticket submission',
                priority: 'Medium'
            };
            
            console.log('Submitting form data:', formData);
            
            try {
                const response = await fetch('/api/submit-ticket', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const responseText = await response.text();
                console.log('Raw response:', responseText);
                
                try {
                    return {
                        ok: response.ok,
                        status: response.status,
                        data: JSON.parse(responseText)
                    };
                } catch (e) {
                    return {
                        ok: false,
                        status: response.status,
                        error: 'Failed to parse JSON response',
                        rawResponse: responseText
                    };
                }
            } catch (error) {
                return {
                    ok: false,
                    error: error.message
                };
            }
        });

        console.log('Submission result:', result);

        if (!result.ok) {
            throw new Error(`Form submission failed: ${result.error || result.data?.message || 'Unknown error'}`);
        }

        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
testTicketForm().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
}); 