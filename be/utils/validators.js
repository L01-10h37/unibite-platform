import { logger } from './logger.js';

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*)
 */
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters long`,
    };
  }

  if (!hasUpperCase) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!hasLowerCase) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!hasNumber) {
    return {
      valid: false,
      message: 'Password must contain at least one number',
    };
  }

  if (!hasSpecialChar) {
    return {
      valid: false,
      message: 'Password must contain at least one special character (!@#$%^&*)',
    };
  }

  return { valid: true };
};

/**
 * Validate name format
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required and must be a string' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 50) {
    return { valid: false, message: 'Name must not exceed 50 characters' };
  }

  return { valid: true };
};

/**
 * Validate phone format
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone is required and must be a string' };
  }

  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: 'Please enter a valid phone number' };
  }

  return { valid: true };
};

/**
 * Validate profile update data
 */
export const validateProfileUpdate = (data) => {
  const errors = [];

  if (data.name) {
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      errors.push(nameValidation.message);
    }
  }

  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.valid) {
      errors.push(phoneValidation.message);
    }
  }

  if (data.addresses !== undefined) {
    if (!Array.isArray(data.addresses)) {
      errors.push('addresses must be an array');
    } else {
      data.addresses.forEach((address, index) => {
        if (!address || typeof address !== 'object') {
          errors.push(`addresses[${index}] must be an object`);
          return;
        }

        if (!address.address || typeof address.address !== 'string' || !address.address.trim()) {
          errors.push(`addresses[${index}].address is required`);
        }

        if (address.title !== undefined && typeof address.title !== 'string') {
          errors.push(`addresses[${index}].title must be a string`);
        }

        if (
          address.type !== undefined &&
          !['home', 'school', 'office', 'other'].includes(address.type)
        ) {
          errors.push(`addresses[${index}].type is invalid`);
        }

        if (address.latitude !== undefined && Number.isNaN(Number(address.latitude))) {
          errors.push(`addresses[${index}].latitude must be a number`);
        }

        if (address.longitude !== undefined && Number.isNaN(Number(address.longitude))) {
          errors.push(`addresses[${index}].longitude must be a number`);
        }
      });
    }
  }

  if (
    data.defaultDeliveryAddressId !== undefined &&
    data.defaultDeliveryAddressId !== null &&
    typeof data.defaultDeliveryAddressId !== 'string'
  ) {
    errors.push('defaultDeliveryAddressId must be a string');
  }

  if (errors.length > 0) {
    return { valid: false, messages: errors };
  }

  return { valid: true };
};

/**
 * Validate password change data
 */
export const validatePasswordChange = (oldPassword, newPassword) => {
  if (!oldPassword || typeof oldPassword !== 'string') {
    return { valid: false, message: 'Old password is required' };
  }

  if (!newPassword || typeof newPassword !== 'string') {
    return { valid: false, message: 'New password is required' };
  }

  if (oldPassword === newPassword) {
    return { valid: false, message: 'New password must be different from old password' };
  }

  const strengthValidation = validatePasswordStrength(newPassword);
  if (!strengthValidation.valid) {
    return { valid: false, message: strengthValidation.message };
  }

  return { valid: true };
};
