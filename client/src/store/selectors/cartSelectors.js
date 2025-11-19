import { createSelector } from 'reselect';

// Base selectors
const selectCartState = (state) => state.cart;

// Memoized selectors
export const selectCartItems = createSelector(
  [selectCartState],
  (cartState) => cartState.items
);

export const selectCartSubtotal = createSelector(
  [selectCartState],
  (cartState) => cartState.subtotal
);

export const selectCartTax = createSelector(
  [selectCartState],
  (cartState) => cartState.tax
);

export const selectCartShippingCost = createSelector(
  [selectCartState],
  (cartState) => cartState.shippingCost
);

export const selectCartTotal = createSelector(
  [selectCartState],
  (cartState) => cartState.total
);

export const selectCartLoading = createSelector(
  [selectCartState],
  (cartState) => cartState.loading
);

export const selectCartError = createSelector(
  [selectCartState],
  (cartState) => cartState.error
);

// Complex memoized selectors
export const selectCartItemCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartItemsCount = createSelector(
  [selectCartItems],
  (items) => items.length
);

export const selectIsCartEmpty = createSelector(
  [selectCartItems],
  (items) => items.length === 0
);

export const selectCartItemById = (productId) =>
  createSelector([selectCartItems], (items) =>
    items.find((item) => item.productId === productId)
  );

export const selectCartSummary = createSelector(
  [selectCartSubtotal, selectCartTax, selectCartShippingCost, selectCartTotal, selectCartItemCount],
  (subtotal, tax, shippingCost, total, itemCount) => ({
    subtotal,
    tax,
    shippingCost,
    total,
    itemCount,
  })
);

export const selectCartWithDetails = createSelector(
  [selectCartItems, selectCartSummary, selectCartLoading, selectCartError],
  (items, summary, loading, error) => ({
    items,
    ...summary,
    loading,
    error,
  })
);
