const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`Socket.io: User ${socket.userId} connected`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket.io: User ${socket.userId} disconnected`);
    });

    // Handle product room subscriptions
    socket.on('subscribe:product', (productId) => {
      socket.join(`product:${productId}`);
      console.log(`Socket.io: User ${socket.userId} subscribed to product ${productId}`);
    });

    socket.on('unsubscribe:product', (productId) => {
      socket.leave(`product:${productId}`);
      console.log(`Socket.io: User ${socket.userId} unsubscribed from product ${productId}`);
    });
  });

  console.log('Socket.io: Server initialized');
  return io;
};

/**
 * Get Socket.io server instance
 * @returns {Server} Socket.io server
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket() first.');
  }
  return io;
};

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit event to specific product room
 * @param {string} productId - Product ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToProduct = (productId, event, data) => {
  if (io) {
    io.to(`product:${productId}`).emit(event, data);
  }
};

/**
 * Broadcast event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToProduct,
  broadcast
};
