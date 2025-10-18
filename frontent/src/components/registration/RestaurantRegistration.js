import React, { useState } from 'react';
import BasicInfoStep from './steps/BasicInfoStep';
import LegalDocumentStep from './steps/LegalDocumentStep';
import ContactOperationalStep from './steps/ContactOperationalStep';
import AccountSecurityStep from './steps/AccountSecurityStep';
import RegistrationSuccess from './steps/RegistrationSuccess';


const RestaurantRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    restaurantName: '',
    cuisineType: [],
    description: '',
    website: '',

    // Legal Documentation
    businessLicense: null,
    foodSafetyLicense: null,
    taxId: '',
    registrationNumber: '',
    ownerName: '',
    ownerIdProof: null,

    // Contact & Operational
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: { lat: null, lng: null }
    },
    operatingHours: {
      monday: { open: '', close: '', closed: false },
      tuesday: { open: '', close: '', closed: false },
      wednesday: { open: '', close: '', closed: false },
      thursday: { open: '', close: '', closed: false },
      friday: { open: '', close: '', closed: false },
      saturday: { open: '', close: '', closed: false },
      sunday: { open: '', close: '', closed: false }
    },
    deliveryRadius: 5,
    minimumOrder: 0,
    deliveryFee: 0,
    estimatedDeliveryTime: 30,

    // Account Security
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
    agreedToTerms: false,
    marketingConsent: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Restaurant details and cuisine' },
    { number: 2, title: 'Legal Documents', description: 'Business licenses and verification' },
    { number: 3, title: 'Contact & Operations', description: 'Location and operating details' },
    { number: 4, title: 'Account Security', description: 'Login credentials and security' }
  ];

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const validateStep = (step) => {
    const stepErrors = {};

    switch (step) {
      case 1:
        if (!formData.restaurantName.trim()) stepErrors.restaurantName = 'Restaurant name is required';
        if (formData.cuisineType.length === 0) stepErrors.cuisineType = 'At least one cuisine type is required';
        if (!formData.description.trim()) stepErrors.description = 'Description is required';
        break;

      case 2:
        if (!formData.businessLicense) stepErrors.businessLicense = 'Business license is required';
        if (!formData.foodSafetyLicense) stepErrors.foodSafetyLicense = 'Food safety license is required';
        if (!formData.taxId.trim()) stepErrors.taxId = 'Tax ID is required';
        if (!formData.registrationNumber.trim()) stepErrors.registrationNumber = 'Registration number is required';
        if (!formData.ownerName.trim()) stepErrors.ownerName = 'Owner name is required';
        if (!formData.ownerIdProof) stepErrors.ownerIdProof = 'Owner ID proof is required';
        break;

      case 3:
        if (!formData.phone.trim()) stepErrors.phone = 'Phone number is required';
        if (!formData.email.trim()) stepErrors.email = 'Email is required';
        if (!formData.address.street.trim()) stepErrors.street = 'Street address is required';
        if (!formData.address.city.trim()) stepErrors.city = 'City is required';
        if (!formData.address.state.trim()) stepErrors.state = 'State is required';
        if (!formData.address.zipCode.trim()) stepErrors.zipCode = 'ZIP code is required';
        break;

      case 4:
        if (!formData.password) stepErrors.password = 'Password is required';
        if (formData.password.length < 8) stepErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) stepErrors.confirmPassword = 'Passwords do not match';
        if (!formData.securityQuestion.trim()) stepErrors.securityQuestion = 'Security question is required';
        if (!formData.securityAnswer.trim()) stepErrors.securityAnswer = 'Security answer is required';
        if (!formData.agreedToTerms) stepErrors.agreedToTerms = 'You must agree to the terms and conditions';
        break;

      default:
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Add basic information
      submitData.append('restaurantName', formData.restaurantName);
      submitData.append('cuisineType', JSON.stringify(formData.cuisineType));
      submitData.append('description', formData.description);
      submitData.append('website', formData.website);

      // Add legal documents
      if (formData.businessLicense) submitData.append('businessLicense', formData.businessLicense);
      if (formData.foodSafetyLicense) submitData.append('foodSafetyLicense', formData.foodSafetyLicense);
      if (formData.ownerIdProof) submitData.append('ownerIdProof', formData.ownerIdProof);
      submitData.append('taxId', formData.taxId);
      submitData.append('registrationNumber', formData.registrationNumber);
      submitData.append('ownerName', formData.ownerName);

      // Add contact and operational details
      submitData.append('phone', formData.phone);
      submitData.append('email', formData.email);
      submitData.append('address', JSON.stringify(formData.address));
      submitData.append('operatingHours', JSON.stringify(formData.operatingHours));
      submitData.append('deliveryRadius', formData.deliveryRadius);
      submitData.append('minimumOrder', formData.minimumOrder);
      submitData.append('deliveryFee', formData.deliveryFee);
      submitData.append('estimatedDeliveryTime', formData.estimatedDeliveryTime);

      // Add account security
      submitData.append('password', formData.password);
      submitData.append('securityQuestion', formData.securityQuestion);
      submitData.append('securityAnswer', formData.securityAnswer);
      submitData.append('marketingConsent', formData.marketingConsent);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/restaurant/auth/register`, {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        setCurrentStep(5); // Success step
      } else {
        setErrors({ submit: result.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <LegalDocumentStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <ContactOperationalStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <AccountSecurityStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 5:
        return <RegistrationSuccess />;
      default:
        return null;
    }
  };

  if (currentStep === 5) {
    return renderStep();
  }

  return (
    <div className="restaurant-registration">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Restaurant Registration</h1>
          <p>Join our platform and start reaching more customers</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`step ${currentStep >= step.number ? 'active' : ''} ${
                currentStep > step.number ? 'completed' : ''
              }`}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-content">
          {renderStep()}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <div className="action-buttons">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Previous
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="registration-help">
          <p>Need help? Contact our support team at <a href="mailto:support@fooddelivery.com">support@fooddelivery.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRegistration;
