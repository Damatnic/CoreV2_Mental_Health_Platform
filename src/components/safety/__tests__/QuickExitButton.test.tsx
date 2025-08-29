import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '../../../test-utils/testing-library-exports';

interface QuickExitProps {
  exitUrl?: string;
  clearData?: boolean;
  hotkey?: string;
}

const QuickExitButton: React.FC<QuickExitProps> = ({
  exitUrl = 'https://weather.com',
  clearData = true,
  hotkey = 'Escape'
}) => {
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === hotkey) {
        handleExit();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [hotkey]);

  const handleExit = () => {
    if (clearData) {
      sessionStorage.clear();
      localStorage.removeItem('session-data');
    }
    window.location.replace(exitUrl);
  };

  return (
    <button className="quick-exit" onClick={handleExit}>
      Quick Exit
    </button>
  );
};

describe('QuickExitButton', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    mockReplace = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { replace: mockReplace },
      writable: true
    });
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should render button', () => {
    render(<QuickExitButton />);
    expect(screen.getByText('Quick Exit')).toBeTruthy();
  });

  it('should exit on click', () => {
    render(<QuickExitButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockReplace).toHaveBeenCalledWith('https://weather.com');
  });

  it('should use custom URL', () => {
    render(<QuickExitButton exitUrl="https://google.com" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockReplace).toHaveBeenCalledWith('https://google.com');
  });

  it('should clear data when enabled', () => {
    sessionStorage.setItem('test', 'data');
    localStorage.setItem('session-data', 'value');
    
    render(<QuickExitButton clearData={true} />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.getItem('session-data')).toBeNull();
  });

  it('should not clear data when disabled', () => {
    sessionStorage.setItem('test', 'data');
    
    render(<QuickExitButton clearData={false} />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(sessionStorage.getItem('test')).toBe('data');
  });

  it('should respond to hotkey', () => {
    render(<QuickExitButton hotkey="Escape" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockReplace).toHaveBeenCalled();
  });

  it('should not respond to other keys', () => {
    render(<QuickExitButton hotkey="Escape" />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
