import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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
  Users,
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
      name: 'Customers',
      href: '/restaurant/customers',
      icon: Users,
      current: location.pathname === '/restaurant/customers'
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
    <div className="min-h-screen bg-gray-50 flex">
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HypeBridge</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${item.current 
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 flex-shrink-0 w-5 h-5
                    ${item.current ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.restaurantName || user?.name || 'Restaurant Owner'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || 'restaurant@example.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 flex-shrink-0 w-5 h-5 text-gray-400" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              
              <div className="hidden sm:block">
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.restaurantName || 'Restaurant'}!
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RestaurantLayout;
