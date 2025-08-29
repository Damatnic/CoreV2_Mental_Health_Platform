/**
 * Service Worker Update Component
 * Handles service worker updates and prompts user to refresh
 */

import React, { useState } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import './ServiceWorkerUpdate.css';

interface ServiceWorkerUpdateProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

const ServiceWorkerUpdate: React.FC<ServiceWorkerUpdateProps> = ({
  onUpdate,
  onDismiss
}) => {
  const { 
    isUpdateAvailable, 
    isInstalling, 
    updateServiceWorker,
    skipWaiting 
  } = useServiceWorker();
  
  const [isVisible, setIsVisible] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      await updateServiceWorker();
      onUpdate?.();
      
      // Reload the page to activate the new service worker
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to update service worker:', error);
      setIsUpdating(false);
    }
  };

  const handleSkipWaiting = async () => {
    setIsUpdating(true);
    
    try {
      await skipWaiting();
      onUpdate?.();
      
      // Reload the page to activate the new service worker
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to skip waiting:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't show if no update is available or if dismissed
  if (!isUpdateAvailable || !isVisible) {
    return null;
  }

  return (
    <div className="service-worker-update">
      <div className="service-worker-update__content">
        <div className="service-worker-update__icon">
          {isUpdating || isInstalling ? '⏳' : '🔄'}
        </div>
        <div className="service-worker-update__text">
          <h3 className="service-worker-update__title">
            {isUpdating ? 'Updating...' : 'Update Available'}
          </h3>
          <p className="service-worker-update__description">
            {isUpdating 
              ? 'Please wait while we update the app...'
              : 'A new version of CoreV2 is available with improvements and bug fixes.'
            }
          </p>
        </div>
        <div className="service-worker-update__actions">
          {!isUpdating && (
            <>
              <button
                className="service-worker-update__button service-worker-update__button--primary"
                onClick={handleUpdate}
                disabled={isInstalling}
              >
                Update Now
              </button>
              <button
                className="service-worker-update__button service-worker-update__button--secondary"
                onClick={handleSkipWaiting}
                disabled={isInstalling}
              >
                Update & Reload
              </button>
              <button
                className="service-worker-update__button service-worker-update__button--tertiary"
                onClick={handleDismiss}
              >
                Later
              </button>
            </>
          )}
        </div>
      </div>
      {!isUpdating && (
        <button
          className="service-worker-update__close"
          onClick={handleDismiss}
          aria-label="Close update notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ServiceWorkerUpdate;