/**
 * Biometrics Hook
 * Manages biometric data state and provides interface to biometric service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  biometricService,
  BiometricData,
  WearableDevice,
  StressIndicators,
  HealthCorrelation
} from '../services/biometric/biometricService';

interface UseBiometricsReturn {
  // Current state
  currentData: BiometricData | null;
  devices: WearableDevice[];
  stressIndicators: StressIndicators | null;
  healthCorrelation: HealthCorrelation | null;
  isMonitoring: boolean;
  historicalData: BiometricData[];
  
  // Device management
  connectDevice: (type: WearableDevice['type']) => Promise<boolean>;
  disconnectDevice: (deviceId: string) => void;
  
  // Monitoring control
  startMonitoring: (intervalMs?: number) => void;
  stopMonitoring: () => void;
  
  // Data access
  getRecentData: (hours: number) => BiometricData[];
  refreshData: () => Promise<void>;
  
  // Analysis
  analyzeStress: () => StressIndicators | null;
  getHealthInsights: () => string[];
  
  // Status
  isConnected: boolean;
  lastSync: Date | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  error: string | null;
}

export function useBiometrics(): UseBiometricsReturn {
  // State management
  const [currentData, setCurrentData] = useState<BiometricData | null>(null);
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [stressIndicators, setStressIndicators] = useState<StressIndicators | null>(null);
  const [healthCorrelation, setHealthCorrelation] = useState<HealthCorrelation | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [historicalData, setHistoricalData] = useState<BiometricData[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const isMounted = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Initialize service and event listeners
   */
  useEffect(() => {
    // Load initial state
    const loadInitialState = () => {
      const connectedDevices = biometricService.getConnectedDevices();
      setDevices(connectedDevices);
      
      const latestReading = biometricService.getLatestReading();
      if (latestReading) {
        setCurrentData(latestReading);
      }
      
      const recentData = biometricService.getRecentData(168); // Last week
      setHistoricalData(recentData);
    };

    loadInitialState();

    // Event handlers
    const handleDataSync = ({ device, data }: { device: WearableDevice; data: BiometricData }) => {
      if (!isMounted.current) return;
      
      setCurrentData(data);
      setHistoricalData(prev => [...prev, data].slice(-1000)); // Keep last 1000 readings
      setLastSync(new Date());
      setSyncStatus('success');
      
      // Reset sync status after delay
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setSyncStatus('idle');
        }
      }, 3000);
    };

    const handleDeviceConnected = (device: WearableDevice) => {
      if (!isMounted.current) return;
      setDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
    };

    const handleDeviceDisconnected = (device: WearableDevice) => {
      if (!isMounted.current) return;
      setDevices(prev => prev.filter(d => d.id !== device.id));
    };

    const handleStressUpdate = (stress: StressIndicators) => {
      if (!isMounted.current) return;
      setStressIndicators(stress);
    };

    const handleStressAlert = ({ stress }: { stress: StressIndicators }) => {
      if (!isMounted.current) return;
      setStressIndicators(stress);
      
      // Could trigger notifications here
      if (stress.needsIntervention) {
        console.warn('Stress intervention needed:', stress);
      }
    };

    const handleCorrelationAnalysis = (correlation: HealthCorrelation) => {
      if (!isMounted.current) return;
      setHealthCorrelation(correlation);
    };

    const handleAnomalyDetected = (anomaly: any) => {
      if (!isMounted.current) return;
      console.warn('Biometric anomaly detected:', anomaly);
      // Could trigger alerts or notifications
    };

    const handleMonitoringStarted = () => {
      if (!isMounted.current) return;
      setIsMonitoring(true);
      setSyncStatus('syncing');
    };

    const handleMonitoringStopped = () => {
      if (!isMounted.current) return;
      setIsMonitoring(false);
      setSyncStatus('idle');
    };

    // Subscribe to events
    biometricService.on('dataSync', handleDataSync);
    biometricService.on('deviceConnected', handleDeviceConnected);
    biometricService.on('deviceDisconnected', handleDeviceDisconnected);
    biometricService.on('stressUpdate', handleStressUpdate);
    biometricService.on('stressAlert', handleStressAlert);
    biometricService.on('correlationAnalysis', handleCorrelationAnalysis);
    biometricService.on('anomalyDetected', handleAnomalyDetected);
    biometricService.on('monitoringStarted', handleMonitoringStarted);
    biometricService.on('monitoringStopped', handleMonitoringStopped);

    // Cleanup
    return () => {
      isMounted.current = false;
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      biometricService.off('dataSync', handleDataSync);
      biometricService.off('deviceConnected', handleDeviceConnected);
      biometricService.off('deviceDisconnected', handleDeviceDisconnected);
      biometricService.off('stressUpdate', handleStressUpdate);
      biometricService.off('stressAlert', handleStressAlert);
      biometricService.off('correlationAnalysis', handleCorrelationAnalysis);
      biometricService.off('anomalyDetected', handleAnomalyDetected);
      biometricService.off('monitoringStarted', handleMonitoringStarted);
      biometricService.off('monitoringStopped', handleMonitoringStopped);
    };
  }, []);

  /**
   * Connect a wearable device
   */
  const connectDevice = useCallback(async (type: WearableDevice['type']): Promise<boolean> => {
    try {
      setError(null);
      const success = await biometricService.connectDevice(type);
      
      if (success) {
        // Device will be added via event listener
        return true;
      } else {
        setError('Failed to connect device');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      return false;
    }
  }, []);

  /**
   * Disconnect a device
   */
  const disconnectDevice = useCallback((deviceId: string) => {
    biometricService.disconnectDevice(deviceId);
    // Device will be removed via event listener
  }, []);

  /**
   * Start monitoring biometrics
   */
  const startMonitoring = useCallback((intervalMs: number = 60000) => {
    if (devices.length === 0) {
      setError('No devices connected. Please connect a device first.');
      return;
    }
    
    setError(null);
    biometricService.startMonitoring(intervalMs);
    // Status will be updated via event listener
  }, [devices.length]);

  /**
   * Stop monitoring biometrics
   */
  const stopMonitoring = useCallback(() => {
    biometricService.stopMonitoring();
    // Status will be updated via event listener
  }, []);

  /**
   * Get recent biometric data
   */
  const getRecentData = useCallback((hours: number): BiometricData[] => {
    return biometricService.getRecentData(hours);
  }, []);

  /**
   * Manually refresh data from all devices
   */
  const refreshData = useCallback(async (): Promise<void> => {
    if (devices.length === 0) {
      setError('No devices connected');
      return;
    }

    setSyncStatus('syncing');
    setError(null);

    try {
      // Trigger manual sync through private method
      // In production, this would be exposed as a public method
      await (biometricService as any).syncAllDevices();
      setSyncStatus('success');
      
      // Reset status after delay
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setSyncStatus('idle');
        }
      }, 3000);
    } catch (err) {
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [devices.length]);

  /**
   * Analyze current stress levels
   */
  const analyzeStress = useCallback((): StressIndicators | null => {
    if (!currentData) return null;
    
    const stress = biometricService.calculateStressIndicators(currentData);
    setStressIndicators(stress);
    return stress;
  }, [currentData]);

  /**
   * Get personalized health insights
   */
  const getHealthInsights = useCallback((): string[] => {
    const insights: string[] = [];

    // Stress-based insights
    if (stressIndicators) {
      if (stressIndicators.physiologicalStress > 70) {
        insights.push('Your body is showing signs of high stress. Consider taking a break.');
      }
      if (stressIndicators.mentalStress > 70) {
        insights.push('Mental stress levels are elevated. Try a mindfulness exercise.');
      }
      if (stressIndicators.recoveryScore < 40) {
        insights.push('Your recovery score is low. Prioritize rest and relaxation.');
      }
    }

    // HRV insights
    if (currentData?.heartRateVariability) {
      if (currentData.heartRateVariability < 30) {
        insights.push('Low HRV detected. Focus on stress reduction and recovery.');
      } else if (currentData.heartRateVariability > 70) {
        insights.push('Excellent HRV! Your body is well-recovered and resilient.');
      }
    }

    // Sleep insights
    if (currentData?.sleepData) {
      if (currentData.sleepData.sleepEfficiency < 70) {
        insights.push('Sleep efficiency is below optimal. Consider improving sleep hygiene.');
      }
      if (currentData.sleepData.totalSleepMinutes < 420) { // Less than 7 hours
        insights.push('You may need more sleep for optimal mental health.');
      }
    }

    // Activity insights
    if (currentData?.activityLevel === 'sedentary') {
      insights.push('Low activity detected. Light exercise can improve mood and reduce stress.');
    } else if (currentData?.activityLevel === 'vigorous') {
      insights.push('Great activity level! Remember to balance with adequate recovery.');
    }

    // Correlation insights
    if (healthCorrelation) {
      if (healthCorrelation.physicalActivityImpact > 0.3) {
        insights.push('Exercise is positively impacting your mood. Keep it up!');
      }
      if (healthCorrelation.sleepQualityImpact > 0.4) {
        insights.push('Good sleep is boosting your wellbeing significantly.');
      }
      if (healthCorrelation.hrvTrend === 'improving') {
        insights.push('Your stress resilience is improving over time.');
      } else if (healthCorrelation.hrvTrend === 'declining') {
        insights.push('HRV trend suggests increasing stress. Consider stress management techniques.');
      }
    }

    // Add recommendations from services
    if (stressIndicators?.recommendations) {
      insights.push(...stressIndicators.recommendations.slice(0, 2));
    }
    if (healthCorrelation?.recommendations) {
      insights.push(...healthCorrelation.recommendations.slice(0, 2));
    }

    // Return unique insights
    return [...new Set(insights)];
  }, [currentData, stressIndicators, healthCorrelation]);

  return {
    // Current state
    currentData,
    devices,
    stressIndicators,
    healthCorrelation,
    isMonitoring,
    historicalData,
    
    // Device management
    connectDevice,
    disconnectDevice,
    
    // Monitoring control
    startMonitoring,
    stopMonitoring,
    
    // Data access
    getRecentData,
    refreshData,
    
    // Analysis
    analyzeStress,
    getHealthInsights,
    
    // Status
    isConnected: devices.length > 0,
    lastSync,
    syncStatus,
    error
  };
}