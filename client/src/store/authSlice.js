import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '../api/http';

// Login user
export const login = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  try {
    const { data } = await http.post('/auth/login', payload);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

// Register user
export const register = createAsyncThunk('auth/register', async (payload, thunkAPI) => {
  try {
    const { data } = await http.post('/auth/register', payload);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Register failed');
  }
});

// Get current user profile
export const getProfile = createAsyncThunk('auth/profile', async (_, thunkAPI) => {
  try {
    const { data } = await http.get('/auth/me');
    return data.user;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load profile');
  }
});

// Update user profile
export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, thunkAPI) => {
  try {
    const { data } = await http.put('/auth/profile', payload);
    return data.user;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to update profile');
  }
});

const tokenFromStorage = localStorage.getItem('token');
const userFromStorage = localStorage.getItem('user');

const initialState = {
  user: userFromStorage ? JSON.parse(userFromStorage) : null,
  token: tokenFromStorage || null,
  loading: false,
  error: null,
  isAuthenticated: !!tokenFromStorage
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    const fulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      // API returns 'accessToken', not 'token'
      state.token = action.payload.accessToken || action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.accessToken || action.payload.token);
      state.error = null;
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Request failed';
    };
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, fulfilled)
      .addCase(register.rejected, rejected)
      // Get profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // If profile fetch fails, user might not be authenticated
        if (action.payload?.includes('401') || action.payload?.includes('authentication')) {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(updateProfile.rejected, rejected);
  },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
