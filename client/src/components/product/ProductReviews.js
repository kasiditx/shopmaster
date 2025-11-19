import React from 'react';
import ReviewCard from './ReviewCard';

const ProductReviews = ({ reviews, loading, error }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#e53e3e' }}>
        Error loading reviews: {error}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#666'
      }}>
        No reviews yet. Be the first to review this product!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {reviews.map(review => (
        <ReviewCard key={review._id} review={review} />
      ))}
    </div>
  );
};

export default ProductReviews;
