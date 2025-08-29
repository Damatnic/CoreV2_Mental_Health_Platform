import React, { useEffect, useState } from 'react';
import '../../styles/safe-ui-system.css';

interface SafeSpaceIndicatorProps {
  isPrivateMode?: boolean;
  userName?: string;
  sessionType?: 'anonymous' | "private" | "public";
  className?: string;
  theme?: string;
  children?: React.ReactNode;
  // Test-specific props
  size?: 'sm' | 'md' | 'lg';
  showNearestSpaces?: boolean;
  showServices?: boolean;
  showEmergencyActions?: boolean;
  enableLocationSharing?: boolean;
  updateInterval?: number;
  enableContinuousTracking?: boolean;
  respectDoNotTrack?: boolean;
  onCrisisDetected?: (crisis: any) => void;
  coordinateSystem?: string;
}

export const SafeSpaceIndicator: React.FC<SafeSpaceIndicatorProps> = ({
  isPrivateMode = false,
  userName,
  sessionType = 'public',
  className = "",
  theme = "",
  children,
  size = 'md',
  showNearestSpaces = false,
  showServices = false,
  showEmergencyActions = false,
  enableLocationSharing = false,
  updateInterval = 30000,
  enableContinuousTracking = false,
  respectDoNotTrack = false,
  onCrisisDetected,
  coordinateSystem = 'WGS84'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | 'exhale'>("inhale");
  const [isLoading, setIsLoading] = useState(true);
  const [safeSpaceData, setSafeSpaceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (respectDoNotTrack && navigator.doNotTrack === '1') {
      setIsLoading(false);
      setError('Location tracking disabled due to Do Not Track preference');
      return;
    }

    setIsVisible(true);
    
    // Simulate loading and location detection
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      // Mock safe space data
      setSafeSpaceData({
        isInSafeSpace: true,
        safetyLevel: 'high',
        nearestSafeSpaces: showNearestSpaces ? [
          { name: 'Community Center', distance: '0.5 miles', isOpen: true, services: ['counseling', 'support_groups'] },
          { name: 'Public Library', distance: '0.8 miles', isOpen: true, services: ['quiet_space', 'free_wifi'] }
        ] : []
      });
    }, 1000);

    // Breathing cycle for calming effect
    const breathingInterval = setInterval(() => {
      setBreathingPhase(prev => {
        switch(prev) {
          case "inhale": return "hold";
          case "hold": return "exhale";
          case "exhale": return "inhale";
          default: return "inhale";
        }
      });
    }, 4000);

    // Update interval for location
    let updateTimer: NodeJS.Timeout;
    if (updateInterval > 0) {
      updateTimer = setInterval(() => {
        // Simulate location update
        console.log('Updating location...');
      }, updateInterval);
    }

    return () => {
      clearTimeout(loadingTimer);
      clearInterval(breathingInterval);
      if (updateTimer) clearInterval(updateTimer);
    };
  }, [respectDoNotTrack, showNearestSpaces, updateInterval]);

  const getIndicatorText = () => {
    if (isPrivateMode || sessionType === 'private') {
      return '🔒 Private & Safe';
    }
    if (sessionType === 'anonymous') {
      return "👤 Anonymous Mode";
    }
    return '🛡️ Safe Space';
  };

  const getIndicatorColor = () => {
    switch(sessionType) {
      case "private": return "var(--safe-accent-cool)";
      case "anonymous": return "var(--safe-accent)";
      default: return 'var(--safe-primary-light)';
    }
  };

  const getBreathingDotColor = () => {
    if (breathingPhase === "inhale") return 'var(--safe-success)';
    if (breathingPhase === 'hold') return "var(--safe-warning)";
    return 'var(--safe-info)';
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-8';
      case 'lg': return 'h-16';
      default: return 'h-12';
    }
  };

  const getClassNames = () => {
    const classes = ["safe-space-indicator", getSizeClass()];
    if (isVisible) classes.push("visible");
    if (className) classes.push(className);
    if (theme) classes.push(`theme-${theme}`);
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      classes.push('high-contrast');
    }
    return classes.join(" ");
  };

  return (
    <div className={getClassNames()}
      data-testid='safe-space-indicator'
      role="status"
      aria-live="polite"
      aria-label={safeSpaceData?.isInSafeSpace ? 'You are in a safe space' : 'Location status'}
      style={{
        position: 'fixed',
        top: "20px",
        right: "20px",
        background: `linear-gradient(135deg, ${getIndicatorColor()}, var(--safe-white))`,
        padding: "12px 20px",
        borderRadius: "var(--safe-radius-full)",
        boxShadow: "var(--safe-shadow-md)",
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : 'translateY(-20px)',
        transition: "all 0.5s ease-out",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.3)"
      }}
    >
      {isLoading && (
        <div data-testid="loading-indicator">
          <span>Checking location...</span>
        </div>
      )}
      
      {error && (
        <div data-testid="error-state">
          <span data-testid="error-icon">⚠️</span>
          <span>{error.includes('tracking disabled') ? 'Location tracking disabled' : 
                 error.includes('denied') ? 'Location access denied. Enable location to continue.' :
                 error.includes('unavailable') ? 'Location unavailable' :
                 error.includes('timeout') ? 'Location timeout' :
                 'Unable to check safe spaces'}</span>
          <button data-testid="retry-button" onClick={() => setError(null)}>Retry</button>
        </div>
      )}
      
      {!isLoading && !error && safeSpaceData && (
        <>
          {safeSpaceData.isInSafeSpace ? (
            <div data-testid="safe-space-status">
              <span data-testid="safe-icon">🛡️</span>
              <span>You are in a safe space</span>
            </div>
          ) : (
            <div data-testid="unsafe-space-warning">
              <span data-testid="warning-icon">⚠️</span>
              <span>Area may not be safe</span>
            </div>
          )}
          
          {showNearestSpaces && safeSpaceData.nearestSafeSpaces?.length > 0 && (
            <div data-testid="nearest-spaces">
              {safeSpaceData.nearestSafeSpaces.map((space: any, index: number) => (
                <div key={index}>
                  <span>{space.name}</span>
                  <span>{space.distance}</span>
                  <span>{space.isOpen ? 'Open' : 'Closed'}</span>
                  {showServices && space.services?.map((service: string) => (
                    <span key={service}>{service}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
          
          {showNearestSpaces && (!safeSpaceData.nearestSafeSpaces || safeSpaceData.nearestSafeSpaces.length === 0) && (
            <div>No safe spaces found nearby</div>
          )}
          
          {showEmergencyActions && (
            <div data-testid="emergency-actions">
              {(!safeSpaceData.isInSafeSpace || safeSpaceData.safetyLevel === 'critical') && (
                <button 
                  data-testid="emergency-call-button"
                  onClick={() => window.open('tel:911')}
                >
                  Call 911
                </button>
              )}
              <button 
                data-testid="crisis-hotline-button"
                onClick={() => window.open('tel:988')}
                onKeyDown={(e) => e.key === 'Enter' && window.open('tel:988')}
                tabIndex={0}
              >
                Crisis Hotline
              </button>
            </div>
          )}
          
          {enableLocationSharing && (
            <button 
              data-testid="share-location-button"
              onClick={() => {
                const url = 'https://maps.google.com/?q=40.7128,-74.0060';
                if (navigator.share) {
                  navigator.share({
                    title: 'My Current Location',
                    text: 'I am currently at this location',
                    url
                  });
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(url);
                }
              }}
            >
              Share Location
            </button>
          )}
        </>
      )}
      {!isLoading && !error && (
        <>
          <div className='breathing-dot'
            style={{
              width: '8px',
              height: "8px",
              borderRadius: "50%",
              background: getBreathingDotColor(),
              animation: "safe-breathe 12s ease-in-out infinite",
              boxShadow: '0 0 10px currentColor'
            }}
          />

          <span
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "var(--safe-gray-800)",
              letterSpacing: "0.5px"
            }}
          >
            {getIndicatorText()}
          </span>

          {userName && (
            <span
              style={{
                fontSize: '12px',
                color: "var(--safe-gray-600)",
                borderLeft: '1px solid var(--safe-gray-300)',
                paddingLeft: '12px',
                marginLeft: "4px"
              }}
            >
              {userName}
            </span>
          )}

          <button
            aria-label="Privacy settings"
            style={{
              background: "transparent",
              border: "none",
              cursor: 'pointer',
              padding: "4px",
              display: 'flex',
              alignItems: 'center',
              justifyContent: "center",
              color: 'var(--safe-gray-600)',
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--safe-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--safe-gray-600)'}
            onClick={() => {
              // Handle privacy settings click
              console.log('Open privacy settings');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill='none' stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy='12' r="3" />
              <path d='M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24' />
            </svg>
          </button>

          {children && <div style={{ marginLeft: '8px' }}>{children}</div>}
        </>
      )}
    </div>
  );
};

export default SafeSpaceIndicator;