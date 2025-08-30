/**
 * COMPREHENSIVE LOADING STATES & SKELETON SCREENS
 * 
 * A collection of therapeutic loading states and skeleton screens
 * designed to reduce anxiety during wait times and provide clear
 * feedback about system status.
 */

import React from 'react';
import {
  DURATIONS,
  EASINGS,
  createAnimation,
  getPrefersReducedMotion,
  skeletonAnimation
} from '../utils/animations';
import { LoadingDots, BreathingIndicator } from './MicroInteractions';

// ==================== THERAPEUTIC LOADING SPINNER ====================
interface TherapeuticSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
}

export const TherapeuticSpinner: React.FC<TherapeuticSpinnerProps> = ({
  size = 'medium',
  color = '#059ae9',
  message
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();
  
  const sizes = {
    small: 24,
    medium: 40,
    large: 60
  };

  const spinnerSize = sizes[size];

  return (
    <div className="therapeutic-spinner">
      <svg
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 50 50"
        style={{
          animation: prefersReducedMotion
            ? 'none'
            : `spin ${DURATIONS.therapeutic}ms ${EASINGS.linear} infinite`
        }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
          style={{
            opacity: 0.3
          }}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray="31.4 94.2"
          strokeLinecap="round"
          style={{
            transformOrigin: 'center',
            animation: prefersReducedMotion
              ? 'none'
              : `rotate ${DURATIONS.slower * 1.5}ms ${EASINGS.therapeutic} infinite`
          }}
        />
      </svg>
      {message && <p className="spinner-message">{message}</p>}
      <style jsx>{`
        .therapeutic-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .spinner-message {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ==================== BREATHING LOADER ====================
interface BreathingLoaderProps {
  message?: string;
  showInstructions?: boolean;
}

export const BreathingLoader: React.FC<BreathingLoaderProps> = ({
  message = "Take a deep breath while we load...",
  showInstructions = true
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();
  const [phase, setPhase] = React.useState<'inhale' | 'hold' | 'exhale'>('inhale');

  React.useEffect(() => {
    if (prefersReducedMotion) return;

    const phases = ['inhale', 'hold', 'exhale'] as const;
    let currentPhaseIndex = 0;

    const interval = setInterval(() => {
      currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
      setPhase(phases[currentPhaseIndex]);
    }, DURATIONS.breathing / 3);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const getInstruction = () => {
    switch (phase) {
      case 'inhale': return 'Breathe in...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe out...';
    }
  };

  return (
    <div className="breathing-loader">
      <BreathingIndicator
        phase={phase}
        duration={DURATIONS.breathing / 3}
        size={80}
        color="#059ae9"
      />
      {showInstructions && (
        <div className="breathing-instructions">
          <p className="breathing-phase">{getInstruction()}</p>
          <p className="breathing-message">{message}</p>
        </div>
      )}
      <style jsx>{`
        .breathing-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 40px;
        }

        .breathing-instructions {
          text-align: center;
        }

        .breathing-phase {
          font-size: 18px;
          font-weight: 500;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .breathing-message {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

// ==================== PROGRESS LOADER ====================
interface ProgressLoaderProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  progress,
  message,
  showPercentage = true
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();

  return (
    <div className="progress-loader">
      <div className="progress-container">
        <div 
          className="progress-bar"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            transition: prefersReducedMotion
              ? 'none'
              : `width ${DURATIONS.moderate}ms ${EASINGS.easeOut}`
          }}
        />
      </div>
      <div className="progress-info">
        {showPercentage && (
          <span className="progress-percentage">{Math.round(progress)}%</span>
        )}
        {message && <span className="progress-message">{message}</span>}
      </div>
      <style jsx>{`
        .progress-loader {
          width: 100%;
          max-width: 400px;
        }

        .progress-container {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #059ae9 0%, #0077c7 100%);
          border-radius: 4px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          font-size: 14px;
        }

        .progress-percentage {
          font-weight: 600;
          color: #059ae9;
        }

        .progress-message {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

// ==================== CONTENT SKELETON ====================
interface ContentSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export const ContentSkeleton: React.FC<ContentSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
  showImage = false
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();
  const animationStyle = prefersReducedMotion ? {} : skeletonAnimation();

  return (
    <div className="content-skeleton">
      {showAvatar && (
        <div className="skeleton-header">
          <div className="skeleton-avatar" style={animationStyle} />
          <div className="skeleton-header-text">
            <div className="skeleton-title" style={animationStyle} />
            <div className="skeleton-subtitle" style={animationStyle} />
          </div>
        </div>
      )}
      
      {showImage && (
        <div className="skeleton-image" style={animationStyle} />
      )}
      
      <div className="skeleton-content">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton-line"
            style={{
              ...animationStyle,
              width: `${Math.random() * 20 + 80}%`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .content-skeleton {
          padding: 16px;
        }

        .skeleton-header {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .skeleton-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #e5e7eb;
        }

        .skeleton-header-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-title {
          height: 20px;
          width: 150px;
          background: #e5e7eb;
          border-radius: 4px;
        }

        .skeleton-subtitle {
          height: 16px;
          width: 100px;
          background: #e5e7eb;
          border-radius: 4px;
        }

        .skeleton-image {
          width: 100%;
          height: 200px;
          background: #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-line {
          height: 16px;
          background: #e5e7eb;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

// ==================== CARD SKELETON ====================
interface CardSkeletonProps {
  count?: number;
  columns?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 3,
  columns = 1
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();
  const animationStyle = prefersReducedMotion ? {} : skeletonAnimation();

  return (
    <div 
      className="card-skeleton-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px'
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card-skeleton">
          <div className="card-skeleton-header" style={animationStyle} />
          <div className="card-skeleton-body">
            <div className="skeleton-line" style={{ ...animationStyle, width: '100%' }} />
            <div className="skeleton-line" style={{ ...animationStyle, width: '80%' }} />
            <div className="skeleton-line" style={{ ...animationStyle, width: '60%' }} />
          </div>
          <div className="card-skeleton-footer">
            <div className="skeleton-button" style={animationStyle} />
            <div className="skeleton-button" style={animationStyle} />
          </div>
        </div>
      ))}

      <style jsx>{`
        .card-skeleton {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
        }

        .card-skeleton-header {
          height: 120px;
          background: #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .card-skeleton-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .skeleton-line {
          height: 14px;
          background: #e5e7eb;
          border-radius: 4px;
        }

        .card-skeleton-footer {
          display: flex;
          gap: 8px;
        }

        .skeleton-button {
          height: 32px;
          flex: 1;
          background: #e5e7eb;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

// ==================== LIST SKELETON ====================
interface ListSkeletonProps {
  items?: number;
  showIcon?: boolean;
  showActions?: boolean;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  showIcon = true,
  showActions = false
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();
  const animationStyle = prefersReducedMotion ? {} : skeletonAnimation();

  return (
    <div className="list-skeleton">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="list-item-skeleton">
          {showIcon && (
            <div className="skeleton-icon" style={animationStyle} />
          )}
          <div className="skeleton-content">
            <div className="skeleton-primary" style={animationStyle} />
            <div className="skeleton-secondary" style={animationStyle} />
          </div>
          {showActions && (
            <div className="skeleton-action" style={animationStyle} />
          )}
        </div>
      ))}

      <style jsx>{`
        .list-skeleton {
          display: flex;
          flex-direction: column;
        }

        .list-item-skeleton {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .list-item-skeleton:last-child {
          border-bottom: none;
        }

        .skeleton-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #e5e7eb;
        }

        .skeleton-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .skeleton-primary {
          height: 16px;
          width: 60%;
          background: #e5e7eb;
          border-radius: 4px;
        }

        .skeleton-secondary {
          height: 14px;
          width: 40%;
          background: #e5e7eb;
          border-radius: 4px;
        }

        .skeleton-action {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

// ==================== EMPTY STATE ====================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();

  return (
    <div 
      className="empty-state"
      style={{
        animation: prefersReducedMotion
          ? 'none'
          : createAnimation('fadeIn', { duration: DURATIONS.base })
      }}
    >
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <button className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }

        .empty-state-icon {
          margin-bottom: 16px;
          color: #9ca3af;
        }

        .empty-state-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-state-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          max-width: 400px;
        }

        .empty-state-action {
          padding: 10px 20px;
          background: #059ae9;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .empty-state-action:hover {
          background: #0077c7;
        }
      `}</style>
    </div>
  );
};

// ==================== ERROR STATE ====================
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry
}) => {
  return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">{title}</h3>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="error-retry" onClick={onRetry}>
          Try Again
        </button>
      )}

      <style jsx>{`
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          background: #fef2f2;
          border-radius: 12px;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-title {
          font-size: 18px;
          font-weight: 600;
          color: #b91c1c;
          margin: 0 0 8px 0;
        }

        .error-message {
          font-size: 14px;
          color: #dc2626;
          margin: 0 0 24px 0;
          max-width: 400px;
        }

        .error-retry {
          padding: 10px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .error-retry:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  );
};

// Export all loading states
export default {
  TherapeuticSpinner,
  BreathingLoader,
  ProgressLoader,
  ContentSkeleton,
  CardSkeleton,
  ListSkeleton,
  EmptyState,
  ErrorState,
  LoadingDots
};