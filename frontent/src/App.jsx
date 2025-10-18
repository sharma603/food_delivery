import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth Components
import RestaurantLogin from './components/restaurant/RestaurantLogin';
import SuperAdminLogin from './components/superadmin/SuperAdminLogin';

// Restaurant Components
import RestaurantLayout from './components/restaurant/layout/RestaurantLayout';
import RestaurantDashboard from './components/restaurant/Dashboard/Dashboard';
import RestaurantAnalytics from './components/restaurant/Analytics/RestaurantAnalytics';
import MenuManagement from './components/restaurant/Menu/MenuManagement';
import RestaurantAddMenuItem from './components/restaurant/Menu/AddMenuItem';
import RestaurantAllMenuItems from './components/restaurant/Menu/AllMenuItems';
import Promotions from './components/restaurant/Promotions/Promotions';
import OrdersManagement from './components/restaurant/Orders/OrdersManagement';
import CustomersManagement from './components/restaurant/Customers/CustomersManagement';
import RestaurantSettings from './components/restaurant/Settings/RestaurantSettings';

// SuperAdmin Components - Using SuperAdminRoutes instead of individual imports
// import SuperAdminLayout from './components/superadmin/layout/SuperAdminLayout';
// import SuperAdminDashboard from './components/superadmin/Dashboard/Dashboard';
// import RestaurantList from './components/superadmin/RestaurantManagement/RestaurantList';
// import AddRestaurant from './components/superadmin/RestaurantManagement/AddRestaurant';
// import RestaurantVerification from './components/superadmin/RestaurantManagement/RestaurantVerification';
// import SuperAdminRestaurantAnalytics from './components/superadmin/RestaurantManagement/RestaurantAnalytics';
// import AddMenuItem from './components/superadmin/MenuManagement/AddMenuItem';
// import AllMenuItems from './components/superadmin/MenuManagement/AllMenuItems';
// import Categories from './components/superadmin/MenuManagement/Categories';

// Customer Management Components - Using SuperAdminRoutes instead of individual imports
// import AllCustomers from './components/superadmin/CustomerManagement/AllCustomers';
// import CustomerAnalytics from './components/superadmin/CustomerManagement/CustomerAnalytics';
// import CustomerSupport from './components/superadmin/CustomerManagement/CustomerSupport';
// import CustomerReviews from './components/superadmin/CustomerManagement/CustomerReviews';
// import CustomerSegments from './components/superadmin/CustomerManagement/CustomerSegments';

// Import SuperAdminRoutes
import SuperAdminRoutes from './routes/SuperAdminRoutes';

// Notification Display Component
const NotificationDisplay = () => {
  const { notifications, removeNotification } = useNotification();
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/restaurant/login" replace />} />
          <Route path="/restaurant/login" element={<RestaurantLogin />} />
          <Route path="/admin/login" element={<SuperAdminLogin />} />

          {/* Restaurant Routes */}
          <Route
            path="/restaurant"
            element={
              <ProtectedRoute allowedRoles={['restaurant']}>
                <RestaurantLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<RestaurantDashboard />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="menu/add-item" element={<RestaurantAddMenuItem />} />
            <Route path="menu/items" element={<RestaurantAllMenuItems />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="analytics" element={<RestaurantAnalytics />} />
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="settings" element={<RestaurantSettings />} />
            {/* Add more routes as you build them */}
          </Route>

          {/* SuperAdmin Routes - All admin routes are handled by SuperAdminRoutes */}

          {/* SuperAdmin System Administration Routes */}
          <Route path="/admin/*" element={<SuperAdminRoutes />} />

          {/* 404 */}
          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
        </BrowserRouter>
        <NotificationDisplay />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
