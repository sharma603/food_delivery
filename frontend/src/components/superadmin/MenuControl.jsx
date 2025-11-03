import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Eye, Utensils, DollarSign, Clock, Star, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { apiService as api } from '../../services/api';

const MenuControl = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter] = useState('all'); // setStatusFilter not used
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // State for dynamic data
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form data for add menu item
  const [formData, setFormData] = useState({
    restaurantId: '',
    categoryId: '',
    name: '',
    price: '',
    description: '',
    preparationTime: 15,
    ingredients: '',
    allergens: '',
    dietaryTags: '',
    image: '',
    isActive: true
  });

  // Data fetching functions
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for MenuControl...');
      
      const [categoriesRes, restaurantsRes, menuItemsRes] = await Promise.all([
        api.get('/superadmin/menu/categories'),
        api.get('/superadmin/restaurants'),
        api.get('/superadmin/menu/items')
      ]);

      console.log('Categories response:', categoriesRes.data);
      console.log('Restaurants response:', restaurantsRes.data);
      console.log('Menu items response:', menuItemsRes.data);

      if (categoriesRes.data.success && Array.isArray(categoriesRes.data.data)) {
        const activeCategories = categoriesRes.data.data.filter(cat => cat.isActive && !cat.isDeleted);
        console.log(`Found ${activeCategories.length} active categories`);
        setCategories(activeCategories);
      } else {
        console.log('No categories found');
        setCategories([]);
      }

      if (restaurantsRes.data.success && Array.isArray(restaurantsRes.data.data)) {
        console.log(`Found ${restaurantsRes.data.data.length} restaurants`);
        setRestaurants(restaurantsRes.data.data);
      } else {
        console.log('No restaurants found');
        setRestaurants([]);
      }

      if (menuItemsRes.data.success && Array.isArray(menuItemsRes.data.data)) {
        console.log(`Found ${menuItemsRes.data.data.length} menu items`);
        setMenuItems(menuItemsRes.data.data);
      } else {
        console.log('No menu items found');
        setMenuItems([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      console.log('Adding menu item:', formData);
      
      const menuItemData = {
        ...formData,
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime),
        ingredients: formData.ingredients.split(',').map(ing => ing.trim()).filter(Boolean),
        allergens: formData.allergens.split(',').map(all => all.trim()).filter(Boolean),
        dietaryTags: formData.dietaryTags.split(',').map(tag => tag.trim()).filter(Boolean),
        status: 'available'
      };

      const response = await api.post('/superadmin/menu/items', menuItemData);
      
      if (response.data.success) {
        console.log('Menu item added successfully');
        setShowAddModal(false);
        resetForm();
        // Refresh data
        fetchData();
      } else {
        throw new Error(response.data.message || 'Failed to add menu item');
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  const resetForm = () => {
    setFormData({
      restaurantId: '',
      categoryId: '',
      name: '',
      price: '',
      description: '',
      preparationTime: 15,
      ingredients: '',
      allergens: '',
      dietaryTags: '',
      image: '',
      isActive: true
    });
    setError(null);
  };

  // Menu items are now fetched from API in fetchData()


  // Fetch categories and restaurants from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await api.get('/superadmin/categories');
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data || []);
        }
        
        // Fetch restaurants (you may need to adjust this endpoint)
        const restaurantsResponse = await api.get('/restaurants');
        if (restaurantsResponse.data.success) {
          setRestaurants(restaurantsResponse.data.data || []);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load categories and restaurants');
        // Fallback to empty arrays
        setCategories([]);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // const statusOptions = ['all', 'available', 'unavailable', 'discontinued']; // Not currently used

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'unavailable':
        return <Badge variant="warning">Unavailable</Badge>;
      case 'discontinued':
        return <Badge variant="danger">Discontinued</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getDietaryBadge = (tags) => {
    if (tags.includes('Vegetarian')) {
      return <Badge variant="success">Veg</Badge>;
    } else if (tags.includes('Vegan')) {
      return <Badge variant="info">Vegan</Badge>;
    } else {
      return <Badge variant="warning">Non-Veg</Badge>;
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRestaurant = restaurantFilter === 'all' || item.restaurantId === restaurantFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesRestaurant && matchesCategory && matchesStatus;
  });

  const columns = [
    {
      key: 'name',
      header: 'Menu Item',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.restaurant?.name || 'N/A'}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (value) => (
        <div>
          <p className="text-sm text-gray-900">{value?.displayName || value?.name || 'N/A'}</p>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-gray-900">${(value || 0).toFixed(2)}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'dietaryTags',
      header: 'Dietary',
      sortable: true,
      render: (value) => getDietaryBadge(value)
    },
    {
      key: 'preparationTime',
      header: 'Prep Time',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Clock className="w-4 h-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">{value} min</span>
        </div>
      )
    },
    {
      key: 'popularity',
      header: 'Rating',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-400 mr-1" />
          <span className="text-sm text-gray-900">{value || '0.0'}</span>
        </div>
      )
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      sortable: true,
      render: (value) => (
        <div>
          <p className="text-sm text-gray-900">{value}</p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (value, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedItem(row);
              setShowItemModal(true);
            }}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditItem(row._id, row)}
          >
            <Edit size={16} />
          </Button>
        </div>
      )
    }
  ];

  const handleAddItem = async (itemData) => {
    try {
    console.log('Adding new menu item:', itemData);
      const response = await api.post('/superadmin/menu/items', itemData);
      
      if (response.data.success) {
        console.log('Menu item added successfully');
        // Refresh data to show the new item
        await fetchData();
        setShowAddModal(false);
        resetForm();
      } else {
        setError(response.data.message || 'Failed to add menu item');
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleEditItem = (itemId, itemData) => {
    console.log('Editing menu item:', itemId, itemData);
    // Implement edit item functionality
  };

  // const handleDeleteItem = (itemId) => {
  //   console.log('Deleting menu item:', itemId);
  //   // Implement delete item functionality
  // };

  const handleToggleAvailability = (itemId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    console.log('Toggling availability:', itemId, newStatus);
    // Implement toggle availability functionality
  };

  const getTotalItems = () => menuItems.length;
  const getAvailableItems = () => menuItems.filter(item => item.isActive !== false).length;
  const getAveragePrice = () => {
    if (menuItems.length === 0) return '0.00';
    const total = menuItems.reduce((acc, item) => acc + (item.price || 0), 0);
    return (total / menuItems.length).toFixed(2);
  };
  const getAverageRating = () => {
    if (menuItems.length === 0) return '0.0';
    const total = menuItems.reduce((acc, item) => acc + (item.rating || 0), 0);
    return (total / menuItems.length).toFixed(1);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Control</h1>
          <p className="text-gray-600">Loading categories and restaurants...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Control</h1>
          <p className="text-gray-600">Manage restaurant menus and items</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menu Control</h1>
        <p className="text-gray-600">Manage restaurant menus and items</p>
        </div>
        <Button 
          onClick={fetchData} 
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Filter size={20} className="mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Utensils className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalItems()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Items</p>
              <p className="text-2xl font-bold text-gray-900">{getAvailableItems()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Price</p>
              <p className="text-2xl font-bold text-gray-900">${getAveragePrice()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{getAverageRating()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search menu items, restaurants..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant
            </label>
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.displayName || category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter size={16} className="mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Menu Items Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Menu Items ({filteredItems.length})
          </h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Item
            </Button>
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button variant="outline" size="sm">
              Bulk Actions
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredItems}
          sortable={true}
        />
      </Card>

      {/* Item Details Modal */}
      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title="Menu Item Details"
        size="xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Item Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{selectedItem.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Restaurant:</span>
                    <span className="text-sm text-gray-900">{selectedItem.restaurantName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Category:</span>
                    <span className="text-sm text-gray-900">
                      {typeof selectedItem.category === 'object' ? (selectedItem.category?.displayName || selectedItem.category?.name || 'Uncategorized') : selectedItem.category || 'Uncategorized'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Price:</span>
                    <span className="text-sm text-gray-900">${selectedItem.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Item Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Prep Time:</span>
                    <span className="text-sm text-gray-900">{selectedItem.preparationTime} minutes</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Rating:</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900">{selectedItem.popularity}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Total Orders:</span>
                    <span className="text-sm text-gray-900">{selectedItem.totalOrders}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Last Updated:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedItem.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Description</h4>
              <p className="text-sm text-gray-700">{selectedItem.description}</p>
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Ingredients</h4>
              <div className="flex flex-wrap gap-2">
                {selectedItem.ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="outline">{ingredient}</Badge>
                ))}
              </div>
            </div>

            {/* Allergens and Dietary Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Allergens</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.allergens.map((allergen, index) => (
                    <Badge key={index} variant="warning">{allergen}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Dietary Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.dietaryTags.map((tag, index) => (
                    <Badge key={index} variant="info">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Customization Options */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Customization Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Sizes</h5>
                  <div className="space-y-1">
                    {selectedItem.customization.sizes.map((size, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-900">{size.name}</span>
                        <span className="text-sm font-medium text-gray-900">${size.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Add-ons</h5>
                  <div className="space-y-1">
                    {selectedItem.customization.addons.map((addon, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-900">{addon.name}</span>
                        <span className="text-sm font-medium text-gray-900">${addon.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowItemModal(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(true);
                  setShowItemModal(false);
                }}
              >
                <Edit size={16} className="mr-2" />
                Edit Item
              </Button>
              <Button
                variant={selectedItem.status === 'available' ? 'warning' : 'success'}
                onClick={() => {
                  handleToggleAvailability(selectedItem.id, selectedItem.status);
                  setShowItemModal(false);
                }}
              >
                {selectedItem.status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title=""
        size="xl"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Menu Item</h2>
            <p className="text-gray-600">Create a new menu item for restaurants</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddItem(formData);
          }} className="space-y-8">
            
            {/* Restaurant Selection Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Restaurant Selection
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Restaurant <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.restaurantId}
                  onChange={(e) => handleFormChange('restaurantId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Choose a restaurant...</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.restaurantName || restaurant.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the restaurant this item belongs to</p>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., Margherita Pizza"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a descriptive name for the menu item</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.categoryId}
                    onChange={(e) => handleFormChange('categoryId', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.displayName || category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose the appropriate category</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter the price in USD</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={(e) => handleFormChange('preparationTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Estimated preparation time</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Describe the dish, its taste, and what makes it special..."
                />
                <p className="text-xs text-gray-500 mt-1">Provide a detailed description of the menu item</p>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingredients
                  </label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => handleFormChange('ingredients', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Tomato, Mozzarella, Basil, Dough"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate ingredients with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergens
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => handleFormChange('allergens', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Gluten, Dairy, Nuts"
                  />
                  <p className="text-xs text-gray-500 mt-1">List any allergens present</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Tags
                  </label>
                  <input
                    type="text"
                    value={formData.dietaryTags}
                    onChange={(e) => handleFormChange('dietaryTags', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Vegetarian, Vegan, Gluten-Free"
                  />
                  <p className="text-xs text-gray-500 mt-1">Add dietary preferences or restrictions</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select 
                    value={formData.isActive ? 'available' : 'unavailable'}
                    onChange={(e) => handleFormChange('isActive', e.target.value === 'available')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Set the availability status</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-6 py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Menu Item
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Menu Item"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Functionality</h3>
              <p className="text-gray-600 mb-4">Edit functionality will be implemented in the next phase.</p>
              <p className="text-sm text-gray-500">Selected Item: {selectedItem.name}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MenuControl;
