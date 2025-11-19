import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markAllAsRead, clearNotifications } from '../../store/notificationSlice';
import NotificationItem from './NotificationItem';
import './NotificationList.css';

const NotificationList = ({ onClose }) => {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
  };

  return (
    <div className="notification-list">
      <div className="notification-list-header">
        <h3>Notifications</h3>
        <button 
          className="notification-list-close"
          onClick={onClose}
          aria-label="Close notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="notification-list-actions">
          {unreadCount > 0 && (
            <button 
              className="notification-action-btn"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
          <button 
            className="notification-action-btn"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        </div>
      )}

      <div className="notification-list-content">
        {notifications.length === 0 ? (
          <div className="notification-list-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
