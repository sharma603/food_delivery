import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  Tag,
  DollarSign,
  Clock,
  Star,
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Copy,
  Archive,
  GripVertical,
  Move,
  Maximize2,
  Minimize2,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Download,
  Share2,
  Settings,
  Palette,
  Type,
  Hash,
  Calendar,
  Users,
  Heart,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import api from '../../../utils/api';

// Font Awesome Rupee Icon Component (₹)
const RupeeIcon = ({ className }) => (
  <i className={`fas fa-rupee-sign ${className}`}></i>
);

const MenuManagement = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [bulkSelectedItems, setBulkSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name, price, popularity, date
  const [sortOrder, setSortOrder] = useState('asc'); // asc or desc
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuStats, setMenuStats] = useState({
    totalItems: 0,
    activeItems: 0,
    totalRevenue: 0,
    popularItems: 0
  });

  // Form states
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0
  });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    ingredients: '',
    preparationTime: '',
    isVegetarian: false,
    isSpicy: false,
    isPopular: false,
    isActive: true,
    sortOrder: 0
  });

  // Initialize with empty arrays - restaurant owners will create their own data
  const initialCategories = [];
  const initialMenuItems = [];

  // Fetch menu items from API for current restaurant only
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      // Get current restaurant ID from user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const restaurantId = userData._id;
      
      console.log('Fetching menu items for restaurant:', restaurantId);
      
      if (!restaurantId) {
        console.error('No restaurant ID found in user data');
        setMenuItems([]);
        setCategories([]);
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/restaurant/menu/items`);
      console.log('Menu items API response:', response.data);
      
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
        console.log('Transformed menu items:', transformedItems);
        setMenuItems(transformedItems);
        
        // Extract categories from menu items
        const uniqueCategories = [...new Set(transformedItems.map(item => item.category))].filter(Boolean);
        const categoryObjects = uniqueCategories.map((catName, index) => ({
          id: index + 1,
          name: catName,
          description: `${catName} items`,
          itemCount: transformedItems.filter(item => item.category === catName).length,
          isActive: true,
          sortOrder: index + 1
        }));
        setCategories(categoryObjects);
        calculateMenuStats();
      } else {
        console.error('Failed to fetch menu items:', response.data.message);
        setMenuItems([]);
        setCategories([]);
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
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch menu items from API
    fetchMenuItems();
  }, []);

  // Calculate menu statistics
  const calculateMenuStats = () => {
    const stats = {
      totalItems: menuItems.length,
      activeItems: menuItems.filter(item => item.isActive).length,
      totalRevenue: menuItems.reduce((sum, item) => sum + (item.price * (item.orderCount || 0)), 0),
      popularItems: menuItems.filter(item => item.isPopular).length
    };
    setMenuStats(stats);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Drag and drop functionality
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetCategoryId) => {
    e.preventDefault();
    if (draggedItem && draggedItem.categoryId !== targetCategoryId) {
      // Move item to new category
      const updatedItems = menuItems.map(item => 
        item.id === draggedItem.id 
          ? { ...item, categoryId: targetCategoryId, category: categories.find(cat => cat.id === targetCategoryId)?.name }
          : item
      );
      setMenuItems(updatedItems);
      
      // Update category item counts
      const oldCategory = categories.find(cat => cat.id === draggedItem.categoryId);
      const newCategory = categories.find(cat => cat.id === targetCategoryId);
      
      setCategories(categories.map(cat => {
        if (cat.id === draggedItem.categoryId) {
          return { ...cat, itemCount: cat.itemCount - 1 };
        } else if (cat.id === targetCategoryId) {
          return { ...cat, itemCount: cat.itemCount + 1 };
        }
        return cat;
      }));
    }
    setDraggedItem(null);
  };

  // Bulk operations
  const toggleBulkSelection = (itemId) => {
    const newSelected = bulkSelectedItems.includes(itemId)
      ? bulkSelectedItems.filter(id => id !== itemId)
      : [...bulkSelectedItems, itemId];
    setBulkSelectedItems(newSelected);
    setShowBulkActions(newSelected.length > 0);
  };

  const selectAllItems = () => {
    if (bulkSelectedItems.length === filteredMenuItems.length) {
      setBulkSelectedItems([]);
      setShowBulkActions(false);
    } else {
      setBulkSelectedItems(filteredMenuItems.map(item => item.id));
      setShowBulkActions(true);
    }
  };

  const bulkUpdateStatus = (isActive) => {
    setMenuItems(menuItems.map(item => 
      bulkSelectedItems.includes(item.id) ? { ...item, isActive } : item
    ));
    setBulkSelectedItems([]);
    setShowBulkActions(false);
  };

  const bulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${bulkSelectedItems.length} items?`)) {
      setMenuItems(menuItems.filter(item => !bulkSelectedItems.includes(item.id)));
      
      // Update category counts
      const deletedItems = menuItems.filter(item => bulkSelectedItems.includes(item.id));
      setCategories(categories.map(cat => {
        const deletedFromCategory = deletedItems.filter(item => item.categoryId === cat.id).length;
        return { ...cat, itemCount: cat.itemCount - deletedFromCategory };
      }));
      
      setBulkSelectedItems([]);
      setShowBulkActions(false);
    }
  };

  // Sorting functionality
  const sortItems = (items) => {
    return [...items].sort((a, b) => {
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
        case 'date':
          aValue = new Date(a.createdAt || Date.now());
          bValue = new Date(b.createdAt || Date.now());
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
  };

  // Quick actions
  const quickAddItem = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    setNewItem({
      ...newItem,
      category: category.name
    });
    setSelectedCategory(category);
    setShowAddItem(true);
  };

  const duplicateCategory = (category) => {
    const duplicatedCategory = {
      ...category,
      id: Date.now(),
      name: `${category.name} (Copy)`,
      itemCount: 0
    };
    setCategories([...categories, duplicatedCategory]);
  };

  // Category management functions
  const addCategory = () => {
    if (newCategory.name.trim()) {
      const category = {
        id: Date.now(),
        ...newCategory,
        itemCount: 0,
        description: newCategory.description || '',
        image: newCategory.image || '',
        isActive: true,
        sortOrder: newCategory.sortOrder || categories.length + 1
      };
      setCategories([...categories, category]);
      setNewCategory({
        name: '',
        description: '',
        image: '',
        isActive: true,
        sortOrder: categories.length + 1
      });
      setShowAddCategory(false);
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setNewCategory(category);
    setShowAddCategory(true);
  };

  const updateCategory = () => {
    if (newCategory.name.trim()) {
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { ...newCategory, id: editingCategory.id } : cat
      ));
      setNewCategory({
        name: '',
        description: '',
        image: '',
        isActive: true,
        sortOrder: 0
      });
      setShowAddCategory(false);
      setEditingCategory(null);
    }
  };

  const deleteCategory = (categoryId) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
    setMenuItems(menuItems.filter(item => item.categoryId !== categoryId));
  };

  const toggleCategoryStatus = (categoryId) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    ));
  };

  // Menu item management functions
  const addMenuItem = () => {
    if (newItem.name.trim() && newItem.price && newItem.category) {
      const item = {
        id: Date.now(),
        ...newItem,
        price: parseFloat(newItem.price),
        categoryId: categories.find(cat => cat.name === newItem.category)?.id,
        rating: 0,
        orderCount: 0,
        preparationTime: newItem.preparationTime || '10-15 minutes',
        ingredients: newItem.ingredients || '',
        image: newItem.image || '',
        isActive: true,
        isVegetarian: false,
        isSpicy: false,
        isPopular: false,
        sortOrder: newItem.sortOrder || 0
      };
      setMenuItems([...menuItems, item]);
      
      // Update category item count
      setCategories(categories.map(cat => 
        cat.id === item.categoryId ? { ...cat, itemCount: cat.itemCount + 1 } : cat
      ));
      
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        ingredients: '',
        preparationTime: '',
        isVegetarian: false,
        isSpicy: false,
        isPopular: false,
        isActive: true,
        sortOrder: 0
      });
      setShowAddItem(false);
    }
  };

  const editMenuItem = (item) => {
    setEditingItem(item);
    setNewItem({
      ...item,
      price: item.price.toString()
    });
    setShowAddItem(true);
  };

  const updateMenuItem = () => {
    if (newItem.name.trim() && newItem.price && newItem.category) {
      const updatedItem = {
        ...newItem,
        id: editingItem.id,
        price: parseFloat(newItem.price),
        categoryId: categories.find(cat => cat.name === newItem.category)?.id
      };
      
      setMenuItems(menuItems.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
      
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        ingredients: '',
        preparationTime: '',
        isVegetarian: false,
        isSpicy: false,
        isPopular: false,
        isActive: true,
        sortOrder: 0
      });
      setShowAddItem(false);
      setEditingItem(null);
    }
  };

  const deleteMenuItem = (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    setMenuItems(menuItems.filter(item => item.id !== itemId));
    
    // Update category item count
    setCategories(categories.map(cat => 
      cat.id === item.categoryId ? { ...cat, itemCount: cat.itemCount - 1 } : cat
    ));
  };

  const toggleItemStatus = (itemId) => {
    setMenuItems(menuItems.map(item => 
      item.id === itemId ? { ...item, isActive: !item.isActive } : item
    ));
  };

  const duplicateItem = (item) => {
    const duplicatedItem = {
      ...item,
      id: Date.now(),
      name: `${item.name} (Copy)`,
      orderCount: 0,
      rating: 0
    };
    setMenuItems([...menuItems, duplicatedItem]);
  };

  // Filter and search functions
  const filteredMenuItems = sortItems(menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory.id;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && item.isActive) ||
                         (filterStatus === 'inactive' && !item.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading menu management...</p>
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dynamic Menu Management</h1>
                <p className="text-gray-600">Create, organize, and manage your restaurant's menu with advanced tools</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                <button
                  onClick={() => window.location.href = '/restaurant/menu/add-item'}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Menu Item</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <button
                  onClick={() => window.location.href = '/restaurant/menu/items'}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">View All Items</span>
                  <span className="sm:hidden">View</span>
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Preview Menu'}</span>
                  <span className="sm:hidden">Preview</span>
                </button>
                <div className="flex gap-1 lg:gap-2">
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'categories' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Categories
                  </button>
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'items' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Items
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Menu Statistics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{menuStats.totalItems}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {menuStats.activeItems} active • {menuStats.totalItems - menuStats.activeItems} inactive
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {categories.filter(cat => cat.isActive).length} active
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  NPR {menuStats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  From all menu items
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-600 rounded text-white flex items-center justify-center text-xs font-bold">Rs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Popular Items</p>
                <p className="text-2xl font-bold text-gray-900">{menuStats.popularItems}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Featured items
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Categories Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Menu Categories</h2>
              <p className="text-sm text-gray-600">Organize your menu with categories and drag items between them</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddCategory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
          </div>

          {/* Categories Grid with Drag & Drop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, category.id)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.itemCount} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => quickAddItem(category.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Quick Add Item"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleCategoryExpansion(category.id)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View Items"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleCategoryStatus(category.id)}
                        className={`p-1 rounded transition-colors ${
                          category.isActive 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editCategory(category)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit Category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Drop items here
                    </div>
                  </div>

                  {/* Expanded Category Items */}
                  {expandedCategories.has(category.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="space-y-2">
                        {menuItems.filter(item => item.categoryId === category.id).map(item => (
                          <div 
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                          >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">NPR {item.price}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {item.isActive ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                        {menuItems.filter(item => item.categoryId === category.id).length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No items in this category</p>
                            <button
                              onClick={() => quickAddItem(category.id)}
                              className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-1"
                            >
                              Add first item
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty state for categories */}
          {categories.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500 mb-2">No categories yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Create your first menu category to organize your restaurant items
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Getting Started</h4>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Categories help organize your menu (e.g., Appetizers, Main Course, Beverages, Desserts)
                </p>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create First Category
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Items Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/restaurant/menu/items'}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <List className="w-4 h-4" />
                View All Items
              </button>
              <button
                onClick={() => window.location.href = '/restaurant/menu/add-item'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Quick Add Item
              </button>
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>

          {/* Advanced Filters and Search */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col gap-4">
              {/* Main Search and Filters Row */}
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
                    value={selectedCategory?.id || ''}
                    onChange={(e) => {
                      const category = categories.find(cat => cat.id === parseInt(e.target.value));
                      setSelectedCategory(category || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
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

                {/* Sort Options */}
                <div className="md:w-32">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price">Sort by Price</option>
                    <option value="popularity">Sort by Popularity</option>
                    <option value="date">Sort by Date</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="md:w-24">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <TrendingUp className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* View Mode */}
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

              {/* Bulk Actions Bar */}
              {showBulkActions && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-orange-800">
                        {bulkSelectedItems.length} items selected
                      </span>
                      <button
                        onClick={() => bulkUpdateStatus(true)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Activate
                      </button>
                      <button
                        onClick={() => bulkUpdateStatus(false)}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Deactivate
                      </button>
                      <button
                        onClick={bulkDelete}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setBulkSelectedItems([]);
                        setShowBulkActions(false);
                      }}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Select All Checkbox */}
          {filteredMenuItems.length > 0 && (
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSelectedItems.length === filteredMenuItems.length && filteredMenuItems.length > 0}
                    onChange={selectAllItems}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select all {filteredMenuItems.length} items
                  </span>
                </label>
                <div className="text-sm text-gray-500">
                  {bulkSelectedItems.length} selected
                </div>
              </div>
            </div>
          )}

          {/* Menu Items Grid/List */}
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredMenuItems.map(item => (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all ${
                  bulkSelectedItems.includes(item.id) ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                } ${viewMode === 'list' ? 'p-6' : 'p-6'}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
              >
                <div className={viewMode === 'list' ? 'flex items-center gap-6' : ''}>
                  {/* Item Image */}
                  <div className={`${viewMode === 'list' ? 'w-20 h-20' : 'w-full h-48'} bg-gray-100 rounded-lg flex items-center justify-center mb-4`}>
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Bulk Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={bulkSelectedItems.includes(item.id)}
                          onChange={() => toggleBulkSelection(item.id)}
                          className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            {item.isPopular && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <div className="flex items-center gap-1 cursor-move" title="Drag to move between categories">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <RupeeIcon className="w-3 h-3" />
                              {item.price}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.preparationTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {item.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleItemStatus(item.id)}
                          className={`p-1 rounded transition-colors ${
                            item.isActive 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => editMenuItem(item)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateItem(item)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {typeof item.category === 'object' ? (item.category?.displayName || item.category?.name || 'Uncategorized') : item.category || 'Uncategorized'}
                      </span>
                      {item.isVegetarian && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Vegetarian
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Spicy
                        </span>
                      )}
                      {item.isPopular && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Popular
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Order Count */}
                    <div className="text-sm text-gray-500">
                      {item.orderCount} orders • Last updated: Today
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-12">
              <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500 mb-2">
                {searchTerm || selectedCategory || filterStatus !== 'all' 
                  ? 'No menu items found'
                  : 'Welcome to your Menu Management!'
                }
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {searchTerm || selectedCategory || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start building your restaurant menu by adding categories and menu items'
                }
              </p>
              {!searchTerm && !selectedCategory && filterStatus === 'all' && categories.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Getting Started</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    1. First, create menu categories (e.g., Appetizers, Main Course)<br/>
                    2. Then add menu items to each category<br/>
                    3. Set prices, descriptions, and other details
                  </p>
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Category
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setNewCategory({
                    name: '',
                    description: '',
                    image: '',
                    isActive: true,
                    sortOrder: 0
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newCategory.image}
                  onChange={(e) => setNewCategory({...newCategory, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter image URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={newCategory.sortOrder}
                  onChange={(e) => setNewCategory({...newCategory, sortOrder: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newCategory.isActive}
                  onChange={(e) => setNewCategory({...newCategory, isActive: e.target.checked})}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingCategory ? updateCategory : addCategory}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button
                  onClick={() => {
                    setShowAddCategory(false);
                    setEditingCategory(null);
                    setNewCategory({
                      name: '',
                      description: '',
                      image: '',
                      isActive: true,
                      sortOrder: 0
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Menu Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => {
                  setShowAddItem(false);
                  setEditingItem(null);
                  setNewItem({
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    image: '',
                    ingredients: '',
                    preparationTime: '',
                    isVegetarian: false,
                    isSpicy: false,
                    isPopular: false,
                    isActive: true,
                    sortOrder: 0
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter item description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time</label>
                <input
                  type="text"
                  value={newItem.preparationTime}
                  onChange={(e) => setNewItem({...newItem, preparationTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 15-20 minutes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newItem.image}
                  onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter image URL"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                <textarea
                  value={newItem.ingredients}
                  onChange={(e) => setNewItem({...newItem, ingredients: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="2"
                  placeholder="List main ingredients"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={newItem.sortOrder}
                  onChange={(e) => setNewItem({...newItem, sortOrder: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVegetarian"
                    checked={newItem.isVegetarian}
                    onChange={(e) => setNewItem({...newItem, isVegetarian: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isVegetarian" className="ml-2 text-sm text-gray-700">
                    Vegetarian
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSpicy"
                    checked={newItem.isSpicy}
                    onChange={(e) => setNewItem({...newItem, isSpicy: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isSpicy" className="ml-2 text-sm text-gray-700">
                    Spicy
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={newItem.isPopular}
                    onChange={(e) => setNewItem({...newItem, isPopular: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isPopular" className="ml-2 text-sm text-gray-700">
                    Popular Item
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newItem.isActive}
                    onChange={(e) => setNewItem({...newItem, isActive: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active (visible to customers)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={editingItem ? updateMenuItem : addMenuItem}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button
                onClick={() => {
                  setShowAddItem(false);
                  setEditingItem(null);
                  setNewItem({
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    image: '',
                    ingredients: '',
                    preparationTime: '',
                    isVegetarian: false,
                    isSpicy: false,
                    isPopular: false,
                    isActive: true,
                    sortOrder: 0
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Customer Menu Preview</h3>
                  <p className="text-orange-100 mt-1">See how your menu appears to customers</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Menu Preview */}
                <div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                        Restaurant Menu
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        {categories.filter(cat => cat.isActive).map(category => (
                          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
                              <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                                {category.name}
                              </h5>
                            </div>
                            <div className="p-4 space-y-3">
                              {menuItems.filter(item => item.categoryId === category.id && item.isActive).map(item => (
                                <div key={item.id} className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h6 className="font-medium text-gray-900">{item.name}</h6>
                                        {item.isPopular && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                        {item.isVegetarian && (
                                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Veg</span>
                                        )}
                                        {item.isSpicy && (
                                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">Spicy</span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 font-medium text-gray-900">
                                          <div className="w-3 h-3 bg-orange-600 rounded text-white flex items-center justify-center text-xs">₹</div>
                                          {item.price}
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-600">
                                          <Clock className="w-3 h-3" />
                                          {item.preparationTime}
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-600">
                                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                          {item.rating}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {menuItems.filter(item => item.categoryId === category.id && item.isActive).length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                  <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">No active items in this category</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Analytics */}
                <div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        Menu Analytics
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-600 font-medium">Total Active Items</p>
                              <p className="text-2xl font-bold text-blue-900">{menuStats.activeItems}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                              <UtensilsCrossed className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-600 font-medium">Total Categories</p>
                              <p className="text-2xl font-bold text-green-900">{categories.filter(cat => cat.isActive).length}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                              <Tag className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-orange-600 font-medium">Popular Items</p>
                              <p className="text-2xl font-bold text-orange-900">{menuStats.popularItems}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                              <Star className="w-6 h-6 text-orange-600" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-purple-600 font-medium">Average Price</p>
                              <p className="text-2xl font-bold text-purple-900">
                                NPR {menuStats.totalItems > 0 ? Math.round(menuStats.totalRevenue / menuStats.totalItems) : 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-purple-600 rounded text-white flex items-center justify-center text-xs font-bold">₹</div>
                            </div>
                          </div>
                        </div>

                        {/* Top Performing Items */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-600" />
                            Top Performing Items
                          </h5>
                          <div className="space-y-3">
                            {menuItems
                              .filter(item => item.isActive)
                              .sort((a, b) => b.orderCount - a.orderCount)
                              .slice(0, 5)
                              .map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold text-orange-600">#{index + 1}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">{item.orderCount} orders</span>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  </div>
                                </div>
                              ))}
                            {menuItems.filter(item => item.isActive).length === 0 && (
                              <div className="text-center py-4 text-gray-500">
                                <p className="text-sm">No items to display</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
  );
};

export default MenuManagement;
