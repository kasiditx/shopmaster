import { createSelector } from 'reselect';

// Base selectors
const selectProductsState = (state) => state.products;

// Memoized selectors
export const selectProductsById = createSelector(
  [selectProductsState],
  (productsState) => productsState.byId
);

export const selectProductIds = createSelector(
  [selectProductsState],
  (productsState) => productsState.allIds
);

export const selectProducts = createSelector(
  [selectProductsById, selectProductIds],
  (byId, allIds) => allIds.map((id) => byId[id])
);

export const selectCurrentProductId = createSelector(
  [selectProductsState],
  (productsState) => productsState.currentProductId
);

export const selectCurrentProduct = createSelector(
  [selectProductsById, selectCurrentProductId],
  (byId, currentProductId) => (currentProductId ? byId[currentProductId] : null)
);

export const selectProductReviews = createSelector(
  [selectProductsState],
  (productsState) => productsState.reviews
);

export const selectProductsLoading = createSelector(
  [selectProductsState],
  (productsState) => productsState.loading
);

export const selectProductLoading = createSelector(
  [selectProductsState],
  (productsState) => productsState.productLoading
);

export const selectReviewsLoading = createSelector(
  [selectProductsState],
  (productsState) => productsState.reviewsLoading
);

export const selectProductsError = createSelector(
  [selectProductsState],
  (productsState) => productsState.error
);

export const selectPagination = createSelector(
  [selectProductsState],
  (productsState) => productsState.pagination
);

export const selectFilters = createSelector(
  [selectProductsState],
  (productsState) => productsState.filters
);

// Complex memoized selectors
export const selectFilteredProducts = createSelector(
  [selectProducts, selectFilters],
  (products, filters) => {
    if (!products || products.length === 0) return products;
    
    let filtered = [...products];
    
    // Apply client-side filtering if needed (usually done server-side)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }
    
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }
    
    if (filters.minPrice) {
      filtered = filtered.filter((p) => p.price >= parseFloat(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter((p) => p.price <= parseFloat(filters.maxPrice));
    }
    
    if (filters.minRating) {
      filtered = filtered.filter((p) => p.averageRating >= parseFloat(filters.minRating));
    }
    
    return filtered;
  }
);

export const selectProductById = (productId) =>
  createSelector([selectProductsById], (byId) => byId[productId]);

export const selectInStockProducts = createSelector(
  [selectProducts],
  (products) => products.filter((p) => p.stock > 0)
);

export const selectOutOfStockProducts = createSelector(
  [selectProducts],
  (products) => products.filter((p) => p.stock === 0)
);

export const selectProductCategories = createSelector(
  [selectProducts],
  (products) => {
    const categories = new Set();
    products.forEach((p) => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories).sort();
  }
);

export const selectPriceRange = createSelector(
  [selectProducts],
  (products) => {
    if (!products || products.length === 0) {
      return { min: 0, max: 0 };
    }
    
    const prices = products.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }
);
