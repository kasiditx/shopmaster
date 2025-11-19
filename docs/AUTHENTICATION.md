# Authentication System

## Overview

The authentication system uses JWT (JSON Web Tokens) with a dual-token approach:
- **Access Token**: Short-lived (15 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

## Features

### 1. JWT Refresh Tokens
- Access tokens expire in 15 minutes for security
- Refresh tokens expire in 7 days
- Refresh tokens are stored in httpOnly cookies (secure, not accessible via JavaScript)
- Token rotation: New refresh token issued on each refresh

### 2. Rate Limiting
- Login attempts: 5 per 15 minutes per IP (dual layer: express-rate-limit + Redis)
- Registration: 3 per hour per IP
- General API: 100 requests per 15 minutes per IP

### 3. Secure Storage
- Passwords hashed with bcrypt (10 salt rounds)
- Refresh tokens stored in Redis with TTL
- httpOnly cookies prevent XSS attacks

## API Endpoints

### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "accessToken": "eyJhbGc..."
}
```

**Cookies Set:**
- `refreshToken`: httpOnly, secure (in production), sameSite: strict

### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "accessToken": "eyJhbGc..."
}
```

**Rate Limiting:**
- 5 attempts per 15 minutes per IP
- Returns 429 status code when limit exceeded

### POST /api/auth/refresh-token
Refresh access token using refresh token from cookie.

**Request:**
No body required. Refresh token is read from httpOnly cookie.

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc..."
}
```

**Notes:**
- New refresh token is issued and set in cookie (token rotation)
- Old refresh token is invalidated

### POST /api/auth/logout
Logout user by invalidating refresh token.

**Request:**
Requires valid access token in Authorization header.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Notes:**
- Refresh token is deleted from Redis
- Refresh token cookie is cleared

### GET /api/auth/me
Get current user information.

**Request:**
Requires valid access token in Authorization header.

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

## Client Implementation

### Initial Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: Include cookies
  body: JSON.stringify({ email, password })
});

const { accessToken, user } = await response.json();
// Store accessToken in memory (not localStorage for security)
```

### Making Authenticated Requests
```javascript
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include' // Include cookies for refresh token
});
```

### Handling Token Expiration
```javascript
async function fetchWithAuth(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    },
    credentials: 'include'
  });

  // If access token expired, refresh it
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshResponse.ok) {
      const { accessToken: newToken } = await refreshResponse.json();
      accessToken = newToken;

      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        },
        credentials: 'include'
      });
    } else {
      // Refresh token expired, redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

### Logout
```javascript
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include'
});

// Clear access token from memory
accessToken = null;
```

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Redis (required for refresh tokens and rate limiting)
REDIS_URL=redis://localhost:6379
```

## Security Considerations

1. **Access Token Storage**: Store in memory, not localStorage (prevents XSS attacks)
2. **Refresh Token Storage**: httpOnly cookies (prevents XSS attacks)
3. **HTTPS**: Always use HTTPS in production (secure cookies)
4. **CORS**: Configure CORS to allow credentials from trusted origins only
5. **Rate Limiting**: Prevents brute force attacks
6. **Token Rotation**: New refresh token on each refresh (prevents token reuse)

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | MISSING_REQUIRED_FIELD | Required field missing in request |
| 400 | INVALID_INPUT | Invalid input data (e.g., email already registered) |
| 401 | INVALID_CREDENTIALS | Wrong email or password |
| 401 | TOKEN_INVALID | Invalid or missing token |
| 401 | TOKEN_EXPIRED | Access token expired (refresh needed) |
| 403 | INSUFFICIENT_PERMISSIONS | User doesn't have required permissions |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests, try again later |

## Testing

Run authentication tests:
```bash
npm test -- AuthService.test.js
```

All tests include:
- Token generation and verification
- User registration and login
- Rate limiting
- Token refresh
- Logout functionality
