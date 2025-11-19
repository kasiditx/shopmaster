/**
 * Sentry Configuration for Error Tracking
 * Validates: Requirements 12.4
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry for error tracking
 * Only enabled in production or when SENTRY_DSN is provided
 */
const initSentry = (app) => {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    console.log('Sentry DSN not provided, error tracking disabled');
    return;
  }

  // Initialize Sentry
  Sentry.init({
    dsn: sentryDsn,
    environment,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, you may want to lower this to reduce costs
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Set profilesSampleRate to 1.0 to profile 100% of sampled transactions
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      
      // Enable profiling
      new ProfilingIntegration(),
    ],
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Remove sensitive data from context
      if (event.contexts?.user) {
        delete event.contexts.user.password;
        delete event.contexts.user.passwordHash;
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Ignore common bot/crawler errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Ignore network errors
      'NetworkError',
      'Network request failed',
    ],
  });

  console.log(`Sentry initialized for ${environment} environment`);
};

/**
 * Get Sentry request handler middleware
 * Must be the first middleware
 */
const getSentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

/**
 * Get Sentry tracing handler middleware
 * Should be after request handler
 */
const getSentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

/**
 * Get Sentry error handler middleware
 * Must be before other error handlers
 */
const getSentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      if (error.statusCode >= 500) {
        return true;
      }
      // Also capture specific error types
      if (error.name === 'UnhandledPromiseRejectionWarning') {
        return true;
      }
      return false;
    },
  });
};

/**
 * Manually capture an exception
 */
const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Manually capture a message
 */
const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Set user context for error tracking
 */
const setUser = (user) => {
  if (user) {
    Sentry.setUser({
      id: user._id?.toString() || user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Add breadcrumb for debugging
 */
const addBreadcrumb = (breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

module.exports = {
  initSentry,
  getSentryRequestHandler,
  getSentryTracingHandler,
  getSentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  Sentry,
};
