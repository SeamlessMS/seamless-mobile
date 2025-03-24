const puppeteer = require('puppeteer');

// Only run tests in development environment
if (process.env.NODE_ENV !== 'development') {
    console.log('Tests are disabled in production environment');
    process.exit(0);
}

async function testTicketSubmission() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Enable request interception
        await page.setRequestInterception(true);
        page.on('request', request => {
            console.log(`Outgoing request: ${request.method()} ${request.url()}`);
            request.continue();
        });

        // Enable response logging
        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/submit-ticket')) {
                console.log(`Response from ${url}:`, {
                    status: response.status(),
                    headers: response.headers()
                });
            }
        });

        // Enable console logging
        page.on('console', msg => console.log('Browser console:', msg.text()));
        page.on('pageerror', err => console.error('Browser page error:', err));
        
        // Navigate to the ticket submission page
        console.log('Navigating to ticket submission page...');
        const response = await page.goto('https://seamless-mobile11.vercel.app/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        if (!response.ok()) {
            throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
        }

        // Fill out the form
        console.log('Filling out the form...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '1234567890');
        await page.select('#serviceType', 'Apple');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'Medium');

        // Submit the form and wait for network response
        console.log('Submitting the form...');
        const [submitResponse] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/api/submit-ticket')),
            page.click('button[type="submit"]')
        ]);

        // Log the response
        console.log('Form submission response:', {
            status: submitResponse.status(),
            headers: submitResponse.headers()
        });

        // Wait for UI update
        console.log('Waiting for UI update...');
        await page.waitForFunction(() => {
            const alert = document.querySelector('.alert');
            return alert !== null;
        }, { timeout: 15000 });

        // Get the response text
        const alertText = await page.evaluate(() => {
            const alert = document.querySelector('.alert');
            return alert ? alert.textContent : null;
        });

        console.log('Alert message:', alertText);

        // Take a screenshot
        await page.screenshot({ path: 'test-results/ticket-submission.png' });
        console.log('Screenshot saved to test-results/ticket-submission.png');

    } catch (error) {
        console.error('Test failed:', error);
        if (page) {
            // Take a screenshot of the error state
            await page.screenshot({ path: 'test-results/ticket-submission-error.png' });
            console.log('Error screenshot saved to test-results/ticket-submission-error.png');
        }
        throw error;
    } finally {
        await browser.close();
    }
}

// Only run if explicitly called with NODE_ENV=development
if (process.env.NODE_ENV === 'development') {
    testTicketSubmission().catch(console.error);
} 