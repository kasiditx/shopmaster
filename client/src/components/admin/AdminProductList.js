import { useState, useEffect } from 'react';
import http from '../../api/http';
import './AdminProductList.css';

const AdminProductList = ({ onEdit, onStockUpdate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await http.get('/products', {
        params: {
          limit: 100 // Get more products for admin view
        }
      });
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await http.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      alert('Failed to delete product');
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
      setProducts(products.map(p => 
        p._id === productId ? { ...p, stock: stockValue } : p
      ));
      if (onStockUpdate) {
        onStockUpdate(productId, stockValue);
      }
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-product-list">
      <div className="list-header">
        <h2>Product Management</h2>
        <button onClick={() => onEdit(null)} className="btn-create">
          Create New Product
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product._id}>
                <td>
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="product-thumbnail" />
                  ) : (
                    <div className="no-image">No image</div>
                  )}
                </td>
                <td>
                  <div className="product-name">{product.name}</div>
                </td>
                <td>{product.category}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>
                  <span className={`stock-badge ${product.stock === 0 ? 'out-of-stock' : product.stock < product.lowStockThreshold ? 'low-stock' : ''}`}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  {product.averageRating ? (
                    <span>⭐ {product.averageRating.toFixed(1)} ({product.reviewCount})</span>
                  ) : (
                    <span>No reviews</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(product)}
                      className="btn-edit"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleQuickStockUpdate(product._id, product.stock)}
                      className="btn-stock"
                      title="Update Stock"
                    >
                      📦
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="btn-delete"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="no-products">No products found</div>
      )}
    </div>
  );
};

export default AdminProductList;
