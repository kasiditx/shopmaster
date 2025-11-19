const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');
const Review = require('../../src/models/Review');

/**
 * Setup test database with seed data
 */
async function setupTestDatabase() {
  const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/ecommerce-e2e-test';
  
  // Connect to test database
  await mongoose.connect(testDbUri);
  
  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);
  
  // Create test admin user
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: '$2a$10$YourHashedPasswordHere', // bcrypt hash of 'admin123'
    role: 'admin',
  });
  
  // Create test customer user
  const customerUser = await User.create({
    name: 'Test Customer',
    email: 'customer@test.com',
    password: '$2a$10$YourHashedPasswordHere', // bcrypt hash of 'customer123'
    role: 'customer',
    address: {
      line1: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'Test Country',
    },
  });
  
  // Create test products
  const products = await Product.insertMany([
    {
      name: 'Test Laptop',
      description: 'A high-performance laptop for testing',
      price: 999.99,
      stock: 10,
      category: 'Electronics',
      images: ['https://via.placeholder.com/300'],
      active: true,
      averageRating: 4.5,
      reviewCount: 2,
      lowStockThreshold: 5,
    },
    {
      name: 'Test Phone',
      description: 'A smartphone for testing',
      price: 599.99,
      stock: 15,
      category: 'Electronics',
      images: ['https://via.placeholder.com/300'],
      active: true,
      averageRating: 4.0,
      reviewCount: 1,
      lowStockThreshold: 5,
    },
    {
      name: 'Test Headphones',
      description: 'Wireless headphones for testing',
      price: 149.99,
      stock: 0, // Out of stock for testing
      category: 'Electronics',
      images: ['https://via.placeholder.com/300'],
      active: true,
      averageRating: 0,
      reviewCount: 0,
      lowStockThreshold: 5,
    },
    {
      name: 'Test Keyboard',
      description: 'Mechanical keyboard for testing',
      price: 79.99,
      stock: 20,
      category: 'Accessories',
      images: ['https://via.placeholder.com/300'],
      active: true,
      averageRating: 5.0,
      reviewCount: 3,
      lowStockThreshold: 5,
    },
  ]);
  
  return {
    adminUser,
    customerUser,
    products,
  };
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);
  
  await mongoose.connection.close();
}

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
};
