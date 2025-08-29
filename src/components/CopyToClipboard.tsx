import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import '../styles/CopyToClipboard.css';

interface CopyToClipboardProps {
  text: string;
  children?: React.ReactNode;
  onCopy?: (success: boolean) => void;
  variant?: 'button' | 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  successMessage?: string;
  errorMessage?: string;
  timeout?: number;
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  children,
  onCopy,
  variant = 'button',
  size = 'medium',
  className = '',
  successMessage = 'Copied!',
  errorMessage = 'Failed to copy',
  timeout = 2000
}) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCopy = async () => {
    if (!text) {
      setStatus('error');
      onCopy?.(false);
      resetStatus();
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('Copy command failed');
        }
      }
      
      setStatus('success');
      onCopy?.(true);
    } catch (error) {
      console.error('Copy failed:', error);
      setStatus('error');
      onCopy?.(false);
    }

    resetStatus();
  };

  const resetStatus = () => {
    setTimeout(() => setStatus('idle'), timeout);
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <Check size={16} />;
      case 'error':
        return <X size={16} />;
      default:
        return <Copy size={16} />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return successMessage;
      case 'error':
        return errorMessage;
      default:
        return null;
    }
  };

  const buttonClass = [
    'copy-to-clipboard',
    `copy-${variant}`,
    `copy-${size}`,
    `copy-${status}`,
    className
  ].filter(Boolean).join(' ');

  if (variant === 'text') {
    return (
      <span
        className={buttonClass}
        onClick={handleCopy}
        style={{ cursor: 'pointer' }}
        title="Click to copy"
      >
        {children || text}
        {status !== 'idle' && (
          <span className="copy-feedback">
            {getIcon()}
            {getStatusMessage()}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      className={buttonClass}
      onClick={handleCopy}
      type="button"
      aria-label={`Copy ${text.substring(0, 50)}${text.length > 50 ? '...' : ''} to clipboard`}
      disabled={status !== 'idle'}
    >
      <span className="copy-icon">
        {getIcon()}
      </span>
      
      {variant === 'button' && (
        <span className="copy-text">
          {children || (status === 'idle' ? 'Copy' : getStatusMessage())}
        </span>
      )}
      
      {status !== 'idle' && variant === 'icon' && (
        <span className="copy-tooltip">
          {getStatusMessage()}
        </span>
      )}
    </button>
  );
};

// Utility hook for programmatic copying
export const useCopyToClipboard = () => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const copy = async (text: string): Promise<boolean> => {
    if (!text) {
      setStatus('error');
      return false;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
      return true;
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
      return false;
    }
  };

  return { copy, status };
};

export default CopyToClipboard;
