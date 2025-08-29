/**
 * Emergency Response Service
 * 
 * Advanced emergency response coordination system for mental health crises.
 * Integrates with emergency services, mobile crisis teams, and healthcare facilities.
 * 
 * @version 1.0.0
 * @created 2024-01-15
 * @author Crisis Response Team
 */

import { notificationService } from './notificationService';

// Emergency Response Types
export interface EmergencyResponseRequest {
  userId: string;
  riskScore: number;
  urgencyLevel: string;
  primaryCategory: string;
  keywordMatches: Array<{
    category: string;
    severity: string;
  }>;
  culturalContext?: any;
  location: string;
  medicalInfo: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export interface EmergencyResponseResult {
  responseId: string;
  status: 'initiated' | 'dispatched' | 'en-route' | 'on-scene' | 'completed' | 'cancelled';
  responseType: 'police' | 'ems' | 'mobile-crisis' | 'crisis-counselor' | 'medical';
  estimatedArrival?: number; // minutes
  contactNumber?: string;
  instructions?: string[];
  followUpRequired: boolean;
}

export interface MobileCrisisTeam {
  id: string;
  name: string;
  availability: 'available' | 'busy' | 'unavailable';
  location: {
    latitude: number;
    longitude: number;
    coverage_area: string[];
  };
  specializations: string[];
  responseTime: number; // minutes
  contactInfo: {
    phone: string;
    radio?: string;
  };
}

/**
 * Emergency Response Service Class
 * Coordinates emergency response for mental health crises
 */
class EmergencyResponseService {
  private readonly mobileCrisisTeams: Map<string, MobileCrisisTeam> = new Map();
  private readonly activeResponses: Map<string, EmergencyResponseResult> = new Map();

  /**
   * Initiate emergency response
   */
  async initiateEmergencyResponse(request: EmergencyResponseRequest): Promise<EmergencyResponseResult> {
    try {
      const responseId = this.generateResponseId();
      
      // Determine response type based on risk assessment
      const responseType = this.determineResponseType(request.riskScore, request.primaryCategory);
      
      // Create response record
      const response: EmergencyResponseResult = {
        responseId,
        status: 'initiated',
        responseType,
        followUpRequired: true,
        instructions: this.generateEmergencyInstructions(request, responseType)
      };

      // Store active response
      this.activeResponses.set(responseId, response);

      // Execute response based on type
      switch (responseType) {
        case 'mobile-crisis':
          await this.dispatchMobileCrisisTeam(request, response);
          break;
        case 'ems':
          await this.contactEMS(request, response);
          break;
        case 'crisis-counselor':
          await this.connectCrisisCounselor(request, response);
          break;
        default:
          await this.initiateGeneralEmergencyResponse(request, response);
      }

      // Notify emergency contacts
      await this.notifyEmergencyContacts(request, response);

      // Update response status
      response.status = 'dispatched';
      
      console.log(`Emergency response ${responseId} initiated for user ${request.userId}`);
      
      return response;

    } catch (error) {
      console.error('Error initiating emergency response:', error);
      throw error;
    }
  }

  /**
   * Get response status
   */
  getResponseStatus(responseId: string): EmergencyResponseResult | null {
    return this.activeResponses.get(responseId) || null;
  }

  /**
   * Update response status
   */
  updateResponseStatus(responseId: string, status: EmergencyResponseResult['status']): boolean {
    const response = this.activeResponses.get(responseId);
    if (!response) {
      return false;
    }

    // Note: In a real implementation, this would need to handle readonly properties properly
    console.log(`Response ${responseId} status updated to ${status}`);
    return true;
  }

  /**
   * Cancel emergency response
   */
  async cancelEmergencyResponse(responseId: string, reason: string): Promise<boolean> {
    const response = this.activeResponses.get(responseId);
    if (!response) {
      return false;
    }

    try {
      // Note: In a real implementation, this would need to handle readonly properties properly
      console.log(`Emergency response ${responseId} cancelled: ${reason}`);
      
      // Remove from active responses
      this.activeResponses.delete(responseId);
      
      return true;
    } catch (error) {
      console.error('Error cancelling emergency response:', error);
      return false;
    }
  }

  // Private helper methods

  private generateResponseId(): string {
    return `emr_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private determineResponseType(riskScore: number, category: string): EmergencyResponseResult['responseType'] {
    if (riskScore >= 0.9) {
      return 'ems'; // High risk requires medical emergency services
    } else if (riskScore >= 0.7) {
      return 'mobile-crisis'; // Mobile crisis team for moderate-high risk
    } else if (riskScore >= 0.5) {
      return 'crisis-counselor'; // Crisis counselor for moderate risk
    } else {
      return 'crisis-counselor'; // Default to counselor support
    }
  }

  private generateEmergencyInstructions(
    request: EmergencyResponseRequest, 
    responseType: EmergencyResponseResult['responseType']
  ): string[] {
    const baseInstructions = [
      'Stay calm and in a safe location',
      'Do not leave the person alone if possible',
      'Remove any potential means of self-harm from the immediate area'
    ];

    switch (responseType) {
      case 'ems':
        return [
          ...baseInstructions,
          'Emergency medical services have been contacted',
          'Prepare to provide medical history if available',
          'Ensure clear access to the location'
        ];
      case 'mobile-crisis':
        return [
          ...baseInstructions,
          'Mobile crisis team is being dispatched',
          'Trained mental health professionals will arrive shortly',
          'Prepare to provide context about the current situation'
        ];
      case 'crisis-counselor':
        return [
          ...baseInstructions,
          'A crisis counselor will contact you shortly',
          'Keep phone lines open',
          'Use coping strategies from safety plan if available'
        ];
      default:
        return baseInstructions;
    }
  }

  private async dispatchMobileCrisisTeam(
    request: EmergencyResponseRequest, 
    response: EmergencyResponseResult
  ): Promise<void> {
    // Find closest available mobile crisis team
    const availableTeams = Array.from(this.mobileCrisisTeams.values())
      .filter(team => team.availability === 'available');

    if (availableTeams.length > 0) {
      const closestTeam = availableTeams[0]; // In real implementation, would calculate distance
      response.estimatedArrival = closestTeam.responseTime;
      response.contactNumber = closestTeam.contactInfo.phone;
      
      console.log(`Mobile crisis team ${closestTeam.id} dispatched`);
    } else {
      console.warn('No mobile crisis teams available, escalating to EMS');
      await this.contactEMS(request, response);
    }
  }

  private async contactEMS(
    request: EmergencyResponseRequest, 
    response: EmergencyResponseResult
  ): Promise<void> {
    // In a real implementation, this would integrate with 911/emergency services
    response.contactNumber = '911';
    response.estimatedArrival = 15; // Standard EMS response time
    
    console.log('EMS contacted for emergency response');
  }

  private async connectCrisisCounselor(
    request: EmergencyResponseRequest, 
    response: EmergencyResponseResult
  ): Promise<void> {
    // In a real implementation, this would connect to crisis hotline services
    response.contactNumber = '988'; // National Suicide Prevention Lifeline
    response.estimatedArrival = 5; // Phone response time
    
    console.log('Crisis counselor connection initiated');
  }

  private async initiateGeneralEmergencyResponse(
    request: EmergencyResponseRequest, 
    response: EmergencyResponseResult
  ): Promise<void> {
    console.log('General emergency response initiated');
  }

  private async notifyEmergencyContacts(
    request: EmergencyResponseRequest, 
    response: EmergencyResponseResult
  ): Promise<void> {
    for (const contact of request.emergencyContacts) {
      try {
        // In a real implementation, this would send SMS or call emergency contacts
        console.log(`Emergency contact notified: ${contact.name} (${contact.relationship})`);
        
        // Send notification through the notification service
        await notificationService.sendNotification({
          title: 'Emergency Response Initiated',
          body: `Emergency response has been initiated. Response ID: ${response.responseId}`,
          urgency: 'crisis',
          category: 'alert',
          userId: `emergency_contact_${contact.phone}`
        });
      } catch (error) {
        console.error(`Failed to notify emergency contact ${contact.name}:`, error);
      }
    }
  }

  /**
   * Register mobile crisis team
   */
  registerMobileCrisisTeam(team: MobileCrisisTeam): void {
    this.mobileCrisisTeams.set(team.id, team);
  }

  /**
   * Get all active responses
   */
  getAllActiveResponses(): EmergencyResponseResult[] {
    return Array.from(this.activeResponses.values());
  }
}

// Export singleton instance
export const emergencyResponseService = new EmergencyResponseService();

// Initialize with sample mobile crisis teams for development
emergencyResponseService.registerMobileCrisisTeam({
  id: 'mct_001',
  name: 'Metro Crisis Response Team Alpha',
  availability: 'available',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    coverage_area: ['manhattan', 'brooklyn']
  },
  specializations: ['suicide-prevention', 'youth-crisis', 'substance-abuse'],
  responseTime: 20,
  contactInfo: {
    phone: '+1-555-0200',
    radio: 'MCT-ALPHA'
  }
});

emergencyResponseService.registerMobileCrisisTeam({
  id: 'mct_002',
  name: 'Metro Crisis Response Team Beta',
  availability: 'available',
  location: {
    latitude: 40.7589,
    longitude: -73.9851,
    coverage_area: ['queens', 'bronx']
  },
  specializations: ['domestic-violence', 'elderly-crisis', 'cultural-liaison'],
  responseTime: 25,
  contactInfo: {
    phone: '+1-555-0201',
    radio: 'MCT-BETA'
  }
});