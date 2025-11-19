require('dotenv').config();

// Initialize APM first (must be before any other requires)
const { initializeAPM } = require('./src/config/apm');
initializeAPM();

const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { connectRedis, disconnectRedis } = require('./src/config/redis');
const { initializeSocket } = require('./src/config/socket');
const WishlistMonitorJob = require('./src/services/WishlistMonitorJob');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to databases
Promise.all([
  connectDB(),
  connectRedis()
])
  .then(() => {
    server.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
      console.log(`WebSocket server ready`);
      
      // Start wishlist monitoring job (check every 5 minutes)
      WishlistMonitorJob.start(5 * 60 * 1000);
      console.log('Wishlist monitoring job started');
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  WishlistMonitorJob.stop();
  await disconnectRedis();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  WishlistMonitorJob.stop();
  await disconnectRedis();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
