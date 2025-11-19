import { createSelector } from 'reselect';

// Base selectors
const selectOrderState = (state) => state.orders;

// Memoized selectors
export const selectOrders = createSelector(
  [selectOrderState],
  (orderState) => orderState.items
);

export const selectCurrentOrder = createSelector(
  [selectOrderState],
  (orderState) => orderState.currentOrder
);

export const selectOrdersLoading = createSelector(
  [selectOrderState],
  (orderState) => orderState.loading
);

export const selectOrderLoading = createSelector(
  [selectOrderState],
  (orderState) => orderState.orderLoading
);

export const selectOrdersError = createSelector(
  [selectOrderState],
  (orderState) => orderState.error
);

// Complex memoized selectors
export const selectOrderById = (orderId) =>
  createSelector([selectOrders], (orders) =>
    orders.find((order) => order._id === orderId)
  );

export const selectOrdersByStatus = (status) =>
  createSelector([selectOrders], (orders) =>
    orders.filter((order) => order.status === status)
  );

export const selectPendingOrders = createSelector(
  [selectOrders],
  (orders) => orders.filter((order) => order.status === 'pending')
);

export const selectCompletedOrders = createSelector(
  [selectOrders],
  (orders) => orders.filter((order) => order.status === 'delivered')
);

export const selectRecentOrders = createSelector(
  [selectOrders],
  (orders) => {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted.slice(0, 5);
  }
);

export const selectOrdersCount = createSelector(
  [selectOrders],
  (orders) => orders.length
);

export const selectTotalSpent = createSelector(
  [selectOrders],
  (orders) =>
    orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.total, 0)
);
