/**
 * Wearable Device Integration Service
 * 
 * Comprehensive integration with wearable devices for biometric monitoring,
 * heart rate variability analysis, sleep tracking, and health alerts.
 */

import { EventEmitter } from 'events';

// ============================
// Type Definitions
// ============================

export interface WearableDevice {
  id: string;
  type: DeviceType;
  brand: DeviceBrand;
  model: string;
  connectionStatus: ConnectionStatus;
  batteryLevel: number;
  firmwareVersion: string;
  capabilities: DeviceCapabilities;
  lastSync: Date;
  userId: string;
  pairingCode?: string;
}

export type DeviceType = 
  | 'smartwatch'
  | 'fitness_tracker'
  | 'heart_rate_monitor'
  | 'sleep_tracker'
  | 'stress_sensor'
  | 'glucose_monitor'
  | 'blood_pressure_monitor'
  | 'pulse_oximeter'
  | 'eeg_headband'
  | 'smart_ring';

export type DeviceBrand = 
  | 'apple'
  | 'fitbit'
  | 'garmin'
  | 'samsung'
  | 'whoop'
  | 'oura'
  | 'polar'
  | 'withings'
  | 'muse'
  | 'biosensor'
  | 'custom';

export type ConnectionStatus = 
  | 'connected'
  | 'disconnected'
  | 'pairing'
  | 'syncing'
  | 'error'
  | 'unauthorized';

export interface DeviceCapabilities {
  heartRate: boolean;
  heartRateVariability: boolean;
  bloodOxygen: boolean;
  bloodPressure: boolean;
  temperature: boolean;
  steps: boolean;
  calories: boolean;
  distance: boolean;
  sleep: boolean;
  stress: boolean;
  ecg: boolean;
  glucose: boolean;
  brainwaves: boolean;
  respiration: boolean;
  skinConductance: boolean;
}

export interface BiometricData {
  deviceId: string;
  userId: string;
  timestamp: Date;
  metrics: BiometricMetrics;
  quality: DataQuality;
  context?: BiometricContext;
}

export interface BiometricMetrics {
  heartRate?: HeartRateData;
  heartRateVariability?: HRVData;
  bloodOxygen?: BloodOxygenData;
  bloodPressure?: BloodPressureData;
  temperature?: TemperatureData;
  activity?: ActivityData;
  sleep?: SleepData;
  stress?: StressData;
  ecg?: ECGData;
  glucose?: GlucoseData;
  brainwaves?: BrainwaveData;
  respiration?: RespirationData;
  skinConductance?: SkinConductanceData;
}

export interface HeartRateData {
  bpm: number;
  restingHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  averageHeartRate: number;
  zone: HeartRateZone;
  timestamp: Date;
}

export type HeartRateZone = 
  | 'resting'
  | 'light'
  | 'moderate'
  | 'vigorous'
  | 'peak'
  | 'maximum';

export interface HRVData {
  rmssd: number; // Root Mean Square of Successive Differences
  sdnn: number; // Standard Deviation of NN intervals
  pnn50: number; // Percentage of successive intervals differing by >50ms
  coherence: number; // HRV coherence score
  stressIndex: number;
  recoveryScore: number;
  timestamp: Date;
  analysis: HRVAnalysis;
}

export interface HRVAnalysis {
  autonomicBalance: 'sympathetic' | 'parasympathetic' | 'balanced';
  stressLevel: 'low' | 'moderate' | 'high' | 'very_high';
  recoveryStatus: 'recovered' | 'recovering' | 'strained' | 'overreached';
  readiness: number; // 0-100
  recommendations: string[];
}

export interface BloodOxygenData {
  spo2: number; // Percentage
  trend: 'stable' | 'increasing' | 'decreasing';
  alert: boolean;
  timestamp: Date;
}

export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  pulse: number;
  category: 'normal' | 'elevated' | 'high_stage1' | 'high_stage2' | 'crisis';
  timestamp: Date;
}

export interface TemperatureData {
  celsius: number;
  fahrenheit: number;
  deviation: number; // From baseline
  trend: 'stable' | 'rising' | 'falling';
  timestamp: Date;
}

export interface ActivityData {
  steps: number;
  distance: number; // meters
  calories: number;
  activeMinutes: number;
  sedentaryMinutes: number;
  floors: number;
  activityType?: ActivityType;
  intensity: 'low' | 'moderate' | 'high';
  timestamp: Date;
}

export type ActivityType = 
  | 'walking'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'yoga'
  | 'meditation'
  | 'strength_training'
  | 'cardio'
  | 'sports';

export interface SleepData {
  duration: number; // minutes
  efficiency: number; // percentage
  stages: SleepStages;
  interruptions: number;
  quality: SleepQuality;
  restfulness: number; // 0-100
  insights: SleepInsights;
  timestamp: Date;
}

export interface SleepStages {
  awake: number; // minutes
  light: number;
  deep: number;
  rem: number;
}

export interface SleepQuality {
  score: number; // 0-100
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  factors: QualityFactor[];
}

export interface QualityFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  score: number;
}

export interface SleepInsights {
  bedtime: Date;
  wakeTime: Date;
  latency: number; // Time to fall asleep
  consistency: number; // Sleep schedule consistency
  recommendations: string[];
  patterns: SleepPattern[];
}

export interface SleepPattern {
  type: 'insomnia' | 'apnea' | 'restless' | 'fragmented' | 'normal';
  frequency: number;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface StressData {
  level: number; // 0-100
  category: 'calm' | 'normal' | 'elevated' | 'high' | 'extreme';
  triggers?: string[];
  duration: number; // minutes
  physiologicalMarkers: PhysiologicalMarkers;
  copingScore: number; // 0-100
  timestamp: Date;
}

export interface PhysiologicalMarkers {
  cortisol?: number;
  heartRateElevation: number;
  hrvReduction: number;
  skinConductance?: number;
  respirationRate?: number;
}

export interface ECGData {
  rawData: number[];
  heartRate: number;
  intervals: ECGIntervals;
  abnormalities: ECGAbnormality[];
  interpretation: string;
  timestamp: Date;
}

export interface ECGIntervals {
  pr: number;
  qrs: number;
  qt: number;
  qtc: number; // Corrected QT
}

export interface ECGAbnormality {
  type: 'afib' | 'pvcs' | 'bradycardia' | 'tachycardia' | 'st_changes' | 'other';
  severity: 'benign' | 'concerning' | 'urgent';
  description: string;
}

export interface GlucoseData {
  mgDl: number;
  mmolL: number;
  trend: 'rising_rapidly' | 'rising' | 'stable' | 'falling' | 'falling_rapidly';
  category: 'low' | 'normal' | 'elevated' | 'high';
  mealContext?: 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime';
  timestamp: Date;
}

export interface BrainwaveData {
  alpha: number; // 8-12 Hz - Relaxation
  beta: number; // 12-30 Hz - Active thinking
  theta: number; // 4-8 Hz - Deep relaxation
  delta: number; // 0.5-4 Hz - Deep sleep
  gamma: number; // 30-100 Hz - High-level cognition
  dominantFrequency: number;
  mentalState: MentalState;
  focusScore: number; // 0-100
  calmScore: number; // 0-100
  timestamp: Date;
}

export interface MentalState {
  state: 'focused' | 'relaxed' | 'drowsy' | 'alert' | 'stressed' | 'meditative';
  confidence: number;
  recommendations: string[];
}

export interface RespirationData {
  rate: number; // breaths per minute
  depth: 'shallow' | 'normal' | 'deep';
  pattern: 'regular' | 'irregular' | 'rapid' | 'slow';
  variability: number;
  timestamp: Date;
}

export interface SkinConductanceData {
  microsiemens: number;
  arousal: 'low' | 'moderate' | 'high';
  emotionalResponse: number; // 0-100
  timestamp: Date;
}

export interface DataQuality {
  signalStrength: number; // 0-100
  accuracy: number; // 0-100
  completeness: number; // 0-100
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface BiometricContext {
  activity?: string;
  location?: string;
  weather?: WeatherContext;
  medication?: string[];
  notes?: string;
}

export interface WeatherContext {
  temperature: number;
  humidity: number;
  pressure: number;
  conditions: string;
}

export interface BiometricAlert {
  id: string;
  userId: string;
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  metric: string;
  value: any;
  threshold: any;
  message: string;
  recommendations: string[];
  timestamp: Date;
  acknowledged: boolean;
  escalated: boolean;
}

export type AlertType = 
  | 'heart_rate_abnormal'
  | 'hrv_low'
  | 'blood_oxygen_low'
  | 'blood_pressure_high'
  | 'stress_elevated'
  | 'sleep_disrupted'
  | 'glucose_abnormal'
  | 'fall_detected'
  | 'irregular_rhythm'
  | 'panic_detected';

export type AlertSeverity = 
  | 'info'
  | 'warning'
  | 'urgent'
  | 'critical'
  | 'emergency';

export interface BiometricTrend {
  metric: string;
  period: TrendPeriod;
  direction: 'improving' | 'stable' | 'declining';
  changePercent: number;
  significance: 'significant' | 'moderate' | 'minimal';
  dataPoints: TrendDataPoint[];
  forecast?: TrendForecast;
}

export type TrendPeriod = 
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly';

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  normalized: number; // 0-100
}

export interface TrendForecast {
  nextValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================
// Wearable Integration Service
// ============================

export class WearableIntegrationService extends EventEmitter {
  private static instance: WearableIntegrationService;
  private devices: Map<string, WearableDevice> = new Map();
  private dataStreams: Map<string, any> = new Map();
  private alertThresholds: Map<string, any> = new Map();
  private dataBuffer: Map<string, BiometricData[]> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // API Integrations
  private appleHealthKit?: any;
  private googleFit?: any;
  private fitbitAPI?: any;
  private garminConnect?: any;
  private whoopAPI?: any;
  private ouraAPI?: any;
  
  // WebBluetooth for direct device connection
  private bluetoothDevices: Map<string, BluetoothDevice> = new Map();
  
  private constructor() {
    super();
    this.initializeService();
  }

  public static getInstance(): WearableIntegrationService {
    if (!WearableIntegrationService.instance) {
      WearableIntegrationService.instance = new WearableIntegrationService();
    }
    return WearableIntegrationService.instance;
  }

  private async initializeService(): Promise<void> {
    // Initialize API connections
    await this.initializeAPIs();
    
    // Set default alert thresholds
    this.setDefaultAlertThresholds();
    
    // Start monitoring service
    this.startMonitoringService();
  }

  private async initializeAPIs(): Promise<void> {
    // Initialize various wearable APIs
    // In production, these would be actual SDK initializations
    
    // Apple HealthKit (iOS only)
    if (this.isIOS()) {
      // await this.initializeHealthKit();
    }
    
    // Google Fit (Android)
    if (this.isAndroid()) {
      // await this.initializeGoogleFit();
    }
    
    // Third-party APIs
    // await this.initializeFitbitAPI();
    // await this.initializeGarminConnect();
    // await this.initializeWhoopAPI();
    // await this.initializeOuraAPI();
  }

  private setDefaultAlertThresholds(): void {
    // Heart Rate thresholds
    this.alertThresholds.set('heartRate', {
      low: 40,
      high: 120,
      criticalLow: 30,
      criticalHigh: 150
    });
    
    // HRV thresholds
    this.alertThresholds.set('hrv', {
      low: 20,
      criticalLow: 15
    });
    
    // Blood Oxygen thresholds
    this.alertThresholds.set('bloodOxygen', {
      low: 92,
      criticalLow: 88
    });
    
    // Blood Pressure thresholds
    this.alertThresholds.set('bloodPressure', {
      systolicHigh: 140,
      diastolicHigh: 90,
      systolicCritical: 180,
      diastolicCritical: 120
    });
    
    // Stress thresholds
    this.alertThresholds.set('stress', {
      elevated: 70,
      high: 85,
      critical: 95
    });
    
    // Glucose thresholds
    this.alertThresholds.set('glucose', {
      low: 70,
      high: 180,
      criticalLow: 54,
      criticalHigh: 250
    });
  }

  private startMonitoringService(): void {
    // Start continuous monitoring
    setInterval(() => {
      this.processBufferedData();
      this.checkAlertConditions();
      this.analyzeTrends();
    }, 60000); // Check every minute
  }

  // ============================
  // Public Methods
  // ============================

  public async connectDevice(
    type: DeviceType,
    brand: DeviceBrand,
    userId: string
  ): Promise<WearableDevice> {
    const deviceId = this.generateDeviceId();
    
    try {
      // Attempt connection based on device type
      let connectionResult;
      
      if (brand === 'apple') {
        connectionResult = await this.connectAppleDevice(type);
      } else if (brand === 'fitbit') {
        connectionResult = await this.connectFitbitDevice(type);
      } else if (brand === 'garmin') {
        connectionResult = await this.connectGarminDevice(type);
      } else if (this.supportsWebBluetooth()) {
        connectionResult = await this.connectBluetoothDevice(type);
      } else {
        connectionResult = await this.connectViaAPI(brand, type);
      }
      
      const device: WearableDevice = {
        id: deviceId,
        type,
        brand,
        model: connectionResult.model || 'Unknown',
        connectionStatus: 'connected',
        batteryLevel: connectionResult.batteryLevel || 100,
        firmwareVersion: connectionResult.firmwareVersion || '1.0.0',
        capabilities: this.detectCapabilities(type, brand),
        lastSync: new Date(),
        userId,
        pairingCode: connectionResult.pairingCode
      };
      
      this.devices.set(deviceId, device);
      
      // Start data sync
      this.startDataSync(device);
      
      this.emit('device:connected', device);
      return device;
      
    } catch (error) {
      console.error('Failed to connect device:', error);
      throw error;
    }
  }

  public async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }
    
    // Stop data sync
    this.stopDataSync(deviceId);
    
    // Disconnect based on connection type
    if (this.bluetoothDevices.has(deviceId)) {
      const btDevice = this.bluetoothDevices.get(deviceId);
      if (btDevice?.gatt?.connected) {
        await btDevice.gatt.disconnect();
      }
      this.bluetoothDevices.delete(deviceId);
    }
    
    // Clear data streams
    this.dataStreams.delete(deviceId);
    this.dataBuffer.delete(deviceId);
    
    // Update device status
    device.connectionStatus = 'disconnected';
    
    this.emit('device:disconnected', device);
  }

  public async syncDeviceData(deviceId: string): Promise<BiometricData> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }
    
    try {
      let data: BiometricData;
      
      // Fetch data based on device brand
      switch (device.brand) {
        case 'apple':
          data = await this.fetchAppleHealthData(device);
          break;
        case 'fitbit':
          data = await this.fetchFitbitData(device);
          break;
        case 'garmin':
          data = await this.fetchGarminData(device);
          break;
        case 'whoop':
          data = await this.fetchWhoopData(device);
          break;
        case 'oura':
          data = await this.fetchOuraData(device);
          break;
        default:
          data = await this.fetchGenericData(device);
      }
      
      // Buffer data for processing
      if (!this.dataBuffer.has(deviceId)) {
        this.dataBuffer.set(deviceId, []);
      }
      this.dataBuffer.get(deviceId)!.push(data);
      
      // Update last sync
      device.lastSync = new Date();
      
      // Check for alerts
      await this.checkDataAlerts(data);
      
      this.emit('data:synced', { deviceId, data });
      return data;
      
    } catch (error) {
      console.error('Failed to sync device data:', error);
      device.connectionStatus = 'error';
      throw error;
    }
  }

  public async getHeartRateVariability(
    userId: string,
    period: TrendPeriod = 'daily'
  ): Promise<HRVAnalysis> {
    const userDevices = this.getUserDevices(userId);
    const hrvCapableDevice = userDevices.find(d => d.capabilities.heartRateVariability);
    
    if (!hrvCapableDevice) {
      throw new Error('No HRV-capable device connected');
    }
    
    const data = this.dataBuffer.get(hrvCapableDevice.id) || [];
    const hrvData = data
      .filter(d => d.metrics.heartRateVariability)
      .map(d => d.metrics.heartRateVariability!);
    
    if (hrvData.length === 0) {
      throw new Error('No HRV data available');
    }
    
    // Analyze HRV data
    const analysis = this.analyzeHRV(hrvData);
    
    // Generate recommendations
    analysis.recommendations = this.generateHRVRecommendations(analysis);
    
    return analysis;
  }

  public async getSleepAnalysis(
    userId: string,
    date?: Date
  ): Promise<SleepInsights> {
    const userDevices = this.getUserDevices(userId);
    const sleepCapableDevice = userDevices.find(d => d.capabilities.sleep);
    
    if (!sleepCapableDevice) {
      throw new Error('No sleep-capable device connected');
    }
    
    const data = this.dataBuffer.get(sleepCapableDevice.id) || [];
    const sleepData = data
      .filter(d => d.metrics.sleep)
      .map(d => d.metrics.sleep!)
      .filter(s => !date || this.isSameDay(s.timestamp, date));
    
    if (sleepData.length === 0) {
      throw new Error('No sleep data available');
    }
    
    // Analyze sleep patterns
    const insights = this.analyzeSleep(sleepData);
    
    // Generate recommendations
    insights.recommendations = this.generateSleepRecommendations(insights);
    
    return insights;
  }

  public async getStressLevel(userId: string): Promise<StressData> {
    const userDevices = this.getUserDevices(userId);
    const stressCapableDevice = userDevices.find(d => d.capabilities.stress);
    
    if (!stressCapableDevice) {
      // Calculate stress from HRV if available
      return this.calculateStressFromHRV(userId);
    }
    
    const data = this.dataBuffer.get(stressCapableDevice.id) || [];
    const latestData = data[data.length - 1];
    
    if (!latestData?.metrics.stress) {
      throw new Error('No stress data available');
    }
    
    return latestData.metrics.stress;
  }

  public async startContinuousMonitoring(
    deviceId: string,
    metrics: string[],
    callback: (data: BiometricData) => void
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }
    
    // Set up real-time data stream
    const stream = await this.createDataStream(device, metrics);
    this.dataStreams.set(deviceId, stream);
    
    // Handle incoming data
    stream.on('data', (data: BiometricData) => {
      // Buffer data
      if (!this.dataBuffer.has(deviceId)) {
        this.dataBuffer.set(deviceId, []);
      }
      this.dataBuffer.get(deviceId)!.push(data);
      
      // Check alerts
      this.checkDataAlerts(data);
      
      // Invoke callback
      callback(data);
      
      // Emit event
      this.emit('data:received', { deviceId, data });
    });
    
    stream.on('error', (error: Error) => {
      console.error('Stream error:', error);
      this.emit('stream:error', { deviceId, error });
    });
  }

  public async stopContinuousMonitoring(deviceId: string): Promise<void> {
    const stream = this.dataStreams.get(deviceId);
    if (stream) {
      stream.destroy();
      this.dataStreams.delete(deviceId);
    }
  }

  public async detectAbnormalPatterns(
    userId: string,
    metric: string
  ): Promise<BiometricAlert[]> {
    const alerts: BiometricAlert[] = [];
    const userDevices = this.getUserDevices(userId);
    
    for (const device of userDevices) {
      const data = this.dataBuffer.get(device.id) || [];
      const patterns = this.analyzePatterns(data, metric);
      
      for (const pattern of patterns) {
        if (pattern.abnormal) {
          alerts.push({
            id: this.generateAlertId(),
            userId,
            deviceId: device.id,
            type: this.getAlertType(metric, pattern),
            severity: this.getAlertSeverity(pattern),
            metric,
            value: pattern.value,
            threshold: pattern.threshold,
            message: pattern.message,
            recommendations: pattern.recommendations,
            timestamp: new Date(),
            acknowledged: false,
            escalated: false
          });
        }
      }
    }
    
    return alerts;
  }

  public async generateHealthReport(userId: string): Promise<HealthReport> {
    const userDevices = this.getUserDevices(userId);
    const allData: BiometricData[] = [];
    
    // Collect all data
    for (const device of userDevices) {
      const data = this.dataBuffer.get(device.id) || [];
      allData.push(...data);
    }
    
    // Generate comprehensive report
    const report: HealthReport = {
      userId,
      generatedAt: new Date(),
      period: 'last_30_days',
      summary: this.generateHealthSummary(allData),
      metrics: this.aggregateMetrics(allData),
      trends: this.analyzeTrendsForReport(allData),
      alerts: await this.detectAbnormalPatterns(userId, 'all'),
      recommendations: this.generateHealthRecommendations(allData),
      riskFactors: this.identifyRiskFactors(allData),
      improvements: this.identifyImprovements(allData)
    };
    
    return report;
  }

  // ============================
  // Device Connection Methods
  // ============================

  private async connectBluetoothDevice(type: DeviceType): Promise<any> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API not supported');
    }
    
    try {
      // Request device with appropriate service UUIDs
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['battery_service'] },
          { services: this.getServiceUUID(type) }
        ],
        optionalServices: ['device_information']
      });
      
      // Connect to GATT server
      const server = await device.gatt!.connect();
      
      // Get device information
      const deviceInfo = await this.getBluetoothDeviceInfo(server);
      
      // Store bluetooth device
      this.bluetoothDevices.set(device.id, device);
      
      return {
        model: device.name,
        batteryLevel: await this.getBatteryLevel(server),
        firmwareVersion: deviceInfo.firmwareVersion,
        pairingCode: device.id
      };
      
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      throw error;
    }
  }

  private async getBluetoothDeviceInfo(server: BluetoothRemoteGATTServer): Promise<any> {
    try {
      const service = await server.getPrimaryService('device_information');
      
      const manufacturerChar = await service.getCharacteristic('manufacturer_name_string');
      const manufacturer = await manufacturerChar.readValue();
      
      const firmwareChar = await service.getCharacteristic('firmware_revision_string');
      const firmware = await firmwareChar.readValue();
      
      return {
        manufacturer: new TextDecoder().decode(manufacturer),
        firmwareVersion: new TextDecoder().decode(firmware)
      };
    } catch {
      return { manufacturer: 'Unknown', firmwareVersion: '1.0.0' };
    }
  }

  private async getBatteryLevel(server: BluetoothRemoteGATTServer): Promise<number> {
    try {
      const service = await server.getPrimaryService('battery_service');
      const characteristic = await service.getCharacteristic('battery_level');
      const value = await characteristic.readValue();
      return value.getUint8(0);
    } catch {
      return 100; // Default if battery service not available
    }
  }

  private getServiceUUID(type: DeviceType): string {
    const uuidMap: Record<DeviceType, string> = {
      'smartwatch': '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
      'fitness_tracker': '0000180d-0000-1000-8000-00805f9b34fb',
      'heart_rate_monitor': '0000180d-0000-1000-8000-00805f9b34fb',
      'sleep_tracker': '00001800-0000-1000-8000-00805f9b34fb',
      'stress_sensor': '00001801-0000-1000-8000-00805f9b34fb',
      'glucose_monitor': '00001808-0000-1000-8000-00805f9b34fb', // Glucose Service
      'blood_pressure_monitor': '00001810-0000-1000-8000-00805f9b34fb', // Blood Pressure Service
      'pulse_oximeter': '0000180e-0000-1000-8000-00805f9b34fb',
      'eeg_headband': '00001802-0000-1000-8000-00805f9b34fb',
      'smart_ring': '0000180f-0000-1000-8000-00805f9b34fb'
    };
    return uuidMap[type] || '00001800-0000-1000-8000-00805f9b34fb';
  }

  private async connectAppleDevice(type: DeviceType): Promise<any> {
    // Apple HealthKit integration (iOS only)
    // This would use native iOS APIs through a bridge
    return {
      model: 'Apple Watch',
      batteryLevel: 100,
      firmwareVersion: 'watchOS 10.0'
    };
  }

  private async connectFitbitDevice(type: DeviceType): Promise<any> {
    // Fitbit OAuth flow
    // In production, this would redirect to Fitbit authorization
    return {
      model: 'Fitbit Sense',
      batteryLevel: 85,
      firmwareVersion: '1.2.3'
    };
  }

  private async connectGarminDevice(type: DeviceType): Promise<any> {
    // Garmin Connect IQ integration
    return {
      model: 'Garmin Venu 3',
      batteryLevel: 92,
      firmwareVersion: '2.1.0'
    };
  }

  private async connectViaAPI(brand: DeviceBrand, type: DeviceType): Promise<any> {
    // Generic API connection for other brands
    return {
      model: `${brand} ${type}`,
      batteryLevel: 100,
      firmwareVersion: '1.0.0'
    };
  }

  // ============================
  // Data Fetching Methods
  // ============================

  private async fetchAppleHealthData(device: WearableDevice): Promise<BiometricData> {
    // Fetch from HealthKit
    // In production, this would use native iOS APIs
    return this.generateMockBiometricData(device);
  }

  private async fetchFitbitData(device: WearableDevice): Promise<BiometricData> {
    // Fetch from Fitbit API
    // In production, this would make actual API calls
    return this.generateMockBiometricData(device);
  }

  private async fetchGarminData(device: WearableDevice): Promise<BiometricData> {
    // Fetch from Garmin Connect
    return this.generateMockBiometricData(device);
  }

  private async fetchWhoopData(device: WearableDevice): Promise<BiometricData> {
    // Fetch from Whoop API
    return this.generateMockBiometricData(device);
  }

  private async fetchOuraData(device: WearableDevice): Promise<BiometricData> {
    // Fetch from Oura API
    return this.generateMockBiometricData(device);
  }

  private async fetchGenericData(device: WearableDevice): Promise<BiometricData> {
    // Generic data fetching
    return this.generateMockBiometricData(device);
  }

  private generateMockBiometricData(device: WearableDevice): BiometricData {
    const metrics: BiometricMetrics = {};
    
    if (device.capabilities.heartRate) {
      metrics.heartRate = {
        bpm: 65 + Math.random() * 20,
        restingHeartRate: 60,
        maxHeartRate: 180,
        minHeartRate: 45,
        averageHeartRate: 70,
        zone: 'light',
        timestamp: new Date()
      };
    }
    
    if (device.capabilities.heartRateVariability) {
      metrics.heartRateVariability = {
        rmssd: 30 + Math.random() * 20,
        sdnn: 40 + Math.random() * 30,
        pnn50: 15 + Math.random() * 10,
        coherence: 0.7 + Math.random() * 0.3,
        stressIndex: Math.random() * 100,
        recoveryScore: 60 + Math.random() * 40,
        timestamp: new Date(),
        analysis: {
          autonomicBalance: 'balanced',
          stressLevel: 'moderate',
          recoveryStatus: 'recovering',
          readiness: 75,
          recommendations: []
        }
      };
    }
    
    if (device.capabilities.bloodOxygen) {
      metrics.bloodOxygen = {
        spo2: 95 + Math.random() * 4,
        trend: 'stable',
        alert: false,
        timestamp: new Date()
      };
    }
    
    if (device.capabilities.stress) {
      metrics.stress = {
        level: Math.random() * 100,
        category: 'normal',
        duration: Math.random() * 60,
        physiologicalMarkers: {
          heartRateElevation: Math.random() * 20,
          hrvReduction: Math.random() * 30,
          skinConductance: Math.random() * 10,
          respirationRate: 12 + Math.random() * 8
        },
        copingScore: 60 + Math.random() * 40,
        timestamp: new Date()
      };
    }
    
    if (device.capabilities.sleep) {
      const totalSleep = 360 + Math.random() * 180; // 6-9 hours
      metrics.sleep = {
        duration: totalSleep,
        efficiency: 70 + Math.random() * 30,
        stages: {
          awake: totalSleep * 0.05,
          light: totalSleep * 0.5,
          deep: totalSleep * 0.2,
          rem: totalSleep * 0.25
        },
        interruptions: Math.floor(Math.random() * 5),
        quality: {
          score: 60 + Math.random() * 40,
          rating: 'good',
          factors: []
        },
        restfulness: 60 + Math.random() * 40,
        insights: {
          bedtime: new Date(Date.now() - totalSleep * 60000 - 3600000),
          wakeTime: new Date(Date.now() - 3600000),
          latency: Math.random() * 30,
          consistency: 70 + Math.random() * 30,
          recommendations: [],
          patterns: []
        },
        timestamp: new Date()
      };
    }
    
    return {
      deviceId: device.id,
      userId: device.userId,
      timestamp: new Date(),
      metrics,
      quality: {
        signalStrength: 80 + Math.random() * 20,
        accuracy: 85 + Math.random() * 15,
        completeness: 90 + Math.random() * 10,
        reliability: 'good'
      }
    };
  }

  // ============================
  // Analysis Methods
  // ============================

  private analyzeHRV(hrvData: HRVData[]): HRVAnalysis {
    const latestHRV = hrvData[hrvData.length - 1];
    const avgRMSSD = hrvData.reduce((sum, d) => sum + d.rmssd, 0) / hrvData.length;
    
    let autonomicBalance: HRVAnalysis['autonomicBalance'] = 'balanced';
    if (avgRMSSD < 20) autonomicBalance = 'sympathetic';
    else if (avgRMSSD > 50) autonomicBalance = 'parasympathetic';
    
    let stressLevel: HRVAnalysis['stressLevel'] = 'low';
    if (latestHRV.stressIndex > 70) stressLevel = 'high';
    else if (latestHRV.stressIndex > 50) stressLevel = 'moderate';
    
    let recoveryStatus: HRVAnalysis['recoveryStatus'] = 'recovered';
    if (latestHRV.recoveryScore < 40) recoveryStatus = 'overreached';
    else if (latestHRV.recoveryScore < 60) recoveryStatus = 'strained';
    else if (latestHRV.recoveryScore < 80) recoveryStatus = 'recovering';
    
    return {
      autonomicBalance,
      stressLevel,
      recoveryStatus,
      readiness: latestHRV.recoveryScore,
      recommendations: []
    };
  }

  private generateHRVRecommendations(analysis: HRVAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.stressLevel === 'high' || analysis.stressLevel === 'very_high') {
      recommendations.push('Practice deep breathing exercises for 5-10 minutes');
      recommendations.push('Consider a short meditation session');
      recommendations.push('Take regular breaks from stressful activities');
    }
    
    if (analysis.recoveryStatus === 'overreached' || analysis.recoveryStatus === 'strained') {
      recommendations.push('Prioritize sleep tonight (aim for 8+ hours)');
      recommendations.push('Reduce training intensity today');
      recommendations.push('Stay hydrated and eat nutritious foods');
    }
    
    if (analysis.autonomicBalance === 'sympathetic') {
      recommendations.push('Engage in relaxing activities');
      recommendations.push('Try progressive muscle relaxation');
      recommendations.push('Limit caffeine intake');
    }
    
    return recommendations;
  }

  private analyzeSleep(sleepData: SleepData[]): SleepInsights {
    const latestSleep = sleepData[sleepData.length - 1];
    const avgDuration = sleepData.reduce((sum, d) => sum + d.duration, 0) / sleepData.length;
    
    const patterns: SleepPattern[] = [];
    
    // Detect insomnia pattern
    if (latestSleep.insights.latency > 30) {
      patterns.push({
        type: 'insomnia',
        frequency: sleepData.filter(d => d.insights.latency > 30).length,
        severity: latestSleep.insights.latency > 60 ? 'severe' : 'mild'
      });
    }
    
    // Detect fragmented sleep
    if (latestSleep.interruptions > 5) {
      patterns.push({
        type: 'fragmented',
        frequency: sleepData.filter(d => d.interruptions > 5).length,
        severity: latestSleep.interruptions > 10 ? 'severe' : 'moderate'
      });
    }
    
    return {
      ...latestSleep.insights,
      patterns,
      recommendations: []
    };
  }

  private generateSleepRecommendations(insights: SleepInsights): string[] {
    const recommendations: string[] = [];
    
    if (insights.latency > 30) {
      recommendations.push('Establish a consistent bedtime routine');
      recommendations.push('Avoid screens 1 hour before bed');
      recommendations.push('Try relaxation techniques before sleep');
    }
    
    if (insights.consistency < 70) {
      recommendations.push('Go to bed and wake up at the same time daily');
      recommendations.push('Avoid sleeping in on weekends');
    }
    
    insights.patterns.forEach(pattern => {
      if (pattern.type === 'insomnia' && pattern.severity !== 'mild') {
        recommendations.push('Consider cognitive behavioral therapy for insomnia (CBT-I)');
      }
      if (pattern.type === 'apnea') {
        recommendations.push('Consult with a sleep specialist about possible sleep apnea');
      }
    });
    
    return recommendations;
  }

  private async calculateStressFromHRV(userId: string): Promise<StressData> {
    try {
      const hrvAnalysis = await this.getHeartRateVariability(userId, 'hourly');
      
      let level = 50; // Default moderate
      let category: StressData['category'] = 'normal';
      
      if (hrvAnalysis.stressLevel === 'very_high') {
        level = 90;
        category = 'extreme';
      } else if (hrvAnalysis.stressLevel === 'high') {
        level = 75;
        category = 'high';
      } else if (hrvAnalysis.stressLevel === 'moderate') {
        level = 50;
        category = 'elevated';
      } else {
        level = 25;
        category = 'calm';
      }
      
      return {
        level,
        category,
        duration: 0,
        physiologicalMarkers: {
          heartRateElevation: 0,
          hrvReduction: 0
        },
        copingScore: 100 - level,
        timestamp: new Date()
      };
    } catch {
      // Return default if no HRV data
      return {
        level: 50,
        category: 'normal',
        duration: 0,
        physiologicalMarkers: {
          heartRateElevation: 0,
          hrvReduction: 0
        },
        copingScore: 50,
        timestamp: new Date()
      };
    }
  }

  private async checkDataAlerts(data: BiometricData): Promise<void> {
    const alerts: BiometricAlert[] = [];
    
    // Check heart rate
    if (data.metrics.heartRate) {
      const hr = data.metrics.heartRate.bpm;
      const thresholds = this.alertThresholds.get('heartRate');
      
      if (hr < thresholds.criticalLow || hr > thresholds.criticalHigh) {
        alerts.push(this.createAlert(
          data,
          'heart_rate_abnormal',
          'critical',
          'Heart Rate',
          hr,
          thresholds,
          `Critical heart rate: ${hr} bpm`
        ));
      } else if (hr < thresholds.low || hr > thresholds.high) {
        alerts.push(this.createAlert(
          data,
          'heart_rate_abnormal',
          'warning',
          'Heart Rate',
          hr,
          thresholds,
          `Abnormal heart rate: ${hr} bpm`
        ));
      }
    }
    
    // Check blood oxygen
    if (data.metrics.bloodOxygen) {
      const spo2 = data.metrics.bloodOxygen.spo2;
      const thresholds = this.alertThresholds.get('bloodOxygen');
      
      if (spo2 < thresholds.criticalLow) {
        alerts.push(this.createAlert(
          data,
          'blood_oxygen_low',
          'emergency',
          'Blood Oxygen',
          spo2,
          thresholds,
          `Critical low oxygen: ${spo2}%`
        ));
      } else if (spo2 < thresholds.low) {
        alerts.push(this.createAlert(
          data,
          'blood_oxygen_low',
          'urgent',
          'Blood Oxygen',
          spo2,
          thresholds,
          `Low oxygen saturation: ${spo2}%`
        ));
      }
    }
    
    // Check stress
    if (data.metrics.stress) {
      const stress = data.metrics.stress.level;
      const thresholds = this.alertThresholds.get('stress');
      
      if (stress > thresholds.critical) {
        alerts.push(this.createAlert(
          data,
          'stress_elevated',
          'urgent',
          'Stress',
          stress,
          thresholds,
          `Critical stress level detected`
        ));
      } else if (stress > thresholds.high) {
        alerts.push(this.createAlert(
          data,
          'stress_elevated',
          'warning',
          'Stress',
          stress,
          thresholds,
          `High stress level: ${stress}/100`
        ));
      }
    }
    
    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert:triggered', alert);
      
      // Store alert for history
      // await this.storeAlert(alert);
      
      // Check if escalation needed
      if (alert.severity === 'emergency' || alert.severity === 'critical') {
        this.escalateAlert(alert);
      }
    }
  }

  private createAlert(
    data: BiometricData,
    type: AlertType,
    severity: AlertSeverity,
    metric: string,
    value: any,
    thresholds: any,
    message: string
  ): BiometricAlert {
    return {
      id: this.generateAlertId(),
      userId: data.userId,
      deviceId: data.deviceId,
      type,
      severity,
      metric,
      value,
      threshold: thresholds,
      message,
      recommendations: this.getAlertRecommendations(type, severity),
      timestamp: new Date(),
      acknowledged: false,
      escalated: false
    };
  }

  private getAlertRecommendations(type: AlertType, severity: AlertSeverity): string[] {
    const recommendations: string[] = [];
    
    switch (type) {
      case 'heart_rate_abnormal':
        if (severity === 'critical' || severity === 'emergency') {
          recommendations.push('Seek immediate medical attention');
          recommendations.push('Call emergency services if experiencing chest pain');
        } else {
          recommendations.push('Rest and monitor your heart rate');
          recommendations.push('Avoid strenuous activities');
          recommendations.push('Contact your healthcare provider if persists');
        }
        break;
        
      case 'blood_oxygen_low':
        if (severity === 'emergency') {
          recommendations.push('Seek emergency medical care immediately');
        } else {
          recommendations.push('Take deep breaths');
          recommendations.push('Check sensor placement');
          recommendations.push('Monitor closely and seek help if worsens');
        }
        break;
        
      case 'stress_elevated':
        recommendations.push('Practice deep breathing exercises');
        recommendations.push('Take a break from current activities');
        recommendations.push('Try a guided meditation');
        recommendations.push('Consider talking to someone');
        break;
        
      case 'sleep_disrupted':
        recommendations.push('Review sleep hygiene practices');
        recommendations.push('Limit screen time before bed');
        recommendations.push('Consider relaxation techniques');
        break;
    }
    
    return recommendations;
  }

  private escalateAlert(alert: BiometricAlert): void {
    alert.escalated = true;
    
    // Notify emergency contacts
    this.emit('alert:escalated', alert);
    
    // In production, would trigger actual emergency protocols
    console.error('EMERGENCY ALERT:', alert);
  }

  private analyzePatterns(data: BiometricData[], metric: string): any[] {
    // Pattern analysis logic
    return [];
  }

  private getAlertType(metric: string, pattern: any): AlertType {
    // Map metric and pattern to alert type
    return 'heart_rate_abnormal';
  }

  private getAlertSeverity(pattern: any): AlertSeverity {
    // Determine severity based on pattern
    return 'warning';
  }

  private processBufferedData(): void {
    // Process buffered data for insights
    this.dataBuffer.forEach((data, deviceId) => {
      if (data.length > 100) {
        // Keep only recent data
        this.dataBuffer.set(deviceId, data.slice(-100));
      }
    });
  }

  private checkAlertConditions(): void {
    // Check for alert conditions across all devices
    this.devices.forEach(device => {
      const data = this.dataBuffer.get(device.id);
      if (data && data.length > 0) {
        const latestData = data[data.length - 1];
        this.checkDataAlerts(latestData);
      }
    });
  }

  private analyzeTrends(): void {
    // Analyze trends across all metrics
    this.devices.forEach(device => {
      const data = this.dataBuffer.get(device.id);
      if (data && data.length > 10) {
        const trends = this.calculateTrends(data);
        this.emit('trends:updated', { deviceId: device.id, trends });
      }
    });
  }

  private calculateTrends(data: BiometricData[]): BiometricTrend[] {
    const trends: BiometricTrend[] = [];
    
    // Calculate heart rate trend
    const heartRateData = data.filter(d => d.metrics.heartRate);
    if (heartRateData.length > 5) {
      const hrValues = heartRateData.map(d => d.metrics.heartRate!.bpm);
      const trend = this.calculateTrendDirection(hrValues);
      
      trends.push({
        metric: 'heartRate',
        period: 'daily',
        direction: trend.direction,
        changePercent: trend.changePercent,
        significance: trend.significance,
        dataPoints: hrValues.map((v, i) => ({
          timestamp: heartRateData[i].timestamp,
          value: v,
          normalized: (v - 40) / 140 * 100
        }))
      });
    }
    
    return trends;
  }

  private calculateTrendDirection(values: number[]): {
    direction: 'improving' | 'stable' | 'declining';
    changePercent: number;
    significance: 'significant' | 'moderate' | 'minimal';
  } {
    if (values.length < 2) {
      return { direction: 'stable', changePercent: 0, significance: 'minimal' };
    }
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (changePercent > 5) direction = 'improving';
    else if (changePercent < -5) direction = 'declining';
    
    let significance: 'significant' | 'moderate' | 'minimal' = 'minimal';
    if (Math.abs(changePercent) > 20) significance = 'significant';
    else if (Math.abs(changePercent) > 10) significance = 'moderate';
    
    return { direction, changePercent, significance };
  }

  private async createDataStream(device: WearableDevice, metrics: string[]): Promise<any> {
    // Create real-time data stream
    // In production, this would connect to device's streaming API
    const stream = new EventEmitter();
    
    // Simulate data stream
    const interval = setInterval(() => {
      if (device.connectionStatus === 'connected') {
        const data = this.generateMockBiometricData(device);
        stream.emit('data', data);
      }
    }, 5000); // Every 5 seconds
    
    // Clean up on destroy
    (stream as any).destroy = () => {
      clearInterval(interval);
    };
    
    return stream;
  }

  private startDataSync(device: WearableDevice): void {
    // Start periodic data sync
    const syncInterval = setInterval(async () => {
      if (device.connectionStatus === 'connected') {
        try {
          await this.syncDeviceData(device.id);
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
    }, 60000); // Every minute
    
    this.syncIntervals.set(device.id, syncInterval);
  }

  private stopDataSync(deviceId: string): void {
    const interval = this.syncIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(deviceId);
    }
  }

  private detectCapabilities(type: DeviceType, brand: DeviceBrand): DeviceCapabilities {
    // Default capabilities based on device type
    const capabilities: DeviceCapabilities = {
      heartRate: false,
      heartRateVariability: false,
      bloodOxygen: false,
      bloodPressure: false,
      temperature: false,
      steps: false,
      calories: false,
      distance: false,
      sleep: false,
      stress: false,
      ecg: false,
      glucose: false,
      brainwaves: false,
      respiration: false,
      skinConductance: false
    };
    
    // Set capabilities based on device type
    switch (type) {
      case 'smartwatch':
        capabilities.heartRate = true;
        capabilities.heartRateVariability = true;
        capabilities.bloodOxygen = true;
        capabilities.steps = true;
        capabilities.calories = true;
        capabilities.distance = true;
        capabilities.sleep = true;
        capabilities.stress = true;
        if (brand === 'apple') capabilities.ecg = true;
        break;
        
      case 'fitness_tracker':
        capabilities.heartRate = true;
        capabilities.steps = true;
        capabilities.calories = true;
        capabilities.distance = true;
        capabilities.sleep = true;
        break;
        
      case 'heart_rate_monitor':
        capabilities.heartRate = true;
        capabilities.heartRateVariability = true;
        break;
        
      case 'sleep_tracker':
        capabilities.sleep = true;
        capabilities.heartRate = true;
        capabilities.respiration = true;
        break;
        
      case 'stress_sensor':
        capabilities.stress = true;
        capabilities.heartRateVariability = true;
        capabilities.skinConductance = true;
        break;
        
      case 'glucose_monitor':
        capabilities.glucose = true;
        break;
        
      case 'blood_pressure_monitor':
        capabilities.bloodPressure = true;
        capabilities.heartRate = true;
        break;
        
      case 'pulse_oximeter':
        capabilities.bloodOxygen = true;
        capabilities.heartRate = true;
        break;
        
      case 'eeg_headband':
        capabilities.brainwaves = true;
        break;
        
      case 'smart_ring':
        capabilities.heartRate = true;
        capabilities.heartRateVariability = true;
        capabilities.sleep = true;
        capabilities.temperature = true;
        break;
    }
    
    return capabilities;
  }

  private getUserDevices(userId: string): WearableDevice[] {
    return Array.from(this.devices.values()).filter(d => d.userId === userId);
  }

  private generateHealthSummary(data: BiometricData[]): any {
    // Generate health summary from data
    return {
      overallHealth: 'good',
      keyMetrics: {},
      improvements: [],
      concerns: []
    };
  }

  private aggregateMetrics(data: BiometricData[]): any {
    // Aggregate metrics from data
    return {};
  }

  private analyzeTrendsForReport(data: BiometricData[]): BiometricTrend[] {
    // Analyze trends for health report
    return [];
  }

  private generateHealthRecommendations(data: BiometricData[]): string[] {
    // Generate health recommendations
    return [];
  }

  private identifyRiskFactors(data: BiometricData[]): string[] {
    // Identify health risk factors
    return [];
  }

  private identifyImprovements(data: BiometricData[]): string[] {
    // Identify areas of improvement
    return [];
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  private isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  private supportsWebBluetooth(): boolean {
    return 'bluetooth' in navigator;
  }

  private generateDeviceId(): string {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Health Report interface
interface HealthReport {
  userId: string;
  generatedAt: Date;
  period: string;
  summary: any;
  metrics: any;
  trends: BiometricTrend[];
  alerts: BiometricAlert[];
  recommendations: string[];
  riskFactors: string[];
  improvements: string[];
}

// Export singleton instance
export const wearableService = WearableIntegrationService.getInstance();

// Export convenience functions
export const connectWearableDevice = (
  type: DeviceType,
  brand: DeviceBrand,
  userId: string
) => wearableService.connectDevice(type, brand, userId);

export const syncWearableData = (deviceId: string) =>
  wearableService.syncDeviceData(deviceId);

export const getHeartRateVariability = (userId: string, period?: TrendPeriod) =>
  wearableService.getHeartRateVariability(userId, period);

export const getSleepAnalysis = (userId: string, date?: Date) =>
  wearableService.getSleepAnalysis(userId, date);

export const getStressLevel = (userId: string) =>
  wearableService.getStressLevel(userId);

export const startBiometricMonitoring = (
  deviceId: string,
  metrics: string[],
  callback: (data: BiometricData) => void
) => wearableService.startContinuousMonitoring(deviceId, metrics, callback);

export const generateHealthReport = (userId: string) =>
  wearableService.generateHealthReport(userId);