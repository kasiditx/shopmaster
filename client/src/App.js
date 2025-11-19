import './App.css';
import './styles/theme.css';
import { Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useStore } from 'react-redux';
import NavBar from './components/NavBar';
import PrivateRoute from './components/auth/PrivateRoute';
import socketService from './services/socketService';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '400px',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>
);

function App() {
  const store = useStore();
  const { user } = useSelector((state) => state.auth);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (user) {
      socketService.connect(store);
    } else {
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [user, store]);

  return (
    <div className="layout">
      <NavBar />
      <main>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/cart" 
              element={
                <PrivateRoute>
                  <CartPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <PrivateRoute>
                  <CheckoutPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <PrivateRoute>
                  <OrdersPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/orders/:orderId" 
              element={
                <PrivateRoute>
                  <OrdersPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/wishlist" 
              element={
                <PrivateRoute>
                  <WishlistPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
