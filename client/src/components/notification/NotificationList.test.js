import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from '../../store/notificationSlice';
import NotificationList from './NotificationList';

describe('NotificationList', () => {
  const createMockStore = (items = []) => {
    return configureStore({
      reducer: {
        notifications: notificationReducer
      },
      preloadedState: {
        notifications: {
          items,
          unreadCount: items.filter(n => !n.read).length
        }
      }
    });
  };

  test('renders empty state when there are no notifications', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <NotificationList onClose={() => {}} />
      </Provider>
    );
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  test('renders notification items when notifications exist', () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'success',
        title: 'Test Notification',
        message: 'This is a test',
        read: false,
        timestamp: new Date().toISOString()
      }
    ];
    
    const store = createMockStore(mockNotifications);
    render(
      <Provider store={store}>
        <NotificationList onClose={() => {}} />
      </Provider>
    );
    
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <NotificationList onClose={mockOnClose} />
      </Provider>
    );
    
    const closeButton = screen.getByLabelText('Close notifications');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('displays mark all as read button when there are unread notifications', () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'info',
        title: 'Unread',
        message: 'Test',
        read: false,
        timestamp: new Date().toISOString()
      }
    ];
    
    const store = createMockStore(mockNotifications);
    render(
      <Provider store={store}>
        <NotificationList onClose={() => {}} />
      </Provider>
    );
    
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
  });
});
