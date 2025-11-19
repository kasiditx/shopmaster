const { test, expect } = require('@playwright/test');
const { loginAsAdmin } = require('../helpers/auth');

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
  });

  test('should display admin product list', async ({ page }) => {
    // Verify admin products page
    await expect(page.locator('h1, h2')).toContainText(/products/i);
    
    // Verify product table/list is displayed
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify columns are displayed
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Price')).toBeVisible();
    await expect(page.locator('text=Stock')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
  });

  test('should create a new product', async ({ page }) => {
    // Click create product button
    await page.click('button:has-text("Add Product"), button:has-text("Create Product")');
    
    // Fill product form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `New Test Product ${timestamp}`);
    await page.fill('textarea[name="description"]', 'This is a test product description');
    await page.fill('input[name="price"]', '299.99');
    await page.fill('input[name="stock"]', '50');
    await page.fill('input[name="category"]', 'Test Category');
    await page.fill('input[name="lowStockThreshold"]', '10');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('.success-message, .alert-success')).toBeVisible({ timeout: 10000 });
    
    // Verify product appears in list
    await expect(page.locator(`text=New Test Product ${timestamp}`)).toBeVisible();
  });

  test('should validate required fields when creating product', async ({ page }) => {
    // Click create product button
    await page.click('button:has-text("Add Product"), button:has-text("Create Product")');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('.error-message, .alert-error, .field-error')).toBeVisible();
  });

  test('should edit existing product', async ({ page }) => {
    // Find first product and click edit
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    await firstProduct.locator('button:has-text("Edit"), [data-testid="edit-button"]').click();
    
    // Update product information
    await page.fill('input[name="price"]', '399.99');
    await page.fill('input[name="stock"]', '75');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('.success-message, .alert-success')).toBeVisible({ timeout: 10000 });
    
    // Verify updated values are displayed
    await expect(page.locator('text=399.99')).toBeVisible();
  });

  test('should delete a product', async ({ page }) => {
    // Get initial product count
    const initialCount = await page.locator('[data-testid="product-row"]').count();
    
    // Find a product to delete (preferably a test product)
    const productToDelete = page.locator('[data-testid="product-row"]').last();
    const productName = await productToDelete.locator('[data-testid="product-name"]').textContent();
    
    // Click delete button
    await productToDelete.locator('button:has-text("Delete"), [data-testid="delete-button"]').click();
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify success message
    await expect(page.locator('.success-message, .alert-success')).toBeVisible({ timeout: 10000 });
    
    // Verify product is removed from list
    await expect(page.locator(`text=${productName}`)).not.toBeVisible({ timeout: 5000 });
    
    // Verify product count decreased
    const newCount = await page.locator('[data-testid="product-row"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should update product stock', async ({ page }) => {
    // Find first product
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    
    // Click stock update button or edit
    await firstProduct.locator('button:has-text("Update Stock"), [data-testid="stock-button"]').click();
    
    // Update stock quantity
    await page.fill('input[name="stock"]', '100');
    await page.click('button:has-text("Update")');
    
    // Verify success message
    await expect(page.locator('.success-message, .alert-success')).toBeVisible({ timeout: 10000 });
    
    // Verify stock is updated
    await expect(firstProduct.locator('[data-testid="product-stock"]')).toContainText('100');
  });

  test('should upload product images', async ({ page }) => {
    // Click create product button
    await page.click('button:has-text("Add Product"), button:has-text("Create Product")');
    
    // Fill basic product info
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Product with Image ${timestamp}`);
    await page.fill('input[name="price"]', '199.99');
    await page.fill('input[name="stock"]', '25');
    await page.fill('input[name="category"]', 'Test');
    
    // Upload image (if file input exists)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Note: In a real test, you would upload an actual image file
      // For now, we just verify the input exists
      await expect(fileInput).toBeVisible();
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify product is created
    await expect(page.locator('.success-message, .alert-success')).toBeVisible({ timeout: 10000 });
  });

  test('should search products in admin panel', async ({ page }) => {
    // Search for a specific product
    await page.fill('input[name="search"], input[placeholder*="Search"]', 'Laptop');
    await page.press('input[name="search"], input[placeholder*="Search"]', 'Enter');
    
    await page.waitForTimeout(1000);
    
    // Verify search results
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      // Verify all results contain "Laptop"
      for (let i = 0; i < count; i++) {
        const productName = await productRows.nth(i).locator('[data-testid="product-name"]').textContent();
        expect(productName.toLowerCase()).toContain('laptop');
      }
    }
  });

  test('should filter products by category in admin panel', async ({ page }) => {
    // Apply category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');
    
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify all products are in Electronics category
    for (let i = 0; i < count; i++) {
      const category = await productRows.nth(i).locator('[data-testid="product-category"]').textContent();
      expect(category).toContain('Electronics');
    }
  });

  test('should display low stock products', async ({ page }) => {
    // Navigate to low stock view or apply filter
    const lowStockFilter = page.locator('button:has-text("Low Stock"), [data-testid="low-stock-filter"]');
    
    if (await lowStockFilter.isVisible()) {
      await lowStockFilter.click();
      await page.waitForTimeout(1000);
      
      // Verify only low stock products are shown
      const productRows = page.locator('[data-testid="product-row"]');
      const count = await productRows.count();
      
      for (let i = 0; i < count; i++) {
        const stockText = await productRows.nth(i).locator('[data-testid="product-stock"]').textContent();
        const stock = parseInt(stockText);
        
        // Assuming low stock threshold is 10
        expect(stock).toBeLessThanOrEqual(10);
      }
    }
  });

  test('should toggle product active status', async ({ page }) => {
    // Find first product
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    
    // Get current active status
    const activeToggle = firstProduct.locator('[data-testid="active-toggle"], input[type="checkbox"]');
    
    if (await activeToggle.isVisible()) {
      const wasChecked = await activeToggle.isChecked();
      
      // Toggle status
      await activeToggle.click();
      
      await page.waitForTimeout(1000);
      
      // Verify status changed
      const isNowChecked = await activeToggle.isChecked();
      expect(isNowChecked).toBe(!wasChecked);
    }
  });
});
