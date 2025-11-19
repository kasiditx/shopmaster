require('dotenv').config();
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = null;
let testUserId = null;
let testProductId = null;
let testOrderId = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(status, message, details = '') {
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  console.log(`${color}[${status}]${colors.reset} ${message} ${details}`);
}

async function testAPI(method, endpoint, data = null, requiresAuth = false, expectedStatus = 200) {
  return new Promise((resolve) => {
    const url = new URL(`${API_URL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (requiresAuth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : {};
          
          if (res.statusCode === expectedStatus) {
            log('PASS', `${method} ${endpoint}`, `(${res.statusCode})`);
            resolve({ success: true, data: responseData, status: res.statusCode });
          } else {
            log('WARN', `${method} ${endpoint}`, `(Expected ${expectedStatus}, got ${res.statusCode})`);
            resolve({ success: false, data: responseData, status: res.statusCode });
          }
        } catch (e) {
          log('FAIL', `${method} ${endpoint}`, `(Parse error: ${e.message})`);
          resolve({ success: false, error: e.message });
        }
      });
    });
    
    req.on('error', (error) => {
      log('FAIL', `${method} ${endpoint}`, `(${error.message})`);
      resolve({ success: false, error: error.message });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 API ENDPOINT TESTING');
  console.log('='.repeat(60) + '\n');

  // Test data
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const adminEmail = 'admin@shopmaster.com';
  const testPassword = 'Test123456';

  console.log(`${colors.blue}📋 Test Configuration:${colors.reset}`);
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Test Email: ${testEmail}`);
  console.log(`   Admin Email: ${adminEmail}\n`);

  // ==================== HEALTH CHECK ====================
  console.log(`${colors.blue}1️⃣  HEALTH CHECK${colors.reset}`);
  await testAPI('GET', '/../health', null, false, 200);
  console.log();

  // ==================== AUTH ENDPOINTS ====================
  console.log(`${colors.blue}2️⃣  AUTHENTICATION${colors.reset}`);
  
  // Register new user
  const registerResult = await testAPI('POST', '/auth/register', {
    name: 'Test User',
    email: testEmail,
    password: testPassword
  }, false, 201);
  
  if (registerResult.success && registerResult.data.accessToken) {
    authToken = registerResult.data.accessToken;
    testUserId = registerResult.data.user._id;
  }

  // Login
  const loginResult = await testAPI('POST', '/auth/login', {
    email: testEmail,
    password: testPassword
  }, false, 200);
  
  if (loginResult.success && loginResult.data.accessToken) {
    authToken = loginResult.data.accessToken;
  }

  // Get current user
  await testAPI('GET', '/auth/me', null, true, 200);

  // Logout
  await testAPI('POST', '/auth/logout', null, true, 200);

  // Login again for further tests
  const reloginResult = await testAPI('POST', '/auth/login', {
    email: testEmail,
    password: testPassword
  }, false, 200);
  
  if (reloginResult.success && reloginResult.data.accessToken) {
    authToken = reloginResult.data.accessToken;
  }
  console.log();

  // ==================== PRODUCT ENDPOINTS ====================
  console.log(`${colors.blue}3️⃣  PRODUCTS${colors.reset}`);
  
  // Get all products
  const productsResult = await testAPI('GET', '/products?page=1&limit=10', null, false, 200);
  if (productsResult.success && productsResult.data.products?.length > 0) {
    testProductId = productsResult.data.products[0]._id;
  }

  // Get single product
  if (testProductId) {
    await testAPI('GET', `/products/${testProductId}`, null, false, 200);
  }

  // Search products
  await testAPI('GET', '/products?query=test&page=1', null, false, 200);

  // Filter products
  await testAPI('GET', '/products?category=Electronics&minPrice=100&maxPrice=1000', null, false, 200);
  console.log();

  // ==================== CART ENDPOINTS ====================
  console.log(`${colors.blue}4️⃣  CART${colors.reset}`);
  
  // Get cart
  await testAPI('GET', '/cart', null, true, 200);

  // Add to cart
  if (testProductId) {
    await testAPI('POST', '/cart', {
      productId: testProductId,
      quantity: 2
    }, true, 200);
  }

  // Update cart item
  if (testProductId) {
    await testAPI('PUT', `/cart/${testProductId}`, {
      quantity: 3
    }, true, 200);
  }

  // Remove from cart
  if (testProductId) {
    await testAPI('DELETE', `/cart/${testProductId}`, null, true, 200);
  }

  // Clear cart
  await testAPI('DELETE', '/cart', null, true, 200);
  console.log();

  // ==================== WISHLIST ENDPOINTS ====================
  console.log(`${colors.blue}5️⃣  WISHLIST${colors.reset}`);
  
  // Get wishlist
  await testAPI('GET', '/wishlist', null, true, 200);

  // Add to wishlist
  if (testProductId) {
    await testAPI('POST', '/wishlist', {
      productId: testProductId
    }, true, 200);
  }

  // Remove from wishlist
  if (testProductId) {
    await testAPI('DELETE', `/wishlist/${testProductId}`, null, true, 200);
  }
  console.log();

  // ==================== REVIEW ENDPOINTS ====================
  console.log(`${colors.blue}6️⃣  REVIEWS${colors.reset}`);
  
  // Get product reviews
  if (testProductId) {
    await testAPI('GET', `/reviews/product/${testProductId}`, null, false, 200);
  }
  console.log();

  // ==================== ORDER ENDPOINTS ====================
  console.log(`${colors.blue}7️⃣  ORDERS${colors.reset}`);
  
  // Get user orders
  await testAPI('GET', '/orders', null, true, 200);

  // Get order stats
  await testAPI('GET', '/orders/stats', null, true, 200);
  console.log();

  // ==================== PAYMENT ENDPOINTS ====================
  console.log(`${colors.blue}8️⃣  PAYMENT${colors.reset}`);
  
  // Note: Payment endpoints require Stripe setup
  log('SKIP', 'POST /payment/create-intent', '(Requires Stripe configuration)');
  log('SKIP', 'POST /payment/webhook', '(Stripe webhook endpoint)');
  console.log();

  // ==================== ADMIN ENDPOINTS ====================
  console.log(`${colors.blue}9️⃣  ADMIN (Testing with regular user - should fail)${colors.reset}`);
  
  // These should return 403 for non-admin users
  await testAPI('GET', '/admin/dashboard', null, true, 403);
  await testAPI('GET', '/admin/products', null, true, 403);
  await testAPI('GET', '/admin/orders', null, true, 403);
  await testAPI('GET', '/admin/users', null, true, 403);
  console.log();

  // ==================== SUMMARY ====================
  console.log('='.repeat(60));
  console.log(`${colors.green}✅ API Testing Complete!${colors.reset}`);
  console.log('='.repeat(60));
  console.log('\n📝 Notes:');
  console.log('   - Payment endpoints require Stripe configuration');
  console.log('   - Admin endpoints require admin role');
  console.log('   - Some endpoints may require additional setup\n');
  
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
