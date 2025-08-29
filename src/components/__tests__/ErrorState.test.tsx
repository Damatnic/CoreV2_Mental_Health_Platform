import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '../../test-utils/testing-library-exports';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  icon?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  showRetry = true,
  icon
}) => {
  return (
    <div className="error-state" role="alert">
      {icon && <div className="error-icon">{icon}</div>}
      <h2>{title}</h2>
      <p>{message}</p>
      {showRetry && onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
    </div>
  );
};

describe('ErrorState', () => {
  it('should render default error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/An unexpected error occurred/)).toBeTruthy();
  });

  it('should render custom title and message', () => {
    render(
      <ErrorState 
        title="Network Error"
        message="Failed to connect to server"
      />
    );
    expect(screen.getByText('Network Error')).toBeTruthy();
    expect(screen.getByText('Failed to connect to server')).toBeTruthy();
  });

  it('should show retry button when onRetry is provided', () => {
    const handleRetry = jest.fn();
    render(<ErrorState onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeTruthy();
    
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalled();
  });

  it('should hide retry button when showRetry is false', () => {
    const handleRetry = jest.fn();
    render(<ErrorState onRetry={handleRetry} showRetry={false} />);
    
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('should render custom icon', () => {
    const CustomIcon = () => <span>⚠️</span>;
    render(<ErrorState icon={<CustomIcon />} />);
    
    expect(screen.getByText('⚠️')).toBeTruthy();
  });

  it('should have proper ARIA attributes', () => {
    render(<ErrorState />);
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toBeTruthy();
  });

  it('should not show retry button without onRetry handler', () => {
    render(<ErrorState showRetry={true} />);
    
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('should handle multiple retry clicks', () => {
    const handleRetry = jest.fn();
    render(<ErrorState onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    
    expect(handleRetry).toHaveBeenCalledTimes(3);
  });
});
