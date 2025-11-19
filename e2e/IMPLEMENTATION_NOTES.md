# E2E Testing Implementation Notes

## Overview

This document provides implementation notes for the E2E testing setup using Playwright.

## What Was Implemented

### 1. Playwright Configuration
- **File**: `playwright.config.js`
- Configured for single-worker execution to avoid database conflicts
- Set up web servers for both backend (port 5000) and frontend (port 3000)
- Configured global setup/teardown for database management
- Enabled screenshots and videos on failure for debugging

### 2. Test Database Setup
- **File**: `e2e/setup/test-db.js`
- Automated database seeding with test data:
  - Admin user: `admin@test.com` / `admin123`
  - Customer user: `customer@test.com` / `customer123`
  - 4 sample products with varying stock levels
- Cleanup function to reset database after tests

### 3. Helper Functions
- **Authentication helpers** (`e2e/helpers/auth.js`):
  - `login()`, `loginAsAdmin()`, `loginAsCustomer()`
  - `register()`, `logout()`
  
- **Cart helpers** (`e2e/helpers/cart.js`):
  - `addToCart()`, `goToCart()`, `proceedToCheckout()`
  - `updateCartQuantity()`, `removeFromCart()`, `getCartTotal()`

### 4. Test Suites

#### Authentication Tests (`e2e/tests/auth.spec.js`)
- User registration with validation
- Login with valid/invalid credentials
- Logout functionality
- Protected route access
- Session persistence

#### Complete Purchase Flow (`e2e/tests/purchase.spec.js`)
- Full purchase journey from browse to confirmation
- Out-of-stock product handling
- Payment failure scenarios
- Cart preservation on errors
- Order total calculations

#### Product Search and Filtering (`e2e/tests/product.spec.js`)
- Product search by name and description
- Category filtering
- Price range filtering
- Rating filtering
- Combined filters
- Pagination
- Product detail view

#### Wishlist Management (`e2e/tests/wishlist.spec.js`)
- Add/remove products from wishlist
- Display current price and stock status
- Out-of-stock indicators
- Move items to cart
- Wishlist persistence

#### Order Tracking (`e2e/tests/order.spec.js`)
- View order history
- Order detail display
- Order status tracking
- Order cancellation (pending orders only)
- Status filtering
- Real-time updates

#### Admin Product Management (`e2e/tests/admin-product.spec.js`)
- Product CRUD operations
- Stock updates
- Image uploads
- Product search and filtering
- Low stock alerts
- Active/inactive toggle

#### Admin Order Management (`e2e/tests/admin-order.spec.js`)
- Order list display
- Order detail view
- Status updates
- Order filtering (status, date, customer)
- Order search
- Sales report generation

## Important Notes

### Data-testid Attributes Required

The tests rely on `data-testid` attributes for reliable element selection. The following attributes need to be added to the frontend components:

**Navigation/Header:**
- `data-testid="user-menu"` - User menu dropdown
- `data-testid="cart-icon"` - Cart icon
- `data-testid="cart-count"` - Cart item count badge
- `data-testid="logout-button"` - Logout button

**Product Components:**
- `data-testid="product-card"` - Product card container
- `data-testid="product-name"` - Product name
- `data-testid="product-price"` - Product price
- `data-testid="product-rating"` - Product rating
- `data-testid="product-stock"` - Stock status
- `data-testid="product-image"` - Product image
- `data-testid="product-description"` - Product description
- `data-testid="add-to-wishlist"` - Add to wishlist button

**Cart Components:**
- `data-testid="cart-item"` - Cart item row
- `data-testid="cart-total"` - Cart total amount
- `data-testid="subtotal"` - Subtotal
- `data-testid="tax"` - Tax amount
- `data-testid="shipping"` - Shipping cost
- `data-testid="total"` - Total amount

**Order Components:**
- `data-testid="order-card"` - Order card in list
- `data-testid="order-number"` - Order number
- `data-testid="order-date"` - Order date
- `data-testid="order-total"` - Order total
- `data-testid="order-status"` - Order status
- `data-testid="order-items"` - Order items list
- `data-testid="order-item"` - Individual order item
- `data-testid="shipping-address"` - Shipping address
- `data-testid="status-history"` - Status history section

**Wishlist Components:**
- `data-testid="wishlist-item"` - Wishlist item row
- `data-testid="wishlist-item-price"` - Item price
- `data-testid="wishlist-item-stock"` - Stock status
- `data-testid="remove-from-wishlist"` - Remove button
- `data-testid="move-to-cart"` - Move to cart button

**Admin Components:**
- `data-testid="product-row"` - Product row in admin table
- `data-testid="order-row"` - Order row in admin table
- `data-testid="edit-button"` - Edit button
- `data-testid="delete-button"` - Delete button
- `data-testid="stock-button"` - Stock update button
- `data-testid="status-dropdown"` - Status dropdown
- `data-testid="category-filter"` - Category filter
- `data-testid="status-filter"` - Status filter
- `data-testid="pagination"` - Pagination controls

### Environment Setup

Before running E2E tests:

1. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

2. **Ensure services are running:**
   - MongoDB on `localhost:27017`
   - Redis on `localhost:6379`

3. **Configure environment:**
   - Copy `.env.e2e` and update with actual test credentials
   - Use Stripe test mode keys
   - Configure test email service (Mailtrap recommended)

### Stripe Payment Testing

The tests use Stripe test cards:
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`

Ensure Stripe is configured in test mode with appropriate webhook endpoints.

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/tests/auth.spec.js

# Run in UI mode for debugging
npm run test:e2e:ui

# Run in debug mode with step-by-step execution
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### CI/CD Integration

For CI/CD pipelines:

1. Set `CI=true` environment variable
2. Install Playwright browsers: `npx playwright install --with-deps`
3. Ensure MongoDB and Redis are available (use Docker containers)
4. Set appropriate timeout values (tests may run slower in CI)
5. Store test artifacts (screenshots, videos) for failed tests

Example GitHub Actions workflow:
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Start MongoDB
  uses: supercharge/mongodb-github-action@1.8.0

- name: Start Redis
  uses: supercharge/redis-github-action@1.4.0

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Known Limitations

1. **WebSocket Testing**: Real-time notification tests are limited. They verify the UI can receive updates but don't fully test WebSocket connections.

2. **File Uploads**: Image upload tests verify the input exists but don't upload actual files. Add real file upload tests if needed.

3. **Email Verification**: Tests don't verify actual email delivery. Consider using a test email service like Mailtrap for full email testing.

4. **Payment Processing**: Tests use Stripe test mode. Real payment processing is not tested.

5. **Performance**: Tests are not optimized for speed. Consider parallelization if test suite grows large.

## Future Improvements

1. Add visual regression testing with Playwright's screenshot comparison
2. Implement API mocking for faster test execution
3. Add accessibility testing with axe-core
4. Create custom fixtures for common test scenarios
5. Add performance testing with Lighthouse
6. Implement test data factories for more flexible test data generation
7. Add mobile viewport testing
8. Create page object models for better test maintainability

## Troubleshooting

### Tests Fail to Start
- Ensure MongoDB and Redis are running
- Check that ports 3000 and 5000 are available
- Verify environment variables in `.env.e2e`

### Tests Timeout
- Increase timeout in `playwright.config.js`
- Check network connectivity
- Verify backend and frontend are starting correctly

### Element Not Found
- Add missing `data-testid` attributes to components
- Check if element is visible (not hidden by CSS)
- Wait for page load or network requests to complete

### Database Issues
- Ensure test database is separate from development database
- Check MongoDB connection string in `.env.e2e`
- Verify database cleanup is working correctly

## Maintenance

- Update test data when schema changes
- Add new tests for new features
- Keep helper functions DRY and reusable
- Review and update `data-testid` attributes regularly
- Monitor test execution time and optimize slow tests
