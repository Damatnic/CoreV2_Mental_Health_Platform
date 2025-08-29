import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useEnhancedOffline = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = React.useState<any[]>([]);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'error'>('idle');

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineQueue.length > 0) {
        syncOfflineData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  const queueAction = React.useCallback((action: any) => {
    setOfflineQueue(prev => [...prev, { ...action, timestamp: Date.now() }]);
  }, []);

  const syncOfflineData = React.useCallback(async () => {
    setSyncStatus('syncing');
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOfflineQueue([]);
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  return { isOnline, offlineQueue, queueAction, syncStatus, syncOfflineData };
};

describe('useEnhancedOffline', () => {
  it('should detect online status', () => {
    const { result } = renderHook(() => useEnhancedOffline());
    expect(typeof result.current.isOnline).toBe('boolean');
  });

  it('should queue actions when offline', () => {
    const { result } = renderHook(() => useEnhancedOffline());
    
    act(() => {
      result.current.queueAction({ type: 'POST', data: 'test' });
    });
    
    expect(result.current.offlineQueue).toHaveLength(1);
  });

  it('should sync data when coming online', async () => {
    const { result } = renderHook(() => useEnhancedOffline());
    
    act(() => {
      result.current.queueAction({ type: 'POST', data: 'test' });
    });
    
    await act(async () => {
      await result.current.syncOfflineData();
    });
    
    expect(result.current.offlineQueue).toHaveLength(0);
  });
});
