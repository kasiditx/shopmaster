import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCart, clearCart } from '../store/cartSlice';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, subtotal, tax, shippingCost, total, loading, error } = useSelector((state) => state.cart);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20 bg-white rounded-2xl shadow-soft animate-pulse">
          <div className="text-6xl mb-4">🛒</div>
          <div className="text-lg font-semibold text-gray-600">Loading your cart...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20 bg-red-50 rounded-2xl shadow-soft border-2 border-red-200">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-bold text-red-800 mb-4">Error loading cart</div>
          <p className="text-red-600 mb-6">{error}</p>
          <Link to="/" className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20 bg-white rounded-2xl shadow-soft border border-gray-100 animate-scale-in">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link 
            to="/" 
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <span className="flex items-center space-x-2">
              <span>🛍️</span>
              <span>Start Shopping</span>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center space-x-3">
          <span>🛒</span>
          <span>Shopping Cart</span>
        </h1>
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {/* Cart Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
          
          {/* Clear Cart Button */}
          <div className="pt-4">
            <button 
              type="button" 
              onClick={handleClearCart}
              className="w-full sm:w-auto px-6 py-3 bg-white text-red-600 font-semibold rounded-xl border-2 border-red-200 hover:bg-red-50 hover:border-red-500 transition-all"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🗑️</span>
                <span>Clear Cart</span>
              </span>
            </button>
          </div>
        </div>

        {/* Cart Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <CartSummary 
              subtotal={subtotal}
              tax={tax}
              shippingCost={shippingCost}
              total={total}
              itemCount={items.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
