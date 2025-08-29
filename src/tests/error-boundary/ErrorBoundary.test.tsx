import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { errorMonitoringService } from '../../services/errorMonitoringService';

// Mock the error monitoring service
jest.mock('../../services/errorMonitoringService');
const mockErrorMonitoringService = errorMonitoringService as jest.Mocked<typeof errorMonitoringService>;

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div>No error</div>;
};

// Component that throws a crisis-related error
const CrisisError: React.FC = () => {
  throw new Error('Crisis detection service unavailable');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(mockErrorMonitoringService.captureError).not.toHaveBeenCalled();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/we apologize for the inconvenience/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should report errors to monitoring service', () => {
    mockErrorMonitoringService.captureError.mockResolvedValue(undefined);

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(mockErrorMonitoringService.captureError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error for error boundary'
      }),
      expect.objectContaining({
        component: 'ErrorBoundary',
        errorInfo: expect.any(Object)
      })
    );
  });

  it('should handle crisis-related errors with special UI', () => {
    render(
      <ErrorBoundary>
        <CrisisError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/crisis services temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/call 988/i)).toBeInTheDocument();
    expect(screen.getByText(/call 911/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contact emergency services/i })).toBeInTheDocument();
  });

  it('should provide fallback contact methods for crisis errors', () => {
    render(
      <ErrorBoundary>
        <CrisisError />
      </ErrorBoundary>
    );

    // Should show 988 Lifeline
    expect(screen.getByText('988')).toBeInTheDocument();
    expect(screen.getByText(/suicide & crisis lifeline/i)).toBeInTheDocument();

    // Should show Crisis Text Line
    expect(screen.getByText('741741')).toBeInTheDocument();
    expect(screen.getByText(/crisis text line/i)).toBeInTheDocument();

    // Should show emergency services
    expect(screen.getByText('911')).toBeInTheDocument();
  });

  it('should include user context in error reports', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      role: 'user'
    };

    render(
      <ErrorBoundary user={mockUser}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(mockErrorMonitoringService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        user: mockUser,
        component: 'ErrorBoundary'
      })
    );
  });

  it('should handle retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /try again/i });
    retryButton.click();

    // Rerender with a component that doesn't throw
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should limit error reporting to prevent spam', async () => {
    // Render multiple error boundaries with the same error
    for (let i = 0; i < 5; i++) {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
    }

    // Should not call capture error more than 3 times (rate limiting)
    expect(mockErrorMonitoringService.captureError).toHaveBeenCalledTimes(3);
  });

  it('should handle errors gracefully when monitoring service fails', () => {
    mockErrorMonitoringService.captureError.mockRejectedValue(new Error('Monitoring service down'));

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Should still show error UI even if monitoring fails
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should include component stack trace in error reports', () => {
    render(
      <ErrorBoundary>
        <div data-testid="wrapper">
          <ThrowError />
        </div>
      </ErrorBoundary>
    );

    expect(mockErrorMonitoringService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        errorInfo: expect.objectContaining({
          componentStack: expect.stringContaining('ThrowError')
        })
      })
    );
  });

  it('should show accessibility-compliant error messages', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should handle offline scenarios', () => {
    // Mock offline status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/you appear to be offline/i)).toBeInTheDocument();
    expect(screen.getByText(/please check your connection/i)).toBeInTheDocument();
  });

  it('should provide different error messages based on error type', () => {
    const networkError = new Error('Network request failed');
    networkError.name = 'NetworkError';

    const NetworkErrorComponent: React.FC = () => {
      throw networkError;
    };

    render(
      <ErrorBoundary>
        <NetworkErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/connection problem/i)).toBeInTheDocument();
    expect(screen.getByText(/please check your internet connection/i)).toBeInTheDocument();
  });

  it('should maintain HIPAA compliance in error reporting', () => {
    const sensitiveError = new Error('Patient data: John Doe SSN 123-45-6789');

    const SensitiveErrorComponent: React.FC = () => {
      throw sensitiveError;
    };

    render(
      <ErrorBoundary>
        <SensitiveErrorComponent />
      </ErrorBoundary>
    );

    expect(mockErrorMonitoringService.captureError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.not.stringMatching(/\d{3}-\d{2}-\d{4}/) // Should not contain SSN
      }),
      expect.any(Object)
    );
  });
});