const ProductService = require('../ProductService');
const Product = require('../../models/Product');
const CacheService = require('../CacheService');
const cloudinary = require('../../config/cloudinary');
const socket = require('../../config/socket');

jest.mock('../../models/Product');
jest.mock('../CacheService');
jest.mock('../../config/cloudinary');
jest.mock('../../config/socket');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should search products by query with case-insensitive matching', async () => {
      const mockProducts = [
        { _id: '1', name: 'Test Product', price: 100 },
        { _id: '2', name: 'Another Test', price: 200 },
      ];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };

      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(2);

      const result = await ProductService.searchProducts({
        query: 'test',
        page: 1,
        limit: 20,
      });

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          $or: [
            { name: { $regex: 'test', $options: 'i' } },
            { description: { $regex: 'test', $options: 'i' } },
          ],
        })
      );
      expect(result.products).toEqual(mockProducts);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter products by category', async () => {
      const mockProducts = [{ _id: '1', name: 'Product', category: 'electronics' }];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };

      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(1);

      await ProductService.searchProducts({
        category: 'electronics',
      });

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          category: 'electronics',
        })
      );
    });

    it('should filter products by price range', async () => {
      const mockProducts = [{ _id: '1', name: 'Product', price: 150 }];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };

      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(1);

      await ProductService.searchProducts({
        minPrice: 100,
        maxPrice: 200,
      });

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          price: { $gte: 100, $lte: 200 },
        })
      );
    });

    it('should filter products by minimum rating', async () => {
      const mockProducts = [{ _id: '1', name: 'Product', averageRating: 4.5 }];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };

      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(1);

      await ProductService.searchProducts({
        minRating: 4.0,
      });

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          averageRating: { $gte: 4.0 },
        })
      );
    });

    it('should implement pagination with default 20 items per page', async () => {
      const mockProducts = Array(20).fill({ _id: '1', name: 'Product' });

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };

      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(50);

      const result = await ProductService.searchProducts({
        page: 2,
      });

      expect(mockFind.skip).toHaveBeenCalledWith(20);
      expect(mockFind.limit).toHaveBeenCalledWith(20);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('should combine multiple filters', async () => {
      const mockProducts = [{ _id: '1', name: 'Product' }];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };

      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(1);

      await ProductService.searchProducts({
        query: 'laptop',
        category: 'electronics',
        minPrice: 500,
        maxPrice: 1500,
        minRating: 4.0,
      });

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          $or: [
            { name: { $regex: 'laptop', $options: 'i' } },
            { description: { $regex: 'laptop', $options: 'i' } },
          ],
          category: 'electronics',
          price: { $gte: 500, $lte: 1500 },
          averageRating: { $gte: 4.0 },
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const mockProduct = { _id: '123', name: 'Test Product' };
      Product.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct),
      });

      const result = await ProductService.getProductById('123');

      expect(Product.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = { name: 'New Product', price: 100, images: [] };
      const expectedData = {
        ...productData,
        active: true,
        averageRating: 0,
        reviewCount: 0,
      };
      const mockProduct = { 
        _id: '123', 
        ...expectedData, 
        toObject: jest.fn().mockReturnValue({ _id: '123', ...expectedData }) 
      };
      
      Product.create.mockResolvedValue(mockProduct);
      CacheService.invalidatePattern.mockResolvedValue(1);

      const result = await ProductService.createProduct(productData);

      expect(Product.create).toHaveBeenCalledWith(expectedData);
      expect(CacheService.invalidatePattern).toHaveBeenCalledWith('product:list:*');
      expect(result).toEqual({ _id: '123', ...expectedData });
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updates = { name: 'Updated Product' };
      const mockProduct = { _id: '123', ...updates };
      
      Product.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct),
      });
      CacheService.delete.mockResolvedValue(true);
      CacheService.invalidatePattern.mockResolvedValue(1);

      const result = await ProductService.updateProduct('123', updates);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        updates,
        { new: true, runValidators: true }
      );
      expect(CacheService.delete).toHaveBeenCalledWith('product:detail:123');
      expect(CacheService.invalidatePattern).toHaveBeenCalledWith('product:list:*');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product by setting active to false', async () => {
      const mockProduct = { _id: '123', name: 'Deleted Product', active: false };
      
      Product.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct),
      });
      CacheService.delete.mockResolvedValue(true);
      CacheService.invalidatePattern.mockResolvedValue(1);

      const result = await ProductService.deleteProduct('123');

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { active: false },
        { new: true }
      );
      expect(CacheService.delete).toHaveBeenCalledWith('product:detail:123');
      expect(CacheService.invalidatePattern).toHaveBeenCalledWith('product:list:*');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('updateStock', () => {
    it('should update product stock and broadcast via WebSocket', async () => {
      const mockProduct = { _id: '123', stock: 50, name: 'Test Product', updatedAt: new Date() };
      
      Product.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct),
      });
      CacheService.delete.mockResolvedValue(true);
      CacheService.invalidatePattern.mockResolvedValue(1);
      socket.emitToProduct.mockImplementation(() => {});

      const result = await ProductService.updateStock('123', 50);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({ stock: 50 }),
        { new: true, runValidators: true }
      );
      expect(CacheService.delete).toHaveBeenCalledWith('product:detail:123');
      expect(CacheService.invalidatePattern).toHaveBeenCalledWith('product:list:*');
      expect(socket.emitToProduct).toHaveBeenCalledWith(
        '123',
        'product:stock_updated',
        expect.objectContaining({
          productId: mockProduct._id,
          stock: 50,
          name: 'Test Product',
        })
      );
      expect(result).toEqual(mockProduct);
    });
  });
});
