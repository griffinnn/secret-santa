/**
 * Validation Service
 * Provides form validation, input sanitization, and business rule validation
 */

class ValidationService {
    constructor() {
        // Common validation patterns
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            name: /^[a-zA-Z0-9\s\-'\.]{2,50}$/,
            exchangeName: /^[a-zA-Z0-9\s\-_]{3,50}$/,
            budget: /^\d+(\.\d{1,2})?$/
        };

        // Common validation messages
        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            name: 'Name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, apostrophes, and periods',
            exchangeName: 'Exchange name must be 3-50 characters and contain only letters, numbers, spaces, hyphens, and underscores',
            budget: 'Budget must be a valid number (e.g., 25.00)',
            minLength: (min) => `Must be at least ${min} characters`,
            maxLength: (max) => `Must be no more than ${max} characters`,
            match: 'Fields do not match',
            unique: 'This value is already in use'
        };
    }

    /**
     * Generic field validation
     */
    validateField(value, rules) {
        const errors = [];
        
        // Required check
        if (rules.required && (!value || value.toString().trim() === '')) {
            errors.push(this.messages.required);
            return errors; // Stop validation if required field is empty
        }

        // Skip other validations if field is empty and not required
        if (!value || value.toString().trim() === '') {
            return errors;
        }

        const cleanValue = value.toString().trim();

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(cleanValue)) {
            errors.push(rules.message || 'Invalid format');
        }

        // Length validations
        if (rules.minLength && cleanValue.length < rules.minLength) {
            errors.push(this.messages.minLength(rules.minLength));
        }

        if (rules.maxLength && cleanValue.length > rules.maxLength) {
            errors.push(this.messages.maxLength(rules.maxLength));
        }

        // Custom validation function
        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(cleanValue);
            if (customResult !== true) {
                errors.push(customResult || 'Invalid value');
            }
        }

        return errors;
    }

    /**
     * User Registration Validation
     */
    validateUserRegistration(data) {
        const errors = {};

        // Name validation
        const nameErrors = this.validateField(data.name, {
            required: true,
            pattern: this.patterns.name,
            message: this.messages.name
        });
        if (nameErrors.length > 0) {
            errors.name = nameErrors;
        }

        // Email validation
        const emailErrors = this.validateField(data.email, {
            required: true,
            pattern: this.patterns.email,
            message: this.messages.email
        });
        if (emailErrors.length > 0) {
            errors.email = emailErrors;
        }

        // Wish list validation (optional)
        if (data.wishList) {
            const wishListErrors = this.validateField(data.wishList, {
                maxLength: 500,
                custom: (value) => {
                    // Check for potentially harmful content
                    if (this.containsHarmfulContent(value)) {
                        return 'Wish list contains inappropriate content';
                    }
                    return true;
                }
            });
            if (wishListErrors.length > 0) {
                errors.wishList = wishListErrors;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    /**
     * User Login Validation
     */
    validateUserLogin(data) {
        const errors = {};

        // Email validation
        const emailErrors = this.validateField(data.email, {
            required: true,
            pattern: this.patterns.email,
            message: this.messages.email
        });
        if (emailErrors.length > 0) {
            errors.email = emailErrors;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    /**
     * Exchange Creation Validation
     */
    validateExchangeCreation(data) {
        const errors = {};

        // Exchange name validation
        const nameErrors = this.validateField(data.name, {
            required: true,
            pattern: this.patterns.exchangeName,
            message: this.messages.exchangeName
        });
        if (nameErrors.length > 0) {
            errors.name = nameErrors;
        }

        // Gift budget validation
        const budgetErrors = this.validateField(data.giftBudget, {
            required: true,
            pattern: this.patterns.budget,
            message: this.messages.budget,
            custom: (value) => {
                const num = parseFloat(value);
                if (num <= 0) {
                    return 'Budget must be greater than 0';
                }
                if (num > 10000) {
                    return 'Budget must be reasonable (under $10,000)';
                }
                return true;
            }
        });
        if (budgetErrors.length > 0) {
            errors.giftBudget = budgetErrors;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    /**
     * Profile Update Validation
     */
    validateProfileUpdate(data, currentUser) {
        const errors = {};

        // Name validation (if provided)
        if (data.name !== undefined) {
            const nameErrors = this.validateField(data.name, {
                required: true,
                pattern: this.patterns.name,
                message: this.messages.name
            });
            if (nameErrors.length > 0) {
                errors.name = nameErrors;
            }
        }

        // Email validation (if provided)
        if (data.email !== undefined) {
            const emailErrors = this.validateField(data.email, {
                required: true,
                pattern: this.patterns.email,
                message: this.messages.email
            });
            if (emailErrors.length > 0) {
                errors.email = emailErrors;
            }
        }

        // Wish list validation (if provided)
        if (data.wishList !== undefined) {
            const wishListErrors = this.validateField(data.wishList, {
                maxLength: 500,
                custom: (value) => {
                    if (value && this.containsHarmfulContent(value)) {
                        return 'Wish list contains inappropriate content';
                    }
                    return true;
                }
            });
            if (wishListErrors.length > 0) {
                errors.wishList = wishListErrors;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    /**
     * Business Rule Validations
     */
    async validateExchangeParticipation(exchangeId, userId) {
        try {
            // Import storage service dynamically to avoid circular dependencies
            const { default: storageService } = await import('./storage.js');
            
            const exchange = await storageService.getExchangeById(exchangeId);
            if (!exchange) {
                return { isValid: false, error: 'Exchange not found' };
            }

            if (exchange.status !== 'open') {
                return { isValid: false, error: 'Exchange is no longer accepting participants' };
            }

            if (exchange.participants.includes(userId)) {
                return { isValid: false, error: 'You are already participating in this exchange' };
            }

            if (exchange.createdBy === userId) {
                return { isValid: false, error: 'You cannot participate in an exchange you created' };
            }

            return { isValid: true };

        } catch (error) {
            console.error('❌ Exchange participation validation failed:', error);
            return { isValid: false, error: 'Validation failed' };
        }
    }

    async validateAssignmentGeneration(exchangeId) {
        try {
            const { default: storageService } = await import('./storage.js');
            
            const exchange = await storageService.getExchangeById(exchangeId);
            if (!exchange) {
                return { isValid: false, error: 'Exchange not found' };
            }

            if (exchange.assignmentsGenerated) {
                return { isValid: false, error: 'Assignments have already been generated' };
            }

            if (exchange.participants.length < 3) {
                return { isValid: false, error: 'Need at least 3 participants to generate assignments' };
            }

            return { isValid: true };

        } catch (error) {
            console.error('❌ Assignment generation validation failed:', error);
            return { isValid: false, error: 'Validation failed' };
        }
    }

    /**
     * Input Sanitization
     */
    sanitizeInput(input, options = {}) {
        if (typeof input !== 'string') {
            return '';
        }

        let sanitized = input.trim();

        // Remove HTML tags if requested
        if (options.stripHtml !== false) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }

        // Remove potentially dangerous characters
        if (options.removeDangerous !== false) {
            sanitized = sanitized.replace(/[<>'"&]/g, '');
        }

        // Limit length if specified
        if (options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }

        // Convert to lowercase if requested
        if (options.toLowerCase) {
            sanitized = sanitized.toLowerCase();
        }

        return sanitized;
    }

    sanitizeEmail(email) {
        return this.sanitizeInput(email, {
            toLowerCase: true,
            maxLength: 255
        });
    }

    sanitizeName(name) {
        return this.sanitizeInput(name, {
            maxLength: 50
        });
    }

    sanitizeExchangeName(name) {
        return this.sanitizeInput(name, {
            maxLength: 50
        });
    }

    sanitizeWishList(wishList) {
        return this.sanitizeInput(wishList, {
            maxLength: 500
        });
    }

    /**
     * Content Filtering
     */
    containsHarmfulContent(text) {
        if (!text || typeof text !== 'string') {
            return false;
        }

        const harmful = [
            // Basic profanity (you can expand this list)
            'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass',
            // Suspicious patterns
            'script', 'javascript:', 'vbscript:', 'onload', 'onerror',
            'http://', 'https://', 'www.',
            // Personal info patterns
            /\d{3}-\d{2}-\d{4}/, // SSN pattern
            /\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/ // Credit card pattern
        ];

        const lowerText = text.toLowerCase();
        
        return harmful.some(pattern => {
            if (typeof pattern === 'string') {
                return lowerText.includes(pattern);
            } else if (pattern instanceof RegExp) {
                return pattern.test(text);
            }
            return false;
        });
    }

    /**
     * Form Validation Helpers
     */
    validateForm(formData, validationRules) {
        const errors = {};
        let isValid = true;

        Object.keys(validationRules).forEach(field => {
            const fieldErrors = this.validateField(formData[field], validationRules[field]);
            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        });

        return {
            isValid: isValid,
            errors: errors
        };
    }

    /**
     * Real-time Validation
     */
    createFieldValidator(field, rules) {
        return (value) => {
            const errors = this.validateField(value, rules);
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        };
    }

    /**
     * Form Error Display Helpers
     */
    displayFieldErrors(fieldElement, errors) {
        if (!fieldElement) return;

        // Remove existing error displays
        this.clearFieldErrors(fieldElement);

        if (errors && errors.length > 0) {
            // Add error class to field
            fieldElement.classList.add('error');

            // Create and append error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errors[0]; // Show first error

            // Insert after the field
            fieldElement.parentNode.insertBefore(errorDiv, fieldElement.nextSibling);
        }
    }

    clearFieldErrors(fieldElement) {
        if (!fieldElement) return;

        // Remove error class
        fieldElement.classList.remove('error');

        // Remove error message
        const errorDiv = fieldElement.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    clearAllFormErrors(formElement) {
        if (!formElement) return;

        // Remove all error classes and messages
        const errorFields = formElement.querySelectorAll('.error');
        errorFields.forEach(field => {
            this.clearFieldErrors(field);
        });

        const errorMessages = formElement.querySelectorAll('.field-error');
        errorMessages.forEach(message => {
            message.remove();
        });
    }

    /**
     * Custom Validation Rules
     */
    addCustomRule(name, validator, message) {
        this.customRules = this.customRules || {};
        this.customRules[name] = {
            validator: validator,
            message: message
        };
    }

    getCustomRule(name) {
        return this.customRules?.[name] || null;
    }

    /**
     * Utility Functions
     */
    isValidEmail(email) {
        return this.patterns.email.test(email);
    }

    isValidName(name) {
        return this.patterns.name.test(name);
    }

    isValidExchangeName(name) {
        return this.patterns.exchangeName.test(name);
    }

    isValidBudget(budget) {
        return this.patterns.budget.test(budget);
    }

    formatCurrency(amount) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '$0.00';
        return `$${num.toFixed(2)}`;
    }

    formatErrors(errors) {
        if (!errors || typeof errors !== 'object') {
            return [];
        }

        const formatted = [];
        Object.keys(errors).forEach(field => {
            if (Array.isArray(errors[field])) {
                errors[field].forEach(error => {
                    formatted.push(`${field}: ${error}`);
                });
            }
        });

        return formatted;
    }
}

// Create and export singleton instance
const validationService = new ValidationService();
export default validationService;

// Make available globally for debugging
window.validationService = validationService;