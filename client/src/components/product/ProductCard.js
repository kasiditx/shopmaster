import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/wishlistSlice';
import OptimizedImage from '../common/OptimizedImage';

const ProductCard = React.memo(({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  
  const isInWishlist = wishlistItems.some(item => 
    item._id === product._id || item.productId === product._id
  );

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      dispatch(addToCart({ productId: product._id, quantity: 1 }));
    } else {
      // For guest users, navigate to login
      navigate('/login');
    }
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (isInWishlist) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product._id));
    }
  };

  const handleCardClick = () => {
    navigate(`/products/${product._id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-strong border border-gray-100 relative overflow-hidden animate-scale-in"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Wishlist button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-all hover:scale-110 shadow-md"
        title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {isInWishlist ? '❤️' : '🤍'}
      </button>

      {/* Product image */}
      <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 aspect-square flex items-center justify-center">
        <OptimizedImage
          src={product.images?.[0] || '/placeholder.png'}
          alt={product.name}
          width="100%"
          height="100%"
          loading="lazy"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product info */}
      <div className="space-y-2">
        {/* Product name */}
        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[3.5rem]">
          {product.name}
        </h3>

        {/* Product rating */}
        {product.averageRating > 0 && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span className="text-yellow-400">⭐</span>
            <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
            <span className="text-gray-400">({product.reviewCount})</span>
          </div>
        )}

        {/* Product price */}
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Stock status */}
        <div className="flex items-center space-x-2">
          {product.stock > 0 ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              In Stock ({product.stock})
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
              Out of Stock
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
            product.stock > 0
              ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:scale-105 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? (
            <span className="flex items-center justify-center space-x-2">
              <span>🛒</span>
              <span>Add to Cart</span>
            </span>
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </div>
  );
});

// Custom comparison function to prevent unnecessary re-renders
ProductCard.displayName = 'ProductCard';

export default ProductCard;
