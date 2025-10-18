import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { MobileMenuButton } from '../../common/Sidebar';
import { Utensils } from 'lucide-react';

const SuperAdminLayout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine active item based on current route
  const getActiveItem = useCallback(() => {
    const path = location.pathname;
    
    if (path.includes('/orders')) return 'Order Management';
    if (path.includes('/restaurants')) return 'Restaurant Management';
    if (path.includes('/delivery')) return 'Delivery Management';
    if (path.includes('/finance')) return 'Financial Management';
    if (path.includes('/customers')) return 'Customer Management';
    if (path.includes('/menu')) return 'Menu & Pricing';
    if (path.includes('/reports')) return 'Reports & Analytics';
    if (path.includes('/system')) return 'System Administration';
    if (path.includes('/communication')) return 'Communication Tools';
    
    return 'Dashboard';
  }, [location.pathname]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        activeItem={getActiveItem()}
        brandName="HypeBridge Admin"
        brandIcon={Utensils}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <MobileMenuButton onClick={handleSidebarToggle} />
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome to HypeBridge Admin
              </div>
              {user && (
                <div className="text-sm text-gray-600">
                  {user.name || user.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
