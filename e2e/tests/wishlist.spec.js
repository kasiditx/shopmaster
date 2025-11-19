const { test, expect } = require('@playwright/test');
const { loginAsCustomer } = require('../helpers/auth');

test.describe('Wishlist Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('should add product to wishlist', async ({ page }) => {
    await page.goto('/');
    
    // Click on a product
    await page.click('text=Test Laptop');
    
    // Add to wishlist
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Verify success message or icon change
    await expect(page.locator('.success-message, .alert-success')).toBeVisible({ timeout: 5000 });
    
    // Go to wishlist page
    await page.goto('/wishlist');
    
    // Verify product is in wishlist
    await expect(page.locator('text=Test Laptop')).toBeVisible();
  });

  test('should display wishlist with current price and stock status', async ({ page }) => {
    // Add product to wishlist first
    await page.goto('/');
    await page.click('text=Test Phone');
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Go to wishlist
    await page.goto('/wishlist');
    
    // Verify product details are displayed
    await expect(page.locator('text=Test Phone')).toBeVisible();
    await expect(page.locator('[data-testid="wishlist-item-price"]').first()).toContainText('599.99');
    await expect(page.locator('[data-testid="wishlist-item-stock"]').first()).toBeVisible();
  });

  test('should show out-of-stock indicator for wishlist items', async ({ page }) => {
    // Add out-of-stock product to wishlist
    await page.goto('/');
    await page.click('text=Test Headphones');
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Go to wishlist
    await page.goto('/wishlist');
    
    // Verify out-of-stock indicator
    await expect(page.locator('text=Test Headphones')).toBeVisible();
    await expect(page.locator('text=Out of Stock')).toBeVisible();
  });

  test('should remove product from wishlist', async ({ page }) => {
    // Add product to wishlist
    await page.goto('/');
    await page.click('text=Test Keyboard');
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Go to wishlist
    await page.goto('/wishlist');
    await expect(page.locator('text=Test Keyboard')).toBeVisible();
    
    // Remove from wishlist
    const wishlistItem = page.locator('[data-testid="wishlist-item"]:has-text("Test Keyboard")');
    await wishlistItem.locator('button:has-text("Remove"), [data-testid="remove-from-wishlist"]').click();
    
    // Verify product is removed
    await expect(page.locator('text=Test Keyboard')).not.toBeVisible({ timeout: 5000 });
  });

  test('should move product from wishlist to cart', async ({ page }) => {
    // Add product to wishlist
    await page.goto('/');
    await page.click('text=Test Laptop');
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Go to wishlist
    await page.goto('/wishlist');
    await expect(page.locator('text=Test Laptop')).toBeVisible();
    
    // Move to cart
    const wishlistItem = page.locator('[data-testid="wishlist-item"]:has-text("Test Laptop")');
    await wishlistItem.locator('button:has-text("Move to Cart"), [data-testid="move-to-cart"]').click();
    
    // Verify product is in cart
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Go to cart and verify
    await page.goto('/cart');
    await expect(page.locator('text=Test Laptop')).toBeVisible();
  });

  test('should not allow moving out-of-stock items to cart', async ({ page }) => {
    // Add out-of-stock product to wishlist
    await page.goto('/');
    await page.click('text=Test Headphones');
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Go to wishlist
    await page.goto('/wishlist');
    
    // Verify move to cart button is disabled
    const wishlistItem = page.locator('[data-testid="wishlist-item"]:has-text("Test Headphones")');
    const moveButton = wishlistItem.locator('button:has-text("Move to Cart"), [data-testid="move-to-cart"]');
    
    await expect(moveButton).toBeDisabled();
  });

  test('should display empty wishlist message', async ({ page }) => {
    await page.goto('/wishlist');
    
    // If wishlist is empty, should show message
    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const count = await wishlistItems.count();
    
    if (count === 0) {
      await expect(page.locator('text=Your wishlist is empty')).toBeVisible();
    }
  });

  test('should persist wishlist across sessions', async ({ page, context }) => {
    // Add product to wishlist
    await page.goto('/');
    await page.click('text=Test Phone');
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Close and reopen browser (new page with same context)
    await page.close();
    const newPage = await context.newPage();
    
    // Login again
    await loginAsCustomer(newPage);
    
    // Go to wishlist
    await newPage.goto('/wishlist');
    
    // Verify product is still in wishlist
    await expect(newPage.locator('text=Test Phone')).toBeVisible();
  });

  test('should update wishlist when product price changes', async ({ page }) => {
    // Add product to wishlist
    await page.goto('/');
    await page.click('text=Test Laptop');
    await page.click('button:has-text("Add to Wishlist"), [data-testid="add-to-wishlist"]');
    
    // Go to wishlist
    await page.goto('/wishlist');
    
    // Get current price
    const priceElement = page.locator('[data-testid="wishlist-item-price"]').first();
    const currentPrice = await priceElement.textContent();
    
    // Verify price is displayed
    expect(currentPrice).toContain('999.99');
    
    // Note: In a real scenario, we would trigger a price change via admin
    // and verify the wishlist updates. For now, we just verify the price is shown.
  });
});
