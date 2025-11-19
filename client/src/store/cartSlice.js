import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '../api/http';

// Fetch cart from server
export const fetchCart = createAsyncThunk('cart/fetch', async (_, thunkAPI) => {
  try {
    const { data } = await http.get('/cart');
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load cart');
  }
});

// Add item to cart
export const addToCart = createAsyncThunk('cart/add', async ({ productId, quantity = 1 }, thunkAPI) => {
  try {
    const { data } = await http.post('/cart/items', { productId, quantity });
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

// Update cart item quantity
export const updateCartItem = createAsyncThunk('cart/update', async ({ productId, quantity }, thunkAPI) => {
  try {
    const { data } = await http.put(`/cart/items/${productId}`, { quantity });
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to update cart');
  }
});

// Remove item from cart
export const removeFromCart = createAsyncThunk('cart/remove', async (productId, thunkAPI) => {
  try {
    const { data } = await http.delete(`/cart/items/${productId}`);
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to remove from cart');
  }
});

// Clear cart
export const clearCart = createAsyncThunk('cart/clear', async (_, thunkAPI) => {
  try {
    const { data } = await http.delete('/cart');
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    subtotal: 0,
    tax: 0,
    shippingCost: 0,
    total: 0,
    loading: false,
    error: null
  },
  reducers: {
    // Local cart operations for guest users
    addToCartLocal: (state, action) => {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) {
        existing.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }
    },
    updateQtyLocal: (state, action) => {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },
    removeFromCartLocal: (state, action) => {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },
    clearCartLocal: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.shippingCost = 0;
      state.total = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [];
        state.subtotal = 0;
        state.tax = 0;
        state.shippingCost = 0;
        state.total = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addToCartLocal, updateQtyLocal, removeFromCartLocal, clearCartLocal } = cartSlice.actions;

export default cartSlice.reducer;
