import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Loader2, Heart, AlertTriangle, Phone, Check, X } from 'lucide-react';

export interface AppButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'crisis' | 'mood' | 'emergency' | 'breathing' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconSize?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  rounded?: boolean;
  animated?: boolean;
  ripple?: boolean;
  pulse?: boolean;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  tooltip?: string;
  // Standard button props
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
  keyboardShortcut?: string;
  ariaKeyshortcuts?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaAtomic?: boolean;
  statusMessage?: string;
  highContrast?: boolean;
  active?: boolean;
  success?: boolean;
  successIcon?: React.ReactNode;
  successMessage?: string;
  error?: boolean;
  errorMessage?: string;
  errorTimeout?: number;
  debounceTime?: number;
  requireConfirmation?: boolean;
  
  // Mental health specific props
  moodLevel?: number; // 1-10 for mood tracking buttons
  breathingPhase?: 'inhale' | 'exhale' | 'hold';
  breathingCount?: number;
  crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
}

const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  iconSize = 'md',
  fullWidth = false,
  rounded = true,
  animated = false,
  ripple = false,
  pulse = false,
  gradient = false,
  gradientFrom,
  gradientTo,
  tooltip,
  tooltipPosition = 'top',
  ariaLabel,
  keyboardShortcut,
  ariaKeyshortcuts,
  ariaLive,
  ariaAtomic,
  statusMessage,
  highContrast = false,
  active = false,
  success = false,
  successIcon,
  successMessage,
  error = false,
  errorMessage,
  errorTimeout = 3000,
  debounceTime = 0,
  requireConfirmation = false,
  moodLevel,
  breathingPhase,
  breathingCount,
  crisisLevel,
  children,
  className = '',
  disabled,
  onClick,
  onFocus,
  onBlur,
  ...rest
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(success);
  const [showError, setShowError] = useState(error);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout>();
  const errorTimeoutRef = useRef<NodeJS.Timeout>();

  // Merge refs
  const mergedRef = (node: HTMLButtonElement | null) => {
    if (buttonRef.current) buttonRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  // Handle success state timeout
  useEffect(() => {
    if (showSuccess) {
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    }
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, [showSuccess]);

  // Handle error state timeout
  useEffect(() => {
    if (showError && errorTimeout > 0) {
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(false);
      }, errorTimeout);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [showError, errorTimeout]);

  // Update external success/error states
  useEffect(() => {
    setShowSuccess(success);
  }, [success]);

  useEffect(() => {
    setShowError(error);
  }, [error]);

  const getBaseClasses = () => {
    return [
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      fullWidth && 'w-full',
      rounded && 'rounded-lg',
      animated && 'hover:scale-105 active:scale-95',
      pulse && 'animate-pulse',
      highContrast && 'border-2 border-black'
    ].filter(Boolean).join(' ');
  };

  const getSizeClasses = () => {
    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl'
    };
    return sizes[size];
  };

  const getVariantClasses = () => {
    if (showSuccess) {
      return 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500';
    }

    if (showError) {
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    }

    if (variant === 'mood' && moodLevel) {
      if (moodLevel <= 3) return 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500';
      if (moodLevel <= 6) return 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500';
      return 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500';
    }

    if (variant === 'crisis') {
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 animate-pulse';
    }

    if (variant === 'emergency') {
      return 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-500 shadow-lg';
    }

    if (variant === 'breathing') {
      const phases = {
        inhale: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
        exhale: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
        hold: 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500'
      };
      return phases[breathingPhase || 'inhale'];
    }

    if (gradient && gradientFrom && gradientTo) {
      return `bg-gradient-to-r from-${gradientFrom} to-${gradientTo} text-white hover:opacity-90 focus:ring-blue-500`;
    }

    const variants = {
      primary: `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 ${active ? 'bg-blue-700' : ''}`,
      secondary: `bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 ${active ? 'bg-gray-200' : ''}`,
      danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 ${active ? 'bg-red-700' : ''}`,
      ghost: `bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 ${active ? 'bg-gray-100' : ''}`,
      outline: `border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 ${active ? 'bg-gray-50' : ''}`,
      success: `bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 ${active ? 'bg-green-700' : ''}`
    };

    return variants[variant as keyof typeof variants] || variants.primary;
  };

  const getIconSizeClasses = () => {
    const sizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    return sizes[iconSize];
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    // Debouncing
    if (debounceTime > 0) {
      const now = Date.now();
      if (now - lastClickTime < debounceTime) return;
      setLastClickTime(now);
    }

    // Confirmation step
    if (requireConfirmation && !confirmationStep) {
      setConfirmationStep(true);
      setTimeout(() => setConfirmationStep(false), 3000);
      return;
    }

    // Ripple effect
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipplePosition({ x, y });
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
    }

    // Reset confirmation step after successful click
    setConfirmationStep(false);

    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPressed(true);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPressed(false);
      handleClick(e as any);
    }
  };

  const renderIcon = (position: 'left' | 'right') => {
    if (iconPosition !== position) return null;

    if (loading && position === 'left') {
      return (
        <Loader2 
          className={`${getIconSizeClasses()} animate-spin ${children ? 'mr-2' : ''}`}
          data-testid="loading-spinner"
        />
      );
    }

    if (showSuccess && successIcon && position === 'left') {
      return (
        <span 
          className={`${getIconSizeClasses()} ${children ? 'mr-2' : ''}`}
          data-testid="success-icon"
        >
          {successIcon}
        </span>
      );
    }

    if (variant === 'crisis' && position === 'left') {
      return (
        <AlertTriangle 
          className={`${getIconSizeClasses()} ${children ? 'mr-2' : ''}`}
        />
      );
    }

    if (variant === 'emergency' && position === 'left') {
      return (
        <Phone 
          className={`${getIconSizeClasses()} ${children ? 'mr-2' : ''}`}
        />
      );
    }

    if (icon) {
      return (
        <span 
          className={`${getIconSizeClasses()} ${
            children ? (position === 'left' ? 'mr-2' : 'ml-2') : ''
          }`}
        >
          {icon}
        </span>
      );
    }

    return null;
  };

  const renderContent = () => {
    if (confirmationStep && requireConfirmation) {
      return 'Confirm';
    }

    if (loading && loadingText) {
      return loadingText;
    }

    if (showSuccess && successMessage) {
      return successMessage;
    }

    if (showError && errorMessage) {
      return errorMessage;
    }

    if (variant === 'breathing' && breathingPhase && breathingCount) {
      return (
        <div className="flex items-center gap-2">
          <span className="capitalize">{breathingPhase}</span>
          <span className="font-bold text-lg">{breathingCount}</span>
        </div>
      );
    }

    return children;
  };

  const buttonClasses = [
    getBaseClasses(),
    getSizeClasses(),
    getVariantClasses(),
    className
  ].join(' ');

  return (
    <div className="relative inline-flex">
      <button
        ref={mergedRef}
        className={buttonClasses}
        disabled={disabled || loading}
        onClick={handleClick}
        onFocus={(e) => {
          setShowTooltip(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setShowTooltip(false);
          onBlur?.(e);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-keyshortcuts={ariaKeyshortcuts}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        title={tooltip}
        {...rest}
      >
        {/* Left Icon */}
        {renderIcon('left')}
        
        {/* Button Content */}
        {!loading && renderContent()}
        
        {/* Right Icon */}
        {renderIcon('right')}

        {/* Keyboard Shortcut Display */}
        {keyboardShortcut && (
          <span className="ml-2 text-xs opacity-60">
            {keyboardShortcut}
          </span>
        )}

        {/* Ripple Effect */}
        {showRipple && (
          <span
            className="absolute inset-0 rounded-lg overflow-hidden"
            data-testid="ripple-effect"
          >
            <span
              className="absolute bg-white opacity-30 rounded-full animate-ping"
              style={{
                left: ripplePosition.x - 10,
                top: ripplePosition.y - 10,
                width: 20,
                height: 20
              }}
            />
          </span>
        )}
      </button>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div 
          className={`
            absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none
            ${tooltipPosition === 'top' ? 'bottom-full mb-2 left-1/2 transform -translate-x-1/2' : ''}
            ${tooltipPosition === 'bottom' ? 'top-full mt-2 left-1/2 transform -translate-x-1/2 bottom-tooltip' : ''}
            ${tooltipPosition === 'left' ? 'right-full mr-2 top-1/2 transform -translate-y-1/2' : ''}
            ${tooltipPosition === 'right' ? 'left-full ml-2 top-1/2 transform -translate-y-1/2' : ''}
          `}
          role="tooltip"
        >
          {tooltip}
          <div className={`
            absolute w-2 h-2 bg-gray-900 transform rotate-45
            ${tooltipPosition === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
            ${tooltipPosition === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
            ${tooltipPosition === 'left' ? 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
            ${tooltipPosition === 'right' ? 'right-full top-1/2 translate-x-1/2 -translate-y-1/2' : ''}
          `} />
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          className="sr-only"
          role="status"
          aria-live={ariaLive}
          aria-atomic={ariaAtomic}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
});

AppButton.displayName = 'AppButton';

export { AppButton };
export default AppButton;
