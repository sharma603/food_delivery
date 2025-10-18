import React, { useState, useEffect } from 'react';
import {
  Upload,
  X,
  Plus,
  Save,
  Image as ImageIcon,
  DollarSign,
  Package,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader,
  Info
} from 'lucide-react';
import api from '../../../utils/api';

// Font Awesome Rupee Icon Component (₹)
const RupeeIcon = ({ className }) => (
  <i className={`fas fa-rupee-sign ${className}`}></i>
);

const AddMenuItem = () => {
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    restaurantId: '',
    name: '',
    description: '',
    price: '',
    category: '',
    isVeg: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 'none',
    preparationTime: '',
    calories: '',
    ingredients: '',
    isAvailable: true,
    isFeatured: false,
    discount: '',
    tags: []
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
    
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/superadmin/restaurants');
      setRestaurants(response.data.data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants');
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      // Fetch categories from the SuperAdmin API endpoint
      const response = await api.get('/superadmin/menu/categories');
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to empty array if API fails
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.restaurantId) {
        setError('Please select a restaurant');
        setLoading(false);
        return;
      }
      if (!formData.name.trim()) {
        setError('Please enter item name');
        setLoading(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }
      if (!formData.category) {
        setError('Please select a category');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();
      
      // Prepare form data with proper field mapping
      const formDataToSubmit = {
        ...formData,
        categoryId: formData.category, // Map category to categoryId for API
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime) || 15,
        calories: parseInt(formData.calories) || 0,
        discount: parseFloat(formData.discount) || 0
      };
      
      // Append all form fields
      Object.keys(formDataToSubmit).forEach(key => {
        if (key === 'tags') {
          submitData.append(key, JSON.stringify(formDataToSubmit[key]));
        } else if (key === 'category') {
          // Skip the original category field, we're using categoryId
          return;
        } else {
          submitData.append(key, formDataToSubmit[key]);
        }
      });

      // Append images
      images.forEach((image, index) => {
        submitData.append(`images`, image);
      });

      const response = await api.post('/superadmin/menu', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Menu item added successfully!');
      
      // Reset form
      setFormData({
        restaurantId: '',
        name: '',
        description: '',
        price: '',
        category: '',
        isVeg: false,
        isVegan: false,
        isGlutenFree: false,
        spicyLevel: 'none',
        preparationTime: '',
        calories: '',
        ingredients: '',
        isAvailable: true,
        isFeatured: false,
        discount: '',
        tags: []
      });
      setImages([]);
      setImagePreviews([]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error adding menu item:', error);
      setError(error.response?.data?.message || 'Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Add Menu Item</h1>
        <p className="text-gray-500 text-sm">Create a new menu item for restaurants</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Restaurant Selection */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Restaurant Selection</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Restaurant <span className="text-red-500">*</span>
            </label>
            <select
              name="restaurantId"
              value={formData.restaurantId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Choose a restaurant...</option>
              {restaurants.map(restaurant => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.name} - {restaurant.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Margherita Pizza"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the dish..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={fetchCategories}
                  disabled={categoriesLoading}
                  className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {categoriesLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? 'Loading categories...' : 'Select category...'}
                </option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.displayName || category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !categoriesLoading && (
                <p className="text-xs text-red-500 mt-1">
                  No categories available. Please add categories first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (NPR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <RupeeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleInputChange}
                placeholder="e.g., 15"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                name="calories"
                value={formData.calories}
                onChange={handleInputChange}
                placeholder="e.g., 350"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredients (comma-separated)
              </label>
              <input
                type="text"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                placeholder="e.g., Tomato, Cheese, Basil, Olive Oil"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Item Images</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-3 pb-4">
                  <Upload className="w-6 h-6 mb-1 text-gray-500" />
                  <p className="mb-1 text-xs text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB, up to 5 images)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dietary Information */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Dietary Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isVeg"
                checked={formData.isVeg}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-xs font-medium text-gray-700">Vegetarian</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isVegan"
                checked={formData.isVegan}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-xs font-medium text-gray-700">Vegan</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isGlutenFree"
                checked={formData.isGlutenFree}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-xs font-medium text-gray-700">Gluten-Free</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spicy Level</label>
              <select
                name="spicyLevel"
                value={formData.spicyLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="none">None</option>
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
                <option value="extra-hot">Extra Hot</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Tags</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag (e.g., Popular, Chef's Special)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Additional Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-xs font-medium text-gray-700">Available for Order</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-xs font-medium text-gray-700">Featured Item</label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Adding Item...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Add Menu Item
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMenuItem;

