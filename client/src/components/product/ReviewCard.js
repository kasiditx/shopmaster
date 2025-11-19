import React from 'react';

const ReviewCard = ({ review }) => {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {review.user?.name || 'Anonymous'}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        <div style={{ fontSize: '16px' }}>
          {'⭐'.repeat(review.rating)}
        </div>
      </div>
      {review.comment && (
        <p style={{ color: '#4a5568', lineHeight: '1.6', marginBottom: '8px' }}>
          {review.comment}
        </p>
      )}
      {review.verified && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#38a169',
          fontWeight: '600'
        }}>
          ✓ Verified Purchase
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
