import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../../store/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/wishlistSlice';
import { addNotification } from '../../store/notificationSlice';
import OptimizedImage from '../common/OptimizedImage';

const ProductDetail = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const isInWishlist = wishlistItems.some(item => 
    item._id === product._id || item.productId === product._id
  );

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(addToCart({ productId: product._id, quantity })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: `Added ${quantity} ${product.name} to cart`
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to add to cart'
      }));
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: `Removed ${product.name} from wishlist`
        }));
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: `Added ${product.name} to wishlist`
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to update wishlist'
      }));
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= product.stock) {
      setQuantity(newQty);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Left column - Images */}
        <div>
          {/* Main image */}
          <div style={{
            marginBottom: '16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <OptimizedImage
              src={product.images?.[selectedImage] || '/placeholder.png'}
              alt={product.name}
              width="100%"
              height="500px"
              loading="eager"
            />
          </div>

          {/* Thumbnail images */}
          {product.images && product.images.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto'
            }}>
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  style={{
                    border: selectedImage === idx ? '2px solid #3182ce' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  <OptimizedImage
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    width="80px"
                    height="80px"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column - Product info */}
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            {product.name}
          </h1>

          {/* Rating */}
          {product.averageRating > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              fontSize: '16px'
            }}>
              <span>⭐ {product.averageRating.toFixed(1)}</span>
              <span style={{ color: '#666' }}>({product.reviewCount} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#2c5282',
            marginBottom: '16px'
          }}>
            ${product.price.toFixed(2)}
          </div>

          {/* Stock status */}
          <div style={{
            marginBottom: '24px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {product.stock > 0 ? (
              <span style={{ color: '#38a169' }}>✓ In Stock ({product.stock} available)</span>
            ) : (
              <span style={{ color: '#e53e3e' }}>✗ Out of Stock</span>
            )}
          </div>

          {/* Description */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '8px', fontWeight: '600' }}>Description</h3>
            <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
              {product.description || 'No description available.'}
            </p>
          </div>

          {/* Category */}
          {product.category && (
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 12px',
                backgroundColor: '#e6fffa',
                color: '#234e52',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {product.category}
              </span>
            </div>
          )}

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Quantity
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: quantity <= 1 ? '#e2e8f0' : '#3182ce',
                    color: quantity <= 1 ? '#a0aec0' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}
                >
                  -
                </button>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: quantity >= product.stock ? '#e2e8f0' : '#3182ce',
                    color: quantity >= product.stock ? '#a0aec0' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: quantity >= product.stock ? 'not-allowed' : 'pointer',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: product.stock > 0 ? '#3182ce' : '#cbd5e0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
            <button
              onClick={handleWishlistToggle}
              style={{
                padding: '16px 24px',
                backgroundColor: 'white',
                color: '#3182ce',
                border: '2px solid #3182ce',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '20px'
              }}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isInWishlist ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
