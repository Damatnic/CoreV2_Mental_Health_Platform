/**
 * useLocalStorage Hook
 * Secure local storage management for mental health platform
 * Includes encryption support for sensitive data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { encryptData, decryptData, EncryptedData } from '../utils/encryptionUtils';

// Type definitions
export interface LocalStorageOptions {
  encrypt?: boolean;
  encryptionKey?: string;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  syncAcrossTabs?: boolean;
  expirationTime?: number; // in milliseconds
}

export interface StoredValue<T> {
  value: T;
  timestamp: number;
  expires?: number;
  encrypted?: boolean;
}

// Custom error class for storage errors
export class LocalStorageError extends Error {
  constructor(message: string, public readonly key: string, public readonly cause?: Error) {
    super(message);
    this.name = 'LocalStorageError';
  }
}

// Default serialization functions
const defaultSerialize = <T>(value: T): string => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new LocalStorageError('Failed to serialize value', '', error as Error);
  }
};

const defaultDeserialize = <T>(value: string): T => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new LocalStorageError('Failed to deserialize value', '', error as Error);
  }
};

/**
 * Main useLocalStorage hook
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void, LocalStorageError | null] {
  const {
    encrypt = false,
    encryptionKey = '',
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    syncAcrossTabs = true,
    expirationTime
  } = options;

  // Use ref to store the current key to handle key changes
  const keyRef = useRef(key);
  const [error, setError] = useState<LocalStorageError | null>(null);

  // Initialize state with stored value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check if window is defined (for SSR)
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      
      if (!item) {
        return initialValue;
      }

      // Parse the stored value
      const parsed: StoredValue<any> = deserialize(item);

      // Check if value has expired
      if (parsed.expires && parsed.expires < Date.now()) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      // Decrypt if necessary
      if (parsed.encrypted && encrypt && encryptionKey) {
        return decryptAndParse(parsed.value, encryptionKey, deserialize);
      }

      return parsed.value;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      setError(new LocalStorageError('Failed to load from localStorage', key, error as Error));
      return initialValue;
    }
  });

  // Update keyRef when key changes
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Set value in localStorage
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        setError(null);

        // Allow value to be a function for state updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Update state
        setStoredValue(valueToStore);

        // Skip localStorage in SSR
        if (typeof window === 'undefined') {
          return;
        }

        // Prepare the value for storage
        let processedValue: any = valueToStore;

        // Encrypt if necessary
        if (encrypt && encryptionKey) {
          const serialized = serialize(valueToStore);
          const encrypted = await encryptData(serialized, encryptionKey);
          processedValue = encrypted;
        }

        // Create the storage object
        const storageObject: StoredValue<any> = {
          value: processedValue,
          timestamp: Date.now(),
          encrypted: encrypt,
          ...(expirationTime && { expires: Date.now() + expirationTime })
        };

        // Serialize and store
        const serialized = serialize(storageObject);
        window.localStorage.setItem(keyRef.current, serialized);

        // Dispatch storage event for cross-tab synchronization
        if (syncAcrossTabs) {
          window.dispatchEvent(new StorageEvent('storage', {
            key: keyRef.current,
            newValue: serialized,
            url: window.location.href,
            storageArea: window.localStorage
          }));
        }
      } catch (error) {
        const storageError = new LocalStorageError(
          'Failed to save to localStorage',
          keyRef.current,
          error as Error
        );
        console.error(storageError);
        setError(storageError);
      }
    },
    [storedValue, encrypt, encryptionKey, serialize, expirationTime, syncAcrossTabs]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setError(null);
      setStoredValue(initialValue);

      if (typeof window === 'undefined') {
        return;
      }

      window.localStorage.removeItem(keyRef.current);

      // Dispatch storage event for cross-tab synchronization
      if (syncAcrossTabs) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: keyRef.current,
          newValue: null,
          url: window.location.href,
          storageArea: window.localStorage
        }));
      }
    } catch (error) {
      const storageError = new LocalStorageError(
        'Failed to remove from localStorage',
        keyRef.current,
        error as Error
      );
      console.error(storageError);
      setError(storageError);
    }
  }, [initialValue, syncAcrossTabs]);

  // Handle storage events for cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key !== keyRef.current || event.storageArea !== window.localStorage) {
        return;
      }

      try {
        if (event.newValue === null) {
          setStoredValue(initialValue);
          return;
        }

        const parsed: StoredValue<any> = deserialize(event.newValue);

        // Check expiration
        if (parsed.expires && parsed.expires < Date.now()) {
          setStoredValue(initialValue);
          return;
        }

        // Decrypt if necessary
        if (parsed.encrypted && encrypt && encryptionKey) {
          const decrypted = await decryptAndParse(parsed.value, encryptionKey, deserialize);
          setStoredValue(decrypted);
        } else {
          setStoredValue(parsed.value);
        }
      } catch (error) {
        console.error('Error syncing localStorage:', error);
        setError(new LocalStorageError('Failed to sync localStorage', keyRef.current, error as Error));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialValue, encrypt, encryptionKey, deserialize, syncAcrossTabs]);

  // Cleanup expired values periodically
  useEffect(() => {
    if (!expirationTime || typeof window === 'undefined') {
      return;
    }

    const checkExpiration = () => {
      try {
        const item = window.localStorage.getItem(keyRef.current);
        if (!item) return;

        const parsed: StoredValue<any> = deserialize(item);
        if (parsed.expires && parsed.expires < Date.now()) {
          removeValue();
        }
      } catch (error) {
        console.error('Error checking expiration:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [expirationTime, deserialize, removeValue]);

  return [storedValue, setValue, removeValue, error];
}

/**
 * Helper function to decrypt and parse encrypted data
 */
async function decryptAndParse<T>(
  encryptedData: EncryptedData,
  encryptionKey: string,
  deserialize: (value: string) => T
): Promise<T> {
  const decrypted = await decryptData(encryptedData, encryptionKey);
  return deserialize(decrypted);
}

/**
 * Hook for managing multiple localStorage keys
 */
export function useMultipleLocalStorage<T extends Record<string, any>>(
  keys: { [K in keyof T]: string },
  initialValues: T,
  options: LocalStorageOptions = {}
): {
  values: T;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  removeValue: <K extends keyof T>(key: K) => void;
  clearAll: () => void;
  errors: Partial<Record<keyof T, LocalStorageError>>;
} {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, LocalStorageError>>>({});

  // Initialize all values
  useEffect(() => {
    const loadedValues: Partial<T> = {};
    const loadErrors: Partial<Record<keyof T, LocalStorageError>> = {};

    for (const [propKey, storageKey] of Object.entries(keys)) {
      try {
        const item = window.localStorage.getItem(storageKey as string);
        if (item) {
          const parsed = JSON.parse(item);
          loadedValues[propKey as keyof T] = parsed.value;
        }
      } catch (error) {
        loadErrors[propKey as keyof T] = new LocalStorageError(
          'Failed to load value',
          storageKey as string,
          error as Error
        );
      }
    }

    setValues(prev => ({ ...prev, ...loadedValues }));
    setErrors(loadErrors);
  }, []);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
    
    try {
      const storageKey = keys[key];
      const storageObject: StoredValue<T[K]> = {
        value,
        timestamp: Date.now()
      };
      window.localStorage.setItem(storageKey, JSON.stringify(storageObject));
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [key]: new LocalStorageError('Failed to save value', keys[key], error as Error)
      }));
    }
  }, [keys]);

  const removeValue = useCallback(<K extends keyof T>(key: K) => {
    setValues(prev => ({ ...prev, [key]: initialValues[key] }));
    
    try {
      window.localStorage.removeItem(keys[key]);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [key]: new LocalStorageError('Failed to remove value', keys[key], error as Error)
      }));
    }
  }, [keys, initialValues]);

  const clearAll = useCallback(() => {
    setValues(initialValues);
    
    for (const storageKey of Object.values(keys)) {
      try {
        window.localStorage.removeItem(storageKey as string);
      } catch (error) {
        console.error('Failed to clear localStorage key:', storageKey, error);
      }
    }
    
    setErrors({});
  }, [keys, initialValues]);

  return { values, setValue, removeValue, clearAll, errors };
}

/**
 * Hook for localStorage with automatic compression
 */
export function useCompressedLocalStorage<T>(
  key: string,
  initialValue: T,
  compressionThreshold: number = 1024 // bytes
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const compress = useCallback((value: string): string => {
    if (value.length < compressionThreshold) {
      return value;
    }
    // In a real implementation, you would use a compression library
    // For now, we'll just return the value as-is
    return value;
  }, [compressionThreshold]);

  const decompress = useCallback((value: string): string => {
    // In a real implementation, you would decompress here
    return value;
  }, []);

  return useLocalStorage(key, initialValue, {
    serialize: (value) => compress(JSON.stringify(value)),
    deserialize: (value) => JSON.parse(decompress(value))
  });
}

// Export utility functions for direct localStorage access
export const LocalStorageUtils = {
  /**
   * Get all keys from localStorage
   */
  getAllKeys(): string[] {
    if (typeof window === 'undefined') return [];
    
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  },

  /**
   * Clear all expired items from localStorage
   */
  clearExpired(): void {
    if (typeof window === 'undefined') return;

    const keys = LocalStorageUtils.getAllKeys();
    for (const key of keys) {
      try {
        const item = window.localStorage.getItem(key);
        if (!item) continue;

        const parsed = JSON.parse(item);
        if (parsed.expires && parsed.expires < Date.now()) {
          window.localStorage.removeItem(key);
        }
      } catch {
        // Skip items that can't be parsed
      }
    }
  },

  /**
   * Get storage size in bytes
   */
  getStorageSize(): number {
    if (typeof window === 'undefined') return 0;

    let size = 0;
    for (const key of LocalStorageUtils.getAllKeys()) {
      const value = window.localStorage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    }
    return size * 2; // UTF-16 uses 2 bytes per character
  },

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
};

export default useLocalStorage;