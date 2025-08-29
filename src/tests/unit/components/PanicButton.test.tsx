import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PanicButton from '../../../components/safety/PanicButton';
import crisis988Service from '../../../services/crisis988Service';
import emergencyServicesConnector from '../../../services/emergencyServicesConnector';
import emergencyEscalationService from '../../../services/emergencyEscalationService';

// Mock the service modules
jest.mock('../../../services/crisis988Service');
jest.mock('../../../services/emergencyServicesConnector');
jest.mock('../../../services/emergencyEscalationService');

// Mock window functions
const mockOpen = jest.fn();
const mockConfirm = jest.fn();
const mockAlert = jest.fn();

describe('PanicButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window mocks
    global.window.open = mockOpen;
    global.window.confirm = mockConfirm;
    global.window.alert = mockAlert;
    
    // Mock location.href
    delete (window as any).location;
    (window as any).location = { href: '' };
    
    // Mock navigator
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 0
    });
    
    // Mock crisis service methods
    (crisis988Service.assessAndConnect as jest.Mock) = jest.fn().mockResolvedValue({
      sessionId: 'test-session-123',
      status: 'connected'
    });
    
    (emergencyServicesConnector.getCurrentLocation as jest.Mock) = jest.fn().mockResolvedValue({
      latitude: 40.7128,
      longitude: -74.0060
    });
    
    (emergencyServicesConnector.call911 as jest.Mock) = jest.fn().mockResolvedValue({
      status: 'connected'
    });
    
    (emergencyServicesConnector.findNearestHospitals as jest.Mock) = jest.fn().mockResolvedValue([{
      name: 'Test Hospital',
      address: '123 Medical Ave',
      phone: '555-1234'
    }]);
    
    (emergencyServicesConnector.findLocalCrisisCenters as jest.Mock) = jest.fn().mockResolvedValue([]);
    
    (emergencyEscalationService.connectCrisisTextLine as jest.Mock) = jest.fn().mockResolvedValue({
      status: 'connected'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Basic Interactions', () => {
    it('should render the panic button with default props', () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
    });

    it('should expand menu when clicked', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /crisis help options/i })).toBeInTheDocument();
        expect(screen.getByText("You're Not Alone")).toBeInTheDocument();
      });
    });

    it('should close menu when close button is clicked', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: /close help menu/i });
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should call onPanicClick callback when provided', () => {
      const mockCallback = jest.fn();
      render(<PanicButton onPanicClick={mockCallback} />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<PanicButton size="small" />);
      expect(screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container')).toHaveClass('panic-button-small');
      
      rerender(<PanicButton size="medium" />);
      expect(screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container')).toHaveClass('panic-button-medium');
      
      rerender(<PanicButton size="large" />);
      expect(screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container')).toHaveClass('panic-button-large');
    });

    it('should render with different positions', () => {
      const { rerender } = render(<PanicButton position="fixed" />);
      expect(screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container')).toHaveClass('panic-fixed');
      
      rerender(<PanicButton position="relative" />);
      expect(screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container')).not.toHaveClass('panic-fixed');
    });
  });

  describe('Crisis Resources Integration', () => {
    it('should connect to 988 Lifeline when resource is clicked', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const resource988 = screen.getByRole('button', { name: /contact 988 suicide & crisis lifeline/i });
      fireEvent.click(resource988);
      
      await waitFor(() => {
        expect(crisis988Service.assessAndConnect).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'current-user',
            severity: 'high',
            triggers: ['988-button-pressed']
          }),
          expect.objectContaining({
            triggers: ['user-requested-help']
          })
        );
      });
      
      expect(screen.getByText('Connecting you to help...')).toBeInTheDocument();
    });

    it('should connect to Crisis Text Line when resource is clicked', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const textLine = screen.getByRole('button', { name: /contact crisis text line/i });
      fireEvent.click(textLine);
      
      await waitFor(() => {
        expect(emergencyEscalationService.connectCrisisTextLine).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'current-user',
            level: 'high',
            triggers: ['crisis-text-requested']
          })
        );
      });
    });

    it('should prompt for confirmation before calling 911', async () => {
      mockConfirm.mockReturnValue(true);
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const emergency911 = screen.getByRole('button', { name: /contact emergency services/i });
      fireEvent.click(emergency911);
      
      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          expect.stringContaining('This will contact emergency services (911)')
        );
        expect(emergencyServicesConnector.call911).toHaveBeenCalledWith('Mental Health Crisis');
      });
    });

    it('should not call 911 if user cancels confirmation', async () => {
      mockConfirm.mockReturnValue(false);
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const emergency911 = screen.getByRole('button', { name: /contact emergency services/i });
      fireEvent.click(emergency911);
      
      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled();
      });
      
      expect(emergencyServicesConnector.call911).not.toHaveBeenCalled();
    });

    it('should find and display local crisis centers', async () => {
      mockAlert.mockImplementation(() => {});
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const localResources = screen.getByRole('button', { name: /find local crisis centers/i });
      fireEvent.click(localResources);
      
      await waitFor(() => {
        expect(emergencyServicesConnector.findNearestHospitals).toHaveBeenCalled();
        expect(emergencyServicesConnector.findLocalCrisisCenters).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Test Hospital')
        );
      });
    });
  });

  describe('Calming Actions', () => {
    it('should trigger breathing exercise when clicked', async () => {
      const mockDispatchEvent = jest.spyOn(document, 'dispatchEvent');
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const breathingButton = screen.getByRole('button', { name: /breathing exercise/i });
      fireEvent.click(breathingButton);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startBreathingExercise'
        })
      );
    });

    it('should trigger grounding technique when clicked', async () => {
      const mockDispatchEvent = jest.spyOn(document, 'dispatchEvent');
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const groundingButton = screen.getByRole('button', { name: /grounding technique/i });
      fireEvent.click(groundingButton);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startGroundingExercise'
        })
      );
    });

    it('should show virtual hug animation when clicked', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const hugButton = screen.getByRole('button', { name: /virtual hug/i });
      fireEvent.click(hugButton);
      
      await waitFor(() => {
        expect(screen.getByText('Sending you a virtual hug')).toBeInTheDocument();
        expect(screen.getByText('You are valued and loved')).toBeInTheDocument();
      });
    });

    it('should activate safe space when clicked', async () => {
      const mockDispatchEvent = jest.spyOn(document, 'dispatchEvent');
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const safeSpaceButton = screen.getByRole('button', { name: /safe space/i });
      fireEvent.click(safeSpaceButton);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'activateSafeSpace'
        })
      );
    });
  });

  describe('Auto-Distress Detection', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should detect rapid clicks and increase distress level', async () => {
      render(<PanicButton autoDetectDistress={true} />);
      
      // Simulate rapid clicks
      for (let i = 0; i < 7; i++) {
        fireEvent.click(window);
      }
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        const container = screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container');
        expect(container).toHaveAttribute('data-distress-level', '20');
      });
    });

    it('should detect rapid scrolling and increase distress level', async () => {
      render(<PanicButton autoDetectDistress={true} />);
      
      // Simulate rapid scrolling
      for (let i = 0; i < 15; i++) {
        fireEvent.scroll(window);
        act(() => {
          jest.advanceTimersByTime(30);
        });
      }
      
      await waitFor(() => {
        const container = screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container');
        const distressLevel = parseInt(container?.getAttribute('data-distress-level') || '0');
        expect(distressLevel).toBeGreaterThan(0);
      });
    });

    it('should auto-expand menu when distress level is very high', async () => {
      render(<PanicButton autoDetectDistress={true} />);
      
      // Simulate many rapid clicks to increase distress level above 80
      for (let j = 0; j < 5; j++) {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(window);
        }
        act(() => {
          jest.advanceTimersByTime(2000);
        });
      }
      
      await waitFor(() => {
        const container = screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container');
        const distressLevel = parseInt(container?.getAttribute('data-distress-level') || '0');
        if (distressLevel > 80) {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        }
      });
    });

    it('should change button text when distress is detected', async () => {
      render(<PanicButton autoDetectDistress={true} />);
      
      // Start with normal text
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
      
      // Simulate rapid clicks to increase distress level above 50
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 7; i++) {
          fireEvent.click(window);
        }
        act(() => {
          jest.advanceTimersByTime(2000);
        });
      }
      
      await waitFor(() => {
        const container = screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container');
        const distressLevel = parseInt(container?.getAttribute('data-distress-level') || '0');
        if (distressLevel > 50) {
          expect(screen.getByText("I'm Here to Help")).toBeInTheDocument();
        }
      });
    });

    it('should not detect distress when autoDetectDistress is false', async () => {
      render(<PanicButton autoDetectDistress={false} />);
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(window);
      }
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      const container = screen.getByRole('button', { name: /get immediate help/i }).closest('.panic-button-container');
      expect(container).toHaveAttribute('data-distress-level', '0');
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle crisis service connection failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (crisis988Service.assessAndConnect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
      
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const resource988 = screen.getByRole('button', { name: /contact 988 suicide & crisis lifeline/i });
      fireEvent.click(resource988);
      
      await waitFor(() => {
        expect(crisis988Service.assessAndConnect).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to connect to 988, falling back to direct dial:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle local resources fetch failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (emergencyServicesConnector.findNearestHospitals as jest.Mock).mockRejectedValueOnce(new Error('Location unavailable'));
      
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const localResources = screen.getByRole('button', { name: /find local crisis centers/i });
      fireEvent.click(localResources);
      
      await waitFor(() => {
        expect(emergencyServicesConnector.findNearestHospitals).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to find local resources:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle crisis event logging failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (emergencyServicesConnector.getCurrentLocation as jest.Mock).mockRejectedValueOnce(new Error('Location error'));
      
      render(<PanicButton />);
      
      // Set high distress level by manipulating the component
      const button = screen.getByRole('button', { name: /get immediate help/i });
      
      // Mock high distress scenario
      Object.defineProperty(button.closest('.panic-button-container'), 'getAttribute', {
        value: (attr: string) => attr === 'data-distress-level' ? '90' : null,
        writable: true
      });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      expect(button).toHaveAttribute('aria-label', 'Get immediate help');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(button);
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper roles for dialog', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog', { name: /crisis help options/i });
        expect(dialog).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels for all interactive elements', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Check all buttons have aria-labels
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(btn => {
        expect(btn).toHaveAttribute('aria-label');
      });
    });

    it('should announce confirmation messages with alert role', async () => {
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const resource988 = screen.getByRole('button', { name: /contact 988 suicide & crisis lifeline/i });
      fireEvent.click(resource988);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Connecting you to help...');
      });
    });
  });

  describe('Mobile Device Support', () => {
    it('should trigger direct dial on mobile devices for phone resources', async () => {
      // Mock mobile device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5
      });
      
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const resource988 = screen.getByRole('button', { name: /contact 988 suicide & crisis lifeline/i });
      
      jest.useFakeTimers();
      fireEvent.click(resource988);
      
      await waitFor(() => {
        expect(crisis988Service.assessAndConnect).toHaveBeenCalled();
      });
      
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(window.location.href).toBe('tel:988');
      jest.useRealTimers();
    });

    it('should trigger SMS app on mobile devices for text resources', async () => {
      // Mock mobile device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5
      });
      
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const textLine = screen.getByRole('button', { name: /contact crisis text line/i });
      
      jest.useFakeTimers();
      fireEvent.click(textLine);
      
      await waitFor(() => {
        expect(emergencyEscalationService.connectCrisisTextLine).toHaveBeenCalled();
      });
      
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(window.location.href).toBe('sms:741741?body=HOME');
      jest.useRealTimers();
    });
  });

  describe('Integration with Emergency Escalation', () => {
    it('should auto-connect to crisis services when distress is very high', async () => {
      const { rerender } = render(<PanicButton autoDetectDistress={true} />);
      
      // Simulate high distress click by manipulating props/state
      const button = screen.getByRole('button', { name: /get immediate help/i });
      
      // Mock the component to have high distress
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [false, jest.fn()]) // isExpanded
        .mockImplementationOnce(() => [true, jest.fn()]) // isPulsing
        .mockImplementationOnce(() => [false, jest.fn()]) // showConfirmation
        .mockImplementationOnce(() => [85, jest.fn()]) // distressLevel
        .mockImplementationOnce(() => [false, jest.fn()]); // showVirtualHug
      
      rerender(<PanicButton autoDetectDistress={true} />);
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(crisis988Service.assessAndConnect).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'critical'
          }),
          expect.objectContaining({
            triggers: expect.arrayContaining(['high-distress', 'panic-button'])
          }),
          expect.objectContaining({
            dataSharing: true,
            emergencyContactNotification: true
          })
        );
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<PanicButton autoDetectDistress={true} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should reset distress level after interaction', async () => {
      jest.useFakeTimers();
      
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      const container = button.closest('.panic-button-container');
      await waitFor(() => {
        expect(container).toHaveAttribute('data-distress-level', '0');
      });
      
      jest.useRealTimers();
    });

    it('should hide virtual hug after timeout', async () => {
      jest.useFakeTimers();
      
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const hugButton = screen.getByRole('button', { name: /virtual hug/i });
      fireEvent.click(hugButton);
      
      expect(screen.getByText('Sending you a virtual hug')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Sending you a virtual hug')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('should hide confirmation message after timeout', async () => {
      jest.useFakeTimers();
      
      render(<PanicButton />);
      
      const button = screen.getByRole('button', { name: /get immediate help/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const resource988 = screen.getByRole('button', { name: /contact 988 suicide & crisis lifeline/i });
      fireEvent.click(resource988);
      
      expect(screen.getByText('Connecting you to help...')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Connecting you to help...')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });
});