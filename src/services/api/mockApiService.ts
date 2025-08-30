/**
 * Mock API Service for Astral Core Mental Health Platform
 * Provides complete data persistence layer with localStorage backend
 * All endpoints return realistic data for testing and development
 */

import { logger } from '../../utils/logger';

// Type definitions
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'therapist' | 'admin';
  avatar?: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  preferences?: UserPreferences;
  profile?: UserProfile;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    shareLocation: boolean;
    allowAnalytics: boolean;
  };
}

interface UserProfile {
  bio?: string;
  location?: string;
  phone?: string;
  emergencyContacts?: EmergencyContact[];
  therapistId?: string;
  diagnoses?: string[];
  medications?: Medication[];
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
}

interface MoodEntry {
  id: string;
  userId: string;
  mood: number; // 1-10 scale
  moodLabel: string;
  timestamp: string;
  notes?: string;
  factors?: string[];
  activities?: string[];
  location?: string;
  weather?: string;
  sleepHours?: number;
  exerciseMinutes?: number;
  medicationTaken?: boolean;
  symptoms?: string[];
  triggers?: string[];
}

interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: number;
  tags?: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  therapistNotes?: string;
  sharedWith?: string[];
}

interface CrisisEvent {
  id: string;
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'suicidal' | 'self-harm' | 'panic' | 'psychotic' | 'other';
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  interventions: string[];
  contactedSupport: boolean;
  emergencyServicesContacted: boolean;
  notes?: string;
  followUpRequired: boolean;
}

interface Assessment {
  id: string;
  userId: string;
  type: 'PHQ-9' | 'GAD-7' | 'MDI' | 'DASS-21' | 'custom';
  score: number;
  severity: string;
  answers: any[];
  timestamp: string;
  interpretations?: string;
  recommendations?: string[];
  nextAssessmentDate?: string;
}

interface TherapySession {
  id: string;
  patientId: string;
  therapistId: string;
  scheduledAt: string;
  duration: number; // minutes
  type: 'individual' | 'group' | 'crisis';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  goals?: string[];
  homework?: string[];
  nextSessionTopics?: string[];
  rating?: number;
  feedback?: string;
}

interface WellnessActivity {
  id: string;
  userId: string;
  type: 'meditation' | 'breathing' | 'exercise' | 'journaling' | 'grounding' | 'other';
  name: string;
  duration: number; // minutes
  timestamp: string;
  completedSteps?: string[];
  moodBefore?: number;
  moodAfter?: number;
  effectiveness?: number;
  notes?: string;
}

interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  tags?: string[];
  timestamp: string;
  likes: number;
  comments: Comment[];
  reported: boolean;
  isAnonymous: boolean;
  supportType?: 'seeking' | 'offering' | 'sharing';
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  likes: number;
  isTherapistResponse: boolean;
}

interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'reminder' | 'alert' | 'message' | 'appointment';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Storage keys
const STORAGE_KEYS = {
  users: 'astral_users',
  currentUser: 'astral_current_user',
  tokens: 'astral_tokens',
  moods: 'astral_moods',
  journals: 'astral_journals',
  crises: 'astral_crises',
  assessments: 'astral_assessments',
  sessions: 'astral_sessions',
  wellness: 'astral_wellness',
  posts: 'astral_posts',
  notifications: 'astral_notifications',
  analytics: 'astral_analytics'
};

// Helper functions
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const getStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    logger.error('Error reading from localStorage', error, 'mockApiService');
    return defaultValue;
  }
};

const setStorageData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.error('Error writing to localStorage', error, 'mockApiService');
  }
};

const getCurrentUser = (): User | null => {
  return getStorageData<User | null>(STORAGE_KEYS.currentUser, null);
};

const requireAuth = (): User => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
};

// Mock API Service Class
class MockApiService {
  private baseDelay: number = 300; // Simulate network delay

  // ============= AUTH ENDPOINTS =============
  
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    await delay(this.baseDelay);
    
    const users = getStorageData<User[]>(STORAGE_KEYS.users, []);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      // Create new user on first login
      const newUser: User = {
        id: generateId(),
        email,
        name: email.split('@')[0],
        role: 'patient',
        verified: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true
          },
          privacy: {
            profileVisibility: 'private',
            shareLocation: false,
            allowAnalytics: true
          }
        }
      };
      
      users.push(newUser);
      setStorageData(STORAGE_KEYS.users, users);
      setStorageData(STORAGE_KEYS.currentUser, newUser);
      
      const token = btoa(JSON.stringify({ userId: newUser.id, exp: Date.now() + 86400000 }));
      setStorageData(STORAGE_KEYS.tokens, { [newUser.id]: token });
      
      return {
        success: true,
        data: { user: newUser, token }
      };
    }
    
    // Update last login
    user.lastLoginAt = new Date().toISOString();
    setStorageData(STORAGE_KEYS.users, users);
    setStorageData(STORAGE_KEYS.currentUser, user);
    
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));
    const tokens = getStorageData<Record<string, string>>(STORAGE_KEYS.tokens, {});
    tokens[user.id] = token;
    setStorageData(STORAGE_KEYS.tokens, tokens);
    
    return {
      success: true,
      data: { user, token }
    };
  }

  async register(email: string, password: string, profile?: Partial<User>): Promise<ApiResponse<{ user: User; token: string }>> {
    await delay(this.baseDelay);
    
    const users = getStorageData<User[]>(STORAGE_KEYS.users, []);
    
    if (users.find(u => u.email === email)) {
      return {
        success: false,
        error: 'User already exists'
      };
    }
    
    const newUser: User = {
      id: generateId(),
      email,
      name: profile?.name || email.split('@')[0],
      role: 'patient',
      verified: false,
      createdAt: new Date().toISOString(),
      ...profile,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true
        },
        privacy: {
          profileVisibility: 'private',
          shareLocation: false,
          allowAnalytics: true
        }
      }
    };
    
    users.push(newUser);
    setStorageData(STORAGE_KEYS.users, users);
    setStorageData(STORAGE_KEYS.currentUser, newUser);
    
    const token = btoa(JSON.stringify({ userId: newUser.id, exp: Date.now() + 86400000 }));
    const tokens = getStorageData<Record<string, string>>(STORAGE_KEYS.tokens, {});
    tokens[newUser.id] = token;
    setStorageData(STORAGE_KEYS.tokens, tokens);
    
    return {
      success: true,
      data: { user: newUser, token }
    };
  }

  async logout(): Promise<ApiResponse> {
    await delay(this.baseDelay);
    
    const user = getCurrentUser();
    if (user) {
      const tokens = getStorageData<Record<string, string>>(STORAGE_KEYS.tokens, {});
      delete tokens[user.id];
      setStorageData(STORAGE_KEYS.tokens, tokens);
    }
    
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    
    return { success: true };
  }

  async getCurrentUserProfile(): Promise<ApiResponse<User>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    return {
      success: true,
      data: user
    };
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const users = getStorageData<User[]>(STORAGE_KEYS.users, []);
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    
    setStorageData(STORAGE_KEYS.users, users);
    setStorageData(STORAGE_KEYS.currentUser, updatedUser);
    
    return {
      success: true,
      data: updatedUser
    };
  }

  // ============= MOOD TRACKING ENDPOINTS =============
  
  async saveMoodEntry(entry: Omit<MoodEntry, 'id' | 'userId'>): Promise<ApiResponse<MoodEntry>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const moods = getStorageData<MoodEntry[]>(STORAGE_KEYS.moods, []);
    
    const newEntry: MoodEntry = {
      id: generateId(),
      userId: user.id,
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    
    moods.push(newEntry);
    setStorageData(STORAGE_KEYS.moods, moods);
    
    // Check for crisis patterns
    if (newEntry.mood <= 3) {
      this.checkForCrisisPatterns(user.id);
    }
    
    return {
      success: true,
      data: newEntry
    };
  }

  async getMoodHistory(userId?: string, days: number = 30): Promise<ApiResponse<MoodEntry[]>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const moods = getStorageData<MoodEntry[]>(STORAGE_KEYS.moods, []);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const userMoods = moods
      .filter(m => m.userId === targetUserId && new Date(m.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return {
      success: true,
      data: userMoods
    };
  }

  async getMoodAnalytics(userId?: string): Promise<ApiResponse<any>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const moods = getStorageData<MoodEntry[]>(STORAGE_KEYS.moods, []);
    const userMoods = moods.filter(m => m.userId === targetUserId);
    
    if (userMoods.length === 0) {
      return {
        success: true,
        data: {
          averageMood: 0,
          moodTrend: 'stable',
          totalEntries: 0,
          streakDays: 0,
          insights: []
        }
      };
    }
    
    const averageMood = userMoods.reduce((acc, m) => acc + m.mood, 0) / userMoods.length;
    const recentMoods = userMoods.slice(0, 7);
    const recentAverage = recentMoods.reduce((acc, m) => acc + m.mood, 0) / recentMoods.length;
    
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAverage > averageMood + 1) moodTrend = 'improving';
    if (recentAverage < averageMood - 1) moodTrend = 'declining';
    
    // Calculate streak
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasEntry = userMoods.some(m => {
        const moodDate = new Date(m.timestamp);
        return moodDate.toDateString() === checkDate.toDateString();
      });
      if (hasEntry) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }
    
    // Generate insights
    const insights = [];
    if (moodTrend === 'improving') {
      insights.push('Your mood has been improving over the past week. Keep up the good work!');
    }
    if (moodTrend === 'declining') {
      insights.push('Your mood has been lower recently. Consider reaching out to your support network.');
    }
    if (streakDays >= 7) {
      insights.push(`Great job tracking your mood for ${streakDays} days in a row!`);
    }
    
    // Find common factors
    const factors: Record<string, number> = {};
    userMoods.forEach(m => {
      m.factors?.forEach(f => {
        factors[f] = (factors[f] || 0) + 1;
      });
    });
    
    const topFactors = Object.entries(factors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([factor]) => factor);
    
    if (topFactors.length > 0) {
      insights.push(`Common factors affecting your mood: ${topFactors.join(', ')}`);
    }
    
    return {
      success: true,
      data: {
        averageMood: Math.round(averageMood * 10) / 10,
        moodTrend,
        totalEntries: userMoods.length,
        streakDays,
        insights,
        topFactors,
        weeklyPattern: this.calculateWeeklyPattern(userMoods),
        monthlyPattern: this.calculateMonthlyPattern(userMoods)
      }
    };
  }

  private calculateWeeklyPattern(moods: MoodEntry[]): any {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const pattern: Record<string, { average: number; count: number }> = {};
    
    days.forEach(day => {
      pattern[day] = { average: 0, count: 0 };
    });
    
    moods.forEach(m => {
      const day = days[new Date(m.timestamp).getDay()];
      pattern[day].count++;
      pattern[day].average += m.mood;
    });
    
    Object.keys(pattern).forEach(day => {
      if (pattern[day].count > 0) {
        pattern[day].average = Math.round(pattern[day].average / pattern[day].count * 10) / 10;
      }
    });
    
    return pattern;
  }

  private calculateMonthlyPattern(moods: MoodEntry[]): any {
    const pattern: Record<string, { average: number; count: number }> = {};
    
    moods.forEach(m => {
      const date = new Date(m.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!pattern[monthKey]) {
        pattern[monthKey] = { average: 0, count: 0 };
      }
      
      pattern[monthKey].count++;
      pattern[monthKey].average += m.mood;
    });
    
    Object.keys(pattern).forEach(month => {
      if (pattern[month].count > 0) {
        pattern[month].average = Math.round(pattern[month].average / pattern[month].count * 10) / 10;
      }
    });
    
    return pattern;
  }

  // ============= JOURNAL ENDPOINTS =============
  
  async saveJournalEntry(entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<JournalEntry>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const journals = getStorageData<JournalEntry[]>(STORAGE_KEYS.journals, []);
    
    const newEntry: JournalEntry = {
      id: generateId(),
      userId: user.id,
      ...entry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    journals.push(newEntry);
    setStorageData(STORAGE_KEYS.journals, journals);
    
    return {
      success: true,
      data: newEntry
    };
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<ApiResponse<JournalEntry>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const journals = getStorageData<JournalEntry[]>(STORAGE_KEYS.journals, []);
    const entryIndex = journals.findIndex(j => j.id === id && j.userId === user.id);
    
    if (entryIndex === -1) {
      return {
        success: false,
        error: 'Journal entry not found'
      };
    }
    
    const updatedEntry = {
      ...journals[entryIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    journals[entryIndex] = updatedEntry;
    setStorageData(STORAGE_KEYS.journals, journals);
    
    return {
      success: true,
      data: updatedEntry
    };
  }

  async getJournalEntries(userId?: string, limit: number = 50): Promise<ApiResponse<JournalEntry[]>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const journals = getStorageData<JournalEntry[]>(STORAGE_KEYS.journals, []);
    const userJournals = journals
      .filter(j => j.userId === targetUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    return {
      success: true,
      data: userJournals
    };
  }

  async deleteJournalEntry(id: string): Promise<ApiResponse> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const journals = getStorageData<JournalEntry[]>(STORAGE_KEYS.journals, []);
    const filtered = journals.filter(j => !(j.id === id && j.userId === user.id));
    
    if (filtered.length === journals.length) {
      return {
        success: false,
        error: 'Journal entry not found'
      };
    }
    
    setStorageData(STORAGE_KEYS.journals, filtered);
    
    return { success: true };
  }

  // ============= CRISIS ENDPOINTS =============
  
  async reportCrisis(severity: CrisisEvent['severity'], type: CrisisEvent['type'], notes?: string): Promise<ApiResponse<CrisisEvent>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const crises = getStorageData<CrisisEvent[]>(STORAGE_KEYS.crises, []);
    
    const newCrisis: CrisisEvent = {
      id: generateId(),
      userId: user.id,
      severity,
      type,
      timestamp: new Date().toISOString(),
      resolved: false,
      interventions: [],
      contactedSupport: false,
      emergencyServicesContacted: severity === 'critical',
      notes,
      followUpRequired: severity !== 'low'
    };
    
    crises.push(newCrisis);
    setStorageData(STORAGE_KEYS.crises, crises);
    
    // Trigger notifications if severity is high or critical
    if (severity === 'high' || severity === 'critical') {
      this.createNotification(
        user.id,
        'alert',
        'Crisis Support Activated',
        'We\'re here to help. Crisis support resources have been activated.',
        'urgent'
      );
    }
    
    return {
      success: true,
      data: newCrisis
    };
  }

  async resolveCrisis(id: string, interventions: string[], notes?: string): Promise<ApiResponse<CrisisEvent>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const crises = getStorageData<CrisisEvent[]>(STORAGE_KEYS.crises, []);
    const crisisIndex = crises.findIndex(c => c.id === id && c.userId === user.id);
    
    if (crisisIndex === -1) {
      return {
        success: false,
        error: 'Crisis event not found'
      };
    }
    
    const updatedCrisis = {
      ...crises[crisisIndex],
      resolved: true,
      resolvedAt: new Date().toISOString(),
      interventions,
      notes: notes || crises[crisisIndex].notes
    };
    
    crises[crisisIndex] = updatedCrisis;
    setStorageData(STORAGE_KEYS.crises, crises);
    
    return {
      success: true,
      data: updatedCrisis
    };
  }

  async getCrisisHistory(userId?: string): Promise<ApiResponse<CrisisEvent[]>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const crises = getStorageData<CrisisEvent[]>(STORAGE_KEYS.crises, []);
    const userCrises = crises
      .filter(c => c.userId === targetUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return {
      success: true,
      data: userCrises
    };
  }

  private async checkForCrisisPatterns(userId: string): Promise<void> {
    const moods = getStorageData<MoodEntry[]>(STORAGE_KEYS.moods, []);
    const recentMoods = moods
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 7);
    
    const lowMoodCount = recentMoods.filter(m => m.mood <= 3).length;
    
    if (lowMoodCount >= 3) {
      this.createNotification(
        userId,
        'alert',
        'Mood Pattern Alert',
        'We\'ve noticed your mood has been low recently. Would you like to talk to someone?',
        'high'
      );
    }
  }

  // ============= ASSESSMENT ENDPOINTS =============
  
  async saveAssessment(assessment: Omit<Assessment, 'id' | 'userId' | 'timestamp'>): Promise<ApiResponse<Assessment>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const assessments = getStorageData<Assessment[]>(STORAGE_KEYS.assessments, []);
    
    const newAssessment: Assessment = {
      id: generateId(),
      userId: user.id,
      ...assessment,
      timestamp: new Date().toISOString()
    };
    
    // Generate interpretations based on type and score
    newAssessment.interpretations = this.generateAssessmentInterpretation(assessment.type, assessment.score);
    newAssessment.recommendations = this.generateAssessmentRecommendations(assessment.type, assessment.score);
    
    assessments.push(newAssessment);
    setStorageData(STORAGE_KEYS.assessments, assessments);
    
    return {
      success: true,
      data: newAssessment
    };
  }

  async getAssessmentHistory(userId?: string, type?: Assessment['type']): Promise<ApiResponse<Assessment[]>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const assessments = getStorageData<Assessment[]>(STORAGE_KEYS.assessments, []);
    let userAssessments = assessments.filter(a => a.userId === targetUserId);
    
    if (type) {
      userAssessments = userAssessments.filter(a => a.type === type);
    }
    
    userAssessments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return {
      success: true,
      data: userAssessments
    };
  }

  private generateAssessmentInterpretation(type: Assessment['type'], score: number): string {
    const interpretations: Record<Assessment['type'], (score: number) => string> = {
      'PHQ-9': (s) => {
        if (s <= 4) return 'Minimal depression symptoms';
        if (s <= 9) return 'Mild depression symptoms';
        if (s <= 14) return 'Moderate depression symptoms';
        if (s <= 19) return 'Moderately severe depression symptoms';
        return 'Severe depression symptoms';
      },
      'GAD-7': (s) => {
        if (s <= 4) return 'Minimal anxiety';
        if (s <= 9) return 'Mild anxiety';
        if (s <= 14) return 'Moderate anxiety';
        return 'Severe anxiety';
      },
      'MDI': (s) => {
        if (s <= 20) return 'No depression';
        if (s <= 24) return 'Mild depression';
        if (s <= 29) return 'Moderate depression';
        return 'Severe depression';
      },
      'DASS-21': (s) => {
        return `Overall stress score: ${s}. Please consult with a professional for detailed interpretation.`;
      },
      'custom': (s) => {
        return `Custom assessment score: ${s}`;
      }
    };
    
    return interpretations[type](score);
  }

  private generateAssessmentRecommendations(type: Assessment['type'], score: number): string[] {
    const recommendations: string[] = [];
    
    if (type === 'PHQ-9' || type === 'MDI') {
      if (score > 14) {
        recommendations.push('Consider scheduling an appointment with a mental health professional');
        recommendations.push('Reach out to your support network');
        recommendations.push('Practice daily self-care activities');
      } else if (score > 9) {
        recommendations.push('Monitor your mood daily');
        recommendations.push('Engage in regular physical activity');
        recommendations.push('Maintain a consistent sleep schedule');
      } else {
        recommendations.push('Continue with your current wellness practices');
        recommendations.push('Stay connected with friends and family');
      }
    }
    
    if (type === 'GAD-7') {
      if (score > 14) {
        recommendations.push('Practice breathing exercises when feeling anxious');
        recommendations.push('Consider therapy for anxiety management');
        recommendations.push('Limit caffeine and alcohol intake');
      } else if (score > 9) {
        recommendations.push('Try mindfulness meditation');
        recommendations.push('Identify and address anxiety triggers');
        recommendations.push('Establish a calming bedtime routine');
      } else {
        recommendations.push('Maintain healthy stress management practices');
      }
    }
    
    return recommendations;
  }

  // ============= WELLNESS ENDPOINTS =============
  
  async saveWellnessActivity(activity: Omit<WellnessActivity, 'id' | 'userId' | 'timestamp'>): Promise<ApiResponse<WellnessActivity>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const wellness = getStorageData<WellnessActivity[]>(STORAGE_KEYS.wellness, []);
    
    const newActivity: WellnessActivity = {
      id: generateId(),
      userId: user.id,
      ...activity,
      timestamp: new Date().toISOString()
    };
    
    wellness.push(newActivity);
    setStorageData(STORAGE_KEYS.wellness, wellness);
    
    // Update streak if applicable
    this.updateWellnessStreak(user.id, activity.type);
    
    return {
      success: true,
      data: newActivity
    };
  }

  async getWellnessHistory(userId?: string, type?: WellnessActivity['type']): Promise<ApiResponse<WellnessActivity[]>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const wellness = getStorageData<WellnessActivity[]>(STORAGE_KEYS.wellness, []);
    let userActivities = wellness.filter(w => w.userId === targetUserId);
    
    if (type) {
      userActivities = userActivities.filter(w => w.type === type);
    }
    
    userActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return {
      success: true,
      data: userActivities
    };
  }

  async getWellnessStats(userId?: string): Promise<ApiResponse<any>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const wellness = getStorageData<WellnessActivity[]>(STORAGE_KEYS.wellness, []);
    const userActivities = wellness.filter(w => w.userId === targetUserId);
    
    const stats = {
      totalActivities: userActivities.length,
      totalMinutes: userActivities.reduce((acc, w) => acc + w.duration, 0),
      averageDuration: userActivities.length > 0 
        ? Math.round(userActivities.reduce((acc, w) => acc + w.duration, 0) / userActivities.length)
        : 0,
      favoriteActivity: this.getMostFrequentActivity(userActivities),
      currentStreak: this.calculateWellnessStreak(userActivities),
      weeklyGoalProgress: this.calculateWeeklyGoalProgress(userActivities),
      moodImprovement: this.calculateMoodImprovement(userActivities)
    };
    
    return {
      success: true,
      data: stats
    };
  }

  private getMostFrequentActivity(activities: WellnessActivity[]): string | null {
    if (activities.length === 0) return null;
    
    const counts: Record<string, number> = {};
    activities.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  private calculateWellnessStreak(activities: WellnessActivity[]): number {
    if (activities.length === 0) return 0;
    
    const dates = activities.map(a => new Date(a.timestamp).toDateString());
    const uniqueDates = Array.from(new Set(dates));
    uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      if (uniqueDates.includes(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }

  private calculateWeeklyGoalProgress(activities: WellnessActivity[]): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyActivities = activities.filter(a => new Date(a.timestamp) >= weekAgo);
    const weeklyMinutes = weeklyActivities.reduce((acc, a) => acc + a.duration, 0);
    
    const weeklyGoal = 150; // 150 minutes per week recommended
    return Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100));
  }

  private calculateMoodImprovement(activities: WellnessActivity[]): number {
    const withMoodData = activities.filter(a => a.moodBefore && a.moodAfter);
    
    if (withMoodData.length === 0) return 0;
    
    const totalImprovement = withMoodData.reduce((acc, a) => {
      return acc + ((a.moodAfter || 0) - (a.moodBefore || 0));
    }, 0);
    
    return Math.round((totalImprovement / withMoodData.length) * 10) / 10;
  }

  private updateWellnessStreak(userId: string, type: WellnessActivity['type']): void {
    // This would update streak tracking in a real implementation
    logger.info(`Updated wellness streak for user ${userId}, activity: ${type}`, undefined, 'mockApiService');
  }

  // ============= COMMUNITY ENDPOINTS =============
  
  async createPost(content: string, tags?: string[], isAnonymous: boolean = false): Promise<ApiResponse<CommunityPost>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const posts = getStorageData<CommunityPost[]>(STORAGE_KEYS.posts, []);
    
    const newPost: CommunityPost = {
      id: generateId(),
      userId: user.id,
      userName: isAnonymous ? 'Anonymous' : user.name,
      userAvatar: isAnonymous ? undefined : user.avatar,
      content,
      tags,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
      reported: false,
      isAnonymous,
      supportType: 'sharing'
    };
    
    posts.push(newPost);
    setStorageData(STORAGE_KEYS.posts, posts);
    
    return {
      success: true,
      data: newPost
    };
  }

  async getPosts(limit: number = 20, offset: number = 0): Promise<ApiResponse<CommunityPost[]>> {
    await delay(this.baseDelay);
    
    requireAuth();
    const posts = getStorageData<CommunityPost[]>(STORAGE_KEYS.posts, []);
    
    const sortedPosts = posts
      .filter(p => !p.reported)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);
    
    return {
      success: true,
      data: sortedPosts
    };
  }

  async likePost(postId: string): Promise<ApiResponse> {
    await delay(this.baseDelay);
    
    requireAuth();
    const posts = getStorageData<CommunityPost[]>(STORAGE_KEYS.posts, []);
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return {
        success: false,
        error: 'Post not found'
      };
    }
    
    posts[postIndex].likes++;
    setStorageData(STORAGE_KEYS.posts, posts);
    
    return { success: true };
  }

  async addComment(postId: string, content: string): Promise<ApiResponse<Comment>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const posts = getStorageData<CommunityPost[]>(STORAGE_KEYS.posts, []);
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return {
        success: false,
        error: 'Post not found'
      };
    }
    
    const newComment: Comment = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      isTherapistResponse: user.role === 'therapist'
    };
    
    posts[postIndex].comments.push(newComment);
    setStorageData(STORAGE_KEYS.posts, posts);
    
    return {
      success: true,
      data: newComment
    };
  }

  // ============= NOTIFICATION ENDPOINTS =============
  
  async getNotifications(userId?: string): Promise<ApiResponse<Notification[]>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const notifications = getStorageData<Notification[]>(STORAGE_KEYS.notifications, []);
    const userNotifications = notifications
      .filter(n => n.userId === targetUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return {
      success: true,
      data: userNotifications
    };
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    await delay(this.baseDelay);
    
    requireAuth();
    const notifications = getStorageData<Notification[]>(STORAGE_KEYS.notifications, []);
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return {
        success: false,
        error: 'Notification not found'
      };
    }
    
    notifications[notificationIndex].read = true;
    setStorageData(STORAGE_KEYS.notifications, notifications);
    
    return { success: true };
  }

  private createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium'
  ): void {
    const notifications = getStorageData<Notification[]>(STORAGE_KEYS.notifications, []);
    
    const newNotification: Notification = {
      id: generateId(),
      userId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority
    };
    
    notifications.push(newNotification);
    setStorageData(STORAGE_KEYS.notifications, notifications);
  }

  // ============= THERAPY SESSION ENDPOINTS =============
  
  async scheduleSession(
    therapistId: string,
    scheduledAt: string,
    type: TherapySession['type'] = 'individual',
    duration: number = 60
  ): Promise<ApiResponse<TherapySession>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const sessions = getStorageData<TherapySession[]>(STORAGE_KEYS.sessions, []);
    
    const newSession: TherapySession = {
      id: generateId(),
      patientId: user.id,
      therapistId,
      scheduledAt,
      duration,
      type,
      status: 'scheduled'
    };
    
    sessions.push(newSession);
    setStorageData(STORAGE_KEYS.sessions, sessions);
    
    // Create reminder notification
    this.createNotification(
      user.id,
      'appointment',
      'Therapy Session Scheduled',
      `Your ${type} therapy session is scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      'high'
    );
    
    return {
      success: true,
      data: newSession
    };
  }

  async getSessions(userId?: string, status?: TherapySession['status']): Promise<ApiResponse<TherapySession[]>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    const sessions = getStorageData<TherapySession[]>(STORAGE_KEYS.sessions, []);
    let userSessions = sessions.filter(s => 
      s.patientId === targetUserId || s.therapistId === targetUserId
    );
    
    if (status) {
      userSessions = userSessions.filter(s => s.status === status);
    }
    
    userSessions.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    
    return {
      success: true,
      data: userSessions
    };
  }

  async updateSession(sessionId: string, updates: Partial<TherapySession>): Promise<ApiResponse<TherapySession>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const sessions = getStorageData<TherapySession[]>(STORAGE_KEYS.sessions, []);
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      return {
        success: false,
        error: 'Session not found'
      };
    }
    
    const session = sessions[sessionIndex];
    
    // Check authorization
    if (session.patientId !== user.id && session.therapistId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }
    
    const updatedSession = {
      ...session,
      ...updates
    };
    
    sessions[sessionIndex] = updatedSession;
    setStorageData(STORAGE_KEYS.sessions, sessions);
    
    return {
      success: true,
      data: updatedSession
    };
  }

  // ============= ANALYTICS ENDPOINTS =============
  
  async getAnalytics(userId?: string): Promise<ApiResponse<any>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    const targetUserId = userId || user.id;
    
    // Gather all data for analytics
    const moods = getStorageData<MoodEntry[]>(STORAGE_KEYS.moods, [])
      .filter(m => m.userId === targetUserId);
    const journals = getStorageData<JournalEntry[]>(STORAGE_KEYS.journals, [])
      .filter(j => j.userId === targetUserId);
    const wellness = getStorageData<WellnessActivity[]>(STORAGE_KEYS.wellness, [])
      .filter(w => w.userId === targetUserId);
    const assessments = getStorageData<Assessment[]>(STORAGE_KEYS.assessments, [])
      .filter(a => a.userId === targetUserId);
    const sessions = getStorageData<TherapySession[]>(STORAGE_KEYS.sessions, [])
      .filter(s => s.patientId === targetUserId);
    
    const analytics = {
      overview: {
        totalMoodEntries: moods.length,
        totalJournalEntries: journals.length,
        totalWellnessActivities: wellness.length,
        totalAssessments: assessments.length,
        totalTherapySessions: sessions.filter(s => s.status === 'completed').length
      },
      trends: {
        moodTrend: this.calculateTrend(moods.map(m => ({ value: m.mood, date: m.timestamp }))),
        activityTrend: this.calculateActivityTrend(wellness),
        engagementScore: this.calculateEngagementScore(moods, journals, wellness)
      },
      insights: this.generateInsights(moods, journals, wellness, assessments),
      recommendations: this.generateRecommendations(moods, wellness, assessments)
    };
    
    return {
      success: true,
      data: analytics
    };
  }

  private calculateTrend(data: { value: number; date: string }[]): 'improving' | 'stable' | 'declining' {
    if (data.length < 2) return 'stable';
    
    const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recent = sorted.slice(-7);
    const previous = sorted.slice(-14, -7);
    
    if (recent.length === 0 || previous.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((acc, d) => acc + d.value, 0) / recent.length;
    const previousAvg = previous.reduce((acc, d) => acc + d.value, 0) / previous.length;
    
    if (recentAvg > previousAvg + 1) return 'improving';
    if (recentAvg < previousAvg - 1) return 'declining';
    return 'stable';
  }

  private calculateActivityTrend(activities: WellnessActivity[]): 'increasing' | 'stable' | 'decreasing' {
    const thisWeek = activities.filter(a => {
      const date = new Date(a.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    
    const lastWeek = activities.filter(a => {
      const date = new Date(a.timestamp);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= twoWeeksAgo && date < weekAgo;
    }).length;
    
    if (thisWeek > lastWeek + 2) return 'increasing';
    if (thisWeek < lastWeek - 2) return 'decreasing';
    return 'stable';
  }

  private calculateEngagementScore(
    moods: MoodEntry[],
    journals: JournalEntry[],
    wellness: WellnessActivity[]
  ): number {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentMoods = moods.filter(m => new Date(m.timestamp) >= weekAgo).length;
    const recentJournals = journals.filter(j => new Date(j.createdAt) >= weekAgo).length;
    const recentWellness = wellness.filter(w => new Date(w.timestamp) >= weekAgo).length;
    
    const moodScore = Math.min(100, (recentMoods / 7) * 100);
    const journalScore = Math.min(100, (recentJournals / 3) * 100);
    const wellnessScore = Math.min(100, (recentWellness / 5) * 100);
    
    return Math.round((moodScore + journalScore + wellnessScore) / 3);
  }

  private generateInsights(
    moods: MoodEntry[],
    journals: JournalEntry[],
    wellness: WellnessActivity[],
    assessments: Assessment[]
  ): string[] {
    const insights: string[] = [];
    
    // Mood insights
    if (moods.length >= 7) {
      const avgMood = moods.slice(0, 7).reduce((acc, m) => acc + m.mood, 0) / 7;
      if (avgMood >= 7) {
        insights.push('Your mood has been consistently positive this week!');
      } else if (avgMood <= 4) {
        insights.push('Your mood has been lower than usual. Consider reaching out for support.');
      }
    }
    
    // Activity insights
    const exerciseActivities = wellness.filter(w => w.type === 'exercise');
    if (exerciseActivities.length >= 3) {
      insights.push('Great job staying active! Regular exercise is benefiting your mental health.');
    }
    
    // Journal insights
    const recentJournals = journals.filter(j => {
      const date = new Date(j.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });
    
    if (recentJournals.length >= 3) {
      insights.push('Consistent journaling is helping you process your thoughts and emotions.');
    }
    
    // Assessment insights
    if (assessments.length > 0) {
      const latestAssessment = assessments[0];
      if (latestAssessment.recommendations && latestAssessment.recommendations.length > 0) {
        insights.push(`Based on your recent ${latestAssessment.type} assessment: ${latestAssessment.recommendations[0]}`);
      }
    }
    
    return insights;
  }

  private generateRecommendations(
    moods: MoodEntry[],
    wellness: WellnessActivity[],
    assessments: Assessment[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Check mood patterns
    const recentMoods = moods.slice(0, 7);
    const avgMood = recentMoods.length > 0 
      ? recentMoods.reduce((acc, m) => acc + m.mood, 0) / recentMoods.length 
      : 5;
    
    if (avgMood < 5) {
      recommendations.push('Try a breathing exercise or meditation to help manage difficult emotions');
      recommendations.push('Consider scheduling a therapy session to discuss recent challenges');
    }
    
    // Check activity levels
    const recentActivities = wellness.filter(w => {
      const date = new Date(w.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });
    
    if (recentActivities.length < 3) {
      recommendations.push('Aim for at least 30 minutes of wellness activities 3 times per week');
    }
    
    // Check for missing assessments
    const lastAssessment = assessments[0];
    if (!lastAssessment || new Date(lastAssessment.timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      recommendations.push('It\'s been a while since your last assessment. Consider taking one to track your progress');
    }
    
    return recommendations;
  }

  // ============= EXPORT/IMPORT ENDPOINTS =============
  
  async exportUserData(): Promise<ApiResponse<any>> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    
    const exportData = {
      user,
      moods: getStorageData<MoodEntry[]>(STORAGE_KEYS.moods, []).filter(m => m.userId === user.id),
      journals: getStorageData<JournalEntry[]>(STORAGE_KEYS.journals, []).filter(j => j.userId === user.id),
      wellness: getStorageData<WellnessActivity[]>(STORAGE_KEYS.wellness, []).filter(w => w.userId === user.id),
      assessments: getStorageData<Assessment[]>(STORAGE_KEYS.assessments, []).filter(a => a.userId === user.id),
      sessions: getStorageData<TherapySession[]>(STORAGE_KEYS.sessions, []).filter(s => s.patientId === user.id),
      exportDate: new Date().toISOString()
    };
    
    return {
      success: true,
      data: exportData
    };
  }

  async deleteAllUserData(): Promise<ApiResponse> {
    await delay(this.baseDelay);
    
    const user = requireAuth();
    
    // Remove user data from all collections
    const moods = getStorageData<MoodEntry[]>(STORAGE_KEYS.moods, []).filter(m => m.userId !== user.id);
    const journals = getStorageData<JournalEntry[]>(STORAGE_KEYS.journals, []).filter(j => j.userId !== user.id);
    const wellness = getStorageData<WellnessActivity[]>(STORAGE_KEYS.wellness, []).filter(w => w.userId !== user.id);
    const assessments = getStorageData<Assessment[]>(STORAGE_KEYS.assessments, []).filter(a => a.userId !== user.id);
    const sessions = getStorageData<TherapySession[]>(STORAGE_KEYS.sessions, []).filter(s => s.patientId !== user.id);
    const posts = getStorageData<CommunityPost[]>(STORAGE_KEYS.posts, []).filter(p => p.userId !== user.id);
    const notifications = getStorageData<Notification[]>(STORAGE_KEYS.notifications, []).filter(n => n.userId !== user.id);
    
    // Update storage
    setStorageData(STORAGE_KEYS.moods, moods);
    setStorageData(STORAGE_KEYS.journals, journals);
    setStorageData(STORAGE_KEYS.wellness, wellness);
    setStorageData(STORAGE_KEYS.assessments, assessments);
    setStorageData(STORAGE_KEYS.sessions, sessions);
    setStorageData(STORAGE_KEYS.posts, posts);
    setStorageData(STORAGE_KEYS.notifications, notifications);
    
    // Remove user account
    const users = getStorageData<User[]>(STORAGE_KEYS.users, []).filter(u => u.id !== user.id);
    setStorageData(STORAGE_KEYS.users, users);
    
    // Clear current user
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    
    return {
      success: true,
      message: 'All user data has been deleted'
    };
  }
}

// Export singleton instance
export const mockApiService = new MockApiService();

// Export types
export type {
  ApiResponse,
  User,
  UserPreferences,
  UserProfile,
  EmergencyContact,
  Medication,
  MoodEntry,
  JournalEntry,
  CrisisEvent,
  Assessment,
  TherapySession,
  WellnessActivity,
  CommunityPost,
  Comment,
  Notification
};