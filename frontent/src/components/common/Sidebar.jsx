import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Store,
  ShoppingBag,
  Truck,
  CreditCard,
  Users,
  Utensils,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  Plus,
  List,
  CheckCircle,
  UserCheck
} from 'lucide-react';

const Sidebar = ({ 
  isOpen, 
  onClose, 
  activeItem = 'Dashboard',
  onItemClick,
  brandName = 'HypeBridge Admin',
  brandIcon: BrandIcon = Utensils,
  navigationItems = null
}) => {
  const [expandedItems, setExpandedItems] = useState({});
  // Default navigation items
  const defaultNavigationItems = [
    { 
      name: 'Dashboard', 
      icon: BarChart3, 
      path: '/admin/dashboard',
      active: activeItem === 'Dashboard'
    },
    { 
      name: 'Restaurant Management', 
      icon: Store, 
      path: '/admin/restaurants',
      hasSubmenu: true,
      active: activeItem === 'Restaurant Management',
      submenu: [
        {
          name: 'All Restaurants',
          path: '/admin/restaurants',
          icon: List
        },
        {
          name: 'Add Restaurant',
          path: '/admin/restaurants/add',
          icon: Plus
        },
        {
          name: 'Restaurant Verification',
          path: '/admin/restaurants/verification',
          icon: CheckCircle
        },
        {
          name: 'Restaurant Analytics',
          path: '/admin/restaurants/analytics',
          icon: BarChart3
        }
      ]
    },
    { 
      name: 'Order Management', 
      icon: ShoppingBag, 
      path: '/admin/orders',
      hasSubmenu: true,
      active: activeItem === 'Order Management',
      submenu: [
        {
          name: 'All Orders',
          path: '/admin/orders',
          icon: List
        },
        {
          name: 'Order Status',
          path: '/admin/orders/status',
          icon: BarChart3
        },
        {
          name: 'Order Monitoring',
          path: '/admin/orders/monitoring',
          icon: BarChart3
        },
        {
          name: 'Order Analytics',
          path: '/admin/orders/analytics',
          icon: BarChart3
        },
        {
          name: 'Order Disputes',
          path: '/admin/orders/disputes',
          icon: MessageSquare
        },
        {
          name: 'Refund Management',
          path: '/admin/orders/refunds',
          icon: CreditCard
        }
      ]
    },
    { 
      name: 'Delivery Management', 
      icon: Truck, 
      path: '/admin/delivery',
      hasSubmenu: true,
      active: activeItem === 'Delivery Management',
      submenu: [
        {
          name: 'Zone Management',
          path: '/admin/delivery/zones',
          icon: Store
        },
        {
          name: 'Personnel Management',
          path: '/admin/delivery/personnel',
          icon: UserCheck
        },
        {
          name: 'Live Tracking',
          path: '/admin/delivery/tracking',
          icon: BarChart3
        },
        {
          name: 'Performance Analytics',
          path: '/admin/delivery/analytics',
          icon: BarChart3
        }
      ]
    },
    { 
      name: 'Financial Management', 
      icon: CreditCard, 
      path: '/admin/finance',
      hasSubmenu: true,
      active: activeItem === 'Financial Management',
      submenu: [
        {
          name: 'Financial Dashboard',
          path: '/admin/finance',
          icon: BarChart3
        },
        {
          name: 'Commission System',
          path: '/admin/finance/commission',
          icon: CreditCard
        },
        {
          name: 'Payment Processing',
          path: '/admin/finance/payments',
          icon: CreditCard
        },
        {
          name: 'Revenue Analytics',
          path: '/admin/finance/revenue',
          icon: BarChart3
        },
        {
          name: 'Settlements',
          path: '/admin/finance/settlements',
          icon: CheckCircle
        }
      ]
    },
    { 
      name: 'Customer Management', 
      icon: Users, 
      path: '/admin/customers',
      hasSubmenu: true,
      active: activeItem === 'Customer Management',
      submenu: [
        {
          name: 'All Customers',
          path: '/admin/customers',
          icon: List
        },
        {
          name: 'Customer Analytics',
          path: '/admin/customers/analytics',
          icon: BarChart3
        },
        {
          name: 'Customer Support',
          path: '/admin/customers/support',
          icon: MessageSquare
        },
        {
          name: 'Customer Reviews',
          path: '/admin/customers/reviews',
          icon: CheckCircle
        },
        {
          name: 'Customer Segments',
          path: '/admin/customers/segments',
          icon: UserCheck
        }
      ]
    },
    { 
      name: 'Menu & Pricing', 
      icon: Utensils, 
      path: '/admin/menu',
      hasSubmenu: true,
      active: activeItem === 'Menu & Pricing',
      submenu: [
        {
          name: 'Add Item',
          path: '/admin/menu/add-item',
          icon: Plus
        },
        {
          name: 'All Menu Items',
          path: '/admin/menu/items',
          icon: List
        },
        {
          name: 'Categories',
          path: '/admin/menu/categories',
          icon: Store
        },
        {
          name: 'Pricing Management',
          path: '/admin/menu/pricing',
          icon: CreditCard
        }
      ]
    },
    { 
      name: 'Reports & Analytics', 
      icon: BarChart3, 
      path: '/admin/reports',
      hasSubmenu: true,
      active: activeItem === 'Reports & Analytics',
      submenu: [
        {
          name: 'Performance Reports',
          path: '/admin/reports/performance',
          icon: BarChart3
        },
        {
          name: 'Financial Reports',
          path: '/admin/reports/financial',
          icon: CreditCard
        },
        {
          name: 'Export Data',
          path: '/admin/reports/export',
          icon: List
        },
        {
          name: 'Custom Reports',
          path: '/admin/reports/custom',
          icon: Settings
        }
      ]
    },
    { 
      name: 'System Administration', 
      icon: Settings, 
      path: '/admin/system',
      hasSubmenu: true,
      active: activeItem === 'System Administration',
      submenu: [
        {
          name: 'System Dashboard',
          path: '/admin/system/dashboard',
          icon: BarChart3
        },
        {
          name: 'Menu Management',
          path: '/admin/system/menu',
          icon: Utensils
        },
        {
          name: 'Page Management',
          path: '/admin/system/pages',
          icon: List
        },
        {
          name: 'User Management',
          path: '/admin/system/users',
          icon: UserCheck
        },
        {
          name: 'Platform Settings',
          path: '/admin/system/settings',
          icon: Settings
        },
        {
          name: 'Notifications',
          path: '/admin/system/notifications',
          icon: MessageSquare
        },
        {
          name: 'Security',
          path: '/admin/system/security',
          icon: CheckCircle
        }
      ]
    },
    { 
      name: 'Communication Tools', 
      icon: MessageSquare, 
      path: '/admin/communication',
      hasSubmenu: true,
      active: activeItem === 'Communication Tools',
      submenu: [
        {
          name: 'Internal Chat',
          path: '/admin/communication/internal',
          icon: MessageSquare
        },
        {
          name: 'Customer Messaging',
          path: '/admin/communication/customers',
          icon: MessageSquare
        },
        {
          name: 'Announcements',
          path: '/admin/communication/announcements',
          icon: CheckCircle
        },
        {
          name: 'Marketing Campaigns',
          path: '/admin/communication/campaigns',
          icon: BarChart3
        }
      ]
    }
  ];

  const items = navigationItems || defaultNavigationItems;

  const handleItemClick = (item) => {
    try {
      if (item.hasSubmenu) {
        setExpandedItems(prev => ({
          ...prev,
          [item.name]: !prev[item.name]
        }));
      }
      if (onItemClick) {
        onItemClick(item);
      }
    } catch (error) {
      console.error('Error handling menu item click:', error);
    }
  };

  const handleSubmenuClick = (subItem) => {
    try {
      if (onItemClick) {
        onItemClick(subItem);
      }
    } catch (error) {
      console.error('Error handling submenu click:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-700 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-600">
          <div className="flex items-center space-x-3">
            <BrandIcon className="w-8 h-8 text-white" aria-hidden="true" />
            <h1 className="text-xl font-bold text-white">{brandName}</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-300 hover:text-white p-1 rounded-md hover:bg-slate-600 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 px-3" role="navigation" aria-label="Main menu">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isExpanded = expandedItems[item.name];
            return (
              <div key={`${item.name}-${index}`} className="mb-2">
                {/* Main Menu Item */}
                {item.hasSubmenu ? (
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active 
                        ? 'bg-blue-500 text-white' 
                        : 'text-slate-200 hover:bg-slate-600 hover:text-white'
                    }`}
                    aria-expanded={isExpanded}
                    aria-haspopup="true"
                    aria-label={`${item.name} menu`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active 
                        ? 'bg-blue-500 text-white' 
                        : 'text-slate-200 hover:bg-slate-600 hover:text-white'
                    }`}
                    aria-current={item.active ? 'page' : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )}

                {/* Submenu */}
                {item.hasSubmenu && item.submenu && isExpanded && (
                  <div 
                    className="ml-6 mt-2 space-y-1"
                    role="menu"
                    aria-label={`${item.name} submenu`}
                  >
                    {item.submenu.map((subItem, subIndex) => {
                      const SubIcon = subItem.icon;
                      return (
                        <Link
                          key={`${subItem.name}-${subIndex}`}
                          to={subItem.path}
                          onClick={() => handleSubmenuClick(subItem)}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                          role="menuitem"
                        >
                          <SubIcon className="w-4 h-4" aria-hidden="true" />
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
};

// Mobile Menu Button Component
const MobileMenuButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
    aria-label="Open sidebar menu"
    aria-expanded="false"
  >
    <Menu className="w-6 h-6" aria-hidden="true" />
  </button>
);

export { MobileMenuButton };
export default Sidebar;
