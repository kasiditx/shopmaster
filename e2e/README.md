# End-to-End Testing

This directory contains end-to-end tests for the E-commerce platform using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Ensure MongoDB and Redis are running locally

4. Set up environment variables in `.env.e2e`

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── tests/              # Test files
│   ├── auth.spec.js           # Authentication tests
│   ├── purchase.spec.js       # Complete purchase flow
│   ├── product.spec.js        # Product search and filtering
│   ├── wishlist.spec.js       # Wishlist management
│   ├── order.spec.js          # Order tracking
│   ├── admin-product.spec.js  # Admin product management
│   └── admin-order.spec.js    # Admin order management
├── helpers/            # Test helpers
│   ├── auth.js        # Authentication helpers
│   └── cart.js        # Cart helpers
├── setup/             # Test setup
│   └── test-db.js     # Database setup and teardown
├── global-setup.js    # Global setup (runs once before all tests)
└── global-teardown.js # Global teardown (runs once after all tests)
```

## Test Data

The test database is seeded with:
- Admin user: `admin@test.com` / `admin123`
- Customer user: `customer@test.com` / `customer123`
- Sample products in various categories
- Products with different stock levels (including out-of-stock items)

## Best Practices

1. **Use data-testid attributes**: Add `data-testid` attributes to important elements for reliable selection
2. **Wait for network**: Use `page.waitForResponse()` for API calls
3. **Avoid hardcoded waits**: Use `waitForSelector()` instead of `waitForTimeout()` when possible
4. **Clean state**: Each test should be independent and not rely on other tests
5. **Use helpers**: Reuse helper functions for common operations (login, add to cart, etc.)

## Debugging

- Use `--debug` flag to run tests in debug mode
- Use `page.pause()` to pause execution and inspect the page
- Check screenshots and videos in `test-results/` directory for failed tests
- Use `--ui` flag for interactive debugging

## CI/CD Integration

Tests run automatically in CI/CD pipeline. Configure the following:
- Set `CI=true` environment variable
- Ensure MongoDB and Redis are available
- Set appropriate timeout values for slower CI environments
