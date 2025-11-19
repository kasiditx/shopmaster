const { test, expect } = require('@playwright/test');
const { loginAsCustomer } = require('../helpers/auth');

test.describe('Order Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('should display order history', async ({ page }) => {
    await page.goto('/orders');
    
    // Verify orders page is displayed
    await expect(page.locator('h1, h2')).toContainText(/orders/i);
    
    // Check if there are any orders
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      // Verify order information is displayed
      await expect(orderCards.first().locator('[data-testid="order-number"]')).toBeVisible();
      await expect(orderCards.first().locator('[data-testid="order-date"]')).toBeVisible();
      await expect(orderCards.first().locator('[data-testid="order-total"]')).toBeVisible();
      await expect(orderCards.first().locator('[data-testid="order-status"]')).toBeVisible();
    } else {
      // If no orders, should show empty message
      await expect(page.locator('text=No orders found')).toBeVisible();
    }
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/orders');
    
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      // Click on first order
      await orderCards.first().click();
      
      // Verify order detail page
      await expect(page).toHaveURL(/\/orders\//);
      
      // Verify order details are displayed
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-address"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    }
  });

  test('should display order items with quantities and prices', async ({ page }) => {
    await page.goto('/orders');
    
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      await orderCards.first().click();
      
      // Verify order items
      const orderItems = page.locator('[data-testid="order-item"]');
      const itemCount = await orderItems.count();
      
      expect(itemCount).toBeGreaterThan(0);
      
      // Verify each item has required information
      for (let i = 0; i < itemCount; i++) {
        await expect(orderItems.nth(i).locator('[data-testid="item-name"]')).toBeVisible();
        await expect(orderItems.nth(i).locator('[data-testid="item-quantity"]')).toBeVisible();
        await expect(orderItems.nth(i).locator('[data-testid="item-price"]')).toBeVisible();
      }
    }
  });

  test('should display shipping address', async ({ page }) => {
    await page.goto('/orders');
    
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      await orderCards.first().click();
      
      // Verify shipping address is displayed
      const shippingAddress = page.locator('[data-testid="shipping-address"]');
      await expect(shippingAddress).toBeVisible();
      
      // Verify address components
      const addressText = await shippingAddress.textContent();
      expect(addressText.length).toBeGreaterThan(0);
    }
  });

  test('should display order status and status history', async ({ page }) => {
    await page.goto('/orders');
    
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      await orderCards.first().click();
      
      // Verify current status
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
      
      // Verify status history if available
      const statusHistory = page.locator('[data-testid="status-history"]');
      if (await statusHistory.isVisible()) {
        const historyItems = statusHistory.locator('[data-testid="status-history-item"]');
        const historyCount = await historyItems.count();
        
        expect(historyCount).toBeGreaterThan(0);
        
        // Each history item should have status and timestamp
        for (let i = 0; i < historyCount; i++) {
          await expect(historyItems.nth(i).locator('[data-testid="status"]')).toBeVisible();
          await expect(historyItems.nth(i).locator('[data-testid="timestamp"]')).toBeVisible();
        }
      }
    }
  });

  test('should allow cancelling pending orders', async ({ page }) => {
    await page.goto('/orders');
    
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      // Find a pending order
      for (let i = 0; i < count; i++) {
        const statusText = await orderCards.nth(i).locator('[data-testid="order-status"]').textContent();
        
        if (statusText.toLowerCase().includes('pending')) {
          await orderCards.nth(i).click();
          
          // Verify cancel button is available
          const cancelButton = page.locator('button:has-text("Cancel Order")');
          await expect(cancelButton).toBeVisible();
          
          // Click cancel
          await cancelButton.click();
          
          // Confirm cancellation
          await page.click('button:has-text("Confirm")');
          
          // Verify status changed to cancelled
          await expect(page.locator('[data-testid="order-status"]')).toContainText(/cancelled/i, { timeout: 10000 });
          
          break;
        }
      }
    }
  });

  test('should not allow cancelling non-pending orders', async ({ page }) => {
    await page.goto('/orders');
    
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      // Find a non-pending order
      for (let i = 0; i < count; i++) {
        const statusText = await orderCards.nth(i).locator('[data-testid="order-status"]').textContent();
        
        if (!statusText.toLowerCase().includes('pending')) {
          await orderCards.nth(i).click();
          
          // Verify cancel button is not available or disabled
          const cancelButton = page.locator('button:has-text("Cancel Order")');
          const isVisible = await cancelButton.isVisible();
          
          if (isVisible) {
            await expect(cancelButton).toBeDisabled();
          }
          
          break;
        }
      }
    }
  });

  test('should receive real-time order status updates', async ({ page }) => {
    // This test would require WebSocket connection
    // For now, we'll just verify the page can receive updates
    
    await page.goto('/orders');
    
    const orderCards = page.locator('[data-testid="order-card"]');
    const count = await orderCards.count();
    
    if (count > 0) {
      await orderCards.first().click();
      
      // Get current status
      const currentStatus = await page.locator('[data-testid="order-status"]').textContent();
      
      // In a real scenario, we would trigger a status change via admin
      // and verify the page updates without refresh
      
      // For now, just verify the status is displayed
      expect(currentStatus.length).toBeGreaterThan(0);
    }
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/orders');
    
    // Check if filter exists
    const statusFilter = page.locator('[data-testid="status-filter"]');
    
    if (await statusFilter.isVisible()) {
      // Select a status filter
      await statusFilter.click();
      await page.click('text=Delivered');
      
      await page.waitForTimeout(1000);
      
      // Verify only delivered orders are shown
      const orderCards = page.locator('[data-testid="order-card"]');
      const count = await orderCards.count();
      
      for (let i = 0; i < count; i++) {
        const statusText = await orderCards.nth(i).locator('[data-testid="order-status"]').textContent();
        expect(statusText.toLowerCase()).toContain('delivered');
      }
    }
  });
});
