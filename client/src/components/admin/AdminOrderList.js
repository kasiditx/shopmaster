import { useState, useEffect } from 'react';
import http from '../../api/http';
import './AdminOrderList.css';

const AdminOrderList = ({ onViewDetails }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    customer: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.customer) params.customer = filters.customer;

      const response = await http.get('/admin/orders', { params });
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchOrders();
      return;
    }

    try {
      setLoading(true);
      const response = await http.get('/admin/orders/search', {
        params: { query: searchTerm }
      });
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await http.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredOrders = orders;

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      paid: '#28a745',
      processing: '#17a2b8',
      shipped: '#007bff',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-order-list">
      <div className="list-header">
        <h2>Order Management</h2>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by order number or customer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button onClick={handleSearch} className="btn-search">
            Search
          </button>
        </div>

        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="filter-date"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="filter-date"
            placeholder="End Date"
          />

          <button
            onClick={() => setFilters({ status: '', startDate: '', endDate: '', customer: '' })}
            className="btn-clear-filters"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id}>
                <td>
                  <span className="order-number">{order.orderNumber}</span>
                </td>
                <td>
                  <div className="customer-info">
                    <div>{order.user?.name || 'N/A'}</div>
                    <div className="customer-email">{order.user?.email || 'N/A'}</div>
                  </div>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.items?.length || 0}</td>
                <td>${order.total?.toFixed(2) || '0.00'}</td>
                <td>
                  <span className={`payment-badge ${order.paymentStatus}`}>
                    {order.paymentStatus || 'pending'}
                  </span>
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    className="status-select"
                    style={{ borderColor: getStatusColor(order.status) }}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => onViewDetails(order)}
                    className="btn-view"
                    title="View Details"
                  >
                    👁️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="no-orders">No orders found</div>
      )}
    </div>
  );
};

export default AdminOrderList;
