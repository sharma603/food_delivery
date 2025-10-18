import React from 'react';

const BasicInfoStep = ({ formData, updateFormData, errors }) => {
 const cuisineOptions = [
 'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'American',
 'Mediterranean', 'French', 'Greek', 'Korean', 'Vietnamese', 'Turkish',
 'Lebanese', 'Spanish', 'German', 'Brazilian', 'Ethiopian', 'Moroccan',
 'Fast Food', 'Pizza', 'Burgers', 'Seafood', 'Vegetarian', 'Vegan',
 'Gluten-Free', 'Healthy', 'Desserts', 'Bakery', 'Coffee & Tea'
 ];

 const handleInputChange = (field, value) => {
 updateFormData({ [field]: value });
 };

 const handleCuisineToggle = (cuisine) => {
 const currentCuisines = formData.cuisineType || [];
 const updatedCuisines = currentCuisines.includes(cuisine)
 ? currentCuisines.filter(c => c !== cuisine)
 : [...currentCuisines, cuisine];

 updateFormData({ cuisineType: updatedCuisines });
 };

 return (
 <div className="step-content basic-info-step">
 <div className="step-header">
 <h2>Basic Restaurant Information</h2>
 <p>Tell us about your restaurant and what makes it special</p>
 </div>

 <div className="form-grid">
 {/* Restaurant Name */}
 <div className="form-group full-width">
 <label htmlFor="restaurantName">
 Restaurant Name <span className="required">*</span>
 </label>
 <input
 type="text"
 id="restaurantName"
 value={formData.restaurantName || ''}
 onChange={(e) => handleInputChange('restaurantName', e.target.value)}
 placeholder="Enter your restaurant name"
 className={errors.restaurantName ? 'error' : ''}
 />
 {errors.restaurantName && (
 <span className="error-text">{errors.restaurantName}</span>
 )}
 </div>

 {/* Website */}
 <div className="form-group full-width">
 <label htmlFor="website">Website (Optional)</label>
 <input
 type="url"
 id="website"
 value={formData.website || ''}
 onChange={(e) => handleInputChange('website', e.target.value)}
 placeholder="https://your-restaurant-website.com"
 />
 </div>

 {/* Description */}
 <div className="form-group full-width">
 <label htmlFor="description">
 Restaurant Description <span className="required">*</span>
 </label>
 <textarea
 id="description"
 value={formData.description || ''}
 onChange={(e) => handleInputChange('description', e.target.value)}
 placeholder="Describe your restaurant, specialties, atmosphere, and what makes you unique..."
 rows="4"
 className={errors.description ? 'error' : ''}
 />
 <div className="char-count">
 {(formData.description || '').length}/500
 </div>
 {errors.description && (
 <span className="error-text">{errors.description}</span>
 )}
 </div>

 {/* Cuisine Types */}
 <div className="form-group full-width">
 <label>
 Cuisine Types <span className="required">*</span>
 </label>
 <p className="field-description">
 Select all cuisine types that apply to your restaurant (minimum 1)
 </p>
 <div className="cuisine-grid">
 {cuisineOptions.map((cuisine) => (
 <div
 key={cuisine}
 className={`cuisine-option ${
 (formData.cuisineType || []).includes(cuisine) ? 'selected' : ''
 }`}
 onClick={() => handleCuisineToggle(cuisine)}
 >
 <span className="cuisine-name">{cuisine}</span>
 {(formData.cuisineType || []).includes(cuisine) && (
 <span className="checkmark"></span>
 )}
 </div>
 ))}
 </div>
 {errors.cuisineType && (
 <span className="error-text">{errors.cuisineType}</span>
 )}
 <div className="selected-cuisines">
 <strong>Selected:</strong> {(formData.cuisineType || []).join(', ') || 'None'}
 </div>
 </div>
 </div>

 {/* Tips Section */}
 <div className="tips-section">
 <h3>Tips for a Great Restaurant Profile</h3>
 <ul>
 <li><strong>Restaurant Name:</strong> Use your official business name as it appears on your license</li>
 <li><strong>Description:</strong> Highlight your specialties, unique ingredients, or cooking style</li>
 <li><strong>Cuisine Types:</strong> Be specific to help customers find you in searches</li>
 <li><strong>Website:</strong> Include your menu, photos, and contact information</li>
 </ul>
 </div>
 </div>
 );
};

export default BasicInfoStep;
