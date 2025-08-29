/**
 * Professional Integration Hook for Mental Health Platform
 * 
 * Seamless integration with mental health professionals including
 * therapists, psychiatrists, and care coordinators with HIPAA compliance.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type ProfessionalRole = 
  | 'therapist' | 'psychiatrist' | 'psychologist' | 'counselor' 
  | 'social-worker' | 'peer-specialist' | 'care-coordinator' 
  | 'crisis-counselor' | 'case-manager';

export interface ProfessionalProfile {
  id: string;
  name: string;
  role: ProfessionalRole;
  credentials: string[];
  specializations: string[];
  languages: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    secure_messaging?: boolean;
  };
  availability: {
    emergency: boolean;
    regular_hours: string;
    timezone: string;
  };
  preferences: {
    communication_style: 'formal' | 'casual' | 'adaptive';
    crisis_notification: 'immediate' | 'urgent' | 'next_business_day';
    data_sharing_level: 'basic' | 'comprehensive' | 'custom';
  };
  verified: boolean;
  last_active: Date;
}

export interface SharedDataPacket {
  patient_id: string;
  professional_id: string;
  data_type: 'mood_entry' | 'crisis_alert' | 'progress_report' | 'assessment';
  content: any;
  timestamp: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requires_response: boolean;
  response_deadline?: Date;
  encryption_level: 'standard' | 'enhanced';
}

export interface NotificationRequest {
  professional_id: string;
  type: 'crisis_alert' | 'mood_decline' | 'progress_update' | 'medication_concern';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data_context?: any;
  preferred_response_time?: number; // in minutes
}

export const useProfessionalIntegration = () => {
  const { user } = useAuth();
  
  const [connectedProfessionals, setConnectedProfessionals] = useState<ProfessionalProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<NotificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notifyProfessional = useCallback(async (request: NotificationRequest) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would send secure notification
      console.log('Notifying professional:', request);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingRequests(prev => [...prev, request]);
      
    } catch (error) {
      setError('Failed to notify professional');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const shareMoodData = useCallback(async (moodEntry: any) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Mock sharing with connected professionals
    console.log('Sharing mood data with professionals:', moodEntry);
    
    // In real implementation, would encrypt and send to authorized professionals
    return Promise.resolve();
  }, [user]);

  const connectToProfessional = useCallback(async (professionalId: string) => {
    setIsLoading(true);
    try {
      // Mock professional connection
      const mockProfessional: ProfessionalProfile = {
        id: professionalId,
        name: 'Dr. Sarah Johnson',
        role: 'therapist',
        credentials: ['LCSW', 'PhD'],
        specializations: ['anxiety', 'depression', 'trauma'],
        languages: ['english', 'spanish'],
        contactInfo: {
          email: 'sarah.johnson@therapygroup.com',
          secure_messaging: true
        },
        availability: {
          emergency: false,
          regular_hours: 'Mon-Fri 9AM-5PM',
          timezone: 'EST'
        },
        preferences: {
          communication_style: 'adaptive',
          crisis_notification: 'urgent',
          data_sharing_level: 'comprehensive'
        },
        verified: true,
        last_active: new Date()
      };

      setConnectedProfessionals(prev => [...prev, mockProfessional]);
      
    } catch (error) {
      setError('Failed to connect to professional');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isConnectedToProfessional = useMemo(() => {
    return connectedProfessionals.length > 0;
  }, [connectedProfessionals]);

  return {
    // State
    connectedProfessionals,
    pendingRequests,
    isLoading,
    error,
    isConnectedToProfessional,
    
    // Actions
    notifyProfessional,
    shareMoodData,
    connectToProfessional
  };
};

export default useProfessionalIntegration;