/**
 * Accessibility Button Component
 * Floating button providing quick access to accessibility features
 */

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Eye, Volume2, Type, Keyboard, HelpCircle, X } from 'lucide-react';
import '../styles/AccessibilityButton.css';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  description: string;
}

interface AccessibilityButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onOpenSettings?: () => void;
}

const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({
  position = 'bottom-right',
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'font-size',
      label: 'Increase Text',
      icon: <Type size={20} />,
      action: () => toggleFontSize(),
      description: 'Adjust text size'
    },
    {
      id: 'contrast',
      label: 'High Contrast',
      icon: <Eye size={20} />,
      action: () => toggleHighContrast(),
      description: 'Toggle high contrast mode'
    },
    {
      id: 'screen-reader',
      label: 'Screen Reader',
      icon: <Volume2 size={20} />,
      action: () => toggleScreenReader(),
      description: 'Optimize for screen readers'
    },
    {
      id: 'keyboard-nav',
      label: 'Keyboard Nav',
      icon: <Keyboard size={20} />,
      action: () => showKeyboardShortcuts(),
      description: 'Show keyboard shortcuts'
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpCircle size={20} />,
      action: () => showAccessibilityHelp(),
      description: 'Accessibility help'
    },
    {
      id: 'settings',
      label: 'All Settings',
      icon: <Settings size={20} />,
      action: () => openFullSettings(),
      description: 'Open accessibility settings'
    }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Toggle font size
  const toggleFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    setFontSize(nextSize);
    
    const root = document.documentElement;
    const fontSizeMap = {
      'normal': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[nextSize]);
    
    announceChange(`Font size set to ${nextSize}`);
  };

  // Toggle high contrast
  const toggleHighContrast = () => {
    const newState = !highContrast;
    setHighContrast(newState);
    document.documentElement.setAttribute('data-contrast', newState ? 'high' : 'normal');
    announceChange(`High contrast ${newState ? 'enabled' : 'disabled'}`);
  };

  // Toggle screen reader mode
  const toggleScreenReader = () => {
    const newState = !screenReaderMode;
    setScreenReaderMode(newState);
    document.documentElement.setAttribute('data-screen-reader', String(newState));
    announceChange(`Screen reader mode ${newState ? 'enabled' : 'disabled'}`);
  };

  // Show keyboard shortcuts
  const showKeyboardShortcuts = () => {
    // Would typically open a modal with shortcuts
    console.log('Showing keyboard shortcuts');
    announceChange('Keyboard shortcuts dialog opened');
  };

  // Show accessibility help
  const showAccessibilityHelp = () => {
    // Would typically open help documentation
    console.log('Showing accessibility help');
    announceChange('Accessibility help opened');
  };

  // Open full settings
  const openFullSettings = () => {
    setIsOpen(false);
    onOpenSettings?.();
    announceChange('Opening accessibility settings');
  };

  // Announce changes for screen readers
  const announceChange = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <div 
      className={`accessibility-button-container ${position}`}
      ref={menuRef}
    >
      {isOpen && (
        <div className="accessibility-menu">
          <div className="menu-header">
            <h3>Quick Access</h3>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility menu"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="quick-actions">
            {quickActions.map(action => (
              <button
                key={action.id}
                className={`quick-action ${
                  (action.id === 'contrast' && highContrast) ||
                  (action.id === 'screen-reader' && screenReaderMode)
                    ? 'active'
                    : ''
                }`}
                onClick={action.action}
                aria-label={action.label}
                title={action.description}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          <div className="menu-footer">
            <small>Press Alt+Shift+A to toggle this menu</small>
          </div>
        </div>
      )}

      <button
        className={`accessibility-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle accessibility menu"
        aria-expanded={isOpen}
      >
        <Settings size={24} />
        <span className="sr-only">Accessibility Options</span>
      </button>
    </div>
  );
};

export default AccessibilityButton;
