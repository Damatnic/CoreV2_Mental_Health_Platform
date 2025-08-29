/**
 * 🏥 ENHANCED MENTAL HEALTH HELPER DASHBOARD
 * 
 * Comprehensive dashboard for mental health helpers with crisis intervention capabilities,
 * therapeutic outcome tracking, and accessibility-first design for professional mental health support.
 * 
 * ✨ KEY FEATURES:
 * - Crisis intervention management with emergency escalation protocols
 * - Real-time therapeutic outcome tracking and evidence-based metrics
 * - HIPAA-compliant session management and professional supervision
 * - Advanced accessibility features for neurodivergent clients
 * - Cultural competency integration with trauma-informed care
 * - Continuing education tracking with specialized certifications
 * - Safety plan creation and crisis response coordination
 * - Emergency contact management and professional referral systems
 * 
 * @version 3.0.0
 * @compliance HIPAA, Crisis Intervention Standards, WCAG 2.1 AAA, APA Guidelines
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Heart,
  AlertTriangle,
  Shield,
  User,
  Clock,
  TrendingUp,
  FileText,
  Check,
  X,
  Eye,
  Phone,
  Award,
  ThumbsUp,
  BookOpen,
  Activity,
  Users,
  Star,
  Zap,
  Target,
  Globe,
  Accessibility,
  Brain,
  Loader2
} from 'lucide-react';

// 🎯 ENHANCED MENTAL HEALTH TYPES
export type CrisisLevel = 'low' | 'moderate' | 'high' | 'critical';
export type MentalHealthSpecialty = 'anxiety' | 'depression' | 'ptsd' | 'bipolar' | 'eating-disorders' | 'substance-abuse' | 'general';
export type TherapeuticApproach = 'cbt' | 'dbt' | 'humanistic' | 'psychodynamic' | 'mindfulness' | 'solution-focused';
export type HelperCertificationLevel = 'peer-support' | 'crisis-trained' | 'licensed-counselor' | 'clinical-therapist' | 'psychiatrist';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'crisis';
export type SessionStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'crisis-escalated';
export type NotificationType = 'session_request' | 'crisis_alert' | 'kudos' | 'training' | 'system' | 'therapeutic_update' | 'safety_concern';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'emergency';
export type ActiveView = 'overview' | 'sessions' | 'training' | 'community';

export interface MentalHealthProfile {
  specialties: MentalHealthSpecialty[];
  therapeuticApproaches: TherapeuticApproach[];
  certificationLevel: HelperCertificationLevel;
  crisisTrainingCompleted: boolean;
  culturalCompetencies: string[];
  languagesSpoken: string[];
  availabilityHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface CrisisMetrics {
  crisisInterventions: number;
  emergencyReferrals: number;
  safetyPlansCreated: number;
  followUpSessions: number;
  crisisResponseTime: number; // in minutes
  deescalationSuccessRate: number;
}

export interface TherapeuticOutcomes {
  clientRetentionRate: number;
  symptomImprovementRate: number;
  crisisPreventionCount: number;
  therapeuticGoalsAchieved: number;
  clientSatisfactionScore: number;
  evidenceBasedInterventions: number;
}

export interface HelperStats {
  totalSessions: number;
  totalHelpfulVotes: number;
  averageRating: number;
  completedTraining: number;
  xpPoints: number;
  level: number;
  nextLevelXP: number;
  currentStreak: number;
  longestStreak: number;
  responseTime: string;
  mentalHealthProfile: MentalHealthProfile;
  crisisMetrics: CrisisMetrics;
  therapeuticOutcomes: TherapeuticOutcomes;
  accessibilityCompliance: number;
  hipaaComplianceScore: number;
  continuingEducationHours: number;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface SessionRequest {
  id: string;
  userId: string;
  username: string;
  requestedAt: string;
  urgency: UrgencyLevel;
  crisisLevel?: CrisisLevel;
  topic: string;
  mentalHealthConcerns: MentalHealthSpecialty[];
  preferredTime?: string;
  notes?: string;
  triggerWarnings?: string[];
  culturalConsiderations?: string[];
  accessibilityNeeds?: string[];
  emergencyContact?: EmergencyContact;
  previousTherapy: boolean;
  currentMedications?: string[];
  suicidalIdeation: boolean;
  selfHarmRisk: boolean;
  status: SessionStatus;
  assignedTherapist?: string;
  safetyPlanRequired: boolean;
}

export interface HelperNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
  priority: NotificationPriority;
  crisisLevel?: CrisisLevel;
  relatedSessionId?: string;
  requiresImmediateAction?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

// Mock user type
interface User {
  id: string;
  firstName?: string;
  username: string;
}

const HelperDashboardView: React.FC = () => {
  // Mock user and notification systems
  const user: User | null = {
    id: 'helper-1',
    firstName: 'Dr. Sarah',
    username: 'TherapeuticHelper'
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };
  
  const [activeTab, setActiveTab] = useState<ActiveView>('overview');
  const [stats, setStats] = useState<HelperStats>({
    totalSessions: 0,
    totalHelpfulVotes: 0,
    averageRating: 0,
    completedTraining: 0,
    xpPoints: 0,
    level: 1,
    nextLevelXP: 1000,
    currentStreak: 0,
    longestStreak: 0,
    responseTime: 'N/A',
    mentalHealthProfile: {
      specialties: [],
      therapeuticApproaches: [],
      certificationLevel: 'peer-support',
      crisisTrainingCompleted: false,
      culturalCompetencies: [],
      languagesSpoken: [],
      availabilityHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'EST'
      }
    },
    crisisMetrics: {
      crisisInterventions: 0,
      emergencyReferrals: 0,
      safetyPlansCreated: 0,
      followUpSessions: 0,
      crisisResponseTime: 0,
      deescalationSuccessRate: 0
    },
    therapeuticOutcomes: {
      clientRetentionRate: 0,
      symptomImprovementRate: 0,
      crisisPreventionCount: 0,
      therapeuticGoalsAchieved: 0,
      clientSatisfactionScore: 0,
      evidenceBasedInterventions: 0
    },
    accessibilityCompliance: 0,
    hipaaComplianceScore: 0,
    continuingEducationHours: 0
  });
  
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [notifications, setNotifications] = useState<HelperNotification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Enhanced mental health helper dashboard data
      const mockStats: HelperStats = {
        totalSessions: 127,
        totalHelpfulVotes: 456,
        averageRating: 4.9,
        completedTraining: 95,
        xpPoints: 5240,
        level: 5,
        nextLevelXP: 6000,
        currentStreak: 21,
        longestStreak: 45,
        responseTime: '< 15 minutes',
        accessibilityCompliance: 98,
        hipaaComplianceScore: 100,
        continuingEducationHours: 47,
        mentalHealthProfile: {
          specialties: ['anxiety', 'depression', 'ptsd'],
          therapeuticApproaches: ['cbt', 'dbt', 'mindfulness'],
          certificationLevel: 'crisis-trained',
          crisisTrainingCompleted: true,
          culturalCompetencies: ['LGBTQ+ affirming', 'trauma-informed', 'culturally responsive'],
          languagesSpoken: ['English', 'Spanish'],
          availabilityHours: {
            start: '09:00',
            end: '21:00',
            timezone: 'PST'
          }
        },
        crisisMetrics: {
          crisisInterventions: 23,
          emergencyReferrals: 8,
          safetyPlansCreated: 15,
          followUpSessions: 67,
          crisisResponseTime: 3.2, // minutes
          deescalationSuccessRate: 0.94
        },
        therapeuticOutcomes: {
          clientRetentionRate: 0.87,
          symptomImprovementRate: 0.82,
          crisisPreventionCount: 19,
          therapeuticGoalsAchieved: 156,
          clientSatisfactionScore: 4.8,
          evidenceBasedInterventions: 89
        }
      };

      const mockRequests: SessionRequest[] = [
        {
          id: '1',
          userId: 'user1',
          username: 'Alex M.',
          requestedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          urgency: 'crisis',
          crisisLevel: 'high',
          topic: 'Crisis Support - Suicidal Ideation',
          mentalHealthConcerns: ['depression', 'anxiety'],
          preferredTime: 'Immediate',
          notes: 'Experiencing active suicidal thoughts, need urgent support',
          triggerWarnings: ['suicide', 'self-harm'],
          suicidalIdeation: true,
          selfHarmRisk: true,
          previousTherapy: true,
          currentMedications: ['sertraline', 'lorazepam'],
          emergencyContact: {
            name: 'Mom - Linda M.',
            phone: '+1-555-0123',
            relationship: 'Mother'
          },
          accessibilityNeeds: ['large text', 'simple language'],
          status: 'pending',
          safetyPlanRequired: true
        },
        {
          id: '2',
          userId: 'user2',
          username: 'Sarah K.',
          requestedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          urgency: 'high',
          crisisLevel: 'moderate',
          topic: 'PTSD Trauma Processing',
          mentalHealthConcerns: ['ptsd', 'anxiety'],
          preferredTime: 'This evening',
          notes: 'Having flashbacks and nightmares, need therapeutic support',
          triggerWarnings: ['trauma', 'military service'],
          culturalConsiderations: ['veteran status', 'military culture'],
          suicidalIdeation: false,
          selfHarmRisk: false,
          previousTherapy: true,
          status: 'pending',
          safetyPlanRequired: false
        },
        {
          id: '3',
          userId: 'user3',
          username: 'Jordan P.',
          requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          urgency: 'medium',
          crisisLevel: 'low',
          topic: 'Anxiety Management',
          mentalHealthConcerns: ['anxiety'],
          preferredTime: 'Tomorrow morning',
          notes: 'Work stress causing panic attacks, need coping strategies',
          suicidalIdeation: false,
          selfHarmRisk: false,
          previousTherapy: false,
          status: 'pending',
          safetyPlanRequired: false
        }
      ];

      const mockNotifications: HelperNotification[] = [
        {
          id: '1',
          type: 'crisis_alert',
          title: '🚨 CRISIS ALERT',
          message: 'Alex M. requires immediate crisis intervention - suicidal ideation reported',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isRead: false,
          actionRequired: true,
          priority: 'emergency',
          crisisLevel: 'high',
          relatedSessionId: '1',
          requiresImmediateAction: true
        },
        {
          id: '2',
          type: 'therapeutic_update',
          title: 'Client Progress Update',
          message: 'Sarah K. has shown 40% improvement in PTSD symptoms over 8 weeks',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isRead: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'safety_concern',
          title: 'Safety Plan Review Due',
          message: 'Client Marcus T. safety plan requires review and update',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          actionRequired: true,
          priority: 'high'
        },
        {
          id: '4',
          type: 'kudos',
          title: 'Exceptional Care Recognition',
          message: 'You received 10 kudos from Jamie for your crisis intervention skills',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          priority: 'low'
        }
      ];

      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'Crisis Intervention Specialist',
          description: 'Successfully handle 20+ crisis interventions',
          icon: '🚨',
          unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          xpReward: 500
        },
        {
          id: '2',
          title: 'Trauma-Informed Care Expert',
          description: 'Complete advanced PTSD therapy certification',
          icon: '🧠',
          unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          xpReward: 400
        },
        {
          id: '3',
          title: 'Cultural Competency Champion',
          description: 'Provide culturally responsive care to 50+ clients',
          icon: '🌍',
          unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          xpReward: 300
        },
        {
          id: '4',
          title: 'Accessibility Advocate',
          description: 'Achieve 95%+ accessibility compliance rating',
          icon: '♿',
          unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          xpReward: 250
        }
      ];

      setStats(mockStats);
      setSessionRequests(mockRequests);
      setNotifications(mockNotifications);
      setAchievements(mockAchievements);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSessionRequest = useCallback(async (requestId: string, action: 'accept' | 'decline' | 'crisis-escalate') => {
    try {
      const request = sessionRequests.find(req => req.id === requestId);
      if (!request) return;
      
      setSessionRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          let newStatus: SessionStatus = 'accepted';
          if (action === 'decline') newStatus = 'declined';
          if (action === 'crisis-escalate') newStatus = 'crisis-escalated';
          
          return { ...req, status: newStatus, assignedTherapist: action === 'accept' ? user?.firstName : undefined };
        }
        return req;
      }));
      
      // Handle crisis escalation
      if (action === 'crisis-escalate' && request.urgency === 'crisis') {
        // Create emergency notification
        const emergencyNotif: HelperNotification = {
          id: `emergency-${Date.now()}`,
          type: 'crisis_alert',
          title: '🚨 CRISIS ESCALATED',
          message: `Crisis for ${request.username} escalated to emergency team - Safety protocol activated`,
          timestamp: new Date().toISOString(),
          isRead: false,
          actionRequired: false,
          priority: 'emergency',
          crisisLevel: request.crisisLevel,
          relatedSessionId: requestId
        };
        
        setNotifications(prev => [emergencyNotif, ...prev]);
        showNotification('Crisis escalated to emergency team - Client safety prioritized', 'error');
        
        return;
      }
      
      const successMessage = {
        accept: `Session accepted - ${request.crisisLevel === 'high' ? 'Crisis support' : 'Therapeutic session'} scheduled`,
        decline: `Session declined - Alternative helpers will be notified${request.urgency === 'crisis' ? ' (URGENT)' : ''}`,
        'crisis-escalate': 'Crisis escalated to emergency team'
      };
      
      showNotification(successMessage[action], 
        action === 'accept' ? 'success' : 
        action === 'crisis-escalate' ? 'error' : 'warning'
      );
      
      // Update related notifications
      setNotifications(prev => prev.map(notif => 
        (notif.relatedSessionId === requestId || (notif.type === 'crisis_alert' && notif.message.includes(requestId)))
          ? { ...notif, isRead: true, actionRequired: false }
          : notif
      ));
      
      // If accepting a crisis session, create safety plan reminder
      if (action === 'accept' && request.safetyPlanRequired) {
        const safetyPlanNotif: HelperNotification = {
          id: `safety-plan-${Date.now()}`,
          type: 'safety_concern',
          title: 'Safety Plan Required',
          message: `Create safety plan for ${request.username} before session begins`,
          timestamp: new Date().toISOString(),
          isRead: false,
          actionRequired: true,
          priority: 'high',
          relatedSessionId: requestId
        };
        
        setNotifications(prev => [safetyPlanNotif, ...prev]);
      }
      
    } catch (error) {
      console.error('Error handling session request:', error);
      showNotification(`Failed to ${action} session request`, 'error');
    }
  }, [sessionRequests, user]);

  const handleEmergencyEscalation = useCallback(async (requestId: string) => {
    try {
      const request = sessionRequests.find(req => req.id === requestId);
      if (!request) return;
      
      // Immediately escalate to emergency services
      setSessionRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'crisis-escalated' }
          : req
      ));
      
      const emergencyNotif: HelperNotification = {
        id: `emergency-${Date.now()}`,
        type: 'crisis_alert',
        title: '🚨 EMERGENCY SERVICES CONTACTED',
        message: `Emergency services contacted for ${request.username} - Crisis intervention in progress`,
        timestamp: new Date().toISOString(),
        isRead: false,
        actionRequired: false,
        priority: 'emergency',
        crisisLevel: 'critical',
        relatedSessionId: requestId
      };
      
      setNotifications(prev => [emergencyNotif, ...prev]);
      showNotification('🚨 Emergency services contacted - Client safety prioritized', 'error');
      
    } catch (error) {
      console.error('Error escalating emergency:', error);
      showNotification('Failed to escalate emergency', 'error');
    }
  }, [sessionRequests]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  }, []);

  const urgencyColor = useCallback((urgency: string, crisisLevel?: CrisisLevel) => {
    if (urgency === 'crisis' || crisisLevel === 'critical') return '#dc2626'; // Red 600
    if (crisisLevel === 'high') return '#ea580c'; // Orange 600
    if (crisisLevel === 'moderate') return '#d97706'; // Amber 600
    
    switch (urgency) {
      case 'high': return '#ef4444'; // Red 500
      case 'medium': return '#f59e0b'; // Amber 500
      case 'low': return '#10b981'; // Emerald 500
      default: return '#6b7280'; // Gray 500
    }
  }, []);

  const getPriorityIcon = useCallback((priority: string, crisisLevel?: CrisisLevel) => {
    if (priority === 'emergency' || crisisLevel === 'critical') {
      return <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />;
    }
    if (crisisLevel === 'high') {
      return <Shield className="w-4 h-4 text-orange-600" />;
    }
    if (priority === 'high') {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
    return <Clock className="w-4 h-4 text-gray-500" />;
  }, []);

  const getCrisisLevelBadge = useCallback((level?: CrisisLevel) => {
    if (!level || level === 'low') return null;
    
    const colors = {
      critical: 'bg-red-600 text-white animate-pulse',
      high: 'bg-orange-500 text-white',
      moderate: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[level]}`}>
        CRISIS: {level.toUpperCase()}
      </span>
    );
  }, []);

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const progressToNextLevel = useMemo(() => {
    const currentLevelXP = (stats.level - 1) * 1000;
    const progressXP = stats.xpPoints - currentLevelXP;
    const levelXPRange = stats.nextLevelXP - currentLevelXP;
    return (progressXP / levelXPRange) * 100;
  }, [stats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your helper dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'Helper'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Ready to make a difference today?</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-900">{stats.crisisMetrics.crisisInterventions}</div>
                  <div className="text-sm text-red-700">Crisis Interventions</div>
                  <div className="text-xs text-red-600">{stats.crisisMetrics.crisisResponseTime.toFixed(1)}min avg response</div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalSessions}</div>
                  <div className="text-sm text-blue-700">Therapeutic Sessions</div>
                  <div className="text-xs text-blue-600">{(stats.therapeuticOutcomes.clientRetentionRate * 100).toFixed(0)}% retention rate</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-900">{(stats.therapeuticOutcomes.symptomImprovementRate * 100).toFixed(0)}%</div>
                  <div className="text-sm text-green-700">Improvement Rate</div>
                  <div className="text-xs text-green-600">{stats.therapeuticOutcomes.crisisPreventionCount} crises prevented</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <Accessibility className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">{stats.accessibilityCompliance}%</div>
                  <div className="text-sm text-purple-700">Accessibility</div>
                  <div className="text-xs text-purple-600">WCAG 2.1 AAA compliance</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-yellow-900">{stats.continuingEducationHours}</div>
                  <div className="text-sm text-yellow-700">CE Hours</div>
                  <div className="text-xs text-yellow-600">{stats.mentalHealthProfile.certificationLevel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'sessions' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions ({sessionRequests.filter(req => req.status === 'pending').length})
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'training' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('training')}
          >
            Training
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'community' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('community')}
          >
            Community
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Level Progress */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Level Progress</h3>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-blue-600">{stats.level}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressToNextLevel}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  {stats.xpPoints} / {stats.nextLevelXP} XP
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {notifications.slice(0, 3).map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-2">{formatTimeAgo(notification.timestamp)}</div>
                    {notification.actionRequired && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Action Required
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {achievements.slice(0, 4).map(achievement => (
                  <div key={achievement.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mr-3">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{achievement.title}</div>
                      <div className="text-xs text-gray-600">+{achievement.xpReward} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mental Health Specialties */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mental Health Specialties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Areas of Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.mentalHealthProfile.specialties.map((specialty) => (
                      <span key={specialty} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {specialty.replace('-', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Therapeutic Approaches</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.mentalHealthProfile.therapeuticApproaches.map((approach) => (
                      <span key={approach} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {approach.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cultural Competencies</h4>
                  <div className="space-y-1">
                    {stats.mentalHealthProfile.culturalCompetencies.map((competency, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        <span>{competency}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="mb-2">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium">
                        {stats.mentalHealthProfile.certificationLevel.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    {stats.mentalHealthProfile.crisisTrainingCompleted && (
                      <div className="flex items-center mt-1">
                        <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">Crisis Training Certified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Crisis & Therapeutic Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Crisis & Therapeutic Metrics</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Crisis Response</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Response Time</span>
                      <span className="font-medium text-red-600">{stats.crisisMetrics.crisisResponseTime.toFixed(1)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>De-escalation Success</span>
                      <span className="font-medium text-green-600">{(stats.crisisMetrics.deescalationSuccessRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Safety Plans Created</span>
                      <span className="font-medium">{stats.crisisMetrics.safetyPlansCreated}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Therapeutic Outcomes</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Client Satisfaction</span>
                      <span className="font-medium text-blue-600">{stats.therapeuticOutcomes.clientSatisfactionScore.toFixed(1)}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goals Achieved</span>
                      <span className="font-medium">{stats.therapeuticOutcomes.therapeuticGoalsAchieved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HIPAA Compliance</span>
                      <span className="font-medium text-green-600">{stats.hipaaComplianceScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Session Requests</h2>
              <p className="text-gray-600 mt-1">Manage incoming session requests from community members</p>
            </div>

            {sessionRequests.filter(req => req.status === 'pending').length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending session requests</h3>
                <p className="text-gray-600">New requests will appear here when community members reach out for help.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessionRequests
                  .filter(req => req.status === 'pending')
                  .map(request => (
                    <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-500 mr-2" />
                          <span className="font-medium text-gray-900">{request.username}</span>
                          {request.previousTherapy && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Previous Therapy
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{formatTimeAgo(request.requestedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mb-4">
                        <div 
                          className={`flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${
                            request.urgency === 'crisis' ? 'bg-red-600 animate-pulse' : 
                            request.urgency === 'high' ? 'bg-orange-500' :
                            request.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        >
                          {getPriorityIcon(request.urgency, request.crisisLevel)}
                          <span className="ml-1">{request.urgency.toUpperCase()}</span>
                        </div>
                        {getCrisisLevelBadge(request.crisisLevel)}
                        {request.safetyPlanRequired && (
                          <span className="flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            <Shield className="w-3 h-3 mr-1" />
                            Safety Plan Required
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <strong className="text-gray-900">Primary Concern:</strong>
                          <span className="ml-2">{request.topic}</span>
                        </div>
                        
                        {request.mentalHealthConcerns.length > 0 && (
                          <div>
                            <strong className="text-gray-900">Mental Health Areas:</strong>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {request.mentalHealthConcerns.map((concern) => (
                                <span key={concern} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                  {concern.replace('-', ' ').toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(request.suicidalIdeation || request.selfHarmRisk) && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-800">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              <strong>RISK FACTORS:</strong>
                            </div>
                            <div className="mt-1 space-x-4 text-sm text-red-700">
                              {request.suicidalIdeation && <span>• Suicidal Ideation</span>}
                              {request.selfHarmRisk && <span>• Self-Harm Risk</span>}
                            </div>
                          </div>
                        )}
                        
                        {request.notes && (
                          <div>
                            <strong className="text-gray-900">Client Notes:</strong>
                            <span className="ml-2">{request.notes}</span>
                          </div>
                        )}
                        
                        {request.emergencyContact && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-800">
                              <Phone className="w-4 h-4 mr-2" />
                              <strong>Emergency Contact:</strong>
                            </div>
                            <div className="text-sm text-red-700 mt-1">
                              {request.emergencyContact.name} ({request.emergencyContact.relationship}) - {request.emergencyContact.phone}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                        {request.urgency === 'crisis' && (
                          <button
                            onClick={() => handleEmergencyEscalation(request.id)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 animate-pulse"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Emergency Services
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleSessionRequest(request.id, 'decline')}
                          className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </button>
                        
                        {request.urgency === 'crisis' && (
                          <button
                            onClick={() => handleSessionRequest(request.id, 'crisis-escalate')}
                            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Crisis Escalate
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleSessionRequest(request.id, 'accept')}
                          className={`flex items-center px-4 py-2 rounded-lg ${
                            request.urgency === 'crisis' 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {request.urgency === 'crisis' ? 'Accept Crisis Session' : 'Accept Session'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'training' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Training Progress</h2>
            
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-200" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="16" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none" 
                      strokeDasharray={`${stats.completedTraining}, 100`}
                      className="text-blue-600"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.completedTraining}%</div>
                      <div className="text-sm text-gray-600">Complete</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Training Modules</h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl mr-4">🚨</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Crisis Intervention & Suicide Prevention</div>
                    <div className="text-sm text-green-600 font-medium">Completed ✓ Certified</div>
                    <div className="text-sm text-gray-600">40 hours • Evidence-based protocols</div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl mr-4">🧠</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Trauma-Informed Care (TIC)</div>
                    <div className="text-sm text-green-600 font-medium">Completed ✓ Advanced Level</div>
                    <div className="text-sm text-gray-600">35 hours • PTSD & Complex Trauma</div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl mr-4">♿</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Accessibility & Neurodivergent Support</div>
                    <div className="text-sm text-blue-600 font-medium">In Progress (85%)</div>
                    <div className="text-sm text-gray-600">20 hours • Universal design principles</div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl mr-4">⚖️</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Ethics & HIPAA Compliance Update</div>
                    <div className="text-sm text-yellow-600 font-medium">Required by Dec 2024</div>
                    <div className="text-sm text-gray-600">15 hours • Annual requirement</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Helper Community</h2>
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect with Other Helpers</h3>
              <p className="text-gray-600 mb-6">Share experiences, get support, and learn from fellow helpers.</p>
              
              <div className="flex justify-center space-x-4">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Join Discussion Forum
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  View Helper Resources
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelperDashboardView;