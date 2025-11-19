import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/productSlice';
import ProductCard from './ProductCard';

const ProductList = () => {
  const dispatch = useDispatch();
  const { items, loading, error, pagination, filters } = useSelector(state => state.products);

  const handlePageChange = (newPage) => {
    dispatch(fetchProducts({ ...filters, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="text-center py-20 px-10 bg-white rounded-2xl shadow-soft border border-gray-100 animate-pulse">
        <div className="text-6xl mb-4">⏳</div>
        <div className="text-lg font-semibold text-gray-600">Loading amazing products...</div>
        <div className="mt-4 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 px-10 bg-red-50 rounded-2xl shadow-soft border-2 border-red-200 animate-slide-up">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-xl font-bold text-red-800 mb-2">Oops! Something went wrong</div>
        <div className="text-red-600">{error}</div>
        <button 
          onClick={() => dispatch(fetchProducts({ ...filters, page: 1 }))}
          className="mt-6 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20 px-10 bg-white rounded-2xl shadow-soft border border-gray-100 animate-slide-up">
        <div className="text-6xl mb-4">🔍</div>
        <div className="text-2xl font-bold text-gray-900 mb-2">No products found</div>
        <div className="text-gray-600 mb-6">
          Try adjusting your filters or search terms
        </div>
        <button 
          onClick={() => {
            dispatch(fetchProducts({ page: 1 }));
          }}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          View All Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-soft border border-gray-100">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📦</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {pagination?.totalItems || 0} Products Found
            </h2>
            <p className="text-sm text-gray-600">
              Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}
            </p>
          </div>
        </div>
        
        {/* Sort options (future enhancement) */}
        <div className="hidden md:flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            <option>Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Popular</option>
          </select>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product, index) => (
          <div 
            key={product._id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="animate-scale-in"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center space-y-4 bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-center flex-wrap gap-2">
            {/* Previous button */}
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                pagination.currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              ← Prev
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => {
                const showPage = 
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - pagination.currentPage) <= 1;

                if (!showPage) {
                  if (page === 2 && pagination.currentPage > 3) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  if (page === pagination.totalPages - 1 && pagination.currentPage < pagination.totalPages - 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[44px] px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      page === pagination.currentPage
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg scale-110'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                pagination.currentPage === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              Next →
            </button>
          </div>

          {/* Results info */}
          <div className="text-center text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-gray-900">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> - <span className="font-bold text-gray-900">{Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}</span> of <span className="font-bold text-primary-600">{pagination.totalItems}</span> products
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
