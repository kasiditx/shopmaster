const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true, 
      index: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    order: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order', 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String 
    },
    helpful: { 
      type: Number, 
      default: 0 
    },
    verified: { 
      type: Boolean, 
      default: true 
    },
  },
  { timestamps: true },
);

// Compound unique index on (product, user) - one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Index for sorting reviews by date
reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
