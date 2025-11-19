/**
 * Cart helpers for E2E tests
 */

/**
 * Add product to cart
 * @param {import('@playwright/test').Page} page
 * @param {string} productName
 */
async function addToCart(page, productName) {
  // Navigate to product or find it on the page
  await page.click(`text=${productName}`);
  await page.click('button:has-text("Add to Cart")');
  
  // Wait for cart update
  await page.waitForTimeout(1000);
}

/**
 * Go to cart page
 * @param {import('@playwright/test').Page} page
 */
async function goToCart(page) {
  await page.click('[data-testid="cart-icon"]');
  await page.waitForURL('/cart', { timeout: 5000 });
}

/**
 * Update cart item quantity
 * @param {import('@playwright/test').Page} page
 * @param {string} productName
 * @param {number} quantity
 */
async function updateCartQuantity(page, productName, quantity) {
  const itemRow = page.locator(`[data-testid="cart-item"]:has-text("${productName}")`);
  await itemRow.locator('input[type="number"]').fill(quantity.toString());
  await page.waitForTimeout(1000);
}

/**
 * Remove item from cart
 * @param {import('@playwright/test').Page} page
 * @param {string} productName
 */
async function removeFromCart(page, productName) {
  const itemRow = page.locator(`[data-testid="cart-item"]:has-text("${productName}")`);
  await itemRow.locator('button:has-text("Remove")').click();
  await page.waitForTimeout(1000);
}

/**
 * Get cart total
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<number>}
 */
async function getCartTotal(page) {
  const totalText = await page.locator('[data-testid="cart-total"]').textContent();
  return parseFloat(totalText.replace(/[^0-9.]/g, ''));
}

/**
 * Proceed to checkout
 * @param {import('@playwright/test').Page} page
 */
async function proceedToCheckout(page) {
  await page.click('button:has-text("Proceed to Checkout")');
  await page.waitForURL('/checkout', { timeout: 5000 });
}

module.exports = {
  addToCart,
  goToCart,
  updateCartQuantity,
  removeFromCart,
  getCartTotal,
  proceedToCheckout,
};
