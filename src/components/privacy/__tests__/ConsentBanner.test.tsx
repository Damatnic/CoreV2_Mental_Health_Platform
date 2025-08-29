import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';

interface ConsentBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onCustomize?: () => void;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({
  onAccept,
  onDecline,
  onCustomize
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleAccept = () => {
    localStorage.setItem('consent-given', 'true');
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem('consent-given', 'false');
    setIsVisible(false);
    onDecline?.();
  };

  const handleCustomize = () => {
    onCustomize?.();
  };

  if (!isVisible) return null;

  return (
    <div className="consent-banner" role="dialog" aria-label="Privacy consent">
      <div className="consent-content">
        <h3>We value your privacy</h3>
        <p>
          We use cookies and similar technologies to enhance your experience 
          and provide personalized mental health support.
        </p>
      </div>
      <div className="consent-actions">
        <button onClick={handleAccept} className="accept-btn">
          Accept All
        </button>
        <button onClick={handleDecline} className="decline-btn">
          Essential Only
        </button>
        <button onClick={handleCustomize} className="customize-btn">
          Customize
        </button>
      </div>
    </div>
  );
};

describe('ConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render consent message', () => {
    render(<ConsentBanner />);
    expect(screen.getByText(/We value your privacy/i)).toBeTruthy();
  });

  it('should have all action buttons', () => {
    render(<ConsentBanner />);
    expect(screen.getByText('Accept All')).toBeTruthy();
    expect(screen.getByText('Essential Only')).toBeTruthy();
    expect(screen.getByText('Customize')).toBeTruthy();
  });

  it('should handle accept action', () => {
    const handleAccept = jest.fn();
    render(<ConsentBanner onAccept={handleAccept} />);
    
    fireEvent.click(screen.getByText('Accept All'));
    
    expect(handleAccept).toHaveBeenCalled();
    expect(localStorage.getItem('consent-given')).toBe('true');
  });

  it('should handle decline action', () => {
    const handleDecline = jest.fn();
    render(<ConsentBanner onDecline={handleDecline} />);
    
    fireEvent.click(screen.getByText('Essential Only'));
    
    expect(handleDecline).toHaveBeenCalled();
    expect(localStorage.getItem('consent-given')).toBe('false');
  });

  it('should handle customize action', () => {
    const handleCustomize = jest.fn();
    render(<ConsentBanner onCustomize={handleCustomize} />);
    
    fireEvent.click(screen.getByText('Customize'));
    
    expect(handleCustomize).toHaveBeenCalled();
  });

  it('should hide after accepting', () => {
    const { container } = render(<ConsentBanner />);
    
    fireEvent.click(screen.getByText('Accept All'));
    
    expect(container.querySelector('.consent-banner')).toBeNull();
  });

  it('should have proper ARIA attributes', () => {
    render(<ConsentBanner />);
    const banner = screen.getByRole('dialog');
    
    expect(banner).toHaveAttribute('aria-label', 'Privacy consent');
  });
});
