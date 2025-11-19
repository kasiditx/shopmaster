import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productSlice';
import { fetchWishlist } from '../store/wishlistSlice';
import ProductSearch from '../components/product/ProductSearch';
import ProductFilter from '../components/product/ProductFilter';
import ProductList from '../components/product/ProductList';

const HomePage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // Fetch products on mount
    dispatch(fetchProducts({ page: 1 }));
    
    // Fetch wishlist if authenticated
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 md:mb-12 p-6 md:p-12 bg-gradient-to-br from-white/95 to-white/90 rounded-3xl shadow-strong backdrop-blur-lg border border-white/50 animate-fade-in">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent tracking-tight">
          Discover Amazing Products
        </h1>
        <p className="text-base md:text-lg text-gray-600 font-medium max-w-2xl">
          Find the perfect items at unbeatable prices. Shop with confidence.
        </p>
      </div>

      {/* Search bar */}
      <ProductSearch />

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
        {/* Sidebar - Filters (hidden on mobile, shown in modal) */}
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <ProductFilter />
        </aside>

        {/* Main content - Product list */}
        <main className="min-h-screen">
          <ProductList />
        </main>
      </div>
    </div>
  );
};

export default HomePage;
