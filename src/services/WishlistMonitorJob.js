const User = require('../models/User');
const Product = require('../models/Product');
const NotificationService = require('./NotificationService');

/**
 * WishlistMonitorJob - Background job for monitoring wishlist items
 * Monitors price changes and stock availability for products in user wishlists
 */
class WishlistMonitorJob {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    // Store previous product states to detect changes
    this.productStates = new Map();
  }

  /**
   * Start the monitoring job
   * @param {number} intervalMs - Interval in milliseconds (default: 5 minutes)
   */
  start(intervalMs = 5 * 60 * 1000) {
    if (this.isRunning) {
      console.log('WishlistMonitorJob: Already running');
      return;
    }

    console.log(`WishlistMonitorJob: Starting with interval ${intervalMs}ms`);
    this.isRunning = true;

    // Run immediately on start
    this.run().catch(error => {
      console.error('WishlistMonitorJob: Error during initial run:', error.message);
    });

    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.run().catch(error => {
        console.error('WishlistMonitorJob: Error during scheduled run:', error.message);
      });
    }, intervalMs);
  }

  /**
   * Stop the monitoring job
   */
  stop() {
    if (!this.isRunning) {
      console.log('WishlistMonitorJob: Not running');
      return;
    }

    console.log('WishlistMonitorJob: Stopping');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Run the monitoring job
   * Checks for price changes and stock availability
   */
  async run() {
    try {
      console.log('WishlistMonitorJob: Running check...');

      // Get all users with non-empty wishlists
      const users = await User.find({
        wishlist: { $exists: true, $ne: [] }
      })
        .select('_id email wishlist')
        .populate({
          path: 'wishlist',
          select: 'name price stock active'
        })
        .lean();

      if (!users || users.length === 0) {
        console.log('WishlistMonitorJob: No users with wishlists found');
        return;
      }

      console.log(`WishlistMonitorJob: Checking wishlists for ${users.length} users`);

      // Track notifications sent
      let priceChangeNotifications = 0;
      let stockAvailableNotifications = 0;

      // Check each user's wishlist
      for (const user of users) {
        if (!user.wishlist || user.wishlist.length === 0) {
          continue;
        }

        for (const product of user.wishlist) {
          // Skip inactive or null products
          if (!product || !product.active) {
            continue;
          }

          const productId = product._id.toString();
          const previousState = this.productStates.get(productId);

          // If we have previous state, check for changes
          if (previousState) {
            // Check for price decrease
            if (product.price < previousState.price) {
              try {
                await NotificationService.notifyPriceChange(
                  user._id.toString(),
                  user.email,
                  product,
                  previousState.price
                );
                priceChangeNotifications++;
                console.log(
                  `WishlistMonitorJob: Sent price change notification to user ${user._id} for product ${product.name}`
                );
              } catch (error) {
                console.error(
                  `WishlistMonitorJob: Failed to send price change notification:`,
                  error.message
                );
              }
            }

            // Check for stock availability (was out of stock, now in stock)
            if (previousState.stock === 0 && product.stock > 0) {
              try {
                await NotificationService.notifyStockAvailable(
                  user._id.toString(),
                  user.email,
                  product
                );
                stockAvailableNotifications++;
                console.log(
                  `WishlistMonitorJob: Sent stock available notification to user ${user._id} for product ${product.name}`
                );
              } catch (error) {
                console.error(
                  `WishlistMonitorJob: Failed to send stock available notification:`,
                  error.message
                );
              }
            }
          }

          // Update product state
          this.productStates.set(productId, {
            price: product.price,
            stock: product.stock,
            lastChecked: new Date()
          });
        }
      }

      console.log(
        `WishlistMonitorJob: Check complete. Sent ${priceChangeNotifications} price change and ${stockAvailableNotifications} stock available notifications`
      );
    } catch (error) {
      console.error('WishlistMonitorJob: Error during run:', error.message);
      throw error;
    }
  }

  /**
   * Get current job status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      trackedProducts: this.productStates.size,
      lastStates: Array.from(this.productStates.entries()).map(([productId, state]) => ({
        productId,
        ...state
      }))
    };
  }

  /**
   * Clear product states (useful for testing)
   */
  clearStates() {
    this.productStates.clear();
    console.log('WishlistMonitorJob: Cleared product states');
  }
}

// Export singleton instance
module.exports = new WishlistMonitorJob();
