const { cleanupTestDatabase } = require('./setup/test-db');

/**
 * Global teardown runs once after all tests
 */
async function globalTeardown() {
  console.log('Cleaning up E2E test database...');
  
  try {
    await cleanupTestDatabase();
    console.log('E2E test database cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup E2E test database:', error);
    // Don't throw - allow tests to complete even if cleanup fails
  }
}

module.exports = globalTeardown;
