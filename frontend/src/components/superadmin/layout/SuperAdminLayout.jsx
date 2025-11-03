import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { MobileMenuButton } from '../../common/Sidebar';
import { Utensils } from 'lucide-react';
import './superadmin-responsive.css';

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
    <div className="min-h-screen bg-gray-50 flex superadmin-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

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
        <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 superadmin-header">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <MobileMenuButton onClick={handleSidebarToggle} />
            <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-4 flex-wrap ml-auto">
              <div className="hidden sm:block text-xs sm:text-sm text-gray-600 truncate max-w-[120px] lg:max-w-none">
                Welcome to HypeBridge Admin
              </div>
              {user && (
                <>
                  <div className="hidden sm:block text-xs sm:text-sm text-gray-600 truncate max-w-[100px] lg:max-w-none">
                    {user.name || user.email}
                  </div>
                  <div className="sm:hidden text-xs text-gray-600 truncate max-w-[80px]">
                    {user.name ? user.name.split(' ')[0] : user.email?.split('@')[0]}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto superadmin-content pb-4 sm:pb-6">
          <div className="w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
