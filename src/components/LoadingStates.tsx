import React from 'react';
import '../styles/LoadingStates.css';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingStates: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message,
  size = 'medium'
}) => {
  const renderSpinner = () => (
    <div className={`loading-spinner size-${size}`}>
      <div className="spinner-circle"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={`skeleton-loader size-${size}`}>
      <div className="skeleton-header"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
      <div className="skeleton-line"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`pulse-loader size-${size}`}>
      <div className="pulse"></div>
      <div className="pulse delay-1"></div>
      <div className="pulse delay-2"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`dots-loader size-${size}`}>
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  );

  return (
    <div className="loading-state-container">
      {type === 'spinner' && renderSpinner()}
      {type === 'skeleton' && renderSkeleton()}
      {type === 'pulse' && renderPulse()}
      {type === 'dots' && renderDots()}
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        </div>
      ))}
    </>
  );
};

interface ListSkeletonProps {
  rows?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ rows = 5 }) => {
  return (
    <div className="list-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="list-item-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-details">
            <div className="skeleton-name"></div>
            <div className="skeleton-meta"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Additional components that are imported by other files
interface LoadingButtonProps {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  className = ''
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`loading-button ${className} ${loading ? 'loading' : ''}`}
    >
      {loading && <div className="button-spinner"></div>}
      <span className={loading ? 'loading-text' : ''}>{children}</span>
    </button>
  );
};

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  className = ''
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">{Math.round(clampedProgress)}%</span>
      )}
    </div>
  );
};

export default LoadingStates;
