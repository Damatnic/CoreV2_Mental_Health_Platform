import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '../../test-utils/testing-library-exports';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
  color = '#007bff'
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div 
      className={`loading-spinner-container ${fullScreen ? 'fullscreen' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div 
        className={`loading-spinner ${sizeClasses[size]}`}
        style={{ borderTopColor: color }}
        data-testid="spinner"
      />
      {message && (
        <p className="loading-message" aria-label={message}>
          {message}
        </p>
      )}
    </div>
  );
};

describe('LoadingSpinner', () => {
  it('should render spinner', () => {
    render(<LoadingSpinner />);
    expect(screen.getByTestId('spinner')).toBeTruthy();
  });

  it('should render with message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeTruthy();
  });

  it('should apply size classes', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    expect(container.querySelector('.spinner-large')).toBeTruthy();
  });

  it('should apply fullscreen class', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    expect(container.querySelector('.fullscreen')).toBeTruthy();
  });

  it('should apply custom color', () => {
    render(<LoadingSpinner color="#ff0000" />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner.style.borderTopColor).toBe('#ff0000');
  });

  it('should have proper ARIA attributes', () => {
    render(<LoadingSpinner message="Please wait" />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
    
    const message = screen.getByLabelText('Please wait');
    expect(message).toBeTruthy();
  });

  it('should render without message', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText(/./)).toBeNull();
  });

  it('should apply multiple props together', () => {
    const { container } = render(
      <LoadingSpinner 
        size="small"
        message="Loading..."
        fullScreen
        color="#00ff00"
      />
    );
    
    expect(container.querySelector('.spinner-small')).toBeTruthy();
    expect(container.querySelector('.fullscreen')).toBeTruthy();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });
});
