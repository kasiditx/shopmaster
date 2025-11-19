const PaymentService = require('../PaymentService');
const { getStripeClient } = require('../../config/stripe');
const Order = require('../../models/Order');

// Mock Stripe
jest.mock('../../config/stripe');

// Mock Order model
jest.mock('../../models/Order');

describe('PaymentService', () => {
  let mockStripeClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock Stripe client
    mockStripeClient = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
      },
    };

    getStripeClient.mockReturnValue(mockStripeClient);
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      mockStripeClient.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await PaymentService.createPaymentIntent(100, 'usd', {
        orderId: 'order123',
      });

      expect(result).toEqual({
        clientSecret: 'pi_test123_secret',
        paymentIntentId: 'pi_test123',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      expect(mockStripeClient.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        metadata: { orderId: 'order123' },
        automatic_payment_methods: {
          enabled: true,
        },
      });
    });

    it('should throw error for invalid amount', async () => {
      await expect(PaymentService.createPaymentIntent(0)).rejects.toThrow(
        'Invalid amount: must be greater than 0'
      );

      await expect(PaymentService.createPaymentIntent(-10)).rejects.toThrow(
        'Invalid amount: must be greater than 0'
      );
    });

    it('should handle Stripe errors', async () => {
      const stripeError = new Error('Card declined');
      stripeError.type = 'StripeCardError';
      mockStripeClient.paymentIntents.create.mockRejectedValue(stripeError);

      await expect(PaymentService.createPaymentIntent(100)).rejects.toThrow(
        'Card error: Card declined'
      );
    });
  });

  describe('confirmPayment', () => {
    it('should return payment intent if already succeeded', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
      };

      mockStripeClient.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await PaymentService.confirmPayment('pi_test123');

      expect(result).toEqual({
        paymentIntentId: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
      });

      expect(mockStripeClient.paymentIntents.confirm).not.toHaveBeenCalled();
    });

    it('should confirm payment if requires confirmation', async () => {
      const mockRetrievedIntent = {
        id: 'pi_test123',
        status: 'requires_confirmation',
        amount: 10000,
        currency: 'usd',
      };

      const mockConfirmedIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
      };

      mockStripeClient.paymentIntents.retrieve.mockResolvedValue(mockRetrievedIntent);
      mockStripeClient.paymentIntents.confirm.mockResolvedValue(mockConfirmedIntent);

      const result = await PaymentService.confirmPayment('pi_test123');

      expect(result).toEqual({
        paymentIntentId: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
      });

      expect(mockStripeClient.paymentIntents.confirm).toHaveBeenCalledWith('pi_test123');
    });

    it('should throw error for missing payment intent ID', async () => {
      await expect(PaymentService.confirmPayment()).rejects.toThrow(
        'Payment intent ID is required'
      );
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-123',
        paymentIntentId: 'pi_test123',
        paymentStatus: 'pending',
        status: 'pending',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findOne = jest.fn().mockResolvedValue(mockOrder);

      const event = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            metadata: {},
          },
        },
      };

      const result = await PaymentService.handleWebhook(event);

      expect(result).toEqual({
        received: true,
        processed: true,
        orderId: 'order123',
        orderNumber: 'ORD-123',
      });

      expect(mockOrder.paymentStatus).toBe('completed');
      expect(mockOrder.status).toBe('paid');
      expect(mockOrder.statusHistory).toHaveLength(1);
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-123',
        paymentIntentId: 'pi_test123',
        paymentStatus: 'pending',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findOne = jest.fn().mockResolvedValue(mockOrder);

      const event = {
        id: 'evt_test123',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test123',
            last_payment_error: {
              message: 'Insufficient funds',
            },
          },
        },
      };

      const result = await PaymentService.handleWebhook(event);

      expect(result).toEqual({
        received: true,
        processed: true,
        orderId: 'order123',
        orderNumber: 'ORD-123',
      });

      expect(mockOrder.paymentStatus).toBe('failed');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should handle unhandled event types', async () => {
      const event = {
        id: 'evt_test123',
        type: 'customer.created',
        data: {
          object: {},
        },
      };

      const result = await PaymentService.handleWebhook(event);

      expect(result).toEqual({
        received: true,
        processed: false,
      });
    });

    it('should handle missing order gracefully', async () => {
      Order.findOne = jest.fn().mockResolvedValue(null);

      const event = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            metadata: {},
          },
        },
      };

      const result = await PaymentService.handleWebhook(event);

      expect(result).toEqual({
        received: true,
        processed: false,
        reason: 'Order not found',
      });
    });
  });

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent details', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        metadata: { orderId: 'order123' },
      };

      mockStripeClient.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await PaymentService.getPaymentIntent('pi_test123');

      expect(result).toEqual({
        paymentIntentId: 'pi_test123',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        metadata: { orderId: 'order123' },
      });
    });

    it('should throw error for missing payment intent ID', async () => {
      await expect(PaymentService.getPaymentIntent()).rejects.toThrow(
        'Payment intent ID is required'
      );
    });
  });
});
