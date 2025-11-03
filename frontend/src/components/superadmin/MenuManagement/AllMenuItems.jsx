import React, { useState, useEffect } from 'react';
import {
 Search,
 Filter,
 Edit3,
 Trash2,
 Eye,
 EyeOff,
 Plus,
 RefreshCw,
 CheckCircle,
 Clock,
 Tag,
 ChevronDown,
 X,
 Image as ImageIcon,
 AlertCircle,
 Save,
 Package,
 TrendingUp,
 Grid,
 List,
 UtensilsCrossed
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import AppConfig from '../../../config/appConfig';

// Font Awesome Rupee Icon Component (₹)
const RupeeIcon = ({ className }) => (
 <i className={`fas fa-rupee-sign ${className}`}></i>
);

const AllMenuItems = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [menuItems, setMenuItems] = useState([]);
 const [filteredItems, setFilteredItems] = useState([]);
 const [restaurants, setRestaurants] = useState([]);
 const [categories, setCategories] = useState([]);
 
 const [filters, setFilters] = useState({
 restaurant: '',
 category: '',
 availability: 'all',
 dietary: 'all'
 });
 
 const [searchTerm, setSearchTerm] = useState('');
 const [showFilters, setShowFilters] = useState(false);
 const [selectedItem, setSelectedItem] = useState(null);
 const [showDetailsModal, setShowDetailsModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [editingItem, setEditingItem] = useState(null);
 const [deleteConfirm, setDeleteConfirm] = useState(null);
 const [editFormData, setEditFormData] = useState({});
 const [editSelectedFile, setEditSelectedFile] = useState(null);
 const [editImagePreview, setEditImagePreview] = useState('');
 const [viewMode, setViewMode] = useState('grid'); // grid or list
 const [sortBy, setSortBy] = useState('name'); // name, price, restaurant, category
 const [sortOrder, setSortOrder] = useState('asc'); // asc or desc
 const [menuStats, setMenuStats] = useState({
 totalItems: 0,
 activeItems: 0,
 totalRestaurants: 0,
 totalCategories: 0
 });

 useEffect(() => {
 fetchData();
 }, []);

 useEffect(() => {
 applyFilters();
 }, [menuItems, filters, searchTerm]);

 const calculateStats = (items, restaurants) => {
 const totalItems = items.length;
 const activeItems = items.filter(item => item.isAvailable).length;
 const totalRestaurants = restaurants.length;
 const totalCategories = [...new Set(items.map(item => item.category).filter(Boolean))].length;
 
 setMenuStats({
 totalItems,
 activeItems,
 totalRestaurants,
 totalCategories
 });
 };

 const fetchData = async () => {
 try {
 setLoading(true);
 console.log('Fetching SuperAdmin menu data...');
 
 // Check authentication
 const token = localStorage.getItem('token');
 const user = localStorage.getItem('user');
 console.log(' Auth check:', { 
 hasToken: !!token, 
 user: user ? JSON.parse(user) : null 
 });
 
 const [itemsRes, restaurantsRes] = await Promise.all([
 api.get('/superadmin/menu'), // Get all menu items from all restaurants
 api.get('/superadmin/restaurants') // Get all restaurants
 ]);

 console.log('Menu items response:', itemsRes.data);
 console.log('Restaurants response:', restaurantsRes.data);

 const items = itemsRes.data.data || itemsRes.data || [];
 const restaurants = restaurantsRes.data.data || restaurantsRes.data || [];

 console.log('Processed items:', items);
 console.log('Processed restaurants:', restaurants);

    setMenuItems(items);
    setRestaurants(restaurants);

    // Extract unique categories from items and API response
    const categoryNames = new Set();
    
    // Add categories from API response filters if available
    if (itemsRes.data.filters && itemsRes.data.filters.categories) {
      itemsRes.data.filters.categories.forEach(cat => {
        if (cat && typeof cat === 'string' && !cat.match(/^[0-9a-fA-F]{24}$/)) {
          categoryNames.add(cat);
        }
      });
    }
    
    // Extract unique categories from menu items
    items.forEach(item => {
      if (item.category) {
        if (typeof item.category === 'object' && item.category !== null) {
          const catName = item.category.displayName || item.category.name;
          if (catName && !catName.match(/^[0-9a-fA-F]{24}$/)) {
            categoryNames.add(catName);
          }
        } else if (typeof item.category === 'string' && !item.category.match(/^[0-9a-fA-F]{24}$/)) {
          categoryNames.add(item.category);
        }
      }
    });
    
    const uniqueCategories = Array.from(categoryNames).filter(Boolean).sort();
    console.log(' Unique categories:', uniqueCategories);
    setCategories(uniqueCategories);

 // Calculate statistics
 calculateStats(items, restaurants);

 } catch (error) {
 console.error('Error fetching data:', error);
 console.error('Error details:', {
 message: error.message,
 status: error.response?.status,
 statusText: error.response?.statusText,
 data: error.response?.data
 });
 // Set fallback data if API fails
 setMenuItems([]);
 setRestaurants([]);
 setCategories([]);
 } finally {
 setLoading(false);
 }
 };

 const applyFilters = () => {
 let filtered = [...menuItems];

 // Search filter
 if (searchTerm) {
 filtered = filtered.filter(item =>
 item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.restaurant?.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase())
 );
 }

 // Restaurant filter
 if (filters.restaurant) {
 filtered = filtered.filter(item => item.restaurantId === filters.restaurant);
 }

 // Category filter
 if (filters.category) {
 filtered = filtered.filter(item => item.category === filters.category);
 }

 // Availability filter
 if (filters.availability !== 'all') {
 const isAvailable = filters.availability === 'available';
 filtered = filtered.filter(item => item.isAvailable === isAvailable);
 }

 // Dietary filter
 if (filters.dietary !== 'all') {
 switch (filters.dietary) {
 case 'veg':
 filtered = filtered.filter(item => item.isVeg);
 break;
 case 'vegan':
 filtered = filtered.filter(item => item.isVegan);
 break;
 case 'gluten-free':
 filtered = filtered.filter(item => item.isGlutenFree);
 break;
 }
 }

 // Sort items
 filtered = sortItems(filtered);

 setFilteredItems(filtered);
 };

 const sortItems = (items) => {
 return [...items].sort((a, b) => {
 let aValue, bValue;

 switch (sortBy) {
 case 'name':
 aValue = a.name?.toLowerCase() || '';
 bValue = b.name?.toLowerCase() || '';
 break;
 case 'price':
 aValue = a.price || 0;
 bValue = b.price || 0;
 break;
 case 'restaurant':
 aValue = a.restaurant?.restaurantName?.toLowerCase() || '';
 bValue = b.restaurant?.restaurantName?.toLowerCase() || '';
 break;
 case 'category':
 aValue = a.category?.toLowerCase() || '';
 bValue = b.category?.toLowerCase() || '';
 break;
 default:
 aValue = a.name?.toLowerCase() || '';
 bValue = b.name?.toLowerCase() || '';
 }

 if (sortOrder === 'asc') {
 return aValue > bValue ? 1 : -1;
 } else {
 return aValue < bValue ? 1 : -1;
 }
 });
 };

 const handleDelete = async (item) => {
 try {
 console.log('Deleting item:', {
 menuId: item.menuId,
 categoryName: item.category,
 itemId: item._id
 });
 
 await api.delete(`/superadmin/menu/${item._id}`); // Delete menu item via SuperAdmin endpoint
 setMenuItems(prev => prev.filter(i => i._id !== item._id));
 setDeleteConfirm(null);
 alert('Item deleted successfully!');
 } catch (error) {
 console.error('Error deleting item:', error);
 alert('Failed to delete item: ' + (error.response?.data?.message || error.message));
 }
 };

const handleEdit = (item) => {
setEditingItem(item);
// Get category name for form - don't use ObjectId
let categoryValue = '';
if (typeof item.category === 'object' && item.category !== null) {
  categoryValue = item.category.name || item.category.displayName || '';
} else if (typeof item.category === 'string' && !item.category.match(/^[0-9a-fA-F]{24}$/)) {
  // It's a category name string, use it (not an ObjectId)
  categoryValue = item.category;
}

setEditFormData({
name: item.name,
description: item.description || '',
price: item.price,
category: categoryValue, // Store category name for form, not ID
preparationTime: item.preparationTime || '',
isAvailable: item.isAvailable,
discount: item.discount || 0
});
 
// Set image preview
if (item.image || (item.images && item.images.length > 0)) {
const imageUrl = item.image || item.images[0];
setEditImagePreview(AppConfig.IMAGES.getImageUrl(imageUrl));
} else {
setEditImagePreview('');
}
 
 setEditSelectedFile(null);
 setShowEditModal(true);
 };

 const handleEditImageUpload = (e) => {
 const file = e.target.files[0];
 if (file) {
 setEditSelectedFile(file);
 // Create preview URL for display
 const reader = new FileReader();
 reader.onload = (e) => {
 setEditImagePreview(e.target.result);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleUpdateItem = async (e) => {
 e.preventDefault();
 try {
 console.log('Updating item:', {
 menuId: editingItem.menuId,
 categoryName: editingItem.category,
 itemId: editingItem._id,
 data: editFormData,
 hasNewImage: !!editSelectedFile
 });
 
 // Prepare FormData if there's a new image, otherwise use regular data
 let updateData;
 if (editSelectedFile) {
 updateData = new FormData();
 updateData.append('images', editSelectedFile);
 Object.keys(editFormData).forEach(key => {
 updateData.append(key, editFormData[key]);
 });
 } else {
 updateData = editFormData;
 }
 
 const response = await api.put(
 `/superadmin/menu/${editingItem._id}`, // Update menu item via SuperAdmin endpoint
 updateData,
 editSelectedFile ? {
 headers: {
 'Content-Type': 'multipart/form-data',
 },
 } : {}
 );
 
      console.log('Update response:', response.data);

      // Update local state with server response data (which has populated category)
      if (response.data.success && response.data.data) {
        const updatedItem = response.data.data;
        setMenuItems(prev =>
          prev.map(i => (i._id === editingItem._id ? {
            ...updatedItem,
            // Preserve any local fields that might not be in response
            _id: updatedItem._id || i._id
          } : i))
        );
      } else {
        // Fallback: refresh data from server
        fetchData();
      }

      setShowEditModal(false);
 setEditingItem(null);
 setEditSelectedFile(null);
 setEditImagePreview('');
 alert('Menu item updated successfully!');
 } catch (error) {
 console.error('Error updating item:', error);
 console.error('Error details:', {
 message: error.message,
 status: error.response?.status,
 statusText: error.response?.statusText,
 data: error.response?.data
 });
 alert('Failed to update item: ' + (error.response?.data?.message || error.message));
 }
 };

 const handleToggleAvailability = async (item) => {
 try {
 console.log('Toggling availability:', {
 menuId: item.menuId,
 categoryName: item.category,
 itemId: item._id,
 isAvailable: !item.isAvailable
 });
 
 const updatedItem = { ...item, isAvailable: !item.isAvailable };
 await api.patch(
 `/superadmin/menu/${item._id}/toggle`, // Toggle menu item status via SuperAdmin endpoint
 { isAvailable: !item.isAvailable }
 );
 setMenuItems(prev =>
 prev.map(i => (i._id === item._id ? updatedItem : i))
 );
 alert(`Item ${!item.isAvailable ? 'enabled' : 'disabled'} successfully!`);
 } catch (error) {
 console.error('Error updating availability:', error);
 alert('Failed to update availability: ' + (error.response?.data?.message || error.message));
 }
 };

 const clearFilters = () => {
 setFilters({
 restaurant: '',
 category: '',
 availability: 'all',
 dietary: 'all'
 });
 setSearchTerm('');
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-screen">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading menu items...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="p-6 bg-gray-50 min-h-screen">
 {/* Header */}
 <div className="mb-8">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-gray-900 mb-2">All Menu Items</h1>
 <p className="text-gray-600">Manage all menu items across all restaurants in the system</p>
 </div>
 <div className="flex items-center space-x-3">
 <button
 onClick={() => fetchData()}
 disabled={loading}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
 >
 <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
 {loading ? (
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
 ) : (
 <RefreshCw className="w-4 h-4" />
 )}
 </div>
 Refresh
 </button>
 <button
 onClick={() => navigate('/admin/menu/add-item')}
 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
 >
 <Plus className="w-4 h-4" />
 Add New Item
 </button>
 </div>
 </div>
 </div>

 {/* Statistics Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Total Items</p>
 <p className="text-2xl font-bold text-gray-900">{menuStats.totalItems}</p>
 </div>
 <Package className="w-12 h-12 text-blue-600 bg-blue-100 p-2 rounded-lg" />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Active Items</p>
 <p className="text-2xl font-bold text-gray-900">{menuStats.activeItems}</p>
 </div>
 <CheckCircle className="w-12 h-12 text-green-600 bg-green-100 p-2 rounded-lg" />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Total Restaurants</p>
 <p className="text-2xl font-bold text-gray-900">{menuStats.totalRestaurants}</p>
 </div>
 <UtensilsCrossed className="w-12 h-12 text-orange-600 bg-orange-100 p-2 rounded-lg" />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-600">Total Categories</p>
 <p className="text-2xl font-bold text-gray-900">{menuStats.totalCategories}</p>
 </div>
 <Tag className="w-12 h-12 text-purple-600 bg-purple-100 p-2 rounded-lg" />
 </div>
 </div>
 </div>

 {/* Search and Filters */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
 <div className="flex flex-col md:flex-row gap-4 items-center">
 <div className="flex-1 w-full">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
 <input
 type="text"
 placeholder="Search menu items, restaurants, or descriptions..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 />
 </div>
 </div>

 <div className="w-full md:w-48">
 <select
 value={filters.restaurant}
 onChange={(e) => setFilters({ ...filters, restaurant: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
 <option value="">All Restaurants</option>
 {restaurants.map(restaurant => (
 <option key={restaurant._id} value={restaurant._id}>
 {restaurant.restaurantName}
 </option>
 ))}
 </select>
 </div>

 <div className="w-full md:w-48">
 <select
 value={filters.category}
 onChange={(e) => setFilters({ ...filters, category: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
 <option value="">All Categories</option>
 {categories.map(category => {
 const categoryName = typeof category === 'object' ? (category?.displayName || category?.name || 'Uncategorized') : category || 'Uncategorized';
 return (
 <option key={categoryName} value={categoryName}>
 {categoryName}
 </option>
 );
 })}
 </select>
 </div>

 <div className="w-full md:w-32">
 <select
 value={filters.availability}
 onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
 <option value="all">All Status</option>
 <option value="available">Active</option>
 <option value="unavailable">Inactive</option>
 </select>
 </div>

 <div className="w-full md:w-32">
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
 >
 <option value="name">Sort by Name</option>
 <option value="price">Sort by Price</option>
 <option value="restaurant">Sort by Restaurant</option>
 <option value="category">Sort by Category</option>
 </select>
 </div>

 <div className="w-full md:w-24">
 <button
 onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
 title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
 >
 <TrendingUp className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
 </button>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => setViewMode('grid')}
 className={`p-2 rounded transition-colors ${
 viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
 }`}
 title="Grid View"
 >
 <Grid className="w-4 h-4" />
 </button>
 <button
 onClick={() => setViewMode('list')}
 className={`p-2 rounded transition-colors ${
 viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
 }`}
 title="List View"
 >
 <List className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Advanced Filters */}
 <div className="mt-4 pt-4 border-t border-gray-200">
 <button
 onClick={() => setShowFilters(!showFilters)}
 className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
 >
 <Filter className="w-4 h-4 mr-2" />
 Advanced Filters
 <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
 </button>
 </div>

 {/* Filter Options */}
 {showFilters && (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant</label>
 <select
 value={filters.restaurant}
 onChange={(e) => setFilters({ ...filters, restaurant: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 >
 <option value="">All Restaurants</option>
 {restaurants.map(restaurant => (
 <option key={restaurant._id} value={restaurant._id}>
 {restaurant.restaurantName}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
 <select
 value={filters.category}
 onChange={(e) => setFilters({ ...filters, category: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 >
 <option value="">All Categories</option>
 {categories.map(category => {
 const categoryName = typeof category === 'object' ? (category?.displayName || category?.name || 'Uncategorized') : category || 'Uncategorized';
 return (
 <option key={categoryName} value={categoryName}>
 {categoryName}
 </option>
 );
 })}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
 <select
 value={filters.availability}
 onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 >
 <option value="all">All Items</option>
 <option value="available">Available</option>
 <option value="unavailable">Unavailable</option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Dietary</label>
 <select
 value={filters.dietary}
 onChange={(e) => setFilters({ ...filters, dietary: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 >
 <option value="all">All Types</option>
 <option value="veg">Vegetarian</option>
 <option value="vegan">Vegan</option>
 <option value="gluten-free">Gluten-Free</option>
 </select>
 </div>

 <div className="md:col-span-4 flex justify-end">
 <button
 onClick={clearFilters}
 className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
 >
 <X className="w-4 h-4 mr-1" />
 Clear Filters
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Menu Items Grid/List */}
 {filteredItems.length === 0 ? (
 <div className="text-center py-12">
 <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
 <p className="text-lg font-medium text-gray-500 mb-2">No menu items found</p>
 <p className="text-sm text-gray-400 mb-4">
 {menuItems.length === 0
 ? 'Get started by adding your first menu item'
 : searchTerm || filters.restaurant || filters.category
 ? 'Try adjusting your search or filters to find menu items'
 : 'No items match the current filters'}
 </p>
 <button
 onClick={() => navigate('/admin/menu/add-item')}
 className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
 >
 <Plus className="w-4 h-4" />
 Add First Menu Item
 </button>
 </div>
 ) : (
 <div className={viewMode === 'grid' 
 ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
 : 'space-y-4'
 }>
 {filteredItems.map((item) => {
 // Determine image URL
 let imageUrl = '';
 if (item.image) {
 imageUrl = item.image;
 } else if (item.images && item.images.length > 0) {
 const firstImage = item.images[0];
 imageUrl = (typeof firstImage === 'object' && firstImage.url) ? firstImage.url : firstImage;
 }
 
 // Construct full image URL if needed
 if (imageUrl && !imageUrl.startsWith('http')) {
 const backendUrl = AppConfig.API.BACKEND_BASE_URL;
 const originalUrl = imageUrl;
 imageUrl = `${backendUrl}${imageUrl}`;
 console.log('SuperAdmin Image URL:', { original: originalUrl, full: imageUrl });
 } else if (imageUrl) {
 console.log('SuperAdmin Image URL (already full):', imageUrl);
 }
 
 return (
 <div key={item._id} className={`bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
 viewMode === 'list' ? 'p-6 flex items-center gap-6' : 'w-[250px] h-[300px] mx-auto flex flex-col overflow-hidden'
 }`}>
 {/* Item Image */}
 <div className={`${viewMode === 'list' ? 'w-20 h-20 flex-shrink-0' : 'w-full h-32 flex-shrink-0'} bg-gray-100 rounded-lg overflow-hidden ${viewMode === 'grid' ? 'rounded-t-lg' : ''}`}>
 {imageUrl ? (
 <img
 src={imageUrl}
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

 {/* Item Details */}
 <div className={`flex-1 ${viewMode === 'grid' ? 'p-3' : ''}`}>
 <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-xs mb-1 truncate">{item.name}</h3>
          {/* Only show description if it exists and is different from name */}
          {item.description && 
           item.description.trim() !== '' && 
           item.description.trim().toLowerCase() !== item.name?.trim().toLowerCase() ? (
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{item.description}</p>
          ) : item.description === '' || !item.description ? null : (
            <p className="text-xs text-gray-400 mb-2 italic">No description</p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
 <span className="flex items-center gap-1">
 <RupeeIcon className="w-3 h-3" />
 {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
 </span>
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {item.preparationTime || 'N/A'}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => handleToggleAvailability(item)}
 className={`p-1 rounded transition-colors ${
 item.isAvailable
 ? 'text-green-600 hover:bg-green-50'
 : 'text-red-600 hover:bg-red-50'
 }`}
 title={item.isAvailable ? 'Deactivate' : 'Activate'}
 >
 {item.isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
 </button>
 <button
 onClick={() => handleEdit(item)}
 className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
 title="Edit Item"
 >
 <Edit3 className="w-3 h-3" />
 </button>
 <button
 onClick={() => {
 setSelectedItem(item);
 setShowDetailsModal(true);
 }}
 className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
 title="View Details"
 >
 <Eye className="w-3 h-3" />
 </button>
 <button
 onClick={() => setDeleteConfirm(item)}
 className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
 title="Delete Item"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 </div>

 {/* Item Tags */}
 <div className="flex items-center gap-1 mb-2 flex-wrap">
 <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
 {typeof item.category === 'object' ? (item.category?.displayName || item.category?.name || 'Uncategorized') : item.category || 'Uncategorized'}
 </span>
 {item.isVeg && (
 <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
 Veg
 </span>
 )}
 {item.isVegan && (
 <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
 Vegan
 </span>
 )}
 {item.isGlutenFree && (
 <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
 GF
 </span>
 )}
 <span className={`px-1 py-0.5 text-xs rounded-full ${
 item.isAvailable
 ? 'bg-green-100 text-green-800'
 : 'bg-red-100 text-red-800'
 }`}>
 {item.isAvailable ? 'Active' : 'Inactive'}
 </span>
 </div>

 {/* Additional Info */}
 <div className="text-xs text-gray-500 mt-auto">
 {item.restaurant?.restaurantName || 'Unknown Restaurant'}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Edit Modal */}
 {showEditModal && editingItem && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
 <div className="bg-blue-600 px-5 py-4 flex items-center justify-between rounded-t-lg">
 <h2 className="text-lg font-bold text-white">Edit Menu Item</h2>
 <button
 onClick={() => {
 setShowEditModal(false);
 setEditSelectedFile(null);
 setEditImagePreview('');
 }}
 className="text-white hover:text-gray-200"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleUpdateItem} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
 <input
 type="text"
 value={editFormData.name}
 onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
 <textarea
 value={editFormData.description}
 onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
 rows="2"
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 />
 </div>

 {/* Image Upload */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
 <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
 <input
 type="file"
 accept="image/*"
 onChange={handleEditImageUpload}
 className="hidden"
 id="edit-image-upload"
 />
 <label
 htmlFor="edit-image-upload"
 className="cursor-pointer flex flex-col items-center"
 >
 {editImagePreview ? (
 <div className="relative">
 <img
 src={editImagePreview}
 alt="Preview"
 className="w-24 h-24 object-cover rounded-md"
 />
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 setEditImagePreview('');
 setEditSelectedFile(null);
 const fileInput = document.getElementById('edit-image-upload');
 if (fileInput) fileInput.value = '';
 }}
 className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 ) : (
 <>
 <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
 <p className="text-xs text-gray-600">Click to upload new image</p>
 <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
 </>
 )}
 </label>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
 <div className="relative">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
 <RupeeIcon className="h-5 w-5 text-gray-400" />
 </div>
 <input
 type="number"
 step="0.01"
 value={editFormData.price}
 onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
 <input
 type="number"
 value={editFormData.preparationTime}
 onChange={(e) => setEditFormData({ ...editFormData, preparationTime: parseInt(e.target.value) })}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={editFormData.category || ''}
          onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Category</option>
          {categories.length > 0 ? (
            categories.map((category, index) => {
              // Categories are now strings (category names) after extraction
              const categoryName = typeof category === 'string' ? category : 
                (typeof category === 'object' ? (category?.displayName || category?.name || '') : '');
              
              if (!categoryName || categoryName.match(/^[0-9a-fA-F]{24}$/)) {
                return null;
              }
              
              return (
                <option key={categoryName || index} value={categoryName}>
                  {categoryName}
                </option>
              );
            })
          ) : (
            <option value="" disabled>No categories available</option>
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={editFormData.discount}
          onChange={(e) => setEditFormData({ ...editFormData, discount: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 checked={editFormData.isAvailable}
 onChange={(e) => setEditFormData({ ...editFormData, isAvailable: e.target.checked })}
 className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
 />
 <label className="text-sm font-medium text-gray-700">Available for Order</label>
 </div>

 <div className="flex space-x-3 pt-3 border-t">
 <button
 type="button"
 onClick={() => {
 setShowEditModal(false);
 setEditSelectedFile(null);
 setEditImagePreview('');
 }}
 className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
 >
 <Save className="w-4 h-4 inline mr-2" />
 Save Changes
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Details Modal - Smaller */}
 {showDetailsModal && selectedItem && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
 <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between rounded-t-lg">
 <h2 className="text-lg font-bold text-white">Item Details</h2>
 <button
 onClick={() => setShowDetailsModal(false)}
 className="text-white hover:text-gray-200"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-5">
 {(selectedItem.image || (selectedItem.images && selectedItem.images.length > 0)) && (
 <img
 src={selectedItem.image || selectedItem.images[0].url || selectedItem.images[0]}
 alt={selectedItem.name}
 className="w-full h-40 object-cover rounded-lg mb-4 shadow-sm"
 onError={(e) => e.target.style.display = 'none'}
 />
 )}

 <div className="space-y-3">
 <div>
 <h3 className="text-xl font-bold text-gray-900">{selectedItem.name}</h3>
 <p className="text-sm text-gray-600">{selectedItem.restaurant?.restaurantName || 'Unknown Restaurant'}</p>
 </div>

 <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
 <div>
 <p className="text-xs text-gray-500 mb-1">Price</p>
 <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
 <RupeeIcon className="w-4 h-4" />
 {typeof selectedItem.price === 'number' ? selectedItem.price.toFixed(2) : '0.00'}
 </p>
 </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-base font-semibold text-gray-900">
                    {(() => {
                      // If category is an object, use its name
                      if (typeof selectedItem.category === 'object' && selectedItem.category !== null) {
                        return selectedItem.category?.displayName || selectedItem.category?.name || 'Uncategorized';
                      }
                      // If category is a string that looks like ObjectId (24 hex characters), don't show it
                      if (typeof selectedItem.category === 'string' && selectedItem.category.match(/^[0-9a-fA-F]{24}$/)) {
                        return 'Uncategorized';
                      }
                      // If category is a valid string name, show it
                      if (typeof selectedItem.category === 'string' && selectedItem.category.trim() !== '') {
                        return selectedItem.category;
                      }
                      // Default fallback
                      return 'Uncategorized';
                    })()}
                  </p>
                </div>
 </div>

 {selectedItem.description && (
 <div className="bg-gray-50 p-3 rounded-lg">
 <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
 <p className="text-sm text-gray-700">{selectedItem.description}</p>
 </div>
 )}

 {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
 <div className="bg-gray-50 p-3 rounded-lg">
 <p className="text-xs font-medium text-gray-500 mb-1">Ingredients</p>
 <p className="text-sm text-gray-700">{selectedItem.ingredients.join(', ')}</p>
 </div>
 )}

 <div className="flex flex-wrap gap-2">
 {selectedItem.isVeg && (
 <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
 Vegetarian
 </span>
 )}
 {selectedItem.isVegan && (
 <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
 Vegan
 </span>
 )}
 {selectedItem.isGlutenFree && (
 <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
 Gluten-Free
 </span>
 )}
 {selectedItem.isAvailable ? (
 <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
 Available
 </span>
 ) : (
 <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
 Unavailable
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Delete Confirmation Modal */}
 {deleteConfirm && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
 <div className="flex items-center mb-3">
 <div className="bg-red-100 p-2 rounded-full mr-3">
 <AlertCircle className="w-6 h-6 text-red-600" />
 </div>
 <h3 className="text-lg font-semibold text-gray-900">Delete Item?</h3>
 </div>
 <p className="text-sm text-gray-600 mb-5 ml-14">
 Delete "<strong>{deleteConfirm.name}</strong>"? This action cannot be undone.
 </p>
 <div className="flex space-x-2">
 <button
 onClick={() => setDeleteConfirm(null)}
 className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => handleDelete(deleteConfirm)}
 className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
 >
 <Trash2 className="w-4 h-4 inline mr-1" />
 Delete
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default AllMenuItems;

