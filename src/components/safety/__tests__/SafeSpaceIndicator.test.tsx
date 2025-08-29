import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SafeSpaceIndicator } from '../SafeSpaceIndicator';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

const mockSafeSpaceData = {
  isInSafeSpace: true,
  currentLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10,
    timestamp: Date.now(),
  },
  nearestSafeSpaces: [
    {
      id: '1',
      name: 'Community Center',
      type: 'community_center',
      address: '123 Main St',
      distance: 0.5,
      isOpen: true,
      phone: '555-0123',
      services: ['counseling', 'support_groups'],
    },
    {
      id: '2',
      name: 'Public Library',
      type: 'library',
      address: '456 Oak Ave',
      distance: 0.8,
      isOpen: true,
      phone: '555-0456',
      services: ['quiet_space', 'free_wifi'],
    },
  ],
  safetyLevel: 'high' as const,
  lastUpdated: Date.now(),
};

describe('SafeSpaceIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSafeSpaceData),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders safe space indicator', () => {
      render(<SafeSpaceIndicator />);
      expect(screen.getByTestId('safe-space-indicator')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<SafeSpaceIndicator />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByText(/checking location/i)).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<SafeSpaceIndicator className="custom-class" />);
      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveClass('custom-class');
    });

    it('applies correct size classes', () => {
      const { rerender } = render(<SafeSpaceIndicator size="sm" />);
      let indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveClass('h-8');

      rerender(<SafeSpaceIndicator size="lg" />);
      indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveClass('h-16');
    });
  });

  describe('Safe Space Detection', () => {
    it('shows safe space status when in safe area', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({
          coords: mockSafeSpaceData.currentLocation,
        })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByTestId('safe-space-status')).toBeInTheDocument();
        expect(screen.getByText(/you are in a safe space/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('safe-icon')).toBeInTheDocument();
    });

    it('shows unsafe area warning when not in safe space', async () => {
      const unsafeData = {
        ...mockSafeSpaceData,
        isInSafeSpace: false,
        safetyLevel: 'low' as const,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(unsafeData),
      });

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({
          coords: mockSafeSpaceData.currentLocation,
        })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByTestId('unsafe-space-warning')).toBeInTheDocument();
        expect(screen.getByText(/area may not be safe/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('handles geolocation permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
        error({ code: 1, message: 'Permission denied' })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
        expect(screen.getByText(/enable location/i)).toBeInTheDocument();
      });
    });

    it('handles geolocation unavailable', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
        error({ code: 2, message: 'Position unavailable' })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/location unavailable/i)).toBeInTheDocument();
      });
    });

    it('handles geolocation timeout', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
        error({ code: 3, message: 'Timeout' })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/location timeout/i)).toBeInTheDocument();
      });
    });
  });

  describe('Nearest Safe Spaces', () => {
    it('displays list of nearby safe spaces', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator showNearestSpaces={true} />);

      await waitFor(() => {
        expect(screen.getByText('Community Center')).toBeInTheDocument();
        expect(screen.getByText('Public Library')).toBeInTheDocument();
      });

      expect(screen.getByText('0.5 miles')).toBeInTheDocument();
      expect(screen.getByText('0.8 miles')).toBeInTheDocument();
    });

    it('shows open/closed status for safe spaces', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      const dataWithClosedSpace = {
        ...mockSafeSpaceData,
        nearestSafeSpaces: [
          ...mockSafeSpaceData.nearestSafeSpaces,
          {
            id: '3',
            name: 'Closed Center',
            type: 'community_center',
            address: '789 Pine St',
            distance: 1.2,
            isOpen: false,
            phone: '555-0789',
            services: ['counseling'],
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(dataWithClosedSpace),
      });

      render(<SafeSpaceIndicator showNearestSpaces={true} />);

      await waitFor(() => {
        expect(screen.getByText(/open/i)).toBeInTheDocument();
        expect(screen.getByText(/closed/i)).toBeInTheDocument();
      });
    });

    it('displays services offered by safe spaces', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator showNearestSpaces={true} showServices={true} />);

      await waitFor(() => {
        expect(screen.getByText('counseling')).toBeInTheDocument();
        expect(screen.getByText('support_groups')).toBeInTheDocument();
        expect(screen.getByText('quiet_space')).toBeInTheDocument();
        expect(screen.getByText('free_wifi')).toBeInTheDocument();
      });
    });

    it('handles empty safe spaces list', async () => {
      const dataWithNoSpaces = {
        ...mockSafeSpaceData,
        nearestSafeSpaces: [],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(dataWithNoSpaces),
      });

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator showNearestSpaces={true} />);

      await waitFor(() => {
        expect(screen.getByText(/no safe spaces found nearby/i)).toBeInTheDocument();
      });
    });
  });

  describe('Emergency Actions', () => {
    it('shows emergency call button when unsafe', async () => {
      const unsafeData = {
        ...mockSafeSpaceData,
        isInSafeSpace: false,
        safetyLevel: 'critical' as const,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(unsafeData),
      });

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator showEmergencyActions={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('emergency-call-button')).toBeInTheDocument();
        expect(screen.getByText(/call 911/i)).toBeInTheDocument();
      });
    });

    it('shows crisis hotline button', async () => {
      render(<SafeSpaceIndicator showEmergencyActions={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('crisis-hotline-button')).toBeInTheDocument();
        expect(screen.getByText(/crisis hotline/i)).toBeInTheDocument();
      });
    });

    it('handles emergency call button click', async () => {
      const mockOpen = jest.spyOn(window, 'open').mockImplementation();
      
      const unsafeData = {
        ...mockSafeSpaceData,
        isInSafeSpace: false,
        safetyLevel: 'critical' as const,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(unsafeData),
      });

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator showEmergencyActions={true} />);

      await waitFor(() => {
        const emergencyButton = screen.getByTestId('emergency-call-button');
        fireEvent.click(emergencyButton);
      });

      expect(mockOpen).toHaveBeenCalledWith('tel:911');
      mockOpen.mockRestore();
    });

    it('handles crisis hotline button click', async () => {
      const mockOpen = jest.spyOn(window, 'open').mockImplementation();

      render(<SafeSpaceIndicator showEmergencyActions={true} />);

      await waitFor(() => {
        const hotlineButton = screen.getByTestId('crisis-hotline-button');
        fireEvent.click(hotlineButton);
      });

      expect(mockOpen).toHaveBeenCalledWith('tel:988');
      mockOpen.mockRestore();
    });
  });

  describe('Location Sharing', () => {
    it('shows share location button', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator enableLocationSharing={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('share-location-button')).toBeInTheDocument();
      });
    });

    it('handles share location button click', async () => {
      const mockShare = jest.spyOn(navigator, 'share').mockResolvedValue();
      
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator enableLocationSharing={true} />);

      await waitFor(() => {
        const shareButton = screen.getByTestId('share-location-button');
        fireEvent.click(shareButton);
      });

      expect(mockShare).toHaveBeenCalledWith({
        title: 'My Current Location',
        text: 'I am currently at this location',
        url: expect.stringContaining('maps.google.com'),
      });

      mockShare.mockRestore();
    });

    it('falls back to clipboard when share API unavailable', async () => {
      const mockWriteText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
      
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator enableLocationSharing={true} />);

      await waitFor(() => {
        const shareButton = screen.getByTestId('share-location-button');
        fireEvent.click(shareButton);
      });

      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('maps.google.com')
      );

      mockWriteText.mockRestore();
    });
  });

  describe('Real-time Updates', () => {
    it('updates location periodically', async () => {
      jest.useFakeTimers();
      
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator updateInterval={30000} />);

      await waitFor(() => {
        expect(screen.getByTestId('safe-space-status')).toBeInTheDocument();
      });

      // Fast-forward time
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('stops updates when component unmounts', async () => {
      jest.useFakeTimers();
      
      const { unmount } = render(<SafeSpaceIndicator updateInterval={10000} />);
      
      // Fast-forward past the interval
      jest.advanceTimersByTime(15000);
      
      unmount();
      
      // Fast-forward more time
      jest.advanceTimersByTime(15000);
      
      // Should not continue making calls after unmount
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('handles location watch mode', async () => {
      const watchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(watchId);

      const { unmount } = render(
        <SafeSpaceIndicator enableContinuousTracking={true} />
      );

      expect(mockGeolocation.watchPosition).toHaveBeenCalled();

      unmount();
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    });
  });

  describe('User Preferences', () => {
    it('saves location permission preference', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'safeSpaceIndicator_locationPermission',
          'granted'
        );
      });
    });

    it('loads saved preferences on mount', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'safeSpaceIndicator_preferences') {
          return JSON.stringify({
            showNotifications: false,
            updateInterval: 60000,
          });
        }
        return null;
      });

      render(<SafeSpaceIndicator />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'safeSpaceIndicator_preferences'
      );
    });

    it('respects do not track preference', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
      });

      render(<SafeSpaceIndicator respectDoNotTrack={true} />);

      expect(screen.getByText(/location tracking disabled/i)).toBeInTheDocument();
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Features', () => {
    it('provides ARIA labels for status indicators', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        const status = screen.getByTestId('safe-space-status');
        expect(status).toHaveAttribute('aria-label', expect.stringContaining('safe'));
      });
    });

    it('announces status changes to screen readers', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('provides keyboard navigation for actions', async () => {
      render(<SafeSpaceIndicator showEmergencyActions={true} />);

      await waitFor(() => {
        const hotlineButton = screen.getByTestId('crisis-hotline-button');
        hotlineButton.focus();
        expect(document.activeElement).toBe(hotlineButton);
      });

      // Test keyboard activation
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
      // Should trigger the same action as clicking
    });

    it('supports high contrast mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<SafeSpaceIndicator />);
      
      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveClass('high-contrast');
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/unable to check safe spaces/i)).toBeInTheDocument();
        expect(screen.getByTestId('error-icon')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
    });

    it('retries on retry button click', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSafeSpaceData),
        });

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        const retryButton = screen.getByTestId('retry-button');
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('safe-space-status')).toBeInTheDocument();
      });
    });

    it('handles malformed API responses', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/invalid response/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('debounces rapid location updates', async () => {
      jest.useFakeTimers();
      
      let positionCallback: (position: any) => void = () => {};
      mockGeolocation.getCurrentPosition.mockImplementation(callback => {
        positionCallback = callback;
      });

      render(<SafeSpaceIndicator />);

      // Simulate rapid position updates
      for (let i = 0; i < 5; i++) {
        positionCallback({
          coords: {
            ...mockSafeSpaceData.currentLocation,
            accuracy: i * 5,
          },
        });
      }

      jest.advanceTimersByTime(1000);

      // Should only make one API call despite multiple position updates
      expect(fetch).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('caches API responses', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      const { rerender } = render(<SafeSpaceIndicator />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Rerender with same props
      rerender(<SafeSpaceIndicator />);

      // Should use cached response
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = render(<SafeSpaceIndicator />);
      
      unmount();
      
      // Should not have any active intervals or listeners
      expect(mockGeolocation.clearWatch).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('integrates with crisis detection system', async () => {
      const onCrisisDetected = jest.fn();
      
      const criticalData = {
        ...mockSafeSpaceData,
        isInSafeSpace: false,
        safetyLevel: 'critical' as const,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(criticalData),
      });

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: mockSafeSpaceData.currentLocation })
      );

      render(<SafeSpaceIndicator onCrisisDetected={onCrisisDetected} />);

      await waitFor(() => {
        expect(onCrisisDetected).toHaveBeenCalledWith({
          type: 'unsafe_location',
          severity: 'critical',
          location: mockSafeSpaceData.currentLocation,
        });
      });
    });

    it('works with different coordinate systems', async () => {
      const alternateCoords = {
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 5,
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation(callback =>
        callback({ coords: alternateCoords })
      );

      render(<SafeSpaceIndicator coordinateSystem="WGS84" />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('lat=51.5074&lng=-0.1278'),
          expect.any(Object)
        );
      });
    });
  });
});
