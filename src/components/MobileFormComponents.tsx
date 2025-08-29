/**
 * Mobile Form Optimization System
 *
 * Comprehensive mobile form components with:
 * - Proper input types (tel, email, url, number)
 * - Enhanced validation feedback
 * - Touch-friendly layouts
 * - Floating labels
 * - Real-time validation
 * - Mobile-specific UX patterns
 */

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

// Temporary mock implementations for development
const useMobileViewport = () => ({
  isMobile: window.innerWidth <= 768,
  isKeyboardOpen: false,
  viewportHeight: window.innerHeight
});

const getSecurityService = () => ({
  validateInput: (value: string, rules: ValidationRules) => {
    if (rules.required && !value.trim()) {
      return { isValid: false, error: 'This field is required' };
    }
    if (rules.email && value && !/\S+@\S+\.\S+/.test(value)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    if (rules.minLength && value.length < rules.minLength) {
      return { isValid: false, error: `Must be at least ${rules.minLength} characters` };
    }
    return { isValid: true, error: null };
  }
});

interface ValidationRules {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface MobileInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number' | 'password' | 'search';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  validation?: ValidationRules;
  helperText?: string;
  className?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
}

export const MobileInput: React.FC<MobileInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled = false,
  required = false,
  autoComplete,
  validation,
  helperText,
  className = '',
  inputMode
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useMobileViewport();
  const securityService = getSecurityService();

  // Validate input
  const validateInput = useCallback((inputValue: string) => {
    if (!validation) return;

    const result = securityService.validateInput(inputValue, validation);
    setValidationError(result.isValid ? null : result.error);
  }, [validation, securityService]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Real-time validation for better UX
    if (hasBeenTouched) {
      validateInput(newValue);
    }
  };

  // Handle focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.();

    // Scroll into view on mobile
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
    validateInput(value);
    onBlur?.();
  };

  const hasError = hasBeenTouched && validationError;
  const hasValue = value.length > 0;

  const inputClass = [
    'mobile-input',
    isFocused ? 'mobile-input--focused' : '',
    hasError ? 'mobile-input--error' : '',
    hasValue ? 'mobile-input--has-value' : '',
    disabled ? 'mobile-input--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`mobile-input-container ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="mobile-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode || type as any}
          className={inputClass}
          aria-describedby={
            [
              hasError ? `${id}-error` : '',
              helperText ? `${id}-helper` : ''
            ].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={hasError ? 'true' : 'false'}
        />
        
        <label 
          htmlFor={id}
          className={`mobile-input-label ${
            isFocused || hasValue ? 'mobile-input-label--floating' : ''
          }`}
        >
          {label}
          {required && <span className="mobile-input-required">*</span>}
        </label>

        <div className="mobile-input-border" />
      </div>

      {/* Helper text */}
      {helperText && !hasError && (
        <div id={`${id}-helper`} className="mobile-input-helper">
          {helperText}
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <div id={`${id}-error`} className="mobile-input-error" role="alert">
          {validationError}
        </div>
      )}
    </div>
  );
};

interface MobileTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  validation?: ValidationRules;
  helperText?: string;
  className?: string;
  autoResize?: boolean;
}

export const MobileTextarea: React.FC<MobileTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  validation,
  helperText,
  className = '',
  autoResize = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isMobile } = useMobileViewport();
  const securityService = getSecurityService();

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !autoResize) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [autoResize]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Validate input
  const validateInput = useCallback((inputValue: string) => {
    if (!validation) return;

    const result = securityService.validateInput(inputValue, validation);
    setValidationError(result.isValid ? null : result.error);
  }, [validation, securityService]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    adjustHeight();

    // Real-time validation
    if (hasBeenTouched) {
      validateInput(newValue);
    }
  };

  // Handle focus
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.();

    // Scroll into view on mobile
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
    validateInput(value);
    onBlur?.();
  };

  const hasError = hasBeenTouched && validationError;
  const hasValue = value.length > 0;

  const textareaClass = [
    'mobile-textarea',
    isFocused ? 'mobile-textarea--focused' : '',
    hasError ? 'mobile-textarea--error' : '',
    hasValue ? 'mobile-textarea--has-value' : '',
    disabled ? 'mobile-textarea--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`mobile-textarea-container ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="mobile-textarea-wrapper">
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={textareaClass}
          aria-describedby={
            [
              hasError ? `${id}-error` : '',
              helperText ? `${id}-helper` : '',
              maxLength ? `${id}-counter` : ''
            ].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={hasError ? 'true' : 'false'}
        />
        
        <label 
          htmlFor={id}
          className={`mobile-textarea-label ${
            isFocused || hasValue ? 'mobile-textarea-label--floating' : ''
          }`}
        >
          {label}
          {required && <span className="mobile-textarea-required">*</span>}
        </label>

        <div className="mobile-textarea-border" />
      </div>

      {/* Character counter */}
      {maxLength && (
        <div id={`${id}-counter`} className="mobile-textarea-counter">
          {value.length}/{maxLength}
        </div>
      )}

      {/* Helper text */}
      {helperText && !hasError && (
        <div id={`${id}-helper`} className="mobile-textarea-helper">
          {helperText}
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <div id={`${id}-error`} className="mobile-textarea-error" role="alert">
          {validationError}
        </div>
      )}
    </div>
  );
};

interface MobileSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  className?: string;
  placeholder?: string;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  helperText,
  className = '',
  placeholder = 'Select an option'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isMobile } = useMobileViewport();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const hasValue = value !== '';

  const selectClass = [
    'mobile-select',
    isFocused ? 'mobile-select--focused' : '',
    hasValue ? 'mobile-select--has-value' : '',
    disabled ? 'mobile-select--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`mobile-select-container ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="mobile-select-wrapper">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={selectClass}
          aria-describedby={helperText ? `${id}-helper` : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <label 
          htmlFor={id}
          className={`mobile-select-label ${
            isFocused || hasValue ? 'mobile-select-label--floating' : ''
          }`}
        >
          {label}
          {required && <span className="mobile-select-required">*</span>}
        </label>

        <div className="mobile-select-arrow">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="mobile-select-border" />
      </div>

      {/* Helper text */}
      {helperText && (
        <div id={`${id}-helper`} className="mobile-select-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

export default {
  MobileInput,
  MobileTextarea,
  MobileSelect
};