import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
// Removed custom CSS import - now using Tailwind CSS exclusively
import { 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  UtensilsCrossed, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Bell,
  ChefHat,
  Package, 
  Tag, 
  Clock, 
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const RestaurantLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/restaurant/dashboard',
      icon: Home,
      current: location.pathname === '/restaurant/dashboard'
    },
    {
      name: 'Orders',
      href: '/restaurant/orders',
      icon: ShoppingBag,
      current: location.pathname === '/restaurant/orders'
    },
    {
      name: 'Menu Management',
      href: '/restaurant/menu',
      icon: UtensilsCrossed,
      current: location.pathname === '/restaurant/menu'
    },
    {
      name: 'Analytics',
      href: '/restaurant/analytics',
      icon: BarChart3,
      current: location.pathname === '/restaurant/analytics'
    },
    {
      name: 'Promotions',
      href: '/restaurant/promotions',
      icon: Tag,
      current: location.pathname === '/restaurant/promotions'
    },
    {
      name: 'Settings',
      href: '/restaurant/settings',
      icon: Settings,
      current: location.pathname === '/restaurant/settings'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex restaurant-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 restaurant-sidebar
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold text-gray-900 truncate">HypeBridge</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 sm:mt-6 px-2 sm:px-3 pb-20 sm:pb-24">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors
                    ${item.current 
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`
                    mr-2 sm:mr-3 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5
                    ${item.current ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-3 sm:p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {user?.restaurantName || user?.name || 'Restaurant Owner'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-2 sm:mr-3 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="hidden sm:inline">Sign out</span>
            <span className="sm:hidden">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 restaurant-header">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 sm:p-2 -ml-1 sm:-ml-2"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-4 ml-auto">
              <button className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 relative" aria-label="Notifications">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-0.5 right-0.5 sm:top-0 sm:right-0 block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-400"></span>
              </button>
              
              <div className="hidden sm:block">
                <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] lg:max-w-none">
                  Welcome back, {user?.restaurantName || 'Restaurant'}!
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto restaurant-content pb-4 sm:pb-6">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RestaurantLayout;
