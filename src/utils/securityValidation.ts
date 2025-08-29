/**
 * Client-side Security Validation Utilities
 * 
 * Provides real-time validation and sanitization for mental health platform
 * with HIPAA-compliant data handling and crisis-aware security measures.
 * 
 * @fileoverview Security validation utilities for sensitive mental health data
 * @version 2.0.0
 */

import { z } from 'zod';

/**
 * Crisis message validation result
 */
export interface CrisisValidationResult {
  isValid: boolean;
  sanitizedMessage: string;
  warnings: string[];
  crisisLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresImmediateAttention: boolean;
}

/**
 * Emergency contact validation result
 */
export interface ContactValidationResult {
  isValid: boolean;
  sanitizedContact: any;
  errors: string[];
  shouldEncrypt: string[];
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: string[];
  sanitizedData: any;
}

/**
 * Client-side crisis data validator
 */
export class CrisisDataValidator {
  
  private static readonly CRISIS_KEYWORDS = {
    critical: [
      'suicide', 'kill myself', 'want to die', 'end it all',
      'no point living', 'better off dead', 'end my life'
    ],
    high: [
      'hopeless', 'worthless', 'can\'t go on', 'no point',
      'give up', 'nothing matters', 'hate myself'
    ],
    medium: [
      'hurt myself', 'self harm', 'cutting', 'depressed',
      'anxious', 'overwhelmed', 'stressed'
    ]
  };

  private static readonly IMMEDIATE_DANGER_INDICATORS = [
    'tonight', 'now', 'today', 'right now', 'this moment',
    'plan to', 'going to', 'will do it'
  ];

  /**
   * Validate crisis message before sending to API
   */
  public static validateCrisisMessage(message: string): CrisisValidationResult {
    const warnings: string[] = [];
    let crisisLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let requiresImmediateAttention = false;

    // Basic validation
    if (!message || message.trim().length === 0) {
      return {
        isValid: false,
        sanitizedMessage: '',
        warnings: ['Message cannot be empty'],
        crisisLevel: 'low',
        requiresImmediateAttention: false
      };
    }

    // Sanitize the message
    let sanitizedMessage = this.sanitizeText(message);

    // Check length and truncate if necessary
    if (sanitizedMessage.length > 5000) {
      sanitizedMessage = sanitizedMessage.substring(0, 5000);
      warnings.push('Message was truncated to 5000 characters');
    }

    // Analyze crisis keywords
    const messageLower = sanitizedMessage.toLowerCase();
    const detectedKeywords = this.analyzeKeywords(messageLower);
    
    // Determine crisis level
    if (detectedKeywords.critical.length >= 1) {
      crisisLevel = 'critical';
    } else if (detectedKeywords.high.length >= 2 || 
               (detectedKeywords.high.length >= 1 && detectedKeywords.medium.length >= 2)) {
      crisisLevel = 'high';
    } else if (detectedKeywords.high.length >= 1 || detectedKeywords.medium.length >= 2) {
      crisisLevel = 'medium';
    }

    // Check for immediate danger indicators
    const hasImmediateTiming = this.IMMEDIATE_DANGER_INDICATORS.some(
      indicator => messageLower.includes(indicator)
    );

    if (hasImmediateTiming && (crisisLevel === 'high' || crisisLevel === 'critical')) {
      requiresImmediateAttention = true;
      warnings.push('Immediate crisis indicators detected - emergency resources will be provided');
    }

    return {
      isValid: true,
      sanitizedMessage,
      warnings,
      crisisLevel,
      requiresImmediateAttention
    };
  }

  /**
   * Analyze keywords in message
   */
  private static analyzeKeywords(message: string) {
    const detected = {
      critical: [] as string[],
      high: [] as string[],
      medium: [] as string[]
    };

    Object.entries(this.CRISIS_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (message.includes(keyword)) {
          detected[level as keyof typeof detected].push(keyword);
        }
      });
    });

    return detected;
  }

  /**
   * Sanitize text input
   */
  private static sanitizeText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
}

/**
 * Personal information validator for emergency contacts and profiles
 */
export class PersonalInfoValidator {

  /**
   * Validate emergency contact information
   */
  public static validateEmergencyContact(contact: {
    name: string;
    phone?: string;
    email?: string;
    relationship?: string;
    notes?: string;
  }): ContactValidationResult {
    const errors: string[] = [];
    const shouldEncrypt: string[] = [];
    const sanitizedContact = { ...contact };

    // Validate name
    if (!contact.name || contact.name.trim().length < 2) {
      errors.push('Contact name must be at least 2 characters');
    } else {
      sanitizedContact.name = this.sanitizeText(contact.name).substring(0, 100);
      shouldEncrypt.push('name');
    }

    // Validate phone
    if (contact.phone) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,20}$/;
      if (!phoneRegex.test(contact.phone)) {
        errors.push('Invalid phone number format');
      } else {
        sanitizedContact.phone = contact.phone.replace(/[^\d\+\-\(\)\s]/g, '');
        shouldEncrypt.push('phone');
      }
    }

    // Validate email
    if (contact.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        errors.push('Invalid email format');
      } else {
        shouldEncrypt.push('email');
      }
    }

    // Must have at least one contact method
    if (!contact.phone && !contact.email) {
      errors.push('At least one contact method (phone or email) is required');
    }

    // Validate relationship
    if (contact.relationship) {
      sanitizedContact.relationship = this.sanitizeText(contact.relationship).substring(0, 50);
    }

    // Validate notes
    if (contact.notes) {
      sanitizedContact.notes = this.sanitizeText(contact.notes).substring(0, 500);
    }

    return {
      isValid: errors.length === 0,
      sanitizedContact,
      errors,
      shouldEncrypt
    };
  }

  /**
   * Validate user profile information
   */
  public static validateUserProfile(profile: {
    displayName?: string;
    preferredInterventionStyle?: string;
    accessibilityNeeds?: Record<string, any>;
    privacyLevel?: number;
  }) {
    const errors: string[] = [];
    const sanitizedProfile = { ...profile };

    // Validate display name
    if (profile.displayName) {
      if (profile.displayName.length > 100) {
        errors.push('Display name too long');
      } else {
        sanitizedProfile.displayName = this.sanitizeText(profile.displayName);
      }
    }

    // Validate intervention style
    const validStyles = ['gentle', 'direct', 'clinical', 'peer'];
    if (profile.preferredInterventionStyle && 
        !validStyles.includes(profile.preferredInterventionStyle)) {
      errors.push('Invalid intervention style');
    }

    // Validate privacy level
    if (profile.privacyLevel !== undefined) {
      if (typeof profile.privacyLevel !== 'number' || 
          profile.privacyLevel < 1 || profile.privacyLevel > 5) {
        errors.push('Privacy level must be between 1 and 5');
      }
    }

    // Validate accessibility needs
    if (profile.accessibilityNeeds) {
      try {
        JSON.stringify(profile.accessibilityNeeds);
      } catch {
        errors.push('Invalid accessibility needs format');
        delete sanitizedProfile.accessibilityNeeds;
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedProfile,
      errors
    };
  }

  /**
   * Sanitize text input
   */
  private static sanitizeText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
}

/**
 * Chat message validator
 */
export class ChatMessageValidator {

  private static readonly MODERATION_KEYWORDS = [
    'violence', 'hate', 'harassment', 'discrimination',
    'illegal', 'drugs', 'explicit', 'abuse'
  ];

  /**
   * Validate chat message before sending
   */
  public static validateChatMessage(message: {
    content: string;
    conversationId: string;
    isAI?: boolean;
  }) {
    const errors: string[] = [];
    let requiresModeration = false;
    const sanitizedMessage = { ...message };

    // Validate content
    if (!message.content || message.content.trim().length === 0) {
      errors.push('Message content cannot be empty');
    } else if (message.content.length > 10000) {
      errors.push('Message too long (maximum 10,000 characters)');
    } else {
      sanitizedMessage.content = this.sanitizeText(message.content);
      
      // Check for content that requires moderation
      const contentLower = sanitizedMessage.content.toLowerCase();
      requiresModeration = this.MODERATION_KEYWORDS.some(
        keyword => contentLower.includes(keyword)
      );
    }

    // Validate conversation ID
    if (!message.conversationId || message.conversationId.trim().length === 0) {
      errors.push('Conversation ID is required');
    } else {
      sanitizedMessage.conversationId = this.sanitizeText(message.conversationId);
    }

    return {
      isValid: errors.length === 0,
      sanitizedMessage,
      errors,
      requiresModeration
    };
  }

  /**
   * Sanitize text input
   */
  private static sanitizeText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
}

/**
 * File upload validator
 */
export class FileUploadValidator {
  
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'text/plain', 'application/pdf'
  ];

  /**
   * Validate file upload
   */
  public static validateFile(file: File) {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      errors.push('File type not allowed');
    }

    // Sanitize filename
    const sanitizedFilename = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100);

    // Check for suspicious filenames
    if (/\.(exe|bat|cmd|scr|vbs|jar)$/i.test(file.name)) {
      errors.push('Executable files not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilename
    };
  }
}

/**
 * Real-time form validation
 */
export class FormSecurityValidator {

  /**
   * Validate form data in real-time
   */
  public static validateFormData(
    formType: 'crisis' | 'profile' | 'emergency_contact' | 'chat',
    data: any
  ): FormValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: string[] = [];
    let sanitizedData = {};

    try {
      switch (formType) {
        case 'crisis':
          const crisisValidation = CrisisDataValidator.validateCrisisMessage(data.message || '');
          if (!crisisValidation.isValid) {
            errors.message = crisisValidation.warnings;
          }
          sanitizedData = { message: crisisValidation.sanitizedMessage };
          warnings.push(...crisisValidation.warnings);
          break;

        case 'emergency_contact':
          const contactValidation = PersonalInfoValidator.validateEmergencyContact(data);
          if (!contactValidation.isValid) {
            Object.keys(data).forEach(key => {
              if (contactValidation.errors.some(error => 
                error.toLowerCase().includes(key))) {
                errors[key] = contactValidation.errors;
              }
            });
          }
          sanitizedData = contactValidation.sanitizedContact;
          break;

        case 'profile':
          const profileValidation = PersonalInfoValidator.validateUserProfile(data);
          if (!profileValidation.isValid) {
            errors.general = profileValidation.errors;
          }
          sanitizedData = profileValidation.sanitizedProfile;
          break;

        case 'chat':
          const chatValidation = ChatMessageValidator.validateChatMessage(data);
          if (!chatValidation.isValid) {
            errors.content = chatValidation.errors;
          }
          if (chatValidation.requiresModeration) {
            warnings.push('Message flagged for review');
          }
          sanitizedData = chatValidation.sanitizedMessage;
          break;

        default:
          errors.general = ['Unknown form type'];
      }
    } catch (error) {
      console.error('Form validation error:', { formType, error });
      errors.general = ['Validation failed'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }
}

// Zod schemas for additional validation
export const CrisisMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.object({
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional(),
    timestamp: z.date().optional()
  }).optional()
});

export const EmergencyContactSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[\+]?[\d\s\-\(\)]{10,20}$/).optional(),
  email: z.string().email().optional(),
  relationship: z.string().max(50).optional(),
  notes: z.string().max(500).optional()
}).refine(data => data.phone || data.email, {
  message: 'At least one contact method is required'
});

// Export validators for easy use
export const validateCrisisMessage = CrisisDataValidator.validateCrisisMessage;
export const validateEmergencyContact = PersonalInfoValidator.validateEmergencyContact;
export const validateChatMessage = ChatMessageValidator.validateChatMessage;
export const validateFile = FileUploadValidator.validateFile;
export const validateForm = FormSecurityValidator.validateFormData;

// Default export with all utilities
export default {
  CrisisDataValidator,
  PersonalInfoValidator,
  ChatMessageValidator,
  FileUploadValidator,
  FormSecurityValidator,
  validateCrisisMessage,
  validateEmergencyContact,
  validateChatMessage,
  validateFile,
  validateForm,
  CrisisMessageSchema,
  EmergencyContactSchema
};
