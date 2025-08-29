/**
 * Wearable Device Connection Component
 * Handles OAuth flows and device pairing for various wearable platforms
 */

import React, { useState, useEffect } from 'react';
import {
  Watch,
  Smartphone,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Info,
  Battery,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { biometricService, WearableDevice } from '../../services/biometric/biometricService';

interface WearableConnectProps {
  onConnect?: (device: WearableDevice) => void;
  onDisconnect?: (deviceId: string) => void;
  className?: string;
}

interface DeviceOption {
  type: WearableDevice['type'];
  name: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  color: string;
  setupSteps: string[];
  privacyNote: string;
}

const DEVICE_OPTIONS: DeviceOption[] = [
  {
    type: 'fitbit',
    name: 'Fitbit',
    icon: <Activity className="w-8 h-8" />,
    description: 'Connect your Fitbit device for comprehensive health tracking',
    features: ['Heart Rate', 'Sleep Tracking', 'Activity Monitoring', 'SpO2', 'HRV'],
    color: '#00B0B9',
    setupSteps: [
      'Click "Connect Fitbit" below',
      'Log in to your Fitbit account',
      'Authorize access to health data',
      'Start monitoring automatically'
    ],
    privacyNote: 'We only access health metrics needed for mental wellness insights. Your data is encrypted and never shared.'
  },
  {
    type: 'apple_watch',
    name: 'Apple Watch',
    icon: <Watch className="w-8 h-8" />,
    description: 'Sync with Apple Health for seamless biometric monitoring',
    features: ['Heart Rate', 'HRV', 'Sleep Analysis', 'Mindfulness', 'ECG', 'Fall Detection'],
    color: '#000000',
    setupSteps: [
      'Ensure Apple Health is enabled on your iPhone',
      'Click "Connect Apple Watch"',
      'Grant permission in Health app',
      'Data syncs automatically'
    ],
    privacyNote: 'Health data stays on your device. We request read-only access to specific health metrics.'
  },
  {
    type: 'garmin',
    name: 'Garmin',
    icon: <Watch className="w-8 h-8" />,
    description: 'Connect Garmin devices for advanced performance metrics',
    features: ['Body Battery', 'Stress Tracking', 'Advanced Sleep', 'Recovery Time', 'Training Status'],
    color: '#007CC3',
    setupSteps: [
      'Click "Connect Garmin"',
      'Sign in to Garmin Connect',
      'Approve data sharing',
      'Monitoring begins immediately'
    ],
    privacyNote: 'Garmin Connect data is accessed securely. You control which metrics to share.'
  },
  {
    type: 'samsung',
    name: 'Samsung Galaxy Watch',
    icon: <Smartphone className="w-8 h-8" />,
    description: 'Integrate Samsung Health for holistic wellness tracking',
    features: ['Heart Rate', 'Sleep Score', 'Stress Management', 'Blood Oxygen', 'Body Composition'],
    color: '#1428A0',
    setupSteps: [
      'Install Samsung Health app',
      'Click "Connect Samsung"',
      'Authorize in Samsung Health',
      'Start tracking wellness'
    ],
    privacyNote: 'Samsung Health data is encrypted. We only access wellness metrics with your permission.'
  },
  {
    type: 'whoop',
    name: 'WHOOP',
    icon: <Activity className="w-8 h-8" />,
    description: 'Professional-grade recovery and strain monitoring',
    features: ['Recovery Score', 'Strain Coach', 'Sleep Coach', 'HRV Optimization', 'Performance Analytics'],
    color: '#000000',
    setupSteps: [
      'Click "Connect WHOOP"',
      'Log in to WHOOP account',
      'Grant API access',
      'View recovery insights'
    ],
    privacyNote: 'WHOOP data helps optimize your mental and physical recovery. All data is handled securely.'
  },
  {
    type: 'oura',
    name: 'Oura Ring',
    icon: <Activity className="w-8 h-8" />,
    description: 'Discreet 24/7 health monitoring with the Oura Ring',
    features: ['Readiness Score', 'Sleep Stages', 'Temperature Trends', 'Activity Goals', 'Meditation Tracking'],
    color: '#B8B8B8',
    setupSteps: [
      'Click "Connect Oura"',
      'Sign in to Oura account',
      'Authorize data access',
      'Monitor readiness scores'
    ],
    privacyNote: 'Oura provides valuable readiness insights. Your ring data remains private and secure.'
  }
];

export const WearableConnect: React.FC<WearableConnectProps> = ({
  onConnect,
  onDisconnect,
  className = ''
}) => {
  const [connectedDevices, setConnectedDevices] = useState<WearableDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceOption | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  useEffect(() => {
    // Load connected devices
    const devices = biometricService.getConnectedDevices();
    setConnectedDevices(devices);

    // Listen for device events
    const handleDeviceConnected = (device: WearableDevice) => {
      setConnectedDevices(prev => [...prev, device]);
      setConnectionStatus('success');
      if (onConnect) onConnect(device);
      
      // Reset after success
      setTimeout(() => {
        setConnectionStatus('idle');
        setSelectedDevice(null);
      }, 3000);
    };

    const handleDeviceDisconnected = (device: WearableDevice) => {
      setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
    };

    biometricService.on('deviceConnected', handleDeviceConnected);
    biometricService.on('deviceDisconnected', handleDeviceDisconnected);

    return () => {
      biometricService.off('deviceConnected', handleDeviceConnected);
      biometricService.off('deviceDisconnected', handleDeviceDisconnected);
    };
  }, [onConnect]);

  const handleConnect = async (device: DeviceOption) => {
    setSelectedDevice(device);
    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      const success = await biometricService.connectDevice(device.type);
      
      if (!success) {
        throw new Error('Connection was cancelled or failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect device');
      
      // Reset error after delay
      setTimeout(() => {
        setConnectionStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleDisconnect = (deviceId: string) => {
    biometricService.disconnectDevice(deviceId);
    if (onDisconnect) onDisconnect(deviceId);
  };

  const isDeviceConnected = (type: WearableDevice['type']) => {
    return connectedDevices.some(d => d.type === type);
  };

  return (
    <div className={`wearable-connect ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Your Devices
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Link your wearable devices to track biometric data and gain personalized mental health insights
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              Your Privacy Matters
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              All biometric data is encrypted and stored securely. We never share your health information
              with third parties. You have full control over your data and can disconnect devices at any time.
            </p>
            <button
              onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showPrivacyInfo ? 'Hide' : 'Learn more'} about data handling
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showPrivacyInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800"
            >
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5" />
                  <p>End-to-end encryption for all health data</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5" />
                  <p>Data processed locally when possible</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5" />
                  <p>Compliant with HIPAA and GDPR regulations</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5" />
                  <p>You can export or delete your data anytime</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Connected Devices
          </h3>
          <div className="space-y-3">
            {connectedDevices.map(device => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <Watch className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {device.name}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center space-x-1">
                        <Wifi className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Connected
                        </span>
                      </div>
                      {device.batteryLevel !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Battery className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {device.batteryLevel}%
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Last sync: {new Date(device.lastSync).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(device.id)}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm font-medium transition-colors"
                >
                  Disconnect
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Devices */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Available Devices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEVICE_OPTIONS.map(device => {
            const connected = isDeviceConnected(device.type);
            
            return (
              <motion.div
                key={device.type}
                whileHover={{ scale: connected ? 1 : 1.02 }}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  connected
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400'
                } ${connected ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !connected && handleConnect(device)}
              >
                {/* Connected badge */}
                {connected && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </span>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${device.color}20` }}
                  >
                    <div style={{ color: device.color }}>
                      {device.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {device.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {device.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {device.features.slice(0, 3).map(feature => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {device.features.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-500 dark:text-gray-500">
                          +{device.features.length - 3} more
                        </span>
                      )}
                    </div>

                    {!connected && (
                      <button className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        Connect →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Connection Modal */}
      <AnimatePresence>
        {selectedDevice && connectionStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => connectionStatus !== 'connecting' && setSelectedDevice(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Connection status */}
              {connectionStatus === 'connecting' && (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Connecting to {selectedDevice.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Please follow the authorization steps in the popup window
                  </p>
                  
                  {/* Setup steps */}
                  <div className="text-left space-y-2 mb-4">
                    {selectedDevice.setupSteps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                          {index + 1}.
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Privacy note */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-gray-500 mt-0.5" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                        {selectedDevice.privacyNote}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {connectionStatus === 'success' && (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Successfully Connected!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDevice.name} is now syncing your health data
                  </p>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Connection Failed
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {errorMessage || 'Unable to connect to your device'}
                  </p>
                  <button
                    onClick={() => handleConnect(selectedDevice)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {connectionStatus !== 'connecting' && (
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};