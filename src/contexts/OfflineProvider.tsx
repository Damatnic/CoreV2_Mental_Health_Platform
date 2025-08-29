/**
 * Offline Provider Context
 *
 * Provides app-wide offline state management and crisis resource access
 * for the Astral Core mental health platform.
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useConnectionStatus, ConnectionStatus, OfflineCapability } from '../hooks/useConnectionStatus';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'assistant';
}

interface OfflineContextValue {
  connectionStatus: ConnectionStatus;
  updateCrisisResources: () => Promise<boolean>;
  forceCacheUpdate: () => Promise<boolean>;
  sendMessageToServiceWorker: (message: ChatMessage) => Promise<boolean>;
  isFeatureAvailable: (feature: string) => boolean;
  getOfflineCapability: (feature: string) => OfflineCapability | undefined;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const {
    status: connectionStatus,
    forceSync: updateCrisisResources,
    refreshStatus: forceCacheUpdate,
    sendMessageToSW: sendMessageToServiceWorker
  } = useConnectionStatus();

  const isFeatureAvailable = (feature: string): boolean => {
    if (connectionStatus.isOnline) return true;
    
    const capability = connectionStatus.offlineCapabilities.find(
      cap => cap.feature.toLowerCase() === feature.toLowerCase()
    );
    return capability?.available || false;
  };

  const getOfflineCapability = (feature: string): OfflineCapability | undefined => {
    return connectionStatus.offlineCapabilities.find(
      cap => cap.feature.toLowerCase() === feature.toLowerCase()
    );
  };

  const contextValue: OfflineContextValue = useMemo(() => ({
    connectionStatus,
    updateCrisisResources,
    forceCacheUpdate,
    sendMessageToServiceWorker,
    isFeatureAvailable,
    getOfflineCapability
  }), [
    connectionStatus,
    updateCrisisResources,
    forceCacheUpdate,
    sendMessageToServiceWorker
  ]);

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextValue => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineProvider;