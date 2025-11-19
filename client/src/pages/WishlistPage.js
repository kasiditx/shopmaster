import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchWishlist, removeFromWishlist, moveToCart } from '../store/wishlistSlice';
import { addNotification } from '../store/notificationSlice';

const WishlistPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { items, loading, error } = useSelector(state => state.wishlist);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated, navigate]);

  const handleRemove = async (productId, productName) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: `Removed ${productName} from wishlist`
      }));
    } catch (err) {
      dispatch(addNotification({
        type: 'error',
        message: err || 'Failed to remove from wishlist'
      }));
    }
  };

  const handleMoveToCart = async (productId, productName) => {
    try {
      await dispatch(moveToCart(productId)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: `Moved ${productName} to cart`
      }));
    } catch (err) {
      dispatch(addNotification({
        type: 'error',
        message: err || 'Failed to move to cart'
      }));
    }
  };

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading wishlist...</div>
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
          onClick={() => dispatch(fetchWishlist())}
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
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '32px'
      }}>
        My Wishlist
      </h1>

      {items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f7fafc',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤍</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
            Your wishlist is empty
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Save items you love for later!
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {items.map(item => {
            const product = item.product || item;
            const productId = product._id || item.productId;
            const isOutOfStock = product.stock === 0;

            return (
              <div
                key={productId}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Product Image */}
                <div
                  onClick={() => handleViewProduct(productId)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={product.images?.[0] || '/placeholder.png'}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {isOutOfStock && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3
                    onClick={() => handleViewProduct(productId)}
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      cursor: 'pointer'
                    }}
                  >
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#2c5282',
                    marginBottom: '8px'
                  }}>
                    ${product.price?.toFixed(2)}
                  </div>

                  {/* Stock Status */}
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    {isOutOfStock ? (
                      <span style={{ color: '#e53e3e' }}>✗ Out of Stock</span>
                    ) : (
                      <span style={{ color: '#38a169' }}>✓ In Stock ({product.stock} available)</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => handleMoveToCart(productId, product.name)}
                      disabled={isOutOfStock}
                      style={{
                        padding: '10px',
                        backgroundColor: isOutOfStock ? '#cbd5e0' : '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {isOutOfStock ? 'Out of Stock' : '🛒 Move to Cart'}
                    </button>
                    <button
                      onClick={() => handleRemove(productId, product.name)}
                      style={{
                        padding: '10px',
                        backgroundColor: 'white',
                        color: '#e53e3e',
                        border: '1px solid #e53e3e',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
