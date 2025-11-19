const { setupTestDatabase } = require('./setup/test-db');

/**
 * Global setup runs once before all tests
 */
async function globalSetup() {
  console.log('Setting up E2E test database...');
  
  try {
    await setupTestDatabase();
    console.log('E2E test database setup complete');
  } catch (error) {
    console.error('Failed to setup E2E test database:', error);
    throw error;
  }
}

module.exports = globalSetup;
