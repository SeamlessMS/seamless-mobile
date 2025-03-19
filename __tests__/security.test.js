const request = require('supertest');
const express = require('express');
const { securityHeaders, createRateLimiter, corsOptions, xss, hpp, mongoSanitize } = require('../scripts/utils/security');

describe('Security Middleware Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(securityHeaders);
        app.use(createRateLimiter(1000, 2)); // 2 requests per second
        app.use(corsOptions);
        app.use(xss);
        app.use(hpp);
        app.use(mongoSanitize);
    });

    test('should have security headers', async () => {
        const response = await request(app).get('/');
        expect(response.headers).toHaveProperty('x-frame-options');
        expect(response.headers).toHaveProperty('x-content-type-options');
        expect(response.headers).toHaveProperty('x-xss-protection');
        expect(response.headers).toHaveProperty('strict-transport-security');
    });

    test('should prevent XSS attacks', async () => {
        app.get('/test', (req, res) => {
            res.send(req.query.input);
        });

        const response = await request(app)
            .get('/test')
            .query({ input: '<script>alert("xss")</script>' });

        expect(response.text).not.toContain('<script>');
    });

    test('should enforce rate limiting', async () => {
        app.get('/test', (req, res) => res.send('ok'));

        // Make 3 requests (limit is 2)
        await request(app).get('/test');
        await request(app).get('/test');
        const response = await request(app).get('/test');

        expect(response.status).toBe(429);
        expect(response.text).toContain('Too many requests');
    });

    test('should sanitize MongoDB queries', async () => {
        app.get('/test', (req, res) => {
            res.json(req.query);
        });

        const response = await request(app)
            .get('/test')
            .query({ $gt: '1' });

        expect(response.body).not.toHaveProperty('$gt');
    });

    test('should prevent HTTP Parameter Pollution', async () => {
        app.get('/test', (req, res) => {
            res.json(req.query);
        });

        const response = await request(app)
            .get('/test')
            .query({ id: ['1', '2'] });

        expect(Array.isArray(response.body.id)).toBe(false);
    });

    test('should enforce CORS policy', async () => {
        const response = await request(app)
            .get('/')
            .set('Origin', 'http://malicious-site.com');

        expect(response.headers['access-control-allow-origin']).toBe(process.env.FRONTEND_URL);
    });
}); 