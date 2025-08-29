import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';

interface NetworkBannerProps {
  position?: 'top' | 'bottom';
  showOfflineIndicator?: boolean;
  showRetryButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
  onNetworkChange?: (isOnline: boolean) => void;
  onRetry?: () => Promise<void>;
}

interface NetworkState {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown';
  isRetrying: boolean;
  lastOfflineTime?: Date;
  reconnectedAt?: Date;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({
  position = 'top',
  showOfflineIndicator = true,
  showRetryButton = true,
  autoHide = true,
  autoHideDelay = 5000,
  className = '',
  onNetworkChange,
  onRetry
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    isRetrying: false
  });

  const [isVisible, setIsVisible] = useState(!navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  // Get connection information from Network Information API
  const getConnectionInfo = useCallback((): Partial<NetworkState> => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      return {
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown'
      };
    }

    return {
      connectionType: 'unknown',
      effectiveType: 'unknown'
    };
  }, []);

  // Update network state
  const updateNetworkState = useCallback((isOnline: boolean) => {
    const connectionInfo = getConnectionInfo();
    const now = new Date();

    setNetworkState(prev => ({
      ...prev,
      isOnline,
      ...connectionInfo,
      lastOfflineTime: !isOnline && prev.isOnline ? now : prev.lastOfflineTime,
      reconnectedAt: isOnline && !prev.isOnline ? now : prev.reconnectedAt
    }));

    // Show/hide banner based on connection status
    if (!isOnline && showOfflineIndicator) {
      setIsVisible(true);
      setIsDismissed(false);
    } else if (isOnline && autoHide && !isDismissed) {
      // Auto-hide after delay when back online
      setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
    }

    // Notify parent component
    if (onNetworkChange) {
      onNetworkChange(isOnline);
    }
  }, [getConnectionInfo, showOfflineIndicator, autoHide, autoHideDelay, onNetworkChange, isDismissed]);

  // Set up network event listeners
  useEffect(() => {
    const handleOnline = () => updateNetworkState(true);
    const handleOffline = () => updateNetworkState(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        updateNetworkState(navigator.onLine);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateNetworkState]);

  // Handle retry functionality
  const handleRetry = async () => {
    setNetworkState(prev => ({ ...prev, isRetrying: true }));

    try {
      // Try a network request to verify connection
      await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });

      // If successful, update state
      updateNetworkState(true);

      // Call custom retry handler if provided
      if (onRetry) {
        await onRetry();
      }

    } catch (error) {
      console.error('Network retry failed:', error);
      // Keep showing offline status
    } finally {
      setNetworkState(prev => ({ ...prev, isRetrying: false }));
    }
  };

  // Handle manual dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  // Don't render if not visible or if dismissed
  if (!isVisible || isDismissed) {
    return null;
  }

  // Get banner styling based on connection status
  const getBannerStyles = () => {
    if (!networkState.isOnline) {
      return {
        background: 'bg-red-600',
        text: 'text-white',
        icon: WifiOff,
        iconClass: 'text-white'
      };
    } else if (networkState.reconnectedAt) {
      return {
        background: 'bg-green-600',
        text: 'text-white',
        icon: CheckCircle,
        iconClass: 'text-white'
      };
    } else {
      return {
        background: 'bg-yellow-500',
        text: 'text-yellow-900',
        icon: AlertTriangle,
        iconClass: 'text-yellow-900'
      };
    }
  };

  // Get connection quality indicator
  const getConnectionQuality = () => {
    const { effectiveType } = networkState;
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return { quality: 'poor', label: 'Slow connection' };
      case '3g':
        return { quality: 'fair', label: 'Fair connection' };
      case '4g':
      case '5g':
        return { quality: 'good', label: 'Good connection' };
      default:
        return { quality: 'unknown', label: 'Connection speed unknown' };
    }
  };

  // Format offline duration
  const getOfflineDuration = () => {
    if (!networkState.lastOfflineTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - networkState.lastOfflineTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);

    if (diffMinutes > 0) {
      return `Offline for ${diffMinutes}m ${diffSeconds}s`;
    } else {
      return `Offline for ${diffSeconds}s`;
    }
  };

  const styles = getBannerStyles();
  const IconComponent = styles.icon;
  const connectionQuality = getConnectionQuality();
  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <div 
      className={`
        fixed left-0 right-0 z-50 ${positionClass}
        ${styles.background} ${styles.text}
        shadow-lg border-b border-opacity-20
        transform transition-transform duration-300 ease-in-out
        ${className}
      `}
      role="banner"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Status and info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconComponent className={`w-5 h-5 ${styles.iconClass}`} />
              <span className="font-medium">
                {!networkState.isOnline ? 'No Internet Connection' : 
                 networkState.reconnectedAt ? 'Connection Restored' : 
                 'Connection Issues'}
              </span>
            </div>

            {/* Additional info */}
            <div className="hidden md:flex items-center gap-4 text-sm opacity-90">
              {!networkState.isOnline && networkState.lastOfflineTime && (
                <span>{getOfflineDuration()}</span>
              )}
              
              {networkState.isOnline && connectionQuality.quality !== 'unknown' && (
                <span>{connectionQuality.label}</span>
              )}
              
              {networkState.connectionType !== 'unknown' && (
                <span className="capitalize">{networkState.connectionType}</span>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Retry button */}
            {!networkState.isOnline && showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={networkState.isRetrying}
                className="
                  flex items-center gap-2 px-3 py-1 
                  bg-white bg-opacity-20 hover:bg-opacity-30
                  rounded-md transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                aria-label="Retry connection"
              >
                <RefreshCw 
                  className={`w-4 h-4 ${networkState.isRetrying ? 'animate-spin' : ''}`} 
                />
                <span className="text-sm">
                  {networkState.isRetrying ? 'Retrying...' : 'Retry'}
                </span>
              </button>
            )}

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="
                p-1 hover:bg-white hover:bg-opacity-20 
                rounded-md transition-colors duration-200
              "
              aria-label="Dismiss network banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Additional details row for mobile */}
        <div className="md:hidden mt-2 text-sm opacity-90">
          <div className="flex items-center justify-between">
            {!networkState.isOnline && networkState.lastOfflineTime && (
              <span>{getOfflineDuration()}</span>
            )}
            
            {networkState.isOnline && connectionQuality.quality !== 'unknown' && (
              <span>{connectionQuality.label}</span>
            )}
            
            {networkState.connectionType !== 'unknown' && (
              <span className="capitalize">{networkState.connectionType}</span>
            )}
          </div>
        </div>

        {/* Offline tips */}
        {!networkState.isOnline && (
          <div className="mt-2 text-sm opacity-90">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="mb-1">
                  Some features may be limited while offline.
                </p>
                <p className="text-xs">
                  • Crisis resources are still available
                  • Your data will sync when reconnected
                  • Check your device's network settings
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reconnection success message */}
        {networkState.isOnline && networkState.reconnectedAt && (
          <div className="mt-2 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>
                You're back online! Syncing your latest changes...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator for slow connections */}
      {networkState.isOnline && 
       (networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g') && (
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div className="h-full bg-yellow-300 opacity-50 animate-pulse" />
        </div>
      )}
    </div>
  );
};

// Simple network status hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateConnectionType = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(connection.type || 'unknown');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
      updateConnectionType(); // Initial check
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return { isOnline, connectionType };
};

// Network quality indicator component
export const NetworkQualityIndicator: React.FC<{
  className?: string;
  showLabel?: boolean;
}> = ({ className = '', showLabel = false }) => {
  const { isOnline, connectionType } = useNetworkStatus();
  const [effectiveType, setEffectiveType] = useState<string>('unknown');

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      setEffectiveType(connection.effectiveType || 'unknown');
      
      const handleChange = () => {
        setEffectiveType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);

  const getQualityColor = () => {
    if (!isOnline) return 'text-red-500';
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'text-red-400';
      case '3g':
        return 'text-yellow-500';
      case '4g':
      case '5g':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSignalBars = () => {
    if (!isOnline) return 0;
    
    switch (effectiveType) {
      case 'slow-2g':
        return 1;
      case '2g':
        return 2;
      case '3g':
        return 3;
      case '4g':
        return 4;
      case '5g':
        return 5;
      default:
        return 2;
    }
  };

  const signalBars = getSignalBars();
  const qualityColor = getQualityColor();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Signal strength bars */}
      <div className="flex items-end gap-0.5">
        {[1, 2, 3, 4, 5].map(bar => (
          <div
            key={bar}
            className={`
              w-1 bg-current transition-colors duration-200
              ${qualityColor}
              ${bar <= signalBars ? 'opacity-100' : 'opacity-20'}
            `}
            style={{ height: `${bar * 2 + 2}px` }}
          />
        ))}
      </div>

      {/* Connection type label */}
      {showLabel && (
        <span className={`text-xs font-medium ${qualityColor}`}>
          {isOnline ? effectiveType.toUpperCase() : 'OFFLINE'}
        </span>
      )}
    </div>
  );
};

export default NetworkBanner;
