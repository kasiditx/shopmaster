import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders, fetchOrderById, cancelOrder, clearCurrentOrder } from '../store/orderSlice';
import { Link, useParams, useNavigate } from 'react-router-dom';
import OrderCard from '../components/order/OrderCard';
import OrderTracking from '../components/order/OrderTracking';

const OrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { items, currentOrder, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (orderId && user) {
      dispatch(fetchOrderById(orderId));
    }
    return () => {
      if (orderId) {
        dispatch(clearCurrentOrder());
      }
    };
  }, [dispatch, orderId, user]);

  const handleCancelOrder = async (orderIdToCancel) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrderId(orderIdToCancel);
    setCancelError(null);

    try {
      await dispatch(cancelOrder(orderIdToCancel)).unwrap();
      // Refresh orders list
      dispatch(fetchMyOrders());
    } catch (err) {
      setCancelError(err || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (!user) {
    return (
      <div className="orders-page">
        <div className="orders-empty">
          <h2>My Orders</h2>
          <p>
            Please <Link to="/login">login</Link> to view your orders.
          </p>
        </div>
      </div>
    );
  }

  // Order detail view
  if (orderId && currentOrder) {
    return (
      <div className="orders-page">
        <div className="order-detail-header">
          <button onClick={() => navigate('/orders')} className="btn-back">
            ← Back to Orders
          </button>
          <h2>Order Details</h2>
        </div>

        {cancelError && (
          <div className="error-message">
            {cancelError}
          </div>
        )}

        <div className="order-detail-content">
          <div className="order-detail-main">
            <div className="order-detail-section">
              <div className="order-detail-header-info">
                <div>
                  <h3>Order #{currentOrder.orderNumber || currentOrder._id.slice(-8).toUpperCase()}</h3>
                  <p className="text-muted">
                    Placed on {new Date(currentOrder.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span 
                  className="order-status-badge"
                  style={{
                    backgroundColor: currentOrder.status === 'cancelled' ? '#ef4444' :
                                   currentOrder.status === 'delivered' ? '#10b981' :
                                   currentOrder.status === 'shipped' ? '#8b5cf6' :
                                   currentOrder.status === 'processing' ? '#3b82f6' :
                                   currentOrder.status === 'paid' ? '#10b981' : '#f59e0b'
                  }}
                >
                  {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="order-detail-section">
              <h4>Order Items</h4>
              <div className="order-detail-items">
                {currentOrder.items && currentOrder.items.map((item, idx) => (
                  <div key={idx} className="order-detail-item">
                    <div className="order-detail-item-info">
                      <h5>{item.name || 'Product'}</h5>
                      <p className="text-muted">Quantity: {item.qty}</p>
                    </div>
                    <div className="order-detail-item-price">
                      <p className="text-muted">${item.price?.toFixed(2)} each</p>
                      <p className="item-total">${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-detail-section">
              <h4>Shipping Address</h4>
              {currentOrder.shippingAddress ? (
                <div className="shipping-address">
                  <p>{currentOrder.shippingAddress.line1}</p>
                  {currentOrder.shippingAddress.line2 && <p>{currentOrder.shippingAddress.line2}</p>}
                  <p>
                    {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.postalCode}
                  </p>
                  <p>{currentOrder.shippingAddress.country}</p>
                </div>
              ) : (
                <p className="text-muted">No shipping address provided</p>
              )}
            </div>

            <div className="order-detail-section">
              <h4>Payment Information</h4>
              <div className="payment-info-detail">
                <div className="payment-line">
                  <span>Payment Status:</span>
                  <span className={`payment-status ${currentOrder.paymentStatus}`}>
                    {currentOrder.paymentStatus?.charAt(0).toUpperCase() + currentOrder.paymentStatus?.slice(1) || 'N/A'}
                  </span>
                </div>
                {currentOrder.paymentIntentId && (
                  <div className="payment-line">
                    <span>Payment ID:</span>
                    <span className="text-muted">{currentOrder.paymentIntentId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="order-detail-sidebar">
            <OrderTracking order={currentOrder} />

            <div className="order-summary-box">
              <h4>Order Summary</h4>
              <div className="summary-line">
                <span>Subtotal:</span>
                <span>${currentOrder.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-line">
                <span>Tax:</span>
                <span>${currentOrder.tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-line">
                <span>Shipping:</span>
                <span>${currentOrder.shippingCost?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-line summary-total">
                <span>Total:</span>
                <span>${currentOrder.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            {currentOrder.status === 'pending' && (
              <button
                onClick={() => handleCancelOrder(currentOrder._id)}
                className="btn-cancel-order-full"
                disabled={cancellingOrderId === currentOrder._id}
                type="button"
              >
                {cancellingOrderId === currentOrder._id ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Orders list view
  return (
    <div className="orders-page">
      <div className="orders-header">
        <h2>My Orders</h2>
        {items.length > 0 && (
          <p className="text-muted">{items.length} order{items.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {cancelError && (
        <div className="error-message">
          {cancelError}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="orders-loading">
          <p>Loading orders...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="orders-empty">
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {items.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onCancel={handleCancelOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
