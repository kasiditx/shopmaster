# Environment Configuration Guide

This document explains how to configure the ShopMaster E-commerce platform for different environments.

## Table of Contents

- [Overview](#overview)
- [Environment Files](#environment-files)
- [Configuration Variables](#configuration-variables)
- [Environment-Specific Setup](#environment-specific-setup)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses environment variables for configuration. Different environments (development, staging, production) have separate configuration files.

### Environment Files Structure

```
Backend:
├── .env.example          # Template with all variables
├── .env.development      # Development configuration
├── .env.staging          # Staging configuration
├── .env.production       # Production configuration
└── .env                  # Active configuration (gitignored)

Frontend (client/):
├── .env.example          # Template with all variables
├── .env.development      # Development configuration
├── .env.staging          # Staging configuration
├── .env.production       # Production configuration
└── .env                  # Active configuration (gitignored)
```

## Environment Files

### Backend Environment Variables

#### Server Configuration
- `NODE_ENV`: Environment name (development, staging, production)
- `PORT`: Server port number (default: 5000)
- `CLIENT_URL`: Allowed CORS origins (comma-separated)

#### Database Configuration
- `MONGO_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL

#### Authentication
- `JWT_SECRET`: Secret key for JWT access tokens
- `JWT_REFRESH_SECRET`: Secret key for JWT refresh tokens
- `JWT_EXPIRE`: Access token expiration time (e.g., 15m)
- `REFRESH_TOKEN_EXPIRE`: Refresh token expiration time (e.g., 7d)

#### Payment (Stripe)
- `STRIPE_SECRET_KEY`: Stripe secret key (sk_test_* or sk_live_*)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

#### Email (Nodemailer)
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP port (587 for TLS, 465 for SSL)
- `EMAIL_SECURE`: Use SSL/TLS (true/false)
- `EMAIL_USER`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `EMAIL_FROM`: From address for emails

#### Image Storage (Cloudinary)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

#### Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window
- `LOGIN_RATE_LIMIT`: Max login attempts per window

#### Error Tracking (Sentry)
- `SENTRY_DSN`: Sentry Data Source Name
- `SENTRY_ENVIRONMENT`: Environment name for Sentry
- `SENTRY_TRACES_SAMPLE_RATE`: Sampling rate for traces (0.0-1.0)

#### Performance Monitoring (Elastic APM)
- `ELASTIC_APM_SERVER_URL`: Elastic APM server URL (e.g., http://localhost:8200)
- `ELASTIC_APM_SERVICE_NAME`: Service name for APM (default: shopmaster-ecommerce)
- `ELASTIC_APM_SECRET_TOKEN`: Secret token for APM authentication
- `ELASTIC_APM_TRANSACTION_SAMPLE_RATE`: Transaction sampling rate (0.0-1.0)
- `ELASTIC_APM_LOG_LEVEL`: APM log level (trace, debug, info, warn, error, fatal)
- `ELASTIC_APM_ACTIVE`: Enable/disable APM (true/false)

#### Logging
- `LOG_LEVEL`: Logging level (error, warn, info, debug)
- `LOG_FILE_PATH`: Path for log files

#### Session
- `SESSION_SECRET`: Secret for session cookie signing
- `SESSION_EXPIRE_MS`: Session expiration in milliseconds

#### Application Settings
- `DEFAULT_PAGE_LIMIT`: Default pagination limit
- `MAX_FILE_SIZE`: Maximum file upload size in bytes
- `LOW_STOCK_THRESHOLD`: Threshold for low stock alerts
- `TAX_RATE`: Tax rate as decimal (e.g., 0.07 for 7%)
- `SHIPPING_COST`: Shipping cost in cents

#### Feature Flags
- `ENABLE_WISHLIST`: Enable wishlist feature (true/false)
- `ENABLE_REVIEWS`: Enable reviews feature (true/false)
- `ENABLE_NOTIFICATIONS`: Enable notifications (true/false)
- `ENABLE_ANALYTICS`: Enable analytics (true/false)

### Frontend Environment Variables

All frontend variables must be prefixed with `REACT_APP_`:

- `REACT_APP_API_URL`: Backend API base URL
- `REACT_APP_SOCKET_URL`: WebSocket server URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `REACT_APP_NAME`: Application name
- `REACT_APP_VERSION`: Application version
- `REACT_APP_ENV`: Environment name
- `REACT_APP_ENABLE_WISHLIST`: Enable wishlist feature
- `REACT_APP_ENABLE_REVIEWS`: Enable reviews feature
- `REACT_APP_ENABLE_NOTIFICATIONS`: Enable notifications
- `REACT_APP_GA_TRACKING_ID`: Google Analytics tracking ID
- `REACT_APP_CDN_URL`: CDN base URL
- `GENERATE_SOURCEMAP`: Generate source maps (true/false)
- `REACT_APP_ENABLE_PROFILING`: Enable React profiling

## Environment-Specific Setup

### Development Environment

1. **Copy example files:**
   ```bash
   # Backend
   cp .env.development .env
   
   # Frontend
   cp client/.env.development client/.env
   ```

2. **Update credentials:**
   - Use local MongoDB and Redis
   - Use Stripe test mode keys
   - Use Ethereal email for testing
   - Use development Cloudinary account

3. **Start services:**
   ```bash
   # Backend
   npm run dev
   
   # Frontend
   cd client && npm start
   ```

### Staging Environment

1. **Copy staging files:**
   ```bash
   # Backend
   cp .env.staging .env
   
   # Frontend
   cp client/.env.staging client/.env
   ```

2. **Update credentials:**
   - Use staging database (separate from production)
   - Use Stripe test mode keys
   - Use real email service (SendGrid, etc.)
   - Use staging Cloudinary account
   - Enable Sentry error tracking

3. **Deploy:**
   - Use CI/CD pipeline
   - Deploy to staging server
   - Run smoke tests

### Production Environment

1. **Copy production files:**
   ```bash
   # Backend
   cp .env.production .env
   
   # Frontend
   cp client/.env.production client/.env
   ```

2. **Update credentials:**
   - Use production database with authentication
   - Use Stripe LIVE mode keys
   - Use production email service
   - Use production Cloudinary account
   - Enable Sentry error tracking
   - Configure CDN

3. **Security checklist:**
   - [ ] Changed all default secrets
   - [ ] Using strong, random JWT secrets
   - [ ] Using Stripe LIVE mode
   - [ ] Enabled HTTPS/SSL
   - [ ] Configured proper CORS
   - [ ] Set up monitoring
   - [ ] Configured backups
   - [ ] Reviewed rate limiting
   - [ ] Set up log aggregation
   - [ ] Configured firewall

4. **Deploy:**
   - Use CI/CD pipeline
   - Deploy to production server
   - Monitor for errors

## Security Best Practices

### Secret Management

1. **Never commit secrets to version control:**
   - `.env` files are gitignored
   - Use `.env.example` as template only

2. **Generate strong secrets:**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Use different secrets per environment:**
   - Development secrets can be simple
   - Staging and production must use strong, unique secrets

4. **Use secret management services in production:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Secret Manager

### Environment Variable Injection

**Docker:**
```bash
docker run --env-file .env.production myapp
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  JWT_SECRET: <base64-encoded-value>
```

**AWS ECS:**
```json
{
  "secrets": [
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
    }
  ]
}
```

### CORS Configuration

**Development:**
```
CLIENT_URL=http://localhost:3000
```

**Production:**
```
CLIENT_URL=https://yourdomain.com,https://www.yourdomain.com
```

### Database Security

1. **Use authentication:**
   ```
   mongodb://username:password@host:port/database
   ```

2. **Use SSL/TLS:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?ssl=true
   ```

3. **Restrict network access:**
   - Use VPC/private networks
   - Configure firewall rules
   - Whitelist IP addresses

### API Keys

1. **Stripe:**
   - Use test keys (sk_test_*, pk_test_*) in development/staging
   - Use live keys (sk_live_*, pk_live_*) only in production
   - Rotate keys periodically

2. **Email:**
   - Use API keys instead of passwords
   - Rotate keys periodically
   - Monitor usage

3. **Cloudinary:**
   - Use separate accounts per environment
   - Restrict API permissions
   - Monitor usage

## Troubleshooting

### Environment Variables Not Loading

**Problem:** Variables are undefined in application

**Solutions:**
1. Check file name is exactly `.env`
2. Restart the application after changes
3. Verify variables are not commented out
4. Check for syntax errors (no spaces around =)

**Frontend specific:**
- Variables must start with `REACT_APP_`
- Rebuild required after changes: `npm run build`

### Database Connection Errors

**Problem:** Cannot connect to MongoDB/Redis

**Solutions:**
1. Verify connection string format
2. Check database is running
3. Verify network access/firewall rules
4. Check authentication credentials
5. Test connection:
   ```bash
   # MongoDB
   mongosh "mongodb://localhost:27017/shopmaster"
   
   # Redis
   redis-cli ping
   ```

### CORS Errors

**Problem:** Frontend cannot access backend API

**Solutions:**
1. Verify `CLIENT_URL` includes frontend URL
2. Check protocol (http vs https)
3. Check port numbers
4. Verify CORS middleware is configured
5. Check browser console for exact error

### Stripe Errors

**Problem:** Payment processing fails

**Solutions:**
1. Verify using correct key type (test vs live)
2. Check webhook secret matches Stripe dashboard
3. Verify webhook endpoint is accessible
4. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5000/api/payment/webhook
   ```

### Email Not Sending

**Problem:** Emails are not being sent

**Solutions:**
1. Verify SMTP credentials
2. Check email service is not blocking
3. Verify port and security settings
4. Test with Ethereal email (development)
5. Check email service logs

### Environment-Specific Issues

**Development:**
- Use `npm run dev` for hot reload
- Check console for errors
- Verify local services are running

**Staging:**
- Check deployment logs
- Verify environment variables are set
- Test with staging credentials

**Production:**
- Check application logs
- Verify all secrets are set
- Monitor error tracking (Sentry)
- Check health endpoints

## Additional Resources

- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Twelve-Factor App Config](https://12factor.net/config)
