/**
 * Modal Component
 * Flexible modal dialog component with accessibility features
 */

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

// Core interfaces
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  centered?: boolean;
  destroyOnClose?: boolean;
  className?: string;
  overlayClassName?: string;
  bodyStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  footerStyle?: React.CSSProperties;
  zIndex?: number;
  'data-testid'?: string;
}

export interface ConfirmModalProps extends Omit<ModalProps, 'children'> {
  content: string | React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
}

export interface AlertModalProps extends Omit<ModalProps, 'children'> {
  content: string | React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  onOk?: () => void;
  okText?: string;
}

// Utility functions
export const getSizeClasses = (size: string): string => {
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

export const getVariantClasses = (variant: string): string => {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };
  return variants[variant as keyof typeof variants] || variants.default;
};

export const getVariantIcon = (variant: string): string => {
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
    confirm: '❓'
  };
  return icons[variant as keyof typeof icons] || '';
};

export const getVariantColors = (variant: string): {
  iconColor: string;
  titleColor: string;
  confirmButtonColor: string;
} => {
  const colors = {
    success: {
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      confirmButtonColor: 'bg-green-600 hover:bg-green-700 text-white'
    },
    warning: {
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      confirmButtonColor: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    error: {
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      confirmButtonColor: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      confirmButtonColor: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    confirm: {
      iconColor: 'text-gray-600',
      titleColor: 'text-gray-900',
      confirmButtonColor: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };
  return colors[variant as keyof typeof colors] || colors.info;
};

// Hooks
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    open,
    close,
    toggle
  };
};

export const useKeyboardHandler = (
  isOpen: boolean,
  onClose: () => void,
  keyboard: boolean = true
) => {
  useEffect(() => {
    if (!isOpen || !keyboard) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, keyboard]);
};

export const useFocusTrap = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const modal = modalRef.current;
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    // Focus first element when modal opens
    firstElement?.focus();
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);
  
  return modalRef;
};

export const useBodyScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
};

// Main Modal component
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  closable = true,
  maskClosable = true,
  keyboard = true,
  centered = true,
  destroyOnClose = false,
  className = '',
  overlayClassName = '',
  bodyStyle,
  headerStyle,
  footerStyle,
  zIndex = 1000,
  'data-testid': dataTestId
}) => {
  const modalRef = useFocusTrap(isOpen);
  
  useKeyboardHandler(isOpen, onClose, keyboard);
  useBodyScrollLock(isOpen);
  
  const handleMaskClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && maskClosable) {
      onClose();
    }
  }, [onClose, maskClosable]);
  
  if (!isOpen && destroyOnClose) {
    return null;
  }
  
  return React.createElement('div', {
    className: `modal-overlay fixed inset-0 flex items-center justify-center transition-opacity duration-300 ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    } ${overlayClassName}`,
    style: { zIndex },
    onClick: handleMaskClick,
    'data-testid': dataTestId
  }, [
    // Backdrop
    React.createElement('div', {
      key: 'backdrop',
      className: 'absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300'
    }),
    
    // Modal content
    React.createElement('div', {
      key: 'modal',
      ref: modalRef,
      className: `modal-content relative w-full ${getSizeClasses(size)} ${getVariantClasses(variant)} rounded-lg shadow-xl transform transition-all duration-300 ${
        isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
      } ${className}`,
      style: { maxHeight: '90vh' },
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': title ? 'modal-title' : undefined
    }, [
      // Header
      (title || closable) && React.createElement('div', {
        key: 'header',
        className: 'modal-header flex items-center justify-between p-6 border-b',
        style: headerStyle
      }, [
        title && React.createElement('h2', {
          key: 'title',
          id: 'modal-title',
          className: 'text-xl font-semibold text-gray-900'
        }, title),
        
        closable && React.createElement('button', {
          key: 'close',
          onClick: onClose,
          className: 'text-gray-400 hover:text-gray-600 transition-colors p-1',
          'aria-label': 'Close modal'
        }, '×')
      ]),
      
      // Body
      React.createElement('div', {
        key: 'body',
        className: 'modal-body p-6 overflow-y-auto',
        style: bodyStyle
      }, children)
    ])
  ]);
};

// Confirm Modal component
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  content,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
  type = 'confirm',
  ...modalProps
}) => {
  const colors = getVariantColors(type);
  const icon = getVariantIcon(type);
  
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    modalProps.onClose();
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    modalProps.onClose();
  };
  
  return React.createElement(Modal, {
    ...modalProps,
    size: modalProps.size || 'sm',
    variant: type === 'confirm' ? 'default' : type
  }, [
    React.createElement('div', {
      key: 'content',
      className: 'text-center'
    }, [
      icon && React.createElement('div', {
        key: 'icon',
        className: `text-4xl mb-4 ${colors.iconColor}`
      }, icon),
      
      React.createElement('div', {
        key: 'text',
        className: `text-gray-900 mb-6 ${typeof content === 'string' ? 'text-base' : ''}`
      }, content)
    ]),
    
    React.createElement('div', {
      key: 'actions',
      className: 'flex justify-center space-x-4'
    }, [
      React.createElement('button', {
        key: 'cancel',
        onClick: handleCancel,
        className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500'
      }, cancelText),
      
      React.createElement('button', {
        key: 'confirm',
        onClick: handleConfirm,
        disabled: confirmLoading,
        className: `px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${colors.confirmButtonColor}`
      }, confirmLoading ? 'Loading...' : confirmText)
    ])
  ]);
};

// Alert Modal component
export const AlertModal: React.FC<AlertModalProps> = ({
  content,
  type = 'info',
  onOk,
  okText = 'OK',
  ...modalProps
}) => {
  const colors = getVariantColors(type);
  const icon = getVariantIcon(type);
  
  const handleOk = () => {
    if (onOk) {
      onOk();
    }
    modalProps.onClose();
  };
  
  return React.createElement(Modal, {
    ...modalProps,
    size: modalProps.size || 'sm',
    variant: type
  }, [
    React.createElement('div', {
      key: 'content',
      className: 'text-center'
    }, [
      icon && React.createElement('div', {
        key: 'icon',
        className: `text-4xl mb-4 ${colors.iconColor}`
      }, icon),
      
      React.createElement('div', {
        key: 'text',
        className: `text-gray-900 mb-6 ${typeof content === 'string' ? 'text-base' : ''}`
      }, content)
    ]),
    
    React.createElement('div', {
      key: 'actions',
      className: 'flex justify-center'
    }, React.createElement('button', {
      onClick: handleOk,
      className: `px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.confirmButtonColor}`
    }, okText))
  ]);
};

// Static methods for programmatic usage
export const modal = {
  confirm: (props: Omit<ConfirmModalProps, 'isOpen' | 'onClose'>) => {
    // In a real implementation, this would create a modal instance
    console.log('Modal.confirm:', props);
  },
  
  alert: (props: Omit<AlertModalProps, 'isOpen' | 'onClose'>) => {
    // In a real implementation, this would create a modal instance
    console.log('Modal.alert:', props);
  },
  
  info: (props: Omit<AlertModalProps, 'isOpen' | 'onClose' | 'type'>) => {
    modal.alert({ ...props, type: 'info' });
  },
  
  success: (props: Omit<AlertModalProps, 'isOpen' | 'onClose' | 'type'>) => {
    modal.alert({ ...props, type: 'success' });
  },
  
  warning: (props: Omit<AlertModalProps, 'isOpen' | 'onClose' | 'type'>) => {
    modal.alert({ ...props, type: 'warning' });
  },
  
  error: (props: Omit<AlertModalProps, 'isOpen' | 'onClose' | 'type'>) => {
    modal.alert({ ...props, type: 'error' });
  }
};

export default Modal;








