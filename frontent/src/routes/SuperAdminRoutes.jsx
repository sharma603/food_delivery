// SuperAdminRoutes Component
// This file structure created as per requested organization
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import SuperAdminLayout from '../components/superadmin/layout/SuperAdminLayout';
import { useAuth } from '../context/AuthContext';

// Import System Administration Components
import { 
  SystemDashboard, 
  MenuManagement, 
  PageManagement,
  UserManagement,
  PlatformSettings,
  Notifications,
  Security
} from '../components/superadmin/SystemAdministration';

// Import Order Management Components
import { 
  AllOrders, 
  OrderStatus,
  OrderMonitoring, 
  OrderAnalytics, 
  OrderDisputes, 
  RefundManagement 
} from '../components/superadmin/order-management';

// Import SuperAdmin Components
import SuperAdminDashboard from '../components/superadmin/Dashboard/Dashboard';
import RestaurantList from '../components/superadmin/RestaurantManagement/RestaurantList';
import AddRestaurant from '../components/superadmin/RestaurantManagement/AddRestaurant';
import RestaurantVerification from '../components/superadmin/RestaurantManagement/RestaurantVerification';
import SuperAdminRestaurantAnalytics from '../components/superadmin/RestaurantManagement/RestaurantAnalytics';
import AddMenuItem from '../components/superadmin/MenuManagement/AddMenuItem';
import AllMenuItems from '../components/superadmin/MenuManagement/AllMenuItems';
import Categories from '../components/superadmin/MenuManagement/Categories';

// Customer Management Components
import AllCustomers from '../components/superadmin/CustomerManagement/AllCustomers';
import CustomerAnalytics from '../components/superadmin/CustomerManagement/CustomerAnalytics';
import CustomerSupport from '../components/superadmin/CustomerManagement/CustomerSupport';
import CustomerReviews from '../components/superadmin/CustomerManagement/CustomerReviews';
import CustomerSegments from '../components/superadmin/CustomerManagement/CustomerSegments';

// Financial Management Components
import { 
  FinancialDashboard,
  CommissionSystem,
  PaymentProcessing,
  RevenueAnalytics,
  Settlements
} from '../components/superadmin/finance';

// Delivery Management Components
import ZoneManagement from '../components/superadmin/delivery/ZoneManagement';
import PersonnelManagement from '../components/superadmin/delivery/PersonnelManagement';
import LiveTracking from '../components/superadmin/delivery/LiveTracking';
import PerformanceAnalytics from '../components/superadmin/delivery/PerformanceAnalytics';

const SuperAdminRoutes = () => {
  const { user, logout } = useAuth();
  
  return (
    <Routes>
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <SuperAdminDashboard user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/restaurants" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <RestaurantList user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/restaurants/add" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <AddRestaurant user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/restaurants/verification" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <RestaurantVerification user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/restaurants/analytics" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <SuperAdminRestaurantAnalytics user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Menu Management Routes */}
      <Route path="/menu/add-item" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <AddMenuItem user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/menu/items" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <AllMenuItems user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/menu/categories" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <Categories user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Customer Management Routes */}
      <Route path="/customers" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <AllCustomers user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/customers/analytics" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <CustomerAnalytics user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/customers/support" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <CustomerSupport user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/customers/reviews" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <CustomerReviews user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/customers/segments" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <CustomerSegments user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Order Management Routes */}
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <AllOrders user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders/status" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <OrderStatus user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders/monitoring" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <OrderMonitoring user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders/analytics" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <OrderAnalytics user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders/disputes" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <OrderDisputes user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders/refunds" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <RefundManagement user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      {/* Financial Management Routes */}
      <Route path="/finance" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <FinancialDashboard user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finance/commission" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <CommissionSystem user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finance/payments" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <PaymentProcessing user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finance/revenue" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <RevenueAnalytics user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finance/settlements" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <Settlements user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      {/* Delivery Management Routes */}
      <Route path="/delivery/zones" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <ZoneManagement user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/delivery/personnel" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <PersonnelManagement user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/delivery/tracking" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <LiveTracking user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/delivery/analytics" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <PerformanceAnalytics user={user} onLogout={logout} />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      {/* System Administration Routes */}
      <Route path="/system/dashboard" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <SystemDashboard />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/system/menu" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <MenuManagement />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/system/pages" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <PageManagement />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/system/users" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <UserManagement />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/system/settings" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <PlatformSettings />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/system/notifications" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <Notifications />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/system/security" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout user={user} onLogout={logout}>
            <Security />
          </SuperAdminLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default SuperAdminRoutes;
