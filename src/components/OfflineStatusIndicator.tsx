import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import '../styles/OfflineStatusIndicator.css';

const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className={`offline-status-indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        <>
          <Wifi size={20} />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff size={20} />
          <span>You are offline - Some features may be limited</span>
        </>
      )}
    </div>
  );
};

export { OfflineStatusIndicator };
export default OfflineStatusIndicator;
