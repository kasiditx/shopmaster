import React from 'react';
import { Link } from 'react-router-dom';

const OrderCard = ({ order, onCancel }) => {
  const canCancel = order.status === 'pending';
  
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      paid: '#10b981',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#06b6d4',
      cancelled: '#ef4444'
    };
    return colors[status] || '#94a3b8';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="order-card-info">
          <h3 className="order-number">
            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
          </h3>
          <p className="order-date">{formatDate(order.createdAt)}</p>
        </div>
        <span 
          className="order-status-badge" 
          style={{ backgroundColor: getStatusColor(order.status) }}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="order-card-items">
        {order.items && order.items.length > 0 ? (
          <ul className="order-items-list">
            {order.items.slice(0, 3).map((item, idx) => (
              <li key={idx} className="order-item-summary">
                <span className="order-item-name">
                  {item.name || 'Product'}
                </span>
                <span className="order-item-qty">
                  Qty: {item.qty}
                </span>
                <span className="order-item-price">
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </li>
            ))}
            {order.items.length > 3 && (
              <li className="order-items-more">
                +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
              </li>
            )}
          </ul>
        ) : (
          <p className="text-muted">No items</p>
        )}
      </div>

      <div className="order-card-footer">
        <div className="order-total">
          <span className="order-total-label">Total:</span>
          <span className="order-total-amount">${order.total?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="order-card-actions">
          <Link to={`/orders/${order._id}`} className="btn-view-order">
            View Details
          </Link>
          {canCancel && onCancel && (
            <button 
              onClick={() => onCancel(order._id)} 
              className="btn-cancel-order"
              type="button"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
