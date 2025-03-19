const os = require('os');
const logger = require('./logger');
const { createZohoTicket } = require('./zoho');

// Monitoring thresholds
const THRESHOLDS = {
    ERROR_RATE: 0.1, // 10% error rate
    SLOW_RESPONSE: 1000, // 1 second
    RATE_LIMIT_BREACHES: 5, // per hour
    MEMORY_USAGE: 0.9, // 90% of total memory
    CPU_USAGE: 0.8 // 80% CPU usage
};

// Monitoring metrics
let metrics = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    rateLimitBreaches: 0,
    responseTimes: [],
    lastAlertTime: {
        error: 0,
        performance: 0,
        rateLimit: 0,
        resource: 0
    }
};

// Alert cooldown (15 minutes)
const ALERT_COOLDOWN = 15 * 60 * 1000;

// Request monitoring middleware
const requestMonitor = (req, res, next) => {
    const start = Date.now();
    metrics.requestCount++;

    res.on('finish', () => {
        const duration = Date.now() - start;
        metrics.responseTimes.push(duration);

        // Keep only last 100 response times
        if (metrics.responseTimes.length > 100) {
            metrics.responseTimes.shift();
        }

        // Check for slow responses
        if (duration > THRESHOLDS.SLOW_RESPONSE) {
            checkPerformanceAlert(duration, req);
        }
    });

    next();
};

// Error monitoring middleware
const errorMonitor = (err, req, res, next) => {
    metrics.errorCount++;
    const errorRate = metrics.errorCount / metrics.requestCount;

    if (errorRate > THRESHOLDS.ERROR_RATE) {
        checkErrorAlert(errorRate, req);
    }

    next(err);
};

// Rate limit monitoring middleware
const rateLimitMonitor = (req, res, next) => {
    if (res.statusCode === 429) {
        metrics.rateLimitBreaches++;
        if (metrics.rateLimitBreaches > THRESHOLDS.RATE_LIMIT_BREACHES) {
            checkRateLimitAlert(req);
        }
    }
    next();
};

// System resource monitoring
const systemResourceMonitor = async () => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = (totalMemory - freeMemory) / totalMemory;

    const cpuUsage = os.loadavg()[0] / os.cpus().length;

    if (memoryUsage > THRESHOLDS.MEMORY_USAGE || cpuUsage > THRESHOLDS.CPU_USAGE) {
        checkResourceAlert(memoryUsage, cpuUsage);
    }
};

// Alert functions
async function checkErrorAlert(errorRate, req) {
    const now = Date.now();
    if (now - metrics.lastAlertTime.error > ALERT_COOLDOWN) {
        metrics.lastAlertTime.error = now;
        try {
            await createZohoTicket({
                subject: '🚨 High Error Rate Alert',
                description: `High error rate detected (${(errorRate * 100).toFixed(2)}%)`,
                priority: 'High',
                department: 'Technical',
                customFields: {
                    environment: process.env.NODE_ENV || 'development',
                    serverName: os.hostname(),
                    errorRate: errorRate.toFixed(2)
                }
            });
            logger.warn(`High error rate alert sent: ${(errorRate * 100).toFixed(2)}%`);
        } catch (error) {
            logger.error('Failed to create error rate alert ticket:', error);
        }
    }
}

async function checkPerformanceAlert(duration, req) {
    const now = Date.now();
    if (now - metrics.lastAlertTime.performance > ALERT_COOLDOWN) {
        metrics.lastAlertTime.performance = now;
        try {
            await createZohoTicket({
                subject: '⚠️ Slow Response Time Alert',
                description: `Slow response time detected (${duration}ms)

Request Details:
- Path: ${req.path}
- Method: ${req.method}
- Response Time: ${duration}ms

Performance Metrics:
- Average Response Time: ${Math.round(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length)}ms
- Max Response Time: ${Math.max(...metrics.responseTimes)}ms
- Min Response Time: ${Math.min(...metrics.responseTimes)}ms`,
                priority: 'Medium',
                category: 'Performance Alert'
            });
        } catch (error) {
            logger.error('Failed to create performance alert ticket:', error);
        }
    }
}

async function checkRateLimitAlert(req) {
    const now = Date.now();
    if (now - metrics.lastAlertTime.rateLimit > ALERT_COOLDOWN) {
        metrics.lastAlertTime.rateLimit = now;
        try {
            await createZohoTicket({
                subject: '🚫 Rate Limit Breach Alert',
                description: `Multiple rate limit breaches detected

Rate Limiting Metrics:
- Total Breaches: ${metrics.rateLimitBreaches}
- Time Window: Last hour
- IP Address: ${req.ip}

System Load:
- Memory Usage: ${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB
- CPU Load: ${os.loadavg()[0].toFixed(2)}`,
                priority: 'Medium',
                category: 'Security Alert'
            });
        } catch (error) {
            logger.error('Failed to create rate limit alert ticket:', error);
        }
    }
}

async function checkResourceAlert(memoryUsage, cpuUsage) {
    const now = Date.now();
    if (now - metrics.lastAlertTime.resource > ALERT_COOLDOWN) {
        metrics.lastAlertTime.resource = now;
        try {
            await createZohoTicket({
                subject: '⚡ High Resource Usage Alert',
                description: `High system resource usage detected

Resource Metrics:
- Memory Usage: ${(memoryUsage * 100).toFixed(2)}%
- CPU Usage: ${(cpuUsage * 100).toFixed(2)}%
- Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB
- Free Memory: ${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB

System Information:
- OS: ${os.type()} ${os.release()}
- CPU Model: ${os.cpus()[0].model}
- CPU Cores: ${os.cpus().length}`,
                priority: 'High',
                category: 'Resource Alert'
            });
        } catch (error) {
            logger.error('Failed to create resource alert ticket:', error);
        }
    }
}

module.exports = {
    requestMonitor,
    errorMonitor,
    rateLimitMonitor,
    systemResourceMonitor,
    metrics
}; 