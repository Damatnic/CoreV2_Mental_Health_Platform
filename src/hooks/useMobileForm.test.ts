import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useMobileForm = (initialValues: any) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const handleChange = (field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(initialValues).forEach(field => {
      if (!values[field]) {
        newErrors[field] = 'Required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return { values, errors, touched, handleChange, handleBlur, validate, reset };
};

describe('useMobileForm', () => {
  it('should initialize with provided values', () => {
    const { result } = renderHook(() => 
      useMobileForm({ name: '', email: '' })
    );
    expect(result.current.values).toEqual({ name: '', email: '' });
  });

  it('should handle field changes', () => {
    const { result } = renderHook(() => 
      useMobileForm({ name: '', email: '' })
    );
    act(() => {
      result.current.handleChange('name', 'John');
    });
    expect(result.current.values.name).toBe('John');
  });

  it('should track touched fields', () => {
    const { result } = renderHook(() => 
      useMobileForm({ name: '' })
    );
    act(() => {
      result.current.handleBlur('name');
    });
    expect(result.current.touched.name).toBe(true);
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => 
      useMobileForm({ name: '', email: '' })
    );
    act(() => {
      const isValid = result.current.validate();
      expect(isValid).toBe(false);
    });
    expect(result.current.errors.name).toBe('Required');
  });

  it('should reset form', () => {
    const { result } = renderHook(() => 
      useMobileForm({ name: '' })
    );
    act(() => {
      result.current.handleChange('name', 'John');
      result.current.reset();
    });
    expect(result.current.values.name).toBe('');
  });
});
