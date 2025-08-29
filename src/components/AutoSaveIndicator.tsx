import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, AlertCircle, Loader2, Clock, Wifi, WifiOff } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isSaving?: boolean;
  lastSaved?: Date | null;
  saveError?: string | null;
  autoSaveEnabled?: boolean;
  saveInterval?: number; // in milliseconds
  showDetailedStatus?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  onManualSave?: () => void;
  onToggleAutoSave?: (enabled: boolean) => void;
  className?: string;
  
  // Mental health specific props
  isCriticalData?: boolean;
  privacyMode?: boolean;
  offlineMode?: boolean;
}

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSaveTime: Date | null;
  saveCount: number;
  consecutiveErrors: number;
  isOnline: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving = false,
  lastSaved = null,
  saveError = null,
  autoSaveEnabled = true,
  saveInterval = 30000, // 30 seconds default
  showDetailedStatus = false,
  position = 'bottom-right',
  onManualSave,
  onToggleAutoSave,
  className = '',
  isCriticalData = false,
  privacyMode = false,
  offlineMode = false
}) => {
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaveTime: lastSaved,
    saveCount: 0,
    consecutiveErrors: 0,
    isOnline: navigator.onLine
  });

  const [showDetails, setShowDetails] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const detailsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Update state based on props
  useEffect(() => {
    let newStatus: AutoSaveState['status'] = 'idle';

    if (!state.isOnline || offlineMode) {
      newStatus = 'offline';
    } else if (isSaving) {
      newStatus = 'saving';
    } else if (saveError) {
      newStatus = 'error';
    } else if (lastSaved) {
      newStatus = 'saved';
    }

    setState(prev => ({
      ...prev,
      status: newStatus,
      lastSaveTime: lastSaved,
      consecutiveErrors: saveError ? prev.consecutiveErrors + 1 : 0
    }));
  }, [isSaving, saveError, lastSaved, state.isOnline, offlineMode]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pulse animation for important saves
  useEffect(() => {
    if (isCriticalData && state.status === 'saved') {
      setPulseAnimation(true);
      const timeout = setTimeout(() => setPulseAnimation(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isCriticalData, state.status]);

  // Format time since last save
  const getTimeSinceLastSave = () => {
    if (!state.lastSaveTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - state.lastSaveTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return state.lastSaveTime.toLocaleDateString();
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'saved':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      default:
        return <Save className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'saving':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'saved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'offline':
        return 'bg-gray-50 border-gray-200 text-gray-600';
      default:
        return 'bg-white border-gray-200 text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'saving':
        return privacyMode ? 'Securing...' : 'Saving...';
      case 'saved':
        return privacyMode ? 'Secured' : 'Saved';
      case 'error':
        return 'Save failed';
      case 'offline':
        return 'Offline';
      default:
        return 'Unsaved';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const handleShowDetails = () => {
    setShowDetails(true);
    
    if (detailsTimeoutRef.current) {
      clearTimeout(detailsTimeoutRef.current);
    }
    
    detailsTimeoutRef.current = setTimeout(() => {
      setShowDetails(false);
    }, 5000);
  };

  const handleManualSave = () => {
    if (onManualSave && !isSaving && state.isOnline) {
      onManualSave();
      setState(prev => ({ ...prev, saveCount: prev.saveCount + 1 }));
    }
  };

  const handleToggleAutoSave = () => {
    if (onToggleAutoSave) {
      onToggleAutoSave(!autoSaveEnabled);
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      {/* Main Indicator */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-all duration-200
          ${getStatusColor()}
          ${pulseAnimation ? 'animate-pulse' : ''}
          ${showDetails ? 'rounded-b-none' : ''}
          cursor-pointer hover:shadow-md
        `}
        onClick={handleShowDetails}
        role="button"
        tabIndex={0}
        aria-label={`Auto-save status: ${getStatusText()}`}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
        </div>

        {!autoSaveEnabled && (
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" 
               title="Auto-save disabled" />
        )}

        {isCriticalData && (
          <div className="w-2 h-2 bg-red-500 rounded-full" 
               title="Critical data - frequent saves recommended" />
        )}
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className={`
          absolute top-full left-0 right-0 
          bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg
          p-3 min-w-64 text-sm
        `}>
          <div className="space-y-2">
            {/* Last Save Info */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last saved:</span>
              <span className="font-medium">{getTimeSinceLastSave()}</span>
            </div>

            {/* Save Count */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Saves this session:</span>
              <span className="font-medium">{state.saveCount}</span>
            </div>

            {/* Auto-save Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Auto-save:</span>
              <button
                onClick={handleToggleAutoSave}
                className={`
                  text-xs px-2 py-1 rounded transition-colors
                  ${autoSaveEnabled 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }
                `}
              >
                {autoSaveEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connection:</span>
              <div className="flex items-center gap-1">
                {state.isOnline ? (
                  <Wifi className="w-3 h-3 text-green-600" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-600" />
                )}
                <span className="font-medium">
                  {state.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Save Interval */}
            {autoSaveEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Save interval:</span>
                <span className="font-medium">
                  {Math.floor(saveInterval / 1000)}s
                </span>
              </div>
            )}

            {/* Error Info */}
            {saveError && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-red-600 text-xs">
                  <strong>Error:</strong> {saveError}
                </div>
                {state.consecutiveErrors > 1 && (
                  <div className="text-red-500 text-xs mt-1">
                    {state.consecutiveErrors} consecutive errors
                  </div>
                )}
              </div>
            )}

            {/* Privacy Mode Notice */}
            {privacyMode && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1 text-purple-600 text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  Privacy mode active - data encrypted locally
                </div>
              </div>
            )}

            {/* Critical Data Warning */}
            {isCriticalData && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  Critical data - consider manual saves
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-gray-200 flex gap-2">
              <button
                onClick={handleManualSave}
                disabled={isSaving || !state.isOnline}
                className="
                  flex-1 flex items-center justify-center gap-1 
                  px-2 py-1 text-xs bg-blue-600 text-white rounded 
                  hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <Save className="w-3 h-3" />
                {isSaving ? 'Saving...' : 'Save Now'}
              </button>

              {showDetailedStatus && (
                <button
                  onClick={() => setShowDetails(false)}
                  className="
                    px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded 
                    hover:bg-gray-200 transition-colors
                  "
                >
                  Hide
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offline Queue Notice */}
      {state.status === 'offline' && (
        <div className="absolute -top-8 left-0 right-0">
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-1 rounded">
            Changes queued - will sync when online
          </div>
        </div>
      )}

      {/* Save Progress Bar (for large saves) */}
      {isSaving && isCriticalData && (
        <div className="absolute -bottom-8 left-0 right-0">
          <div className="bg-white border border-gray-200 rounded p-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              Securing sensitive data...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div className="bg-blue-600 h-1 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Status */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Auto-save status: {getStatusText()}
        {state.lastSaveTime && `, last saved ${getTimeSinceLastSave()}`}
        {saveError && `, error: ${saveError}`}
        {!state.isOnline && ', currently offline'}
      </div>
    </div>
  );
};

// Hook for managing auto-save functionality
export const useAutoSave = (
  data: any,
  saveFunction: (data: any) => Promise<void>,
  options: {
    interval?: number;
    enabled?: boolean;
    debounceDelay?: number;
    maxRetries?: number;
  } = {}
) => {
  const {
    interval = 30000,
    enabled = true,
    debounceDelay = 1000,
    maxRetries = 3
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const lastDataRef = useRef(data);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setTimeout>>();

  const performSave = async (dataToSave: any, isRetry = false) => {
    if (isSaving && !isRetry) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveFunction(dataToSave);
      setLastSaved(new Date());
      setRetryCount(0);
      lastDataRef.current = dataToSave;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setSaveError(errorMessage);
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => performSave(dataToSave, true), 2000 * (retryCount + 1));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save on data change
  useEffect(() => {
    if (!enabled || JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, debounceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceDelay]);

  // Interval-based save
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (JSON.stringify(data) !== JSON.stringify(lastDataRef.current)) {
        performSave(data);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, enabled, interval]);

  const manualSave = () => {
    performSave(data);
  };

  return {
    isSaving,
    lastSaved,
    saveError,
    manualSave
  };
};

export default AutoSaveIndicator;
