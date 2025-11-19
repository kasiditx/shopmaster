import { createSelector } from 'reselect';

// Base selectors
const selectAuthState = (state) => state.auth;

// Memoized selectors
export const selectUser = createSelector(
  [selectAuthState],
  (authState) => authState.user
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (authState) => authState.isAuthenticated
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (authState) => authState.loading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (authState) => authState.error
);

export const selectToken = createSelector(
  [selectAuthState],
  (authState) => authState.token
);

// Complex memoized selectors
export const selectIsAdmin = createSelector(
  [selectUser],
  (user) => user?.role === 'admin'
);

export const selectUserName = createSelector(
  [selectUser],
  (user) => user?.name || 'Guest'
);

export const selectUserEmail = createSelector(
  [selectUser],
  (user) => user?.email
);

export const selectUserAddress = createSelector(
  [selectUser],
  (user) => user?.address
);
