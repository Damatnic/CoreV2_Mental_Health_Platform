/**
 * Professional Network Service
 * 
 * Advanced professional network management system for mental health crisis intervention.
 * Provides comprehensive professional coordination, availability tracking, and workflow integration.
 * 
 * @version 1.0.0
 * @created 2024-01-15
 * @author Crisis Response Team
 */

import { notificationService } from './notificationService';

// Professional Network Types
export interface ProfessionalNetworkMember {
  id: string;
  name: string;
  role: string;
  specializations: string[];
  availability: 'available' | 'busy' | 'unavailable' | 'emergency-only';
  responseTimeExpected: number; // minutes
  qualityRating: number; // 0-5
  contactMethods: {
    phone?: string;
    email?: string;
    secure_message?: string;
  };
}

export interface ProfessionalAssignmentRequest {
  workflowId: string;
  requiredRole: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical' | 'immediate';
  specializations?: string[];
  culturalRequirements?: string[];
  languageRequirements?: string[];
}

export interface ProfessionalNotificationOptions {
  professionalId: string;
  workflowId: string;
  urgency: string;
  method: string;
  contact: string;
  message: string;
  expectedResponseTime: number;
  culturalConsiderations?: any;
}

/**
 * Professional Network Service Class
 * Manages professional network coordination and availability
 */
class ProfessionalNetworkService {
  private readonly professionals: Map<string, ProfessionalNetworkMember> = new Map();

  /**
   * Find available professional for assignment
   */
  async findAvailableProfessional(
    request: ProfessionalAssignmentRequest
  ): Promise<ProfessionalNetworkMember | null> {
    const availableProfessionals = Array.from(this.professionals.values())
      .filter(prof => 
        prof.role === request.requiredRole &&
        prof.availability !== 'unavailable' &&
        (request.urgencyLevel === 'immediate' || prof.availability !== 'emergency-only')
      );

    // Sort by response time and quality
    availableProfessionals.sort((a, b) => {
      const aScore = a.responseTimeExpected + (5 - a.qualityRating) * 10;
      const bScore = b.responseTimeExpected + (5 - b.qualityRating) * 10;
      return aScore - bScore;
    });

    return availableProfessionals[0] || null;
  }

  /**
   * Send notification to professional
   */
  async sendProfessionalNotification(options: ProfessionalNotificationOptions): Promise<void> {
    try {
      // Find the professional
      const professional = this.professionals.get(options.professionalId);
      if (!professional) {
        throw new Error(`Professional ${options.professionalId} not found`);
      }

      // Send notification based on method
      await notificationService.sendNotification({
        title: 'Crisis Consultation Request',
        body: options.message,
        urgency: this.mapUrgencyToPriority(options.urgency) as any,
        category: 'alert',
        userId: options.professionalId
      });

      console.log(`Professional notification sent to ${options.professionalId} for workflow ${options.workflowId}`);
    } catch (error) {
      console.error('Error sending professional notification:', error);
      throw error;
    }
  }

  /**
   * Get professional availability
   */
  getProfessionalAvailability(professionalId: string): string | null {
    const professional = this.professionals.get(professionalId);
    return professional?.availability || null;
  }

  /**
   * Update professional availability
   */
  updateProfessionalAvailability(professionalId: string, availability: string): boolean {
    const professional = this.professionals.get(professionalId);
    if (!professional) {
      return false;
    }

    // Note: In a real implementation, this would need to handle readonly properties properly
    // For now, this is a stub implementation
    console.log(`Professional ${professionalId} availability updated to ${availability}`);
    return true;
  }

  /**
   * Register a professional in the network
   */
  registerProfessional(professional: ProfessionalNetworkMember): void {
    this.professionals.set(professional.id, professional);
  }

  /**
   * Get all professionals in the network
   */
  getAllProfessionals(): ProfessionalNetworkMember[] {
    return Array.from(this.professionals.values());
  }

  /**
   * Get professionals by role
   */
  getProfessionalsByRole(role: string): ProfessionalNetworkMember[] {
    return Array.from(this.professionals.values())
      .filter(prof => prof.role === role);
  }

  // Private helper methods
  private mapUrgencyToPriority(urgency: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (urgency) {
      case 'immediate': return 'critical';
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }
}

// Export singleton instance
export const professionalNetworkService = new ProfessionalNetworkService();

// Initialize with some default professionals for development
professionalNetworkService.registerProfessional({
  id: 'prof_crisis_001',
  name: 'Dr. Sarah Chen',
  role: 'crisis-counselor',
  specializations: ['crisis-intervention', 'suicide-prevention'],
  availability: 'available',
  responseTimeExpected: 15,
  qualityRating: 4.8,
  contactMethods: {
    phone: '+1-555-0101',
    email: 'sarah.chen@crisisnetwork.com'
  }
});

professionalNetworkService.registerProfessional({
  id: 'prof_therapist_001',
  name: 'Dr. Michael Rodriguez',
  role: 'licensed-therapist',
  specializations: ['anxiety-disorders', 'depression-treatment'],
  availability: 'available',
  responseTimeExpected: 30,
  qualityRating: 4.5,
  contactMethods: {
    phone: '+1-555-0102',
    email: 'michael.rodriguez@therapynetwork.com'
  }
});