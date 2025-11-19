import React from 'react';
import { useNavigate } from 'react-router-dom';

const CartSummary = ({ subtotal, tax, shippingCost, total, itemCount }) => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-strong border border-gray-100 animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <span>📋</span>
          <span>Order Summary</span>
        </h3>
      </div>

      {/* Summary Lines */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="text-gray-900 font-bold">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Tax</span>
          <span className="text-gray-900 font-bold">${tax.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Shipping</span>
          <span className="text-gray-900 font-bold">
            {shippingCost === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `$${shippingCost.toFixed(2)}`
            )}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl px-4 mt-4">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-3xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        type="button"
        onClick={handleCheckout}
        className="w-full py-4 px-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="flex items-center justify-center space-x-2">
          <span>🚀</span>
          <span>Proceed to Checkout</span>
        </span>
      </button>

      {/* Security Badge */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <span>🔒</span>
          <span>Secure Checkout</span>
        </div>
      </div>

      {/* Free Shipping Notice */}
      {shippingCost === 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-800 font-medium text-center flex items-center justify-center space-x-2">
            <span>🎉</span>
            <span>You've got FREE shipping!</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CartSummary;
