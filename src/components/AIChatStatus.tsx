import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Bot, User, Clock, CheckCircle, AlertCircle, Wifi, WifiOff, Signal, SignalHigh, SignalLow } from 'lucide-react';
import { cn } from '../utils/cn';

export interface AIChatStatusProps {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'typing' | 'thinking' | 'responding';
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  lastMessageTime?: Date;
  isTyping?: boolean;
  typingSpeed?: 'slow' | 'normal' | 'fast';
  responseTime?: number;
  errorMessage?: string;
  retryCount?: number;
  maxRetries?: number;
  onRetry?: () => void;
  onReconnect?: () => void;
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  showConnectionQuality?: boolean;
  showResponseTime?: boolean;
  showRetryCount?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  theme?: 'light' | 'dark' | 'auto';
}

export interface ConnectionStatus {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  latency?: number;
  strength?: number;
  isStable: boolean;
  lastCheck: Date;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'idle': return React.createElement(MessageSquare, { className: "w-4 h-4 text-gray-400" });
    case 'connecting': return React.createElement(Wifi, { className: "w-4 h-4 text-yellow-500 animate-pulse" });
    case 'connected': return React.createElement(Wifi, { className: "w-4 h-4 text-green-500" });
    case 'disconnected': return React.createElement(WifiOff, { className: "w-4 h-4 text-red-500" });
    case 'error': return React.createElement(AlertCircle, { className: "w-4 h-4 text-red-500" });
    case 'typing': return React.createElement(Bot, { className: "w-4 h-4 text-blue-500 animate-pulse" });
    case 'thinking': return React.createElement(Bot, { className: "w-4 h-4 text-purple-500 animate-pulse" });
    case 'responding': return React.createElement(Bot, { className: "w-4 h-4 text-blue-500" });
    default: return React.createElement(MessageSquare, { className: "w-4 h-4 text-gray-400" });
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'idle': return 'text-gray-500 bg-gray-100';
    case 'connecting': return 'text-yellow-700 bg-yellow-100';
    case 'connected': return 'text-green-700 bg-green-100';
    case 'disconnected': return 'text-red-700 bg-red-100';
    case 'error': return 'text-red-700 bg-red-100';
    case 'typing': return 'text-blue-700 bg-blue-100';
    case 'thinking': return 'text-purple-700 bg-purple-100';
    case 'responding': return 'text-blue-700 bg-blue-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'idle': return 'Ready to chat';
    case 'connecting': return 'Connecting...';
    case 'connected': return 'Connected';
    case 'disconnected': return 'Disconnected';
    case 'error': return 'Connection error';
    case 'typing': return 'AI is typing...';
    case 'thinking': return 'AI is thinking...';
    case 'responding': return 'AI is responding...';
    default: return 'Unknown status';
  }
};

const getConnectionQualityIcon = (quality: string) => {
  switch (quality) {
    case 'excellent': return React.createElement(SignalHigh, { className: "w-3 h-3 text-green-500" });
    case 'good': return React.createElement(Signal, { className: "w-3 h-3 text-green-500" });
    case 'fair': return React.createElement(Signal, { className: "w-3 h-3 text-yellow-500" });
    case 'poor': return React.createElement(SignalLow, { className: "w-3 h-3 text-red-500" });
    case 'none': return React.createElement(WifiOff, { className: "w-3 h-3 text-red-500" });
    default: return React.createElement(Signal, { className: "w-3 h-3 text-gray-500" });
  }
};

const getConnectionQualityColor = (quality: string): string => {
  switch (quality) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-green-600';
    case 'fair': return 'text-yellow-600';
    case 'poor': return 'text-red-600';
    case 'none': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getSizeClasses = (size: string): string => {
  switch (size) {
    case 'xs': return 'text-xs px-2 py-1';
    case 'sm': return 'text-sm px-3 py-1.5';
    case 'md': return 'text-sm px-4 py-2';
    case 'lg': return 'text-base px-4 py-2.5';
    case 'xl': return 'text-lg px-5 py-3';
    default: return 'text-sm px-4 py-2';
  }
};

const getVariantClasses = (variant: string): string => {
  switch (variant) {
    case 'compact': return 'rounded-md';
    case 'detailed': return 'rounded-lg shadow-sm';
    case 'minimal': return 'rounded-full';
    default: return 'rounded-lg';
  }
};

const getPositionClasses = (position: string): string => {
  switch (position) {
    case 'top-left': return 'top-4 left-4';
    case 'top-right': return 'top-4 right-4';
    case 'bottom-left': return 'bottom-4 left-4';
    case 'bottom-right': return 'bottom-4 right-4';
    case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    default: return 'top-4 right-4';
  }
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatResponseTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const AIChatStatus: React.FC<AIChatStatusProps> = ({
  status,
  connectionQuality = 'good',
  lastMessageTime,
  isTyping = false,
  typingSpeed = 'normal',
  responseTime,
  errorMessage,
  retryCount = 0,
  maxRetries = 3,
  onRetry,
  onReconnect,
  showDetails = false,
  variant = 'default',
  className = '',
  size = 'md',
  animate = true,
  showConnectionQuality = true,
  showResponseTime = true,
  showRetryCount = true,
  position = 'top-right',
  theme = 'auto'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    quality: connectionQuality,
    isStable: true,
    lastCheck: new Date()
  });

  // Auto-hide status after certain conditions
  useEffect(() => {
    if (status === 'idle' && !showDetails) {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [status, showDetails]);

  // Update connection status
  useEffect(() => {
    setConnectionStatus(prev => ({
      ...prev,
      quality: connectionQuality,
      lastCheck: new Date()
    }));
  }, [connectionQuality]);

  const handleRetry = useCallback(() => {
    if (onRetry && retryCount < maxRetries) {
      onRetry();
    }
  }, [onRetry, retryCount, maxRetries]);

  const handleReconnect = useCallback(() => {
    if (onReconnect) {
      onReconnect();
    }
  }, [onReconnect]);

  const getTypingAnimation = () => {
    if (!isTyping || !animate) return '';
    
    switch (typingSpeed) {
      case 'slow': return 'animate-pulse';
      case 'fast': return 'animate-bounce';
      default: return 'animate-pulse';
    }
  };

  if (!isVisible && status === 'idle') return null;

  return React.createElement('div', {
    className: cn(
      'fixed z-50 flex items-center gap-2 transition-all duration-300',
      getPositionClasses(position),
      getVariantClasses(variant),
      getSizeClasses(size),
      getStatusColor(status),
      getTypingAnimation(),
      className
    ),
    style: { zIndex: 1000 }
  }, [
    // Status icon
    React.createElement('div', {
      key: 'status-icon',
      className: 'flex-shrink-0'
    }, getStatusIcon(status)),

    // Status text
    React.createElement('span', {
      key: 'status-text',
      className: 'font-medium'
    }, getStatusText(status)),

    // Connection quality indicator
    showConnectionQuality && connectionQuality !== 'none' && React.createElement('div', {
      key: 'connection-quality',
      className: 'flex items-center gap-1'
    }, [
      getConnectionQualityIcon(connectionQuality),
      React.createElement('span', {
        key: 'quality-text',
        className: cn('text-xs', getConnectionQualityColor(connectionQuality))
      }, connectionQuality)
    ]),

    // Response time
    showResponseTime && responseTime && React.createElement('div', {
      key: 'response-time',
      className: 'flex items-center gap-1 text-xs text-gray-600'
    }, [
      React.createElement(Clock, { key: 'clock-icon', className: "w-3 h-3" }),
      React.createElement('span', { key: 'time-text' }, formatResponseTime(responseTime))
    ]),

    // Last message time
    lastMessageTime && React.createElement('div', {
      key: 'last-message-time',
      className: 'flex items-center gap-1 text-xs text-gray-600'
    }, [
      React.createElement(Clock, { key: 'clock-icon', className: "w-3 h-3" }),
      React.createElement('span', { key: 'time-text' }, formatTime(lastMessageTime))
    ]),

    // Retry count
    showRetryCount && retryCount > 0 && React.createElement('div', {
      key: 'retry-count',
      className: 'flex items-center gap-1 text-xs text-gray-600'
    }, [
      React.createElement(AlertCircle, { key: 'alert-icon', className: "w-3 h-3" }),
      React.createElement('span', { key: 'count-text' }, `${retryCount}/${maxRetries}`)
    ]),

    // Error details toggle
    errorMessage && React.createElement('button', {
      key: 'error-toggle',
      type: 'button',
      className: 'p-1 hover:bg-red-200 rounded transition-colors',
      onClick: () => setShowErrorDetails(!showErrorDetails),
      'aria-label': 'Toggle error details'
    }, React.createElement(AlertCircle, { className: "w-3 h-3 text-red-600" })),

    // Action buttons
    status === 'error' && React.createElement('div', {
      key: 'action-buttons',
      className: 'flex items-center gap-1'
    }, [
      onRetry && retryCount < maxRetries && React.createElement('button', {
        key: 'retry-button',
        type: 'button',
        className: 'px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors',
        onClick: handleRetry
      }, 'Retry'),
      onReconnect && React.createElement('button', {
        key: 'reconnect-button',
        type: 'button',
        className: 'px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors',
        onClick: handleReconnect
      }, 'Reconnect')
    ])
  ]);
};

export default AIChatStatus;