import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, clearFilters, fetchProducts } from '../../store/productSlice';

const ProductFilter = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector(state => state.products);
  
  const [localFilters, setLocalFilters] = useState(filters);

  const categories = [
    { value: 'Electronics', icon: '💻', color: 'blue' },
    { value: 'Clothing', icon: '👕', color: 'pink' },
    { value: 'Books', icon: '📚', color: 'yellow' },
    { value: 'Home & Garden', icon: '🏡', color: 'green' },
    { value: 'Sports', icon: '⚽', color: 'orange' },
    { value: 'Toys', icon: '🧸', color: 'purple' },
    { value: 'Food & Beverage', icon: '🍔', color: 'red' },
    { value: 'Health & Beauty', icon: '💄', color: 'indigo' }
  ];

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters));
    dispatch(fetchProducts({ ...localFilters, page: 1 }));
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      minRating: ''
    };
    setLocalFilters(emptyFilters);
    dispatch(clearFilters());
    dispatch(fetchProducts({ page: 1 }));
  };

  const hasActiveFilters = localFilters.category || localFilters.minPrice || localFilters.maxPrice || localFilters.minRating;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <span>🎯</span>
          <span>Filters</span>
        </h3>
        {hasActiveFilters && (
          <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Category filter */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            📂 Category
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 font-medium cursor-pointer transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 hover:border-gray-300"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.value}
              </option>
            ))}
          </select>
        </div>

        {/* Price range filter */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            💰 Price Range
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 font-medium transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 placeholder-gray-400"
              />
            </div>
            <span className="text-gray-400 font-bold">—</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 font-medium transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Rating filter */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            ⭐ Minimum Rating
          </label>
          <div className="space-y-2">
            {[
              { value: '', label: 'Any Rating', stars: '⭐⭐⭐⭐⭐' },
              { value: '4', label: '4+ Stars', stars: '⭐⭐⭐⭐' },
              { value: '3', label: '3+ Stars', stars: '⭐⭐⭐' },
              { value: '2', label: '2+ Stars', stars: '⭐⭐' },
              { value: '1', label: '1+ Stars', stars: '⭐' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('minRating', option.value)}
                className={`w-full px-4 py-3 rounded-xl font-semibold text-left transition-all ${
                  localFilters.minRating === option.value
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>{option.label}</span>
                  <span className="text-sm">{option.stars}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-6 border-t-2 border-gray-100 space-y-3">
          <button
            onClick={handleApplyFilters}
            className="w-full py-4 px-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="flex items-center justify-center space-x-2">
              <span>✓</span>
              <span>Apply Filters</span>
            </span>
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full py-4 px-6 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:border-red-500 hover:text-red-600 transition-all"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>✕</span>
                <span>Clear All Filters</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;
