export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.length <= maxLength;
};

export const validateNumeric = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

export const validatePositiveNumber = (value) => {
  return validateNumeric(value) && parseFloat(value) > 0;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateForm = (fields, values) => {
  const errors = {};

  fields.forEach(field => {
    const value = values[field.name];

    if (field.required && !validateRequired(value)) {
      errors[field.name] = `${field.label} is required`;
    } else if (value) {
      switch (field.type) {
        case 'email':
          if (!validateEmail(value)) {
            errors[field.name] = 'Please enter a valid email address';
          }
          break;
        case 'password':
          if (!validatePassword(value)) {
            errors[field.name] = 'Password must be at least 8 characters with uppercase, lowercase, and number';
          }
          break;
        case 'tel':
          if (!validatePhone(value)) {
            errors[field.name] = 'Please enter a valid phone number';
          }
          break;
        case 'number':
          if (!validateNumeric(value)) {
            errors[field.name] = 'Please enter a valid number';
          } else if (field.min !== undefined && parseFloat(value) < field.min) {
            errors[field.name] = `Value must be at least ${field.min}`;
          } else if (field.max !== undefined && parseFloat(value) > field.max) {
            errors[field.name] = `Value must be at most ${field.max}`;
          }
          break;
        case 'url':
          if (!validateUrl(value)) {
            errors[field.name] = 'Please enter a valid URL';
          }
          break;
        default:
          if (field.minLength && !validateMinLength(value, field.minLength)) {
            errors[field.name] = `Must be at least ${field.minLength} characters`;
          }
          if (field.maxLength && !validateMaxLength(value, field.maxLength)) {
            errors[field.name] = `Must be at most ${field.maxLength} characters`;
          }
      }
    }
  });

  return errors;
};
