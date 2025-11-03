import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Tag,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader,
  Package
} from 'lucide-react';
import api from '../../../utils/api';

const Categories = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteMode, setDeleteMode] = useState('hard'); // 'soft' or 'hard'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    sortOrder: 0,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching categories...');
      
      const [categoriesRes, restaurantsRes] = await Promise.all([
        api.get('/superadmin/menu/categories'),
        api.get('/superadmin/restaurants')
      ]);

      console.log('Categories Response:', categoriesRes.data);
      console.log('Categories loaded:', categoriesRes.data.data);

      setCategories(categoriesRes.data.data || []);
      setRestaurants(restaurantsRes.data.data || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.message || 'Failed to load categories. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        await api.put(`/superadmin/menu/categories/${editingCategory}`, formData);
        setSuccess('Category updated successfully!');
      } else {
        // Create new category
        await api.post('/superadmin/menu/categories', formData);
        setSuccess('Category created successfully!');
      }

      setShowAddModal(false);
      setEditingCategory(null);
      resetForm();
      fetchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving category:', error);
      setError(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name || category,
      displayName: category.displayName || category.name || category,
      description: category.description || '',
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive !== false
    });
    setEditingCategory(category._id || category);
    setShowAddModal(true);
  };

  const handleDelete = async (category, forceDelete = false) => {
    try {
      const categoryId = category._id || category;
      const url = forceDelete 
        ? `/superadmin/menu/categories/${categoryId}?force=true`
        : `/superadmin/menu/categories/${categoryId}`;
      
      console.log('Deleting category:', categoryId, forceDelete ? '(force delete)' : '(soft delete)');
      
      const response = await api.delete(url);
      
      if (response.data.success) {
        const deleteType = forceDelete ? 'permanently deleted' : 'deleted';
        setSuccess(`Category ${deleteType} successfully!`);
        setDeleteConfirm(null);
        setDeleteMode('hard'); // Reset to default
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      console.error('Error details:', error.response?.data);
      
      // If delete failed due to usage, offer force delete option
      if (error.response?.data?.message?.includes('being used')) {
        setError(error.response.data.message + ' Would you like to force delete?');
        setDeleteMode('force');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to delete category');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      sortOrder: 0,
      isActive: true
    });
    setEditingCategory(null);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    resetForm();
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Food Categories</h1>
            <p className="text-gray-500 mt-1">Manage menu categories for all restaurants</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Categories shown here are extracted from existing menu items. 
          You can also create new categories that will be available when adding menu items.
        </p>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
          <p className="text-gray-500 mb-4">
            Categories will appear here once you add menu items, or you can create preset categories now.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category, index) => {
            const categoryName = typeof category === 'string' ? category : category.name;
            const categoryData = typeof category === 'object' ? category : { name: category };
            const displayName = categoryData.displayName || categoryName;
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                      {categoryName !== displayName && (
                        <p className="text-sm text-gray-500">{categoryName}</p>
                      )}
                      {categoryData.description && (
                        <p className="text-sm text-gray-500 mt-1">{categoryData.description}</p>
                      )}
                      {categoryData.itemCount !== undefined && (
                        <p className="text-xs text-gray-400 mt-1">
                          {categoryData.itemCount} items
                        </p>
                      )}
                    </div>
                  </div>
                  {categoryData.isActive !== false && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(categoryData)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(categoryData)}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., appetizers, main-course, desserts"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Internal name (lowercase, no spaces)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Appetizers, Main Course, Desserts"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">User-friendly display name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Active Category</label>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteMode('hard');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to delete <strong>"{deleteConfirm.displayName || deleteConfirm.name || deleteConfirm}"</strong>?
              </p>
              
              {/* Delete Type Selection */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deleteType"
                    value="hard"
                    checked={deleteMode === 'hard'}
                    onChange={(e) => setDeleteMode(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Permanent Delete</strong> - Remove from database completely
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deleteType"
                    value="soft"
                    checked={deleteMode === 'soft'}
                    onChange={(e) => setDeleteMode(e.target.value)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Soft Delete</strong> - Hide from interface but keep in database
                  </span>
                </label>
              </div>
              
              {deleteMode === 'hard' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-800">
                    <strong>Warning:</strong> This will permanently remove the category from the database. 
                    All menu items using this category will have their category reference removed.
                  </p>
                </div>
              )}
              
              {deleteMode === 'soft' && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800">
                    <strong>Note:</strong> The category will be hidden from the interface but can be restored later.
                  </p>
                </div>
              )}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
                {error.includes('being used') && (
                  <button
                    onClick={() => {
                      setDeleteMode('force');
                      setError('');
                    }}
                    className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
                  >
                    Force Delete Anyway
                  </button>
                )}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteMode('hard');
                  setError('');
                }}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm, deleteMode === 'hard' || deleteMode === 'force')}
                className={`flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                  deleteMode === 'force' 
                    ? 'bg-red-700 hover:bg-red-800' 
                    : deleteMode === 'hard'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {deleteMode === 'force' ? 'Force Delete' : 
                 deleteMode === 'hard' ? 'Permanent Delete' : 'Soft Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

