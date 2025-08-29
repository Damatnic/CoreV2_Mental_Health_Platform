/**
 * Offline Indicator Component
 *
 * Visual indicator for connection status with crisis intervention priority
 * and accessibility compliance for the Astral Core mental health platform.
 */

import React from 'react';
import { useOffline } from '../contexts/OfflineProvider';
import { AlertIcon, CheckIcon, PhoneIcon } from './icons.dynamic';

interface OfflineIndicatorProps {
  variant?: 'minimal' | 'detailed' | 'banner';
  showConnectionQuality?: boolean;
  showCrisisStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  variant = 'minimal',
  showConnectionQuality = false,
  showCrisisStatus = true,
  className = '',
  onClick
}) => {
  const { connectionStatus } = useOffline();
  
  // Extract the values from connectionStatus
  const isOnline = connectionStatus.isOnline;
  const connectionQuality = connectionStatus.connectionQuality || 'good';
  const lastSyncTime = connectionStatus.lastSync?.getTime() || Date.now() - 30000; // Default to 30 seconds ago
  const pendingSyncCount = 0; // Not available in current interface, default to 0
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
      </button>
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
          
          {showConnectionQuality && connectionQuality && (
            <div className="text-sm">
              <span className="opacity-75">Quality: </span>
              <span className="font-medium capitalize">{connectionQuality}</span>
            </div>
          )}
        </div>

        {pendingSyncCount > 0 && (
          <div className="mt-2 text-sm opacity-75">
            {pendingSyncCount} items waiting to sync
          </div>
        )}
      </div>
    );
  }

  // Detailed variant - compact status with details
  return (
    <div 
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getConnectionColor()} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
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
          </span>
        )}
      </div>

      {showCrisisStatus && !isOnline && crisisResourcesAvailable && (
        <div className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          Crisis Support Available
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;