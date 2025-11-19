import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

const CheckoutForm = ({ clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        onError(error);
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
        setProcessing(false);
      } else {
        setErrorMessage('Payment processing. Please wait...');
        setProcessing(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      onError(err);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <PaymentElement />
      
      {errorMessage && (
        <div className="payment-error">
          {errorMessage}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-primary payment-submit"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
      
      <div className="payment-info">
        <p className="text-muted">
          Your payment information is secure and encrypted.
        </p>
      </div>
    </form>
  );
};

export default CheckoutForm;
