import React from 'react';

const OrderTracking = ({ order }) => {
  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'paid', label: 'Payment Confirmed', icon: '💳' },
    { key: 'processing', label: 'Processing', icon: '⚙️' },
    { key: 'shipped', label: 'Shipped', icon: '📦' },
    { key: 'delivered', label: 'Delivered', icon: '✅' }
  ];

  const cancelledStep = { key: 'cancelled', label: 'Cancelled', icon: '❌' };

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  const getStepStatus = (stepIndex) => {
    if (isCancelled) {
      return 'inactive';
    }
    if (stepIndex < currentStatusIndex) {
      return 'completed';
    }
    if (stepIndex === currentStatusIndex) {
      return 'current';
    }
    return 'pending';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStepTimestamp = (stepKey) => {
    if (!order.statusHistory || order.statusHistory.length === 0) {
      // Fallback to createdAt for first step
      if (stepKey === 'pending') {
        return order.createdAt;
      }
      return null;
    }

    const historyEntry = order.statusHistory.find(h => h.status === stepKey);
    return historyEntry ? historyEntry.timestamp : null;
  };

  if (isCancelled) {
    return (
      <div className="order-tracking">
        <h3 className="tracking-title">Order Status</h3>
        <div className="tracking-cancelled">
          <div className="cancelled-icon">{cancelledStep.icon}</div>
          <div className="cancelled-info">
            <h4>{cancelledStep.label}</h4>
            <p className="text-muted">
              {formatTimestamp(getStepTimestamp('cancelled') || order.updatedAt)}
            </p>
            {order.statusHistory && order.statusHistory.length > 0 && (
              <p className="cancelled-note">
                {order.statusHistory[order.statusHistory.length - 1].note || 
                 'This order has been cancelled.'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking">
      <h3 className="tracking-title">Order Tracking</h3>
      <div className="tracking-steps">
        {statusSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const timestamp = getStepTimestamp(step.key);

          return (
            <div key={step.key} className={`tracking-step tracking-step-${stepStatus}`}>
              <div className="tracking-step-indicator">
                <div className="tracking-step-icon">{step.icon}</div>
                {index < statusSteps.length - 1 && (
                  <div className="tracking-step-line"></div>
                )}
              </div>
              <div className="tracking-step-content">
                <h4 className="tracking-step-label">{step.label}</h4>
                {timestamp && (
                  <p className="tracking-step-time">{formatTimestamp(timestamp)}</p>
                )}
                {stepStatus === 'current' && (
                  <p className="tracking-step-current-badge">Current Status</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracking;
