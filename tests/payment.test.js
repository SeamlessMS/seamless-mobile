const puppeteer = require('puppeteer');
const path = require('path');
const server = require('./server');

describe('Payment Page Tests', () => {
    let browser;
    let page;
    const baseUrl = 'http://localhost:3000';

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    afterAll(async () => {
        await browser.close();
        server.close();
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Mock Stripe
        await page.evaluateOnNewDocument(() => {
            window.Stripe = () => ({
                elements: () => ({
                    create: (type) => ({
                        mount: () => {},
                        unmount: () => {}
                    })
                }),
                createToken: () => Promise.resolve({
                    token: { id: 'test_token_123' }
                })
            });
        });

        // Mock console methods to capture logs
        page.on('console', msg => console.log('Browser console:', msg.text()));
    });

    afterEach(async () => {
        await page.close();
    });

    test('Payment page loads correctly', async () => {
        await page.goto(`${baseUrl}/payment.html`);
        
        // Check if the page title is correct
        const title = await page.title();
        expect(title).toBe('Payment - Seamless Mobile Services');

        // Check if all form elements are present
        const formElements = await page.$$('#payment-form input, #payment-form select');
        expect(formElements.length).toBeGreaterThan(0);

        // Check if Stripe elements are loaded
        const stripeElements = await page.$$('#card-number-element, #card-expiry-element, #card-cvc-element');
        expect(stripeElements.length).toBe(3);
    });

    test('Form validation works', async () => {
        await page.goto(`${baseUrl}/payment.html`);

        // Try to submit empty form
        await page.click('button[type="submit"]');

        // Check for validation messages
        const validationMessages = await page.$$('.invalid-feedback');
        expect(validationMessages.length).toBeGreaterThan(0);
    });

    test('Payment form submission with test data and Zoho ticket creation', async () => {
        await page.goto(`${baseUrl}/payment.html`);

        // Fill in the form with test data
        await page.type('#account-name', 'Test User');
        await page.type('#account-number', 'TEST123456');
        await page.type('#amount', '100.00');
        await page.type('#card-holder-name', 'Test User');

        // Mock the fetch calls
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('/api/payment/process')) {
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        chargeId: 'test_charge_123',
                        message: 'Payment processed successfully'
                    })
                });
            } else if (request.url().includes('desk.zoho.com/api/v1/tickets')) {
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'test_ticket_123',
                        ticketNumber: 'TICKET-123',
                        subject: 'Payment Received - Test User',
                        status: 'Closed'
                    })
                });
            } else {
                request.continue();
            }
        });

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for the success message
        await page.waitForFunction(() => {
            const alert = document.querySelector('.alert-success');
            return alert && alert.textContent.includes('Payment processed successfully');
        }, { timeout: 5000 });

        // Check if form was reset
        const accountNameValue = await page.$eval('#account-name', el => el.value);
        expect(accountNameValue).toBe('');
    });

    test('Error handling for failed payment', async () => {
        await page.goto(`${baseUrl}/payment.html`);

        // Fill in the form with test data
        await page.type('#account-name', 'Test User');
        await page.type('#account-number', 'TEST123456');
        await page.type('#amount', '100.00');
        await page.type('#card-holder-name', 'Test User');

        // Mock a failed payment response
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('/api/payment/process')) {
                request.respond({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: false,
                        error: 'Payment failed',
                        message: 'Invalid card details'
                    })
                });
            } else {
                request.continue();
            }
        });

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for the error message
        await page.waitForFunction(() => {
            const alert = document.querySelector('.alert-danger');
            return alert && alert.textContent.includes('Invalid card details');
        }, { timeout: 5000 });
    });
}); 