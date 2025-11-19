import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { fetchCart, clearCart } from '../store/cartSlice';
import http from '../api/http';

// Lazy load Stripe Elements and CheckoutForm
const Elements = lazy(() => import('@stripe/react-stripe-js').then(module => ({ default: module.Elements })));
const CheckoutForm = lazy(() => import('../components/checkout/CheckoutForm'));

// Initialize Stripe with publishable key (lazy loaded when needed)
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
  }
  return stripePromise;
};

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, tax, shippingCost, total, loading } = useSelector((state) => state.cart);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const createPaymentIntent = useCallback(async () => {
    try {
      const { data } = await http.post('/payment/create-intent', {
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          cartItems: items.length,
        }
      });
      setClientSecret(data.clientSecret);
      setPaymentError(null);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to initialize payment');
    }
  }, [total, items]);

  useEffect(() => {
    // Create payment intent when component mounts and cart has items
    if (items && items.length > 0 && total > 0) {
      createPaymentIntent();
    }
  }, [items, total, createPaymentIntent]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Create order after successful payment
      const orderPayload = {
        items: items.map((item) => ({
          product: item.productId,
          name: item.name,
          price: item.price,
          qty: item.quantity
        })),
        subtotal,
        tax,
        shippingCost,
        total,
        shippingAddress,
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'completed'
      };

      const { data } = await http.post('/orders', orderPayload);
      
      // Clear cart after successful order
      await dispatch(clearCart());
      
      // Navigate to order confirmation
      navigate(`/orders/${data.order._id}`, { 
        state: { orderCreated: true } 
      });
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to create order');
    }
  };

  const handlePaymentFailure = (error) => {
    setPaymentError(error.message || 'Payment failed. Please try again.');
  };

  if (!isAuthenticated) {
    return (
      <div className="checkout-page">
        <h2>Checkout</h2>
        <p>Please <Link to="/login">log in</Link> to continue with checkout.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="checkout-page">
        <h2>Checkout</h2>
        <p>Your cart is empty.</p>
        <Link to="/" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const isShippingValid = shippingAddress.line1 && 
                          shippingAddress.city && 
                          shippingAddress.postalCode && 
                          shippingAddress.country;

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      
      <div className="checkout-content">
        {/* Shipping Address Form */}
        <div className="checkout-section">
          <h3>Shipping Address</h3>
          <form className="shipping-form">
            <div className="form-group">
              <label htmlFor="line1">Address Line 1 *</label>
              <input
                id="line1"
                name="line1"
                type="text"
                value={shippingAddress.line1}
                onChange={handleShippingChange}
                required
                placeholder="Street address"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="line2">Address Line 2</label>
              <input
                id="line2"
                name="line2"
                type="text"
                value={shippingAddress.line2}
                onChange={handleShippingChange}
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={shippingAddress.city}
                  onChange={handleShippingChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">State/Province</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={shippingAddress.state}
                  onChange={handleShippingChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postalCode">Postal Code *</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={handleShippingChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={shippingAddress.country}
                  onChange={handleShippingChange}
                  required
                  placeholder="e.g., USA"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="checkout-section">
          <h3>Order Summary</h3>
          <div className="order-summary">
            <div className="order-items">
              {items.map((item) => (
                <div key={item.productId} className="order-item">
                  <span>{item.name} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-totals">
              <div className="order-total-line">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="order-total-line">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="order-total-line">
                <span>Shipping:</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="order-total-line order-total-final">
                <strong>Total:</strong>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="checkout-section">
          <h3>Payment Information</h3>
          {paymentError && (
            <div className="error-message">
              {paymentError}
            </div>
          )}
          
          {!isShippingValid && (
            <div className="warning-message">
              Please complete the shipping address before proceeding with payment.
            </div>
          )}
          
          {clientSecret && isShippingValid ? (
            <Suspense fallback={<div className="payment-loading">Loading payment form...</div>}>
              <Elements stripe={getStripe()} options={{ clientSecret }}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentFailure}
                />
              </Elements>
            </Suspense>
          ) : (
            <div className="payment-loading">
              {isShippingValid ? 'Initializing payment...' : 'Complete shipping address to continue'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
