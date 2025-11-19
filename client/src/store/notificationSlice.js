import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0
  },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift({
        id: Date.now(),
        ...action.payload,
        read: false,
        timestamp: new Date().toISOString()
      });
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const notification = state.items.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => n.read = true);
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const notification = state.items.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    }
  }
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications
} = notificationSlice.actions;

export default notificationSlice.reducer;
