/**
 * Authentication helpers for E2E tests
 */

/**
 * Login as a user and store authentication state
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function login(page, email, password) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Login as admin user
 * @param {import('@playwright/test').Page} page
 */
async function loginAsAdmin(page) {
  await login(page, 'admin@test.com', 'admin123');
}

/**
 * Login as customer user
 * @param {import('@playwright/test').Page} page
 */
async function loginAsCustomer(page) {
  await login(page, 'customer@test.com', 'customer123');
}

/**
 * Register a new user
 * @param {import('@playwright/test').Page} page
 * @param {Object} userData
 */
async function register(page, userData) {
  await page.goto('/register');
  await page.fill('input[name="name"]', userData.name);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.fill('input[name="confirmPassword"]', userData.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after registration
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Logout current user
 * @param {import('@playwright/test').Page} page
 */
async function logout(page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login', { timeout: 5000 });
}

module.exports = {
  login,
  loginAsAdmin,
  loginAsCustomer,
  register,
  logout,
};
