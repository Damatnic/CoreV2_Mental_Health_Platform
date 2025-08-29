import { AuthenticatedSocket } from '../socketServer';
import crypto from 'crypto';

// Types for crisis-related events
interface CrisisAlert {
  id: string;
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  message: string;
  symptoms: string[];
  triggeredAt: Date;
  status: 'active' | 'responding' | 'resolved' | 'escalated';
  responders: string[];
  metadata?: any;
}

interface EmergencyBroadcast {
  alertId: string;
  userId: string;
  userInfo: {
    name: string;
    age?: number;
    conditions?: string[];
    medications?: string[];
    emergencyContacts?: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
  };
  location?: any;
  severity: string;
  requiredHelp: string[];
  estimatedResponseTime?: number;
}

interface CrisisStatusUpdate {
  alertId: string;
  status: string;
  updatedBy: string;
  message?: string;
  timestamp: Date;
}

class CrisisHandler {
  private activeCrises: Map<string, CrisisAlert> = new Map();
  private responderAvailability: Map<string, boolean> = new Map();
  private crisisRooms: Map<string, Set<string>> = new Map(); // alertId -> responderIds
  private locationSharing: Map<string, any> = new Map(); // userId -> location data
  private escalationQueue: CrisisAlert[] = [];

  constructor(private io: any) {
    this.startEscalationMonitor();
  }

  /**
   * Handle crisis alert initiation
   */
  public handleCrisisAlert(socket: AuthenticatedSocket, data: any): void {
    const { severity, message, symptoms, location } = data;
    const userId = socket.userId!;
    
    // Generate unique alert ID
    const alertId = `crisis_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Create crisis alert
    const alert: CrisisAlert = {
      id: alertId,
      userId,
      severity: this.validateSeverity(severity),
      location: location ? this.sanitizeLocation(location) : undefined,
      message: this.sanitizeMessage(message),
      symptoms: symptoms || [],
      triggeredAt: new Date(),
      status: 'active',
      responders: [],
      metadata: {
        socketId: socket.id,
        userRole: socket.userRole
      }
    };

    // Store active crisis
    this.activeCrises.set(alertId, alert);
    
    // Create crisis room
    const roomId = `crisis_${alertId}`;
    socket.join(roomId);
    this.crisisRooms.set(alertId, new Set([userId]));

    // Log crisis for audit
    this.logCrisisEvent(alertId, 'INITIATED', userId);

    // Send confirmation to user
    socket.emit('crisis-alert-confirmed', {
      alertId,
      status: 'active',
      message: 'Crisis alert received. Help is on the way.',
      estimatedResponse: this.estimateResponseTime(severity)
    });

    // Broadcast to available responders
    this.broadcastToResponders(alert);

    // If critical, escalate immediately
    if (severity === 'critical') {
      this.escalateCrisis(alert);
    }

    console.log(`Crisis alert ${alertId} initiated by user ${userId} with severity ${severity}`);
  }

  /**
   * Broadcast crisis alert to available responders
   */
  private broadcastToResponders(alert: CrisisAlert): void {
    const broadcast: EmergencyBroadcast = {
      alertId: alert.id,
      userId: alert.userId,
      userInfo: this.getUserInfoForCrisis(alert.userId),
      location: alert.location,
      severity: alert.severity,
      requiredHelp: this.determineRequiredHelp(alert),
      estimatedResponseTime: this.estimateResponseTime(alert.severity)
    };

    // Find available responders
    const availableResponders = this.getAvailableResponders(alert);
    
    // Notify each responder
    availableResponders.forEach(responderId => {
      this.io.emitToUser(responderId, 'crisis-alert-broadcast', {
        ...broadcast,
        encrypted: this.encryptSensitiveData(broadcast, responderId)
      });
    });

    // Also notify on-call therapists
    this.notifyOnCallTherapists(alert);
  }

  /**
   * Handle responder accepting crisis
   */
  public handleResponderAccept(socket: AuthenticatedSocket, data: any): void {
    const { alertId } = data;
    const responderId = socket.userId!;
    
    const alert = this.activeCrises.get(alertId);
    if (!alert) {
      socket.emit('crisis-error', { error: 'Crisis alert not found' });
      return;
    }

    // Add responder to crisis
    alert.responders.push(responderId);
    alert.status = 'responding';
    
    // Join crisis room
    const roomId = `crisis_${alertId}`;
    socket.join(roomId);
    this.crisisRooms.get(alertId)?.add(responderId);

    // Update responder availability
    this.responderAvailability.set(responderId, false);

    // Notify all parties
    this.io.emitToUser(alert.userId, 'responder-assigned', {
      alertId,
      responderId,
      responderInfo: this.getResponderInfo(responderId),
      estimatedArrival: this.calculateEstimatedArrival(alert.location, responderId)
    });

    socket.emit('crisis-assignment-confirmed', {
      alertId,
      userInfo: this.getUserInfoForCrisis(alert.userId),
      location: alert.location,
      roomId
    });

    // Notify other responders that crisis is being handled
    this.io.emit('crisis-status-update', {
      alertId,
      status: 'responding',
      responders: alert.responders.length
    });

    this.logCrisisEvent(alertId, 'RESPONDER_ASSIGNED', responderId);
  }

  /**
   * Handle location sharing during emergency
   */
  public handleLocationShare(socket: AuthenticatedSocket, data: any): void {
    const { latitude, longitude, accuracy, alertId } = data;
    const userId = socket.userId!;
    
    // Validate and sanitize location
    const location = this.sanitizeLocation({ latitude, longitude, accuracy, timestamp: new Date() });
    
    // Store location
    this.locationSharing.set(userId, {
      ...location,
      alertId,
      lastUpdate: new Date()
    });

    // If part of active crisis, update crisis location
    if (alertId) {
      const alert = this.activeCrises.get(alertId);
      if (alert && alert.userId === userId) {
        alert.location = location;
        
        // Notify responders of location update
        const roomId = `crisis_${alertId}`;
        socket.to(roomId).emit('user-location-update', {
          alertId,
          location,
          timestamp: new Date()
        });
      }
    }

    // Send confirmation
    socket.emit('location-share-confirmed', {
      status: 'sharing',
      updateInterval: 30000 // Update every 30 seconds
    });
  }

  /**
   * Handle status updates during crisis
   */
  public handleStatusUpdate(socket: AuthenticatedSocket, data: any): void {
    const { alertId, status, message } = data;
    const userId = socket.userId!;
    
    const alert = this.activeCrises.get(alertId);
    if (!alert) {
      socket.emit('crisis-error', { error: 'Crisis alert not found' });
      return;
    }

    // Validate user can update status
    if (alert.userId !== userId && !alert.responders.includes(userId)) {
      socket.emit('crisis-error', { error: 'Unauthorized to update crisis status' });
      return;
    }

    // Update status
    const previousStatus = alert.status;
    alert.status = status;

    const statusUpdate: CrisisStatusUpdate = {
      alertId,
      status,
      updatedBy: userId,
      message,
      timestamp: new Date()
    };

    // Broadcast to crisis room
    const roomId = `crisis_${alertId}`;
    this.io.to(roomId).emit('crisis-status-changed', statusUpdate);

    // Handle specific status changes
    switch (status) {
      case 'resolved':
        this.resolveCrisis(alertId, userId);
        break;
      case 'escalated':
        this.escalateCrisis(alert);
        break;
    }

    this.logCrisisEvent(alertId, `STATUS_${status.toUpperCase()}`, userId);
  }

  /**
   * Escalate crisis to emergency services
   */
  private escalateCrisis(alert: CrisisAlert): void {
    alert.status = 'escalated';
    this.escalationQueue.push(alert);

    // Notify emergency services integration
    this.io.emit('crisis-escalation', {
      alertId: alert.id,
      userId: alert.userId,
      severity: 'critical',
      location: alert.location,
      requiresEmergencyServices: true,
      escalatedAt: new Date()
    });

    // Notify user
    this.io.emitToUser(alert.userId, 'crisis-escalated', {
      alertId: alert.id,
      message: 'Your crisis has been escalated to emergency services',
      emergencyNumber: '911',
      stayOnline: true
    });

    // Alert all available crisis responders
    this.broadcastEmergencyEscalation(alert);
    
    this.logCrisisEvent(alert.id, 'ESCALATED_TO_EMERGENCY', 'system');
  }

  /**
   * Resolve crisis
   */
  private resolveCrisis(alertId: string, resolvedBy: string): void {
    const alert = this.activeCrises.get(alertId);
    if (!alert) return;

    // Update responder availability
    alert.responders.forEach(responderId => {
      this.responderAvailability.set(responderId, true);
    });

    // Clear crisis room
    const roomId = `crisis_${alertId}`;
    this.io.to(roomId).emit('crisis-resolved', {
      alertId,
      resolvedBy,
      resolvedAt: new Date(),
      duration: Date.now() - alert.triggeredAt.getTime()
    });

    // Stop location sharing
    this.locationSharing.delete(alert.userId);

    // Archive crisis (don't delete immediately for records)
    setTimeout(() => {
      this.activeCrises.delete(alertId);
      this.crisisRooms.delete(alertId);
    }, 5 * 60 * 1000); // Keep for 5 minutes

    this.logCrisisEvent(alertId, 'RESOLVED', resolvedBy);
  }

  /**
   * Broadcast emergency escalation to all responders
   */
  private broadcastEmergencyEscalation(alert: CrisisAlert): void {
    this.io.emit('emergency-escalation-broadcast', {
      alertId: alert.id,
      priority: 'IMMEDIATE',
      location: alert.location,
      message: 'CRITICAL: Crisis escalated to emergency services',
      requiresImmediateResponse: true
    });
  }

  /**
   * Get available responders based on crisis type
   */
  private getAvailableResponders(alert: CrisisAlert): string[] {
    const responders: string[] = [];
    
    // Get responders based on severity
    this.responderAvailability.forEach((available, responderId) => {
      if (available) {
        // Additional filtering based on responder qualifications
        // This would typically query a database
        responders.push(responderId);
      }
    });

    return responders;
  }

  /**
   * Get on-call therapists
   */
  private notifyOnCallTherapists(alert: CrisisAlert): void {
    // This would typically query a database for on-call schedule
    const onCallTherapists = ['therapist1', 'therapist2']; // Placeholder
    
    onCallTherapists.forEach(therapistId => {
      this.io.emitToUser(therapistId, 'crisis-notification', {
        alertId: alert.id,
        severity: alert.severity,
        requiresAttention: alert.severity === 'high' || alert.severity === 'critical'
      });
    });
  }

  /**
   * Estimate response time based on severity
   */
  private estimateResponseTime(severity: string): number {
    switch (severity) {
      case 'critical': return 5; // 5 minutes
      case 'high': return 10; // 10 minutes
      case 'medium': return 20; // 20 minutes
      case 'low': return 30; // 30 minutes
      default: return 15;
    }
  }

  /**
   * Calculate estimated arrival time
   */
  private calculateEstimatedArrival(userLocation: any, responderId: string): number {
    // This would use real location data and routing APIs
    // For now, return a placeholder
    return 10 + Math.floor(Math.random() * 20); // 10-30 minutes
  }

  /**
   * Validate severity level
   */
  private validateSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    return validSeverities.includes(severity) ? severity as any : 'medium';
  }

  /**
   * Sanitize location data
   */
  private sanitizeLocation(location: any): any {
    return {
      latitude: parseFloat(location.latitude) || 0,
      longitude: parseFloat(location.longitude) || 0,
      accuracy: parseFloat(location.accuracy) || 100,
      timestamp: new Date(location.timestamp || Date.now())
    };
  }

  /**
   * Sanitize message content
   */
  private sanitizeMessage(message: string): string {
    // Remove any potentially harmful content
    return message.substring(0, 500).replace(/<[^>]*>/g, '');
  }

  /**
   * Determine required help based on crisis
   */
  private determineRequiredHelp(alert: CrisisAlert): string[] {
    const help = [];
    
    if (alert.severity === 'critical') {
      help.push('immediate_intervention', 'emergency_services');
    }
    
    if (alert.symptoms.includes('suicidal_thoughts')) {
      help.push('suicide_prevention', 'crisis_counselor');
    }
    
    if (alert.symptoms.includes('panic_attack')) {
      help.push('calming_techniques', 'anxiety_specialist');
    }
    
    return help;
  }

  /**
   * Get user info for crisis responders
   */
  private getUserInfoForCrisis(userId: string): any {
    // This would typically query a database
    // Return placeholder for now
    return {
      name: 'User Name',
      age: 25,
      conditions: ['anxiety', 'depression'],
      medications: ['medication1'],
      emergencyContacts: [
        {
          name: 'Emergency Contact',
          phone: '555-0100',
          relationship: 'spouse'
        }
      ]
    };
  }

  /**
   * Get responder information
   */
  private getResponderInfo(responderId: string): any {
    // This would typically query a database
    return {
      name: 'Responder Name',
      qualification: 'Crisis Counselor',
      experience: '5 years'
    };
  }

  /**
   * Encrypt sensitive data for transmission
   */
  private encryptSensitiveData(data: any, recipientId: string): string {
    // Implement encryption using recipient's public key
    // For now, return a placeholder
    const cipher = crypto.createCipher('aes-256-cbc', recipientId);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Log crisis events for audit trail
   */
  private logCrisisEvent(alertId: string, event: string, userId: string): void {
    const logEntry = {
      alertId,
      event,
      userId,
      timestamp: new Date(),
      metadata: {
        activeCrises: this.activeCrises.size,
        responders: this.crisisRooms.get(alertId)?.size || 0
      }
    };
    
    // This would typically write to a database or log file
    console.log('Crisis Event:', logEntry);
  }

  /**
   * Monitor and auto-escalate unresponded crises
   */
  private startEscalationMonitor(): void {
    setInterval(() => {
      const now = Date.now();
      
      this.activeCrises.forEach(alert => {
        const timeSinceAlert = now - alert.triggeredAt.getTime();
        const noResponders = alert.responders.length === 0;
        
        // Auto-escalate if no response within threshold
        if (alert.status === 'active' && noResponders) {
          const threshold = this.getEscalationThreshold(alert.severity);
          
          if (timeSinceAlert > threshold) {
            console.log(`Auto-escalating crisis ${alert.id} due to no response`);
            this.escalateCrisis(alert);
          }
        }
      });
    }, 60000); // Check every minute
  }

  /**
   * Get escalation threshold based on severity
   */
  private getEscalationThreshold(severity: string): number {
    switch (severity) {
      case 'critical': return 2 * 60 * 1000; // 2 minutes
      case 'high': return 5 * 60 * 1000; // 5 minutes
      case 'medium': return 15 * 60 * 1000; // 15 minutes
      case 'low': return 30 * 60 * 1000; // 30 minutes
      default: return 10 * 60 * 1000;
    }
  }

  /**
   * Get handler statistics
   */
  public getStats(): any {
    return {
      activeCrises: this.activeCrises.size,
      totalResponders: this.responderAvailability.size,
      availableResponders: Array.from(this.responderAvailability.values()).filter(a => a).length,
      escalatedCrises: this.escalationQueue.length,
      activeLocationSharing: this.locationSharing.size
    };
  }
}

export default CrisisHandler;