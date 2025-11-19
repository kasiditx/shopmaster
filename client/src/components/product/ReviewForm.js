import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import http from '../../api/http';
import { addNotification } from '../../store/notificationSlice';
import { fetchProductReviews } from '../../store/productSlice';

const ReviewForm = ({ productId, onReviewSubmitted }) => {
  const dispatch = useDispatch();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please select a rating between 1 and 5 stars'
      }));
      return;
    }

    setSubmitting(true);
    try {
      await http.post(`/products/${productId}/reviews`, {
        rating,
        comment: comment.trim()
      });
      
      dispatch(addNotification({
        type: 'success',
        message: 'Review submitted successfully!'
      }));
      
      // Reset form
      setRating(5);
      setComment('');
      
      // Refresh reviews
      dispatch(fetchProductReviews({ productId, page: 1 }));
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      dispatch(addNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit review'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '16px'
      }}>
        Write a Review
      </h3>
      
      <form onSubmit={handleSubmit}>
        {/* Rating selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Rating *
          </label>
          <div style={{
            display: 'flex',
            gap: '4px',
            fontSize: '32px'
          }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{
                  cursor: 'pointer',
                  color: star <= (hoveredRating || rating) ? '#fbbf24' : '#e2e8f0',
                  transition: 'color 0.2s'
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Comment textarea */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Your Review (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 24px',
            backgroundColor: submitting ? '#cbd5e0' : '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
