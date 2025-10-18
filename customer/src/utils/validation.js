// Input validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Nepali phone number validation (10 digits starting with 9)
  const phoneRegex = /^9[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validatePassword = (password) => {
  // At least 6 characters, at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
};

export const validateName = (name) => {
  // At least 2 characters, only letters and spaces
  const nameRegex = /^[A-Za-z\s]{2,}$/;
  return nameRegex.test(name.trim());
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.toString().trim().length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.toString().trim().length <= maxLength;
};

export const validateNumeric = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

export const validatePositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PHONE_INVALID: 'Please enter a valid phone number (10 digits starting with 9)',
  PASSWORD_WEAK: 'Password must be at least 6 characters with at least one letter and one number',
  NAME_INVALID: 'Name must be at least 2 characters and contain only letters',
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
  NUMERIC: 'Must be a valid number',
  POSITIVE_NUMBER: 'Must be a positive number',
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    if (rules.required && !validateRequired(value)) {
      errors[field] = VALIDATION_MESSAGES.REQUIRED;
      return;
    }
    
    if (value && rules.email && !validateEmail(value)) {
      errors[field] = VALIDATION_MESSAGES.EMAIL_INVALID;
      return;
    }
    
    if (value && rules.phone && !validatePhone(value)) {
      errors[field] = VALIDATION_MESSAGES.PHONE_INVALID;
      return;
    }
    
    if (value && rules.password && !validatePassword(value)) {
      errors[field] = VALIDATION_MESSAGES.PASSWORD_WEAK;
      return;
    }
    
    if (value && rules.name && !validateName(value)) {
      errors[field] = VALIDATION_MESSAGES.NAME_INVALID;
      return;
    }
    
    if (value && rules.minLength && !validateMinLength(value, rules.minLength)) {
      errors[field] = VALIDATION_MESSAGES.MIN_LENGTH(rules.minLength);
      return;
    }
    
    if (value && rules.maxLength && !validateMaxLength(value, rules.maxLength)) {
      errors[field] = VALIDATION_MESSAGES.MAX_LENGTH(rules.maxLength);
      return;
    }
    
    if (value && rules.numeric && !validateNumeric(value)) {
      errors[field] = VALIDATION_MESSAGES.NUMERIC;
      return;
    }
    
    if (value && rules.positiveNumber && !validatePositiveNumber(value)) {
      errors[field] = VALIDATION_MESSAGES.POSITIVE_NUMBER;
      return;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
