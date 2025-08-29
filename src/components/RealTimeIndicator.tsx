import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import './RealTimeIndicator.css';

interface RealTimeIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
  compact?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  position = 'bottom-right',
  showDetails = false,
  compact = false,
  autoHide = true,
  autoHideDelay = 5000
}) => {
  const { state, isConnected, connect, disconnect, getLatency } = useWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIndicator, setShowIndicator] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-hide logic
  useEffect(() => {
    if (autoHide && isConnected) {
      const timer = setTimeout(() => {
        if (!isExpanded) {
          setShowIndicator(false);
        }
      }, autoHideDelay);
      
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    } else {
      setShowIndicator(true);
    }
  }, [isConnected, autoHide, autoHideDelay, isExpanded]);

  // Show indicator on connection state changes
  useEffect(() => {
    setShowIndicator(true);
    
    // Clear auto-hide timer on state change
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
  }, [state.isConnecting, state.reconnectAttempts]);

  // Connection status color and icon
  const getStatusIndicator = () => {
    if (state.isConnecting) {
      return {
        color: 'yellow',
        icon: '🔄',
        text: 'Connecting...',
        pulse: true
      };
    }
    
    if (isConnected) {
      const latency = getLatency();
      if (latency > 500) {
        return {
          color: 'orange',
          icon: '⚠️',
          text: 'Slow Connection',
          pulse: false
        };
      }
      return {
        color: 'green',
        icon: '✓',
        text: 'Connected',
        pulse: false
      };
    }
    
    return {
      color: 'red',
      icon: '✕',
      text: 'Disconnected',
      pulse: false
    };
  };

  const status = getStatusIndicator();

  // Handle reconnection
  const handleReconnect = useCallback(async () => {
    try {
      await connect();
      addEvent('success', 'Reconnected successfully');
    } catch (error) {
      addEvent('error', 'Failed to reconnect');
    }
  }, [connect]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
    addEvent('info', 'Disconnected from server');
  }, [disconnect]);

  // Add event to recent events
  const addEvent = (type: string, message: string) => {
    const event = {
      id: `event_${Date.now()}`,
      type,
      message,
      timestamp: new Date()
    };
    
    setRecentEvents(prev => [event, ...prev].slice(0, 5));
    
    if (type === 'error' || type === 'warning') {
      setNotificationCount(prev => prev + 1);
    }
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setShowIndicator(true);
    
    if (!isExpanded) {
      setNotificationCount(0); // Clear notifications when viewed
    }
  };

  // Format latency display
  const formatLatency = (latency: number): string => {
    if (latency < 100) return `${latency}ms`;
    if (latency < 1000) return `${latency}ms ⚡`;
    return `${(latency / 1000).toFixed(1)}s ⚠️`;
  };

  // Format time difference
  const formatTimeDiff = (date?: Date): string => {
    if (!date) return 'Never';
    
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  if (!showIndicator && !isExpanded) {
    // Minimized state - just show a small dot
    return (
      <div 
        className={`realtime-indicator-minimized ${position}`}
        onClick={() => setShowIndicator(true)}
      >
        <div className={`status-dot status-${status.color}`} />
        {notificationCount > 0 && (
          <div className="notification-badge">{notificationCount}</div>
        )}
      </div>
    );
  }

  if (compact && !isExpanded) {
    // Compact view
    return (
      <div className={`realtime-indicator-compact ${position}`}>
        <div 
          className={`status-compact status-${status.color}`}
          onClick={toggleExpanded}
        >
          <span className={`status-icon ${status.pulse ? 'pulse' : ''}`}>
            {status.icon}
          </span>
          <span className="status-text">{status.text}</span>
          {isConnected && showDetails && (
            <span className="latency">{formatLatency(state.latency)}</span>
          )}
          {notificationCount > 0 && (
            <span className="notification-count">{notificationCount}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`realtime-indicator ${position} ${isExpanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="indicator-header" onClick={toggleExpanded}>
        <div className={`status-badge status-${status.color}`}>
          <span className={`status-icon ${status.pulse ? 'pulse' : ''}`}>
            {status.icon}
          </span>
        </div>
        <div className="status-info">
          <div className="status-title">{status.text}</div>
          {showDetails && (
            <div className="status-details">
              {isConnected ? (
                <span>Latency: {formatLatency(state.latency)}</span>
              ) : (
                <span>Last connected: {formatTimeDiff(state.lastConnected)}</span>
              )}
            </div>
          )}
        </div>
        <button className="expand-button">
          {isExpanded ? '▼' : '▲'}
        </button>
        {notificationCount > 0 && !isExpanded && (
          <div className="notification-badge">{notificationCount}</div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="indicator-content">
          {/* Connection Details */}
          <div className="connection-details">
            <h4>Connection Details</h4>
            <div className="detail-row">
              <span>Status:</span>
              <span className={`status-value status-${status.color}`}>
                {status.text}
              </span>
            </div>
            {isConnected && (
              <>
                <div className="detail-row">
                  <span>Latency:</span>
                  <span>{formatLatency(state.latency)}</span>
                </div>
                <div className="detail-row">
                  <span>Connected:</span>
                  <span>{formatTimeDiff(state.lastConnected)}</span>
                </div>
              </>
            )}
            {!isConnected && state.lastDisconnected && (
              <div className="detail-row">
                <span>Disconnected:</span>
                <span>{formatTimeDiff(state.lastDisconnected)}</span>
              </div>
            )}
            {state.reconnectAttempts > 0 && (
              <div className="detail-row">
                <span>Reconnect Attempts:</span>
                <span>{state.reconnectAttempts}</span>
              </div>
            )}
          </div>

          {/* Recent Events */}
          {recentEvents.length > 0 && (
            <div className="recent-events">
              <h4>Recent Events</h4>
              <div className="events-list">
                {recentEvents.map(event => (
                  <div key={event.id} className={`event-item event-${event.type}`}>
                    <span className="event-time">
                      {formatTimeDiff(event.timestamp)}
                    </span>
                    <span className="event-message">{event.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="indicator-actions">
            {!isConnected && !state.isConnecting && (
              <button 
                className="action-button reconnect-button"
                onClick={handleReconnect}
              >
                Reconnect
              </button>
            )}
            {isConnected && (
              <button 
                className="action-button disconnect-button"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
            <button 
              className="action-button close-button"
              onClick={() => setIsExpanded(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeIndicator;