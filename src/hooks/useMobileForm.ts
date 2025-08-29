/**
 * Mobile Form Hook
 *
 * Comprehensive React hook for managing mobile-optimized forms
 * with enhanced UX, validation, and accessibility features
 *
 * Features:
 * - Mobile-first form validation and submission
 * - Touch-friendly input handling
 * - Auto-save and draft management
 * - Offline form caching
 * - Accessibility compliance (WCAG 2.1)
 * - Multi-step form navigation
 * - Dynamic field visibility and validation
 * - Error handling and recovery
 *
 * @license Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

// Field Configuration Interface
interface FieldConfig {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time';
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
  };
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  dependsOn?: {
    field: string;
    value: any;
    condition?: 'equals' | 'not_equals' | 'includes' | 'greater_than' | 'less_than';
  };
  mobileOptimizations?: {
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    autocomplete?: string;
    autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
    spellcheck?: boolean;
  };
  accessibility?: {
    ariaLabel?: string;
    ariaDescribedBy?: string;
    ariaRequired?: boolean;
  };
}

// Form Configuration Interface
interface FormConfig {
  fields: FieldConfig[];
  steps?: Array<{
    id: string;
    title: string;
    description?: string;
    fields: string[];
    validation?: 'on_step' | 'on_submit';
  }>;
  autoSave?: {
    enabled: boolean;
    interval: number; // milliseconds
    storageKey: string;
  };
  offline?: {
    enabled: boolean;
    maxEntries: number;
  };
  validation?: {
    mode: 'onChange' | 'onBlur' | 'onSubmit';
    showErrorsImmediately: boolean;
    debounceMs: number;
  };
  submission?: {
    endpoint?: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    transformData?: (data: FormData) => any;
  };
  accessibility?: {
    announceErrors: boolean;
    focusFirstError: boolean;
    highContrast: boolean;
  };
}

// Form Data Interface
interface FormData {
  [fieldName: string]: any;
}

// Form Error Interface
interface FormError {
  field: string;
  message: string;
  type: 'required' | 'validation' | 'server' | 'network';
}

// Form State Interface
interface FormState {
  data: FormData;
  errors: FormError[];
  touched: Set<string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  currentStep: number;
  totalSteps: number;
  lastSaved?: Date;
}

// Mobile Form Hook Return Type
interface UseMobileFormReturn {
  // Form State
  formState: FormState;
  
  // Field Management
  setValue: (fieldName: string, value: any) => void;
  getValue: (fieldName: string) => any;
  setTouched: (fieldName: string, touched?: boolean) => void;
  isTouched: (fieldName: string) => boolean;
  
  // Validation
  validateField: (fieldName: string) => Promise<string | null>;
  validateForm: () => Promise<boolean>;
  clearErrors: (fieldName?: string) => void;
  
  // Form Actions
  handleSubmit: (onSubmit: (data: FormData) => Promise<void>) => (e?: React.FormEvent) => Promise<void>;
  reset: (data?: Partial<FormData>) => void;
  
  // Step Navigation (for multi-step forms)
  nextStep: () => Promise<boolean>;
  previousStep: () => void;
  goToStep: (stepIndex: number) => Promise<boolean>;
  
  // Auto-save & Draft
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  clearDraft: () => void;
  hasDraft: boolean;
  
  // Offline Support
  saveOffline: () => Promise<void>;
  getOfflineEntries: () => FormData[];
  syncOfflineEntries: () => Promise<void>;
  
  // Utilities
  getFieldConfig: (fieldName: string) => FieldConfig | undefined;
  isFieldVisible: (fieldName: string) => boolean;
  getVisibleFields: () => FieldConfig[];
  exportFormData: () => string;
}

// Default Configuration
const DEFAULT_CONFIG: Partial<FormConfig> = {
  autoSave: {
    enabled: true,
    interval: 30000, // 30 seconds
    storageKey: 'mobile_form_draft'
  },
  offline: {
    enabled: true,
    maxEntries: 10
  },
  validation: {
    mode: 'onBlur',
    showErrorsImmediately: false,
    debounceMs: 300
  },
  accessibility: {
    announceErrors: true,
    focusFirstError: true,
    highContrast: false
  }
};

/**
 * Mobile Form Hook
 * 
 * @param config - Form configuration
 * @returns Mobile form state and utilities
 */
export function useMobileForm(config: FormConfig): UseMobileFormReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State
  const [formState, setFormState] = useState<FormState>(() => ({
    data: {},
    errors: [],
    touched: new Set(),
    isSubmitting: false,
    isValid: false,
    isDirty: false,
    currentStep: 0,
    totalSteps: finalConfig.steps?.length || 1,
    lastSaved: undefined
  }));
  
  const [hasDraft, setHasDraft] = useState(false);
  
  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const offlineQueueRef = useRef<FormData[]>([]);
  
  // Initialize form data with default values
  const initializeFormData = useCallback(() => {
    const initialData: FormData = {};
    
    finalConfig.fields.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.name] = false;
      } else if (field.type === 'select' && field.options?.length) {
        initialData[field.name] = field.options[0].value;
      } else {
        initialData[field.name] = '';
      }
    });
    
    setFormState(prev => ({ ...prev, data: initialData }));
  }, [finalConfig.fields]);
  
  // Check for draft on mount
  const checkForDraft = useCallback(() => {
    if (!finalConfig.autoSave?.enabled) return;
    
    try {
      const draftKey = finalConfig.autoSave.storageKey;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        setHasDraft(true);
        logger.debug('Draft found', { draftKey });
      }
    } catch (error) {
      logger.error('Failed to check for draft', { error });
    }
  }, [finalConfig.autoSave]);
  
  // Field Visibility Logic
  const isFieldVisible = useCallback((fieldName: string): boolean => {
    const field = finalConfig.fields.find(f => f.name === fieldName);
    if (!field || !field.dependsOn) return true;
    
    const dependentValue = formState.data[field.dependsOn.field];
    const expectedValue = field.dependsOn.value;
    const condition = field.dependsOn.condition || 'equals';
    
    switch (condition) {
      case 'equals':
        return dependentValue === expectedValue;
      case 'not_equals':
        return dependentValue !== expectedValue;
      case 'includes':
        return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : false;
      case 'greater_than':
        return Number(dependentValue) > Number(expectedValue);
      case 'less_than':
        return Number(dependentValue) < Number(expectedValue);
      default:
        return true;
    }
  }, [finalConfig.fields, formState.data]);
  
  // Get Visible Fields
  const getVisibleFields = useCallback((): FieldConfig[] => {
    return finalConfig.fields.filter(field => isFieldVisible(field.name));
  }, [finalConfig.fields, isFieldVisible]);
  
  // Field Validation
  const validateField = useCallback(async (fieldName: string): Promise<string | null> => {
    const field = finalConfig.fields.find(f => f.name === fieldName);
    if (!field || !isFieldVisible(fieldName)) return null;
    
    const value = formState.data[fieldName];
    
    // Required validation
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }
    
    // Type-specific validation
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    
    if (field.type === 'tel' && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
      return 'Please enter a valid phone number';
    }
    
    if (field.type === 'url' && !/^https?:\/\/.+/.test(value)) {
      return 'Please enter a valid URL';
    }
    
    // Custom validation rules
    if (field.validation) {
      const { pattern, minLength, maxLength, min, max, custom } = field.validation;
      
      if (pattern && !pattern.test(value)) {
        return `${field.label} format is invalid`;
      }
      
      if (minLength && value.length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }
      
      if (maxLength && value.length > maxLength) {
        return `${field.label} must not exceed ${maxLength} characters`;
      }
      
      if (min !== undefined && Number(value) < min) {
        return `${field.label} must be at least ${min}`;
      }
      
      if (max !== undefined && Number(value) > max) {
        return `${field.label} must not exceed ${max}`;
      }
      
      if (custom) {
        const customError = custom(value);
        if (customError) return customError;
      }
    }
    
    return null;
  }, [finalConfig.fields, formState.data, isFieldVisible]);
  
  // Form Validation
  const validateForm = useCallback(async (): Promise<boolean> => {
    const visibleFields = getVisibleFields();
    const errors: FormError[] = [];
    
    for (const field of visibleFields) {
      const error = await validateField(field.name);
      if (error) {
        errors.push({
          field: field.name,
          message: error,
          type: 'validation'
        });
      }
    }
    
    setFormState(prev => ({
      ...prev,
      errors,
      isValid: errors.length === 0
    }));
    
    return errors.length === 0;
  }, [getVisibleFields, validateField]);
  
  // Set Field Value
  const setValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [fieldName]: value },
      isDirty: true
    }));
    
    // Debounced validation
    if (finalConfig.validation?.mode === 'onChange') {
      const timeoutId = validationTimeoutRef.current.get(fieldName);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const newTimeoutId = setTimeout(() => {
        validateField(fieldName).then(error => {
          setFormState(prev => ({
            ...prev,
            errors: error 
              ? [...prev.errors.filter(e => e.field !== fieldName), { field: fieldName, message: error, type: 'validation' as const }]
              : prev.errors.filter(e => e.field !== fieldName)
          }));
        });
      }, finalConfig.validation?.debounceMs || 300);
      
      validationTimeoutRef.current.set(fieldName, newTimeoutId);
    }
    
    // Auto-save
    if (finalConfig.autoSave?.enabled) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, finalConfig.autoSave.interval);
    }
  }, [finalConfig.validation, finalConfig.autoSave, validateField]);
  
  // Get Field Value
  const getValue = useCallback((fieldName: string) => {
    return formState.data[fieldName];
  }, [formState.data]);
  
  // Set Field Touched
  const setTouched = useCallback((fieldName: string, touched: boolean = true) => {
    setFormState(prev => {
      const newTouched = new Set(prev.touched);
      if (touched) {
        newTouched.add(fieldName);
      } else {
        newTouched.delete(fieldName);
      }
      return { ...prev, touched: newTouched };
    });
    
    // Validate on blur if configured
    if (touched && finalConfig.validation?.mode === 'onBlur') {
      validateField(fieldName).then(error => {
        setFormState(prev => ({
          ...prev,
          errors: error 
            ? [...prev.errors.filter(e => e.field !== fieldName), { field: fieldName, message: error, type: 'validation' as const }]
            : prev.errors.filter(e => e.field !== fieldName)
        }));
      });
    }
  }, [finalConfig.validation, validateField]);
  
  // Check if Field is Touched
  const isTouched = useCallback((fieldName: string): boolean => {
    return formState.touched.has(fieldName);
  }, [formState.touched]);
  
  // Clear Errors
  const clearErrors = useCallback((fieldName?: string) => {
    setFormState(prev => ({
      ...prev,
      errors: fieldName 
        ? prev.errors.filter(e => e.field !== fieldName)
        : []
    }));
  }, []);
  
  // Handle Form Submission
  const handleSubmit = useCallback((onSubmit: (data: FormData) => Promise<void>) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      
      try {
        setFormState(prev => ({ ...prev, isSubmitting: true }));
        
        // Validate form
        const isValid = await validateForm();
        if (!isValid) {
          // Focus first error if configured
          if (finalConfig.accessibility?.focusFirstError && formState.errors.length > 0) {
            const firstErrorField = formState.errors[0].field;
            const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
            element?.focus();
          }
          return;
        }
        
        // Submit form
        await onSubmit(formState.data);
        
        // Clear draft on successful submission
        if (finalConfig.autoSave?.enabled) {
          clearDraft();
        }
        
        logger.info('Form submitted successfully');
        
      } catch (error) {
        logger.error('Form submission failed', { error });
        
        // Add server error
        setFormState(prev => ({
          ...prev,
          errors: [...prev.errors, {
            field: 'form',
            message: error instanceof Error ? error.message : 'Submission failed',
            type: 'server'
          }]
        }));
        
        // Save offline if network error
        if (error instanceof Error && error.message.includes('network')) {
          await saveOffline();
        }
        
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    };
  }, [formState.data, formState.errors, validateForm, finalConfig.accessibility, finalConfig.autoSave]);
  
  // Reset Form
  const reset = useCallback((data?: Partial<FormData>) => {
    const resetData: FormData = {};
    
    finalConfig.fields.forEach(field => {
      if (data && data[field.name] !== undefined) {
        resetData[field.name] = data[field.name];
      } else if (field.type === 'checkbox') {
        resetData[field.name] = false;
      } else if (field.type === 'select' && field.options?.length) {
        resetData[field.name] = field.options[0].value;
      } else {
        resetData[field.name] = '';
      }
    });
    
    setFormState(prev => ({
      ...prev,
      data: resetData,
      errors: [],
      touched: new Set(),
      isDirty: false,
      currentStep: 0
    }));
  }, [finalConfig.fields]);
  
  // Step Navigation
  const nextStep = useCallback(async (): Promise<boolean> => {
    if (!finalConfig.steps || formState.currentStep >= finalConfig.steps.length - 1) {
      return false;
    }
    
    // Validate current step if required
    const currentStepConfig = finalConfig.steps[formState.currentStep];
    if (currentStepConfig.validation === 'on_step') {
      const stepFields = currentStepConfig.fields;
      let hasErrors = false;
      
      for (const fieldName of stepFields) {
        const error = await validateField(fieldName);
        if (error) {
          hasErrors = true;
          setFormState(prev => ({
            ...prev,
            errors: [...prev.errors.filter(e => e.field !== fieldName), { field: fieldName, message: error, type: 'validation' as const }]
          }));
        }
      }
      
      if (hasErrors) return false;
    }
    
    setFormState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }));
    
    return true;
  }, [finalConfig.steps, formState.currentStep, validateField]);
  
  const previousStep = useCallback(() => {
    if (formState.currentStep > 0) {
      setFormState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  }, [formState.currentStep]);
  
  const goToStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    if (!finalConfig.steps || stepIndex < 0 || stepIndex >= finalConfig.steps.length) {
      return false;
    }
    
    // Validate all previous steps if going forward
    if (stepIndex > formState.currentStep) {
      for (let i = formState.currentStep; i < stepIndex; i++) {
        const stepConfig = finalConfig.steps[i];
        if (stepConfig.validation === 'on_step') {
          for (const fieldName of stepConfig.fields) {
            const error = await validateField(fieldName);
            if (error) return false;
          }
        }
      }
    }
    
    setFormState(prev => ({
      ...prev,
      currentStep: stepIndex
    }));
    
    return true;
  }, [finalConfig.steps, formState.currentStep, validateField]);
  
  // Draft Management
  const saveDraft = useCallback(async () => {
    if (!finalConfig.autoSave?.enabled) return;
    
    try {
      const draftKey = finalConfig.autoSave.storageKey;
      const draftData = {
        data: formState.data,
        currentStep: formState.currentStep,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setFormState(prev => ({ ...prev, lastSaved: new Date() }));
      setHasDraft(true);
      
      logger.debug('Draft saved', { draftKey });
    } catch (error) {
      logger.error('Failed to save draft', { error });
    }
  }, [finalConfig.autoSave, formState.data, formState.currentStep]);
  
  const loadDraft = useCallback(async () => {
    if (!finalConfig.autoSave?.enabled) return;
    
    try {
      const draftKey = finalConfig.autoSave.storageKey;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        
        setFormState(prev => ({
          ...prev,
          data: { ...prev.data, ...draftData.data },
          currentStep: draftData.currentStep || 0,
          isDirty: true,
          lastSaved: new Date(draftData.timestamp)
        }));
        
        logger.info('Draft loaded', { draftKey });
      }
    } catch (error) {
      logger.error('Failed to load draft', { error });
    }
  }, [finalConfig.autoSave]);
  
  const clearDraft = useCallback(() => {
    if (!finalConfig.autoSave?.enabled) return;
    
    try {
      const draftKey = finalConfig.autoSave.storageKey;
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setFormState(prev => ({ ...prev, lastSaved: undefined }));
      
      logger.debug('Draft cleared', { draftKey });
    } catch (error) {
      logger.error('Failed to clear draft', { error });
    }
  }, [finalConfig.autoSave]);
  
  // Offline Support
  const saveOffline = useCallback(async () => {
    if (!finalConfig.offline?.enabled) return;
    
    try {
      const offlineEntry = {
        ...formState.data,
        _timestamp: new Date().toISOString(),
        _id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      offlineQueueRef.current.push(offlineEntry);
      
      // Limit queue size
      if (offlineQueueRef.current.length > (finalConfig.offline.maxEntries || 10)) {
        offlineQueueRef.current.shift();
      }
      
      // Persist to localStorage
      localStorage.setItem('mobile_form_offline_queue', JSON.stringify(offlineQueueRef.current));
      
      logger.info('Form saved offline', { id: offlineEntry._id });
    } catch (error) {
      logger.error('Failed to save offline', { error });
    }
  }, [finalConfig.offline, formState.data]);
  
  const getOfflineEntries = useCallback((): FormData[] => {
    return [...offlineQueueRef.current];
  }, []);
  
  const syncOfflineEntries = useCallback(async () => {
    if (!finalConfig.offline?.enabled || offlineQueueRef.current.length === 0) return;
    
    try {
      // This would typically sync with your backend
      logger.info('Syncing offline entries', { count: offlineQueueRef.current.length });
      
      // Clear queue after successful sync
      offlineQueueRef.current = [];
      localStorage.removeItem('mobile_form_offline_queue');
    } catch (error) {
      logger.error('Failed to sync offline entries', { error });
    }
  }, [finalConfig.offline]);
  
  // Get Field Config
  const getFieldConfig = useCallback((fieldName: string): FieldConfig | undefined => {
    return finalConfig.fields.find(f => f.name === fieldName);
  }, [finalConfig.fields]);
  
  // Export Form Data
  const exportFormData = useCallback((): string => {
    const exportData = {
      timestamp: new Date().toISOString(),
      formData: formState.data,
      currentStep: formState.currentStep,
      errors: formState.errors,
      isValid: formState.isValid,
      isDirty: formState.isDirty
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [formState]);
  
  // Initialize form on mount
  useEffect(() => {
    initializeFormData();
    checkForDraft();
    
    // Load offline queue
    try {
      const savedQueue = localStorage.getItem('mobile_form_offline_queue');
      if (savedQueue) {
        offlineQueueRef.current = JSON.parse(savedQueue);
      }
    } catch (error) {
      logger.error('Failed to load offline queue', { error });
    }
  }, [initializeFormData, checkForDraft]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      validationTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      validationTimeoutRef.current.clear();
    };
  }, []);
  
  return {
    // Form State
    formState,
    
    // Field Management
    setValue,
    getValue,
    setTouched,
    isTouched,
    
    // Validation
    validateField,
    validateForm,
    clearErrors,
    
    // Form Actions
    handleSubmit,
    reset,
    
    // Step Navigation
    nextStep,
    previousStep,
    goToStep,
    
    // Auto-save & Draft
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    
    // Offline Support
    saveOffline,
    getOfflineEntries,
    syncOfflineEntries,
    
    // Utilities
    getFieldConfig,
    isFieldVisible,
    getVisibleFields,
    exportFormData
  };
}

export type { 
  UseMobileFormReturn, 
  FormConfig, 
  FieldConfig, 
  FormData, 
  FormError, 
  FormState 
};
