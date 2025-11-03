import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Users,
  Percent,
  Tag,
  Gift,
  Star,
  Copy,
  Archive,
  BarChart3,
  Filter,
  Search,
  Grid,
  List,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Timer,
  MapPin,
  Smartphone
} from 'lucide-react';
import api from '../../../utils/api';

// Font Awesome Rupee Icon Component (₹)
const RupeeIcon = ({ className }) => (
  <i className={`fas fa-rupee-sign ${className}`}></i>
);

const Promotions = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [promotions, setPromotions] = useState([]);
  const [showAddPromotion, setShowAddPromotion] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Form state for new promotion
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    type: 'percentage', // percentage, fixed, buy_one_get_one, free_delivery
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    applicableItems: [],
    applicableCategories: [],
    customerLimit: '',
    usageLimit: '',
    isActive: true,
    isPopular: false,
    targetAudience: 'all', // all, new_customers, loyal_customers, specific_area
    deliveryArea: [],
    conditions: '',
    termsAndConditions: ''
  });

  // Mock data removed - using API calls

  useEffect(() => {
    // Fetch promotions from API
    const fetchPromotions = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await api.get('/restaurant/promotions');
        // setPromotions(response.data.data);
        setPromotions([]); // Empty array until API is implemented
      } catch (error) {
        console.error('Error fetching promotions:', error);
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPromotions();
  }, []);

  // Promotion management functions
  const addPromotion = () => {
    if (newPromotion.name.trim() && newPromotion.value) {
      const promotion = {
        id: Date.now(),
        ...newPromotion,
        value: parseFloat(newPromotion.value),
        minOrderAmount: parseFloat(newPromotion.minOrderAmount) || 0,
        maxDiscountAmount: parseFloat(newPromotion.maxDiscountAmount) || 0,
        customerLimit: parseInt(newPromotion.customerLimit) || 0,
        usageLimit: parseInt(newPromotion.usageLimit) || 0,
        stats: {
          totalUses: 0,
          totalSavings: 0,
          conversionRate: 0,
          revenue: 0
        },
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: null
      };
      setPromotions([...promotions, promotion]);
      resetForm();
      setShowAddPromotion(false);
    }
  };

  const editPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setNewPromotion({
      ...promotion,
      value: promotion.value.toString(),
      minOrderAmount: promotion.minOrderAmount.toString(),
      maxDiscountAmount: promotion.maxDiscountAmount.toString(),
      customerLimit: promotion.customerLimit.toString(),
      usageLimit: promotion.usageLimit.toString()
    });
    setShowAddPromotion(true);
  };

  const updatePromotion = () => {
    if (newPromotion.name.trim() && newPromotion.value) {
      const updatedPromotion = {
        ...newPromotion,
        id: editingPromotion.id,
        value: parseFloat(newPromotion.value),
        minOrderAmount: parseFloat(newPromotion.minOrderAmount) || 0,
        maxDiscountAmount: parseFloat(newPromotion.maxDiscountAmount) || 0,
        customerLimit: parseInt(newPromotion.customerLimit) || 0,
        usageLimit: parseInt(newPromotion.usageLimit) || 0,
        stats: editingPromotion.stats
      };
      setPromotions(promotions.map(promo => 
        promo.id === editingPromotion.id ? updatedPromotion : promo
      ));
      resetForm();
      setShowAddPromotion(false);
      setEditingPromotion(null);
    }
  };

  const deletePromotion = (promotionId) => {
    setPromotions(promotions.filter(promo => promo.id !== promotionId));
  };

  const togglePromotionStatus = (promotionId) => {
    setPromotions(promotions.map(promo => 
      promo.id === promotionId ? { ...promo, isActive: !promo.isActive } : promo
    ));
  };

  const duplicatePromotion = (promotion) => {
    const duplicatedPromotion = {
      ...promotion,
      id: Date.now(),
      name: `${promotion.name} (Copy)`,
      stats: {
        totalUses: 0,
        totalSavings: 0,
        conversionRate: 0,
        revenue: 0
      },
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: null
    };
    setPromotions([...promotions, duplicatedPromotion]);
  };

  const resetForm = () => {
    setNewPromotion({
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      startDate: '',
      endDate: '',
      applicableItems: [],
      applicableCategories: [],
      customerLimit: '',
      usageLimit: '',
      isActive: true,
      isPopular: false,
      targetAudience: 'all',
      deliveryArea: [],
      conditions: '',
      termsAndConditions: ''
    });
  };

  // Filter and search functions
  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && promotion.isActive) ||
                         (filterStatus === 'inactive' && !promotion.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getPromotionTypeIcon = (type) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'fixed': return <RupeeIcon className="w-4 h-4" />;
      case 'buy_one_get_one': return <Gift className="w-4 h-4" />;
      case 'free_delivery': return <MapPin className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getPromotionTypeColor = (type) => {
    switch (type) {
      case 'percentage': return 'bg-blue-100 text-blue-600';
      case 'fixed': return 'bg-green-100 text-green-600';
      case 'buy_one_get_one': return 'bg-purple-100 text-purple-600';
      case 'free_delivery': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading promotions...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Promotions Management</h1>
            <p className="text-gray-600">Create and manage promotional campaigns, discounts, and special offers</p>
          </div>
          <button
            onClick={() => setShowAddPromotion(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Promotion
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Promotions</p>
              <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Promotions</p>
              <p className="text-2xl font-bold text-gray-900">
                {promotions.filter(p => p.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Uses</p>
              <p className="text-2xl font-bold text-gray-900">
                {promotions.reduce((sum, p) => sum + p.stats.totalUses, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Savings</p>
              <p className="text-2xl font-bold text-gray-900">
                NPR {promotions.reduce((sum, p) => sum + p.stats.totalSavings, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <RupeeIcon className="w-6 h-6 text-orange-600" />
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
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
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

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Promotions Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }>
        {filteredPromotions.map(promotion => (
          <div key={promotion.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{promotion.name}</h3>
                    {promotion.isPopular && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{promotion.description}</p>
                  
                  {/* Type and Status */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPromotionTypeColor(promotion.type)}`}>
                      {getPromotionTypeIcon(promotion.type)}
                      {promotion.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promotion.isActive)}`}>
                      {promotion.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePromotionStatus(promotion.id)}
                    className={`p-1 rounded transition-colors ${
                      promotion.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {promotion.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => editPromotion(promotion)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicatePromotion(promotion)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePromotion(promotion.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Promotion Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount Value:</span>
                  <span className="font-medium text-gray-900">
                    {promotion.type === 'percentage' ? `${promotion.value}%` : 
                     promotion.type === 'fixed' ? `NPR ${promotion.value}` :
                     promotion.type === 'buy_one_get_one' ? 'Buy 2 Get 1 Free' :
                     'Free Delivery'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Min Order:</span>
                  <span className="font-medium text-gray-900">NPR {promotion.minOrderAmount}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(promotion.endDate).toLocaleDateString('en-NP')}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{promotion.stats.totalUses}</p>
                  <p className="text-xs text-gray-600">Total Uses</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    NPR {promotion.stats.totalSavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">Total Savings</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Usage Progress</span>
                  <span>{promotion.stats.totalUses} / {promotion.usageLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((promotion.stats.totalUses / promotion.usageLimit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Conditions */}
              {promotion.conditions && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  <strong>Conditions:</strong> {promotion.conditions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPromotions.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500 mb-2">No promotions found</p>
          <p className="text-sm text-gray-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first promotion'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Promotion Modal */}
      {showAddPromotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
              </h3>
              <button
                onClick={() => {
                  setShowAddPromotion(false);
                  setEditingPromotion(null);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
                  <input
                    type="text"
                    value={newPromotion.name}
                    onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter promotion name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newPromotion.description}
                    onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter promotion description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label>
                  <select
                    value={newPromotion.type}
                    onChange={(e) => setNewPromotion({...newPromotion, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed">Fixed Amount Discount</option>
                    <option value="buy_one_get_one">Buy One Get One</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newPromotion.type === 'percentage' ? 'Discount Percentage' :
                     newPromotion.type === 'fixed' ? 'Discount Amount (NPR)' :
                     newPromotion.type === 'buy_one_get_one' ? 'Free Items Count' :
                     'Delivery Fee Waived'}
                  </label>
                  <input
                    type="number"
                    value={newPromotion.value}
                    onChange={(e) => setNewPromotion({...newPromotion, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                    disabled={newPromotion.type === 'free_delivery'}
                  />
                </div>
              </div>

              {/* Conditions & Limits */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Conditions & Limits</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (NPR)</label>
                  <input
                    type="number"
                    value={newPromotion.minOrderAmount}
                    onChange={(e) => setNewPromotion({...newPromotion, minOrderAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount Amount (NPR)</label>
                  <input
                    type="number"
                    value={newPromotion.maxDiscountAmount}
                    onChange={(e) => setNewPromotion({...newPromotion, maxDiscountAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Usage Limit</label>
                  <input
                    type="number"
                    value={newPromotion.customerLimit}
                    onChange={(e) => setNewPromotion({...newPromotion, customerLimit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0 = unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    value={newPromotion.usageLimit}
                    onChange={(e) => setNewPromotion({...newPromotion, usageLimit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0 = unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={newPromotion.targetAudience}
                    onChange={(e) => setNewPromotion({...newPromotion, targetAudience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Customers</option>
                    <option value="new_customers">New Customers Only</option>
                    <option value="loyal_customers">Loyal Customers Only</option>
                    <option value="specific_area">Specific Delivery Area</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Date Range</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Additional Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Conditions</label>
                  <textarea
                    value={newPromotion.conditions}
                    onChange={(e) => setNewPromotion({...newPromotion, conditions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="2"
                    placeholder="e.g., Valid only on weekends"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                  <textarea
                    value={newPromotion.termsAndConditions}
                    onChange={(e) => setNewPromotion({...newPromotion, termsAndConditions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="2"
                    placeholder="Additional terms and conditions"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={newPromotion.isActive}
                      onChange={(e) => setNewPromotion({...newPromotion, isActive: e.target.checked})}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Active (promotion is live)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPopular"
                      checked={newPromotion.isPopular}
                      onChange={(e) => setNewPromotion({...newPromotion, isPopular: e.target.checked})}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="isPopular" className="ml-2 text-sm text-gray-700">
                      Popular (featured promotion)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={editingPromotion ? updatePromotion : addPromotion}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
              </button>
              <button
                onClick={() => {
                  setShowAddPromotion(false);
                  setEditingPromotion(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;
