import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from '../../store/notificationSlice';
import NotificationBadge from './NotificationBadge';

describe('NotificationBadge', () => {
  const createMockStore = (unreadCount = 0) => {
    return configureStore({
      reducer: {
        notifications: notificationReducer
      },
      preloadedState: {
        notifications: {
          items: [],
          unreadCount
        }
      }
    });
  };

  test('renders notification badge button', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <NotificationBadge onClick={() => {}} />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('displays unread count when there are unread notifications', () => {
    const store = createMockStore(5);
    render(
      <Provider store={store}>
        <NotificationBadge onClick={() => {}} />
      </Provider>
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('displays 99+ when unread count exceeds 99', () => {
    const store = createMockStore(150);
    render(
      <Provider store={store}>
        <NotificationBadge onClick={() => {}} />
      </Provider>
    );
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('does not display count when there are no unread notifications', () => {
    const store = createMockStore(0);
    const { container } = render(
      <Provider store={store}>
        <NotificationBadge onClick={() => {}} />
      </Provider>
    );
    
    const badge = container.querySelector('.notification-badge-count');
    expect(badge).not.toBeInTheDocument();
  });
});
