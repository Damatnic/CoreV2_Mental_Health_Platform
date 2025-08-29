import React from 'react';
import { Loader2, Heart, Brain, Zap } from 'lucide-react';
import '../styles/EnhancedLoadingStates.css';

interface EnhancedLoadingStatesProps {
  type?: 'default' | 'mental-health' | 'therapeutic' | 'mindful';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

const EnhancedLoadingStates: React.FC<EnhancedLoadingStatesProps> = ({
  type = 'default',
  size = 'medium',
  message,
  progress,
  showProgress = false
}) => {
  const getLoadingContent = () => {
    switch (type) {
      case 'mental-health':
        return {
          icon: <Heart size={32} className="pulse-icon" />,
          defaultMessage: 'Taking care of your mental health...',
          colors: ['#ff6b6b', '#ff8e8e', '#ffb3b3']
        };
      
      case 'therapeutic':
        return {
          icon: <Brain size={32} className="thinking-icon" />,
          defaultMessage: 'Processing your thoughts...',
          colors: ['#4ecdc4', '#45b7b8', '#26d0ce']
        };
      
      case 'mindful':
        return {
          icon: <Zap size={32} className="energy-icon" />,
          defaultMessage: 'Finding your center...',
          colors: ['#a8e6cf', '#88d8a3', '#7fcdcd']
        };
      
      default:
        return {
          icon: <Loader2 size={32} className="spin" />,
          defaultMessage: 'Loading...',
          colors: ['#007bff', '#0056b3', '#004085']
        };
    }
  };

  const renderProgressBar = () => {
    if (!showProgress || progress === undefined) return null;
    
    return (
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${Math.min(100, Math.max(0, progress))}%`,
              background: `linear-gradient(90deg, ${getLoadingContent().colors.join(', ')})`
            }}
          />
        </div>
        <span className="progress-text">{Math.round(progress)}%</span>
      </div>
    );
  };

  const renderDots = () => (
    <div className="loading-dots">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );

  const renderWaves = () => (
    <div className="loading-waves">
      <div className="wave" />
      <div className="wave" />
      <div className="wave" />
    </div>
  );

  const renderBreathingCircle = () => (
    <div className="breathing-circle">
      <div className="inner-circle" />
    </div>
  );

  const getAnimationType = () => {
    switch (type) {
      case 'mental-health':
        return renderDots();
      case 'therapeutic':
        return renderWaves();
      case 'mindful':
        return renderBreathingCircle();
      default:
        return null;
    }
  };

  const loadingContent = getLoadingContent();

  return (
    <div className={`enhanced-loading-states ${type} ${size}`}>
      <div className="loading-icon-container">
        {loadingContent.icon}
        {getAnimationType()}
      </div>
      
      <div className="loading-message">
        {message || loadingContent.defaultMessage}
      </div>
      
      {renderProgressBar()}
      
      {type === 'mindful' && (
        <div className="mindful-text">
          <p>Take a deep breath...</p>
        </div>
      )}
      
      {type === 'therapeutic' && (
        <div className="therapeutic-tips">
          <p className="tip">💡 Remember: Progress isn't always linear</p>
        </div>
      )}
      
      {type === 'mental-health' && (
        <div className="wellness-reminder">
          <p>🌱 Every step forward matters</p>
        </div>
      )}
    </div>
  );
};

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'list' | 'avatar' | 'custom';
  width?: string | number;
  height?: string | number;
  count?: number;
  animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animated = true
}) => {
  const getSkeletonClass = () => {
    let className = `skeleton-loader ${variant}`;
    if (animated) className += ' animated';
    return className;
  };

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={getSkeletonClass()}>
            <div className="skeleton-header" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <div className="skeleton-actions" />
          </div>
        );
      
      case 'list':
        return (
          <div className={getSkeletonClass()}>
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        );
      
      case 'avatar':
        return <div className={`${getSkeletonClass()} skeleton-circle`} />;
      
      case 'custom':
        return (
          <div 
            className={getSkeletonClass()}
            style={{ width, height }}
          />
        );
      
      default:
        return <div className={getSkeletonClass()} style={{ width }} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default EnhancedLoadingStates;
