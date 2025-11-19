import { createSelector } from 'reselect';

// Base selectors
const selectNotificationState = (state) => state.notifications;

// Memoized selectors
export const selectNotifications = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.items
);

export const selectUnreadCount = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.unreadCount
);

// Complex memoized selectors
export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter((n) => !n.read)
);

export const selectReadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter((n) => n.read)
);

export const selectRecentNotifications = createSelector(
  [selectNotifications],
  (notifications) => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return sorted.slice(0, 10);
  }
);

export const selectNotificationsByType = (type) =>
  createSelector([selectNotifications], (notifications) =>
    notifications.filter((n) => n.type === type)
  );

export const selectHasUnreadNotifications = createSelector(
  [selectUnreadCount],
  (unreadCount) => unreadCount > 0
);
