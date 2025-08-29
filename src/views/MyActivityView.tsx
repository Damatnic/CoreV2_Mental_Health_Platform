/**
 * MyActivityView - Mental Health Platform Activity Tracking Component
 * 
 * Provides comprehensive activity tracking with mental health focus including:
 * - Therapeutic engagement monitoring
 * - Crisis intervention logging
 * - Mood tracking history
 * - Community support interactions
 * - Wellness milestone tracking
 * - Evidence-based activity insights
 * 
 * @accessibility WCAG 2.1 AA compliant
 * @crisis-safe Trauma-informed activity display
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  formatTimeAgo, 
  formatTimeAgoWithContext,
  formatCrisisSafeTime,
  formatTherapySessionTime 
} from '../utils/formatTimeAgo';
import { 
  HeartIcon, 
  CommentIcon, 
  ShareIcon, 
  BookmarkIcon, 
  EyeIcon, 
  TrendingUpIcon,
  BrainIcon,
  ShieldIcon,
  ActivityIcon,
  AwardIcon,
  CalendarIcon,
  ClockIcon,
  SmileIcon,
  TargetIcon,
  UsersIcon,
  AlertCircleIcon,
  CheckIcon,
  SparkleIcon
} from '../components/icons.dynamic';

// Enhanced activity types for mental health platform
type MentalHealthActivityType = 
  // Content activities
  | 'post_created' 
  | 'post_liked' 
  | 'comment_made' 
  | 'post_shared' 
  | 'post_bookmarked' 
  | 'profile_viewed'
  // Mental health specific activities  
  | 'mood_logged'
  | 'journal_entry'
  | 'therapy_session'
  | 'crisis_support_accessed'
  | 'meditation_completed'
  | 'breathing_exercise'
  | 'self_care_activity'
  | 'support_group_joined'
  | 'wellness_goal_set'
  | 'wellness_goal_achieved'
  | 'coping_strategy_used'
  | 'medication_logged'
  | 'sleep_logged'
  | 'exercise_completed'
  | 'crisis_plan_updated'
  | 'safety_check_completed'
  | 'achievement_earned'
  | 'milestone_reached'
  | 'peer_support_given'
  | 'peer_support_received';

// Enhanced metadata for mental health activities
interface MentalHealthMetadata {
  // Standard metadata
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  category?: string;
  achievement?: string;
  
  // Mental health specific metadata
  moodScore?: number;
  moodType?: 'excellent' | 'good' | 'neutral' | 'low' | 'crisis';
  anxietyLevel?: number;
  stressLevel?: number;
  therapyType?: 'individual' | 'group' | 'crisis' | 'teletherapy';
  interventionType?: 'preventive' | 'acute' | 'maintenance';
  copingStrategy?: string;
  duration?: number; // in minutes
  intensity?: 'light' | 'moderate' | 'high';
  supportType?: 'peer' | 'professional' | 'ai_companion' | 'crisis_line';
  wellnessArea?: 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual';
  crisisLevel?: 'low' | 'moderate' | 'high' | 'severe';
  medicationType?: string;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  sleepHours?: number;
  exerciseType?: string;
}

// Enhanced activity item interface
interface ActivityItem {
  id: string;
  type: MentalHealthActivityType;
  title: string;
  description: string;
  timestamp: Date;
  relatedId?: string;
  relatedTitle?: string;
  metadata?: MentalHealthMetadata;
  isTherapeutic?: boolean;
  isCrisisRelated?: boolean;
  privacyLevel?: 'public' | 'friends' | 'private' | 'therapist_only';
  therapeuticValue?: number; // 0-100 scale
}

// Enhanced activity statistics
interface ActivityStats {
  // Standard stats
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  profileViews: number;
  
  // Mental health specific stats
  moodLogsCount: number;
  averageMoodScore: number;
  therapySessionsCount: number;
  meditationMinutes: number;
  journalEntries: number;
  copingStrategiesUsed: number;
  wellnessGoalsAchieved: number;
  supportInteractions: number;
  crisisInterventions: number;
  achievementsEarned: number;
  streakDays: number;
  wellnessScore: number;
  engagementScore: number;
  recoveryProgress: number;
}

// Enhanced filter interface
interface ActivityFilters {
  type: string;
  timeRange: 'today' | 'week' | 'month' | 'all';
  category: string;
  wellnessArea: string;
  privacyLevel: string;
  showTherapeuticOnly: boolean;
  showCrisisRelated: boolean;
}

// Wellness insights interface
interface WellnessInsight {
  id: string;
  type: 'positive' | 'neutral' | 'attention';
  title: string;
  description: string;
  recommendation?: string;
  relatedActivities: string[];
}

const MyActivityView: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  
  // State management
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [insights, setInsights] = useState<WellnessInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportInProgress, setExportInProgress] = useState(false);
  
  // Enhanced filters for mental health
  const [filters, setFilters] = useState<ActivityFilters>({
    type: 'all',
    timeRange: 'week',
    category: 'all',
    wellnessArea: 'all',
    privacyLevel: 'all',
    showTherapeuticOnly: false,
    showCrisisRelated: false
  });
  
  // UI state
  const [showStats, setShowStats] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  // Load activity data with mental health focus
  const loadActivityData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Enhanced mock data with mental health activities
      const mockActivities: ActivityItem[] = [
        // Mood tracking activity
        {
          id: '1',
          type: 'mood_logged',
          title: 'Daily mood check-in',
          description: 'Tracked your emotional state and energy levels',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          metadata: {
            moodScore: 7,
            moodType: 'good',
            anxietyLevel: 3,
            stressLevel: 4,
            wellnessArea: 'emotional'
          },
          isTherapeutic: true,
          privacyLevel: 'private',
          therapeuticValue: 85
        },
        
        // Therapy session
        {
          id: '2',
          type: 'therapy_session',
          title: 'Completed therapy session',
          description: 'Individual CBT session with Dr. Smith',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          relatedId: 'session-123',
          relatedTitle: 'Cognitive Behavioral Therapy',
          metadata: {
            therapyType: 'individual',
            duration: 50,
            wellnessArea: 'mental'
          },
          isTherapeutic: true,
          privacyLevel: 'therapist_only',
          therapeuticValue: 95
        },
        
        // Crisis support
        {
          id: '3',
          type: 'crisis_support_accessed',
          title: 'Connected with crisis support',
          description: 'Reached out during a difficult moment - great job seeking help',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          metadata: {
            supportType: 'crisis_line',
            crisisLevel: 'moderate',
            interventionType: 'acute',
            duration: 30,
            wellnessArea: 'mental'
          },
          isCrisisRelated: true,
          isTherapeutic: true,
          privacyLevel: 'private',
          therapeuticValue: 100
        },
        
        // Meditation
        {
          id: '4',
          type: 'meditation_completed',
          title: 'Completed guided meditation',
          description: 'Mindfulness meditation for anxiety relief',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          relatedId: 'meditation-456',
          relatedTitle: 'Calm Mind Meditation',
          metadata: {
            duration: 15,
            category: 'mindfulness',
            wellnessArea: 'mental',
            copingStrategy: 'mindfulness'
          },
          isTherapeutic: true,
          privacyLevel: 'friends',
          therapeuticValue: 80
        },
        
        // Journal entry
        {
          id: '5',
          type: 'journal_entry',
          title: 'Added journal reflection',
          description: 'Processed thoughts and emotions through writing',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          metadata: {
            category: 'reflection',
            wellnessArea: 'emotional',
            copingStrategy: 'journaling'
          },
          isTherapeutic: true,
          privacyLevel: 'private',
          therapeuticValue: 75
        },
        
        // Exercise
        {
          id: '6',
          type: 'exercise_completed',
          title: 'Completed physical activity',
          description: '30-minute walk in nature for mental clarity',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          metadata: {
            exerciseType: 'walking',
            duration: 30,
            intensity: 'moderate',
            wellnessArea: 'physical'
          },
          isTherapeutic: true,
          privacyLevel: 'friends',
          therapeuticValue: 70
        },
        
        // Sleep tracking
        {
          id: '7',
          type: 'sleep_logged',
          title: 'Tracked sleep patterns',
          description: '7.5 hours of restorative sleep',
          timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000),
          metadata: {
            sleepHours: 7.5,
            sleepQuality: 'good',
            wellnessArea: 'physical'
          },
          isTherapeutic: true,
          privacyLevel: 'private',
          therapeuticValue: 65
        },
        
        // Peer support given
        {
          id: '8',
          type: 'peer_support_given',
          title: 'Offered support to community member',
          description: 'Shared encouragement with someone facing similar challenges',
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
          relatedId: 'post-789',
          relatedTitle: 'Dealing with anxiety',
          metadata: {
            supportType: 'peer',
            likes: 12,
            comments: 3,
            wellnessArea: 'social'
          },
          isTherapeutic: true,
          privacyLevel: 'public',
          therapeuticValue: 85
        },
        
        // Wellness goal achieved
        {
          id: '9',
          type: 'wellness_goal_achieved',
          title: 'Achieved wellness goal',
          description: 'Completed 7-day meditation streak',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          metadata: {
            achievement: '7-Day Mindfulness Warrior',
            wellnessArea: 'mental'
          },
          isTherapeutic: true,
          privacyLevel: 'friends',
          therapeuticValue: 90
        },
        
        // Coping strategy used
        {
          id: '10',
          type: 'coping_strategy_used',
          title: 'Applied coping technique',
          description: 'Used 4-7-8 breathing technique during stressful moment',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          metadata: {
            copingStrategy: 'breathing_exercise',
            duration: 5,
            wellnessArea: 'emotional'
          },
          isTherapeutic: true,
          privacyLevel: 'private',
          therapeuticValue: 75
        },
        
        // Community post
        {
          id: '11',
          type: 'post_created',
          title: 'Shared your story',
          description: 'Posted about your recovery journey',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
          relatedId: 'post-101',
          relatedTitle: 'My path to healing',
          metadata: {
            likes: 45,
            comments: 12,
            views: 234,
            category: 'personal-story',
            wellnessArea: 'social'
          },
          privacyLevel: 'public',
          therapeuticValue: 60
        },
        
        // Safety plan update
        {
          id: '12',
          type: 'crisis_plan_updated',
          title: 'Updated crisis safety plan',
          description: 'Reviewed and updated emergency contacts and coping strategies',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          metadata: {
            interventionType: 'preventive',
            wellnessArea: 'mental'
          },
          isCrisisRelated: true,
          isTherapeutic: true,
          privacyLevel: 'therapist_only',
          therapeuticValue: 100
        }
      ];

      setActivities(mockActivities);
      await loadActivityStats();
      generateWellnessInsights(mockActivities);
      
    } catch (error) {
      console.error('Error loading activity data:', error);
      showError('Failed to load activity data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, showError]);

  // Load enhanced activity statistics
  const loadActivityStats = useCallback(async () => {
    if (!user) return;
    
    try {
      // Enhanced mock stats with mental health metrics
      const mockStats: ActivityStats = {
        totalPosts: 12,
        totalLikes: 89,
        totalComments: 34,
        totalShares: 15,
        profileViews: 156,
        moodLogsCount: 28,
        averageMoodScore: 6.8,
        therapySessionsCount: 8,
        meditationMinutes: 245,
        journalEntries: 21,
        copingStrategiesUsed: 15,
        wellnessGoalsAchieved: 5,
        supportInteractions: 42,
        crisisInterventions: 2,
        achievementsEarned: 7,
        streakDays: 14,
        wellnessScore: 78,
        engagementScore: 85,
        recoveryProgress: 72
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      showWarning('Could not load complete statistics');
    }
  }, [user, showWarning]);

  // Generate wellness insights based on activity patterns
  const generateWellnessInsights = useCallback((activityData: ActivityItem[]) => {
    const recentActivities = activityData.slice(0, 5);
    const insights: WellnessInsight[] = [];

    // Analyze mood patterns
    const moodActivities = recentActivities.filter(a => a.type === 'mood_logged');
    if (moodActivities.length > 0) {
      const avgMood = moodActivities.reduce((sum, a) => 
        sum + (a.metadata?.moodScore || 0), 0) / moodActivities.length;
      
      if (avgMood >= 7) {
        insights.push({
          id: 'mood-positive',
          type: 'positive',
          title: 'Positive mood trend',
          description: 'Your recent mood logs show consistent positive emotional state',
          recommendation: 'Keep up the great self-care practices!',
          relatedActivities: moodActivities.map(a => a.id)
        });
      } else if (avgMood < 5) {
        insights.push({
          id: 'mood-attention',
          type: 'attention',
          title: 'Low mood detected',
          description: 'Your recent mood scores suggest you might be going through a difficult time',
          recommendation: 'Consider reaching out to your support network or therapist',
          relatedActivities: moodActivities.map(a => a.id)
        });
      }
    }

    // Check therapy engagement
    const therapyActivities = recentActivities.filter(a => a.type === 'therapy_session');
    if (therapyActivities.length > 0) {
      insights.push({
        id: 'therapy-consistent',
        type: 'positive',
        title: 'Consistent therapy attendance',
        description: 'You\'re maintaining regular therapy sessions',
        recommendation: 'This consistency is key to your mental health journey',
        relatedActivities: therapyActivities.map(a => a.id)
      });
    }

    // Check coping strategy usage
    const copingActivities = recentActivities.filter(a => 
      ['meditation_completed', 'breathing_exercise', 'coping_strategy_used'].includes(a.type)
    );
    if (copingActivities.length >= 3) {
      insights.push({
        id: 'coping-active',
        type: 'positive',
        title: 'Active coping engagement',
        description: 'You\'re regularly using healthy coping strategies',
        relatedActivities: copingActivities.map(a => a.id)
      });
    }

    setInsights(insights);
  }, []);

  // Apply filters with mental health considerations
  const applyFilters = useCallback(() => {
    let filtered = [...activities];

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.type);
    }

    // Apply time range filter
    const now = Date.now();
    switch (filters.timeRange) {
      case 'today':
        filtered = filtered.filter(activity => 
          now - activity.timestamp.getTime() < 24 * 60 * 60 * 1000
        );
        break;
      case 'week':
        filtered = filtered.filter(activity => 
          now - activity.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
        );
        break;
      case 'month':
        filtered = filtered.filter(activity => 
          now - activity.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000
        );
        break;
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(activity => 
        activity.metadata?.category === filters.category
      );
    }

    // Apply wellness area filter
    if (filters.wellnessArea !== 'all') {
      filtered = filtered.filter(activity => 
        activity.metadata?.wellnessArea === filters.wellnessArea
      );
    }

    // Apply privacy level filter
    if (filters.privacyLevel !== 'all') {
      filtered = filtered.filter(activity => 
        activity.privacyLevel === filters.privacyLevel
      );
    }

    // Apply therapeutic filter
    if (filters.showTherapeuticOnly) {
      filtered = filtered.filter(activity => activity.isTherapeutic);
    }

    // Apply crisis filter
    if (filters.showCrisisRelated) {
      filtered = filtered.filter(activity => activity.isCrisisRelated);
    }

    // Sort by most recent
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredActivities(filtered);
  }, [activities, filters]);

  // Get appropriate icon for activity type
  const getActivityIcon = useCallback((type: MentalHealthActivityType) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      // Content activities
      case 'post_created':
        return <ShareIcon {...iconProps} className="w-5 h-5 text-blue-500" />;
      case 'post_liked':
        return <HeartIcon {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'comment_made':
        return <CommentIcon {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'post_shared':
        return <ShareIcon {...iconProps} className="w-5 h-5 text-purple-500" />;
      case 'post_bookmarked':
        return <BookmarkIcon {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'profile_viewed':
        return <EyeIcon {...iconProps} className="w-5 h-5 text-gray-500" />;
        
      // Mental health activities
      case 'mood_logged':
        return <SmileIcon {...iconProps} className="w-5 h-5 text-indigo-500" />;
      case 'journal_entry':
        return <CalendarIcon {...iconProps} className="w-5 h-5 text-teal-500" />;
      case 'therapy_session':
        return <BrainIcon {...iconProps} className="w-5 h-5 text-purple-600" />;
      case 'crisis_support_accessed':
        return <ShieldIcon {...iconProps} className="w-5 h-5 text-red-600" />;
      case 'meditation_completed':
        return <SparkleIcon {...iconProps} className="w-5 h-5 text-cyan-500" />;
      case 'breathing_exercise':
        return <ActivityIcon {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'self_care_activity':
        return <HeartIcon {...iconProps} className="w-5 h-5 text-pink-500" />;
      case 'support_group_joined':
        return <UsersIcon {...iconProps} className="w-5 h-5 text-green-600" />;
      case 'wellness_goal_set':
      case 'wellness_goal_achieved':
        return <TargetIcon {...iconProps} className="w-5 h-5 text-amber-500" />;
      case 'coping_strategy_used':
        return <CheckIcon {...iconProps} className="w-5 h-5 text-emerald-500" />;
      case 'medication_logged':
        return <ClockIcon {...iconProps} className="w-5 h-5 text-orange-500" />;
      case 'sleep_logged':
        return <CalendarIcon {...iconProps} className="w-5 h-5 text-indigo-400" />;
      case 'exercise_completed':
        return <ActivityIcon {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'crisis_plan_updated':
        return <ShieldIcon {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'safety_check_completed':
        return <CheckIcon {...iconProps} className="w-5 h-5 text-teal-600" />;
      case 'achievement_earned':
      case 'milestone_reached':
        return <AwardIcon {...iconProps} className="w-5 h-5 text-yellow-600" />;
      case 'peer_support_given':
      case 'peer_support_received':
        return <UsersIcon {...iconProps} className="w-5 h-5 text-blue-600" />;
        
      default:
        return <ActivityIcon {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  }, []);

  // Get human-readable activity type label
  const getActivityTypeLabel = useCallback((type: MentalHealthActivityType): string => {
    const labels: Record<MentalHealthActivityType, string> = {
      'post_created': 'Post Created',
      'post_liked': 'Post Liked',
      'comment_made': 'Comment Made',
      'post_shared': 'Post Shared',
      'post_bookmarked': 'Post Bookmarked',
      'profile_viewed': 'Profile Viewed',
      'mood_logged': 'Mood Check-in',
      'journal_entry': 'Journal Entry',
      'therapy_session': 'Therapy Session',
      'crisis_support_accessed': 'Crisis Support',
      'meditation_completed': 'Meditation',
      'breathing_exercise': 'Breathing Exercise',
      'self_care_activity': 'Self Care',
      'support_group_joined': 'Support Group',
      'wellness_goal_set': 'Goal Set',
      'wellness_goal_achieved': 'Goal Achieved',
      'coping_strategy_used': 'Coping Strategy',
      'medication_logged': 'Medication',
      'sleep_logged': 'Sleep Tracking',
      'exercise_completed': 'Exercise',
      'crisis_plan_updated': 'Crisis Plan',
      'safety_check_completed': 'Safety Check',
      'achievement_earned': 'Achievement',
      'milestone_reached': 'Milestone',
      'peer_support_given': 'Support Given',
      'peer_support_received': 'Support Received'
    };
    return labels[type] || 'Activity';
  }, []);

  // Handle viewing related content
  const handleViewRelated = useCallback((activityId: string, relatedId?: string) => {
    if (relatedId) {
      showInfo(`Opening related content: ${relatedId}`);
      // Navigate to related content
      setSelectedActivity(activityId);
    }
  }, [showInfo]);

  // Export activity with mental health considerations
  const handleExportActivity = useCallback(async () => {
    try {
      setExportInProgress(true);
      
      // Prepare data with privacy considerations
      const exportData = filteredActivities
        .filter(a => a.privacyLevel !== 'therapist_only') // Exclude therapist-only data
        .map(activity => ({
          date: activity.timestamp.toISOString(),
          type: getActivityTypeLabel(activity.type),
          title: activity.title,
          description: activity.description,
          relatedContent: activity.relatedTitle || '',
          wellnessArea: activity.metadata?.wellnessArea || '',
          therapeuticValue: activity.therapeuticValue || 0,
          // Sanitize sensitive data
          moodScore: activity.metadata?.moodScore || '',
          copingStrategy: activity.metadata?.copingStrategy || ''
        }));

      const csvContent = [
        ['Date', 'Type', 'Title', 'Description', 'Related Content', 'Wellness Area', 'Therapeutic Value', 'Mood Score', 'Coping Strategy'],
        ...exportData.map(row => [
          row.date,
          row.type,
          row.title,
          row.description,
          row.relatedContent,
          row.wellnessArea,
          row.therapeuticValue.toString(),
          row.moodScore.toString(),
          row.copingStrategy
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mental-health-activity-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSuccess('Activity exported successfully. Therapist-only data has been excluded for privacy.');
    } catch (error) {
      console.error('Error exporting activity:', error);
      showError('Failed to export activity. Please try again.');
    } finally {
      setExportInProgress(false);
    }
  }, [filteredActivities, showSuccess, showError, getActivityTypeLabel]);

  // Activity type options with mental health categories
  const activityTypeOptions = useMemo(() => [
    { value: 'all', label: 'All Activities' },
    { value: 'mood_logged', label: 'Mood Check-ins' },
    { value: 'journal_entry', label: 'Journal Entries' },
    { value: 'therapy_session', label: 'Therapy Sessions' },
    { value: 'meditation_completed', label: 'Meditations' },
    { value: 'exercise_completed', label: 'Exercise' },
    { value: 'sleep_logged', label: 'Sleep Logs' },
    { value: 'coping_strategy_used', label: 'Coping Strategies' },
    { value: 'crisis_support_accessed', label: 'Crisis Support' },
    { value: 'peer_support_given', label: 'Support Given' },
    { value: 'wellness_goal_achieved', label: 'Goals Achieved' },
    { value: 'post_created', label: 'Posts Created' },
    { value: 'comment_made', label: 'Comments Made' }
  ], []);

  // Wellness area options
  const wellnessAreaOptions = useMemo(() => [
    { value: 'all', label: 'All Areas' },
    { value: 'physical', label: 'Physical Wellness' },
    { value: 'mental', label: 'Mental Health' },
    { value: 'emotional', label: 'Emotional Wellbeing' },
    { value: 'social', label: 'Social Connection' },
    { value: 'spiritual', label: 'Spiritual Growth' }
  ], []);

  // Privacy level options
  const privacyLevelOptions = useMemo(() => [
    { value: 'all', label: 'All Privacy Levels' },
    { value: 'public', label: 'Public' },
    { value: 'friends', label: 'Friends Only' },
    { value: 'private', label: 'Private' },
    { value: 'therapist_only', label: 'Therapist Only' }
  ], []);

  // Effects
  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        <p className="text-gray-600">Loading your wellness activity...</p>
      </div>
    );
  }

  // Render main component
  return (
    <div className="my-activity-view space-y-6">
      <ViewHeader
        title="My Wellness Activity"
        subtitle="Track your mental health journey and therapeutic progress"
      />

      {/* Wellness Insights Section */}
      {showInsights && insights.length > 0 && (
        <div className="insights-section space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Wellness Insights</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {insights.map(insight => (
              <Card key={insight.id} className={`insight-card p-4 border-l-4 ${
                insight.type === 'positive' ? 'border-green-500' :
                insight.type === 'attention' ? 'border-yellow-500' :
                'border-blue-500'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {insight.type === 'positive' ? (
                      <CheckIcon />
                    ) : insight.type === 'attention' ? (
                      <AlertCircleIcon />
                    ) : (
                      <ActivityIcon />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-primary-600 mt-2 font-medium">
                        {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Statistics Grid */}
      {stats && showStats && (
        <div className="stats-section space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Your Wellness Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Wellness Score */}
            <Card className="stat-card p-4 text-center bg-gradient-to-br from-green-50 to-green-100">
              <div className="stat-value text-2xl font-bold text-green-700">{stats.wellnessScore}%</div>
              <div className="stat-label text-sm text-green-600">Wellness Score</div>
            </Card>
            
            {/* Mood Average */}
            <Card className="stat-card p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="stat-value text-2xl font-bold text-blue-700">{stats.averageMoodScore.toFixed(1)}</div>
              <div className="stat-label text-sm text-blue-600">Avg Mood</div>
            </Card>
            
            {/* Therapy Sessions */}
            <Card className="stat-card p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="stat-value text-2xl font-bold text-purple-700">{stats.therapySessionsCount}</div>
              <div className="stat-label text-sm text-purple-600">Therapy Sessions</div>
            </Card>
            
            {/* Meditation Minutes */}
            <Card className="stat-card p-4 text-center bg-gradient-to-br from-cyan-50 to-cyan-100">
              <div className="stat-value text-2xl font-bold text-cyan-700">{stats.meditationMinutes}</div>
              <div className="stat-label text-sm text-cyan-600">Meditation Minutes</div>
            </Card>
            
            {/* Coping Strategies */}
            <Card className="stat-card p-4 text-center bg-gradient-to-br from-amber-50 to-amber-100">
              <div className="stat-value text-2xl font-bold text-amber-700">{stats.copingStrategiesUsed}</div>
              <div className="stat-label text-sm text-amber-600">Coping Strategies</div>
            </Card>
            
            {/* Streak Days */}
            <Card className="stat-card p-4 text-center bg-gradient-to-br from-red-50 to-red-100">
              <div className="stat-value text-2xl font-bold text-red-700">{stats.streakDays}</div>
              <div className="stat-label text-sm text-red-600">Day Streak</div>
            </Card>
            
            {/* Journal Entries */}
            <Card className="stat-card p-4 text-center">
              <div className="stat-value text-2xl font-bold text-gray-700">{stats.journalEntries}</div>
              <div className="stat-label text-sm text-gray-600">Journal Entries</div>
            </Card>
            
            {/* Support Interactions */}
            <Card className="stat-card p-4 text-center">
              <div className="stat-value text-2xl font-bold text-gray-700">{stats.supportInteractions}</div>
              <div className="stat-label text-sm text-gray-600">Support Given</div>
            </Card>
            
            {/* Goals Achieved */}
            <Card className="stat-card p-4 text-center">
              <div className="stat-value text-2xl font-bold text-gray-700">{stats.wellnessGoalsAchieved}</div>
              <div className="stat-label text-sm text-gray-600">Goals Achieved</div>
            </Card>
            
            {/* Achievements */}
            <Card className="stat-card p-4 text-center">
              <div className="stat-value text-2xl font-bold text-gray-700">{stats.achievementsEarned}</div>
              <div className="stat-label text-sm text-gray-600">Achievements</div>
            </Card>
            
            {/* Engagement Score */}
            <Card className="stat-card p-4 text-center">
              <div className="stat-value text-2xl font-bold text-gray-700">{stats.engagementScore}%</div>
              <div className="stat-label text-sm text-gray-600">Engagement</div>
            </Card>
            
            {/* Recovery Progress */}
            <Card className="stat-card p-4 text-center">
              <div className="stat-value text-2xl font-bold text-gray-700">{stats.recoveryProgress}%</div>
              <div className="stat-label text-sm text-gray-600">Recovery Progress</div>
            </Card>
          </div>
        </div>
      )}

      {/* Enhanced Filters with Mental Health Focus */}
      <Card className="filters-card p-6">
        <div className="filters-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {activityTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Wellness Area</label>
            <select
              value={filters.wellnessArea}
              onChange={(e) => setFilters(prev => ({ ...prev, wellnessArea: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {wellnessAreaOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Level</label>
            <select
              value={filters.privacyLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, privacyLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {privacyLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              <option value="personal-story">Personal Stories</option>
              <option value="wellness">Wellness</option>
              <option value="coping">Coping</option>
              <option value="meditation">Meditation</option>
              <option value="mindfulness">Mindfulness</option>
              <option value="reflection">Reflection</option>
              <option value="support">Support</option>
            </select>
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showTherapeuticOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, showTherapeuticOnly: e.target.checked }))}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Therapeutic Activities Only</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showCrisisRelated}
              onChange={(e) => setFilters(prev => ({ ...prev, showCrisisRelated: e.target.checked }))}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Crisis-Related Activities</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions flex flex-wrap gap-3 mt-4">
          <AppButton
            variant="secondary"
            size="small"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </AppButton>
          <AppButton
            variant="secondary"
            size="small"
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? 'Hide Insights' : 'Show Insights'}
          </AppButton>
          <AppButton
            variant="primary"
            size="small"
            onClick={handleExportActivity}
            disabled={exportInProgress}
          >
            {exportInProgress ? 'Exporting...' : 'Export Activity'}
          </AppButton>
        </div>
      </Card>

      {/* Activity List with Enhanced Mental Health Display */}
      <div className="activity-list space-y-4">
        {filteredActivities.length === 0 ? (
          <Card className="empty-state p-8 text-center">
            <ActivityIcon className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <p className="text-gray-600 font-medium">No activity found for the selected filters</p>
            <p className="text-gray-500 mt-2">Start your wellness journey by logging a mood check-in or trying a meditation!</p>
            <AppButton variant="primary" size="medium" className="mt-4">
              Start Activity
            </AppButton>
          </Card>
        ) : (
          filteredActivities.map(activity => (
            <Card 
              key={activity.id} 
              className={`activity-item p-4 hover:shadow-md transition-shadow ${
                activity.isCrisisRelated ? 'border-l-4 border-red-500' :
                activity.therapeuticValue && activity.therapeuticValue >= 80 ? 'border-l-4 border-green-500' :
                ''
              }`}
            >
              <div className="activity-header flex items-start space-x-4">
                <div className="activity-icon flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <p className="text-gray-600 mt-1">{activity.description}</p>
                      
                      {/* Related content */}
                      {activity.relatedTitle && (
                        <div className="related-content mt-2 p-2 bg-gray-50 rounded-md">
                          <span className="text-sm text-gray-700">
                            Related: <span className="font-medium">"{activity.relatedTitle}"</span>
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Time display with mental health context */}
                    <div className="activity-time text-sm text-gray-500 ml-4">
                      {activity.isCrisisRelated ? 
                        formatCrisisSafeTime(activity.timestamp, activity.metadata?.crisisLevel || 'low') :
                        activity.type === 'therapy_session' ?
                          formatTherapySessionTime(activity.timestamp, activity.metadata?.duration) :
                          formatTimeAgoWithContext(
                            activity.timestamp, 
                            activity.type === 'mood_logged' ? 'mood' : 
                            activity.type === 'journal_entry' ? 'journal' : 
                            'general'
                          )
                      }
                    </div>
                  </div>

                  {/* Enhanced metadata display */}
                  {activity.metadata && (
                    <div className="activity-metadata mt-3 flex flex-wrap items-center gap-3">
                      {/* Mood indicators */}
                      {activity.metadata.moodScore !== undefined && (
                        <span className="meta-item flex items-center space-x-1 text-sm">
                          <SmileIcon />
                          <span>Mood: {activity.metadata.moodScore}/10</span>
                        </span>
                      )}
                      
                      {/* Therapy type */}
                      {activity.metadata.therapyType && (
                        <span className="meta-item text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          {activity.metadata.therapyType}
                        </span>
                      )}
                      
                      {/* Duration */}
                      {activity.metadata.duration !== undefined && (
                        <span className="meta-item text-sm text-gray-600">
                          <ClockIcon className="inline w-4 h-4 mr-1" />
                          {activity.metadata.duration} min
                        </span>
                      )}
                      
                      {/* Wellness area */}
                      {activity.metadata.wellnessArea && (
                        <span className="meta-category text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {activity.metadata.wellnessArea}
                        </span>
                      )}
                      
                      {/* Coping strategy */}
                      {activity.metadata.copingStrategy && (
                        <span className="meta-item text-sm px-2 py-1 bg-green-100 text-green-700 rounded">
                          {activity.metadata.copingStrategy}
                        </span>
                      )}
                      
                      {/* Crisis level indicator */}
                      {activity.metadata.crisisLevel && (
                        <span className={`meta-crisis text-sm px-2 py-1 rounded ${
                          activity.metadata.crisisLevel === 'severe' ? 'bg-red-100 text-red-700' :
                          activity.metadata.crisisLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                          activity.metadata.crisisLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Crisis: {activity.metadata.crisisLevel}
                        </span>
                      )}
                      
                      {/* Achievement badge */}
                      {activity.metadata.achievement && (
                        <span className="meta-achievement flex items-center space-x-1 text-sm font-medium text-amber-600">
                          <AwardIcon />
                          <span>{activity.metadata.achievement}</span>
                        </span>
                      )}
                      
                      {/* Social metrics */}
                      {activity.metadata.likes !== undefined && (
                        <span className="meta-item flex items-center space-x-1 text-sm text-gray-600">
                          <HeartIcon />
                          <span>{activity.metadata.likes}</span>
                        </span>
                      )}
                      {activity.metadata.comments !== undefined && (
                        <span className="meta-item flex items-center space-x-1 text-sm text-gray-600">
                          <CommentIcon />
                          <span>{activity.metadata.comments}</span>
                        </span>
                      )}
                      {activity.metadata.views !== undefined && (
                        <span className="meta-item flex items-center space-x-1 text-sm text-gray-600">
                          <EyeIcon />
                          <span>{activity.metadata.views}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Therapeutic value indicator */}
                  {activity.therapeuticValue !== undefined && (
                    <div className="therapeutic-value mt-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Therapeutic Value:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                          <div 
                            className={`h-2 rounded-full ${
                              activity.therapeuticValue >= 80 ? 'bg-green-500' :
                              activity.therapeuticValue >= 60 ? 'bg-blue-500' :
                              activity.therapeuticValue >= 40 ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${activity.therapeuticValue}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{activity.therapeuticValue}%</span>
                      </div>
                    </div>
                  )}

                  {/* Privacy indicator */}
                  {activity.privacyLevel && activity.privacyLevel !== 'public' && (
                    <div className="privacy-indicator mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        activity.privacyLevel === 'therapist_only' ? 'bg-red-100 text-red-700' :
                        activity.privacyLevel === 'private' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        <ShieldIcon className="inline w-3 h-3 mr-1" />
                        {activity.privacyLevel === 'therapist_only' ? 'Therapist Only' :
                         activity.privacyLevel === 'private' ? 'Private' :
                         'Friends Only'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Activity actions */}
                {activity.relatedId && (
                  <div className="activity-actions flex-shrink-0">
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleViewRelated(activity.id, activity.relatedId)}
                    >
                      View Details
                    </AppButton>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Activity summary footer */}
      {filteredActivities.length > 0 && (
        <div className="activity-summary text-center py-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredActivities.length}</span> activities
          </p>
          {filters.showTherapeuticOnly && (
            <p className="text-sm text-primary-600 mt-1">
              Filtered to show therapeutic activities only
            </p>
          )}
          {filters.showCrisisRelated && (
            <p className="text-sm text-red-600 mt-1">
              Showing crisis-related activities
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MyActivityView;