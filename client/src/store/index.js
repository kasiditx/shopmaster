import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import products from './productSlice';
import cart from './cartSlice';
import orders from './orderSlice';
import wishlist from './wishlistSlice';
import notifications from './notificationSlice';

const store = configureStore({
  reducer: {
    auth,
    products,
    cart,
    orders,
    wishlist,
    notifications
  },
});

export default store;
