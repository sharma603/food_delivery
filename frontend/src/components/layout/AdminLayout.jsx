// UNUSED COMPONENT - NOT USED IN CURRENT ROUTING
// This admin layout is not being used
/*
import React from 'react';

import Header from './Header';

const AdminLayout = ({ children, user, onLogout }) => {
  // Default menu items for admin layout
  const defaultMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-chart-bar' },
    { 
      path: '/admin/restaurants', 
      label: 'Restaurant Management', 
      icon: 'fas fa-store',
      submenu: [
        { path: '/admin/restaurants/list', label: 'Restaurant List', icon: 'fas fa-list' },
        { path: '/admin/restaurants/onboarding', label: 'Restaurant Onboarding', icon: 'fas fa-plus-circle' },
        { path: '/admin/restaurants/documents', label: 'Document Management', icon: 'fas fa-file-alt' },
        { path: '/admin/restaurants/status', label: 'Status Control', icon: 'fas fa-toggle-on' },
        { path: '/admin/restaurants/approvals', label: 'Approvals', icon: 'fas fa-check-circle' }
      ]
    },
    { 
      path: '/admin/orders', 
      label: 'Order Management', 
      icon: 'fas fa-shopping-bag',
      submenu: [
        { path: '/admin/orders/monitoring', label: 'Real-time Monitoring', icon: 'fas fa-eye' },
        { path: '/admin/orders/operations', label: 'Order Operations', icon: 'fas fa-cogs' },
        { path: '/admin/orders/analytics', label: 'Order Analytics', icon: 'fas fa-chart-pie' },
        { path: '/admin/orders/disputes', label: 'Disputes', icon: 'fas fa-exclamation-triangle' }
      ]
    },
    { 
      path: '/admin/delivery', 
      label: 'Delivery Management', 
      icon: 'fas fa-truck',
      submenu: [
        { path: '/admin/delivery/personnel', label: 'Personnel Management', icon: 'fas fa-user-tie' },
        { path: '/admin/delivery/tracking', label: 'Live Tracking', icon: 'fas fa-map-marker-alt' },
        { path: '/admin/delivery/zones', label: 'Zone Management', icon: 'fas fa-map' },
        { path: '/admin/delivery/performance', label: 'Performance', icon: 'fas fa-chart-line' }
      ]
    },
    { 
      path: '/admin/finance', 
      label: 'Financial Management',
      icon: 'fas fa-dollar-sign',
      submenu: [
        { path: '/admin/finance/commission', label: 'Commission System', icon: 'fas fa-percentage' },
        { path: '/admin/finance/payments', label: 'Payment Processing', icon: 'fas fa-credit-card' },
        { path: '/admin/finance/reports', label: 'Financial Reports', icon: 'fas fa-file-invoice-dollar' },
        { path: '/admin/finance/analytics', label: 'Revenue Analytics', icon: 'fas fa-chart-area' }
      ]
    },
    { 
      path: '/admin/customers', 
      label: 'Customer Management', 
      icon: 'fas fa-users',
      submenu: [
        { path: '/admin/customers/support', label: 'Customer Support', icon: 'fas fa-headset' },
        { path: '/admin/customers/analytics', label: 'Customer Analytics', icon: 'fas fa-user-chart' },
        { path: '/admin/customers/feedback', label: 'Feedback Management', icon: 'fas fa-comment-dots' },
        { path: '/admin/customers/loyalty', label: 'Loyalty Programs', icon: 'fas fa-gift' }
      ]
    },
    { 
      path: '/admin/menu', 
      label: 'Menu & Pricing', 
      icon: 'fas fa-utensils',
      submenu: [
        { path: '/admin/menu/control', label: 'Menu Control', icon: 'fas fa-cogs' },
        { path: '/admin/menu/pricing', label: 'Dynamic Pricing', icon: 'fas fa-tags' },
        { path: '/admin/menu/categories', label: 'Category Management', icon: 'fas fa-folder' },
        { path: '/admin/menu/approvals', label: 'Menu Approvals', icon: 'fas fa-check' }
      ]
    },
    { 
      path: '/admin/reports', 
      label: 'Reports & Analytics', 
      icon: 'fas fa-chart-line',
      submenu: [
        { path: '/admin/reports/performance', label: 'Performance Reports', icon: 'fas fa-tachometer-alt' },
        { path: '/admin/reports/financial', label: 'Financial Reports', icon: 'fas fa-file-invoice-dollar' },
        { path: '/admin/reports/export', label: 'Export Data', icon: 'fas fa-download' },
        { path: '/admin/reports/custom', label: 'Custom Reports', icon: 'fas fa-cogs' }
      ]
    },
    { 
      path: '/admin/system', 
      label: 'System Administration', 
      icon: 'fas fa-server',
      submenu: [
        { path: '/admin/system/users', label: 'User Management', icon: 'fas fa-user-shield' },
        { path: '/admin/system/settings', label: 'Platform Settings', icon: 'fas fa-cog' },
        { path: '/admin/system/notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { path: '/admin/system/security', label: 'Security', icon: 'fas fa-shield-alt' }
      ]
    },
    { 
      path: '/admin/communication', 
      label: 'Communication Tools', 
      icon: 'fas fa-comments',
      submenu: [
        { path: '/admin/communication/internal', label: 'Internal Chat', icon: 'fas fa-comment-dots' },
        { path: '/admin/communication/customers', label: 'Customer Messaging', icon: 'fas fa-envelope' },
        { path: '/admin/communication/announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
        { path: '/admin/communication/campaigns', label: 'Marketing Campaigns', icon: 'fas fa-megaphone' }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar menuItems={defaultMenuItems} user={user} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <Header user={user} onLogout={onLogout} />
        
        {/* Page Content */}
        <main className="flex-1 pt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
*/
