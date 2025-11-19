import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { lazy, Suspense, useState } from 'react';

// Lazy load admin pages
const AdminProductsPage = lazy(() => import('./AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('./AdminOrdersPage'));
const AdminInventoryPage = lazy(() => import('./AdminInventoryPage'));
const AdminReportsPage = lazy(() => import('./AdminReportsPage'));

// Loading fallback
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-bounce">⏳</div>
      <p className="text-lg font-semibold text-gray-600">Loading admin panel...</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="text-center bg-white rounded-3xl p-12 shadow-strong max-w-md animate-scale-in">
          <div className="text-8xl mb-6">🚫</div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">You do not have permission to access the admin dashboard.</p>
          <Link 
            to="/" 
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin/products', icon: '📦', label: 'Products' },
    { path: '/admin/orders', icon: '🛒', label: 'Orders' },
    { path: '/admin/inventory', icon: '📊', label: 'Inventory' },
    { path: '/admin/reports', icon: '📈', label: 'Reports' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="flex">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-20 left-4 z-50 p-3 bg-white rounded-xl shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 shadow-lg z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
                Admin Panel
              </h2>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-600 mb-2">Quick Stats</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-bold">-</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending Orders</span>
                  <span className="font-bold">-</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Suspense fallback={<AdminLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/admin/products" replace />} />
              <Route path="/products" element={<AdminProductsPage />} />
              <Route path="/orders" element={<AdminOrdersPage />} />
              <Route path="/inventory" element={<AdminInventoryPage />} />
              <Route path="/reports" element={<AdminReportsPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
