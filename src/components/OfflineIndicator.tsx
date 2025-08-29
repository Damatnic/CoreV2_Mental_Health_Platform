/**
 * Offline Indicator Component
 *
 * Enhanced visual indicator for connection status with crisis intervention priority,
 * sync progress, and accessibility compliance for the Astral Core mental health platform.
 * 
 * Features:
 * - Real-time connection status
 * - Sync progress visualization
 * - Queue status display
 * - Storage usage indicator
 * - Quick actions for offline features
 * - Network quality indicator
 * - Auto-hide when online
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOffline } from '../contexts/OfflineProvider';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { 
  AlertIcon, 
  CheckIcon, 
  PhoneIcon,
  RefreshIcon,
  WifiIcon,
  WifiOffIcon,
  CloudIcon,
  CloudOffIcon,
  DatabaseIcon,
  ClockIcon
} from './icons.dynamic';

interface OfflineIndicatorProps {
  variant?: 'minimal' | 'detailed' | 'banner' | 'floating';
  showConnectionQuality?: boolean;
  showCrisisStatus?: boolean;
  showActions?: boolean;
  showProgress?: boolean;
  showStorage?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  onClick?: () => void;
  onSync?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  variant = 'minimal',
  showConnectionQuality = false,
  showCrisisStatus = true,
  showActions = false,
  showProgress = false,
  showStorage = false,
  autoHide = false,
  autoHideDelay = 5000,
  position = 'bottom-right',
  className = '',
  onClick,
  onSync
}) => {
  const { connectionStatus } = useOffline();
  const { 
    syncState, 
    capabilities, 
    syncNow, 
    retryFailed 
  } = useOfflineSync();
  
  // State
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract the values from connectionStatus
  const isOnline = connectionStatus.isOnline;
  const connectionQuality = connectionStatus.connectionQuality || 'good';
  const lastSyncTime = syncState?.lastSync?.getTime() || connectionStatus.lastSync?.getTime() || Date.now() - 30000;
  const pendingSyncCount = syncState?.pendingCount || 0;
  const crisisResourcesAvailable = connectionStatus.crisisResourcesAvailable;

  const getConnectionIcon = () => {
    if (isOnline) {
      return <CheckIcon className="w-4 h-4 text-green-600" />;
    } else if (crisisResourcesAvailable) {
      return <PhoneIcon className="w-4 h-4 text-orange-600" />;
    } else {
      return <AlertIcon className="w-4 h-4 text-red-600" />;
    }
  };

  const getConnectionText = () => {
    if (isOnline) {
      return 'Online';
    } else if (crisisResourcesAvailable) {
      return 'Offline - Crisis Resources Available';
    } else {
      return 'Offline';
    }
  };

  const getConnectionColor = () => {
    if (isOnline) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (crisisResourcesAvailable) {
      return 'text-orange-700 bg-orange-50 border-orange-200';
    } else {
      return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';
    
    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Handle sync
  const handleSync = useCallback(async () => {
    if (onSync) {
      onSync();
    } else {
      await syncNow();
    }
  }, [onSync, syncNow]);

  // Auto-hide effect
  useEffect(() => {
    if (autoHide && isOnline && !syncState?.isSyncing) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isOnline, autoHide, autoHideDelay, syncState?.isSyncing]);

  // Format bytes for storage display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Position classes for floating variant
  const positionClasses = {
    'top': 'top-4 left-1/2 -translate-x-1/2',
    'bottom': 'bottom-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Don't render if not visible
  if (!isVisible && variant !== 'banner') {
    return null;
  }

  // Minimal variant - just an icon
  if (variant === 'minimal') {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center justify-center p-2 rounded-full transition-colors duration-200 ${className}`}
        aria-label={getConnectionText()}
        title={getConnectionText()}
      >
        {getConnectionIcon()}
        {pendingSyncCount > 0 && (
          <span className="ml-1 text-xs font-medium">
            ({pendingSyncCount})
          </span>
        )}
      </button>
    );
  }

  // Floating variant - fixed position with status
  if (variant === 'floating') {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg">
          {getConnectionIcon()}
          {syncState?.isSyncing ? (
            <div className="flex items-center gap-2">
              <RefreshIcon className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm">Syncing...</span>
            </div>
          ) : pendingSyncCount > 0 ? (
            <span className="text-sm">
              {pendingSyncCount} changes pending
            </span>
          ) : (
            <span className="text-sm">
              {isOnline ? 'All synced' : 'Offline'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Banner variant - full width status bar
  if (variant === 'banner') {
    return (
      <div className={`w-full p-3 border-l-4 ${getConnectionColor()} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getConnectionIcon()}
            <div>
              <p className="font-medium">{getConnectionText()}</p>
              {!isOnline && crisisResourcesAvailable && (
                <p className="text-sm opacity-75">
                  Emergency contacts and coping strategies remain accessible
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {showConnectionQuality && connectionQuality && (
              <div className="text-sm">
                <span className="opacity-75">Quality: </span>
                <span className="font-medium capitalize">{connectionQuality}</span>
              </div>
            )}
            
            {showActions && isOnline && pendingSyncCount > 0 && (
              <button
                onClick={handleSync}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                disabled={syncState?.isSyncing}
              >
                {syncState?.isSyncing ? (
                  <>
                    <RefreshIcon className="w-3 h-3 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CloudIcon className="w-3 h-3" />
                    Sync Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {showProgress && syncState?.isSyncing && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Syncing...</span>
              <span>{syncState.syncProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${syncState.syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {pendingSyncCount > 0 && (
          <div className="mt-2 text-sm opacity-75">
            {pendingSyncCount} items waiting to sync
            {syncState?.failedCount > 0 && (
              <span className="ml-2 text-orange-600">
                ({syncState.failedCount} failed)
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant - compact status with details
  return (
    <div className={`${className}`}>
      <div 
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getConnectionColor()} cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        {getConnectionIcon()}
        
        <div className="flex flex-col">
          <span className="text-sm font-medium">{getConnectionText()}</span>
          
          {showConnectionQuality && (
            <div className="flex items-center space-x-2 text-xs opacity-75">
              <span>Last sync: {formatLastSync()}</span>
              {connectionQuality && (
                <>
                  <span>•</span>
                  <span className="capitalize">{connectionQuality}</span>
                </>
              )}
            </div>
          )}
          
          {pendingSyncCount > 0 && (
            <span className="text-xs opacity-75">
              {pendingSyncCount} pending
              {syncState?.failedCount > 0 && (
                <span className="text-orange-600"> • {syncState.failedCount} failed</span>
              )}
            </span>
          )}
        </div>

        {showCrisisStatus && !isOnline && crisisResourcesAvailable && (
          <div className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
            Crisis Support Available
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Sync Status Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
              <DatabaseIcon className="w-4 h-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xs font-medium">{syncState?.pendingCount || 0}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
              <AlertIcon className="w-4 h-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xs font-medium">{syncState?.failedCount || 0}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
              <CheckIcon className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs font-medium">{syncState?.conflictCount || 0}</p>
              <p className="text-xs text-gray-500">Conflicts</p>
            </div>
          </div>

          {/* Storage Status */}
          {showStorage && capabilities && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Storage Used</span>
                <span>
                  {formatBytes(capabilities.storage.used)} / {formatBytes(capabilities.storage.quota)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full"
                  style={{
                    width: `${(capabilities.storage.used / capabilities.storage.quota) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              {isOnline && pendingSyncCount > 0 && (
                <button
                  onClick={handleSync}
                  className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                  disabled={syncState?.isSyncing}
                >
                  {syncState?.isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
              {syncState?.failedCount > 0 && (
                <button
                  onClick={() => retryFailed()}
                  className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600 transition-colors"
                >
                  Retry Failed
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;