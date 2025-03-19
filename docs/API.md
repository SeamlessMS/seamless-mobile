# API Documentation

## Ticket Management API (Port 3000)

### Submit Ticket
**Endpoint:** `POST /api/submit-ticket`
**Rate Limit:** 100 requests per 15 minutes

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "description": "string",
  "priority": "string (Low|Medium|High)",
  "category": "string"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Ticket submitted successfully",
  "ticketId": "string",
  "ticketNumber": "string"
}
```

**Error Responses:**
- 400 Bad Request: Missing required fields
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server error

## Authentication API (Port 3001)

### Login
**Endpoint:** `POST /api/auth/login`
**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response:**
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

**Error Responses:**
- 400 Bad Request: Invalid credentials
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server error

### Get Account Summary
**Endpoint:** `GET /api/auth/account`
**Authentication:** Required (JWT Token)

**Success Response:**
```json
{
  "success": true,
  "account": {
    "id": "string",
    "name": "string",
    "email": "string",
    "subscriptionStatus": "string",
    "createdAt": "date"
  }
}
```

**Error Responses:**
- 401 Unauthorized: Invalid or missing token
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server error

## Payment API (Port 3002)

### Create Payment Intent
**Endpoint:** `POST /api/payment/create-intent`
**Authentication:** Required (JWT Token)
**Rate Limit:** 10 requests per hour

**Request Body:**
```json
{
  "amount": "number",
  "currency": "string (default: usd)",
  "description": "string"
}
```

**Success Response:**
```json
{
  "clientSecret": "string",
  "publishableKey": "string"
}
```

**Error Responses:**
- 400 Bad Request: Invalid amount or currency
- 401 Unauthorized: Invalid or missing token
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server error

### Stripe Webhook
**Endpoint:** `POST /api/payment/webhook`
**Authentication:** Stripe Signature

**Success Response:**
```json
{
  "received": true
}
```

**Error Responses:**
- 400 Bad Request: Invalid signature
- 500 Internal Server Error: Server error

## Error Handling

All APIs use a standardized error response format:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

## Rate Limiting Headers

All responses include rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Authentication

Protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
``` 