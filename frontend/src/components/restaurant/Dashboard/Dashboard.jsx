import React, { useState, useEffect } from 'react';
import { 
 Package, 
 Star,
 Clock,
 CheckCircle,
 XCircle,
 AlertCircle,
 UtensilsCrossed,
 ShoppingBag,
 Tag,
 Eye,
 RefreshCw,
 Calendar,
 Activity,
 Zap,
 Award,
 Target,
 Power,
 PowerOff
} from 'lucide-react';
import api from '../../../utils/api';

// Font Awesome Rupee Icon Component (₹)
const RupeeIcon = ({ className }) => (
 <i className={`fas fa-rupee-sign ${className}`}></i>
);


const RestaurantDashboard = () => {
 const [dashboardData, setDashboardData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [currentTime, setCurrentTime] = useState(new Date());
 const [selectedDate, setSelectedDate] = useState(new Date());
 const [showDatePicker, setShowDatePicker] = useState(false);
 const [isOpen, setIsOpen] = useState(true);
 const [toggleLoading, setToggleLoading] = useState(false);
 const [notification, setNotification] = useState(null);

 // Show notification helper placed before any usage to avoid TDZ issues
 function showNotification(message, type = 'success') {
   setNotification({ message, type });
   setTimeout(() => setNotification(null), 3000);
 }

  useEffect(() => {
    fetchDashboardData();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Auto-refresh dashboard data every 30 seconds
    const dashboardTimer = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(dashboardTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Initialize status record if needed (for existing restaurants)
      try {
        await api.post('/restaurant/auth/init-status');
      } catch (initError) {
        // Ignore errors - this is just for initialization
        console.log('Status initialization:', initError.response?.data?.message || 'Already initialized');
      }

      // Fetch dashboard data
      const response = await api.get('/restaurant/dashboard');
      console.log('Dashboard API Response:', response.data);
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
      
      // Also fetch restaurant profile to get current status
      const profileResponse = await api.get('/restaurant/auth/me');
      if (profileResponse.data.success) {
        setIsOpen(profileResponse.data.data.isOpen);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty data when API fails
      setDashboardData({
        todayStats: {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0
        },
        recentOrders: [],
        popularItems: [],
        rating: { average: 0, count: 0 }
      });
      
      // Show error notification
      showNotification('Failed to load dashboard data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-gray-50">
 <div className="text-center">
 <div className="relative">
 <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
 <div className="absolute inset-0 rounded-full bg-orange-500 opacity-20 animate-pulse"></div>
 </div>
 <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
 </div>
 </div>
 );
 }

 const stats = dashboardData?.todayStats || {};
 const recentOrders = dashboardData?.recentOrders || [];
 const popularItems = dashboardData?.popularItems || [];
 const rating = dashboardData?.rating || { average: 0, count: 0 };

 // Date picker functions
 const handleDateSelect = (date) => {
 setSelectedDate(date);
 setShowDatePicker(false);
 // Here you can add logic to fetch data for the selected date
 fetchDashboardDataForDate(date);
 };

 const fetchDashboardDataForDate = async (date) => {
 // This function would fetch data for the selected date
 console.log('Fetching data for date:', date.toLocaleDateString());
 // You can implement API call here for date-specific data
 };

// (moved showNotification above)

 // Toggle restaurant open/close status with optimistic UI updates
 const toggleRestaurantStatus = async () => {
 try {
 setToggleLoading(true);
 
 // Optimistic UI update - immediately update the UI
 const newStatus = !isOpen;
 setIsOpen(newStatus);
 
 // Show immediate feedback
 const successMessage = `Restaurant is now ${newStatus ? 'open' : 'closed'}`;
 showNotification(successMessage, 'success');
 
 // Make API call
 const response = await api.put('/restaurant/auth/toggle-status');
 
 if (response.data.success) {
 // Confirm the optimistic update was correct
 setIsOpen(response.data.data.isOpen);
 showNotification('Status updated successfully!', 'success');
 } else {
 // Revert optimistic update on failure
 setIsOpen(!newStatus);
 showNotification('Failed to update status. Please try again.', 'error');
 }
 } catch (error) {
 // Revert optimistic update on error
 setIsOpen(!isOpen);
 showNotification('Network error. Please check your connection.', 'error');
 console.error('Error toggling restaurant status:', error);
 } finally {
 setToggleLoading(false);
 }
 };

 const generateCalendarDays = () => {
 const year = selectedDate.getFullYear();
 const month = selectedDate.getMonth();
 const firstDay = new Date(year, month, 1);
 const lastDay = new Date(year, month + 1, 0);
 const daysInMonth = lastDay.getDate();
 const startingDayOfWeek = firstDay.getDay();
 
 const days = [];
 
 // Add empty cells for days before the first day of the month
 for (let i = 0; i < startingDayOfWeek; i++) {
 days.push(null);
 }
 
 // Add days of the month
 for (let day = 1; day <= daysInMonth; day++) {
 days.push(day);
 }
 
 return days;
 };

 const getEventsForDate = (date) => {
 // Calendar events will be loaded from API when implemented
 return [];
 };

const statCards = [
  {
    title: 'Today\'s Orders',
    value: stats.totalOrders || 0,
    icon: Package,
    color: 'blue',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    subtitle: 'Total orders received',
    trend: stats.totalOrders > 0 ? '+12%' : '0%',
    trendColor: 'text-green-600'
  },
  {
    title: 'Today\'s Revenue',
    value: `NPR ${(stats.totalRevenue || 0).toLocaleString()}`,
    icon: RupeeIcon,
    color: 'green',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    subtitle: 'Total earnings today',
    trend: stats.totalRevenue > 0 ? '+8%' : '0%',
    trendColor: 'text-green-600'
  },
  {
    title: 'Pending Orders',
    value: stats.pendingOrders || 0,
    icon: Clock,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    subtitle: 'Awaiting preparation',
    urgent: stats.pendingOrders > 5,
    urgentText: stats.pendingOrders > 5 ? 'Action needed!' : 'Normal'
  },
  {
    title: 'Customer Rating',
    value: rating.average > 0 ? rating.average.toFixed(1) : 'N/A',
    icon: Star,
    color: 'purple',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    subtitle: `${rating.count} reviews`,
    trend: rating.average > 0 ? '4.2/5' : 'No ratings yet',
    trendColor: rating.average >= 4 ? 'text-green-600' : rating.average >= 3 ? 'text-yellow-600' : 'text-red-600'
  }
];

 const getStatusColor = (status) => {
 switch (status) {
 case 'delivered':
 return 'text-green-600 bg-green-50';
 case 'preparing':
 return 'text-yellow-600 bg-yellow-50';
 case 'pending':
 return 'text-blue-600 bg-blue-50';
 case 'cancelled':
 return 'text-red-600 bg-red-50';
 default:
 return 'text-gray-600 bg-gray-50';
 }
 };

 const getStatusIcon = (status) => {
 switch (status) {
 case 'delivered':
 return <CheckCircle className="w-4 h-4" />;
 case 'preparing':
 return <Clock className="w-4 h-4" />;
 case 'pending':
 return <AlertCircle className="w-4 h-4" />;
 case 'cancelled':
 return <XCircle className="w-4 h-4" />;
 default:
 return <Package className="w-4 h-4" />;
 }
 };

 return (
 <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
 {/* Notification */}
 {notification && (
 <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
 notification.type === 'success' 
 ? 'bg-green-500 text-white' 
 : 'bg-red-500 text-white'
 }`}>
 <div className="flex items-center space-x-2">
 {notification.type === 'success' ? (
 <CheckCircle className="w-5 h-5" />
 ) : (
 <XCircle className="w-5 h-5" />
 )}
 <span>{notification.message}</span>
 </div>
 </div>
 )}

 {/* Header */}
 <div className="mb-6 sm:mb-8">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Restaurant Dashboard</h1>
 <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's what's happening with your restaurant today.</p>
 </div>
 <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
 {/* Restaurant Status Toggle */}
 <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm border">
 <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
 <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
 {isOpen ? 'Open' : 'Closed'}
 </span>
 </div>
 
 <button
 onClick={toggleRestaurantStatus}
 disabled={toggleLoading}
 className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50 ${
 isOpen 
 ? 'bg-red-600 text-white hover:bg-red-700' 
 : 'bg-green-600 text-white hover:bg-green-700'
 }`}
 >
 {toggleLoading ? (
 <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
 ) : isOpen ? (
 <PowerOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
 ) : (
 <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
 )}
 <span className="hidden sm:inline">{isOpen ? 'Close Restaurant' : 'Open Restaurant'}</span>
 <span className="sm:hidden">{isOpen ? 'Close' : 'Open'}</span>
 </button>
 
 <div className="hidden sm:flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
 <Calendar className="w-4 h-4 text-gray-500" />
 <span className="text-sm text-gray-600 whitespace-nowrap">
 {currentTime.toLocaleDateString('en-NP', { 
 weekday: 'long', 
 year: 'numeric', 
 month: 'long', 
 day: 'numeric' 
 })}
 </span>
 </div>
 <button
 onClick={fetchDashboardData}
 disabled={loading}
 className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
 <span className="hidden sm:inline">Refresh</span>
 </button>
 </div>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
 {statCards.map((stat, index) => {
 const Icon = stat.icon;
 return (
        <div key={index} className={`bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-all duration-200 ${stat.urgent ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${stat.bgColor} flex items-center justify-center shadow-sm`}>
              <Icon className={`${stat.icon === RupeeIcon ? 'text-base sm:text-lg' : 'w-5 h-5 sm:w-6 sm:h-6'} ${stat.iconColor}`} />
            </div>
            {stat.urgent && (
              <div className="flex items-center space-x-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Urgent</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
            <p className="text-xs text-gray-500 mb-2">{stat.subtitle}</p>
            {stat.trend && (
              <div className="flex items-center space-x-1">
                <span className={`text-xs font-medium ${stat.trendColor}`}>
                  {stat.trend}
                </span>
                {stat.urgentText && (
                  <span className="text-xs text-gray-500">• {stat.urgentText}</span>
                )}
              </div>
            )}
          </div>
        </div>
 );
 })}
 </div>

 {/* Interactive Calendar Widget */}
 <div className="mb-8">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
 <Calendar className="w-5 h-5 text-orange-600" />
 Calendar & Events
 </h2>
 <div className="flex items-center space-x-3">
 {/* Date Picker Button */}
 <button
 onClick={() => setShowDatePicker(!showDatePicker)}
 className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
 >
 <Calendar className="w-4 h-4 text-gray-500" />
 <span className="text-sm text-gray-600">
 {selectedDate.toLocaleDateString('en-NP', { 
 weekday: 'long', 
 year: 'numeric', 
 month: 'long', 
 day: 'numeric' 
 })}
 </span>
 </button>
 
 {/* Refresh Button */}
 <button
 onClick={fetchDashboardData}
 disabled={loading}
 className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
 <span className="text-sm">Refresh</span>
 </button>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Interactive Calendar */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold text-gray-900">
 {selectedDate.toLocaleDateString('en-NP', { month: 'long', year: 'numeric' })}
</h3>
 <div className="flex space-x-2">
 <button
 onClick={() => {
 const newDate = new Date(selectedDate);
 newDate.setMonth(newDate.getMonth() - 1);
 setSelectedDate(newDate);
 }}
 className="p-1 hover:bg-gray-100 rounded"
 >
 <span className="text-gray-600">‹</span>
 </button>
 <button
 onClick={() => setSelectedDate(new Date())}
 className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
 >
 Today
 </button>
 <button
 onClick={() => {
 const newDate = new Date(selectedDate);
 newDate.setMonth(newDate.getMonth() + 1);
 setSelectedDate(newDate);
 }}
 className="p-1 hover:bg-gray-100 rounded"
 >
 <span className="text-gray-600">›</span>
 </button>
 </div>
 </div>
 
 {/* Calendar Grid */}
 <div className="grid grid-cols-7 gap-1 mb-4">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
 <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
 {day}
 </div>
 ))}
 {generateCalendarDays().map((day, index) => (
 <button
 key={index}
 onClick={() => day && handleDateSelect(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
 className={`
 p-2 text-center text-sm rounded-lg transition-colors
 ${day ? 'hover:bg-orange-100 cursor-pointer' : ''}
 ${day === selectedDate.getDate() ? 'bg-orange-600 text-white' : 'text-gray-700'}
 ${day === currentTime.getDate() && selectedDate.getMonth() === currentTime.getMonth() && selectedDate.getFullYear() === currentTime.getFullYear() ? 'ring-2 ring-orange-300' : ''}
 `}
 >
 {day}
 </button>
 ))}
 </div>

 {/* Current Time Display */}
 <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 text-center">
 <div className="text-sm text-gray-600 mb-1">Current Time</div>
 <div className="text-lg font-semibold text-orange-600">
 {currentTime.toLocaleTimeString('en-NP')}
 </div>
 </div>
 </div>

 {/* Events for Selected Date */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-4">
 Events for {selectedDate.toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}
</h3>
 <div className="space-y-3">
 {getEventsForDate(selectedDate.getDate().toString()).length > 0 ? (
 getEventsForDate(selectedDate.getDate().toString()).map((event, index) => (
 <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
 <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
 <div>
 <p className="font-medium text-gray-900">{event}</p>
 <p className="text-sm text-gray-600">Scheduled for today</p>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-8 text-gray-500">
 <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
 <p className="text-lg font-medium">No events scheduled</p>
 <p className="text-sm">Select a different date to view events</p>
 </div>
 )}
 
 {/* Quick Add Event Button */}
 <button className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors">
 + Add Event
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Recent Orders */}
 <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
 <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-orange-100">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
 <Activity className="w-5 h-5 text-orange-600" />
 Recent Orders
 </h2>
 <button className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium">
 <Eye className="w-4 h-4" />
 View All
 </button>
 </div>
 </div>
 <div className="p-6">
 <div className="space-y-4">
 {recentOrders.map((order) => (
 <div key={order._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-orange-50 hover:to-orange-100 transition-all duration-200">
 <div className="flex items-center gap-4">
 <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
 {getStatusIcon(order.status)}
 <span className="capitalize">{order.status}</span>
 </div>
 <div>
 <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
 <p className="text-sm text-gray-600">{order.customer?.name}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-semibold text-gray-900">NPR {order.totalAmount?.toLocaleString()}</p>
 <p className="text-xs text-gray-500">
 {new Date(order.createdAt).toLocaleTimeString('en-NP')}
 </p>
 </div>
 </div>
 ))}
 
 {recentOrders.length === 0 && (
 <div className="text-center py-12 text-gray-500">
 <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
 <p className="text-lg font-medium">No recent orders</p>
 <p className="text-sm">Orders will appear here when customers place them</p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Popular Items */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
 <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
 <Award className="w-5 h-5 text-green-600" />
 Popular Items
 </h2>
 <button className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium">
 <Eye className="w-4 h-4" />
 View All
 </button>
 </div>
 </div>
 <div className="p-6">
 <div className="space-y-4">
 {popularItems.map((item, index) => (
 <div key={item._id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-green-50 transition-colors">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
 index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-orange-100'
 }`}>
 <span className={`text-sm font-bold ${
 index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
 }`}>
 {index === 0 ? '' : index === 1 ? '' : ''}
 </span>
 </div>
 <div className="flex-1">
 <p className="font-semibold text-gray-900">{item.name}</p>
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <span className="font-medium text-green-600">NPR {item.price}</span>
 <span>•</span>
 <span>{item.orderCount} orders</span>
 <div className="flex items-center gap-1">
 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
 <span className="font-medium">{item.rating?.toFixed(1) || '0.0'}</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 
 {popularItems.length === 0 && (
 <div className="text-center py-12 text-gray-500">
 <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
 <p className="text-lg font-medium">No menu items yet</p>
 <p className="text-sm">Add items to your menu to see them here</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="mt-8">
 <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
 <Zap className="w-5 h-5 text-orange-600" />
 Quick Actions
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <button className="group p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-left">
 <div className="flex items-center justify-between mb-4">
 <UtensilsCrossed className="w-8 h-8 text-blue-100" />
 </div>
 <h3 className="font-semibold text-lg mb-2">Add Menu Item</h3>
 <p className="text-sm text-blue-100">Expand your menu with new delicious items</p>
 </button>
 
 <button className="group p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-left">
 <div className="flex items-center justify-between mb-4">
 <ShoppingBag className="w-8 h-8 text-green-100" />
 <Activity className="w-5 h-5 text-green-200 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 <h3 className="font-semibold text-lg mb-2">Manage Orders</h3>
 <p className="text-sm text-green-100">View and manage all incoming orders</p>
 </button>
 
 <button className="group p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-left">
 <div className="flex items-center justify-between mb-4">
 <Tag className="w-8 h-8 text-purple-100" />
 <Target className="w-5 h-5 text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 <h3 className="font-semibold text-lg mb-2">Create Promotion</h3>
 <p className="text-sm text-purple-100">Boost your sales with special offers</p>
 </button>
 </div>
 </div>

 {/* Recent Orders Section */}
 <div className="mt-8">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
 <ShoppingBag className="w-5 h-5 text-orange-600" />
 Recent Orders
 </h2>
 <button 
 onClick={fetchDashboardData}
 className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
 >
 <RefreshCw className="w-4 h-4" />
 Refresh
 </button>
 </div>
 
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 {recentOrders.length > 0 ? (
 <div className="divide-y divide-gray-100">
 {recentOrders.slice(0, 5).map((order) => (
 <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status).split(' ')[0].replace('text-', 'bg-')}`}></div>
 <div>
 <h3 className="font-medium text-gray-900">#{order.orderNumber}</h3>
 <p className="text-sm text-gray-600">{order.customer?.name || 'Customer N/A'}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-medium text-gray-900">NPR {order.pricing?.total || order.totalAmount || 0}</p>
 <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
 {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
 </span>
 </div>
 <div className="text-xs text-gray-500">
 {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-8 text-center text-gray-500">
 <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
 <p>No recent orders found</p>
 </div>
 )}
 </div>
 </div>

 {/* Popular Items Section */}
 <div className="mt-8">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
 <UtensilsCrossed className="w-5 h-5 text-orange-600" />
 Popular Menu Items
 </h2>
 <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
 View All →
 </button>
 </div>
 
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 {popularItems.length > 0 ? (
 <div className="divide-y divide-gray-100">
 {popularItems.slice(0, 5).map((item, index) => (
 <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
 {index + 1}
 </div>
 <div>
 <h3 className="font-medium text-gray-900">{item.name}</h3>
 <p className="text-sm text-gray-600">NPR {item.price}</p>
 </div>
 </div>
 <div className="text-right">
 <div className="flex items-center space-x-2">
 <Star className="w-4 h-4 text-yellow-400" />
 <span className="text-sm font-medium text-gray-900">
 {item.rating ? item.rating.toFixed(1) : 'N/A'}
 </span>
 </div>
 <p className="text-xs text-gray-500">{item.orderCount || 0} orders</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-8 text-center text-gray-500">
 <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
 <p>No popular items data available</p>
 </div>
 )}
 </div>
 </div>

 {/* Performance Summary */}
 <div className="mt-8 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Performance Summary</h3>
 <p className="text-sm text-gray-600">
 You've served {stats.totalOrders || 0} customers today and earned NPR {(stats.totalRevenue || 0).toLocaleString()}
 </p>
 <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
 <span>Avg Order: NPR {stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0}</span>
 <span>•</span>
 <span>Completion Rate: {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%</span>
 </div>
 </div>
 <div className="text-right">
 <div className="text-2xl font-bold text-orange-600">
 {rating.average > 0 ? rating.average.toFixed(1) : 'N/A'} 
 </div>
 <p className="text-sm text-gray-600">Customer Rating</p>
 <div className="mt-1 flex justify-center">
 {[...Array(5)].map((_, i) => (
 <Star 
 key={i} 
 className={`w-4 h-4 ${i < Math.floor(rating.average) ? 'text-yellow-400' : 'text-gray-300'}`} 
 />
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default RestaurantDashboard;
