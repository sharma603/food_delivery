import React, { useState, useEffect } from 'react';
import {
 Plus,
 Edit3,
 Trash2,
 Eye,
 EyeOff,
 Search,
 Grid,
 List,
 Image as ImageIcon,
 Star,
 ArrowLeft,
 UtensilsCrossed
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

// Font Awesome Rupee Icon Component (₹)
const RupeeIcon = ({ className }) => (
 <i className={`fas fa-rupee-sign ${className}`}></i>
);

const AllMenuItems = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [menuItems, setMenuItems] = useState([]);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterCategory, setFilterCategory] = useState('');
 const [filterStatus, setFilterStatus] = useState('all');
 const [viewMode, setViewMode] = useState('grid');
 const [sortBy, setSortBy] = useState('name');
 const [sortOrder, setSortOrder] = useState('asc');
 const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch menu items from API for current restaurant only
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      // Get current restaurant ID from user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const restaurantId = userData._id;
      
      console.log('User data:', userData);
      console.log('Restaurant ID:', restaurantId);
      
      if (!restaurantId) {
        console.error('No restaurant ID found in user data');
        setMenuItems([]);
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/restaurant/menu/items`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Transform the data to match the expected format
        const transformedItems = (response.data.data || []).map(item => ({
          ...item,
          id: item._id,
          isActive: item.isAvailable,
          isVegetarian: item.isVeg,
          orderCount: item.orderCount || 0,
          rating: item.rating || 0,
          preparationTime: item.preparationTime || '10-15 minutes'
        }));
        console.log('Transformed items:', transformedItems);
        setMenuItems(transformedItems);
      } else {
        console.error('Failed to fetch menu items:', response.data.message);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      console.error('Error details:', error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('Authentication failed - user may need to login again');
      } else if (error.response?.status === 403) {
        console.error('Restaurant not verified - cannot access menu items');
      } else if (error.response?.status === 429) {
        console.error('Rate limit exceeded - please wait before trying again');
      }
      
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

 const [categories, setCategories] = useState(['All Categories']);

 // Extract unique categories from menu items
 useEffect(() => {
 const uniqueCategories = ['All Categories'];
 const itemCategories = [...new Set(menuItems.map(item => {
 if (typeof item.category === 'object') {
 return item.category?.displayName || item.category?.name || 'Uncategorized';
 }
 return item.category || 'Uncategorized';
 }))].filter(Boolean);
 setCategories([...uniqueCategories, ...itemCategories]);
 }, [menuItems]);

 useEffect(() => {
 // Fetch menu items from API
 fetchMenuItems();
 }, []);

 // Filter and sort menu items
 const filteredMenuItems = menuItems
 .filter(item => {
 const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.description.toLowerCase().includes(searchTerm.toLowerCase());
 const itemCategoryName = typeof item.category === 'object' ? (item.category?.displayName || item.category?.name || 'Uncategorized') : item.category || 'Uncategorized';
 const matchesCategory = filterCategory === '' || filterCategory === 'All Categories' || itemCategoryName === filterCategory;
 const matchesStatus = filterStatus === 'all' ||
 (filterStatus === 'active' && item.isActive) ||
 (filterStatus === 'inactive' && !item.isActive);

 return matchesSearch && matchesCategory && matchesStatus;
 })
 .sort((a, b) => {
 let aValue, bValue;

 switch (sortBy) {
 case 'name':
 aValue = a.name.toLowerCase();
 bValue = b.name.toLowerCase();
 break;
 case 'price':
 aValue = a.price;
 bValue = b.price;
 break;
 case 'popularity':
 aValue = a.orderCount;
 bValue = b.orderCount;
 break;
 case 'rating':
 aValue = a.rating;
 bValue = b.rating;
 break;
 default:
 aValue = a.name.toLowerCase();
 bValue = b.name.toLowerCase();
 }

 if (sortOrder === 'asc') {
 return aValue > bValue ? 1 : -1;
 } else {
 return aValue < bValue ? 1 : -1;
 }
 });

 const toggleItemStatus = async (itemId) => {
 try {
 const item = menuItems.find(i => i.id === itemId);
 const newStatus = !item.isActive;

 const response = await api.patch(`/restaurant/menu/items/${itemId}/toggle-status`, {
 isAvailable: newStatus
 });

 if (response.data.success) {
 setMenuItems(menuItems.map(item =>
 item.id === itemId ? { ...item, isActive: newStatus } : item
 ));
 }
 } catch (error) {
 console.error('Error updating item status:', error);
 }
 };

 const deleteItem = async (itemId) => {
 if (window.confirm('Are you sure you want to delete this menu item?')) {
 try {
 const item = menuItems.find(i => i.id === itemId);
 const response = await api.delete(`/restaurant/menu/items/${itemId}`);

 if (response.data.success) {
 setMenuItems(menuItems.filter(item => item.id !== itemId));
 }
 } catch (error) {
 console.error('Error deleting menu item:', error);
 }
 }
 };

 const getStatusColor = (isActive) => {
 return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
 };

 const calculateStats = () => {
 const totalItems = menuItems.length;
 const activeItems = menuItems.filter(item => item.isActive).length;
 const totalRevenue = menuItems.reduce((sum, item) => sum + (item.price * item.orderCount), 0);
 const averageRating = menuItems.reduce((sum, item) => sum + item.rating, 0) / totalItems;

 return { totalItems, activeItems, totalRevenue, averageRating: averageRating || 0 };
 };

 const stats = calculateStats();

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-gray-50">
 <div className="text-center">
 <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
 <p className="mt-4 text-gray-600 font-medium">Loading menu items...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Main Content */}
 <div className="w-full">

 <div className="p-4 lg:p-6">
 {/* Header */}
 <div className="mb-6 lg:mb-8">
 <div className="flex items-center gap-4 mb-4">
 <button
 onClick={() => navigate('/restaurant/menu')}
 className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
 >
 <ArrowLeft className="w-5 h-5" />
 <span className="hidden sm:inline">Back to Menu Management</span>
 <span className="sm:hidden">Back</span>
 </button>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div>
 <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Restaurant Menu Items</h1>
 <p className="text-gray-600">View and manage your restaurant's menu items only</p>
 </div>
 <div className="flex flex-wrap items-center gap-2 lg:gap-3">
 <button
 onClick={fetchMenuItems}
 disabled={loading}
 className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
 >
 <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
 {loading ? (
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
 ) : (
 <Search className="w-4 h-4" />
 )}
 </div>
 <span className="hidden sm:inline">Refresh</span>
 <span className="sm:hidden">Refresh</span>
 </button>
 <button
 onClick={() => window.location.href = '/restaurant/menu/add-item'}
 className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
 >
 <Plus className="w-4 h-4" />
 <span className="hidden sm:inline">Add New Item</span>
 <span className="sm:hidden">Add</span>
 </button>
 </div>
 </div>
 </div>

 {/* Statistics Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Total Items</p>
 <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
 </div>
 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
 <UtensilsCrossed className="w-6 h-6 text-blue-600" />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Active Items</p>
 <p className="text-2xl font-bold text-gray-900">{stats.activeItems}</p>
 </div>
 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
 <Eye className="w-6 h-6 text-green-600" />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Total Revenue</p>
 <p className="text-2xl font-bold text-gray-900">
 NPR {stats.totalRevenue.toLocaleString()}
 </p>
 </div>
 <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
 <RupeeIcon className="w-6 h-6 text-orange-600" />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Avg Rating</p>
 <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
 </div>
 <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
 <Star className="w-6 h-6 text-purple-600" />
 </div>
 </div>
 </div>
 </div>

 {/* Filters and Search */}
 <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
 <div className="flex flex-col md:flex-row gap-4">
 {/* Search */}
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
 <input
 type="text"
 placeholder="Search menu items..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 />
 </div>
 </div>

 {/* Category Filter */}
 <div className="md:w-48">
 <select
 value={filterCategory}
 onChange={(e) => setFilterCategory(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
 {categories.map(category => {
 const categoryName = typeof category === 'object' ? (category?.displayName || category?.name || 'Uncategorized') : category || 'Uncategorized';
 const categoryValue = category === 'All Categories' ? '' : categoryName;
 return (
 <option key={categoryName} value={categoryValue}>
 {categoryName}
 </option>
 );
 })}
 </select>
 </div>

 {/* Status Filter */}
 <div className="md:w-32">
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
 <option value="all">All Status</option>
 <option value="active">Active</option>
 <option value="inactive">Inactive</option>
 </select>
 </div>

 {/* Sort */}
 <div className="md:w-32">
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
 <option value="name">Sort by Name</option>
 <option value="price">Sort by Price</option>
 <option value="popularity">Sort by Popularity</option>
 <option value="rating">Sort by Rating</option>
 </select>
 </div>

 {/* View Mode */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => setViewMode('grid')}
 className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <Grid className="w-4 h-4" />
 </button>
 <button
 onClick={() => setViewMode('list')}
 className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <List className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>

 {/* Menu Items Grid/List */}
 <div className={viewMode === 'grid'
 ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
 : 'space-y-4'
 }>
 {filteredMenuItems.map(item => (
 <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow w-[250px] h-[300px] mx-auto flex flex-col">
 {/* Item Image */}
 <div className="w-full h-32 bg-gray-100 rounded-t-lg overflow-hidden flex-shrink-0">
 {(item.image || (item.images && item.images.length > 0)) ? (
 <img
 src={(() => {
 const imageUrl = item.image || item.images[0];
 // If the URL doesn't start with http, prepend the backend URL
 if (imageUrl && !imageUrl.startsWith('http')) {
 const backendUrl = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
 const fullUrl = `${backendUrl}${imageUrl}`;
 console.log(' Image URL:', { original: imageUrl, full: fullUrl });
 return fullUrl;
 }
 console.log(' Image URL (already full):', imageUrl);
 return imageUrl;
 })()}
 alt={item.name}
 className="w-full h-full object-cover"
 onError={(e) => {
 e.target.style.display = 'none';
 e.target.nextSibling.style.display = 'flex';
 }}
 />
 ) : null}
 <div className="w-full h-full bg-gray-100 flex items-center justify-center">
 <ImageIcon className="w-8 h-8 text-gray-400" />
 </div>
 </div>
 <div className="p-3 flex-1 flex flex-col">
 {/* Header */}
 <div className="flex items-start justify-between mb-2">
 <div className="flex-1">
 <div className="flex items-center gap-1 mb-1">
 <h3 className="font-semibold text-gray-900 text-xs truncate">{item.name}</h3>
 {item.isPopular && (
 <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
 )}
 </div>
 <p className="text-xs text-gray-600 mb-2 line-clamp-1">{item.description}</p>

 {/* Tags */}
 <div className="flex items-center gap-1 mb-2 flex-wrap">
 <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
 {typeof item.category === 'object' ? (item.category?.displayName || item.category?.name || 'Uncategorized') : item.category || 'Uncategorized'}
 </span>
 <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.isActive)}`}>
 {item.isActive ? 'Active' : 'Inactive'}
 </span>
 {item.isVegetarian && (
 <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
 Veg
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1">
 <button
 onClick={() => toggleItemStatus(item.id)}
 className={`p-1 rounded transition-colors ${item.isActive
 ? 'text-green-600 hover:bg-green-50'
 : 'text-red-600 hover:bg-red-50'
 }`}
 title={item.isActive ? 'Deactivate' : 'Activate'}
 >
 {item.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
 </button>
 <button
 className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
 title="Edit Item"
 >
 <Edit3 className="w-3 h-3" />
 </button>
 <button
 onClick={() => deleteItem(item.id)}
 className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
 title="Delete Item"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 </div>

 {/* Item Details */}
 <div className="space-y-1 mb-2 flex-1">
 <div className="flex items-center justify-between text-xs">
 <span className="text-gray-600">Price:</span>
 <span className="font-medium text-gray-900">
 <RupeeIcon className="inline w-3 h-3 mr-1" />
 {item.price}
 </span>
 </div>

 <div className="flex items-center justify-between text-xs">
 <span className="text-gray-600">Prep Time:</span>
 <span className="font-medium text-gray-900">{item.preparationTime}</span>
 </div>

 <div className="flex items-center justify-between text-xs">
 <span className="text-gray-600">Rating:</span>
 <div className="flex items-center gap-1">
 <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
 <span className="font-medium text-gray-900">{item.rating}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

    {/* Empty State */}
    {filteredMenuItems.length === 0 && !loading && (
      <div className="text-center py-12">
        <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500 mb-2">
          {searchTerm || filterCategory || filterStatus !== 'all'
            ? 'No menu items found'
            : 'No menu items in your restaurant yet'
          }
        </p>
        <p className="text-sm text-gray-400 mb-4">
          {searchTerm || filterCategory || filterStatus !== 'all'
            ? 'Try adjusting your search or filters to find menu items'
            : 'Your restaurant menu is empty. Start by adding your first menu item to begin receiving orders'
          }
        </p>
        {!searchTerm && !filterCategory && filterStatus === 'all' && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={fetchMenuItems}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Refresh Data
            </button>
            <button
              onClick={() => window.location.href = '/restaurant/menu/add-item'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Menu Item
            </button>
            <button
              onClick={() => window.location.href = '/restaurant/menu'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Menu Management
            </button>
          </div>
        )}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
          <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
          <p className="text-sm text-blue-700">
            To start receiving orders, you need to add menu items to your restaurant. 
            Click "Add First Menu Item" to begin building your menu.
          </p>
        </div>
      </div>
    )}

 </div>
 </div>
 </div>
 );
};

export default AllMenuItems;
