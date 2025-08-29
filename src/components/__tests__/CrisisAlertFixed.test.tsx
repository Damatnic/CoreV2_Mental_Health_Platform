import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CrisisAlert from '../CrisisAlert';

// Mock dependencies
jest.mock('../../services/crisisService', () => ({
  crisisService: {
    triggerAlert: jest.fn(),
    getCrisisResources: jest.fn(),
    logCrisisEvent: jest.fn(),
    sendEmergencyNotification: jest.fn()
  }
}));

jest.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: jest.fn(() => ({
    location: { lat: 40.7128, lng: -74.0060 },
    error: null,
    loading: false
  }))
}));

jest.mock('../../utils/notifications', () => ({
  showNotification: jest.fn(),
  requestNotificationPermission: jest.fn()
}));

describe('CrisisAlert Component', () => {
  const mockProps = {
    severity: 'warning' as const,
    message: 'Test crisis message',
    onDismiss: jest.fn(),
    onGetHelp: jest.fn(),
    autoDismiss: false,
    dismissDelay: 10000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render crisis alert component', () => {
      render(<CrisisAlert {...mockProps} />);
      
      expect(screen.getByText(/Test crisis message/i)).toBeInTheDocument();
    });

    it('should display correct severity styling', () => {
      const { rerender } = render(<CrisisAlert {...mockProps} severity="warning" />);
      expect(screen.getByRole('alert')).toHaveClass('crisis-alert-warning');
      
      rerender(<CrisisAlert {...mockProps} severity="urgent" />);
      expect(screen.getByRole('alert')).toHaveClass('crisis-alert-urgent');
      
      rerender(<CrisisAlert {...mockProps} severity="critical" />);
      expect(screen.getByRole('alert')).toHaveClass('crisis-alert-critical');
    });

    it('should show default message when no message provided', () => {
      render(<CrisisAlert severity="warning" />);
      expect(screen.getByText(/We're here for you/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onGetHelp when help button is clicked', async () => {
      const user = userEvent.setup();
      const onGetHelp = jest.fn();
      
      render(<CrisisAlert {...mockProps} onGetHelp={onGetHelp} />);
      
      const helpButton = screen.getByText(/Get Help Now/i);
      await user.click(helpButton);
      
      expect(onGetHelp).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = jest.fn();
      
      render(<CrisisAlert {...mockProps} onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByLabelText(/Dismiss/i);
      await user.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should show resources when toggle button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<CrisisAlert {...mockProps} />);
      
      // Resources should not be visible initially
      expect(screen.queryByText(/Crisis Hotline/i)).not.toBeInTheDocument();
      
      // Click to show resources
      const toggleButton = screen.getByText(/Resources/i);
      await user.click(toggleButton);
      
      // Resources should now be visible
      await waitFor(() => {
        expect(screen.getByText(/Crisis Hotline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto Dismiss', () => {
    it('should auto dismiss after delay for non-critical alerts', async () => {
      jest.useFakeTimers();
      const onDismiss = jest.fn();
      
      render(
        <CrisisAlert 
          {...mockProps}
          severity="warning"
          autoDismiss={true}
          dismissDelay={5000}
          onDismiss={onDismiss}
        />
      );
      
      // Alert should be visible
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // onDismiss should have been called
      expect(onDismiss).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should not auto dismiss critical alerts', async () => {
      jest.useFakeTimers();
      const onDismiss = jest.fn();
      
      render(
        <CrisisAlert 
          {...mockProps}
          severity="critical"
          autoDismiss={true}
          dismissDelay={5000}
          onDismiss={onDismiss}
        />
      );
      
      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // onDismiss should NOT have been called for critical
      expect(onDismiss).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Crisis Resources', () => {
    it('should display emergency contacts', async () => {
      const user = userEvent.setup();
      
      render(<CrisisAlert {...mockProps} />);
      
      // Show resources
      const toggleButton = screen.getByText(/Resources/i);
      await user.click(toggleButton);
      
      // Check for crisis resources
      await waitFor(() => {
        expect(screen.getByText(/988/i)).toBeInTheDocument();
        expect(screen.getByText(/Crisis Text Line/i)).toBeInTheDocument();
        expect(screen.getByText(/Emergency/i)).toBeInTheDocument();
      });
    });

    it('should open phone dialer when hotline is clicked', async () => {
      const user = userEvent.setup();
      window.open = jest.fn();
      
      render(<CrisisAlert {...mockProps} />);
      
      // Show resources
      const toggleButton = screen.getByText(/Resources/i);
      await user.click(toggleButton);
      
      // Click phone number
      const phoneLink = screen.getByText(/988/i);
      await user.click(phoneLink);
      
      expect(window.open).toHaveBeenCalledWith('tel:988');
    });

    it('should open SMS when text line is clicked', async () => {
      const user = userEvent.setup();
      window.open = jest.fn();
      
      render(<CrisisAlert {...mockProps} />);
      
      // Show resources
      const toggleButton = screen.getByText(/Resources/i);
      await user.click(toggleButton);
      
      // Click text option
      const textLink = screen.getByText(/741741/i);
      await user.click(textLink);
      
      expect(window.open).toHaveBeenCalledWith('sms:741741');
    });
  });

  describe('Alert States', () => {
    it('should handle different message content', () => {
      const customMessage = 'You seem to be going through a difficult time';
      render(<CrisisAlert {...mockProps} message={customMessage} />);
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should show appropriate icon for severity', () => {
      const { rerender } = render(<CrisisAlert {...mockProps} severity="warning" />);
      expect(screen.getByTestId('alert-icon')).toHaveClass('warning-icon');
      
      rerender(<CrisisAlert {...mockProps} severity="critical" />);
      expect(screen.getByTestId('alert-icon')).toHaveClass('critical-icon');
    });

    it('should show dismissal confirmation for critical severity', async () => {
      const user = userEvent.setup();
      render(<CrisisAlert {...mockProps} severity="critical" />);
      
      await user.click(screen.getByLabelText(/Dismiss/i));
      
      expect(screen.getByText(/Are you sure you want to dismiss/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CrisisAlert {...mockProps} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onGetHelp = jest.fn();
      
      render(<CrisisAlert {...mockProps} onGetHelp={onGetHelp} />);
      
      // Tab to help button
      await user.tab();
      const helpButton = screen.getByText(/Get Help Now/i);
      expect(helpButton).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(onGetHelp).toHaveBeenCalled();
    });

    it('should announce changes to screen readers', () => {
      const { rerender } = render(<CrisisAlert {...mockProps} severity="warning" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      
      rerender(<CrisisAlert {...mockProps} severity="critical" />);
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing callbacks gracefully', async () => {
      const user = userEvent.setup();
      
      // Render without callbacks
      render(<CrisisAlert severity="warning" message="Test" />);
      
      // Should not throw when clicking buttons
      const dismissButton = screen.getByLabelText(/Dismiss/i);
      await expect(user.click(dismissButton)).resolves.not.toThrow();
    });

    it('should handle resource loading errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock service to throw error
      const { crisisService } = require('../../services/crisisService');
      crisisService.getCrisisResources.mockRejectedValue(new Error('Network error'));
      
      render(<CrisisAlert {...mockProps} />);
      
      // Should still render without crashing
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      consoleError.mockRestore();
    });
  });

  describe('Integration', () => {
    it('should work with crisis detection service', async () => {
      const { crisisService } = require('../../services/crisisService');
      crisisService.triggerAlert.mockResolvedValue({ success: true });
      
      const onGetHelp = jest.fn();
      render(<CrisisAlert {...mockProps} onGetHelp={onGetHelp} />);
      
      const helpButton = screen.getByText(/Get Help Now/i);
      await userEvent.click(helpButton);
      
      expect(onGetHelp).toHaveBeenCalled();
    });

    it('should integrate with notification service', async () => {
      const { showNotification } = require('../../utils/notifications');
      
      render(<CrisisAlert {...mockProps} severity="critical" />);
      
      // Critical alerts should trigger notifications
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical'
        })
      );
    });
  });
});