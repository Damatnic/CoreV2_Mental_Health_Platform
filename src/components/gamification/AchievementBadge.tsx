/**
 * Achievement Badge Component
 * 
 * A reusable component for displaying achievement badges with various states,
 * sizes, and interaction options. Designed with mental health-appropriate
 * aesthetics and encouraging visual feedback.
 */

import React, { useState } from 'react';
import './AchievementBadge.css';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    name: string;
    description?: string;
    icon: string;
    category?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    unlocked?: boolean;
    unlockedAt?: Date | string;
    progress?: number;
    maxProgress?: number;
    points?: number;
    hidden?: boolean;
  };
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  showDetails = false,
  showProgress = false,
  onClick,
  className = '',
  animate = true
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isUnlocked = achievement.unlocked !== false;
  const isHidden = achievement.hidden && !isUnlocked;
  
  // Calculate progress percentage if applicable
  const progressPercentage = achievement.progress && achievement.maxProgress
    ? (achievement.progress / achievement.maxProgress) * 100
    : 0;
  
  // Format unlock date
  const formatUnlockDate = (date: Date | string) => {
    const unlockDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - unlockDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return unlockDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: unlockDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  // Get rarity color class
  const getRarityClass = () => {
    if (!achievement.rarity) return '';
    return `rarity-${achievement.rarity}`;
  };
  
  // Handle badge click
  const handleClick = () => {
    if (onClick && !isHidden) {
      onClick();
    }
  };
  
  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick && !isHidden) {
      e.preventDefault();
      onClick();
    }
  };
  
  // Render badge content
  const renderBadgeContent = () => {
    if (isHidden) {
      return (
        <>
          <div className="badge-icon hidden-icon">?</div>
          <div className="badge-overlay locked">
            <span className="lock-icon">🔒</span>
          </div>
        </>
      );
    }
    
    return (
      <>
        <div className={`badge-icon ${!isUnlocked ? 'locked' : ''}`}>
          {achievement.icon}
        </div>
        {!isUnlocked && (
          <div className="badge-overlay locked">
            <span className="lock-icon">🔒</span>
          </div>
        )}
        {showProgress && achievement.progress !== undefined && achievement.maxProgress && !isUnlocked && (
          <div className="badge-progress">
            <div 
              className="progress-ring"
              role="progressbar"
              aria-valuenow={achievement.progress}
              aria-valuemin={0}
              aria-valuemax={achievement.maxProgress}
            >
              <svg className="progress-svg" viewBox="0 0 36 36">
                <path
                  className="progress-circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="progress-circle"
                  strokeDasharray={`${progressPercentage}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="progress-text">
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
          </div>
        )}
      </>
    );
  };
  
  // Render details section
  const renderDetails = () => {
    if (!showDetails || isHidden) return null;
    
    return (
      <div className="badge-details">
        <div className="badge-name">{isHidden ? '???' : achievement.name}</div>
        {achievement.description && !isHidden && (
          <div className="badge-description">{achievement.description}</div>
        )}
        {achievement.unlockedAt && isUnlocked && (
          <div className="badge-unlock-date">
            Unlocked {formatUnlockDate(achievement.unlockedAt)}
          </div>
        )}
        {achievement.points && !isHidden && (
          <div className="badge-points">+{achievement.points} points</div>
        )}
      </div>
    );
  };
  
  // Render tooltip
  const renderTooltip = () => {
    if (!showTooltip || showDetails || isHidden) return null;
    
    return (
      <div className="badge-tooltip" role="tooltip">
        <div className="tooltip-content">
          <div className="tooltip-name">{achievement.name}</div>
          {achievement.description && (
            <div className="tooltip-description">{achievement.description}</div>
          )}
          {achievement.category && (
            <div className="tooltip-category">{achievement.category}</div>
          )}
          {achievement.unlockedAt && isUnlocked && (
            <div className="tooltip-date">
              {formatUnlockDate(achievement.unlockedAt)}
            </div>
          )}
          {achievement.progress !== undefined && achievement.maxProgress && !isUnlocked && (
            <div className="tooltip-progress">
              Progress: {achievement.progress}/{achievement.maxProgress}
            </div>
          )}
          {achievement.points && (
            <div className="tooltip-points">+{achievement.points} points</div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div
      className={`
        achievement-badge 
        ${size} 
        ${isUnlocked ? 'unlocked' : 'locked'}
        ${isHidden ? 'hidden' : ''}
        ${getRarityClass()}
        ${onClick ? 'clickable' : ''}
        ${animate ? 'animate' : ''}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={onClick && !isHidden ? 0 : -1}
      role={onClick ? 'button' : 'img'}
      aria-label={
        isHidden 
          ? 'Hidden achievement' 
          : `${achievement.name}${isUnlocked ? ' (unlocked)' : ' (locked)'}`
      }
      aria-describedby={achievement.description}
    >
      <div className="badge-container">
        {renderBadgeContent()}
        {isUnlocked && animate && (
          <div className="badge-shine" />
        )}
        {achievement.rarity && isUnlocked && (
          <div className="badge-rarity-indicator" />
        )}
      </div>
      {renderDetails()}
      {renderTooltip()}
    </div>
  );
};

export default AchievementBadge;