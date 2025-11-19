import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '../api/http';

// Fetch products with search, filters, and pagination
export const fetchProducts = createAsyncThunk('products/fetch', async (params = {}, thunkAPI) => {
  try {
    const { query, category, minPrice, maxPrice, minRating, page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    
    if (query) queryParams.append('query', query);
    if (category) queryParams.append('category', category);
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    if (minRating) queryParams.append('minRating', minRating);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const { data } = await http.get(`/products?${queryParams.toString()}`);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load products');
  }
});

// Fetch single product details
export const fetchProductById = createAsyncThunk('products/fetchById', async (id, thunkAPI) => {
  try {
    const { data } = await http.get(`/products/${id}`);
    return data.product;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load product');
  }
});

// Fetch product reviews
export const fetchProductReviews = createAsyncThunk('products/fetchReviews', async ({ productId, page = 1 }, thunkAPI) => {
  try {
    const { data } = await http.get(`/products/${productId}/reviews?page=${page}`);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load reviews');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    // Normalized state: products stored by ID
    byId: {},
    allIds: [],
    currentProductId: null,
    reviews: [],
    loading: false,
    productLoading: false,
    reviewsLoading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      limit: 20
    },
    filters: {
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      minRating: ''
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        query: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        minRating: ''
      };
    },
    clearCurrentProduct: (state) => {
      state.currentProductId = null;
      state.reviews = [];
    },
    // Add product to normalized state
    addProduct: (state, action) => {
      const product = action.payload;
      state.byId[product._id] = product;
      if (!state.allIds.includes(product._id)) {
        state.allIds.push(product._id);
      }
    },
    // Update product in normalized state
    updateProduct: (state, action) => {
      const product = action.payload;
      if (state.byId[product._id]) {
        state.byId[product._id] = { ...state.byId[product._id], ...product };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        const products = action.payload.products || action.payload;
        
        // Normalize products
        state.byId = {};
        state.allIds = [];
        products.forEach((product) => {
          state.byId[product._id] = product;
          state.allIds.push(product._id);
        });
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.productLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.productLoading = false;
        const product = action.payload;
        state.byId[product._id] = product;
        state.currentProductId = product._id;
        if (!state.allIds.includes(product._id)) {
          state.allIds.push(product._id);
        }
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.productLoading = false;
        state.error = action.payload;
      })
      // Fetch product reviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.reviewsLoading = true;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.reviews = action.payload.reviews || action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentProduct, addProduct, updateProduct } = productSlice.actions;

export default productSlice.reducer;
