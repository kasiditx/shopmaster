const fc = require('fast-check');

/**
 * Property-based testing utilities and generators
 * These arbitraries generate random test data for property-based tests
 */

/**
 * Generate random user data
 */
const userArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }),
  role: fc.constantFrom('customer', 'admin'),
  address: fc.record({
    line1: fc.string({ minLength: 1, maxLength: 100 }),
    line2: fc.option(fc.string({ maxLength: 100 })),
    city: fc.string({ minLength: 1, maxLength: 50 }),
    state: fc.string({ minLength: 1, maxLength: 50 }),
    postalCode: fc.string({ minLength: 5, maxLength: 10 }),
    country: fc.string({ minLength: 2, maxLength: 50 })
  })
});

/**
 * Generate random product data
 */
const productArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ minLength: 10, maxLength: 1000 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
  stock: fc.integer({ min: 0, max: 1000 }),
  category: fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports'),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  lowStockThreshold: fc.integer({ min: 5, max: 50 })
});

/**
 * Generate random cart item data
 */
const cartItemArbitrary = fc.record({
  productId: fc.stringMatching(/^[0-9a-f]{24}$/),
  name: fc.string({ minLength: 1, maxLength: 200 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
  quantity: fc.integer({ min: 1, max: 10 })
});

/**
 * Generate random order data
 */
const orderArbitrary = fc.record({
  orderNumber: fc.string({ minLength: 10, maxLength: 20 }),
  userId: fc.stringMatching(/^[0-9a-f]{24}$/),
  items: fc.array(cartItemArbitrary, { minLength: 1, maxLength: 10 }),
  status: fc.constantFrom('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
  shippingAddress: fc.record({
    line1: fc.string({ minLength: 1, maxLength: 100 }),
    line2: fc.option(fc.string({ maxLength: 100 })),
    city: fc.string({ minLength: 1, maxLength: 50 }),
    state: fc.string({ minLength: 1, maxLength: 50 }),
    postalCode: fc.string({ minLength: 5, maxLength: 10 }),
    country: fc.string({ minLength: 2, maxLength: 50 })
  })
});

/**
 * Generate random review data
 */
const reviewArbitrary = fc.record({
  productId: fc.stringMatching(/^[0-9a-f]{24}$/),
  userId: fc.stringMatching(/^[0-9a-f]{24}$/),
  orderId: fc.stringMatching(/^[0-9a-f]{24}$/),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 })
});

/**
 * Generate random search query
 */
const searchQueryArbitrary = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generate random filter criteria
 */
const filterCriteriaArbitrary = fc.record({
  category: fc.option(fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports')),
  minPrice: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(5000), noNaN: true })),
  maxPrice: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true })),
  minRating: fc.option(fc.integer({ min: 1, max: 5 }))
});

/**
 * Generate random pagination parameters
 */
const paginationArbitrary = fc.record({
  page: fc.integer({ min: 1, max: 100 }),
  limit: fc.integer({ min: 1, max: 100 })
});

/**
 * Generate valid MongoDB ObjectId string
 */
const objectIdArbitrary = fc.stringMatching(/^[0-9a-f]{24}$/);

/**
 * Generate random JWT payload
 */
const jwtPayloadArbitrary = fc.record({
  id: objectIdArbitrary,
  email: fc.emailAddress(),
  role: fc.constantFrom('customer', 'admin')
});

/**
 * Generate random price (positive number with 2 decimal places)
 */
const priceArbitrary = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
  .map(price => Math.round(price * 100) / 100);

/**
 * Generate random stock quantity
 */
const stockQuantityArbitrary = fc.integer({ min: 0, max: 1000 });

/**
 * Generate random email address
 */
const emailArbitrary = fc.emailAddress();

/**
 * Generate random password (at least 8 characters)
 */
const passwordArbitrary = fc.string({ minLength: 8, maxLength: 50 });

/**
 * Generate whitespace-only string (for testing invalid inputs)
 */
const whitespaceStringArbitrary = fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
  .map(arr => arr.join(''));

module.exports = {
  userArbitrary,
  productArbitrary,
  cartItemArbitrary,
  orderArbitrary,
  reviewArbitrary,
  searchQueryArbitrary,
  filterCriteriaArbitrary,
  paginationArbitrary,
  objectIdArbitrary,
  jwtPayloadArbitrary,
  priceArbitrary,
  stockQuantityArbitrary,
  emailArbitrary,
  passwordArbitrary,
  whitespaceStringArbitrary
};
