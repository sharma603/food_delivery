import React, { useState } from 'react';

const ContactOperationalStep = ({ formData, updateFormData, errors }) => {
 const [addressSuggestions, setAddressSuggestions] = useState([]);

 const handleInputChange = (field, value) => {
 updateFormData({ [field]: value });
 };

 const handleAddressChange = (field, value) => {
 const updatedAddress = { ...formData.address, [field]: value };
 updateFormData({ address: updatedAddress });

 // Real data
 if (field === 'street' && value.length > 3) {
 setAddressSuggestions([
 `${value} Street, Downtown`,
 `${value} Avenue, City Center`,
 `${value} Boulevard, Main District`
 ]);
 } else {
 setAddressSuggestions([]);
 }
 };

 const handleOperatingHoursChange = (day, field, value) => {
 const updatedHours = {
 ...formData.operatingHours,
 [day]: { ...formData.operatingHours[day], [field]: value }
 };
 updateFormData({ operatingHours: updatedHours });
 };

 const toggleDayClosed = (day) => {
 const currentDay = formData.operatingHours[day];
 const updatedHours = {
 ...formData.operatingHours,
 [day]: {
 ...currentDay,
 closed: !currentDay.closed,
 open: currentDay.closed ? '09:00' : '',
 close: currentDay.closed ? '22:00' : ''
 }
 };
 updateFormData({ operatingHours: updatedHours });
 };

 const copyHoursToAll = (sourceDay) => {
 const sourceHours = formData.operatingHours[sourceDay];
 const updatedHours = {};

 Object.keys(formData.operatingHours).forEach(day => {
 updatedHours[day] = { ...sourceHours };
 });

 updateFormData({ operatingHours: updatedHours });
 };

 const timeSlots = Array.from({ length: 48 }, (_, i) => {
 const hour = Math.floor(i / 2);
 const minute = i % 2 === 0 ? '00' : '30';
 const time = `${hour.toString().padStart(2, '0')}:${minute}`;
 const displayTime = new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
 hour: 'numeric',
 minute: '2-digit',
 hour12: true
 });
 return { value: time, label: displayTime };
 });

 const days = [
 { key: 'monday', label: 'Monday' },
 { key: 'tuesday', label: 'Tuesday' },
 { key: 'wednesday', label: 'Wednesday' },
 { key: 'thursday', label: 'Thursday' },
 { key: 'friday', label: 'Friday' },
 { key: 'saturday', label: 'Saturday' },
 { key: 'sunday', label: 'Sunday' }
 ];

 return (
 <div className="step-content contact-operational-step">
 <div className="step-header">
 <h2>Contact & Operational Details</h2>
 <p>Provide your contact information and operating schedule</p>
 </div>

 <div className="form-sections">
 {/* Contact Information */}
 <section className="form-section">
 <h3>Contact Information</h3>
 <div className="form-grid">
 <div className="form-group">
 <label htmlFor="phone">
 Phone Number <span className="required">*</span>
 </label>
 <input
 type="tel"
 id="phone"
 value={formData.phone || ''}
 onChange={(e) => handleInputChange('phone', e.target.value)}
 placeholder="+1 (555) 123-4567"
 className={errors.phone ? 'error' : ''}
 />
 {errors.phone && <span className="error-text">{errors.phone}</span>}
 </div>

 <div className="form-group">
 <label htmlFor="email">
 Email Address <span className="required">*</span>
 </label>
 <input
 type="email"
 id="email"
 value={formData.email || ''}
 onChange={(e) => handleInputChange('email', e.target.value)}
 placeholder="restaurant@example.com"
 className={errors.email ? 'error' : ''}
 />
 {errors.email && <span className="error-text">{errors.email}</span>}
 </div>
 </div>
 </section>

 {/* Address Information */}
 <section className="form-section">
 <h3>Restaurant Address</h3>
 <div className="form-grid">
 <div className="form-group full-width address-field">
 <label htmlFor="street">
 Street Address <span className="required">*</span>
 </label>
 <input
 type="text"
 id="street"
 value={formData.address?.street || ''}
 onChange={(e) => handleAddressChange('street', e.target.value)}
 placeholder="123 Main Street"
 className={errors.street ? 'error' : ''}
 />
 {addressSuggestions.length > 0 && (
 <div className="address-suggestions">
 {addressSuggestions.map((suggestion, index) => (
 <div
 key={index}
 className="address-suggestion"
 onClick={() => {
 handleAddressChange('street', suggestion);
 setAddressSuggestions([]);
 }}
 >
 {suggestion}
 </div>
 ))}
 </div>
 )}
 {errors.street && <span className="error-text">{errors.street}</span>}
 </div>

 <div className="form-group">
 <label htmlFor="city">
 City <span className="required">*</span>
 </label>
 <input
 type="text"
 id="city"
 value={formData.address?.city || ''}
 onChange={(e) => handleAddressChange('city', e.target.value)}
 placeholder="City name"
 className={errors.city ? 'error' : ''}
 />
 {errors.city && <span className="error-text">{errors.city}</span>}
 </div>

 <div className="form-group">
 <label htmlFor="state">
 State <span className="required">*</span>
 </label>
 <input
 type="text"
 id="state"
 value={formData.address?.state || ''}
 onChange={(e) => handleAddressChange('state', e.target.value)}
 placeholder="State"
 className={errors.state ? 'error' : ''}
 />
 {errors.state && <span className="error-text">{errors.state}</span>}
 </div>

 <div className="form-group">
 <label htmlFor="zipCode">
 ZIP Code <span className="required">*</span>
 </label>
 <input
 type="text"
 id="zipCode"
 value={formData.address?.zipCode || ''}
 onChange={(e) => handleAddressChange('zipCode', e.target.value)}
 placeholder="12345"
 className={errors.zipCode ? 'error' : ''}
 />
 {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
 </div>
 </div>
 </section>

 {/* Operating Hours */}
 <section className="form-section">
 <h3>Operating Hours</h3>
 <p className="section-description">
 Set your restaurant's operating hours for each day of the week
 </p>

 <div className="operating-hours-grid">
 {days.map(({ key, label }) => (
 <div key={key} className="day-hours">
 <div className="day-header">
 <div className="day-info">
 <label className="day-label">{label}</label>
 <label className="checkbox-container">
 <input
 type="checkbox"
 checked={formData.operatingHours?.[key]?.closed || false}
 onChange={() => toggleDayClosed(key)}
 />
 <span className="checkbox-text">Closed</span>
 </label>
 </div>
 <button
 type="button"
 className="copy-hours-btn"
 onClick={() => copyHoursToAll(key)}
 title="Copy these hours to all days"
 >
 
 </button>
 </div>

 {!formData.operatingHours?.[key]?.closed && (
 <div className="time-inputs">
 <div className="time-group">
 <label>Open</label>
 <select
 value={formData.operatingHours?.[key]?.open || '09:00'}
 onChange={(e) => handleOperatingHoursChange(key, 'open', e.target.value)}
 >
 {timeSlots.map(({ value, label }) => (
 <option key={value} value={value}>
 {label}
 </option>
 ))}
 </select>
 </div>

 <div className="time-group">
 <label>Close</label>
 <select
 value={formData.operatingHours?.[key]?.close || '22:00'}
 onChange={(e) => handleOperatingHoursChange(key, 'close', e.target.value)}
 >
 {timeSlots.map(({ value, label }) => (
 <option key={value} value={value}>
 {label}
 </option>
 ))}
 </select>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </section>

 {/* Delivery Settings */}
 <section className="form-section">
 <h3>Delivery Settings</h3>
 <div className="form-grid">
 <div className="form-group">
 <label htmlFor="deliveryRadius">
 Delivery Radius (miles)
 </label>
 <input
 type="number"
 id="deliveryRadius"
 min="1"
 max="50"
 value={formData.deliveryRadius || 5}
 onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value))}
 />
 <small>How far you're willing to deliver</small>
 </div>

 <div className="form-group">
 <label htmlFor="minimumOrder">
 Minimum Order Amount ($)
 </label>
 <input
 type="number"
 id="minimumOrder"
 min="0"
 step="0.01"
 value={formData.minimumOrder || 0}
 onChange={(e) => handleInputChange('minimumOrder', parseFloat(e.target.value))}
 />
 </div>

 <div className="form-group">
 <label htmlFor="deliveryFee">
 Delivery Fee ($)
 </label>
 <input
 type="number"
 id="deliveryFee"
 min="0"
 step="0.01"
 value={formData.deliveryFee || 0}
 onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value))}
 />
 </div>

 <div className="form-group">
 <label htmlFor="estimatedDeliveryTime">
 Estimated Delivery Time (minutes)
 </label>
 <input
 type="number"
 id="estimatedDeliveryTime"
 min="15"
 max="120"
 value={formData.estimatedDeliveryTime || 30}
 onChange={(e) => handleInputChange('estimatedDeliveryTime', parseInt(e.target.value))}
 />
 </div>
 </div>
 </section>
 </div>

 {/* Tips Section */}
 <div className="tips-section">
 <h3>Operational Tips</h3>
 <div className="tips-grid">
 <div className="tip-item">
 <h4>Operating Hours</h4>
 <p>Set realistic hours that you can consistently maintain. Customers rely on these times.</p>
 </div>
 <div className="tip-item">
 <h4>Delivery Settings</h4>
 <p>Consider traffic and distance when setting delivery radius and estimated times.</p>
 </div>
 <div className="tip-item">
 <h4>Contact Information</h4>
 <p>Use a dedicated business phone number and email that customers can reach during operating hours.</p>
 </div>
 </div>
 </div>
 </div>
 );
};

export default ContactOperationalStep;
