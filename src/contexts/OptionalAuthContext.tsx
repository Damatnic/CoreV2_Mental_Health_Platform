import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';

// Type imports with proper error handling
interface WebAuthSession {
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  getUser: () => Promise<any>;
  getAccessToken: () => Promise<string | null>;
}

// Enhanced type definitions for mental health platform
export type UserRole = 'seeker' | 'helper' | 'therapist' | 'moderator' | 'admin' | 'crisis-specialist' | 'peer-supporter';
export type AuthenticationMode = 'authenticated' | 'anonymous' | 'demo' | 'emergency-access' | 'guest-crisis';
export type CrisisAccessLevel = 'standard' | 'elevated' | 'emergency' | 'crisis-team';
export type SecurityLevel = 'basic' | 'enhanced' | 'hipaa-compliant' | 'crisis-secure';

// Core auth user type
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isDemo?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

// JWT payload type
export interface JWTPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  role?: UserRole;
}

// Demo user type
export interface DemoUser extends AuthUser {
  isDemo: true;
}

// Helper type definition
export interface Helper {
  id: string;
  userId: string;
  name: string;
  email: string;
  specializations: string[];
  bio: string;
  isVerified: boolean;
  rating: number;
  totalSessions: number;
  availability: 'available' | 'busy' | 'offline';
  createdAt: string;
  updatedAt: string;
}

// Mental Health specific interfaces
export interface MentalHealthAuthUser extends AuthUser {
  role: UserRole;
  isDemo?: boolean;
  isCrisisUser?: boolean;
  isTherapeuticUser?: boolean;
  mentalHealthProfile?: MentalHealthProfile;
  crisisAccessLevel?: CrisisAccessLevel;
  securityLevel?: SecurityLevel;
  accessibilityNeeds?: AccessibilityNeeds;
  therapeuticSettings?: TherapeuticSettings;
  emergencyContacts?: EmergencyContact[];
  safetyPlanId?: string;
  consentRecords?: ConsentRecord[];
  lastCrisisAssessment?: Date;
  anonymousSessionData?: AnonymousSessionData;
}

export interface MentalHealthProfile {
  seekerId?: string;
  helperId?: string;
  therapistId?: string;
  anonymizedId?: string;
  primaryConcerns?: string[];
  supportPreferences?: string[];
  crisisHistory?: CrisisHistoryItem[];
  therapeuticGoals?: string[];
  culturalBackground?: string;
  languagePreferences?: string[];
  timezone?: string;
  availabilityPreferences?: AvailabilityPreferences;
  privacyLevel?: 'minimal' | 'standard' | 'enhanced' | 'maximum';
}

export interface CrisisHistoryItem {
  id: string;
  timestamp: Date;
  level: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  interventions?: string[];
  followUpRequired?: boolean;
}

export interface AccessibilityNeeds {
  screenReader?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
  reducedMotion?: boolean;
  cognitiveSupport?: boolean;
  languageAssistance?: string;
  alternativeInputMethods?: string[];
}

export interface TherapeuticSettings {
  enableCrisisDetection?: boolean;
  crisisSensitivity?: 'low' | 'medium' | 'high';
  therapeuticMode?: boolean;
  enableMoodTracking?: boolean;
  enableJournaling?: boolean;
  reminderPreferences?: ReminderPreferences;
  goalTrackingEnabled?: boolean;
  progressSharingLevel?: 'private' | 'anonymous' | 'therapeutic-team' | 'community';
}

export interface ReminderPreferences {
  medicationReminders?: boolean;
  therapyAppointments?: boolean;
  selfCareActivities?: boolean;
  safetyPlanReview?: boolean;
  customReminders?: CustomReminder[];
}

export interface CustomReminder {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  enabled: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isTherapist?: boolean;
  isPrimary?: boolean;
  available247?: boolean;
  crisisRole?: 'primary' | 'secondary' | 'professional' | 'peer';
}

export interface ConsentRecord {
  id: string;
  consentType: 'data-processing' | 'crisis-intervention' | 'therapeutic-sharing' | 'research' | 'emergency-contact';
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress?: string;
}

export interface AnonymousSessionData {
  sessionId: string;
  startTime: Date;
  interactions?: AnonymousInteraction[];
  crisisInterventions?: AnonymousCrisisIntervention[];
  resourcesAccessed?: string[];
  supportSeekerIntent?: boolean;
  conversionPrompts?: number;
}

export interface AnonymousInteraction {
  timestamp: Date;
  type: 'chat' | 'resource-view' | 'tool-use' | 'crisis-check';
  details?: any;
}

export interface AnonymousCrisisIntervention {
  timestamp: Date;
  level: 'low' | 'medium' | 'high' | 'critical';
  intervention: string;
  outcome?: 'resolved' | 'escalated' | 'ongoing' | 'user-left';
}

export interface AvailabilityPreferences {
  timezone: string;
  preferredTimes?: { start: string; end: string }[];
  unavailableDays?: string[];
  crisisAvailability?: boolean;
  immediateResponseTimes?: { start: string; end: string }[];
}

// Registration and application data interfaces
export interface EnhancedRegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  acceptedTerms: boolean;
  role?: UserRole;
  mentalHealthProfile?: Partial<MentalHealthProfile>;
  accessibilityNeeds?: AccessibilityNeeds;
  therapeuticSettings?: TherapeuticSettings;
  emergencyContacts?: EmergencyContact[];
  consentRecords: ConsentRecord[];
  anonymousSessionId?: string;
}

export interface EnhancedHelperApplicationData {
  qualifications: string;
  experience: string;
  specializations: string[];
  availability: AvailabilityPreferences;
  motivation: string;
  crisisTraining?: boolean;
  therapeuticApproaches?: string[];
  culturalCompetencies?: string[];
  languageCapabilities?: string[];
  backgroundCheck?: boolean;
  professionalReferences?: ProfessionalReference[];
  certifications?: Certification[];
  liabilityInsurance?: boolean;
}

export interface ProfessionalReference {
  name: string;
  title: string;
  organization: string;
  email: string;
  phone: string;
  relationship: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  verificationCode?: string;
}

export interface TherapistApplicationData extends EnhancedHelperApplicationData {
  licenseNumber: string;
  licenseState: string;
  licenseExpiration: Date;
  therapeuticApproaches: string[];
  specializations: string[];
  yearsOfExperience: number;
  educationBackground: EducationBackground[];
  professionalMemberships?: ProfessionalMembership[];
  malpracticeInsurance: boolean;
  teleHealthCertification?: boolean;
}

export interface EducationBackground {
  degree: string;
  institution: string;
  graduationYear: number;
  accreditation?: string;
}

export interface ProfessionalMembership {
  organization: string;
  membershipType: string;
  memberSince: Date;
  currentStatus: 'active' | 'inactive' | 'suspended';
}

// Option interfaces
export interface LoginOptions {
  rememberMe?: boolean;
  enableCrisisMode?: boolean;
  bypassTwoFactor?: boolean;
  emergencyLogin?: boolean;
}

export interface AnonymousOptions {
  trackCrisisInteractions?: boolean;
  enableSupportPrompts?: boolean;
  allowConversion?: boolean;
}

export interface DemoOptions {
  simulateCrisisScenario?: boolean;
  enableAllFeatures?: boolean;
  customProfile?: Partial<MentalHealthProfile>;
}

export interface CrisisIncident {
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  location?: string;
  contactedAuthorities?: boolean;
  interventionsUsed?: string[];
  followUpNeeded?: boolean;
}

// Context type definition
export interface MentalHealthOptionalAuthContextType {
  // Core auth state
  isAuthenticated: boolean;
  isAnonymous: boolean;
  authenticationMode: AuthenticationMode;
  user: MentalHealthAuthUser | null;
  userToken: string | null;
  anonymousId: string | null;
  sessionId: string | null;
  
  // Mental health specific state
  helperProfile: Helper | null;
  isHelper: boolean;
  isTherapist: boolean;
  isCrisisSpecialist: boolean;
  isPeerSupporter: boolean;
  crisisAccessLevel: CrisisAccessLevel;
  securityLevel: SecurityLevel;
  
  // Crisis and emergency state
  isCrisisMode: boolean;
  emergencyAccessEnabled: boolean;
  lastCrisisCheck?: Date;
  
  // Loading and initialization state
  isLoading: boolean;
  isInitializing: boolean;
  
  // Core auth methods
  login: (email?: string, password?: string, options?: LoginOptions) => Promise<void>;
  logout: (preserveAnonymous?: boolean) => Promise<void>;
  register: (userData: EnhancedRegisterData) => Promise<void>;
  
  // Anonymous and guest methods
  enableAnonymousMode: (options?: AnonymousOptions) => void;
  enableGuestCrisisAccess: (bypassCode?: string) => Promise<void>;
  convertAnonymousToUser: (userData: EnhancedRegisterData) => Promise<void>;
  
  // Mental health role methods
  applyAsHelper: (helperData: EnhancedHelperApplicationData) => Promise<void>;
  applyAsTherapist: (therapistData: TherapistApplicationData) => Promise<void>;
  updateHelperProfile: (updates: Partial<Helper>) => Promise<void>;
  updateMentalHealthProfile: (updates: Partial<MentalHealthProfile>) => Promise<void>;
  
  // Crisis and emergency methods
  enableCrisisMode: () => Promise<void>;
  disableCrisisMode: () => Promise<void>;
  reportCrisisIncident: (incident: CrisisIncident) => Promise<void>;
  requestEmergencyAccess: (reason: string) => Promise<boolean>;
  
  // Demo and testing methods
  loginAsDemo: (userType: UserRole, options?: DemoOptions) => Promise<void>;
  
  // Accessibility and therapeutic methods
  updateAccessibilityNeeds: (needs: AccessibilityNeeds) => Promise<void>;
  updateTherapeuticSettings: (settings: TherapeuticSettings) => Promise<void>;
  
  // Privacy and consent methods
  updateConsentRecords: (consents: ConsentRecord[]) => Promise<void>;
  revokeConsent: (consentType: string) => Promise<void>;
  
  // Utility methods
  refreshAuth: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  validateCrisisAccess: () => Promise<boolean>;
  exportUserData: () => Promise<any>;
  deleteUserData: () => Promise<void>;
}

// Environment variables with defaults
const AUTH0_DOMAIN = import.meta.env?.VITE_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = import.meta.env?.VITE_AUTH0_CLIENT_ID || '';
const CRISIS_AUTH_BYPASS_CODE = import.meta.env?.VITE_CRISIS_BYPASS_CODE || 'EMERGENCY911';

// Enhanced demo users for comprehensive testing
const ENHANCED_DEMO_USERS: (DemoUser & { 
  mentalHealthProfile?: MentalHealthProfile;
  crisisAccessLevel?: CrisisAccessLevel;
  accessibilityNeeds?: AccessibilityNeeds;
})[] = [
  {
    id: 'demo-seeker-1',
    email: 'demo@seeker.com',
    name: 'Demo Seeker',
    role: 'seeker',
    isDemo: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    mentalHealthProfile: {
      primaryConcerns: ['anxiety', 'depression'],
      supportPreferences: ['peer-support', 'professional-guidance'],
      culturalBackground: 'diverse',
      languagePreferences: ['en-US'],
      timezone: 'America/New_York',
      privacyLevel: 'standard'
    },
    crisisAccessLevel: 'standard',
    accessibilityNeeds: {
      screenReader: false,
      highContrast: false,
      cognitiveSupport: false
    }
  },
  {
    id: 'demo-helper-1',
    email: 'demo@helper.com',
    name: 'Demo Helper',
    role: 'helper',
    isDemo: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    mentalHealthProfile: {
      supportPreferences: ['peer-support', 'crisis-intervention'],
      culturalBackground: 'diverse',
      languagePreferences: ['en-US', 'es-ES'],
      timezone: 'America/New_York',
      privacyLevel: 'enhanced'
    },
    crisisAccessLevel: 'elevated'
  },
  {
    id: 'demo-therapist-1',
    email: 'demo@therapist.com',
    name: 'Demo Therapist',
    role: 'therapist',
    isDemo: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    mentalHealthProfile: {
      supportPreferences: ['professional-therapy', 'crisis-intervention'],
      culturalBackground: 'professional',
      languagePreferences: ['en-US'],
      timezone: 'America/New_York',
      privacyLevel: 'maximum'
    },
    crisisAccessLevel: 'emergency'
  },
  {
    id: 'demo-crisis-specialist-1',
    email: 'demo@crisis.com',
    name: 'Demo Crisis Specialist',
    role: 'crisis-specialist',
    isDemo: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    mentalHealthProfile: {
      supportPreferences: ['crisis-intervention', 'emergency-response'],
      culturalBackground: 'professional',
      languagePreferences: ['en-US'],
      timezone: 'America/New_York',
      privacyLevel: 'maximum'
    },
    crisisAccessLevel: 'crisis-team'
  }
];

// Utility functions
class ApiClient {
  private baseURL: string = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';

  async get(endpoint: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        ...options
      });
      return response.json();
    } catch (error) {
      console.error('API GET error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async post(endpoint: string, data?: any, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      return response.json();
    } catch (error) {
      console.error('API POST error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async put(endpoint: string, data?: any, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      return response.json();
    } catch (error) {
      console.error('API PUT error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(endpoint: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        ...options
      });
      return response.json();
    } catch (error) {
      console.error('API DELETE error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Local storage service
class LocalStorageService {
  getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage setItem error:', error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage removeItem error:', error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }
}

// Logger service
class Logger {
  info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

// Notification context interface
interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

// Create instances
const apiClient = new ApiClient();
const localStorageService = new LocalStorageService();
const logger = new Logger();

// Create context
const MentalHealthOptionalAuthContext = createContext<MentalHealthOptionalAuthContextType | null>(null);

// Provider component
export const MentalHealthOptionalAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Core auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authenticationMode, setAuthenticationMode] = useState<AuthenticationMode>('authenticated');
  const [user, setUser] = useState<MentalHealthAuthUser | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Mental health specific state
  const [helperProfile, setHelperProfile] = useState<Helper | null>(null);
  const [crisisAccessLevel, setCrisisAccessLevel] = useState<CrisisAccessLevel>('standard');
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('basic');
  
  // Crisis and emergency state
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [emergencyAccessEnabled, setEmergencyAccessEnabled] = useState(false);
  const [lastCrisisCheck, setLastCrisisCheck] = useState<Date | undefined>();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Mock notification hook (replace with actual implementation)
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);
  
  // Computed values with mental health awareness
  const isHelper = useMemo(() => {
    return helperProfile !== null && user?.role === 'helper';
  }, [helperProfile, user]);
  
  const isTherapist = useMemo(() => {
    return user?.role === 'therapist' || user?.role === 'crisis-specialist';
  }, [user]);
  
  const isCrisisSpecialist = useMemo(() => {
    return user?.role === 'crisis-specialist' || user?.crisisAccessLevel === 'crisis-team';
  }, [user]);
  
  const isPeerSupporter = useMemo(() => {
    return user?.role === 'peer-supporter' || (user?.role === 'helper' && user?.mentalHealthProfile?.supportPreferences?.includes('peer-support'));
  }, [user]);

  // Helper function to determine security level
  const determineSecurityLevel = (userData: MentalHealthAuthUser): SecurityLevel => {
    if (userData.role === 'therapist' || userData.role === 'crisis-specialist') return 'hipaa-compliant';
    if (userData.isCrisisUser || userData.crisisAccessLevel === 'emergency') return 'crisis-secure';
    if (userData.isTherapeuticUser || userData.mentalHealthProfile) return 'enhanced';
    return 'basic';
  };

  // JWT decode helper
  const decodeJWT = (token: string): JWTPayload | null => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      logger.error('Failed to decode JWT:', error);
      return null;
    }
  };

  // Validate stored session
  const validateStoredMentalHealthSession = useCallback(async (token: string, userData: MentalHealthAuthUser): Promise<boolean> => {
    try {
      // Enhanced JWT validation for mental health data
      const payload = decodeJWT(token);
      if (!payload || payload.exp * 1000 < Date.now()) {
        logger.info('Stored mental health token is expired');
        return false;
      }
      
      // Validate with server including mental health specific checks
      const response = await apiClient.get('/auth/validate-mental-health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Additional validation for crisis access and therapeutic sessions
      if (userData.isCrisisUser || userData.isTherapeuticUser) {
        const specialValidation = await apiClient.get('/auth/validate-specialized-access', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.success && specialValidation.success;
      }
      
      return response.success;
    } catch (error) {
      logger.error('Mental health session validation failed:', error);
      return false;
    }
  }, []);

  // Clear auth state
  const clearMentalHealthAuthState = useCallback(async () => {
    setIsAuthenticated(false);
    setIsAnonymous(false);
    setAuthenticationMode('authenticated');
    setUser(null);
    setUserToken(null);
    setAnonymousId(null);
    setSessionId(null);
    setHelperProfile(null);
    setIsCrisisMode(false);
    setEmergencyAccessEnabled(false);
    setCrisisAccessLevel('standard');
    setSecurityLevel('basic');
    
    localStorageService.removeItem('auth_token');
    localStorageService.removeItem('user_data');
    localStorageService.removeItem('anonymous_id');
    localStorageService.removeItem('session_id');
    localStorageService.removeItem('crisis_mode');
    localStorageService.removeItem('guest_crisis_access');
    localStorageService.removeItem('last_crisis_check');
    localStorageService.removeItem('anonymous_session_data');
    
    logger.info('Mental health auth state cleared');
  }, []);

  // Load helper profile
  const loadHelperProfile = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.get(`/helpers/mental-health-profile/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.success && response.data) {
        setHelperProfile(response.data);
        logger.info('Mental health helper profile loaded');
      }
    } catch (error) {
      logger.error('Failed to load mental health helper profile:', error);
    }
  }, [userToken]);

  // Initialize mental health auth state on mount
  const initializeMentalHealthAuth = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // Check for existing sessions with enhanced security validation
      const storedToken = localStorageService.getItem('auth_token');
      const storedUser = localStorageService.getItem('user_data');
      const storedAnonymousId = localStorageService.getItem('anonymous_id');
      const storedSessionId = localStorageService.getItem('session_id');
      const storedCrisisMode = localStorageService.getItem('crisis_mode');
      
      if (storedToken && storedUser) {
        // Validate stored session with enhanced security
        const isValid = await validateStoredMentalHealthSession(storedToken, storedUser);
        if (isValid) {
          setUserToken(storedToken);
          setUser(storedUser);
          setIsAuthenticated(true);
          setIsAnonymous(false);
          setAuthenticationMode('authenticated');
          
          // Restore crisis mode if applicable
          if (storedCrisisMode === 'true') {
            setIsCrisisMode(true);
            setCrisisAccessLevel(storedUser.crisisAccessLevel || 'standard');
          }
          
          // Set security level based on user profile
          setSecurityLevel(determineSecurityLevel(storedUser));
          
          // Load mental health profiles
          if (storedUser.role === 'helper' || storedUser.role === 'therapist') {
            await loadHelperProfile(storedUser.id);
          }
          
          logger.info('Mental health auth session restored from storage');
        } else {
          await clearMentalHealthAuthState();
        }
      } else if (storedAnonymousId) {
        // Restore anonymous session with crisis support
        setAnonymousId(storedAnonymousId);
        setIsAnonymous(true);
        setIsAuthenticated(false);
        setAuthenticationMode('anonymous');
        
        // Check if anonymous user accessed crisis resources
        const anonymousData = localStorageService.getItem('anonymous_session_data');
        if (anonymousData?.crisisInterventions?.length > 0) {
          setIsCrisisMode(true);
          setCrisisAccessLevel('standard');
        }
        
        logger.info('Anonymous mental health session restored');
      } else {
        // No existing session - start fresh with crisis accessibility
        logger.info('No existing mental health auth session found');
      }
      
      // Set session ID for tracking
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        localStorageService.setItem('session_id', newSessionId);
      }
      
    } catch (error) {
      logger.error('Failed to initialize mental health auth:', error);
      await clearMentalHealthAuthState();
    } finally {
      setIsInitializing(false);
    }
  }, [validateStoredMentalHealthSession, clearMentalHealthAuthState, loadHelperProfile]);

  // Initialize on mount
  useEffect(() => {
    initializeMentalHealthAuth();
  }, [initializeMentalHealthAuth]);
  
  // Login method
  const login = useCallback(async (email?: string, password?: string, options?: LoginOptions) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/auth/mental-health-login', {
        email,
        password,
        options,
        sessionId,
        requestCrisisAccess: options?.enableCrisisMode
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }
      
      const { user: userData, token, helper, mentalHealthProfile, crisisAccess } = response.data;
      
      // Enhanced user data with mental health context
      const enhancedUser: MentalHealthAuthUser = {
        ...userData,
        mentalHealthProfile,
        crisisAccessLevel: crisisAccess?.level || 'standard',
        securityLevel: determineSecurityLevel(userData),
        isCrisisUser: crisisAccess?.enabled || false,
        isTherapeuticUser: userData.role === 'therapist' || userData.role === 'helper'
      };
      
      // Update state
      setUser(enhancedUser);
      setUserToken(token);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      setAuthenticationMode('authenticated');
      setSecurityLevel(enhancedUser.securityLevel || 'basic');
      setCrisisAccessLevel(enhancedUser.crisisAccessLevel || 'standard');
      
      if (options?.enableCrisisMode) {
        setIsCrisisMode(true);
        localStorageService.setItem('crisis_mode', 'true');
      }
      
      if (helper) {
        setHelperProfile(helper);
      }
      
      // Persist to storage with enhanced security
      localStorageService.setItem('auth_token', token);
      localStorageService.setItem('user_data', enhancedUser);
      localStorageService.removeItem('anonymous_id');
      
      showNotification('Welcome back to your mental health journey!', 'success');
      logger.info('Mental health user logged in successfully', { 
        userId: enhancedUser.id, 
        role: enhancedUser.role,
        crisisMode: options?.enableCrisisMode 
      });
      
    } catch (error) {
      logger.error('Mental health login failed:', error);
      showNotification(error instanceof Error ? error.message : 'Login failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, sessionId]);
  
  // Register method
  const register = useCallback(async (userData: EnhancedRegisterData) => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/auth/mental-health-register', {
        ...userData,
        sessionId,
        anonymousSessionId: anonymousId
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }
      
      const { user: newUser, token, mentalHealthProfile } = response.data;
      
      // Enhanced user with mental health profile
      const enhancedUser: MentalHealthAuthUser = {
        ...newUser,
        mentalHealthProfile,
        crisisAccessLevel: 'standard',
        securityLevel: 'basic',
        isTherapeuticUser: true
      };
      
      // Update state
      setUser(enhancedUser);
      setUserToken(token);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      setAuthenticationMode('authenticated');
      
      // Persist to storage
      localStorageService.setItem('auth_token', token);
      localStorageService.setItem('user_data', enhancedUser);
      localStorageService.removeItem('anonymous_id');
      
      showNotification('Welcome to your mental health support platform!', 'success');
      logger.info('Mental health user registered successfully');
      
    } catch (error) {
      logger.error('Mental health registration failed:', error);
      showNotification(error instanceof Error ? error.message : 'Registration failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, sessionId, anonymousId]);
  
  // Logout method
  const logout = useCallback(async (preserveAnonymous?: boolean) => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint if authenticated
      if (isAuthenticated && userToken) {
        try {
          await apiClient.post('/auth/mental-health-logout', {
            sessionId,
            crisisMode: isCrisisMode,
            preserveAnonymous
          }, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
        } catch (error) {
          logger.error('Mental health logout API call failed:', error);
        }
      }
      
      if (preserveAnonymous && !isAnonymous) {
        // Convert to anonymous mode instead of full logout
        enableAnonymousMode({ 
          trackCrisisInteractions: isCrisisMode,
          enableSupportPrompts: true,
          allowConversion: true 
        });
        showNotification('Switched to anonymous browsing. Your safety resources remain available.', 'info');
      } else {
        await clearMentalHealthAuthState();
        showNotification('Logged out successfully. Crisis resources remain available if needed.', 'info');
      }
      
      logger.info('Mental health user logged out');
      
    } catch (error) {
      logger.error('Mental health logout failed:', error);
      showNotification('Logout failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userToken, sessionId, isCrisisMode, isAnonymous, showNotification, clearMentalHealthAuthState]);
  
  // Enable anonymous mode
  const enableAnonymousMode = useCallback((options?: AnonymousOptions) => {
    const newAnonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setAnonymousId(newAnonymousId);
    setSessionId(newSessionId);
    setIsAnonymous(true);
    setIsAuthenticated(false);
    setAuthenticationMode('anonymous');
    setUser(null);
    setUserToken(null);
    setHelperProfile(null);
    
    // Preserve crisis mode if needed
    if (options?.trackCrisisInteractions && isCrisisMode) {
      // Keep crisis mode active for anonymous users
      setCrisisAccessLevel('standard');
    }
    
    // Store anonymous session data
    const anonymousSessionData: AnonymousSessionData = {
      sessionId: newSessionId,
      startTime: new Date(),
      interactions: [],
      crisisInterventions: [],
      resourcesAccessed: [],
      supportSeekerIntent: options?.enableSupportPrompts || false,
      conversionPrompts: 0
    };
    
    localStorageService.setItem('anonymous_id', newAnonymousId);
    localStorageService.setItem('session_id', newSessionId);
    localStorageService.setItem('anonymous_session_data', anonymousSessionData);
    localStorageService.removeItem('auth_token');
    localStorageService.removeItem('user_data');
    
    logger.info('Anonymous mental health mode enabled:', newAnonymousId);
    showNotification('Browsing anonymously. Crisis support remains available.', 'info');
  }, [isCrisisMode, showNotification]);
  
  // Enable guest crisis access
  const enableGuestCrisisAccess = useCallback(async (bypassCode?: string) => {
    try {
      setIsLoading(true);
      
      // Validate crisis bypass code if provided
      if (bypassCode && bypassCode !== CRISIS_AUTH_BYPASS_CODE) {
        throw new Error('Invalid crisis access code');
      }
      
      const guestSessionId = `guest_crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setSessionId(guestSessionId);
      setAuthenticationMode('guest-crisis');
      setIsCrisisMode(true);
      setCrisisAccessLevel('elevated');
      setEmergencyAccessEnabled(true);
      
      localStorageService.setItem('session_id', guestSessionId);
      localStorageService.setItem('guest_crisis_access', 'true');
      localStorageService.setItem('crisis_mode', 'true');
      
      showNotification('Emergency crisis support access enabled. You are safe here.', 'success');
      logger.info('Guest crisis access enabled');
      
    } catch (error) {
      logger.error('Failed to enable guest crisis access:', error);
      showNotification('Crisis access failed. Please contact emergency services if needed.', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);
  
  // Convert anonymous to user
  const convertAnonymousToUser = useCallback(async (userData: EnhancedRegisterData) => {
    if (!isAnonymous || !anonymousId) {
      throw new Error('Not in anonymous mode');
    }
    
    try {
      setIsLoading(true);
      
      const anonymousData = localStorageService.getItem('anonymous_session_data');
      
      const response = await apiClient.post('/auth/convert-anonymous-mental-health', {
        ...userData,
        anonymousId,
        sessionId,
        anonymousSessionData: anonymousData
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Account conversion failed');
      }
      
      const { user: newUser, token, mentalHealthProfile } = response.data;
      
      // Enhanced converted user
      const enhancedUser: MentalHealthAuthUser = {
        ...newUser,
        mentalHealthProfile: {
          ...mentalHealthProfile,
          ...userData.mentalHealthProfile
        },
        crisisAccessLevel: isCrisisMode ? 'elevated' : 'standard',
        securityLevel: 'enhanced',
        isTherapeuticUser: true,
        anonymousSessionData: anonymousData
      };
      
      // Update state
      setUser(enhancedUser);
      setUserToken(token);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      setAuthenticationMode('authenticated');
      setAnonymousId(null);
      
      // Persist to storage
      localStorageService.setItem('auth_token', token);
      localStorageService.setItem('user_data', enhancedUser);
      localStorageService.removeItem('anonymous_id');
      localStorageService.removeItem('anonymous_session_data');
      
      showNotification('Account created successfully! Your support journey continues.', 'success');
      logger.info('Anonymous mental health user converted to registered user');
      
    } catch (error) {
      logger.error('Anonymous mental health conversion failed:', error);
      showNotification(error instanceof Error ? error.message : 'Account conversion failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAnonymous, anonymousId, sessionId, isCrisisMode, showNotification]);
  
  // Apply as helper
  const applyAsHelper = useCallback(async (helperData: EnhancedHelperApplicationData) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be logged in to apply as helper');
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/helpers/mental-health-apply', {
        ...helperData,
        userId: user.id,
        currentRole: user.role,
        mentalHealthBackground: user.mentalHealthProfile
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Helper application failed');
      }
      
      showNotification('Helper application submitted successfully! We will review your mental health support qualifications.', 'success');
      logger.info('Mental health helper application submitted');
      
    } catch (error) {
      logger.error('Mental health helper application failed:', error);
      showNotification(error instanceof Error ? error.message : 'Helper application failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, userToken, showNotification]);
  
  // Apply as therapist
  const applyAsTherapist = useCallback(async (therapistData: TherapistApplicationData) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be logged in to apply as therapist');
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/therapists/apply', {
        ...therapistData,
        userId: user.id,
        currentRole: user.role,
        requestedSecurityLevel: 'hipaa-compliant'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Therapist application failed');
      }
      
      showNotification('Therapist application submitted successfully! Professional verification is in progress.', 'success');
      logger.info('Mental health therapist application submitted');
      
    } catch (error) {
      logger.error('Mental health therapist application failed:', error);
      showNotification(error instanceof Error ? error.message : 'Therapist application failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, userToken, showNotification]);
  
  // Update helper profile
  const updateHelperProfile = useCallback(async (updates: Partial<Helper>) => {
    if (!isHelper || !helperProfile) {
      throw new Error('Must be a helper to update profile');
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiClient.put(`/helpers/mental-health/${helperProfile.id}`, {
        ...updates,
        mentalHealthSpecializations: user?.mentalHealthProfile?.supportPreferences
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Profile update failed');
      }
      
      const updatedProfile = { ...helperProfile, ...updates };
      setHelperProfile(updatedProfile);
      
      showNotification('Mental health support profile updated successfully!', 'success');
      logger.info('Mental health helper profile updated');
      
    } catch (error) {
      logger.error('Mental health helper profile update failed:', error);
      showNotification(error instanceof Error ? error.message : 'Profile update failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isHelper, helperProfile, user, userToken, showNotification]);
  
  // Update mental health profile
  const updateMentalHealthProfile = useCallback(async (updates: Partial<MentalHealthProfile>) => {
    if (!user) {
      throw new Error('Must be logged in to update mental health profile');
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiClient.put('/users/mental-health-profile', updates, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Mental health profile update failed');
      }
      
      const updatedUser = {
        ...user,
        mentalHealthProfile: {
          ...user.mentalHealthProfile,
          ...updates
        }
      };
      
      setUser(updatedUser);
      localStorageService.setItem('user_data', updatedUser);
      
      showNotification('Mental health profile updated successfully!', 'success');
      logger.info('Mental health profile updated');
      
    } catch (error) {
      logger.error('Mental health profile update failed:', error);
      showNotification(error instanceof Error ? error.message : 'Profile update failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, userToken, showNotification]);
  
  // Enable crisis mode
  const enableCrisisMode = useCallback(async () => {
    try {
      if (user) {
        await apiClient.post('/crisis/enable-mode', {
          userId: user.id,
          sessionId
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }
      
      setIsCrisisMode(true);
      setCrisisAccessLevel('elevated');
      setLastCrisisCheck(new Date());
      
      localStorageService.setItem('crisis_mode', 'true');
      localStorageService.setItem('last_crisis_check', new Date().toISOString());
      
      showNotification('Crisis support mode activated. You have access to immediate help.', 'success');
      logger.info('Crisis mode enabled');
      
    } catch (error) {
      logger.error('Failed to enable crisis mode:', error);
      // Still enable locally for offline support
      setIsCrisisMode(true);
      setCrisisAccessLevel('elevated');
    }
  }, [user, sessionId, userToken, showNotification]);
  
  // Disable crisis mode
  const disableCrisisMode = useCallback(async () => {
    try {
      if (user) {
        await apiClient.post('/crisis/disable-mode', {
          userId: user.id,
          sessionId
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }
      
      setIsCrisisMode(false);
      setCrisisAccessLevel('standard');
      
      localStorageService.removeItem('crisis_mode');
      localStorageService.removeItem('last_crisis_check');
      
      showNotification('Crisis support mode deactivated. Support remains available anytime.', 'info');
      logger.info('Crisis mode disabled');
      
    } catch (error) {
      logger.error('Failed to disable crisis mode:', error);
      throw error;
    }
  }, [user, sessionId, userToken, showNotification]);
  
  // Report crisis incident
  const reportCrisisIncident = useCallback(async (incident: CrisisIncident) => {
    try {
      setIsLoading(true);
      
      await apiClient.post('/crisis/report-incident', {
        ...incident,
        userId: user?.id,
        sessionId,
        anonymousId: !user ? anonymousId : undefined
      }, user ? {
        headers: { Authorization: `Bearer ${userToken}` }
      } : {});
      
      // Update anonymous session data if anonymous
      if (isAnonymous && anonymousId) {
        const sessionData = localStorageService.getItem('anonymous_session_data') || { crisisInterventions: [] };
        sessionData.crisisInterventions.push({
          timestamp: incident.timestamp,
          level: incident.level,
          intervention: incident.description,
          outcome: 'reported'
        });
        localStorageService.setItem('anonymous_session_data', sessionData);
      }
      
      showNotification('Crisis incident reported. Support team has been notified.', 'success');
      logger.info('Crisis incident reported');
      
    } catch (error) {
      logger.error('Failed to report crisis incident:', error);
      showNotification('Failed to report incident, but local crisis resources remain available.', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionId, anonymousId, userToken, isAnonymous, showNotification]);
  
  // Request emergency access
  const requestEmergencyAccess = useCallback(async (reason: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/emergency/request-access', {
        reason,
        sessionId,
        currentAccessLevel: crisisAccessLevel,
        timestamp: new Date()
      });
      
      if (response.success) {
        setEmergencyAccessEnabled(true);
        setCrisisAccessLevel('emergency');
        setIsCrisisMode(true);
        
        showNotification('Emergency access granted. All support systems activated.', 'success');
        logger.info('Emergency access granted');
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error('Emergency access request failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, crisisAccessLevel, showNotification]);
  
  // Login as demo
  const loginAsDemo = useCallback(async (userType: UserRole, options?: DemoOptions) => {
    try {
      setIsLoading(true);
      
      const demoUser = ENHANCED_DEMO_USERS.find(u => u.role === userType);
      if (!demoUser) {
        throw new Error('Demo user not found');
      }
      
      // Create enhanced demo auth user
      const authUser: MentalHealthAuthUser = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        isDemo: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        mentalHealthProfile: {
          ...demoUser.mentalHealthProfile,
          ...options?.customProfile
        },
        crisisAccessLevel: demoUser.crisisAccessLevel || 'standard',
        securityLevel: determineSecurityLevel({ role: demoUser.role } as MentalHealthAuthUser),
        accessibilityNeeds: demoUser.accessibilityNeeds,
        isTherapeuticUser: true,
        isCrisisUser: options?.simulateCrisisScenario || false
      };
      
      // Create demo token
      const demoToken = `demo_token_${demoUser.id}_${Date.now()}`;
      
      setUser(authUser);
      setUserToken(demoToken);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      setAuthenticationMode('demo');
      setCrisisAccessLevel(authUser.crisisAccessLevel);
      setSecurityLevel(authUser.securityLevel);
      
      // Simulate crisis scenario if requested
      if (options?.simulateCrisisScenario) {
        setIsCrisisMode(true);
        setCrisisAccessLevel('elevated');
      }
      
      // Create demo profiles based on role
      if (userType === 'helper' || userType === 'therapist' || userType === 'crisis-specialist') {
        const demoHelperProfile: Helper = {
          id: demoUser.id,
          userId: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          specializations: userType === 'crisis-specialist' 
            ? ['Crisis Intervention', 'Emergency Response', 'Trauma Support']
            : userType === 'therapist'
            ? ['CBT', 'DBT', 'Trauma Therapy', 'Crisis Counseling']
            : ['General Support', 'Peer Counseling', 'Crisis Support'],
          bio: `Demo ${userType} profile for comprehensive mental health platform testing`,
          isVerified: true,
          rating: userType === 'therapist' ? 4.9 : userType === 'crisis-specialist' ? 5.0 : 4.7,
          totalSessions: userType === 'therapist' ? 500 : userType === 'crisis-specialist' ? 200 : 150,
          availability: 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setHelperProfile(demoHelperProfile);
      }
      
      // Store demo session
      localStorageService.setItem('auth_token', demoToken);
      localStorageService.setItem('user_data', authUser);
      localStorageService.removeItem('anonymous_id');
      
      if (options?.simulateCrisisScenario) {
        localStorageService.setItem('crisis_mode', 'true');
      }
      
      showNotification(`Logged in as demo ${userType}. Full mental health platform features available.`, 'success');
      logger.info(`Demo login: ${userType}`, { features: options });
      
    } catch (error) {
      logger.error('Demo mental health login failed:', error);
      showNotification('Demo login failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);
  
  // Update accessibility needs
  const updateAccessibilityNeeds = useCallback(async (needs: AccessibilityNeeds) => {
    if (!user) return;
    
    try {
      const updatedUser = {
        ...user,
        accessibilityNeeds: needs
      };
      
      setUser(updatedUser);
      localStorageService.setItem('user_data', updatedUser);
      
      if (userToken) {
        await apiClient.put('/users/accessibility-needs', needs, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }
      
      showNotification('Accessibility preferences updated successfully!', 'success');
      
    } catch (error) {
      logger.error('Failed to update accessibility needs:', error);
    }
  }, [user, userToken, showNotification]);
  
  // Update therapeutic settings
  const updateTherapeuticSettings = useCallback(async (settings: TherapeuticSettings) => {
    if (!user) return;
    
    try {
      const updatedUser = {
        ...user,
        therapeuticSettings: settings
      };
      
      setUser(updatedUser);
      localStorageService.setItem('user_data', updatedUser);
      
      if (userToken) {
        await apiClient.put('/users/therapeutic-settings', settings, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }
      
      showNotification('Therapeutic preferences updated successfully!', 'success');
      
    } catch (error) {
      logger.error('Failed to update therapeutic settings:', error);
    }
  }, [user, userToken, showNotification]);
  
  // Update consent records
  const updateConsentRecords = useCallback(async (consents: ConsentRecord[]) => {
    if (!user) return;
    
    try {
      const updatedUser = {
        ...user,
        consentRecords: consents
      };
      
      setUser(updatedUser);
      localStorageService.setItem('user_data', updatedUser);
      
      if (userToken) {
        await apiClient.put('/users/consent-records', consents, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }
      
      showNotification('Consent preferences updated successfully!', 'success');
      
    } catch (error) {
      logger.error('Failed to update consent records:', error);
    }
  }, [user, userToken, showNotification]);
  
  // Revoke consent
  const revokeConsent = useCallback(async (consentType: string) => {
    if (!user) return;
    
    try {
      if (userToken) {
        await apiClient.delete(`/users/consent/${consentType}`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }
      
      showNotification(`Consent for ${consentType} has been revoked.`, 'info');
      
    } catch (error) {
      logger.error('Failed to revoke consent:', error);
    }
  }, [user, userToken, showNotification]);
  
  // Refresh auth
  const refreshAuth = useCallback(async () => {
    if (!userToken) return;
    
    try {
      const response = await apiClient.post('/auth/refresh-mental-health', {
        sessionId,
        crisisMode: isCrisisMode
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.success && response.data.token) {
        setUserToken(response.data.token);
        localStorageService.setItem('auth_token', response.data.token);
        logger.info('Mental health auth token refreshed');
      }
    } catch (error) {
      logger.error('Mental health token refresh failed:', error);
    }
  }, [userToken, sessionId, isCrisisMode]);
  
  // Validate session
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!userToken || !user) return false;
    
    try {
      return await validateStoredMentalHealthSession(userToken, user);
    } catch (error) {
      logger.error('Mental health session validation failed:', error);
      return false;
    }
  }, [userToken, user, validateStoredMentalHealthSession]);
  
  // Validate crisis access
  const validateCrisisAccess = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/crisis/validate-access', {
        headers: userToken ? { Authorization: `Bearer ${userToken}` } : {}
      });
      
      return response.success;
    } catch (error) {
      logger.error('Crisis access validation failed:', error);
      return isCrisisMode; // Return local state as fallback
    }
  }, [userToken, isCrisisMode]);
  
  // Export user data
  const exportUserData = useCallback(async () => {
    if (!user) return null;
    
    try {
      const response = await apiClient.get('/users/export-data', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to export user data:', error);
      throw error;
    }
  }, [user, userToken]);
  
  // Delete user data
  const deleteUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      await apiClient.delete('/users/delete-data', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      await clearMentalHealthAuthState();
      showNotification('User data deleted successfully.', 'success');
      
    } catch (error) {
      logger.error('Failed to delete user data:', error);
      throw error;
    }
  }, [user, userToken, showNotification, clearMentalHealthAuthState]);
  
  // Auto-refresh token with mental health awareness
  useEffect(() => {
    if (!userToken || !isAuthenticated) return;
    
    const refreshInterval = setInterval(() => {
      refreshAuth();
    }, isCrisisMode ? 10 * 60 * 1000 : 15 * 60 * 1000); // More frequent refresh in crisis mode
    
    return () => clearInterval(refreshInterval);
  }, [userToken, isAuthenticated, isCrisisMode, refreshAuth]);
  
  // Crisis mode monitoring
  useEffect(() => {
    if (isCrisisMode) {
      const crisisCheckInterval = setInterval(() => {
        setLastCrisisCheck(new Date());
        localStorageService.setItem('last_crisis_check', new Date().toISOString());
      }, 5 * 60 * 1000); // Check every 5 minutes in crisis mode
      
      return () => clearInterval(crisisCheckInterval);
    }
  }, [isCrisisMode]);
  
  // Memoized context value
  const contextValue = useMemo<MentalHealthOptionalAuthContextType>(() => ({
    // Core auth state
    isAuthenticated,
    isAnonymous,
    authenticationMode,
    user,
    userToken,
    anonymousId,
    sessionId,
    
    // Mental health specific state
    helperProfile,
    isHelper,
    isTherapist,
    isCrisisSpecialist,
    isPeerSupporter,
    crisisAccessLevel,
    securityLevel,
    
    // Crisis and emergency state
    isCrisisMode,
    emergencyAccessEnabled,
    lastCrisisCheck,
    
    // Loading states
    isLoading,
    isInitializing,
    
    // Core auth methods
    login,
    logout,
    register,
    
    // Anonymous and guest methods
    enableAnonymousMode,
    enableGuestCrisisAccess,
    convertAnonymousToUser,
    
    // Mental health role methods
    applyAsHelper,
    applyAsTherapist,
    updateHelperProfile,
    updateMentalHealthProfile,
    
    // Crisis and emergency methods
    enableCrisisMode,
    disableCrisisMode,
    reportCrisisIncident,
    requestEmergencyAccess,
    
    // Demo methods
    loginAsDemo,
    
    // Accessibility and therapeutic methods
    updateAccessibilityNeeds,
    updateTherapeuticSettings,
    
    // Privacy and consent methods
    updateConsentRecords,
    revokeConsent,
    
    // Utility methods
    refreshAuth,
    validateSession,
    validateCrisisAccess,
    exportUserData,
    deleteUserData
  }), [
    isAuthenticated, isAnonymous, authenticationMode, user, userToken, anonymousId, sessionId,
    helperProfile, isHelper, isTherapist, isCrisisSpecialist, isPeerSupporter, crisisAccessLevel, securityLevel,
    isCrisisMode, emergencyAccessEnabled, lastCrisisCheck, isLoading, isInitializing,
    login, logout, register, enableAnonymousMode, enableGuestCrisisAccess, convertAnonymousToUser,
    applyAsHelper, applyAsTherapist, updateHelperProfile, updateMentalHealthProfile,
    enableCrisisMode, disableCrisisMode, reportCrisisIncident, requestEmergencyAccess, loginAsDemo,
    updateAccessibilityNeeds, updateTherapeuticSettings, updateConsentRecords, revokeConsent,
    refreshAuth, validateSession, validateCrisisAccess, exportUserData, deleteUserData
  ]);
  
  return (
    <MentalHealthOptionalAuthContext.Provider value={contextValue}>
      {children}
    </MentalHealthOptionalAuthContext.Provider>
  );
};

// Custom hook
export const useMentalHealthOptionalAuth = (): MentalHealthOptionalAuthContextType => {
  const context = useContext(MentalHealthOptionalAuthContext);
  if (!context) {
    throw new Error('useMentalHealthOptionalAuth must be used within a MentalHealthOptionalAuthProvider');
  }
  return context;
};

// Backward compatibility exports
export const useOptionalAuth = useMentalHealthOptionalAuth;
export const OptionalAuthProvider = MentalHealthOptionalAuthProvider;

export default MentalHealthOptionalAuthContext;