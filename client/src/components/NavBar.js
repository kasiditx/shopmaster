import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { logout } from '../store/authSlice';
import NotificationBadge from './notification/NotificationBadge';
import NotificationList from './notification/NotificationList';

const NavBar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.qty, 0),
  );
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  return (
    <header className="nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl font-black bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              ShopMaster
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/cart" className="relative group">
              <span className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl">🛒</span>
                <span className="font-semibold text-gray-700 group-hover:text-primary-600">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </span>
            </Link>

            <Link to="/orders" className="px-4 py-2 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 hover:text-primary-600 transition-colors">
              Orders
            </Link>

            {user ? (
              <>
                <div className="relative" ref={notificationRef}>
                  <NotificationBadge onClick={toggleNotifications} />
                  {showNotifications && (
                    <NotificationList onClose={closeNotifications} />
                  )}
                </div>

                {user.role === 'admin' && (
                  <Link to="/admin" className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all">
                    Admin
                  </Link>
                )}

                <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
                  👋 {user.name}
                </span>

                <button
                  onClick={() => dispatch(logout())}
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:border-red-500 hover:text-red-600 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:border-primary-500 hover:text-primary-600 transition-all">
                  Login
                </Link>
                <Link to="/register" className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:shadow-lg transition-all">
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 animate-slide-up">
            <Link to="/cart" className="block px-4 py-3 rounded-lg hover:bg-gray-50 font-semibold">
              🛒 Cart ({cartCount})
            </Link>
            <Link to="/orders" className="block px-4 py-3 rounded-lg hover:bg-gray-50 font-semibold">
              Orders
            </Link>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                    Admin
                  </Link>
                )}
                <div className="px-4 py-3 bg-gray-100 rounded-lg font-medium">
                  👋 {user.name}
                </div>
                <button
                  onClick={() => dispatch(logout())}
                  className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 font-semibold hover:border-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-3 rounded-lg border-2 border-gray-200 font-semibold text-center">
                  Login
                </Link>
                <Link to="/register" className="block px-4 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-center">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
