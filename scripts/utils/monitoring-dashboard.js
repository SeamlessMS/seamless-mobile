const express = require('express');
const { getMetrics } = require('./monitoring');

const router = express.Router();

// Basic health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Get detailed metrics
router.get('/metrics', (req, res) => {
    const metrics = getMetrics();
    res.json(metrics);
});

// Get error rate specifically
router.get('/metrics/error-rate', (req, res) => {
    const metrics = getMetrics();
    res.json({
        errorRate: metrics.errorRate,
        totalErrors: metrics.errorCount,
        totalRequests: metrics.requestCount,
        lastError: metrics.lastError,
        lastErrorTime: metrics.lastErrorTime
    });
});

// Get performance metrics
router.get('/metrics/performance', (req, res) => {
    const metrics = getMetrics();
    res.json({
        averageResponseTime: metrics.averageResponseTime,
        totalResponseTime: metrics.totalResponseTime,
        requestCount: metrics.requestCount,
        uptime: metrics.uptime
    });
});

// Get rate limit metrics
router.get('/metrics/rate-limits', (req, res) => {
    const metrics = getMetrics();
    res.json({
        rateLimitBreaches: metrics.rateLimitBreaches,
        lastRateLimitBreach: metrics.lastRateLimitBreach
    });
});

module.exports = router; 