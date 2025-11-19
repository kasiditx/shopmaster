# Testing Guide

This document describes the testing infrastructure and practices for the E-commerce platform.

## Testing Stack

- **Jest**: Unit and integration testing framework
- **Supertest**: HTTP assertion library for API testing
- **fast-check**: Property-based testing library
- **Playwright**: End-to-end testing framework
- **MongoDB Memory Server**: In-memory MongoDB for testing (to be installed when needed)

## Running Tests

```bash
# Run unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run end-to-end tests
npm run test:e2e

# Run E2E tests in UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# View E2E test report
npm run test:e2e:report
```

## Test Structure

```
src/
├── __tests__/              # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── properties/        # Property-based tests
├── services/              # Business logic (to be tested)
├── controllers/           # API controllers (to be tested)
└── utils/
    └── testHelpers.js     # Property-based testing utilities
```

## Property-Based Testing

Property-based tests verify that certain properties hold true for all valid inputs. Each property test:

1. Generates random valid inputs using fast-check
2. Runs the test with at least 100 iterations
3. Is tagged with a comment referencing the design document property

### Example Property Test

```javascript
const fc = require('fast-check');
const { cartItemArbitrary } = require('../utils/testHelpers');

// Feature: ecommerce-platform, Property 5: Cart state consistency
test('cart total equals sum of item prices × quantities', () => {
  fc.assert(
    fc.property(
      fc.array(cartItemArbitrary),
      (items) => {
        const cart = { items };
        const calculatedTotal = calculateCartTotal(cart);
        const expectedTotal = items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0);
        return Math.abs(calculatedTotal - expectedTotal) < 0.01; // Account for floating point
      }
    ),
    { numRuns: 100 }
  );
});
```

## Test Data Generators

The `src/utils/testHelpers.js` file provides arbitraries (generators) for:

- Users
- Products
- Cart items
- Orders
- Reviews
- Search queries
- Filter criteria
- Pagination parameters

Use these generators in your property-based tests to ensure comprehensive coverage.

## Configuration

### Environment Variables

Test environment variables are set in `jest.setup.js`:

- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-key`
- `MONGODB_URI=mongodb://localhost:27017/ecommerce-test`
- `REDIS_URL=redis://localhost:6379`

### Coverage Thresholds

The project aims for 80% code coverage across:
- Branches
- Functions
- Lines
- Statements

Coverage configuration is in `jest.config.js`.

## Best Practices

1. **Write property tests for universal properties**: Use property-based testing for rules that should hold across all inputs
2. **Write unit tests for specific examples**: Use traditional unit tests for edge cases and specific scenarios
3. **Use descriptive test names**: Test names should clearly describe what is being tested
4. **Tag property tests**: Always include the property reference comment
5. **Clean up after tests**: Ensure tests don't leave side effects
6. **Mock external services**: Mock Stripe, email, and cloud storage in tests

## Integration Testing

Integration tests verify that components work together correctly:

- API endpoints with real database operations
- Service layer interactions
- Middleware chains

Use Supertest for API integration tests:

```javascript
const request = require('supertest');
const app = require('../app');

describe('POST /api/products', () => {
  it('should create a new product', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({
        name: 'Test Product',
        price: 99.99,
        stock: 10
      })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Product');
  });
});
```

## End-to-End Testing

End-to-end tests verify complete user flows using Playwright. These tests run against the full application stack (frontend + backend + database).

### E2E Test Setup

1. Install Playwright browsers:
```bash
npx playwright install
```

2. Ensure MongoDB and Redis are running locally

3. Configure environment variables in `.env.e2e`

### E2E Test Structure

E2E tests are located in the `e2e/` directory:
- `e2e/tests/` - Test files for critical user flows
- `e2e/helpers/` - Reusable helper functions
- `e2e/setup/` - Database setup and teardown

### Critical Flows Tested

1. **Authentication**: User registration, login, logout, session persistence
2. **Complete Purchase**: Browse → Add to cart → Checkout → Payment → Order confirmation
3. **Product Search and Filtering**: Search, category filters, price filters, rating filters
4. **Wishlist Management**: Add/remove items, move to cart, stock notifications
5. **Order Tracking**: View order history, order details, status updates, cancellation
6. **Admin Product Management**: Create, edit, delete products, stock updates
7. **Admin Order Management**: View orders, update status, filter, search, reports

### Best Practices for E2E Tests

- Use `data-testid` attributes for reliable element selection
- Wait for network responses instead of using hardcoded timeouts
- Keep tests independent - each test should work in isolation
- Use helper functions for common operations (login, add to cart, etc.)
- Clean up test data after each test run

## Continuous Integration

Tests should run automatically on:
- Every commit
- Pull requests
- Before deployment

Configure your CI/CD pipeline to run both unit tests and E2E tests:
```bash
npm test && npm run test:e2e
```

Fail the build if any tests don't pass.
