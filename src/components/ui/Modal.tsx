import * as React from 'react';
import { useEffect, useRef, useState, ReactNode } from 'react';
import { AppButton } from '../AppButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
  centered?: boolean;
  className?: string;
  overlayClassName?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  usePortal?: boolean;
  loading?: boolean;
  animation?: 'fadeIn' | 'scaleIn' | 'slideUp' | 'none';
  type?: 'default' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventScroll = true,
  centered = true,
  className = '',
  overlayClassName = '',
  actions,
  icon,
  header,
  footer,
  ariaLabelledBy,
  ariaDescribedBy,
  usePortal = true,
  loading = false,
  animation = 'scaleIn',
  type = 'default',
  onConfirm,
  onCancel,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape || loading) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose, loading]);

  // Prevent body scroll
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, preventScroll]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'max-w-sm',
      small: 'max-w-md',
      md: 'max-w-md',
      medium: 'max-w-lg',
      lg: 'max-w-lg',
      large: 'max-w-4xl',
      xl: 'max-w-xl',
      full: 'max-w-full h-full m-0'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        header: 'bg-white border-b border-gray-200',
        title: 'text-gray-900',
        icon: 'text-gray-500'
      },
      danger: {
        header: 'bg-red-50 border-b border-red-200',
        title: 'text-red-900',
        icon: 'text-red-600'
      },
      success: {
        header: 'bg-green-50 border-b border-green-200',
        title: 'text-green-900',
        icon: 'text-green-600'
      },
      warning: {
        header: 'bg-yellow-50 border-b border-yellow-200',
        title: 'text-yellow-900',
        icon: 'text-yellow-600'
      },
      info: {
        header: 'bg-blue-50 border-b border-blue-200',
        title: 'text-blue-900',
        icon: 'text-blue-600'
      }
    };
    return variants[variant];
  };

  const getDefaultIcon = () => {
    const iconClass = "w-6 h-6";
    switch (variant) {
      case 'danger':
        return React.createElement('svg', {
          className: iconClass,
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          strokeWidth: 2
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        }));
      case 'success':
        return React.createElement('svg', {
          className: iconClass,
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          strokeWidth: 2
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        }));
      case 'warning':
        return React.createElement('svg', {
          className: iconClass,
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          strokeWidth: 2
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        }));
      case 'info':
        return React.createElement('svg', {
          className: iconClass,
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          strokeWidth: 2
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }));
      default:
        return React.createElement('svg', {
          className: iconClass,
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          strokeWidth: 2
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          d: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }));
    }
  };

  const getAnimationClasses = () => {
    if (animation === 'none') return '';
    
    const animations = {
      fadeIn: 'animate-fadeIn',
      scaleIn: 'animate-scaleIn', 
      slideUp: 'animate-slideUp'
    };
    return animations[animation as keyof typeof animations] || animations.scaleIn;
  };

  if (!isOpen && !isAnimating) return null;

  const styles = getVariantStyles();
  const displayIcon = icon || (variant !== 'default' ? getDefaultIcon() : null);

  // Handle loading state - disable close when loading
  const handleOverlayClickWithLoading = (e: React.MouseEvent) => {
    if (loading) return;
    handleOverlayClick(e);
  };

  const modalContent = (
    <div 
      data-testid="modal-overlay"
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        ${centered ? 'items-center' : 'items-start pt-16'}
        transition-opacity duration-150 ease-out
        ${isOpen ? 'opacity-100' : 'opacity-0'}
        ${overlayClassName}
      `}
      onClick={handleOverlayClickWithLoading}
    >
      {/* Overlay */}
      <div className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity ${animation !== 'none' ? 'animate-fadeIn' : ''}`} />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative bg-white rounded-lg shadow-xl max-h-full overflow-hidden
          transform transition-all duration-150 ease-out
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          ${getSizeClasses()}
          ${getAnimationClasses()}
          ${className}
        `}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || (title ? 'modal-title' : undefined)}
        aria-describedby={ariaDescribedBy}
      >
        {/* Custom Header or Default Header */}
        {header ? (
          <div className={`${styles.header}`}>
            {header}
          </div>
        ) : (title || showCloseButton || displayIcon) && (
          <div className={`flex items-center justify-between p-6 ${styles.header}`}>
            <div className="flex items-center gap-3">
              {displayIcon && (
                <div className={styles.icon}>
                  {displayIcon}
                </div>
              )}
              {title && (
                <h2 
                  id="modal-title" 
                  className={`text-xl font-semibold ${styles.title}`}
                >
                  {title}
                </h2>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={loading ? undefined : onClose}
                disabled={loading}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                {React.createElement('svg', {
                  className: 'w-5 h-5 text-gray-500',
                  fill: 'none',
                  viewBox: '0 0 24 24',
                  stroke: 'currentColor',
                  strokeWidth: 2
                }, React.createElement('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  d: 'M6 18L18 6M6 6l12 12'
                }))}
              </button>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Confirmation Buttons for confirm type */}
        {type === 'confirm' && (onConfirm || onCancel) && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            {onCancel && (
              <AppButton
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </AppButton>
            )}
            {onConfirm && (
              <AppButton
                variant="primary"
                onClick={onConfirm}
                disabled={loading}
              >
                {confirmText}
              </AppButton>
            )}
          </div>
        )}

        {/* Actions */}
        {actions && type !== 'confirm' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            {actions}
          </div>
        )}

        {/* Custom Footer */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Return with or without portal
  if (!usePortal) {
    return modalContent;
  }

  return modalContent;
};

// Confirmation Modal Component
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      size="small"
      actions={
        <>
          <AppButton
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </AppButton>
        </>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
};

// Alert Modal Component
export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      size="small"
      actions={
        <AppButton variant="primary" onClick={onClose}>
          OK
        </AppButton>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
};

// Form Modal Component
export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  canSubmit?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  canSubmit = true
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
      actions={
        <>
          <AppButton
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </AppButton>
          {onSubmit && (
            <AppButton
              variant="primary"
              onClick={onSubmit}
              loading={isLoading}
              disabled={!canSubmit}
            >
              {submitLabel}
            </AppButton>
          )}
        </>
      }
    >
      {children}
    </Modal>
  );
};

// Mental Health Crisis Modal
export interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  crisisLevel: 'low' | 'medium' | 'high' | 'critical';
  onGetHelp: () => void;
  onCallCrisis: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  crisisLevel,
  onGetHelp,
  onCallCrisis
}) => {
  const getCrisisMessage = () => {
    switch (crisisLevel) {
      case 'critical':
        return "We're very concerned about your safety. Please reach out for immediate help.";
      case 'high':
        return "It sounds like you're going through a really difficult time. Support is available.";
      case 'medium':
        return "We've noticed some concerning patterns. Let's connect you with resources.";
      default:
        return "We're here to support you through difficult times.";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crisis Support Available"
      variant="danger"
      size="medium"
      closeOnOverlayClick={false}
      actions={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <AppButton
            variant="danger"
            onClick={onCallCrisis}
            className="flex-1"
            icon={React.createElement('svg', {
              className: 'w-4 h-4',
              fill: 'none',
              viewBox: '0 0 24 24',
              stroke: 'currentColor',
              strokeWidth: 2
            }, React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            }))}
          >
            Call Crisis Line (988)
          </AppButton>
          <AppButton
            variant="primary"
            onClick={onGetHelp}
            className="flex-1"
          >
            Get Help Now
          </AppButton>
          <AppButton
            variant="ghost"
            onClick={onClose}
            className="sm:flex-initial"
          >
            Not Now
          </AppButton>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-700">{getCrisisMessage()}</p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Immediate Resources:</h4>
          <ul className="space-y-1 text-sm text-red-800">
            <li>• <strong>988</strong> - Suicide & Crisis Lifeline</li>
            <li>• <strong>Text HOME to 741741</strong> - Crisis Text Line</li>
            <li>• <strong>911</strong> - Emergency Services</li>
          </ul>
        </div>

        <p className="text-sm text-gray-600 italic">
          Remember: You are not alone, and help is available 24/7.
        </p>
      </div>
    </Modal>
  );
};

// Hook for managing modal state
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
};

export default Modal;
