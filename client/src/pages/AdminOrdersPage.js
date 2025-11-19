import { useState } from 'react';
import AdminOrderList from '../components/admin/AdminOrderList';
import OrderDetailModal from '../components/admin/OrderDetailModal';
import './AdminOrdersPage.css';

const AdminOrdersPage = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="admin-orders-page">
      <AdminOrderList onViewDetails={handleViewDetails} />
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default AdminOrdersPage;
