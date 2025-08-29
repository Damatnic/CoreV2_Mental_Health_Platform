import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

interface SafeLocation {
  name: string;
  address: string;
  distance?: number;
  isOpen?: boolean;
  phone?: string;
}

const useSafeLocation = () => {
  const [currentLocation, setCurrentLocation] = React.useState<GeolocationCoordinates | null>(null);
  const [nearbyLocations, setNearbyLocations] = React.useState<SafeLocation[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getCurrentLocation = React.useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position.coords);
        setIsLoading(false);
        findNearbyLocations(position.coords);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );
  }, []);

  const findNearbyLocations = React.useCallback((coords: GeolocationCoordinates) => {
    // Mock safe locations
    const mockLocations: SafeLocation[] = [
      {
        name: 'City Hospital',
        address: '123 Main St',
        distance: 0.5,
        isOpen: true,
        phone: '555-0111'
      },
      {
        name: 'Crisis Center',
        address: '456 Oak Ave',
        distance: 1.2,
        isOpen: true,
        phone: '555-0222'
      },
      {
        name: 'Community Clinic',
        address: '789 Pine Rd',
        distance: 2.3,
        isOpen: false,
        phone: '555-0333'
      }
    ];

    setNearbyLocations(mockLocations);
  }, []);

  const getDirections = React.useCallback((location: SafeLocation) => {
    if (currentLocation) {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(location.address)}`;
      window.open(url, '_blank');
    }
  }, [currentLocation]);

  return {
    currentLocation,
    nearbyLocations,
    isLoading,
    error,
    getCurrentLocation,
    getDirections
  };
};

describe('useSafeLocation', () => {
  it('should initialize with null location', () => {
    const { result } = renderHook(() => useSafeLocation());
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.nearbyLocations).toHaveLength(0);
  });

  it('should handle geolocation errors', () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success, error) => {
        error({ message: 'User denied location' });
      })
    };
    
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true
    });

    const { result } = renderHook(() => useSafeLocation());
    
    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.error).toBe('User denied location');
  });

  it('should find nearby locations', () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          }
        });
      })
    };
    
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true
    });

    const { result } = renderHook(() => useSafeLocation());
    
    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.nearbyLocations.length).toBeGreaterThan(0);
    expect(result.current.nearbyLocations[0]).toHaveProperty('name');
    expect(result.current.nearbyLocations[0]).toHaveProperty('distance');
  });
});
