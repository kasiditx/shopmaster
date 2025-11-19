const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { sanitizeMongoInput, sanitizeXSS } = require('./middleware/sanitize');
const requestLogger = require('./middleware/requestLogger');
const {
  initSentry,
  getSentryRequestHandler,
  getSentryTracingHandler,
  getSentryErrorHandler,
} = require('./config/sentry');
const { apmMiddleware, apmResponseMiddleware } = require('./config/apm');

const app = express();

// Initialize Sentry (must be first)
initSentry(app);

// Sentry request handler (must be first middleware)
if (process.env.SENTRY_DSN) {
  app.use(getSentryRequestHandler());
  app.use(getSentryTracingHandler());
}

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// CORS configuration with whitelisted origins
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
  })
);

// Stripe webhook needs raw body for signature verification
// Apply raw body parser only for webhook endpoint
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Apply JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// APM middleware - add transaction metadata and track response times
app.use(apmMiddleware);
app.use(apmResponseMiddleware);

// Request logging middleware - logs all API requests
app.use(requestLogger);

// Security middleware - sanitize user input
app.use(sanitizeMongoInput); // Prevent NoSQL injection
app.use(sanitizeXSS); // Prevent XSS attacks

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use(notFound);

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(getSentryErrorHandler());
}

app.use(errorHandler);

module.exports = app;
