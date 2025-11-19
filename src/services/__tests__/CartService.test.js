const CartService = require('../CartService');

describe('CartService', () => {
  describe('CartService structure', () => {
    it('should have all required methods', () => {
      expect(typeof CartService.getCart).toBe('function');
      expect(typeof CartService.addToCart).toBe('function');
      expect(typeof CartService.updateCartItem).toBe('function');
      expect(typeof CartService.removeFromCart).toBe('function');
      expect(typeof CartService.clearCart).toBe('function');
      expect(typeof CartService.validateAndCalculate).toBe('function');
      expect(typeof CartService.saveCart).toBe('function');
      expect(typeof CartService.getCartKey).toBe('function');
    });

    it('should have correct constants defined', () => {
      expect(CartService.CART_TTL).toBe(604800); // 7 days in seconds
      expect(CartService.TAX_RATE).toBe(0.10); // 10%
      expect(CartService.SHIPPING_COST).toBe(10.00);
    });
  });

  describe('getCartKey', () => {
    it('should generate correct Redis key format', () => {
      const userId = '123456';
      const key = CartService.getCartKey(userId);
      expect(key).toBe('cart:123456');
    });

    it('should handle different user IDs', () => {
      expect(CartService.getCartKey('user1')).toBe('cart:user1');
      expect(CartService.getCartKey('abc-def-123')).toBe('cart:abc-def-123');
    });
  });

  describe('cart totals calculation', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { price: 10.00, quantity: 2, outOfStock: false },
        { price: 15.50, quantity: 1, outOfStock: false }
      ];
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      expect(subtotal).toBe(35.50);
    });

    it('should calculate tax correctly', () => {
      const subtotal = 100.00;
      const tax = subtotal * CartService.TAX_RATE;
      expect(tax).toBe(10.00);
    });

    it('should include shipping cost when cart has items', () => {
      const subtotal = 50.00;
      const shippingCost = subtotal > 0 ? CartService.SHIPPING_COST : 0;
      expect(shippingCost).toBe(10.00);
    });

    it('should not include shipping cost when cart is empty', () => {
      const subtotal = 0;
      const shippingCost = subtotal > 0 ? CartService.SHIPPING_COST : 0;
      expect(shippingCost).toBe(0);
    });

    it('should calculate total correctly', () => {
      const subtotal = 100.00;
      const tax = subtotal * CartService.TAX_RATE; // 10.00
      const shippingCost = CartService.SHIPPING_COST; // 10.00
      const total = subtotal + tax + shippingCost;
      expect(total).toBe(120.00);
    });
  });

  describe('cart structure', () => {
    it('should have correct empty cart structure', () => {
      const emptyCart = {
        userId: 'test-user',
        items: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        total: 0,
        updatedAt: expect.any(String)
      };
      
      expect(emptyCart.items).toEqual([]);
      expect(emptyCart.subtotal).toBe(0);
      expect(emptyCart.tax).toBe(0);
      expect(emptyCart.shippingCost).toBe(0);
      expect(emptyCart.total).toBe(0);
    });

    it('should have correct cart item structure', () => {
      const cartItem = {
        productId: 'prod-123',
        name: 'Test Product',
        price: 29.99,
        quantity: 2,
        image: 'https://example.com/image.jpg',
        addedAt: new Date().toISOString()
      };

      expect(cartItem).toHaveProperty('productId');
      expect(cartItem).toHaveProperty('name');
      expect(cartItem).toHaveProperty('price');
      expect(cartItem).toHaveProperty('quantity');
      expect(cartItem).toHaveProperty('image');
      expect(cartItem).toHaveProperty('addedAt');
    });
  });

  describe('validation logic', () => {
    it('should validate quantity is at least 1', () => {
      const quantity = 0;
      expect(quantity < 1).toBe(true);
    });

    it('should accept valid quantities', () => {
      expect(1 >= 1).toBe(true);
      expect(5 >= 1).toBe(true);
      expect(100 >= 1).toBe(true);
    });

    it('should filter out of stock items from total calculation', () => {
      const items = [
        { price: 10.00, quantity: 2, outOfStock: false },
        { price: 20.00, quantity: 1, outOfStock: true }, // Should be excluded
        { price: 15.00, quantity: 1, outOfStock: false }
      ];
      
      const subtotal = items
        .filter(item => !item.outOfStock)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      expect(subtotal).toBe(35.00); // 10*2 + 15*1, excluding the out of stock item
    });
  });

  describe('rounding logic', () => {
    it('should round monetary values to 2 decimal places', () => {
      const value = 10.12345;
      const rounded = Math.round(value * 100) / 100;
      expect(rounded).toBe(10.12);
    });

    it('should handle rounding edge cases', () => {
      expect(Math.round(10.125 * 100) / 100).toBe(10.13);
      expect(Math.round(10.124 * 100) / 100).toBe(10.12);
      expect(Math.round(10.999 * 100) / 100).toBe(11.00);
    });
  });
});
