import { useState } from 'react';
import http from '../api/http';
import AdminProductList from '../components/admin/AdminProductList';
import ProductForm from '../components/admin/ProductForm';
import './AdminProductsPage.css';

const AdminProductsPage = () => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh trigger

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setView('form');
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setView('list');
  };

  const handleSubmit = async (formData) => {
    try {
      // Handle image upload if there are new images
      let imageUrls = formData.images || [];
      
      if (formData.imageFiles && formData.imageFiles.length > 0) {
        const uploadFormData = new FormData();
        formData.imageFiles.forEach(file => {
          uploadFormData.append('images', file);
        });

        // Upload images first (this would need a separate endpoint)
        // For now, we'll just use the existing images
        // In production, you'd upload to Cloudinary/S3 here
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        stock: formData.stock,
        lowStockThreshold: formData.lowStockThreshold,
        tags: formData.tags,
        images: imageUrls
      };

      if (selectedProduct) {
        // Update existing product
        await http.put(`/products/${selectedProduct._id}`, productData);
      } else {
        // Create new product
        await http.post('/products', productData);
      }

      setView('list');
      setSelectedProduct(null);
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="admin-products-page">
      {view === 'list' ? (
        <AdminProductList key={refreshKey} onEdit={handleEdit} />
      ) : (
        <ProductForm
          product={selectedProduct}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
