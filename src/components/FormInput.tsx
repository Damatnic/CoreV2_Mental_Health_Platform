import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, Eye, EyeOff, Heart, Brain, Shield } from 'lucide-react';
import '../styles/FormInput.css';

interface MoodScaleConfig {
  min: number;
  max: number;
  labels: string[];
}

interface AnxietyLevel {
  value: string;
  label: string;
  color: string;
}

interface ValidationRule {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: string) => boolean;
  message?: string;
}

interface ThemeConfig {
  primary?: string;
  error?: string;
  success?: string;
  border?: string;
  background?: string;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormInputProps {
  label?: string;
  type?: string;
  name: string;
  value?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onValidate?: (isValid: boolean, value: string) => void;
  
  // Enhanced features for mental health app
  helperText?: string;
  showPasswordToggle?: boolean;
  options?: SelectOption[];
  success?: boolean;
  validation?: ValidationRule;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  debounceMs?: number;
  
  // Mental health specific features
  moodScale?: MoodScaleConfig;
  anxietyLevels?: AnxietyLevel[];
  crisisDetection?: boolean;
  theme?: ThemeConfig;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  name,
  value = '',
  placeholder,
  error,
  required = false,
  disabled = false,
  autoComplete,
  onChange,
  onBlur,
  onFocus,
  onValidate,
  helperText,
  showPasswordToggle = true,
  options,
  success,
  validation,
  size = 'md',
  className = '',
  debounceMs = 0,
  moodScale,
  anxietyLevels,
  crisisDetection = false,
  theme
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const [validationError, setValidationError] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (validation && touched) {
      validateInput(internalValue);
    }
  }, [internalValue, validation, touched]);

  const validateInput = (val: string) => {
    if (!validation) return true;

    let isValid = true;
    let errorMsg = '';

    if (validation.pattern && !validation.pattern.test(val)) {
      isValid = false;
      errorMsg = validation.message || 'Invalid format';
    }

    if (validation.minLength && val.length < validation.minLength) {
      isValid = false;
      errorMsg = validation.message || `Minimum ${validation.minLength} characters required`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      isValid = false;
      errorMsg = validation.message || `Maximum ${validation.maxLength} characters allowed`;
    }

    if (validation.custom && !validation.custom(val)) {
      isValid = false;
      errorMsg = validation.message || 'Validation failed';
    }

    setValidationError(errorMsg);
    onValidate?.(isValid, val);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    if (debounceMs > 0) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChange?.(e);
      }, debounceMs);
    } else {
      onChange?.(e);
    }

    // Crisis detection for mental health inputs
    if (crisisDetection && type === 'textarea') {
      checkForCrisisKeywords(newValue);
    }
  };

  const checkForCrisisKeywords = (text: string) => {
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead'];
    const hasKeywords = crisisKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasKeywords) {
      // Trigger crisis intervention UI
      console.warn('Crisis keywords detected - triggering intervention');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTouched(true);
    onBlur?.(e);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const displayError = error || validationError;
  const hasError = !!(touched && displayError);
  const isValid = !!((touched && !displayError && internalValue) || success);
  const sizeClass = `input-${size}`;

  // Render mood scale input
  if (type === 'mood-scale' && moodScale) {
    return (
      <div className={`form-input-wrapper mood-scale ${className} ${sizeClass}`}>
        {label && (
          <label htmlFor={name} className="form-input-label">
            <Heart className="label-icon" size={16} />
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className="mood-scale-container">
          <input
            type="range"
            id={name}
            name={name}
            min={moodScale.min}
            max={moodScale.max}
            value={internalValue || moodScale.min}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={onFocus}
            disabled={disabled}
            className="mood-scale-input"
          />
          <div className="mood-scale-labels">
            {moodScale.labels.map((label, index) => (
              <span key={index} className="mood-label">{label}</span>
            ))}
          </div>
        </div>
        {helperText && <span className="helper-text">{helperText}</span>}
      </div>
    );
  }

  // Render anxiety levels selector
  if (type === 'anxiety-levels' && anxietyLevels) {
    return (
      <div className={`form-input-wrapper anxiety-levels ${className} ${sizeClass}`}>
        {label && (
          <label htmlFor={name} className="form-input-label">
            <Brain className="label-icon" size={16} />
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className="anxiety-levels-container">
          {anxietyLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              className={`anxiety-level-btn ${internalValue === level.value ? 'selected' : ''}`}
              style={{ backgroundColor: level.color }}
              onClick={() => {
                setInternalValue(level.value);
                const syntheticEvent = {
                  target: { name, value: level.value }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange?.(syntheticEvent);
              }}
              disabled={disabled}
            >
              {level.label}
            </button>
          ))}
        </div>
        {helperText && <span className="helper-text">{helperText}</span>}
      </div>
    );
  }

  // Render select dropdown
  if (type === 'select' && options) {
    return (
      <div className={`form-input-wrapper ${hasError ? 'error' : ''} ${isValid ? 'valid' : ''} ${className} ${sizeClass}`}>
        {label && (
          <label htmlFor={name} className="form-input-label">
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className="input-container">
          <select
            id={name}
            name={name}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={onFocus}
            disabled={disabled}
            required={required}
            className="form-input form-select"
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {helperText && !hasError && (
          <span id={`${name}-helper`} className="helper-text">{helperText}</span>
        )}
        {hasError && (
          <span id={`${name}-error`} className="error-message" role="alert">
            {displayError}
          </span>
        )}
      </div>
    );
  }

  // Render textarea for journaling
  if (type === 'textarea') {
    return (
      <div className={`form-input-wrapper ${hasError ? 'error' : ''} ${isValid ? 'valid' : ''} ${className} ${sizeClass}`}>
        {label && (
          <label htmlFor={name} className="form-input-label">
            {crisisDetection && <Shield className="label-icon" size={16} />}
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className="input-container">
          <textarea
            id={name}
            name={name}
            value={internalValue}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={onFocus}
            className="form-input form-textarea"
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            rows={5}
          />
          {crisisDetection && (
            <div className="crisis-detection-indicator">
              <Shield size={14} />
              <span>Crisis detection active</span>
            </div>
          )}
        </div>
        {helperText && !hasError && (
          <span id={`${name}-helper`} className="helper-text">{helperText}</span>
        )}
        {hasError && (
          <span id={`${name}-error`} className="error-message" role="alert">
            {displayError}
          </span>
        )}
      </div>
    );
  }

  // Default input rendering
  return (
    <div 
      className={`form-input-wrapper ${hasError ? 'error' : ''} ${isValid ? 'valid' : ''} ${className} ${sizeClass}`}
      style={theme ? {
        '--primary-color': theme.primary,
        '--error-color': theme.error,
        '--success-color': theme.success,
      } as React.CSSProperties : undefined}
    >
      {label && (
        <label htmlFor={name} className="form-input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="input-container">
        <input
          id={name}
          name={name}
          type={inputType}
          value={internalValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={onFocus}
          className="form-input"
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        />
        
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        
        {hasError && <AlertCircle className="input-icon error-icon" size={18} />}
        {isValid && <Check className="input-icon valid-icon" size={18} />}
      </div>
      
      {helperText && !hasError && (
        <span id={`${name}-helper`} className="helper-text">{helperText}</span>
      )}
      {hasError && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {displayError}
        </span>
      )}
    </div>
  );
};

export { FormInput };
export default FormInput;
