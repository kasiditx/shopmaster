const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    category: { type: String, index: true },
    tags: [{ type: String }],
    active: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true },
);

// Text index for search functionality
productSchema.index({ name: 'text', description: 'text' });

// Compound index for category and price filtering
productSchema.index({ category: 1, price: 1 });

// Index for sorting by rating
productSchema.index({ averageRating: -1 });

// Index for active products
productSchema.index({ active: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
