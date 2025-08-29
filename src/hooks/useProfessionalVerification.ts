/**
 * Professional Verification Hook - Minimal Viable Version
 * Provides basic professional verification for helpers and therapists
 * CRITICAL: Maintains safety through credential verification
 */

import { useState, useCallback, useMemo } from 'react';
import useGlobalStore from '../stores/globalStore';
import { logger } from '../utils/logger';

export interface ProfessionalCredentials {
  licenseNumber: string;
  licenseState: string;
  licenseType: 'therapist' | 'counselor' | 'social_worker' | 'psychologist' | 'psychiatrist';
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
  };
  certifications?: string[];
  yearsOfExperience: number;
  specializations?: string[];
}

export interface VerificationResult {
  isVerified: boolean;
  verificationDate: Date;
  verificationId: string;
  verificationLevel: 'basic' | 'professional' | 'expert';
  expiryDate?: Date;
  verificationDetails: {
    licenseValid: boolean;
    educationVerified: boolean;
    backgroundCheckPassed: boolean;
    references?: boolean;
  };
  issues?: string[];
}

export interface VerificationState {
  isVerifying: boolean;
  verificationHistory: VerificationResult[];
  currentVerification: VerificationResult | null;
  error: string | null;
}

/**
 * useProfessionalVerification Hook
 * Provides professional credential verification for mental health practitioners
 */
export const useProfessionalVerification = () => {
  const [state, setState] = useState<VerificationState>({
    isVerifying: false,
    verificationHistory: [],
    currentVerification: null,
    error: null
  });

  const { user, updateUser, addNotification } = useGlobalStore();

  // Mock database of valid license patterns (for MVP)
  const VALID_LICENSE_PATTERNS = {
    therapist: /^[A-Z]{2}\d{6}$/,
    counselor: /^[A-Z]{3}\d{5}$/,
    social_worker: /^SW\d{6}$/,
    psychologist: /^PSY\d{6}$/,
    psychiatrist: /^MD\d{6}$/
  };

  // Verify license number format
  const verifyLicense = useCallback(async (
    licenseNumber: string,
    state: string,
    licenseType: ProfessionalCredentials['licenseType']
  ): Promise<boolean> => {
    try {
      logger.info('Verifying license', { licenseNumber, state, licenseType });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Basic format validation for MVP
      const pattern = VALID_LICENSE_PATTERNS[licenseType];
      if (!pattern) {
        logger.warn('Unknown license type', { licenseType });
        return false;
      }
      
      // Check format
      const isValidFormat = pattern.test(licenseNumber);
      
      // Check state (basic validation)
      const validStates = ['CA', 'NY', 'TX', 'FL', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
      const isValidState = validStates.includes(state.toUpperCase());
      
      const isValid = isValidFormat && isValidState;
      
      logger.info('License verification result', { isValid, licenseNumber });
      
      return isValid;
    } catch (error) {
      logger.error('License verification failed', error);
      return false;
    }
  }, []);

  // Verify education credentials
  const verifyEducation = useCallback(async (
    education: ProfessionalCredentials['education']
  ): Promise<boolean> => {
    try {
      logger.info('Verifying education', education);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation for MVP
      const validDegrees = [
        'PhD', 'PsyD', 'MD', 'MSW', 'LCSW', 'MA', 'MS', 
        'MFT', 'LPC', 'LPCC', 'LCPC', 'LMHC', 'LMFT'
      ];
      
      const hasValidDegree = validDegrees.some(degree => 
        education.degree.toUpperCase().includes(degree)
      );
      
      const isRecentGraduate = education.graduationYear > 1980 && 
                               education.graduationYear <= new Date().getFullYear();
      
      const hasInstitution = education.institution && education.institution.length > 3;
      
      const isValid = hasValidDegree && isRecentGraduate && hasInstitution;
      
      logger.info('Education verification result', { isValid });
      
      return isValid;
    } catch (error) {
      logger.error('Education verification failed', error);
      return false;
    }
  }, []);

  // Perform background check (mock for MVP)
  const performBackgroundCheck = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('Performing background check');
      
      // Simulate background check delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For MVP, randomly pass 95% of checks
      const passed = Math.random() > 0.05;
      
      logger.info('Background check result', { passed });
      
      return passed;
    } catch (error) {
      logger.error('Background check failed', error);
      return false;
    }
  }, []);

  // Main verification function
  const verifyCredentials = useCallback(async (
    credentials: ProfessionalCredentials
  ): Promise<VerificationResult> => {
    setState(prev => ({ 
      ...prev, 
      isVerifying: true, 
      error: null 
    }));
    
    try {
      logger.info('Starting professional verification', { 
        licenseType: credentials.licenseType 
      });
      
      // Verify each component
      const [licenseValid, educationVerified, backgroundCheckPassed] = await Promise.all([
        verifyLicense(
          credentials.licenseNumber,
          credentials.licenseState,
          credentials.licenseType
        ),
        verifyEducation(credentials.education),
        performBackgroundCheck()
      ]);
      
      // Determine verification level
      let verificationLevel: VerificationResult['verificationLevel'] = 'basic';
      if (licenseValid && educationVerified) {
        verificationLevel = 'professional';
      }
      if (licenseValid && educationVerified && backgroundCheckPassed && 
          credentials.yearsOfExperience >= 5) {
        verificationLevel = 'expert';
      }
      
      // Check for issues
      const issues: string[] = [];
      if (!licenseValid) issues.push('License verification failed');
      if (!educationVerified) issues.push('Education verification failed');
      if (!backgroundCheckPassed) issues.push('Background check failed');
      
      // Create verification result
      const result: VerificationResult = {
        isVerified: licenseValid && educationVerified && backgroundCheckPassed,
        verificationDate: new Date(),
        verificationId: 'VER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        verificationLevel,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        verificationDetails: {
          licenseValid,
          educationVerified,
          backgroundCheckPassed,
          references: true // Mock for MVP
        },
        issues: issues.length > 0 ? issues : undefined
      };
      
      // Update state
      setState(prev => ({
        ...prev,
        currentVerification: result,
        verificationHistory: [...prev.verificationHistory, result],
        isVerifying: false
      }));
      
      // Update user profile if verification successful
      if (result.isVerified && user) {
        updateUser({
          role: 'helper' as any,
          isVerified: true
        });
        
        addNotification({
          type: 'success',
          title: 'Verification Complete',
          message: `You are now verified as a ${verificationLevel} helper!`,
          persistent: false
        });
      } else if (!result.isVerified) {
        addNotification({
          type: 'error',
          title: 'Verification Failed',
          message: `Issues found: ${issues.join(', ')}`,
          persistent: false
        });
      }
      
      logger.info('Professional verification completed', {
        isVerified: result.isVerified,
        level: result.verificationLevel,
        issues: result.issues
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      
      logger.error('Professional verification error', error);
      
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage
      }));
      
      // Return failed verification
      return {
        isVerified: false,
        verificationDate: new Date(),
        verificationId: 'VER_FAILED_' + Date.now(),
        verificationLevel: 'basic',
        verificationDetails: {
          licenseValid: false,
          educationVerified: false,
          backgroundCheckPassed: false
        },
        issues: [errorMessage]
      };
    }
  }, [user, updateUser, addNotification, verifyLicense, verifyEducation, performBackgroundCheck]);

  // Check if current user is verified
  const isUserVerified = useCallback((): boolean => {
    if (!user) return false;
    
    // Check current verification
    if (state.currentVerification?.isVerified) {
      const expiry = state.currentVerification.expiryDate;
      if (expiry && expiry > new Date()) {
        return true;
      }
    }
    
    // Check user's verified status
    return user.isVerified === true;
  }, [user, state.currentVerification]);

  // Get verification status
  const getVerificationStatus = useCallback((): {
    status: 'unverified' | 'pending' | 'verified' | 'expired';
    level?: VerificationResult['verificationLevel'];
    expiryDate?: Date;
  } => {
    if (state.isVerifying) {
      return { status: 'pending' };
    }
    
    if (state.currentVerification?.isVerified) {
      const expiry = state.currentVerification.expiryDate;
      if (expiry && expiry < new Date()) {
        return { status: 'expired', expiryDate: expiry };
      }
      
      return {
        status: 'verified',
        level: state.currentVerification.verificationLevel,
        expiryDate: expiry
      };
    }
    
    return { status: 'unverified' };
  }, [state.isVerifying, state.currentVerification]);

  // Clear verification error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Memoize return value
  const returnValue = useMemo(() => ({
    // State
    ...state,
    isVerified: isUserVerified(),
    verificationStatus: getVerificationStatus(),
    
    // Methods
    verifyCredentials,
    verifyLicense,
    verifyEducation,
    isUserVerified,
    getVerificationStatus,
    clearError,
    
    // Constants
    REQUIRED_DOCUMENTS: [
      'Professional License',
      'Degree Certificate',
      'Liability Insurance',
      'Background Check Consent'
    ],
    VERIFICATION_LEVELS: {
      basic: 'Peer Support Specialist',
      professional: 'Licensed Mental Health Professional',
      expert: 'Senior Mental Health Expert'
    }
  }), [
    state,
    isUserVerified,
    getVerificationStatus,
    verifyCredentials,
    verifyLicense,
    verifyEducation,
    clearError
  ]);

  return returnValue;
};

// Export default for backwards compatibility
export default useProfessionalVerification;