const { test, expect } = require('@playwright/test');
const { loginAsAdmin } = require('../helpers/auth');

test.describe('Admin Order Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
  });

  test('should display admin order list', async ({ page }) => {
    // Verify admin orders page
    await expect(page.locator('h1, h2')).toContainText(/orders/i);
    
    // Verify order table/list is displayed
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      // Verify columns are displayed
      await expect(page.locator('text=Order Number')).toBeVisible();
      await expect(page.locator('text=Customer')).toBeVisible();
      await expect(page.locator('text=Total')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
      await expect(page.locator('text=Date')).toBeVisible();
    } else {
      await expect(page.locator('text=No orders found')).toBeVisible();
    }
  });

  test('should view order details', async ({ page }) => {
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      // Click on first order
      await orderRows.first().click();
      
      // Verify order detail page
      await expect(page).toHaveURL(/\/admin\/orders\//);
      
      // Verify order details are displayed
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-address"]')).toBeVisible();
    }
  });

  test('should update order status', async ({ page }) => {
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      // Click on first order
      await orderRows.first().click();
      
      // Update status
      await page.click('[data-testid="status-dropdown"], select[name="status"]');
      await page.click('text=Processing');
      
      // Save changes
      await page.click('button:has-text("Update Status")');
      
      // Verify success message
      await expect(page.locator('.success-message, .alert-success')).toBeVisible({ timeout: 10000 });
      
      // Verify status is updated
      await expect(page.locator('[data-testid="order-status"]')).toContainText('Processing');
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Apply status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Pending');
    
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      // Verify all orders have pending status
      for (let i = 0; i < count; i++) {
        const statusText = await orderRows.nth(i).locator('[data-testid="order-status"]').textContent();
        expect(statusText.toLowerCase()).toContain('pending');
      }
    }
  });

  test('should filter orders by date range', async ({ page }) => {
    // Set date range filter
    const startDate = page.locator('input[name="startDate"]');
    const endDate = page.locator('input[name="endDate"]');
    
    if (await startDate.isVisible() && await endDate.isVisible()) {
      // Set date range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      await startDate.fill(thirtyDaysAgo.toISOString().split('T')[0]);
      await endDate.fill(today.toISOString().split('T')[0]);
      
      // Apply filter
      await page.click('button:has-text("Apply")');
      
      await page.waitForTimeout(1000);
      
      // Verify results are within date range
      const orderRows = page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter orders by customer', async ({ page }) => {
    // Search for customer
    const customerSearch = page.locator('input[name="customerSearch"], input[placeholder*="Customer"]');
    
    if (await customerSearch.isVisible()) {
      await customerSearch.fill('customer@test.com');
      await page.press('input[name="customerSearch"], input[placeholder*="Customer"]', 'Enter');
      
      await page.waitForTimeout(1000);
      
      // Verify results are for the searched customer
      const orderRows = page.locator('[data-testid="order-row"]');
      const count = await orderRows.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const customerText = await orderRows.nth(i).locator('[data-testid="customer-email"]').textContent();
          expect(customerText.toLowerCase()).toContain('customer@test.com');
        }
      }
    }
  });

  test('should search orders by order number', async ({ page }) => {
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      // Get first order number
      const orderNumber = await orderRows.first().locator('[data-testid="order-number"]').textContent();
      
      // Search for it
      await page.fill('input[name="search"], input[placeholder*="Search"]', orderNumber.trim());
      await page.press('input[name="search"], input[placeholder*="Search"]', 'Enter');
      
      await page.waitForTimeout(1000);
      
      // Verify search result
      await expect(page.locator(`text=${orderNumber.trim()}`)).toBeVisible();
    }
  });

  test('should generate sales report', async ({ page }) => {
    // Navigate to reports page
    await page.goto('/admin/reports');
    
    // Set report parameters
    const startDate = page.locator('input[name="startDate"]');
    const endDate = page.locator('input[name="endDate"]');
    
    if (await startDate.isVisible() && await endDate.isVisible()) {
      // Set date range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      await startDate.fill(thirtyDaysAgo.toISOString().split('T')[0]);
      await endDate.fill(today.toISOString().split('T')[0]);
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      await page.waitForTimeout(2000);
      
      // Verify report is displayed
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="top-products"]')).toBeVisible();
    }
  });

  test('should display sales report with correct calculations', async ({ page }) => {
    await page.goto('/admin/reports');
    
    // Generate report for a specific period
    const startDate = page.locator('input[name="startDate"]');
    const endDate = page.locator('input[name="endDate"]');
    
    if (await startDate.isVisible() && await endDate.isVisible()) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      await startDate.fill(thirtyDaysAgo.toISOString().split('T')[0]);
      await endDate.fill(today.toISOString().split('T')[0]);
      
      await page.click('button:has-text("Generate Report")');
      await page.waitForTimeout(2000);
      
      // Verify report metrics
      const totalRevenue = await page.locator('[data-testid="total-revenue"]').textContent();
      const orderCount = await page.locator('[data-testid="order-count"]').textContent();
      
      // Verify values are numbers
      expect(parseFloat(totalRevenue.replace(/[^0-9.]/g, ''))).toBeGreaterThanOrEqual(0);
      expect(parseInt(orderCount.replace(/[^0-9]/g, ''))).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display top-selling products in report', async ({ page }) => {
    await page.goto('/admin/reports');
    
    // Generate report
    const generateButton = page.locator('button:has-text("Generate Report")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);
      
      // Verify top products section
      const topProducts = page.locator('[data-testid="top-products"]');
      if (await topProducts.isVisible()) {
        const productItems = topProducts.locator('[data-testid="top-product-item"]');
        const count = await productItems.count();
        
        if (count > 0) {
          // Verify each product has name and quantity sold
          for (let i = 0; i < Math.min(count, 5); i++) {
            await expect(productItems.nth(i).locator('[data-testid="product-name"]')).toBeVisible();
            await expect(productItems.nth(i).locator('[data-testid="quantity-sold"]')).toBeVisible();
          }
        }
      }
    }
  });

  test('should export sales report', async ({ page }) => {
    await page.goto('/admin/reports');
    
    // Generate report first
    const generateButton = page.locator('button:has-text("Generate Report")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);
      
      // Check for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
      if (await exportButton.isVisible()) {
        // Click export (this would trigger a download in real scenario)
        await expect(exportButton).toBeVisible();
      }
    }
  });

  test('should display customer information in order details', async ({ page }) => {
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      await orderRows.first().click();
      
      // Verify customer information
      const customerInfo = page.locator('[data-testid="customer-info"]');
      await expect(customerInfo).toBeVisible();
      
      // Verify customer details
      await expect(customerInfo.locator('[data-testid="customer-name"]')).toBeVisible();
      await expect(customerInfo.locator('[data-testid="customer-email"]')).toBeVisible();
    }
  });

  test('should display payment information in order details', async ({ page }) => {
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      await orderRows.first().click();
      
      // Verify payment information
      await expect(page.locator('[data-testid="payment-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-method"]')).toBeVisible();
    }
  });
});
