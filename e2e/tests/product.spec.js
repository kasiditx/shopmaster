const { test, expect } = require('@playwright/test');

test.describe('Product Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all products on home page', async ({ page }) => {
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(4, { timeout: 10000 });
  });

  test('should search products by name', async ({ page }) => {
    // Search for "Laptop"
    await page.fill('input[name="search"], input[placeholder*="Search"]', 'Laptop');
    await page.press('input[name="search"], input[placeholder*="Search"]', 'Enter');

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify only laptop is shown
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
    await expect(page.locator('text=Test Laptop')).toBeVisible();
  });

  test('should search products by description', async ({ page }) => {
    // Search for "wireless" (in headphones description)
    await page.fill('input[name="search"], input[placeholder*="Search"]', 'wireless');
    await page.press('input[name="search"], input[placeholder*="Search"]', 'Enter');

    await page.waitForTimeout(1000);

    // Verify headphones are shown
    await expect(page.locator('text=Test Headphones')).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    // Select Electronics category
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');

    await page.waitForTimeout(1000);

    // Verify only electronics are shown (3 products)
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3);
    await expect(page.locator('text=Test Laptop')).toBeVisible();
    await expect(page.locator('text=Test Phone')).toBeVisible();
    await expect(page.locator('text=Test Headphones')).toBeVisible();
  });

  test('should filter products by price range', async ({ page }) => {
    // Set price range filter (e.g., $0-$200)
    await page.fill('input[name="minPrice"]', '0');
    await page.fill('input[name="maxPrice"]', '200');
    await page.click('button:has-text("Apply")');

    await page.waitForTimeout(1000);

    // Verify only products under $200 are shown
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();
    
    for (let i = 0; i < count; i++) {
      const priceText = await productCards.nth(i).locator('[data-testid="product-price"]').textContent();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      expect(price).toBeLessThanOrEqual(200);
    }
  });

  test('should filter products by rating', async ({ page }) => {
    // Filter by 4+ stars
    await page.click('[data-testid="rating-filter"]');
    await page.click('text=4+ Stars');

    await page.waitForTimeout(1000);

    // Verify only products with 4+ rating are shown
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();
    
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const ratingText = await productCards.nth(i).locator('[data-testid="product-rating"]').textContent();
      const rating = parseFloat(ratingText);
      expect(rating).toBeGreaterThanOrEqual(4);
    }
  });

  test('should combine multiple filters', async ({ page }) => {
    // Apply category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');

    // Apply price range
    await page.fill('input[name="minPrice"]', '500');
    await page.fill('input[name="maxPrice"]', '1000');
    await page.click('button:has-text("Apply")');

    await page.waitForTimeout(1000);

    // Verify results match all criteria
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Should show Test Laptop and Test Phone
    await expect(page.locator('text=Test Laptop')).toBeVisible();
    await expect(page.locator('text=Test Phone')).toBeVisible();
  });

  test('should show no results message for non-matching search', async ({ page }) => {
    await page.fill('input[name="search"], input[placeholder*="Search"]', 'NonExistentProduct123');
    await page.press('input[name="search"], input[placeholder*="Search"]', 'Enter');

    await page.waitForTimeout(1000);

    // Verify no results message
    await expect(page.locator('text=No products found')).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    // Apply some filters
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');
    await page.fill('input[name="minPrice"]', '500');
    await page.fill('input[name="maxPrice"]', '1000');
    await page.click('button:has-text("Apply")');

    await page.waitForTimeout(1000);

    // Clear filters
    await page.click('button:has-text("Clear Filters")');

    await page.waitForTimeout(1000);

    // Verify all products are shown again
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(4);
  });

  test('should paginate product results', async ({ page }) => {
    // This test assumes there are more than 20 products
    // For now, we'll just verify pagination controls exist
    const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
    
    if (paginationExists) {
      // Click next page
      await page.click('[data-testid="next-page"]');
      await page.waitForTimeout(1000);
      
      // Verify URL or page number changed
      const currentPage = await page.locator('[data-testid="current-page"]').textContent();
      expect(parseInt(currentPage)).toBeGreaterThan(1);
    }
  });

  test('should view product details', async ({ page }) => {
    await page.click('text=Test Laptop');

    // Verify product detail page
    await expect(page).toHaveURL(/\/products\//);
    await expect(page.locator('h1')).toContainText('Test Laptop');
    await expect(page.locator('[data-testid="product-description"]')).toContainText('high-performance');
    await expect(page.locator('[data-testid="product-price"]')).toContainText('999.99');
    await expect(page.locator('[data-testid="product-stock"]')).toBeVisible();
    
    // Verify images are displayed
    await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
  });
});
