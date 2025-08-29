import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [connectionType, setConnectionType] = React.useState<string>('unknown');
  const [effectiveType, setEffectiveType] = React.useState<string>('unknown');
  const [downlink, setDownlink] = React.useState<number | null>(null);
  const [rtt, setRtt] = React.useState<number | null>(null);
  const [saveData, setSaveData] = React.useState(false);

  React.useEffect(() => {
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
        setDownlink(connection.downlink || null);
        setRtt(connection.rtt || null);
        setSaveData(connection.saveData || false);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      updateConnectionInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleConnectionChange = () => {
      updateConnectionInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  const getConnectionQuality = React.useCallback(() => {
    if (!isOnline) return 'offline';
    if (effectiveType === '4g' && !saveData) return 'excellent';
    if (effectiveType === '3g') return 'good';
    if (effectiveType === '2g') return 'poor';
    if (effectiveType === 'slow-2g') return 'very-poor';
    return 'unknown';
  }, [isOnline, effectiveType, saveData]);

  const shouldReduceData = React.useCallback(() => {
    return saveData || effectiveType === '2g' || effectiveType === 'slow-2g';
  }, [saveData, effectiveType]);

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    getConnectionQuality,
    shouldReduceData
  };
};

describe('useConnectionStatus', () => {
  let originalNavigator: any;

  beforeEach(() => {
    originalNavigator = global.navigator;
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    global.navigator = originalNavigator;
  });

  it('should detect online status', () => {
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('should detect offline status', () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      writable: true
    });

    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('should update on online event', () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      writable: true
    });

    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current.isOnline).toBe(false);

    act(() => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: true,
        writable: true
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should detect connection quality', () => {
    const mockConnection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    };

    Object.defineProperty(global.navigator, 'connection', {
      value: mockConnection,
      writable: true
    });

    const { result } = renderHook(() => useConnectionStatus());
    
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.getConnectionQuality()).toBe('excellent');
  });

  it('should detect save data mode', () => {
    const mockConnection = {
      saveData: true,
      effectiveType: '4g'
    };

    Object.defineProperty(global.navigator, 'connection', {
      value: mockConnection,
      writable: true
    });

    const { result } = renderHook(() => useConnectionStatus());
    
    expect(result.current.saveData).toBe(true);
    expect(result.current.shouldReduceData()).toBe(true);
  });

  it('should recommend data reduction on slow connections', () => {
    const mockConnection = {
      effectiveType: '2g',
      saveData: false
    };

    Object.defineProperty(global.navigator, 'connection', {
      value: mockConnection,
      writable: true
    });

    const { result } = renderHook(() => useConnectionStatus());
    
    expect(result.current.shouldReduceData()).toBe(true);
    expect(result.current.getConnectionQuality()).toBe('poor');
  });
});
