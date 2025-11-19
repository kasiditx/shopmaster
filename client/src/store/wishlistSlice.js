import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '../api/http';

// Fetch user's wishlist
export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, thunkAPI) => {
  try {
    const { data } = await http.get('/wishlist');
    return data.wishlist;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load wishlist');
  }
});

// Add product to wishlist
export const addToWishlist = createAsyncThunk('wishlist/add', async (productId, thunkAPI) => {
  try {
    const { data } = await http.post(`/wishlist/${productId}`);
    return data.wishlist;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to add to wishlist');
  }
});

// Remove product from wishlist
export const removeFromWishlist = createAsyncThunk('wishlist/remove', async (productId, thunkAPI) => {
  try {
    const { data } = await http.delete(`/wishlist/${productId}`);
    return data.wishlist;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to remove from wishlist');
  }
});

// Move product from wishlist to cart
export const moveToCart = createAsyncThunk('wishlist/moveToCart', async (productId, thunkAPI) => {
  try {
    const { data } = await http.post(`/wishlist/${productId}/move-to-cart`);
    return { wishlist: data.wishlist, cart: data.cart };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to move to cart');
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Move to cart
      .addCase(moveToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moveToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.wishlist || [];
      })
      .addCase(moveToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;
