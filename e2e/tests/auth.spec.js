const { test, expect } = require('@playwright/test');
const { register, login, logout } = require('../helpers/auth');

test.describe('User Registration and Login', () => {
  test('should register a new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const userData = {
      name: 'New Test User',
      email: `newuser${timestamp}@test.com`,
      password: 'password123',
    };

    await register(page, userData);

    // Verify user is logged in and redirected to home page
    await expect(page).toHaveURL('/');
    
    // Verify user name appears in navigation
    await expect(page.locator('[data-testid="user-menu"]')).toContainText(userData.name);
  });

  test('should not register with existing email', async ({ page }) => {
    const userData = {
      name: 'Duplicate User',
      email: 'customer@test.com', // Existing user
      password: 'password123',
    };

    await page.goto('/register');
    await page.fill('input[name="name"]', userData.name);
    await page.fill('input[name="email"]', userData.email);
    await page.fill('input[name="password"]', userData.password);
    await page.fill('input[name="confirmPassword"]', userData.password);
    await page.click('button[type="submit"]');

    // Verify error message is displayed
    await expect(page.locator('.error-message, .alert-error')).toBeVisible();
    await expect(page.locator('.error-message, .alert-error')).toContainText(/email.*already.*exists/i);
  });

  test('should login with valid credentials', async ({ page }) => {
    await login(page, 'customer@test.com', 'customer123');

    // Verify user is logged in
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should not login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verify error message is displayed
    await expect(page.locator('.error-message, .alert-error')).toBeVisible();
    await expect(page.locator('.error-message, .alert-error')).toContainText(/invalid.*credentials/i);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await login(page, 'customer@test.com', 'customer123');
    await expect(page).toHaveURL('/');

    // Logout
    await logout(page);

    // Verify user is logged out
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access orders page without login
    await page.goto('/orders');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session after page refresh', async ({ page }) => {
    await login(page, 'customer@test.com', 'customer123');
    await expect(page).toHaveURL('/');

    // Refresh page
    await page.reload();

    // Verify user is still logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
