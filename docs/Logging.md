# Logging System Documentation

## Overview
The application uses Winston for structured logging across all microservices. Logs are formatted in JSON for easy parsing and analysis.

## Log Levels
- **error**: System errors, crashes, and critical issues
- **warn**: Warning conditions
- **info**: General operational information
- **debug**: Detailed debugging information (development only)

## Log Format
Each log entry contains:
```json
{
  "level": "string",
  "message": "string",
  "timestamp": "ISO-8601 date",
  "additional_context": "object"
}
```

## What Gets Logged

### Request Logging
Every incoming request logs:
```json
{
  "message": "HTTP Request",
  "method": "string",
  "path": "string",
  "ip": "string",
  "userAgent": "string",
  "timestamp": "ISO-8601 date"
}
```

### Business Events

#### Ticket Service
- Ticket creation attempts
- Successful ticket creation
- Zoho API interactions
```json
{
  "message": "Ticket created successfully",
  "contactId": "string",
  "ticketId": "string",
  "timestamp": "ISO-8601 date"
}
```

#### Authentication Service
- Login attempts
- Successful logins
- Token generation
```json
{
  "message": "User logged in successfully",
  "email": "string",
  "timestamp": "ISO-8601 date"
}
```

#### Payment Service
- Payment intent creation
- Webhook events
- Successful payments
```json
{
  "message": "Payment intent created",
  "amount": "number",
  "currency": "string",
  "paymentIntentId": "string",
  "timestamp": "ISO-8601 date"
}
```

### Error Logging
Errors include:
```json
{
  "level": "error",
  "message": "Error description",
  "stack": "error stack trace",
  "code": "error code",
  "timestamp": "ISO-8601 date"
}
```

## Log Storage
- Development: Console output
- Production: File system and/or external logging service

## Monitoring Recommendations
1. Set up log aggregation (e.g., ELK Stack, Splunk)
2. Create alerts for:
   - High error rates
   - Authentication failures
   - Payment failures
   - Rate limit breaches
3. Monitor response times and error rates
4. Track business metrics through logs

## Best Practices
1. Never log sensitive information (passwords, tokens)
2. Use appropriate log levels
3. Include relevant context in logs
4. Implement log rotation in production
5. Set up automated log analysis

## Example Log Queries

### Find Failed Login Attempts
```
level: error AND message: "Login failed"
```

### Track Payment Success Rate
```
message: "Payment intent created" OR message: "Payment succeeded"
```

### Monitor Rate Limiting
```
message: "Rate limit exceeded"
```

## Development vs Production
### Development
- Log Level: debug
- Output: Console
- Format: Detailed with colors

### Production
- Log Level: info
- Output: JSON files
- Format: JSON
- Rotation: Daily
- Retention: 30 days 