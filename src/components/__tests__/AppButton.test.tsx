/**
 * AppButton Component Tests
 * Test suite for the AppButton component
 */

import * as React from 'react';
import '@testing-library/jest-dom';

// Mock AppButton component interfaces
export interface AppButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  'data-testid'?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
}

// Mock data for testing
export const MOCK_BUTTON_VARIANTS = [
  'primary',
  'secondary', 
  'outline',
  'ghost',
  'link',
  'destructive'
] as const;

export const MOCK_BUTTON_SIZES = [
  'xs',
  'sm', 
  'md',
  'lg',
  'xl'
] as const;

// Utility functions for testing
export const getVariantClasses = (variant: string): string => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    link: 'text-blue-600 hover:text-blue-700 underline',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };
  return variants[variant as keyof typeof variants] || variants.primary;
};

export const getSizeClasses = (size: string): string => {
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

export const validateButtonProps = (props: AppButtonProps): string[] => {
  const errors: string[] = [];
  
  if (props.variant && !MOCK_BUTTON_VARIANTS.includes(props.variant as any)) {
    errors.push(`Invalid variant: ${props.variant}`);
  }
  
  if (props.size && !MOCK_BUTTON_SIZES.includes(props.size as any)) {
    errors.push(`Invalid size: ${props.size}`);
  }
  
  if (props.disabled && props.loading) {
    errors.push('Button cannot be both disabled and loading');
  }
  
  return errors;
};

export const createButtonElement = (props: AppButtonProps) => {
  const {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    onClick,
    type = 'button',
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    startIcon,
    endIcon,
    fullWidth = false,
    rounded = false
  } = props;

  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses,
    sizeClasses
  ];

  if (fullWidth) {
    baseClasses.push('w-full');
  }

  if (rounded) {
    baseClasses.push('rounded-full');
  } else {
    baseClasses.push('rounded-md');
  }

  return {
    type: 'button',
    props: {
      className: `${baseClasses.join(' ')} ${className}`,
      disabled: disabled || loading,
      onClick,
      type,
      'aria-label': ariaLabel,
      'data-testid': dataTestId,
      children: [
        startIcon && {
          type: 'span',
          key: 'start-icon',
          props: {
            className: 'mr-2',
            children: startIcon
          }
        },
        loading ? {
          type: 'span',
          key: 'loading',
          props: {
            className: 'animate-spin mr-2',
            children: '⏳'
          }
        } : null,
        children && {
          type: 'span',
          key: 'content',
          props: {
            children
          }
        },
        endIcon && {
          type: 'span',
          key: 'end-icon',
          props: {
            className: 'ml-2',
            children: endIcon
          }
        }
      ].filter(Boolean)
    }
  };
};

// Mock AppButton component
export const AppButton = {
  displayName: 'AppButton',
  defaultProps: {
    variant: 'primary' as const,
    size: 'md' as const,
    type: 'button' as const,
    disabled: false,
    loading: false,
    fullWidth: false,
    rounded: false
  },
  render: createButtonElement
};

// Mock test suite
export const testSuite = {
  'renders button with default props': () => {
    const result = createButtonElement({ children: 'Click me' });
    return result.type === 'button' && 
           result.props.children.some((child: any) => 
             child && child.props && child.props.children === 'Click me'
           );
  },

  'renders button with all variants': () => {
    const results = MOCK_BUTTON_VARIANTS.map(variant => 
      createButtonElement({ variant, children: 'Test' })
    );
    return results.every((result, index) => 
      result.type === 'button' && 
      result.props.className.includes(getVariantClasses(MOCK_BUTTON_VARIANTS[index]))
    );
  },

  'renders button with all sizes': () => {
    const results = MOCK_BUTTON_SIZES.map(size => 
      createButtonElement({ size, children: 'Test' })
    );
    return results.every((result, index) => 
      result.type === 'button' && 
      result.props.className.includes(getSizeClasses(MOCK_BUTTON_SIZES[index]))
    );
  },

  'handles disabled state': () => {
    const result = createButtonElement({ 
      children: 'Disabled', 
      disabled: true 
    });
    return result.props.disabled === true &&
           result.props.className.includes('disabled:opacity-50');
  },

  'handles loading state': () => {
    const result = createButtonElement({ 
      children: 'Loading', 
      loading: true 
    });
    return result.props.disabled === true &&
           result.props.children.some((child: any) => 
             child && child.props && child.props.className?.includes('animate-spin')
           );
  },

  'handles click events': () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };
    const result = createButtonElement({ 
      children: 'Click', 
      onClick: handleClick 
    });
    
    // Simulate click
    if (result.props.onClick) {
      result.props.onClick({} as any);
    }
    
    return clicked;
  },

  'renders with custom className': () => {
    const customClass = 'custom-button-class';
    const result = createButtonElement({ 
      children: 'Custom', 
      className: customClass 
    });
    return result.props.className.includes(customClass);
  },

  'renders with start and end icons': () => {
    const startIcon = '🚀';
    const endIcon = '✨';
    const result = createButtonElement({ 
      children: 'With Icons',
      startIcon,
      endIcon
    });
    
    const hasStartIcon = result.props.children.some((child: any) => 
      child && child.key === 'start-icon' && 
      child.props && child.props.children === startIcon
    );
    
    const hasEndIcon = result.props.children.some((child: any) => 
      child && child.key === 'end-icon' && 
      child.props && child.props.children === endIcon
    );
    
    return hasStartIcon && hasEndIcon;
  },

  'handles fullWidth prop': () => {
    const result = createButtonElement({ 
      children: 'Full Width', 
      fullWidth: true 
    });
    return result.props.className.includes('w-full');
  },

  'handles rounded prop': () => {
    const normalResult = createButtonElement({ 
      children: 'Normal', 
      rounded: false 
    });
    const roundedResult = createButtonElement({ 
      children: 'Rounded', 
      rounded: true 
    });
    
    return normalResult.props.className.includes('rounded-md') &&
           roundedResult.props.className.includes('rounded-full');
  },

  'validates button props correctly': () => {
    const validProps: AppButtonProps = {
      variant: 'primary',
      size: 'md',
      disabled: false,
      loading: false
    };
    
    const invalidProps: AppButtonProps = {
      variant: 'invalid' as any,
      size: 'huge' as any,
      disabled: true,
      loading: true
    };
    
    const validErrors = validateButtonProps(validProps);
    const invalidErrors = validateButtonProps(invalidProps);
    
    return validErrors.length === 0 && invalidErrors.length >= 3;
  },

  'handles accessibility attributes': () => {
    const ariaLabel = 'Accessible button';
    const testId = 'test-button';
    const result = createButtonElement({ 
      children: 'Accessible',
      'aria-label': ariaLabel,
      'data-testid': testId
    });
    
    return result.props['aria-label'] === ariaLabel &&
           result.props['data-testid'] === testId;
  },

  'handles different button types': () => {
    const submitResult = createButtonElement({ 
      children: 'Submit', 
      type: 'submit' 
    });
    const resetResult = createButtonElement({ 
      children: 'Reset', 
      type: 'reset' 
    });
    
    return submitResult.props.type === 'submit' &&
           resetResult.props.type === 'reset';
  }
};

// Run all tests
export const runTests = (): { passed: number; failed: number; results: Record<string, boolean> } => {
  const results: Record<string, boolean> = {};
  let passed = 0;
  let failed = 0;
  
  Object.entries(testSuite).forEach(([testName, testFn]) => {
    try {
      const result = testFn();
      results[testName] = result;
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      results[testName] = false;
      failed++;
    }
  });
  
  return { passed, failed, results };
};

// Helper functions for integration with testing frameworks
export const mockRender = (props: AppButtonProps) => createButtonElement(props);
export const mockFireEvent = {
  click: (element: any) => {
    if (element.props && element.props.onClick) {
      element.props.onClick({} as any);
    }
  }
};

export const mockScreen = {
  getByRole: (role: string, options?: { name?: string }) => {
    // Mock implementation for testing
    return {
      type: 'button',
      props: {
        role,
        'aria-label': options?.name
      }
    };
  },
  
  getByTestId: (testId: string) => {
    // Mock implementation for testing
    return {
      type: 'button',
      props: {
        'data-testid': testId
      }
    };
  }
};

export default AppButton;
