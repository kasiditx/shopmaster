const ReviewService = require('../ReviewService');
const Review = require('../../models/Review');
const Product = require('../../models/Product');
const Order = require('../../models/Order');

jest.mock('../../models/Review');
jest.mock('../../models/Product');
jest.mock('../../models/Order');

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canUserReview', () => {
    it('should return true if user has purchased the product and not reviewed it', async () => {
      const mockOrder = { _id: 'order123', user: 'user123', items: [{ product: 'product123' }] };
      Order.findOne.mockResolvedValue(mockOrder);
      Review.findOne.mockResolvedValue(null);

      const result = await ReviewService.canUserReview('user123', 'product123');

      expect(result).toEqual({ canReview: true, orderId: 'order123' });
      expect(Order.findOne).toHaveBeenCalledWith({
        user: 'user123',
        'items.product': 'product123',
        status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
      });
    });

    it('should return false if user has not purchased the product', async () => {
      Order.findOne.mockResolvedValue(null);

      const result = await ReviewService.canUserReview('user123', 'product123');

      expect(result).toEqual({ canReview: false, orderId: null });
    });

    it('should return false if user has already reviewed the product', async () => {
      const mockOrder = { _id: 'order123' };
      const mockReview = { _id: 'review123' };
      Order.findOne.mockResolvedValue(mockOrder);
      Review.findOne.mockResolvedValue(mockReview);

      const result = await ReviewService.canUserReview('user123', 'product123');

      expect(result).toEqual({ canReview: false, orderId: 'order123', alreadyReviewed: true });
    });
  });

  describe('createReview', () => {
    it('should create a review for a purchased product', async () => {
      const mockOrder = { _id: 'order123' };
      const mockProduct = { _id: 'product123', name: 'Test Product' };
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        product: 'product123',
        rating: 5,
        comment: 'Great product!',
        populate: jest.fn().mockResolvedValue({
          _id: 'review123',
          user: { _id: 'user123', name: 'Test User' },
          product: 'product123',
          rating: 5,
          comment: 'Great product!'
        })
      };

      Order.findOne.mockResolvedValue(mockOrder);
      Review.findOne.mockResolvedValue(null);
      Product.findById.mockResolvedValue(mockProduct);
      Review.create.mockResolvedValue(mockReview);
      
      // Mock updateProductRating
      Review.aggregate.mockResolvedValue([{ averageRating: 5, reviewCount: 1 }]);
      Product.findByIdAndUpdate.mockResolvedValue(mockProduct);

      const result = await ReviewService.createReview('user123', 'product123', 5, 'Great product!');

      expect(Review.create).toHaveBeenCalledWith({
        user: 'user123',
        product: 'product123',
        order: 'order123',
        rating: 5,
        comment: 'Great product!',
        verified: true
      });
      expect(result.rating).toBe(5);
    });

    it('should throw error if rating is invalid', async () => {
      await expect(
        ReviewService.createReview('user123', 'product123', 6, 'Test')
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should throw error if user has already reviewed the product', async () => {
      const mockOrder = { _id: 'order123' };
      const mockReview = { _id: 'review123' };
      Order.findOne.mockResolvedValue(mockOrder);
      Review.findOne.mockResolvedValue(mockReview);

      await expect(
        ReviewService.createReview('user123', 'product123', 5, 'Test')
      ).rejects.toThrow('You have already reviewed this product');
    });

    it('should throw error if user has not purchased the product', async () => {
      Order.findOne.mockResolvedValue(null);

      await expect(
        ReviewService.createReview('user123', 'product123', 5, 'Test')
      ).rejects.toThrow('You can only review products you have purchased');
    });

    it('should throw error if product does not exist', async () => {
      const mockOrder = { _id: 'order123' };
      Order.findOne.mockResolvedValue(mockOrder);
      Review.findOne.mockResolvedValue(null);
      Product.findById.mockResolvedValue(null);

      await expect(
        ReviewService.createReview('user123', 'product123', 5, 'Test')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('getProductReviews', () => {
    it('should return reviews for a product with pagination', async () => {
      const mockProduct = { _id: 'product123' };
      const mockReviews = [
        { _id: 'review1', rating: 5, comment: 'Great!' },
        { _id: 'review2', rating: 4, comment: 'Good' }
      ];

      Product.findById.mockResolvedValue(mockProduct);
      
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReviews)
      };

      Review.find.mockReturnValue(mockFind);
      Review.countDocuments.mockResolvedValue(2);

      const result = await ReviewService.getProductReviews('product123', { page: 1, limit: 10 });

      expect(result.reviews).toEqual(mockReviews);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should throw error if product does not exist', async () => {
      Product.findById.mockResolvedValue(null);

      await expect(
        ReviewService.getProductReviews('product123')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        product: 'product123',
        rating: 4,
        comment: 'Good',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'review123',
          user: { _id: 'user123', name: 'Test User' },
          rating: 5,
          comment: 'Excellent!'
        })
      };

      Review.findOne.mockResolvedValue(mockReview);
      
      // Mock updateProductRating
      Review.aggregate.mockResolvedValue([{ averageRating: 4.5, reviewCount: 2 }]);
      Product.findByIdAndUpdate.mockResolvedValue({});

      const result = await ReviewService.updateReview('review123', 'user123', { rating: 5, comment: 'Excellent!' });

      expect(mockReview.rating).toBe(5);
      expect(mockReview.comment).toBe('Excellent!');
      expect(mockReview.save).toHaveBeenCalled();
    });

    it('should throw error if review not found or user does not own it', async () => {
      Review.findOne.mockResolvedValue(null);

      await expect(
        ReviewService.updateReview('review123', 'user123', { rating: 5 })
      ).rejects.toThrow('Review not found or you do not have permission to update it');
    });

    it('should throw error if rating is invalid', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        rating: 4
      };

      Review.findOne.mockResolvedValue(mockReview);

      await expect(
        ReviewService.updateReview('review123', 'user123', { rating: 6 })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        product: 'product123'
      };

      Review.findOne.mockResolvedValue(mockReview);
      Review.deleteOne.mockResolvedValue({ deletedCount: 1 });
      
      // Mock updateProductRating
      Review.aggregate.mockResolvedValue([{ averageRating: 4, reviewCount: 1 }]);
      Product.findByIdAndUpdate.mockResolvedValue({});

      const result = await ReviewService.deleteReview('review123', 'user123');

      expect(Review.deleteOne).toHaveBeenCalledWith({ _id: 'review123' });
      expect(result).toEqual(mockReview);
    });

    it('should throw error if review not found or user does not own it', async () => {
      Review.findOne.mockResolvedValue(null);

      await expect(
        ReviewService.deleteReview('review123', 'user123')
      ).rejects.toThrow('Review not found or you do not have permission to delete it');
    });
  });

  describe('updateProductRating', () => {
    it('should update product average rating and review count', async () => {
      Review.aggregate.mockResolvedValue([{ averageRating: 4.5, reviewCount: 10 }]);
      Product.findByIdAndUpdate.mockResolvedValue({});

      await ReviewService.updateProductRating('product123');

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('product123', {
        averageRating: 4.5,
        reviewCount: 10
      });
    });

    it('should set rating to 0 if no reviews exist', async () => {
      Review.aggregate.mockResolvedValue([]);
      Product.findByIdAndUpdate.mockResolvedValue({});

      await ReviewService.updateProductRating('product123');

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('product123', {
        averageRating: 0,
        reviewCount: 0
      });
    });
  });
});
