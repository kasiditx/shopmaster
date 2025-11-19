import { useState, useEffect } from 'react';
import http from '../../api/http';
import './InventoryDashboard.css';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'low', 'out'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'stock', 'category'

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await http.get('/admin/inventory');
      setInventory(response.data.inventory || []);
    } catch (err) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStockUpdate = async (productId, currentStock) => {
    const newStock = prompt('Enter new stock quantity:', currentStock);
    if (newStock === null) return;

    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }

    try {
      await http.put(`/products/${productId}/stock`, { stock: stockValue });
      setInventory(inventory.map(item =>
        item._id === productId ? { ...item, stock: stockValue } : item
      ));
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock < product.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  const filteredInventory = inventory.filter(product => {
    if (filter === 'low') return product.stock < product.lowStockThreshold && product.stock > 0;
    if (filter === 'out') return product.stock === 0;
    return true;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'stock') return a.stock - b.stock;
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    return 0;
  });

  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(p => p.stock < p.lowStockThreshold && p.stock > 0).length,
    outOfStock: inventory.filter(p => p.stock === 0).length,
    inStock: inventory.filter(p => p.stock >= p.lowStockThreshold).length
  };

  if (loading) return <div className="loading">Loading inventory...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-header">
        <h2>Inventory Dashboard</h2>
        <button onClick={fetchInventory} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card in-stock">
          <div className="stat-value">{stats.inStock}</div>
          <div className="stat-label">In Stock</div>
        </div>
        <div className="stat-card low-stock">
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-card out-of-stock">
          <div className="stat-value">{stats.outOfStock}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
      </div>

      <div className="controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Products
          </button>
          <button
            className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
            onClick={() => setFilter('low')}
          >
            Low Stock
          </button>
          <button
            className={`filter-btn ${filter === 'out' ? 'active' : ''}`}
            onClick={() => setFilter('out')}
          >
            Out of Stock
          </button>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="stock">Stock Level</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Low Stock Threshold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedInventory.map(product => {
              const status = getStockStatus(product);
              return (
                <tr key={product._id} className={status}>
                  <td>
                    <div className="product-cell">
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="product-thumb" />
                      ) : (
                        <div className="no-image">No image</div>
                      )}
                      <span className="product-name">{product.name}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <span className={`stock-value ${status}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>{product.lowStockThreshold}</td>
                  <td>
                    <span className={`status-badge ${status}`}>
                      {status === 'out-of-stock' && '❌ Out of Stock'}
                      {status === 'low-stock' && '⚠️ Low Stock'}
                      {status === 'in-stock' && '✅ In Stock'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleQuickStockUpdate(product._id, product.stock)}
                      className="btn-update-stock"
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedInventory.length === 0 && (
        <div className="no-products">No products found</div>
      )}
    </div>
  );
};

export default InventoryDashboard;
