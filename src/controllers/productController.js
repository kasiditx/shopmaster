const Product = require('../models/Product');
const CacheService = require('../services/CacheService');
const ProductService = require('../services/ProductService');
const { asyncHandler } = require('../middleware/error');
const { NotFoundError, ValidationError } = require('../utils/errors');

const listProducts = asyncHandler(async (req, res) => {
    const {
      query: q,
      category,
      minPrice,
      maxPrice,
      minRating,
      page,
      limit,
    } = req.query;

    // Generate cache key based on query parameters
    const cacheKey = `product:list:${JSON.stringify({
      q: q || '',
      category: category || '',
      minPrice: minPrice || '',
      maxPrice: maxPrice || '',
      minRating: minRating || '',
      page: page || '1',
      limit: limit || '20',
    })}`;
    
    // Try to get from cache
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Use ProductService for search and filtering
    const result = await ProductService.searchProducts({
      query: q,
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    
    // Cache the response
    await CacheService.set(cacheKey, result, CacheService.TTL.PRODUCT_LIST);

    res.json(result);
});

const getProduct = asyncHandler(async (req, res) => {
    // Generate cache key for product detail
    const cacheKey = `product:detail:${req.params.id}`;
    
    // Try to get from cache
    const cachedProduct = await CacheService.get(cacheKey);
    if (cachedProduct) {
      return res.json({ product: cachedProduct });
    }

    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    // Cache the product
    await CacheService.set(cacheKey, product, CacheService.TTL.PRODUCT_DETAIL);
    
    res.json({ product });
});

const createProduct = asyncHandler(async (req, res) => {
    const { name, price, description, images, stock, category, tags, lowStockThreshold } = req.body;
    
    // Validate required fields
    if (!name || !price || price < 0) {
      throw new ValidationError('Name and valid price are required', {
        missingFields: [!name && 'name', (!price || price < 0) && 'price'].filter(Boolean),
      });
    }
    
    const product = await ProductService.createProduct({
      name,
      price,
      description,
      images,
      stock: stock || 0,
      category,
      tags,
      lowStockThreshold: lowStockThreshold || 10,
    });
    
    res.status(201).json({ 
      success: true,
      product 
    });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.updateProduct(req.params.id, req.body);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  res.json({ 
    success: true,
    product 
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.deleteProduct(req.params.id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  res.json({ 
    success: true,
    message: 'Product deleted', 
    product 
  });
});

const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  
  if (stock === undefined || stock < 0) {
    throw new ValidationError('Stock quantity must be a non-negative number', {
      field: 'stock',
      value: stock,
    });
  }
  
  const product = await ProductService.updateStock(req.params.id, stock);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  res.json({ 
    success: true,
    product 
  });
});

module.exports = { 
  listProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateStock 
};
