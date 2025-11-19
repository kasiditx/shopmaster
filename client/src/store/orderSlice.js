import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '../api/http';

// Fetch user's orders
export const fetchMyOrders = createAsyncThunk('orders/fetchMine', async (_, thunkAPI) => {
  try {
    const { data } = await http.get('/orders');
    return data.orders;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load orders');
  }
});

// Fetch single order details
export const fetchOrderById = createAsyncThunk('orders/fetchById', async (orderId, thunkAPI) => {
  try {
    const { data } = await http.get(`/orders/${orderId}`);
    return data.order;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load order');
  }
});

// Create new order
export const createOrder = createAsyncThunk('orders/create', async (payload, thunkAPI) => {
  try {
    const { data } = await http.post('/orders', payload);
    return data.order;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to create order');
  }
});

// Cancel order
export const cancelOrder = createAsyncThunk('orders/cancel', async (orderId, thunkAPI) => {
  try {
    const { data } = await http.put(`/orders/${orderId}/cancel`);
    return data.order;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to cancel order');
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    currentOrder: null,
    loading: false,
    creating: false,
    error: null
  },
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch my orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Update order in list
        const index = state.items.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === action.payload._id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;

export default orderSlice.reducer;
