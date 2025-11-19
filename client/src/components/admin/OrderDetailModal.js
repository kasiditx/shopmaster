import './OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          <div className="order-info-section">
            <h3>Order Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Order Number:</span>
                <span className="value">{order.orderNumber}</span>
              </div>
              <div className="info-item">
                <span className="label">Date:</span>
                <span className="value">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
              </div>
              <div className="info-item">
                <span className="label">Payment Status:</span>
                <span className={`payment-badge ${order.paymentStatus}`}>{order.paymentStatus}</span>
              </div>
            </div>
          </div>

          <div className="customer-section">
            <h3>Customer Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name:</span>
                <span className="value">{order.user?.name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{order.user?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="shipping-section">
            <h3>Shipping Address</h3>
            {order.shippingAddress ? (
              <div className="address">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : (
              <p>No shipping address</p>
            )}
          </div>

          <div className="items-section">
            <h3>Order Items</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.qty}</td>
                    <td>${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals-section">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>${order.tax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="total-row">
              <span>Shipping:</span>
              <span>${order.shippingCost?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>${order.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="history-section">
              <h3>Status History</h3>
              <div className="timeline">
                {order.statusHistory.map((history, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-status">{history.status}</div>
                      <div className="timeline-date">
                        {new Date(history.timestamp).toLocaleString()}
                      </div>
                      {history.note && <div className="timeline-note">{history.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-close-modal">Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
