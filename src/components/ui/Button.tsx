import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

// Base button variants
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'ghost' 
  | 'destructive' 
  | 'outline' 
  | 'link'
  | 'success'
  | 'warning'
  | 'info';

// Button sizes
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Button states for mental health contexts
export type ButtonState = 'default' | 'loading' | 'disabled' | 'success' | 'error';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: LucideIcon | React.ReactNode;
  rightIcon?: LucideIcon | React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  gradient?: boolean;
  // Mental health specific props
  emergency?: boolean;
  supportive?: boolean;
  calming?: boolean;
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Variant styles mapping
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm border-transparent',
  secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 border-gray-300',
  ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 border-transparent',
  destructive: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm border-transparent',
  outline: 'bg-transparent hover:bg-gray-50 active:bg-gray-100 text-gray-900 border-gray-300 border',
  link: 'bg-transparent hover:underline text-blue-600 p-0 h-auto font-medium border-transparent',
  success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm border-transparent',
  warning: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white shadow-sm border-transparent',
  info: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-sm border-transparent'
};

// Size styles mapping
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs font-medium min-h-[28px]',
  sm: 'px-3 py-2 text-sm font-medium min-h-[32px]',
  md: 'px-4 py-2.5 text-sm font-medium min-h-[40px]',
  lg: 'px-6 py-3 text-base font-medium min-h-[48px]',
  xl: 'px-8 py-4 text-lg font-medium min-h-[56px]'
};

// Icon sizes for different button sizes
const iconSizes: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6'
};

// Rounded styles
const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full'
};

// Elevation styles
const elevationStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
};

// Mental health context styles
const mentalHealthStyles = {
  emergency: 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg ring-2 ring-red-300',
  supportive: 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300',
  calming: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  state = 'default',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  iconOnly = false,
  fullWidth = false,
  rounded = 'md',
  elevation = 'none',
  pulse = false,
  gradient = false,
  emergency = false,
  supportive = false,
  calming = false,
  disabled,
  className,
  children,
  ...props
}, ref) => {
  // Determine final disabled state
  const isDisabled = disabled || isLoading || state === 'disabled';
  
  // Determine loading state
  const showLoading = isLoading || state === 'loading';
  
  // Get icon size for current button size
  const iconSizeClass = iconSizes[size];
  
  // Build className
  const buttonClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    
    // Variant styles
    !emergency && !supportive && !calming && variantStyles[variant],
    
    // Size styles (only if not iconOnly)
    !iconOnly && sizeStyles[size],
    
    // Icon only styles
    iconOnly && 'p-2',
    iconOnly && size === 'xs' && 'p-1.5',
    iconOnly && size === 'sm' && 'p-2',
    iconOnly && size === 'md' && 'p-2.5',
    iconOnly && size === 'lg' && 'p-3',
    iconOnly && size === 'xl' && 'p-4',
    
    // Full width
    fullWidth && 'w-full',
    
    // Rounded styles
    roundedStyles[rounded],
    
    // Elevation
    elevationStyles[elevation],
    
    // Pulse animation
    pulse && 'animate-pulse',
    
    // Gradient variants
    gradient && variant === 'primary' && 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
    gradient && variant === 'success' && 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    gradient && variant === 'destructive' && 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700',
    
    // Mental health context styles
    emergency && mentalHealthStyles.emergency,
    supportive && mentalHealthStyles.supportive,
    calming && mentalHealthStyles.calming,
    
    // State-specific styles
    state === 'success' && 'bg-green-600 text-white',
    state === 'error' && 'bg-red-600 text-white',
    
    // Custom className
    className
  );
  
  // Render icon
  const renderIcon = (Icon: LucideIcon | React.ReactNode, position: 'left' | 'right') => {
    if (!Icon) return null;
    
    const marginClass = position === 'left' ? 'mr-2' : 'ml-2';
    const iconClasses = cn(iconSizeClass, !iconOnly && marginClass);
    
    if (React.isValidElement(Icon)) {
      return React.cloneElement(Icon as React.ReactElement, { 
        className: cn(iconClasses, (Icon as React.ReactElement).props?.className) 
      });
    }
    
    if (typeof Icon === 'function') {
      const IconComponent = Icon as LucideIcon;
      return <IconComponent className={iconClasses} />;
    }
    
    return Icon;
  };
  
  // Loading spinner component
  const LoadingSpinner = ({ size }: { size: ButtonSize }) => (
    <svg 
      className={cn(iconSizes[size], 'animate-spin')} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={showLoading}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {showLoading && !rightIcon ? (
        <LoadingSpinner size={size} />
      ) : (
        renderIcon(leftIcon, 'left')
      )}
      
      {/* Button content */}
      {!iconOnly && (
        <span className={cn(showLoading && 'opacity-75')}>
          {showLoading && loadingText ? loadingText : children}
        </span>
      )}
      
      {/* Right icon or loading spinner */}
      {showLoading && rightIcon ? (
        <LoadingSpinner size={size} />
      ) : (
        renderIcon(rightIcon, 'right')
      )}
      
      {/* Loading overlay for better UX */}
      {showLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-current opacity-10 rounded-inherit" />
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Specialized button variants for mental health contexts

export const EmergencyButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'emergency'>>(
  (props, ref) => (
    <Button
      {...props}
      ref={ref}
      emergency
      variant="destructive"
      pulse
      className={cn('ring-red-300 ring-2', props.className)}
    />
  )
);

export const SupportButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'supportive'>>(
  (props, ref) => (
    <Button
      {...props}
      ref={ref}
      supportive
      variant="secondary"
      className={cn('border-green-300', props.className)}
    />
  )
);

export const CalmingButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'calming'>>(
  (props, ref) => (
    <Button
      {...props}
      ref={ref}
      calming
      variant="ghost"
      className={cn('hover:bg-blue-50', props.className)}
    />
  )
);

// Accessibility-focused button with enhanced ARIA support
export const AccessibleButton = forwardRef<HTMLButtonElement, ButtonProps & {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
}>(({
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  ...props
}, ref) => (
  <Button
    {...props}
    ref={ref}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    aria-expanded={ariaExpanded}
    aria-controls={ariaControls}
    className={cn(
      'focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      'focus:outline-none',
      props.className
    )}
  />
));

// Button group component for related actions
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
  className?: string;
}> = ({ 
  children, 
  orientation = 'horizontal', 
  attached = false,
  className 
}) => {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        attached && orientation === 'horizontal' && '[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:last-child)]:border-r-0',
        attached && orientation === 'vertical' && '[&>button]:rounded-none [&>button:first-child]:rounded-t-md [&>button:last-child]:rounded-b-md [&>button:not(:last-child)]:border-b-0',
        !attached && orientation === 'horizontal' && 'space-x-2',
        !attached && orientation === 'vertical' && 'space-y-2',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

// Crisis action button with additional safety features
export const CrisisActionButton = forwardRef<HTMLButtonElement, ButtonProps & {
  confirmationRequired?: boolean;
  confirmationText?: string;
  onConfirm?: () => void;
}>(({
  confirmationRequired = false,
  confirmationText = 'Are you sure?',
  onConfirm,
  onClick,
  ...props
}, ref) => {
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (confirmationRequired && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    if (showConfirmation && onConfirm) {
      onConfirm();
      setShowConfirmation(false);
    } else if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      {...props}
      ref={ref}
      emergency
      onClick={handleClick}
      className={cn(
        showConfirmation && 'animate-pulse ring-red-400 ring-4',
        props.className
      )}
    >
      {showConfirmation ? confirmationText : props.children}
    </Button>
  );
});

export default Button;
