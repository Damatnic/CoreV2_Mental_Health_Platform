import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Search, X, Calendar, Clock, User, Mail, Lock, Phone } from 'lucide-react';

export type InputVariant = 'default' | 'outlined' | 'filled' | 'underlined' | 'borderless';
export type InputSize = 'sm' | 'md' | 'lg' | 'xl';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea' | 'date' | 'time' | 'datetime-local';

export interface AppInputProps {
  // Basic props
  id?: string;
  name?: string;
  type?: InputType;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  
  // Styling
  variant?: InputVariant;
  size?: InputSize;
  fullWidth?: boolean;
  className?: string;
  
  // Label and help text
  label?: string;
  helperText?: string;
  hideLabel?: boolean;
  
  // Validation
  error?: boolean;
  errorMessage?: string;
  success?: boolean;
  successMessage?: string;
  validate?: (value: string) => string | null;
  
  // Icons and addons
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  startAddon?: React.ReactNode;
  endAddon?: React.ReactNode;
  clearable?: boolean;
  
  // Input limits
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  
  // Textarea specific
  rows?: number;
  cols?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  
  // Event handlers
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onClear?: () => void;
  onPasswordToggle?: (visible: boolean) => void;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

export const AppInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  AppInputProps
>(({
  // Basic props
  id,
  name,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  autoComplete,
  autoFocus = false,
  
  // Styling
  variant = 'outlined',
  size = 'md',
  fullWidth = false,
  className = '',
  
  // Label and help text
  label,
  helperText,
  hideLabel = false,
  
  // Validation
  error = false,
  errorMessage,
  success = false,
  successMessage,
  validate,
  
  // Icons and addons
  startIcon,
  endIcon,
  startAddon,
  endAddon,
  clearable = false,
  
  // Input limits
  minLength,
  maxLength,
  min,
  max,
  step,
  pattern,
  
  // Textarea specific
  rows = 4,
  cols,
  resize = 'vertical',
  
  // Event handlers
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  onKeyUp,
  onKeyPress,
  onClear,
  onPasswordToggle,
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
  
  ...restProps
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue?.toString() || '');
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value?.toString() || '' : internalValue;
  
  // Auto-generate ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  // Set ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(inputRef.current);
      } else {
        ref.current = inputRef.current;
      }
    }
  }, [ref]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Get appropriate icon for input type
  const getTypeIcon = () => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'password':
        return <Lock className="w-4 h-4" />;
      case 'search':
        return <Search className="w-4 h-4" />;
      case 'tel':
        return <Phone className="w-4 h-4" />;
      case 'date':
      case 'datetime-local':
        return <Calendar className="w-4 h-4" />;
      case 'time':
        return <Clock className="w-4 h-4" />;
      case 'text':
      case 'url':
        return <User className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
    xl: 'px-5 py-4 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'border border-gray-300 rounded-md bg-white',
    outlined: 'border-2 border-gray-300 rounded-lg bg-white',
    filled: 'border-0 bg-gray-100 rounded-lg',
    underlined: 'border-0 border-b-2 border-gray-300 bg-transparent rounded-none',
    borderless: 'border-0 bg-transparent'
  };

  // State classes
  const getStateClasses = () => {
    let classes = '';
    
    if (disabled) {
      classes += ' opacity-60 cursor-not-allowed bg-gray-50';
    } else if (error || validationError) {
      classes += ' border-red-500 focus:border-red-500 focus:ring-red-500';
    } else if (success) {
      classes += ' border-green-500 focus:border-green-500 focus:ring-green-500';
    } else if (focused) {
      classes += ' border-blue-500 focus:border-blue-500 focus:ring-blue-500';
    } else {
      classes += ' focus:border-blue-500 focus:ring-blue-500';
    }
    
    return classes;
  };

  // Handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    // Validate input
    if (validate) {
      const validationResult = validate(newValue);
      setValidationError(validationResult);
    }
    
    onChange?.(event);
  };

  // Handle input focus
  const handleFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  // Handle input blur
  const handleBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  // Handle password visibility toggle
  const handlePasswordToggle = () => {
    const newVisible = !passwordVisible;
    setPasswordVisible(newVisible);
    onPasswordToggle?.(newVisible);
  };

  // Handle clear
  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    setValidationError(null);
    onClear?.();
    
    // Create synthetic event for onChange
    if (onChange && inputRef.current) {
      const event = {
        target: { ...inputRef.current, value: '' },
        currentTarget: inputRef.current
      } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
      onChange(event);
    }
  };

  // Get current input type (handle password visibility)
  const currentType = type === 'password' && passwordVisible ? 'text' : type;

  // Determine if we should show clear button
  const showClearButton = clearable && currentValue && !disabled && !readOnly;

  // Determine if we should show password toggle
  const showPasswordToggle = type === 'password' && !disabled && !readOnly;

  // Get validation state
  const hasError = error || !!validationError;
  const hasSuccess = success && !hasError;

  // Build className
  const inputClasses = [
    'block w-full transition-colors duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-opacity-50',
    sizeClasses[size],
    variantClasses[variant],
    getStateClasses(),
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  // Build wrapper className
  const wrapperClasses = [
    'relative',
    fullWidth ? 'w-full' : 'inline-block'
  ].filter(Boolean).join(' ');

  // Common input props
  const commonProps = {
    ref: inputRef,
    id: inputId,
    name,
    value: currentValue,
    placeholder,
    disabled,
    readOnly,
    required,
    autoComplete,
    autoFocus,
    minLength,
    maxLength,
    min,
    max,
    step,
    pattern,
    className: inputClasses,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown,
    onKeyUp,
    onKeyPress,
    'aria-label': ariaLabel || label,
    'aria-describedby': ariaDescribedBy || (helperText ? helperId : errorMessage ? errorId : undefined),
    'aria-invalid': ariaInvalid || hasError,
    'data-testid': testId,
    ...restProps
  };

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          {...(commonProps as any)}
          rows={rows}
          cols={cols}
          style={{ resize }}
        />
      );
    }

    return (
      <input
        {...(commonProps as any)}
        type={currentType}
      />
    );
  };

  return (
    <div className={wrapperClasses}>
      {/* Label */}
      {label && !hideLabel && (
        <label
          htmlFor={inputId}
          className={`
            block text-sm font-medium mb-1 
            ${hasError ? 'text-red-700' : hasSuccess ? 'text-green-700' : 'text-gray-700'}
            ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}
          `}
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Start addon */}
        {startAddon && (
          <div className="absolute inset-y-0 left-0 flex items-center">
            {startAddon}
          </div>
        )}

        {/* Start icon */}
        {(startIcon || (!startAddon && !startIcon && getTypeIcon())) && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <div className={`${hasError ? 'text-red-400' : hasSuccess ? 'text-green-400' : 'text-gray-400'}`}>
              {startIcon || getTypeIcon()}
            </div>
          </div>
        )}

        {/* Main input */}
        <div
          className={
            startAddon || startIcon || getTypeIcon() ? 'pl-10' : '' +
            (endAddon || endIcon || showClearButton || showPasswordToggle ? ' pr-10' : '')
          }
        >
          {renderInput()}
        </div>

        {/* End icons and buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Success/Error icons */}
          {hasSuccess && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
          {hasError && (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}

          {/* Clear button */}
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Password toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={handlePasswordToggle}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            >
              {passwordVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {/* End icon */}
          {endIcon && (
            <div className={`${hasError ? 'text-red-400' : hasSuccess ? 'text-green-400' : 'text-gray-400'}`}>
              {endIcon}
            </div>
          )}
        </div>

        {/* End addon */}
        {endAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {endAddon}
          </div>
        )}
      </div>

      {/* Helper text / Error message / Success message */}
      {(helperText || errorMessage || validationError || successMessage) && (
        <div className="mt-1 text-sm">
          {hasError && (errorMessage || validationError) && (
            <p id={errorId} className="text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {errorMessage || validationError}
            </p>
          )}
          {hasSuccess && successMessage && (
            <p className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 flex-shrink-0" />
              {successMessage}
            </p>
          )}
          {!hasError && !hasSuccess && helperText && (
            <p id={helperId} className="text-gray-600">
              {helperText}
            </p>
          )}
        </div>
      )}

      {/* Character count */}
      {maxLength && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          {currentValue.length} / {maxLength}
        </div>
      )}
    </div>
  );
});

AppInput.displayName = 'AppInput';

// Specialized input components
export const SearchInput = forwardRef<HTMLInputElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="search" ref={ref} />
));

export const PasswordInput = forwardRef<HTMLInputElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="password" ref={ref} />
));

export const EmailInput = forwardRef<HTMLInputElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="email" ref={ref} />
));

export const PhoneInput = forwardRef<HTMLInputElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="tel" ref={ref} />
));

export const NumberInput = forwardRef<HTMLInputElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="number" ref={ref} />
));

export const DateInput = forwardRef<HTMLInputElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="date" ref={ref} />
));

export const TimeInput = forwardRef<HTMLInputElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="time" ref={ref} />
));

export const TextareaInput = forwardRef<HTMLTextAreaElement, Omit<AppInputProps, 'type'>>((props, ref) => (
  <AppInput {...props} type="textarea" ref={ref as any} />
));

// Backward compatibility alias
export const AppTextArea = TextareaInput;

// Validation helpers
export const validators = {
  required: (value: string) => !value.trim() ? 'This field is required' : null,
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !emailRegex.test(value) ? 'Please enter a valid email address' : null;
  },
  minLength: (min: number) => (value: string) =>
    value.length < min ? `Minimum length is ${min} characters` : null,
  maxLength: (max: number) => (value: string) =>
    value.length > max ? `Maximum length is ${max} characters` : null,
  phone: (value: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return value && !phoneRegex.test(value) ? 'Please enter a valid phone number' : null;
  },
  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },
  strongPassword: (value: string) => {
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
    if (!/\d/.test(value)) return 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain a special character';
    return null;
  }
};

export default AppInput;
