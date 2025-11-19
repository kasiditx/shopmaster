import { io } from 'socket.io-client';
import { addNotification } from '../store/notificationSlice';

class SocketService {
  constructor() {
    this.socket = null;
    this.store = null;
  }

  /**
   * Initialize the WebSocket connection with JWT authentication
   * @param {Object} store - Redux store instance
   */
  connect(store) {
    this.store = store;
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found. WebSocket connection skipped.');
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for WebSocket events
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      // Only log non-authentication errors
      if (!error.message.includes('Authentication')) {
        console.error('WebSocket connection error:', error.message);
      }
    });

    // Notification events
    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });

    this.socket.on('order:status_changed', (data) => {
      this.handleOrderStatusChange(data);
    });

    this.socket.on('product:stock_updated', (data) => {
      this.handleStockUpdate(data);
    });

    this.socket.on('product:price_changed', (data) => {
      this.handlePriceChange(data);
    });

    this.socket.on('wishlist:stock_available', (data) => {
      this.handleWishlistStockAvailable(data);
    });

    this.socket.on('inventory:low_stock', (data) => {
      this.handleLowStockAlert(data);
    });
  }

  /**
   * Handle generic notification
   */
  handleNotification(data) {
    if (this.store) {
      this.store.dispatch(addNotification({
        type: 'info',
        title: data.title || 'Notification',
        message: data.message,
        data: data.data
      }));
    }
  }

  /**
   * Handle order status change notification
   */
  handleOrderStatusChange(data) {
    if (this.store) {
      this.store.dispatch(addNotification({
        type: 'success',
        title: 'Order Status Updated',
        message: `Your order #${data.orderNumber} is now ${data.status}`,
        data: {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          status: data.status
        }
      }));
    }
  }

  /**
   * Handle product stock update notification
   */
  handleStockUpdate(data) {
    if (this.store) {
      this.store.dispatch(addNotification({
        type: 'info',
        title: 'Stock Updated',
        message: `${data.productName} stock updated to ${data.stock}`,
        data: {
          productId: data.productId,
          stock: data.stock
        }
      }));
    }
  }

  /**
   * Handle product price change notification
   */
  handlePriceChange(data) {
    if (this.store) {
      this.store.dispatch(addNotification({
        type: 'success',
        title: 'Price Drop Alert!',
        message: `${data.productName} price reduced from $${data.oldPrice} to $${data.newPrice}`,
        data: {
          productId: data.productId,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice
        }
      }));
    }
  }

  /**
   * Handle wishlist item back in stock notification
   */
  handleWishlistStockAvailable(data) {
    if (this.store) {
      this.store.dispatch(addNotification({
        type: 'success',
        title: 'Back in Stock!',
        message: `${data.productName} is now available`,
        data: {
          productId: data.productId
        }
      }));
    }
  }

  /**
   * Handle low stock alert (admin only)
   */
  handleLowStockAlert(data) {
    if (this.store) {
      this.store.dispatch(addNotification({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${data.productName} stock is low (${data.stock} remaining)`,
        data: {
          productId: data.productId,
          stock: data.stock
        }
      }));
    }
  }

  /**
   * Subscribe to product updates
   * @param {string} productId - Product ID to subscribe to
   */
  subscribeToProduct(productId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe:product', { productId });
    }
  }

  /**
   * Unsubscribe from product updates
   * @param {string} productId - Product ID to unsubscribe from
   */
  unsubscribeFromProduct(productId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe:product', { productId });
    }
  }

  /**
   * Disconnect the WebSocket connection
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
