const { test, expect } = require('@playwright/test');
const { loginAsCustomer } = require('../helpers/auth');
const { addToCart, goToCart, proceedToCheckout } = require('../helpers/cart');

test.describe('Complete Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('should complete full purchase flow from browse to order confirmation', async ({ page }) => {
    // Step 1: Browse products
    await page.goto('/');
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(4, { timeout: 10000 });

    // Step 2: View product details
    await page.click('text=Test Laptop');
    await expect(page).toHaveURL(/\/products\//);
    await expect(page.locator('h1')).toContainText('Test Laptop');
    await expect(page.locator('[data-testid="product-price"]')).toContainText('999.99');

    // Step 3: Add to cart
    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // Step 4: Add another product
    await page.goto('/');
    await page.click('text=Test Phone');
    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');

    // Step 5: View cart
    await goToCart(page);
    await expect(page).toHaveURL('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);

    // Verify cart items
    await expect(page.locator('text=Test Laptop')).toBeVisible();
    await expect(page.locator('text=Test Phone')).toBeVisible();

    // Verify cart total
    const cartTotal = await page.locator('[data-testid="cart-total"]').textContent();
    expect(parseFloat(cartTotal.replace(/[^0-9.]/g, ''))).toBeGreaterThan(1500);

    // Step 6: Proceed to checkout
    await proceedToCheckout(page);
    await expect(page).toHaveURL('/checkout');

    // Step 7: Fill shipping information (if not pre-filled)
    const addressLine1 = await page.locator('input[name="address.line1"]');
    if (await addressLine1.isVisible()) {
      await addressLine1.fill('123 Test Street');
      await page.fill('input[name="address.city"]', 'Test City');
      await page.fill('input[name="address.state"]', 'TS');
      await page.fill('input[name="address.postalCode"]', '12345');
      await page.fill('input[name="address.country"]', 'Test Country');
    }

    // Step 8: Enter payment information (Stripe test card)
    // Note: This requires Stripe Elements to be loaded
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    await stripeFrame.locator('input[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    await stripeFrame.locator('input[name="postal"]').fill('12345');

    // Step 9: Place order
    await page.click('button:has-text("Place Order")');

    // Step 10: Wait for order confirmation
    await expect(page).toHaveURL(/\/orders\//, { timeout: 30000 });
    await expect(page.locator('text=Order Confirmed')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();

    // Verify order details
    await expect(page.locator('text=Test Laptop')).toBeVisible();
    await expect(page.locator('text=Test Phone')).toBeVisible();

    // Step 11: Verify cart is cleared
    await page.goto('/cart');
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });

  test('should prevent checkout with out-of-stock items', async ({ page }) => {
    // Add out-of-stock product to cart
    await page.goto('/');
    await page.click('text=Test Headphones');
    
    // Verify out-of-stock message
    await expect(page.locator('text=Out of Stock')).toBeVisible();
    
    // Add to cart button should be disabled
    await expect(page.locator('button:has-text("Add to Cart")')).toBeDisabled();
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Add product to cart
    await page.goto('/');
    await page.click('text=Test Laptop');
    await page.click('button:has-text("Add to Cart")');

    // Go to checkout
    await goToCart(page);
    await proceedToCheckout(page);

    // Use Stripe test card that will be declined
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.locator('input[name="cardnumber"]').fill('4000000000000002'); // Declined card
    await stripeFrame.locator('input[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    await stripeFrame.locator('input[name="postal"]').fill('12345');

    // Attempt to place order
    await page.click('button:has-text("Place Order")');

    // Verify error message
    await expect(page.locator('.error-message, .alert-error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message, .alert-error')).toContainText(/payment.*failed/i);

    // Verify cart is preserved
    await page.goto('/cart');
    await expect(page.locator('text=Test Laptop')).toBeVisible();
  });

  test('should calculate correct totals with tax and shipping', async ({ page }) => {
    // Add product to cart
    await page.goto('/');
    await page.click('text=Test Keyboard');
    await page.click('button:has-text("Add to Cart")');

    // Go to checkout
    await goToCart(page);
    await proceedToCheckout(page);

    // Verify order summary
    const subtotal = await page.locator('[data-testid="subtotal"]').textContent();
    const tax = await page.locator('[data-testid="tax"]').textContent();
    const shipping = await page.locator('[data-testid="shipping"]').textContent();
    const total = await page.locator('[data-testid="total"]').textContent();

    const subtotalValue = parseFloat(subtotal.replace(/[^0-9.]/g, ''));
    const taxValue = parseFloat(tax.replace(/[^0-9.]/g, ''));
    const shippingValue = parseFloat(shipping.replace(/[^0-9.]/g, ''));
    const totalValue = parseFloat(total.replace(/[^0-9.]/g, ''));

    // Verify calculation
    expect(Math.abs(totalValue - (subtotalValue + taxValue + shippingValue))).toBeLessThan(0.01);
  });
});
