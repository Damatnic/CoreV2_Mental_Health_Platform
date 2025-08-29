/**
 * Comprehensive Biometric Monitoring Service
 * Integrates with multiple wearable devices and health platforms
 * to provide real-time biometric data for mental health correlation
 */

import { EventEmitter } from 'events';

// Biometric data types
export interface BiometricData {
  timestamp: Date;
  heartRate?: number;
  heartRateVariability?: number; // HRV in milliseconds
  respiratoryRate?: number; // breaths per minute
  bloodOxygen?: number; // SpO2 percentage
  skinTemperature?: number; // in Celsius
  steps?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
  stressLevel?: number; // 0-100 scale
  sleepData?: SleepData;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'vigorous';
}

export interface SleepData {
  totalSleepMinutes: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  lightSleepMinutes: number;
  awakeMinutes: number;
  sleepEfficiency: number; // percentage
  sleepQualityScore: number; // 0-100
  restlessness: number; // movement count
}

export interface WearableDevice {
  id: string;
  type: 'fitbit' | 'apple_watch' | 'garmin' | 'samsung' | 'whoop' | 'oura';
  name: string;
  connected: boolean;
  lastSync: Date;
  batteryLevel?: number;
  capabilities: string[];
}

export interface StressIndicators {
  physiologicalStress: number; // 0-100
  mentalStress: number; // 0-100 (derived from HRV patterns)
  recoveryScore: number; // 0-100
  needsIntervention: boolean;
  recommendations: string[];
}

export interface HealthCorrelation {
  moodScore: number;
  physicalActivityImpact: number; // -1 to 1
  sleepQualityImpact: number; // -1 to 1
  stressPhysiologicalCorrelation: number; // -1 to 1
  hrvTrend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

// API Configuration for different platforms
interface APIConfig {
  baseUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
}

const API_CONFIGS: Record<string, APIConfig> = {
  fitbit: {
    baseUrl: 'https://api.fitbit.com/1/user',
    clientId: process.env.VITE_FITBIT_CLIENT_ID || '',
    clientSecret: process.env.VITE_FITBIT_CLIENT_SECRET,
    redirectUri: `${window.location.origin}/auth/fitbit/callback`,
    scopes: ['activity', 'heartrate', 'sleep', 'respiratory_rate', 'cardio_fitness', 'temperature']
  },
  apple_health: {
    baseUrl: 'https://api.apple.com/healthkit',
    clientId: process.env.VITE_APPLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/apple/callback`,
    scopes: ['health.read']
  },
  garmin: {
    baseUrl: 'https://apis.garmin.com/wellness-api/rest',
    clientId: process.env.VITE_GARMIN_CLIENT_ID || '',
    clientSecret: process.env.VITE_GARMIN_CLIENT_SECRET,
    redirectUri: `${window.location.origin}/auth/garmin/callback`,
    scopes: ['wellness']
  }
};

class BiometricService extends EventEmitter {
  private connectedDevices: Map<string, WearableDevice> = new Map();
  private biometricHistory: BiometricData[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private accessTokens: Map<string, string> = new Map();
  private refreshTokens: Map<string, string> = new Map();

  // Thresholds for stress detection
  private readonly STRESS_THRESHOLDS = {
    hrvLow: 30, // milliseconds
    hrvHigh: 100, // milliseconds
    heartRateElevated: 100, // bpm
    respiratoryRateHigh: 20, // breaths per minute
    sleepEfficiencyLow: 70, // percentage
  };

  constructor() {
    super();
    this.loadStoredTokens();
    this.initializeEventListeners();
  }

  /**
   * Initialize OAuth flow for device connection
   */
  async connectDevice(deviceType: WearableDevice['type']): Promise<boolean> {
    try {
      const config = API_CONFIGS[deviceType];
      if (!config) {
        throw new Error(`Unsupported device type: ${deviceType}`);
      }

      // Build OAuth URL
      const authUrl = this.buildOAuthUrl(deviceType, config);
      
      // Open OAuth popup
      const authWindow = window.open(authUrl, 'auth', 'width=500,height=700');
      
      // Wait for OAuth callback
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkInterval);
            const token = this.accessTokens.get(deviceType);
            if (token) {
              this.registerDevice(deviceType);
              resolve(true);
            } else {
              resolve(false);
            }
          }
        }, 1000);
      });
    } catch (error) {
      console.error(`Failed to connect ${deviceType}:`, error);
      return false;
    }
  }

  /**
   * Build OAuth URL for device authorization
   */
  private buildOAuthUrl(deviceType: string, config: APIConfig): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state: deviceType
    });

    const authEndpoints: Record<string, string> = {
      fitbit: 'https://www.fitbit.com/oauth2/authorize',
      apple_health: 'https://appleid.apple.com/auth/authorize',
      garmin: 'https://connect.garmin.com/oauthConfirm'
    };

    return `${authEndpoints[deviceType]}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(code: string, deviceType: string): Promise<void> {
    const config = API_CONFIGS[deviceType];
    if (!config) return;

    try {
      const tokenResponse = await this.exchangeCodeForToken(code, deviceType, config);
      this.accessTokens.set(deviceType, tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        this.refreshTokens.set(deviceType, tokenResponse.refresh_token);
      }
      this.saveTokens();
      this.registerDevice(deviceType);
    } catch (error) {
      console.error(`Failed to exchange code for token:`, error);
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string, deviceType: string, config: APIConfig): Promise<any> {
    const tokenEndpoints: Record<string, string> = {
      fitbit: 'https://api.fitbit.com/oauth2/token',
      apple_health: 'https://appleid.apple.com/auth/token',
      garmin: 'https://connectapi.garmin.com/oauth-service/oauth/token'
    };

    const response = await fetch(tokenEndpoints[deviceType], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Register a connected device
   */
  private registerDevice(deviceType: WearableDevice['type']): void {
    const device: WearableDevice = {
      id: `${deviceType}_${Date.now()}`,
      type: deviceType,
      name: this.getDeviceName(deviceType),
      connected: true,
      lastSync: new Date(),
      capabilities: this.getDeviceCapabilities(deviceType)
    };

    this.connectedDevices.set(device.id, device);
    this.emit('deviceConnected', device);
  }

  /**
   * Get human-readable device name
   */
  private getDeviceName(deviceType: string): string {
    const names: Record<string, string> = {
      fitbit: 'Fitbit',
      apple_watch: 'Apple Watch',
      garmin: 'Garmin',
      samsung: 'Samsung Galaxy Watch',
      whoop: 'WHOOP Strap',
      oura: 'Oura Ring'
    };
    return names[deviceType] || deviceType;
  }

  /**
   * Get device capabilities based on type
   */
  private getDeviceCapabilities(deviceType: string): string[] {
    const capabilities: Record<string, string[]> = {
      fitbit: ['heart_rate', 'hrv', 'sleep', 'activity', 'spo2', 'temperature'],
      apple_watch: ['heart_rate', 'hrv', 'sleep', 'activity', 'spo2', 'ecg', 'fall_detection'],
      garmin: ['heart_rate', 'hrv', 'sleep', 'activity', 'stress', 'body_battery'],
      samsung: ['heart_rate', 'sleep', 'activity', 'spo2', 'stress'],
      whoop: ['heart_rate', 'hrv', 'sleep', 'strain', 'recovery'],
      oura: ['heart_rate', 'hrv', 'sleep', 'temperature', 'activity', 'readiness']
    };
    return capabilities[deviceType] || [];
  }

  /**
   * Start continuous biometric monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.emit('monitoringStarted');

    // Initial sync
    this.syncAllDevices();

    // Set up regular syncing
    this.monitoringInterval = setInterval(() => {
      this.syncAllDevices();
    }, intervalMs);

    // Set up more frequent HRV and stress monitoring (every 5 minutes)
    this.syncInterval = setInterval(() => {
      this.checkStressIndicators();
    }, 300000);
  }

  /**
   * Stop biometric monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.emit('monitoringStopped');
  }

  /**
   * Sync data from all connected devices
   */
  private async syncAllDevices(): Promise<void> {
    const syncPromises = Array.from(this.connectedDevices.values()).map(device => 
      this.syncDeviceData(device)
    );

    await Promise.all(syncPromises);
    this.analyzeCorrelations();
  }

  /**
   * Sync data from a specific device
   */
  private async syncDeviceData(device: WearableDevice): Promise<void> {
    try {
      const token = this.accessTokens.get(device.type);
      if (!token) return;

      const data = await this.fetchDeviceData(device, token);
      if (data) {
        this.processBiometricData(data, device);
        device.lastSync = new Date();
        this.emit('dataSync', { device, data });
      }
    } catch (error) {
      console.error(`Failed to sync ${device.name}:`, error);
      // Try to refresh token if needed
      await this.refreshAccessToken(device.type);
    }
  }

  /**
   * Fetch data from device API
   */
  private async fetchDeviceData(device: WearableDevice, token: string): Promise<BiometricData | null> {
    const fetchers: Record<string, () => Promise<BiometricData | null>> = {
      fitbit: () => this.fetchFitbitData(token),
      apple_watch: () => this.fetchAppleHealthData(token),
      garmin: () => this.fetchGarminData(token)
    };

    const fetcher = fetchers[device.type];
    return fetcher ? fetcher() : null;
  }

  /**
   * Fetch data from Fitbit API
   */
  private async fetchFitbitData(token: string): Promise<BiometricData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const baseUrl = API_CONFIGS.fitbit.baseUrl;

      // Fetch multiple data types in parallel
      const [heartRate, sleep, activity] = await Promise.all([
        fetch(`${baseUrl}/-/activities/heart/date/${today}/1d/1min.json`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/-/sleep/date/${today}.json`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/-/activities/date/${today}.json`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const heartData = await heartRate.json();
      const sleepData = await sleep.json();
      const activityData = await activity.json();

      return this.parseFitbitData(heartData, sleepData, activityData);
    } catch (error) {
      console.error('Fitbit data fetch error:', error);
      return null;
    }
  }

  /**
   * Parse Fitbit API response
   */
  private parseFitbitData(heartData: any, sleepData: any, activityData: any): BiometricData {
    const latestHeart = heartData['activities-heart-intraday']?.dataset?.slice(-1)[0];
    const sleepSummary = sleepData.summary;
    const activitySummary = activityData.summary;

    const sleep: SleepData | undefined = sleepSummary ? {
      totalSleepMinutes: sleepSummary.totalMinutesAsleep,
      deepSleepMinutes: sleepSummary.stages?.deep || 0,
      remSleepMinutes: sleepSummary.stages?.rem || 0,
      lightSleepMinutes: sleepSummary.stages?.light || 0,
      awakeMinutes: sleepSummary.stages?.wake || 0,
      sleepEfficiency: (sleepSummary.totalMinutesAsleep / sleepSummary.totalTimeInBed) * 100,
      sleepQualityScore: this.calculateSleepQuality(sleepSummary),
      restlessness: sleepSummary.restlessCount || 0
    } : undefined;

    return {
      timestamp: new Date(),
      heartRate: latestHeart?.value,
      heartRateVariability: this.estimateHRVFromHeartRate(heartData),
      steps: activitySummary?.steps,
      caloriesBurned: activitySummary?.caloriesOut,
      activeMinutes: activitySummary?.veryActiveMinutes + activitySummary?.fairlyActiveMinutes,
      sleepData: sleep,
      activityLevel: this.determineActivityLevel(activitySummary)
    };
  }

  /**
   * Fetch data from Apple Health (via HealthKit bridge)
   */
  private async fetchAppleHealthData(token: string): Promise<BiometricData | null> {
    try {
      // Apple Health requires native app integration
      // This would typically be handled by a native bridge
      const response = await fetch('/api/apple-health/latest', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      return this.parseAppleHealthData(data);
    } catch (error) {
      console.error('Apple Health data fetch error:', error);
      return null;
    }
  }

  /**
   * Parse Apple Health data
   */
  private parseAppleHealthData(data: any): BiometricData {
    return {
      timestamp: new Date(),
      heartRate: data.heartRate?.value,
      heartRateVariability: data.hrv?.value,
      respiratoryRate: data.respiratoryRate?.value,
      bloodOxygen: data.oxygenSaturation?.value,
      steps: data.stepCount?.value,
      caloriesBurned: data.activeEnergyBurned?.value,
      sleepData: data.sleepAnalysis ? {
        totalSleepMinutes: data.sleepAnalysis.duration,
        deepSleepMinutes: data.sleepAnalysis.deep,
        remSleepMinutes: data.sleepAnalysis.rem,
        lightSleepMinutes: data.sleepAnalysis.light,
        awakeMinutes: data.sleepAnalysis.awake,
        sleepEfficiency: data.sleepAnalysis.efficiency,
        sleepQualityScore: data.sleepAnalysis.quality,
        restlessness: data.sleepAnalysis.restlessness
      } : undefined
    };
  }

  /**
   * Fetch data from Garmin Connect
   */
  private async fetchGarminData(token: string): Promise<BiometricData | null> {
    try {
      const baseUrl = API_CONFIGS.garmin.baseUrl;
      const userId = 'current'; // Garmin uses 'current' for authenticated user
      
      const response = await fetch(`${baseUrl}/dailies/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      return this.parseGarminData(data);
    } catch (error) {
      console.error('Garmin data fetch error:', error);
      return null;
    }
  }

  /**
   * Parse Garmin Connect data
   */
  private parseGarminData(data: any): BiometricData {
    const latest = data[0]; // Most recent daily summary
    
    return {
      timestamp: new Date(),
      heartRate: latest.restingHeartRate,
      heartRateVariability: latest.lastNightAvgHrv,
      respiratoryRate: latest.avgRespirationRate,
      steps: latest.totalSteps,
      caloriesBurned: latest.activeKilocalories,
      activeMinutes: latest.moderateIntensityMinutes + latest.vigorousIntensityMinutes,
      stressLevel: latest.averageStressLevel,
      sleepData: latest.sleepTimeSeconds ? {
        totalSleepMinutes: latest.sleepTimeSeconds / 60,
        deepSleepMinutes: latest.deepSleepSeconds / 60,
        remSleepMinutes: latest.remSleepSeconds / 60,
        lightSleepMinutes: latest.lightSleepSeconds / 60,
        awakeMinutes: latest.awakeSeconds / 60,
        sleepEfficiency: 85, // Garmin doesn't provide this directly
        sleepQualityScore: latest.sleepQualityScore || 75,
        restlessness: latest.restlessMomentsCount || 0
      } : undefined
    };
  }

  /**
   * Process and store biometric data
   */
  private processBiometricData(data: BiometricData, device: WearableDevice): void {
    // Add to history
    this.biometricHistory.push(data);
    
    // Keep only last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    this.biometricHistory = this.biometricHistory.filter(d => 
      d.timestamp > sevenDaysAgo
    );

    // Check for concerning patterns
    this.detectAnomalies(data);
    
    // Calculate stress indicators
    const stress = this.calculateStressIndicators(data);
    if (stress.needsIntervention) {
      this.emit('stressAlert', { data, stress, device });
    }
  }

  /**
   * Calculate stress indicators from biometric data
   */
  calculateStressIndicators(data: BiometricData): StressIndicators {
    let physiologicalStress = 0;
    let mentalStress = 0;
    let factors = 0;

    // HRV-based stress (lower HRV = higher stress)
    if (data.heartRateVariability !== undefined) {
      const hrvStress = Math.max(0, Math.min(100, 
        100 - (data.heartRateVariability / this.STRESS_THRESHOLDS.hrvHigh) * 100
      ));
      physiologicalStress += hrvStress;
      mentalStress += hrvStress * 0.7; // HRV strongly correlates with mental stress
      factors++;
    }

    // Heart rate elevation
    if (data.heartRate !== undefined) {
      const hrStress = Math.max(0, Math.min(100,
        (data.heartRate - 60) / (this.STRESS_THRESHOLDS.heartRateElevated - 60) * 100
      ));
      physiologicalStress += hrStress;
      factors++;
    }

    // Respiratory rate elevation
    if (data.respiratoryRate !== undefined) {
      const rrStress = Math.max(0, Math.min(100,
        (data.respiratoryRate - 12) / (this.STRESS_THRESHOLDS.respiratoryRateHigh - 12) * 100
      ));
      physiologicalStress += rrStress;
      mentalStress += rrStress * 0.5;
      factors++;
    }

    // Sleep quality impact
    if (data.sleepData) {
      const sleepStress = Math.max(0, Math.min(100,
        100 - data.sleepData.sleepQualityScore
      ));
      physiologicalStress += sleepStress * 0.5;
      mentalStress += sleepStress;
      factors++;
    }

    // Direct stress level from device
    if (data.stressLevel !== undefined) {
      physiologicalStress += data.stressLevel;
      mentalStress += data.stressLevel * 0.8;
      factors++;
    }

    if (factors === 0) {
      return {
        physiologicalStress: 0,
        mentalStress: 0,
        recoveryScore: 100,
        needsIntervention: false,
        recommendations: []
      };
    }

    physiologicalStress = physiologicalStress / factors;
    mentalStress = mentalStress / factors;
    const recoveryScore = 100 - (physiologicalStress * 0.6 + mentalStress * 0.4);

    const recommendations = this.generateStressRecommendations(
      physiologicalStress,
      mentalStress,
      data
    );

    return {
      physiologicalStress: Math.round(physiologicalStress),
      mentalStress: Math.round(mentalStress),
      recoveryScore: Math.round(recoveryScore),
      needsIntervention: physiologicalStress > 70 || mentalStress > 70,
      recommendations
    };
  }

  /**
   * Generate stress management recommendations
   */
  private generateStressRecommendations(
    physStress: number,
    mentalStress: number,
    data: BiometricData
  ): string[] {
    const recommendations: string[] = [];

    // High stress recommendations
    if (physStress > 70 || mentalStress > 70) {
      recommendations.push('Consider taking a break for deep breathing exercises');
      recommendations.push('Try a 5-minute guided meditation');
    }

    // HRV-specific recommendations
    if (data.heartRateVariability && data.heartRateVariability < this.STRESS_THRESHOLDS.hrvLow) {
      recommendations.push('Your HRV is low - practice coherent breathing (5 seconds in, 5 seconds out)');
    }

    // Sleep-related recommendations
    if (data.sleepData && data.sleepData.sleepEfficiency < this.STRESS_THRESHOLDS.sleepEfficiencyLow) {
      recommendations.push('Poor sleep detected - consider a power nap or relaxation session');
    }

    // Activity recommendations
    if (data.activityLevel === 'sedentary' && physStress > 50) {
      recommendations.push('Light physical activity could help reduce stress');
    }

    // Heart rate recommendations
    if (data.heartRate && data.heartRate > this.STRESS_THRESHOLDS.heartRateElevated) {
      recommendations.push('Elevated heart rate detected - try progressive muscle relaxation');
    }

    return recommendations;
  }

  /**
   * Detect anomalies in biometric data
   */
  private detectAnomalies(data: BiometricData): void {
    const recentData = this.getRecentData(24); // Last 24 hours
    if (recentData.length < 10) return; // Need sufficient data

    // Calculate baselines
    const avgHR = this.calculateAverage(recentData.map(d => d.heartRate).filter(Boolean) as number[]);
    const avgHRV = this.calculateAverage(recentData.map(d => d.heartRateVariability).filter(Boolean) as number[]);

    // Check for significant deviations
    if (data.heartRate && avgHR) {
      const deviation = Math.abs(data.heartRate - avgHR) / avgHR;
      if (deviation > 0.3) { // 30% deviation
        this.emit('anomalyDetected', {
          type: 'heart_rate',
          value: data.heartRate,
          baseline: avgHR,
          deviation: deviation * 100
        });
      }
    }

    if (data.heartRateVariability && avgHRV) {
      const deviation = Math.abs(data.heartRateVariability - avgHRV) / avgHRV;
      if (deviation > 0.4) { // 40% deviation for HRV (more variable)
        this.emit('anomalyDetected', {
          type: 'hrv',
          value: data.heartRateVariability,
          baseline: avgHRV,
          deviation: deviation * 100
        });
      }
    }
  }

  /**
   * Analyze correlations between biometrics and mental health
   */
  private analyzeCorrelations(): void {
    const recentData = this.getRecentData(168); // Last week
    if (recentData.length < 20) return;

    // Get mood data from external service (would be injected)
    const moodData = this.getMoodData();
    if (!moodData || moodData.length === 0) return;

    const correlation = this.calculateHealthCorrelation(recentData, moodData);
    this.emit('correlationAnalysis', correlation);
  }

  /**
   * Calculate health correlations with mood
   */
  private calculateHealthCorrelation(
    biometrics: BiometricData[],
    moodData: any[]
  ): HealthCorrelation {
    // Calculate average mood score
    const avgMood = moodData.reduce((sum, m) => sum + m.score, 0) / moodData.length;

    // Calculate activity impact on mood
    const activityCorrelation = this.calculateCorrelation(
      biometrics.map(b => b.activeMinutes || 0),
      moodData.map(m => m.score)
    );

    // Calculate sleep impact on mood
    const sleepCorrelation = this.calculateCorrelation(
      biometrics.map(b => b.sleepData?.sleepQualityScore || 0),
      moodData.map(m => m.score)
    );

    // Calculate stress correlation
    const stressCorrelation = this.calculateCorrelation(
      biometrics.map(b => b.stressLevel || 0),
      moodData.map(m => m.score)
    );

    // Determine HRV trend
    const hrvValues = biometrics.map(b => b.heartRateVariability).filter(Boolean) as number[];
    const hrvTrend = this.calculateTrend(hrvValues);

    const recommendations = this.generateHealthRecommendations(
      activityCorrelation,
      sleepCorrelation,
      stressCorrelation,
      hrvTrend
    );

    return {
      moodScore: avgMood,
      physicalActivityImpact: activityCorrelation,
      sleepQualityImpact: sleepCorrelation,
      stressPhysiologicalCorrelation: stressCorrelation,
      hrvTrend,
      recommendations
    };
  }

  /**
   * Generate health recommendations based on correlations
   */
  private generateHealthRecommendations(
    activityImpact: number,
    sleepImpact: number,
    stressCorrelation: number,
    hrvTrend: 'improving' | 'stable' | 'declining'
  ): string[] {
    const recommendations: string[] = [];

    if (activityImpact > 0.3) {
      recommendations.push('Physical activity shows positive impact on your mood - keep it up!');
    } else if (activityImpact < -0.2) {
      recommendations.push('Consider adjusting your activity level for better mood balance');
    }

    if (sleepImpact > 0.4) {
      recommendations.push('Good sleep quality is boosting your wellbeing');
    } else if (sleepImpact < 0) {
      recommendations.push('Improving sleep quality could enhance your mood');
    }

    if (stressCorrelation < -0.3) {
      recommendations.push('High stress levels are impacting your mood - try stress reduction techniques');
    }

    if (hrvTrend === 'declining') {
      recommendations.push('Your HRV trend suggests increasing stress - consider relaxation practices');
    } else if (hrvTrend === 'improving') {
      recommendations.push('Your stress resilience is improving - great progress!');
    }

    return recommendations;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Helper function to calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Estimate HRV from heart rate data (when direct HRV not available)
   */
  private estimateHRVFromHeartRate(heartData: any): number | undefined {
    // This is a simplified estimation - real HRV requires R-R intervals
    const dataset = heartData['activities-heart-intraday']?.dataset;
    if (!dataset || dataset.length < 2) return undefined;

    const intervals: number[] = [];
    for (let i = 1; i < dataset.length; i++) {
      const interval = 60000 / dataset[i].value; // Convert BPM to milliseconds
      intervals.push(interval);
    }

    // Calculate RMSSD (Root Mean Square of Successive Differences)
    let sumSquares = 0;
    for (let i = 1; i < intervals.length; i++) {
      const diff = intervals[i] - intervals[i - 1];
      sumSquares += diff * diff;
    }

    return Math.sqrt(sumSquares / (intervals.length - 1));
  }

  /**
   * Calculate sleep quality score
   */
  private calculateSleepQuality(sleepSummary: any): number {
    let score = 50; // Base score

    // Duration factor (7-9 hours optimal)
    const totalHours = sleepSummary.totalMinutesAsleep / 60;
    if (totalHours >= 7 && totalHours <= 9) {
      score += 20;
    } else if (totalHours >= 6 && totalHours <= 10) {
      score += 10;
    }

    // Efficiency factor
    const efficiency = (sleepSummary.totalMinutesAsleep / sleepSummary.totalTimeInBed) * 100;
    score += Math.min(20, efficiency * 0.2);

    // Deep sleep factor (should be 15-20% of total sleep)
    if (sleepSummary.stages?.deep) {
      const deepPercentage = (sleepSummary.stages.deep / sleepSummary.totalMinutesAsleep) * 100;
      if (deepPercentage >= 15 && deepPercentage <= 20) {
        score += 10;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine activity level from summary
   */
  private determineActivityLevel(summary: any): BiometricData['activityLevel'] {
    if (!summary) return 'sedentary';

    const veryActive = summary.veryActiveMinutes || 0;
    const fairlyActive = summary.fairlyActiveMinutes || 0;
    const lightlyActive = summary.lightlyActiveMinutes || 0;

    if (veryActive > 30) return 'vigorous';
    if (veryActive > 15 || fairlyActive > 30) return 'moderate';
    if (lightlyActive > 60) return 'light';
    return 'sedentary';
  }

  /**
   * Get recent biometric data
   */
  getRecentData(hours: number = 24): BiometricData[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    return this.biometricHistory.filter(d => d.timestamp > cutoff);
  }

  /**
   * Get latest biometric reading
   */
  getLatestReading(): BiometricData | null {
    return this.biometricHistory[this.biometricHistory.length - 1] || null;
  }

  /**
   * Get connected devices
   */
  getConnectedDevices(): WearableDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Disconnect a device
   */
  disconnectDevice(deviceId: string): void {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      this.connectedDevices.delete(deviceId);
      this.accessTokens.delete(device.type);
      this.refreshTokens.delete(device.type);
      this.saveTokens();
      this.emit('deviceDisconnected', device);
    }
  }

  /**
   * Check stress indicators
   */
  private checkStressIndicators(): void {
    const latest = this.getLatestReading();
    if (!latest) return;

    const stress = this.calculateStressIndicators(latest);
    this.emit('stressUpdate', stress);
  }

  /**
   * Get mood data (placeholder - would integrate with mood service)
   */
  private getMoodData(): any[] {
    // This would integrate with your mood tracking service
    return [];
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(deviceType: string): Promise<void> {
    const refreshToken = this.refreshTokens.get(deviceType);
    if (!refreshToken) return;

    const config = API_CONFIGS[deviceType];
    if (!config) return;

    try {
      const tokenEndpoints: Record<string, string> = {
        fitbit: 'https://api.fitbit.com/oauth2/token',
        apple_health: 'https://appleid.apple.com/auth/token',
        garmin: 'https://connectapi.garmin.com/oauth-service/oauth/token'
      };

      const response = await fetch(tokenEndpoints[deviceType], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.accessTokens.set(deviceType, data.access_token);
        if (data.refresh_token) {
          this.refreshTokens.set(deviceType, data.refresh_token);
        }
        this.saveTokens();
      }
    } catch (error) {
      console.error(`Failed to refresh token for ${deviceType}:`, error);
    }
  }

  /**
   * Save tokens to local storage
   */
  private saveTokens(): void {
    const tokens = {
      access: Array.from(this.accessTokens.entries()),
      refresh: Array.from(this.refreshTokens.entries())
    };
    localStorage.setItem('biometric_tokens', JSON.stringify(tokens));
  }

  /**
   * Load tokens from local storage
   */
  private loadStoredTokens(): void {
    const stored = localStorage.getItem('biometric_tokens');
    if (stored) {
      try {
        const tokens = JSON.parse(stored);
        this.accessTokens = new Map(tokens.access);
        this.refreshTokens = new Map(tokens.refresh);
      } catch (error) {
        console.error('Failed to load stored tokens:', error);
      }
    }
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    // Listen for OAuth callbacks
    window.addEventListener('message', (event) => {
      if (event.data.type === 'oauth_callback') {
        this.handleOAuthCallback(event.data.code, event.data.state);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.connectedDevices.clear();
    this.biometricHistory = [];
  }
}

// Export singleton instance
export const biometricService = new BiometricService();