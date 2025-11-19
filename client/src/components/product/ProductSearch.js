import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, fetchProducts } from '../../store/productSlice';

const ProductSearch = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector(state => state.products);
  const [searchTerm, setSearchTerm] = useState(filters.query || '');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search - wait 500ms after user stops typing
  useEffect(() => {
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.query) {
        dispatch(setFilters({ query: searchTerm }));
        dispatch(fetchProducts({ ...filters, query: searchTerm, page: 1 }));
      }
      setIsSearching(false);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [searchTerm, dispatch, filters]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilters({ query: searchTerm }));
    dispatch(fetchProducts({ ...filters, query: searchTerm, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    dispatch(setFilters({ query: '' }));
    dispatch(fetchProducts({ ...filters, query: '', page: 1 }));
  };

  // Popular searches (could be dynamic from backend)
  const popularSearches = ['Electronics', 'Clothing', 'Books', 'Sports'];

  return (
    <div className="mb-8 animate-slide-up">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative group">
          {/* Search icon */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl transition-transform group-focus-within:scale-110">
            {isSearching ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span className="text-gray-400">🔍</span>
            )}
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search for products, brands, or categories..."
            className="w-full pl-16 pr-36 md:pr-44 py-5 text-base md:text-lg font-medium bg-white border-2 border-transparent rounded-2xl shadow-soft transition-all duration-300 focus:border-primary-500 focus:shadow-strong focus:scale-[1.02] placeholder-gray-400"
          />

          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-28 md:right-36 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-sm font-semibold transition-all hover:scale-105"
              title="Clear search"
            >
              ✕
            </button>
          )}

          {/* Search button */}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 md:px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
          >
            <span className="hidden md:inline">Search</span>
            <span className="md:hidden">🔍</span>
          </button>
        </div>

        {/* Search suggestions */}
        {searchTerm && searchTerm.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-strong border border-gray-100 p-4 animate-scale-in">
            <div className="text-sm font-semibold text-gray-600 mb-2">
              Searching for: <span className="text-primary-600">"{searchTerm}"</span>
            </div>
          </div>
        )}
      </form>

      {/* Popular searches */}
      {!searchTerm && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => setSearchTerm(term)}
              className="px-4 py-2 bg-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 text-gray-700 hover:text-white rounded-full text-sm font-medium border border-gray-200 hover:border-transparent transition-all hover:shadow-md hover:scale-105"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
