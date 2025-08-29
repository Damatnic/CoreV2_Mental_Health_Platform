/**
 * Offline Fallback UI Component
 *
 * Provides a comprehensive offline experience when the application
 * loses connectivity, including crisis resources and sync status
 *
 * @license Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEnhancedOffline } from '../hooks/useEnhancedOffline';
import { backgroundSyncService } from '../services/backgroundSyncService';
import { OfflineStatusIndicator } from './OfflineStatusIndicator';
import { OfflineCapabilities } from './OfflineCapabilities';
import { AppButton } from './AppButton';
import { LoadingSpinner } from './LoadingSpinner';

interface OfflineFallbackUIProps {
  showFullScreen?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const OfflineFallbackUI: React.FC<OfflineFallbackUIProps> = ({
  showFullScreen = true,
  onRetry,
  className = ""
}) => {
  const { t } = useTranslation();
  const { isOnline, updateOfflineResources } = useEnhancedOffline();
  const [syncStatus, setSyncStatus] = useState<{
    size: number;
    isSyncing: boolean;
    lastSyncTime?: number;
  }>({
    size: 0,
    isSyncing: false
  });
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Update sync status
    const updateSyncStatus = () => {
      const status = backgroundSyncService.getQueueStatus();
      setSyncStatus({
        size: status.size,
        isSyncing: status.isSyncing,
        lastSyncTime: Date.now()
      });
    };

    // Initial status
    updateSyncStatus();

    // Listen for sync updates
    const handleSyncResult = () => {
      updateSyncStatus();
    };

    backgroundSyncService.addSyncListener(handleSyncResult);

    // Update periodically
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      backgroundSyncService.removeSyncListener(handleSyncResult);
      clearInterval(interval);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Force sync attempt
      await backgroundSyncService.forceSyncNow();

      // Call custom retry handler if provided
      if (onRetry) {
        await onRetry();
      }

      // Reload if now online
      if (navigator.onLine) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleUpdateResources = async () => {
    try {
      await updateOfflineResources();
    } catch (error) {
      console.error('Failed to update offline resources:', error);
    }
  };

  if (isOnline && !syncStatus.size) {
    return null; // Don't show if online and no pending sync
  }

  // Full screen offline view
  if (showFullScreen && !isOnline) {
    return (
      <div className={`offline-fallback-fullscreen ${className}`}>
        <div className="offline-container">
          {/* Header */}
          <div className="offline-header">
            <div className="offline-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill='none'>
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill='currentColor'
                />
              </svg>
            </div>
            <h1 className="offline-title">
              {t("offline.fallback.title", "You are offline")}
            </h1>
            <p className="offline-subtitle">
              {t('offline.fallback.subtitle', "Some features are limited, but crisis resources remain available")}
            </p>
          </div>

          {/* Sync Status */}
          {syncStatus.size > 0 && (
            <div className="sync-status-card">
              <div className="sync-status-header">
                <h3>{t("offline.sync.pending", "Pending Updates")}</h3>
                {syncStatus.isSyncing && <LoadingSpinner size="small" />}
              </div>
              <p className="sync-status-text">
                {t("offline.sync.itemsWaiting", '{{count}} items waiting to sync', { count: syncStatus.size })}
              </p>
              <p className="sync-status-note">
                {t("offline.sync.autoSync", "Will automatically sync when connection is restored")}
              </p>
            </div>
          )}

          {/* Available Features */}
          <div className="offline-features">
            <h2>{t("offline.features.title", 'Available Offline')}</h2>
            <OfflineCapabilities variant="list" showActions={true} />
          </div>

          {/* Crisis Resources Section */}
          <div className="crisis-resources-section">
            <div className='crisis-header'>
              <h2>{t("offline.crisis.title", "Crisis Resources")}</h2>
              <span className="crisis-badge">
                {t("offline.crisis.alwaysAvailable", "Always Available")}
              </span>
            </div>

            {!showCrisisResources ? (
              <AppButton variant="primary"
                onClick={() => setShowCrisisResources(true)}
                className="crisis-show-button"
              >
                {t('offline.crisis.showResources', "Show Crisis Resources")}
              </AppButton>
            ) : (
              <div className="crisis-resources-content">
                <div className='crisis-card'>
                  <h3>{t("offline.crisis.emergency", "Emergency Contacts")}</h3>
                  <ul className="crisis-list">
                    <li>
                      <strong>{t("offline.crisis.hotline", "Crisis Hotline")}:</strong>
                      <a href="tel:988" className="crisis-link">988</a>
                      <span className="crisis-note">{t("offline.crisis.available247", '24/7 Support')}</span>
                    </li>
                    <li>
                      <strong>{t('offline.crisis.text', "Crisis Text")}:</strong>
                      <a href="sms:741741" className='crisis-link'>Text HOME to 741741</a>
                    </li>
                  </ul>
                </div>

                <div className='crisis-card'>
                  <h3>{t("offline.crisis.coping", "Coping Strategies")}</h3>
                  <ul className="coping-list">
                    <li>{t("offline.coping.breathing", "Deep breathing exercises (4-7-8 technique)")}</li>
                    <li>{t("offline.coping.grounding", "5-4-3-2-1 grounding technique")}</li>
                    <li>{t("offline.coping.safety", "Review your safety plan")}</li>
                    <li>{t("offline.coping.support", "Reach out to a trusted friend or family member")}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="offline-actions">
            <AppButton variant="primary"
              onClick={handleRetry}
              disabled={isRetrying}
              className="retry-button"
            >
              {isRetrying ? (
                <>
                  <LoadingSpinner size="small" />
                  {t("offline.actions.retrying", 'Checking connection...')}
                </>
              ) : (
                t("offline.actions.retry", 'Retry Connection')
              )}
            </AppButton>

            <AppButton variant="secondary"
              onClick={handleUpdateResources}
              disabled={!isOnline}
              className="update-button"
            >
              {t("offline.actions.updateResources", 'Update Offline Resources')}
            </AppButton>
          </div>

          {/* Help Text */}
          <div className='offline-help'>
            <p>
              {t("offline.help.persistence", "Your data is saved locally and will sync when you reconnect.")}
            </p>
            <p>
              {t("offline.help.crisis", "If you are in crisis, please use the emergency resources above or call 988.")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact offline indicator
  return (
    <div className={`offline-fallback-compact ${className}`}>
      <OfflineStatusIndicator />
      {syncStatus.size > 0 && (
        <div className='sync-badge'>
          <span className='sync-count'>{syncStatus.size}</span>
          <span className='sync-label'>{t("offline.sync.pending", "pending")}</span>
        </div>
      )}
    </div>
  );
};

export default OfflineFallbackUI;