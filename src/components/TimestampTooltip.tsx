import React, { useState, useRef, useEffect, useCallback } from 'react';
import './TimestampTooltip.css';

interface TimestampTooltipProps {
  /** The timestamp to display */
  timestamp: string | Date;
  /** Format for the timestamp display */
  format?: 'relative' | 'absolute' | 'both';
  /** Whether to show on touch devices */
  showOnTouch?: boolean;
  /** Custom tooltip content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Whether to show instantly on mobile */
  instantOnMobile?: boolean;
  /** Custom date format for absolute timestamps */
  dateFormat?: Intl.DateTimeFormatOptions;
  /** Whether to use relative time updates */
  liveUpdate?: boolean;
  /** Update interval in milliseconds */
  updateInterval?: number;
  /** Maximum characters before truncation */
  maxLength?: number;
  /** Custom relative time labels */
  relativeLabels?: {
    now: string;
    seconds: string;
    minute: string;
    minutes: string;
    hour: string;
    hours: string;
    day: string;
    days: string;
    week: string;
    weeks: string;
    month: string;
    months: string;
    year: string;
    years: string;
  };
}

const DEFAULT_RELATIVE_LABELS = {
  now: 'just now',
  seconds: 'seconds ago',
  minute: 'a minute ago',
  minutes: 'minutes ago',
  hour: 'an hour ago',
  hours: 'hours ago',
  day: 'a day ago',
  days: 'days ago',
  week: 'a week ago',
  weeks: 'weeks ago',
  month: 'a month ago',
  months: 'months ago',
  year: 'a year ago',
  years: 'years ago'
};

const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

export const TimestampTooltip: React.FC<TimestampTooltipProps> = ({
  timestamp,
  format = 'relative',
  showOnTouch = true,
  children,
  className = '',
  position = 'auto',
  instantOnMobile = true,
  dateFormat = DEFAULT_DATE_FORMAT,
  liveUpdate = true,
  updateInterval = 60000, // 1 minute
  maxLength,
  relativeLabels = DEFAULT_RELATIVE_LABELS
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const [relativeTime, setRelativeTime] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Convert timestamp to Date object
   */
  const getDate = useCallback((): Date => {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return new Date(timestamp);
  }, [timestamp]);

  /**
   * Format relative time
   */
  const formatRelativeTime = useCallback((date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) {
      return relativeLabels.now;
    } else if (diffInSeconds < 60) {
      return `${diffInSeconds} ${relativeLabels.seconds}`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return minutes === 1 ? relativeLabels.minute : `${minutes} ${relativeLabels.minutes}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return hours === 1 ? relativeLabels.hour : `${hours} ${relativeLabels.hours}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return days === 1 ? relativeLabels.day : `${days} ${relativeLabels.days}`;
    } else if (diffInSeconds < 2629746) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return weeks === 1 ? relativeLabels.week : `${weeks} ${relativeLabels.weeks}`;
    } else if (diffInSeconds < 31556952) {
      const months = Math.floor(diffInSeconds / 2629746);
      return months === 1 ? relativeLabels.month : `${months} ${relativeLabels.months}`;
    } else {
      const years = Math.floor(diffInSeconds / 31556952);
      return years === 1 ? relativeLabels.year : `${years} ${relativeLabels.years}`;
    }
  }, [relativeLabels]);

  /**
   * Format absolute time
   */
  const formatAbsoluteTime = useCallback((date: Date): string => {
    return date.toLocaleDateString(undefined, dateFormat);
  }, [dateFormat]);

  /**
   * Get tooltip content
   */
  const getTooltipContent = useCallback((): string => {
    const date = getDate();
    const relative = formatRelativeTime(date);
    const absolute = formatAbsoluteTime(date);

    switch (format) {
      case 'relative':
        return relative;
      case 'absolute':
        return absolute;
      case 'both':
        return `${relative} (${absolute})`;
      default:
        return relative;
    }
  }, [getDate, formatRelativeTime, formatAbsoluteTime, format]);

  /**
   * Update relative time display
   */
  const updateRelativeTime = useCallback(() => {
    if (liveUpdate) {
      setRelativeTime(getTooltipContent());

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(updateRelativeTime, updateInterval);
    }
  }, [liveUpdate, getTooltipContent, updateInterval]);

  /**
   * Calculate optimal tooltip position
   */
  const calculatePosition = useCallback((): 'top' | 'bottom' | 'left' | 'right' => {
    if (!triggerRef.current || position !== 'auto') {
      return position as 'top' | 'bottom' | 'left' | 'right';
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if there's enough space above
    if (rect.top > 100 && rect.top < viewportHeight / 2) {
      return 'top';
    }

    // Check if there's enough space below
    if (rect.bottom < viewportHeight - 100) {
      return 'bottom';
    }

    // Check horizontal positions for narrow screens
    if (viewportWidth < 768) {
      return rect.left < viewportWidth / 2 ? 'right' : 'left';
    }

    return 'top';
  }, [position]);

  /**
   * Show tooltip
   */
  const showTooltip = useCallback(() => {
    setTooltipPosition(calculatePosition());
    setIsVisible(true);

    // Announce to screen readers
    const content = getTooltipContent();
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Timestamp: ${content}`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, [calculatePosition, getTooltipContent]);

  /**
   * Hide tooltip
   */
  const hideTooltip = useCallback(() => {
    setIsVisible(false);

    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle mouse enter
   */
  const handleMouseEnter = useCallback(() => {
    if (!('ontouchstart' in window)) {
      showTooltip();
    }
  }, [showTooltip]);

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    if (!('ontouchstart' in window)) {
      hideTooltip();
    }
  }, [hideTooltip]);

  /**
   * Handle touch start (mobile)
   */
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!showOnTouch) return;

    event.preventDefault();

    if (instantOnMobile) {
      showTooltip();

      // Auto-hide after 3 seconds on mobile
      touchTimeoutRef.current = setTimeout(hideTooltip, 3000);
    } else {
      // Long press detection
      touchTimeoutRef.current = setTimeout(() => {
        showTooltip();

        // Auto-hide after 3 seconds
        setTimeout(hideTooltip, 3000);
      }, 500);
    }
  }, [showOnTouch, instantOnMobile, showTooltip, hideTooltip]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(() => {
    if (!instantOnMobile && touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  }, [instantOnMobile]);

  /**
   * Handle keyboard activation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    } else if (event.key === 'Escape' && isVisible) {
      hideTooltip();
    }
  }, [isVisible, showTooltip, hideTooltip]);

  /**
   * Handle focus
   */
  const handleFocus = useCallback(() => {
    showTooltip();
  }, [showTooltip]);

  /**
   * Handle blur
   */
  const handleBlur = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  /**
   * Initialize relative time and set up updates
   */
  useEffect(() => {
    updateRelativeTime();

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [updateRelativeTime]);

  /**
   * Handle click outside to close tooltip on mobile
   */
  useEffect(() => {
    if (!isVisible) return;

    const handleOutsideInteraction = (event: Event) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        tooltipRef.current &&
        !triggerRef.current.contains(target) &&
        !tooltipRef.current.contains(target)
      ) {
        hideTooltip();
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [isVisible, hideTooltip]);

  const displayText = relativeTime || getTooltipContent();
  const truncatedText = maxLength && displayText.length > maxLength
    ? `${displayText.substring(0, maxLength)}...`
    : displayText;

  const triggerClasses = [
    'timestamp-tooltip-trigger',
    className,
    isVisible && 'timestamp-tooltip-trigger--active'
  ].filter(Boolean).join(' ');

  const tooltipClasses = [
    'timestamp-tooltip',
    `timestamp-tooltip--${tooltipPosition}`,
    isVisible && 'timestamp-tooltip--visible'
  ].filter(Boolean).join(' ');

  return (
    <span className="timestamp-tooltip-container">
      <button
        ref={triggerRef}
        className={triggerClasses}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        type="button"
        aria-label={`Timestamp: ${getTooltipContent()}`}
        aria-describedby={isVisible ? 'timestamp-tooltip' : undefined}
        aria-expanded={isVisible}
      >
        {children || truncatedText}
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          id="timestamp-tooltip"
          className={tooltipClasses}
          role="tooltip"
          aria-live="polite"
        >
          <div className="timestamp-tooltip__content">
            {getTooltipContent()}
          </div>
          <div className="timestamp-tooltip__arrow" />
        </div>
      )}
    </span>
  );
};

export default TimestampTooltip;