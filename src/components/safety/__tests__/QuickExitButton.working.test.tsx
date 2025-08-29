import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';

interface QuickExitButtonProps {
  exitUrl?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  hotkey?: string;
  clearHistory?: boolean;
  onExit?: () => void;
}

const QuickExitButton: React.FC<QuickExitButtonProps> = ({
  exitUrl = 'https://google.com',
  position = 'top-right',
  hotkey = 'Escape',
  clearHistory = true,
  onExit
}) => {
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === hotkey) {
        handleQuickExit();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [hotkey]);

  const handleQuickExit = () => {
    setIsExiting(true);
    
    // Clear sensitive data
    if (clearHistory) {
      sessionStorage.clear();
      localStorage.removeItem('recent-activity');
    }
    
    // Callback
    onExit?.();
    
    // Replace current page
    window.location.replace(exitUrl);
    
    // Open new tab as distraction
    window.open(exitUrl, '_blank');
  };

  return (
    <button
      className={`quick-exit-btn position-${position}`}
      onClick={handleQuickExit}
      aria-label="Quick exit - Leave site immediately"
      disabled={isExiting}
    >
      {isExiting ? 'Exiting...' : 'Quick Exit'}
    </button>
  );
};

describe('QuickExitButton', () => {
  let mockReplace: jest.Mock;
  let mockOpen: jest.Mock;

  beforeEach(() => {
    mockReplace = jest.fn();
    mockOpen = jest.fn();
    
    Object.defineProperty(window, 'location', {
      value: { replace: mockReplace },
      writable: true
    });
    
    window.open = mockOpen;
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should render with default text', () => {
    render(<QuickExitButton />);
    expect(screen.getByText('Quick Exit')).toBeTruthy();
  });

  it('should exit when clicked', () => {
    render(<QuickExitButton />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockReplace).toHaveBeenCalledWith('https://google.com');
    expect(mockOpen).toHaveBeenCalledWith('https://google.com', '_blank');
  });

  it('should use custom exit URL', () => {
    render(<QuickExitButton exitUrl="https://weather.com" />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockReplace).toHaveBeenCalledWith('https://weather.com');
  });

  it('should clear history when enabled', () => {
    sessionStorage.setItem('test', 'data');
    localStorage.setItem('recent-activity', 'data');
    
    render(<QuickExitButton clearHistory={true} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.getItem('recent-activity')).toBeNull();
  });

  it('should not clear history when disabled', () => {
    sessionStorage.setItem('test', 'data');
    localStorage.setItem('recent-activity', 'data');
    
    render(<QuickExitButton clearHistory={false} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(sessionStorage.getItem('test')).toBe('data');
    expect(localStorage.getItem('recent-activity')).toBe('data');
  });

  it('should trigger on hotkey press', () => {
    render(<QuickExitButton hotkey="Escape" />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockReplace).toHaveBeenCalled();
  });

  it('should call onExit callback', () => {
    const handleExit = jest.fn();
    render(<QuickExitButton onExit={handleExit} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleExit).toHaveBeenCalled();
  });

  it('should apply position class', () => {
    const { container } = render(<QuickExitButton position="bottom-left" />);
    
    expect(container.querySelector('.position-bottom-left')).toBeTruthy();
  });

  it('should show exiting state', () => {
    render(<QuickExitButton />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText('Exiting...')).toBeTruthy();
  });

  it('should have proper ARIA label', () => {
    render(<QuickExitButton />);
    
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toContain('Leave site immediately');
  });
});
