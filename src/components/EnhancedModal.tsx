import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import '../styles/EnhancedModal.css';

interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  variant?: 'default' | 'danger' | 'success' | 'warning';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  preventBodyScroll?: boolean;
}

const EnhancedModal: React.FC<EnhancedModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'medium',
  variant = 'default',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  resizable = false,
  draggable = false,
  className = '',
  headerActions,
  footer,
  preventBodyScroll = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const trapFocus = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', trapFocus);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', trapFocus);
      };
    }
  }, [isOpen]);

  // Body scroll prevention
  useEffect(() => {
    if (preventBodyScroll && isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Backdrop click handling
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdrop && event.target === backdropRef.current) {
      onClose();
    }
  };

  // Drag functionality
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!draggable) return;
    
    setIsDragging(true);
    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      setDragPosition({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    setDragPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  const modalClasses = [
    'enhanced-modal',
    `size-${isMaximized ? 'fullscreen' : size}`,
    `variant-${variant}`,
    isDragging ? 'dragging' : '',
    className
  ].filter(Boolean).join(' ');

  const modalStyle = draggable && !isMaximized ? {
    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
    position: 'fixed' as const,
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto'
  } : {};

  return (
    <div 
      className="modal-backdrop"
      ref={backdropRef}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={modalClasses}
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton || resizable || headerActions) && (
          <div 
            className={`modal-header ${draggable ? 'draggable' : ''}`}
            onMouseDown={handleMouseDown}
          >
            {title && (
              <h2 id="modal-title" className="modal-title">
                {title}
              </h2>
            )}
            
            <div className="modal-header-actions">
              {headerActions}
              
              {resizable && (
                <button
                  className="modal-action-btn"
                  onClick={handleMaximize}
                  aria-label={isMaximized ? 'Restore' : 'Maximize'}
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}
              
              {showCloseButton && (
                <button
                  className="modal-close-btn"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="modal-content">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Confirmation modal variant
export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const footer = (
    <div className="confirmation-actions">
      <button className="btn btn-secondary" onClick={onClose}>
        {cancelText}
      </button>
      <button 
        className={`btn btn-${variant === 'danger' ? 'danger' : 'primary'}`}
        onClick={handleConfirm}
      >
        {confirmText}
      </button>
    </div>
  );

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      variant={variant}
      footer={footer}
    >
      <div className="confirmation-content">
        <p>{message}</p>
      </div>
    </EnhancedModal>
  );
};

export default EnhancedModal;
