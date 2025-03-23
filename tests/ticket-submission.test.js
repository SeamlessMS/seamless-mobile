const puppeteer = require('puppeteer');

async function testTicketSubmission() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Enable request interception to capture API calls
        await page.setRequestInterception(true);
        page.on('request', request => {
            console.log('Request:', {
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData()
            });
            request.continue();
        });

        // Enable response interception to capture API responses
        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/submit-ticket')) {
                try {
                    const responseData = await response.json();
                    console.log('API Response:', {
                        status: response.status(),
                        data: responseData
                    });
                } catch (error) {
                    console.error('Error parsing response:', error);
                    console.log('Raw response:', await response.text());
                }
            }
        });

        // Enable console logging from the page
        page.on('console', msg => {
            console.log('Page Console:', msg.text());
        });

        // Enable error logging from the page
        page.on('error', err => {
            console.error('Page Error:', err);
        });

        // Enable request failure logging
        page.on('requestfailed', request => {
            console.error('Request Failed:', {
                url: request.url(),
                method: request.method(),
                failure: request.failure()
            });
        });

        // Navigate to the ticket submission page
        console.log('Navigating to ticket submission page...');
        await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for the form to be loaded
        await page.waitForSelector('#ticketForm', { timeout: 5000 });

        // Fill out the form
        console.log('Filling out the form...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '1234567890');
        await page.select('#serviceType', 'Hardware');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'High');

        // Submit the form with a shorter timeout
        console.log('Submitting the form...');
        try {
            await Promise.race([
                Promise.all([
                    page.waitForResponse(response => response.url().includes('/api/submit-ticket')),
                    page.click('button[type="submit"]')
                ]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Form submission timeout')), 10000))
            ]);
        } catch (error) {
            console.error('Form submission error:', error);
            // Check if there are any error messages on the page
            const errorMessage = await page.$('.error-message');
            if (errorMessage) {
                const errorText = await errorMessage.evaluate(el => el.textContent);
                console.error('Error message found:', errorText);
            }
            throw error;
        }

        // Wait for any error messages or success notifications
        await page.waitForTimeout(5000);

        // Check for error messages
        const errorMessage = await page.$('.error-message');
        if (errorMessage) {
            const errorText = await errorMessage.evaluate(el => el.textContent);
            console.error('Error message found:', errorText);
        }

        // Check for success message
        const successMessage = await page.$('.success-message');
        if (successMessage) {
            const successText = await successMessage.evaluate(el => el.textContent);
            console.log('Success message found:', successText);
        }

    } catch (error) {
        console.error('Test failed:', error);
        console.error('Error stack:', error.stack);
    } finally {
        await browser.close();
    }
}

// Run the test
console.log('Starting ticket submission test...');
testTicketSubmission().catch(console.error); 