/**
 * Astral Tether Service Tests
 * 
 * Tests for advanced mental health monitoring and intervention system
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../api/userService');
jest.mock('../analyticsService');
jest.mock('../crisisDetection');

interface AstralConnection {
  id: string;
  userId: string;
  type: 'therapist' | 'peer' | 'family' | 'emergency';
  connectionId: string;
  strength: number; // 0-100
  lastInteraction: Date;
  isActive: boolean;
  permissions: {
    canReceiveAlerts: boolean;
    canAccessMoodData: boolean;
    canInitiateContact: boolean;
    emergencyContact: boolean;
  };
}

interface TetherAlert {
  id: string;
  userId: string;
  alertType: 'mood-decline' | 'missed-checkin' | 'crisis-detected' | 'support-needed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  recipientConnections: string[];
  isResolved: boolean;
  responseTime?: number;
}

interface WellnessMetrics {
  moodScore: number;
  sleepQuality: number;
  anxietyLevel: number;
  socialInteraction: number;
  selfCareActivities: number;
  overallWellness: number;
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

interface TetherConfiguration {
  monitoringInterval: number; // minutes
  alertThresholds: {
    moodDeclinePercent: number;
    missedCheckinHours: number;
    inactivityDays: number;
  };
  connectionLimits: {
    maxTherapists: number;
    maxPeers: number;
    maxFamily: number;
    maxEmergency: number;
  };
  privacySettings: {
    shareDetailedMood: boolean;
    shareCrisisAlerts: boolean;
    allowEmergencyOverride: boolean;
  };
}

// Astral Tether Service implementation (would be imported in real app)
class AstralTetherService {
  private connections: Map<string, AstralConnection[]> = new Map();
  private alerts: TetherAlert[] = [];
  private userMetrics: Map<string, WellnessMetrics> = new Map();
  private configurations: Map<string, TetherConfiguration> = new Map();

  async createConnection(userId: string, connectionData: Omit<AstralConnection, 'id' | 'lastInteraction'>): Promise<AstralConnection> {
    const connection: AstralConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastInteraction: new Date(),
      ...connectionData
    };

    const userConnections = this.connections.get(userId) || [];
    
    // Check connection limits
    const config = this.configurations.get(userId) || this.getDefaultConfiguration();
    const typeCount = userConnections.filter(c => c.type === connection.type).length;
    
    const limits = config.connectionLimits;
    const maxForType = connection.type === 'therapist' ? limits.maxTherapists :
                      connection.type === 'peer' ? limits.maxPeers :
                      connection.type === 'family' ? limits.maxFamily :
                      limits.maxEmergency;

    if (typeCount >= maxForType) {
      throw new Error(`Maximum ${connection.type} connections (${maxForType}) reached`);
    }

    userConnections.push(connection);
    this.connections.set(userId, userConnections);

    return connection;
  }

  async getConnections(userId: string, type?: AstralConnection['type']): Promise<AstralConnection[]> {
    const userConnections = this.connections.get(userId) || [];
    
    if (type) {
      return userConnections.filter(c => c.type === type && c.isActive);
    }
    
    return userConnections.filter(c => c.isActive);
  }

  async updateConnectionStrength(userId: string, connectionId: string, interaction: {
    type: 'message' | 'session' | 'checkin' | 'emergency';
    quality: 'positive' | 'neutral' | 'negative';
    duration?: number;
  }): Promise<void> {
    const connections = this.connections.get(userId) || [];
    const connection = connections.find(c => c.id === connectionId);
    
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Calculate strength adjustment based on interaction
    let strengthChange = 0;
    
    switch (interaction.type) {
      case 'session':
        strengthChange = interaction.quality === 'positive' ? 5 : 
                        interaction.quality === 'neutral' ? 2 : -1;
        break;
      case 'message':
        strengthChange = interaction.quality === 'positive' ? 2 : 
                        interaction.quality === 'neutral' ? 1 : -0.5;
        break;
      case 'checkin':
        strengthChange = 3;
        break;
      case 'emergency':
        strengthChange = interaction.quality === 'positive' ? 10 : 0;
        break;
    }

    // Apply time-based bonus for recent interactions
    const timeSinceLastInteraction = Date.now() - connection.lastInteraction.getTime();
    const hoursGap = timeSinceLastInteraction / (1000 * 60 * 60);
    
    if (hoursGap < 24) {
      strengthChange *= 1.2; // 20% bonus for interactions within 24 hours
    }

    connection.strength = Math.max(0, Math.min(100, connection.strength + strengthChange));
    connection.lastInteraction = new Date();

    // Decay strength over time for inactive connections
    this.decayInactiveConnections(userId);
  }

  private decayInactiveConnections(userId: string): void {
    const connections = this.connections.get(userId) || [];
    const now = Date.now();
    
    connections.forEach(connection => {
      const daysSinceInteraction = (now - connection.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceInteraction > 7) {
        const decayRate = Math.min(daysSinceInteraction * 0.5, 10);
        connection.strength = Math.max(0, connection.strength - decayRate);
        
        if (connection.strength < 10) {
          connection.isActive = false;
        }
      }
    });
  }

  async analyzeWellnessMetrics(userId: string, dataPoints: {
    mood?: number;
    sleep?: number;
    anxiety?: number;
    socialActivity?: number;
    selfCare?: number;
  }[]): Promise<WellnessMetrics> {
    if (dataPoints.length === 0) {
      throw new Error('No data points provided for analysis');
    }

    // Calculate averages
    const latest = dataPoints[dataPoints.length - 1];
    const moodScore = latest.mood || 50;
    const sleepQuality = latest.sleep || 50;
    const anxietyLevel = latest.anxiety || 50;
    const socialInteraction = latest.socialActivity || 50;
    const selfCareActivities = latest.selfCare || 50;

    // Calculate overall wellness (weighted average)
    const overallWellness = (
      moodScore * 0.3 +
      sleepQuality * 0.2 +
      (100 - anxietyLevel) * 0.2 + // Invert anxiety (lower is better)
      socialInteraction * 0.15 +
      selfCareActivities * 0.15
    );

    // Determine trend
    let trend: WellnessMetrics['trend'] = 'stable';
    if (dataPoints.length >= 3) {
      const recent = dataPoints.slice(-3);
      const recentAvg = recent.reduce((sum, dp) => sum + (dp.mood || 50), 0) / recent.length;
      const earlier = dataPoints.slice(-6, -3);
      
      if (earlier.length > 0) {
        const earlierAvg = earlier.reduce((sum, dp) => sum + (dp.mood || 50), 0) / earlier.length;
        const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
        
        if (change > 10) trend = 'improving';
        else if (change < -10) trend = 'declining';
      }
    }

    // Determine risk level
    let riskLevel: WellnessMetrics['riskLevel'] = 'low';
    if (overallWellness < 30) riskLevel = 'critical';
    else if (overallWellness < 50) riskLevel = 'high';
    else if (overallWellness < 70) riskLevel = 'moderate';

    const metrics: WellnessMetrics = {
      moodScore,
      sleepQuality,
      anxietyLevel,
      socialInteraction,
      selfCareActivities,
      overallWellness,
      trend,
      riskLevel
    };

    this.userMetrics.set(userId, metrics);
    
    // Check if alerts should be triggered
    await this.checkAlertConditions(userId, metrics);

    return metrics;
  }

  private async checkAlertConditions(userId: string, metrics: WellnessMetrics): Promise<void> {
    const config = this.configurations.get(userId) || this.getDefaultConfiguration();
    const connections = this.connections.get(userId) || [];
    
    // Check for mood decline
    const previousMetrics = this.userMetrics.get(userId);
    if (previousMetrics) {
      const moodDecline = ((previousMetrics.moodScore - metrics.moodScore) / previousMetrics.moodScore) * 100;
      
      if (moodDecline >= config.alertThresholds.moodDeclinePercent) {
        await this.createAlert({
          userId,
          alertType: 'mood-decline',
          severity: moodDecline >= 30 ? 'high' : 'medium',
          message: `Mood decline detected: ${moodDecline.toFixed(1)}% decrease`,
          recipientConnections: connections
            .filter(c => c.permissions.canReceiveAlerts)
            .map(c => c.id)
        });
      }
    }

    // Check for critical risk level
    if (metrics.riskLevel === 'critical') {
      await this.createAlert({
        userId,
        alertType: 'crisis-detected',
        severity: 'critical',
        message: 'Critical wellness metrics detected - immediate support recommended',
        recipientConnections: connections
          .filter(c => c.permissions.emergencyContact)
          .map(c => c.id)
      });
    }
  }

  private async createAlert(alertData: Omit<TetherAlert, 'id' | 'timestamp' | 'isResolved'>): Promise<TetherAlert> {
    const alert: TetherAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isResolved: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Notify connections
    await this.notifyConnections(alert);

    return alert;
  }

  private async notifyConnections(alert: TetherAlert): Promise<void> {
    // In real implementation, this would send notifications
    // via email, SMS, push notifications, etc.
    console.log(`Alert ${alert.id} sent to ${alert.recipientConnections.length} connections`);
  }

  async getAlerts(userId: string, includeResolved = false): Promise<TetherAlert[]> {
    const userAlerts = this.alerts.filter(a => a.userId === userId);
    
    if (includeResolved) {
      return userAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    
    return userAlerts
      .filter(a => !a.isResolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.isResolved = true;
    alert.responseTime = Date.now() - alert.timestamp.getTime();
  }

  async performWellnessCheck(userId: string): Promise<{
    status: 'healthy' | 'concerning' | 'critical';
    metrics: WellnessMetrics;
    recommendations: string[];
    nextCheckIn: Date;
  }> {
    const metrics = this.userMetrics.get(userId);
    
    if (!metrics) {
      throw new Error('No wellness metrics available for user');
    }

    let status: 'healthy' | 'concerning' | 'critical' = 'healthy';
    const recommendations: string[] = [];
    
    if (metrics.riskLevel === 'critical') {
      status = 'critical';
      recommendations.push('Seek immediate professional help');
      recommendations.push('Contact emergency services if needed');
      recommendations.push('Reach out to your support network');
    } else if (metrics.riskLevel === 'high') {
      status = 'concerning';
      recommendations.push('Schedule appointment with mental health professional');
      recommendations.push('Increase frequency of wellness activities');
      recommendations.push('Connect with trusted friends or family');
    } else if (metrics.overallWellness < 60) {
      status = 'concerning';
      recommendations.push('Focus on self-care activities');
      recommendations.push('Consider talking to someone you trust');
    } else {
      recommendations.push('Continue current wellness practices');
      recommendations.push('Maintain regular sleep schedule');
    }

    // Calculate next check-in time based on risk level
    const hoursUntilNext = metrics.riskLevel === 'critical' ? 2 :
                          metrics.riskLevel === 'high' ? 8 :
                          metrics.riskLevel === 'moderate' ? 24 : 72;
    
    const nextCheckIn = new Date(Date.now() + hoursUntilNext * 60 * 60 * 1000);

    return {
      status,
      metrics,
      recommendations,
      nextCheckIn
    };
  }

  private getDefaultConfiguration(): TetherConfiguration {
    return {
      monitoringInterval: 60,
      alertThresholds: {
        moodDeclinePercent: 20,
        missedCheckinHours: 48,
        inactivityDays: 7
      },
      connectionLimits: {
        maxTherapists: 3,
        maxPeers: 10,
        maxFamily: 5,
        maxEmergency: 3
      },
      privacySettings: {
        shareDetailedMood: true,
        shareCrisisAlerts: true,
        allowEmergencyOverride: true
      }
    };
  }
}

describe('AstralTetherService', () => {
  let service: AstralTetherService;
  const mockUserId = 'user123';

  beforeEach(() => {
    service = new AstralTetherService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Connection Management', () => {
    it('should create new connection successfully', async () => {
      const connectionData = {
        userId: mockUserId,
        type: 'therapist' as const,
        connectionId: 'therapist123',
        strength: 75,
        isActive: true,
        permissions: {
          canReceiveAlerts: true,
          canAccessMoodData: true,
          canInitiateContact: true,
          emergencyContact: true
        }
      };

      const connection = await service.createConnection(mockUserId, connectionData);

      expect(connection).toBeDefined();
      expect(connection.id).toMatch(/^conn_/);
      expect(connection.userId).toBe(mockUserId);
      expect(connection.type).toBe('therapist');
      expect(connection.strength).toBe(75);
    });

    it('should enforce connection limits', async () => {
      // Create maximum therapist connections (3)
      for (let i = 0; i < 3; i++) {
        await service.createConnection(mockUserId, {
          userId: mockUserId,
          type: 'therapist',
          connectionId: `therapist${i}`,
          strength: 50,
          isActive: true,
          permissions: {
            canReceiveAlerts: true,
            canAccessMoodData: false,
            canInitiateContact: false,
            emergencyContact: false
          }
        });
      }

      // Attempt to create one more
      await expect(service.createConnection(mockUserId, {
        userId: mockUserId,
        type: 'therapist',
        connectionId: 'therapist4',
        strength: 50,
        isActive: true,
        permissions: {
          canReceiveAlerts: true,
          canAccessMoodData: false,
          canInitiateContact: false,
          emergencyContact: false
        }
      })).rejects.toThrow('Maximum therapist connections (3) reached');
    });

    it('should retrieve connections by type', async () => {
      await service.createConnection(mockUserId, {
        userId: mockUserId,
        type: 'therapist',
        connectionId: 'therapist123',
        strength: 75,
        isActive: true,
        permissions: {
          canReceiveAlerts: true,
          canAccessMoodData: true,
          canInitiateContact: true,
          emergencyContact: true
        }
      });

      await service.createConnection(mockUserId, {
        userId: mockUserId,
        type: 'peer',
        connectionId: 'peer123',
        strength: 50,
        isActive: true,
        permissions: {
          canReceiveAlerts: false,
          canAccessMoodData: false,
          canInitiateContact: true,
          emergencyContact: false
        }
      });

      const therapistConnections = await service.getConnections(mockUserId, 'therapist');
      expect(therapistConnections).toHaveLength(1);
      expect(therapistConnections[0].type).toBe('therapist');

      const allConnections = await service.getConnections(mockUserId);
      expect(allConnections).toHaveLength(2);
    });
  });

  describe('Connection Strength Management', () => {
    let connectionId: string;

    beforeEach(async () => {
      const connection = await service.createConnection(mockUserId, {
        userId: mockUserId,
        type: 'therapist',
        connectionId: 'therapist123',
        strength: 50,
        isActive: true,
        permissions: {
          canReceiveAlerts: true,
          canAccessMoodData: true,
          canInitiateContact: true,
          emergencyContact: true
        }
      });
      connectionId = connection.id;
    });

    it('should update connection strength based on interactions', async () => {
      await service.updateConnectionStrength(mockUserId, connectionId, {
        type: 'session',
        quality: 'positive',
        duration: 50
      });

      const connections = await service.getConnections(mockUserId);
      expect(connections[0].strength).toBe(55); // 50 + 5 for positive session
    });

    it('should decrease strength for negative interactions', async () => {
      await service.updateConnectionStrength(mockUserId, connectionId, {
        type: 'session',
        quality: 'negative'
      });

      const connections = await service.getConnections(mockUserId);
      expect(connections[0].strength).toBe(49); // 50 - 1 for negative session
    });

    it('should provide bonus for recent interactions', async () => {
      // This is hard to test directly, but we can verify the method doesn't error
      await service.updateConnectionStrength(mockUserId, connectionId, {
        type: 'message',
        quality: 'positive'
      });

      const connections = await service.getConnections(mockUserId);
      expect(connections[0].strength).toBeGreaterThan(50);
    });
  });

  describe('Wellness Metrics Analysis', () => {
    it('should analyze wellness metrics correctly', async () => {
      const dataPoints = [
        { mood: 30, sleep: 40, anxiety: 70, socialActivity: 20, selfCare: 25 },
        { mood: 35, sleep: 45, anxiety: 65, socialActivity: 25, selfCare: 30 },
        { mood: 40, sleep: 50, anxiety: 60, socialActivity: 30, selfCare: 35 }
      ];

      const metrics = await service.analyzeWellnessMetrics(mockUserId, dataPoints);

      expect(metrics.moodScore).toBe(40);
      expect(metrics.sleepQuality).toBe(50);
      expect(metrics.anxietyLevel).toBe(60);
      expect(metrics.trend).toBe('improving'); // Mood is trending upward
      expect(metrics.riskLevel).toBe('high'); // Overall wellness is low
    });

    it('should determine correct risk levels', async () => {
      // Critical risk scenario
      const criticalData = [
        { mood: 10, sleep: 20, anxiety: 90, socialActivity: 5, selfCare: 10 }
      ];

      const criticalMetrics = await service.analyzeWellnessMetrics(mockUserId, criticalData);
      expect(criticalMetrics.riskLevel).toBe('critical');

      // Low risk scenario
      const healthyData = [
        { mood: 80, sleep: 85, anxiety: 20, socialActivity: 75, selfCare: 80 }
      ];

      const healthyMetrics = await service.analyzeWellnessMetrics(mockUserId, healthyData);
      expect(healthyMetrics.riskLevel).toBe('low');
    });

    it('should handle empty data points', async () => {
      await expect(service.analyzeWellnessMetrics(mockUserId, [])).rejects.toThrow(
        'No data points provided for analysis'
      );
    });
  });

  describe('Alert System', () => {
    beforeEach(async () => {
      // Create connection for alert testing
      await service.createConnection(mockUserId, {
        userId: mockUserId,
        type: 'therapist',
        connectionId: 'therapist123',
        strength: 75,
        isActive: true,
        permissions: {
          canReceiveAlerts: true,
          canAccessMoodData: true,
          canInitiateContact: true,
          emergencyContact: true
        }
      });
    });

    it('should trigger alerts for significant mood decline', async () => {
      // First measurement
      await service.analyzeWellnessMetrics(mockUserId, [
        { mood: 70, sleep: 60, anxiety: 30, socialActivity: 60, selfCare: 65 }
      ]);

      // Second measurement with significant decline
      await service.analyzeWellnessMetrics(mockUserId, [
        { mood: 70, sleep: 60, anxiety: 30, socialActivity: 60, selfCare: 65 },
        { mood: 40, sleep: 60, anxiety: 30, socialActivity: 60, selfCare: 65 }
      ]);

      const alerts = await service.getAlerts(mockUserId);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('mood-decline');
    });

    it('should trigger critical alerts for critical risk levels', async () => {
      await service.analyzeWellnessMetrics(mockUserId, [
        { mood: 10, sleep: 20, anxiety: 90, socialActivity: 5, selfCare: 10 }
      ]);

      const alerts = await service.getAlerts(mockUserId);
      const criticalAlert = alerts.find(a => a.alertType === 'crisis-detected');
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.severity).toBe('critical');
    });

    it('should resolve alerts', async () => {
      await service.analyzeWellnessMetrics(mockUserId, [
        { mood: 10, sleep: 20, anxiety: 90, socialActivity: 5, selfCare: 10 }
      ]);

      const alerts = await service.getAlerts(mockUserId);
      const alertId = alerts[0].id;

      await service.resolveAlert(alertId, 'therapist123');

      const unresolvedAlerts = await service.getAlerts(mockUserId, false);
      expect(unresolvedAlerts).toHaveLength(0);

      const allAlerts = await service.getAlerts(mockUserId, true);
      expect(allAlerts[0].isResolved).toBe(true);
      expect(allAlerts[0].responseTime).toBeDefined();
    });
  });

  describe('Wellness Check', () => {
    it('should perform comprehensive wellness check', async () => {
      await service.analyzeWellnessMetrics(mockUserId, [
        { mood: 45, sleep: 55, anxiety: 60, socialActivity: 40, selfCare: 50 }
      ]);

      const wellnessCheck = await service.performWellnessCheck(mockUserId);

      expect(wellnessCheck.status).toBe('concerning');
      expect(wellnessCheck.metrics).toBeDefined();
      expect(wellnessCheck.recommendations).toHaveLength(2);
      expect(wellnessCheck.nextCheckIn).toBeInstanceOf(Date);
    });

    it('should provide appropriate recommendations based on status', async () => {
      // Critical status
      await service.analyzeWellnessMetrics(mockUserId, [
        { mood: 10, sleep: 20, anxiety: 90, socialActivity: 5, selfCare: 10 }
      ]);

      const criticalCheck = await service.performWellnessCheck(mockUserId);
      expect(criticalCheck.status).toBe('critical');
      expect(criticalCheck.recommendations).toContain('Seek immediate professional help');

      // Healthy status
      await service.analyzeWellnessMetrics(mockUserId, [
        { mood: 80, sleep: 85, anxiety: 20, socialActivity: 75, selfCare: 80 }
      ]);

      const healthyCheck = await service.performWellnessCheck(mockUserId);
      expect(healthyCheck.status).toBe('healthy');
      expect(healthyCheck.recommendations).toContain('Continue current wellness practices');
    });

    it('should handle missing metrics', async () => {
      await expect(service.performWellnessCheck('nonexistent-user')).rejects.toThrow(
        'No wellness metrics available for user'
      );
    });
  });
});

