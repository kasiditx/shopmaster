import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProductById, fetchProductReviews, clearCurrentProduct } from '../store/productSlice';
import { fetchWishlist } from '../store/wishlistSlice';
import { fetchMyOrders } from '../store/orderSlice';
import ProductDetail from '../components/product/ProductDetail';
import ProductReviews from '../components/product/ProductReviews';
import ReviewForm from '../components/product/ReviewForm';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProduct, reviews, productLoading, reviewsLoading, error } = useSelector(state => state.products);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { items: orders } = useSelector(state => state.orders);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    // Fetch product details
    dispatch(fetchProductById(id));
    
    // Fetch product reviews
    dispatch(fetchProductReviews({ productId: id, page: 1 }));
    
    // Fetch wishlist and orders if authenticated
    if (isAuthenticated) {
      dispatch(fetchWishlist());
      dispatch(fetchMyOrders());
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id, isAuthenticated]);

  // Check if user has purchased this product
  useEffect(() => {
    if (isAuthenticated && orders && currentProduct) {
      const hasPurchased = orders.some(order => 
        order.status !== 'cancelled' && 
        order.items?.some(item => 
          (item.product?._id === currentProduct._id || item.product === currentProduct._id)
        )
      );
      setCanReview(hasPurchased);
    } else {
      setCanReview(false);
    }
  }, [isAuthenticated, orders, currentProduct]);

  if (productLoading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#e53e3e', marginBottom: '16px' }}>
          Error: {error}
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>
          Product not found
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px 20px'
    }}>
      {/* Back button */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#3182ce',
            border: '1px solid #3182ce',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          ← Back to Products
        </button>
      </div>

      {/* Product details */}
      <ProductDetail product={currentProduct} />

      {/* Reviews section */}
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto 0',
        padding: '32px',
        backgroundColor: '#f7fafc',
        borderRadius: '8px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '24px'
        }}>
          Customer Reviews
        </h2>

        {/* Review form - only show if user has purchased the product */}
        {isAuthenticated && canReview && (
          <ReviewForm productId={id} />
        )}

        {/* Message for authenticated users who haven't purchased */}
        {isAuthenticated && !canReview && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#856404'
          }}>
            You need to purchase this product before you can write a review.
          </div>
        )}

        {/* Message for non-authenticated users */}
        {!isAuthenticated && (
          <div style={{
            padding: '16px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #3182ce',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#2c5282'
          }}>
            Please <span 
              onClick={() => navigate('/login')}
              style={{ 
                textDecoration: 'underline', 
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              log in
            </span> to write a review.
          </div>
        )}

        {/* Reviews list */}
        <ProductReviews 
          reviews={reviews} 
          loading={reviewsLoading} 
          error={error}
        />
      </div>
    </div>
  );
};

export default ProductPage;
