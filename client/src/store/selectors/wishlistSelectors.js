import { createSelector } from 'reselect';

// Base selectors
const selectWishlistState = (state) => state.wishlist;

// Memoized selectors
export const selectWishlistItems = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.items
);

export const selectWishlistLoading = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.loading
);

export const selectWishlistError = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.error
);

// Complex memoized selectors
export const selectWishlistItemCount = createSelector(
  [selectWishlistItems],
  (items) => items.length
);

export const selectIsInWishlist = (productId) =>
  createSelector([selectWishlistItems], (items) =>
    items.some((item) => item._id === productId || item.productId === productId)
  );

export const selectWishlistProductIds = createSelector(
  [selectWishlistItems],
  (items) => items.map((item) => item._id || item.productId)
);

export const selectInStockWishlistItems = createSelector(
  [selectWishlistItems],
  (items) => items.filter((item) => item.stock > 0)
);

export const selectOutOfStockWishlistItems = createSelector(
  [selectWishlistItems],
  (items) => items.filter((item) => item.stock === 0)
);
