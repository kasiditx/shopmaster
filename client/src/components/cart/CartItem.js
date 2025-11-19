import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { updateCartItem, removeFromCart } from '../../store/cartSlice';

const CartItem = React.memo(({ item }) => {
  const dispatch = useDispatch();

  const handleQuantityChange = useCallback((e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity > 0 && newQuantity <= 99) {
      dispatch(updateCartItem({ productId: item.productId, quantity: newQuantity }));
    }
  }, [dispatch, item.productId]);

  const handleIncrement = useCallback(() => {
    if (item.quantity < 99) {
      dispatch(updateCartItem({ productId: item.productId, quantity: item.quantity + 1 }));
    }
  }, [dispatch, item.productId, item.quantity]);

  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      dispatch(updateCartItem({ productId: item.productId, quantity: item.quantity - 1 }));
    }
  }, [dispatch, item.productId, item.quantity]);

  const handleRemove = useCallback(() => {
    dispatch(removeFromCart(item.productId));
  }, [dispatch, item.productId]);

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft border border-gray-100 hover:shadow-md transition-all animate-scale-in">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-xl overflow-hidden">
            {item.image ? (
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                📦
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {item.name}
              </h3>
              <p className="text-2xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                ${item.price?.toFixed(2)}
              </p>
            </div>

            {/* Remove Button (Desktop) */}
            <button
              type="button"
              onClick={handleRemove}
              className="hidden sm:block p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Remove item"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-600">Quantity:</span>
              <div className="flex items-center bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={item.quantity <= 1}
                  className="px-3 py-2 text-gray-700 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={item.quantity}
                  onChange={handleQuantityChange}
                  className="w-16 text-center bg-transparent border-none font-bold text-gray-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={item.quantity >= 99}
                  className="px-3 py-2 text-gray-700 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Subtotal</p>
              <p className="text-2xl font-black text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Remove Button (Mobile) */}
          <button
            type="button"
            onClick={handleRemove}
            className="sm:hidden w-full mt-4 py-2 text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-all"
          >
            Remove Item
          </button>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
