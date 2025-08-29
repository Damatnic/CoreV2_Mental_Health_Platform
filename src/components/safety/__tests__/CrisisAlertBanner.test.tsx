import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

interface CrisisAlertBannerProps {
  message?: string;
  severity?: 'warning' | 'urgent' | 'critical';
  onDismiss?: () => void;
  onGetHelp?: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

const CrisisAlertBanner: React.FC<CrisisAlertBannerProps> = ({
  message = 'If you need immediate help, crisis support is available 24/7',
  severity = 'warning',
  onDismiss,
  onGetHelp,
  autoDismiss = true,
  dismissDelay = 10000
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoDismiss && severity !== 'critical') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, dismissDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay, severity, onDismiss]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleGetHelp = () => {
    onGetHelp?.();
  };

  return (
    <div 
      className={`crisis-alert-banner severity-${severity}`}
      role="alert"
      aria-live="polite"
    >
      <p className="alert-message">{message}</p>
      
      <div className="alert-actions">
        <button 
          className="help-button"
          onClick={handleGetHelp}
          aria-label="Get help now"
        >
          Get Help Now
        </button>
        
        {severity !== 'critical' && (
          <button 
            className="dismiss-button"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

describe('CrisisAlertBanner', () => {
  it('should render with default message', () => {
    render(<CrisisAlertBanner />);
    expect(screen.getByText(/crisis support is available 24\/7/i)).toBeTruthy();
  });

  it('should render with custom message', () => {
    render(<CrisisAlertBanner message="Custom crisis message" />);
    expect(screen.getByText('Custom crisis message')).toBeTruthy();
  });

  it('should apply severity classes', () => {
    const { container } = render(<CrisisAlertBanner severity="critical" />);
    expect(container.querySelector('.severity-critical')).toBeTruthy();
  });

  it('should handle get help click', () => {
    const handleGetHelp = jest.fn();
    render(<CrisisAlertBanner onGetHelp={handleGetHelp} />);
    
    fireEvent.click(screen.getByLabelText('Get help now'));
    expect(handleGetHelp).toHaveBeenCalled();
  });

  it('should handle dismiss click', () => {
    const handleDismiss = jest.fn();
    render(<CrisisAlertBanner onDismiss={handleDismiss} />);
    
    fireEvent.click(screen.getByLabelText('Dismiss alert'));
    expect(handleDismiss).toHaveBeenCalled();
  });

  it('should hide dismiss button for critical severity', () => {
    render(<CrisisAlertBanner severity="critical" />);
    expect(screen.queryByLabelText('Dismiss alert')).toBeNull();
  });

  it('should auto-dismiss after delay', async () => {
    jest.useFakeTimers();
    const handleDismiss = jest.fn();
    
    render(
      <CrisisAlertBanner 
        onDismiss={handleDismiss}
        autoDismiss={true}
        dismissDelay={5000}
      />
    );
    
    expect(screen.getByRole('alert')).toBeTruthy();
    
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });

  it('should not auto-dismiss critical alerts', async () => {
    jest.useFakeTimers();
    const handleDismiss = jest.fn();
    
    render(
      <CrisisAlertBanner 
        severity="critical"
        onDismiss={handleDismiss}
        autoDismiss={true}
        dismissDelay={5000}
      />
    );
    
    jest.advanceTimersByTime(5000);
    
    expect(handleDismiss).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    
    jest.useRealTimers();
  });

  it('should have proper ARIA attributes', () => {
    render(<CrisisAlertBanner />);
    const alert = screen.getByRole('alert');
    
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});
