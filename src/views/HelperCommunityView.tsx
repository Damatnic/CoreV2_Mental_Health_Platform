import * as React from 'react';
const { useState, useEffect, useCallback, useMemo } = React;
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth, MentalHealthUser } from '../contexts/AuthContext';
import { useNotification, NotificationSeverity } from '../contexts/NotificationContext';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { 
  StarIcon, 
  MessageIcon, 
  UserGroupIcon, 
  TrendingUpIcon, 
  BookIcon, 
  CalendarIcon,
  SearchIcon,
  FilterIcon,
  VideoIcon,
  AwardIcon,
  ShieldCheckIcon,
  GlobalIcon,
  ClockIcon,
  HeartIcon,
  ChatBubbleIcon,
  ShareIcon,
  PinIcon,
  AccessibilityIcon
} from '../components/icons.dynamic';

interface MentalHealthHelper {
  id: string;
  name: string;
  displayName: string;
  bio: string;
  detailedBio?: string;
  specializations: MentalHealthSpecialization[];
  rating: number;
  totalReviews: number;
  totalSessions: number;
  successfulInterventions: number;
  isOnline: boolean;
  responseTime: string;
  averageResponseTime: number;
  languages: string[];
  joinedDate: Date;
  lastActive: Date;
  isVerified: boolean;
  verificationLevel: 'basic' | 'professional' | 'expert' | 'crisis-specialist';
  avatar?: string;
  credentials: string[];
  education: string[];
  certifications: string[];
  yearsOfExperience: number;
  ageGroups: ('children' | 'teens' | 'adults' | 'seniors')[];
  supportMethods: ('text-chat' | 'video-call' | 'voice-call' | 'email')[];
  availability: HelperAvailability;
  culturalCompetencies: string[];
  accessibilityFeatures: string[];
  crisisInterventionTrained: boolean;
  traumaInformedCare: boolean;
  lgbtqFriendly: boolean;
  religiousAccommodation: boolean;
  anonymousSupport: boolean;
  peerSpecialist: boolean;
  livesExperience: string[];
  supportStyle: 'directive' | 'non-directive' | 'collaborative' | 'strengths-based';
  boundaries: {
    topics: string[];
    timeZones: string[];
    maximumSessionLength: number;
    emergencySupport: boolean;
  };
  reviews: HelperReview[];
  badges: HelperBadge[];
  communityContributions: number;
  mentorshipOffered: boolean;
  supervisionRequired: boolean;
}

interface MentalHealthSpecialization {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  certifiedBy?: string;
  yearsOfExperience: number;
  successRate?: number;
}

interface HelperAvailability {
  timezone: string;
  schedule: {
    [day: string]: {
      start: string;
      end: string;
      available: boolean;
    };
  };
  emergencyAvailable: boolean;
  currentCapacity: number;
  maxCapacity: number;
}

interface HelperReview {
  id: string;
  rating: number;
  comment: string;
  date: Date;
  anonymous: boolean;
  helpfulVotes: number;
}

interface HelperBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: Date;
  category: 'achievement' | 'certification' | 'community' | 'crisis';
}

interface MentalHealthCommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'helper' | 'peer-specialist' | 'therapist' | 'admin' | 'moderator';
  title: string;
  content: string;
  summary?: string;
  category: 'discussion' | 'resource' | 'success-story' | 'question' | 'announcement' | 'crisis-alert' | 'training' | 'research';
  timestamp: Date;
  lastUpdated?: Date;
  likes: number;
  comments: CommentThread[];
  isLiked: boolean;
  isPinned: boolean;
  isModerated: boolean;
  moderatorApproved: boolean;
  tags: string[];
  attachments: PostAttachment[];
  accessibilityFeatures: {
    screenReaderOptimized: boolean;
    hasAltText: boolean;
    hasTranscript: boolean;
    highContrastAvailable: boolean;
  };
  translations: {
    [languageCode: string]: {
      title: string;
      content: string;
      tags: string[];
    };
  };
  engagementMetrics: {
    views: number;
    shares: number;
    bookmarks: number;
    reportCount: number;
  };
  therapeuticValue: {
    helpfulnessRating: number;
    evidenceBased: boolean;
    clinicallyReviewed: boolean;
    triggerWarnings: string[];
  };
  communityGuidelines: {
    followsGuidelines: boolean;
    moderatorNotes?: string;
    contentWarnings: string[];
  };
}

interface CommentThread {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: CommentThread[];
  isHelpful: boolean;
  isProfessionalResponse: boolean;
}

interface PostAttachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'link';
  url: string;
  title: string;
  description?: string;
  accessibilityDescription?: string;
}

interface MentalHealthCommunityEvent {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  type: 'workshop' | 'training' | 'support-group' | 'webinar' | 'social' | 'crisis-training' | 'peer-supervision' | 'certification';
  subType?: string;
  date: Date;
  endDate?: Date;
  duration: number;
  timezone: string;
  maxParticipants?: number;
  currentParticipants: number;
  waitlistCount: number;
  isRegistered: boolean;
  registrationStatus: 'open' | 'closed' | 'waitlist' | 'full';
  facilitators: EventFacilitator[];
  location: EventLocation;
  cost: {
    amount: number;
    currency: string;
    scholarshipAvailable: boolean;
    slidingScale: boolean;
  };
  prerequisites: string[];
  learningObjectives: string[];
  targetAudience: string[];
  continuingEducationCredits: number;
  certificationOffered?: string;
  accessibilityFeatures: {
    closedCaptions: boolean;
    signLanguageInterpreter: boolean;
    wheelchairAccessible: boolean;
    screenReaderCompatible: boolean;
    cognitiveAccessibility: boolean;
  };
  languageSupport: string[];
  recordingAvailable: boolean;
  materials: EventMaterial[];
  feedback: EventFeedback[];
  tags: string[];
  relatedEvents: string[];
  followUpEvents: string[];
  communityImpact: {
    helpersServed: number;
    skillsImproved: string[];
    satisfactionRating: number;
  };
}

interface EventFacilitator {
  id: string;
  name: string;
  title: string;
  bio: string;
  credentials: string[];
  specializations: string[];
}

interface EventLocation {
  type: 'online' | 'in-person' | 'hybrid';
  platform?: string;
  meetingLink?: string;
  address?: string;
  accessibilityInfo?: string;
}

interface EventMaterial {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'toolkit' | 'assessment';
  url: string;
  accessibilityVersion?: string;
}

interface EventFeedback {
  id: string;
  rating: number;
  comment: string;
  anonymous: boolean;
  date: Date;
}

interface MentalHealthCommunityStats {
  helpers: {
    total: number;
    online: number;
    verified: number;
    crisisTrained: number;
    peerSpecialists: number;
    professionalHelpers: number;
    newThisMonth: number;
    activeThisWeek: number;
  };
  sessions: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    averageLength: number;
    successfulInterventions: number;
    crisisInterventions: number;
  };
  community: {
    totalPosts: number;
    activeDiscussions: number;
    resourcesShared: number;
    successStoriesShared: number;
    questionsAnswered: number;
    moderatedContent: number;
  };
  engagement: {
    averageRating: number;
    satisfactionScore: number;
    returnUserRate: number;
    communityParticipation: number;
    peerSupportConnections: number;
  };
  diversity: {
    languagesSupported: number;
    culturalCompetencies: number;
    accessibilityFeatures: number;
    ageGroupsCovered: number;
    specializationsCovered: number;
  };
  training: {
    eventsThisMonth: number;
    totalAttendees: number;
    certificationCompletions: number;
    continuingEducationHours: number;
  };
  impact: {
    livesImpacted: number;
    crisisInterventionsSuccessful: number;
    supportGroupsFormed: number;
    mentorshipPairsActive: number;
  };
}

interface HelperCommunityViewProps {
  initialTab?: 'helpers' | 'discussions' | 'events' | 'resources' | 'mentorship' | 'crisis-support';
  helperFilter?: {
    specialization?: string;
    onlineOnly?: boolean;
    crisisTrainedOnly?: boolean;
    peerSpecialistOnly?: boolean;
  };
  accessibilityMode?: boolean;
  culturalAdaptation?: string;
  therapeuticContext?: boolean;
}

const MentalHealthHelperCommunityView: React.FC<HelperCommunityViewProps> = ({
  initialTab = 'helpers',
  helperFilter = {},
  accessibilityMode = false,
  culturalAdaptation,
  therapeuticContext = true
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [helpers, setHelpers] = useState<MentalHealthHelper[]>([]);
  const [posts, setPosts] = useState<MentalHealthCommunityPost[]>([]);
  const [events, setEvents] = useState<MentalHealthCommunityEvent[]>([]);
  const [stats, setStats] = useState<MentalHealthCommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'helpers' | 'discussions' | 'events' | 'resources' | 'mentorship' | 'crisis-support'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState(helperFilter.specialization || 'all');
  const [showOnlineOnly, setShowOnlineOnly] = useState(helperFilter.onlineOnly || false);
  const [showCrisisTrainedOnly, setShowCrisisTrainedOnly] = useState(helperFilter.crisisTrainedOnly || false);
  const [showPeerSpecialistOnly, setShowPeerSpecialistOnly] = useState(helperFilter.peerSpecialistOnly || false);
  const [postFilter, setPostFilter] = useState<'all' | 'discussion' | 'resource' | 'question' | 'crisis-alert' | 'success-story'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'recent' | 'availability'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detailed'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [accessibilityFilter, setAccessibilityFilter] = useState('all');

  useEffect(() => {
    loadCommunityData();
    loadCommunityStats();
  }, []);

  useEffect(() => {
    if (therapeuticContext && user?.crisisMode) {
      setActiveTab('crisis-support');
      setShowCrisisTrainedOnly(true);
    }
  }, [therapeuticContext, user?.crisisMode]);

  const loadCommunityData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock comprehensive mental health helpers data
      const mockHelpers: MentalHealthHelper[] = [
        {
          id: '1',
          name: 'Sarah Thompson',
          displayName: 'Dr. Sarah T.',
          bio: 'Licensed clinical mental health counselor specializing in anxiety, depression, and trauma-informed care.',
          detailedBio: 'Dr. Sarah Thompson brings over 8 years of dedicated experience in clinical mental health counseling, with specialized training in cognitive-behavioral therapy, mindfulness-based interventions, and crisis intervention. She has worked extensively with diverse populations and maintains cultural competency certifications.',
          specializations: [
            { name: 'Anxiety Disorders', level: 'expert', certifiedBy: 'ADAA', yearsOfExperience: 8, successRate: 92 },
            { name: 'Depression', level: 'expert', certifiedBy: 'APA', yearsOfExperience: 8, successRate: 89 },
            { name: 'Trauma-Informed Care', level: 'advanced', certifiedBy: 'NCTSN', yearsOfExperience: 5, successRate: 85 },
            { name: 'Crisis Intervention', level: 'expert', certifiedBy: 'NSPL', yearsOfExperience: 6, successRate: 96 }
          ],
          rating: 4.9,
          totalReviews: 127,
          totalSessions: 234,
          successfulInterventions: 89,
          isOnline: true,
          responseTime: 'Within 1 hour',
          averageResponseTime: 45,
          languages: ['English', 'Spanish', 'Portuguese'],
          joinedDate: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000),
          lastActive: new Date(Date.now() - 15 * 60 * 1000),
          isVerified: true,
          verificationLevel: 'expert',
          credentials: ['LMHC', 'PhD', 'EMDR-Certified'],
          education: ['PhD Clinical Psychology - University of California', 'MA Counseling Psychology - Boston University'],
          certifications: ['Crisis Intervention Specialist', 'Trauma-Informed Care', 'Cultural Competency'],
          yearsOfExperience: 8,
          ageGroups: ['teens', 'adults'],
          supportMethods: ['text-chat', 'video-call', 'voice-call'],
          availability: {
            timezone: 'EST',
            schedule: {
              monday: { start: '09:00', end: '17:00', available: true },
              tuesday: { start: '09:00', end: '17:00', available: true },
              wednesday: { start: '09:00', end: '17:00', available: true },
              thursday: { start: '09:00', end: '17:00', available: true },
              friday: { start: '09:00', end: '15:00', available: true },
              saturday: { start: '10:00', end: '14:00', available: false },
              sunday: { start: '00:00', end: '00:00', available: false }
            },
            emergencyAvailable: true,
            currentCapacity: 12,
            maxCapacity: 20
          },
          culturalCompetencies: ['Latino/Hispanic', 'LGBTQ+', 'Military/Veterans'],
          accessibilityFeatures: ['Screen Reader Compatible', 'High Contrast Mode', 'Closed Captions'],
          crisisInterventionTrained: true,
          traumaInformedCare: true,
          lgbtqFriendly: true,
          religiousAccommodation: true,
          anonymousSupport: true,
          peerSpecialist: false,
          livesExperience: ['Anxiety Recovery', 'Cultural Transition'],
          supportStyle: 'collaborative',
          boundaries: {
            topics: ['Substance Abuse (Referral Only)', 'Eating Disorders (Consultation)'],
            timeZones: ['EST', 'CST'],
            maximumSessionLength: 90,
            emergencySupport: true
          },
          reviews: [],
          badges: [
            { id: 'crisis-hero', name: 'Crisis Hero', description: 'Successful crisis interventions', icon: '🏆', earnedDate: new Date(), category: 'crisis' },
            { id: 'community-leader', name: 'Community Leader', description: 'Active community participation', icon: '👑', earnedDate: new Date(), category: 'community' }
          ],
          communityContributions: 45,
          mentorshipOffered: true,
          supervisionRequired: false
        },
        {
          id: '2',
          name: 'Michael Chen',
          displayName: 'Michael C. (Peer Specialist)',
          bio: 'Certified peer support specialist with lived experience in addiction recovery and PTSD management.',
          detailedBio: 'Michael Chen is a certified peer support specialist who brings unique insight from his personal journey through addiction recovery and PTSD healing. With 6 years in recovery and 4 years of formal peer support experience, he specializes in helping others navigate early recovery, trauma processing, and building sustainable mental wellness practices.',
          specializations: [
            { name: 'Addiction Recovery', level: 'expert', certifiedBy: 'NAADAC', yearsOfExperience: 4, successRate: 87 },
            { name: 'PTSD Support', level: 'advanced', certifiedBy: 'NCPTSD', yearsOfExperience: 3, successRate: 84 },
            { name: 'Peer Mentorship', level: 'expert', certifiedBy: 'CPSS', yearsOfExperience: 4, successRate: 91 },
            { name: 'Dual Diagnosis Support', level: 'intermediate', yearsOfExperience: 2, successRate: 78 }
          ],
          rating: 4.8,
          totalReviews: 89,
          totalSessions: 156,
          successfulInterventions: 67,
          isOnline: false,
          responseTime: 'Within 2 hours',
          averageResponseTime: 90,
          languages: ['English', 'Mandarin', 'Cantonese'],
          joinedDate: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000),
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isVerified: true,
          verificationLevel: 'professional',
          credentials: ['CPSS', 'CPS', 'MHFA'],
          education: ['Certificate in Peer Support - Recovery University', 'BA Psychology - State University'],
          certifications: ['Certified Peer Support Specialist', 'Mental Health First Aid', 'Trauma-Informed Peer Support'],
          yearsOfExperience: 4,
          ageGroups: ['teens', 'adults'],
          supportMethods: ['text-chat', 'voice-call', 'email'],
          availability: {
            timezone: 'PST',
            schedule: {
              monday: { start: '10:00', end: '18:00', available: true },
              tuesday: { start: '10:00', end: '18:00', available: true },
              wednesday: { start: '10:00', end: '18:00', available: true },
              thursday: { start: '10:00', end: '18:00', available: true },
              friday: { start: '10:00', end: '16:00', available: true },
              saturday: { start: '12:00', end: '16:00', available: true },
              sunday: { start: '00:00', end: '00:00', available: false }
            },
            emergencyAvailable: false,
            currentCapacity: 8,
            maxCapacity: 15
          },
          culturalCompetencies: ['Asian-American', 'Immigration Experience', 'Dual Diagnosis'],
          accessibilityFeatures: ['Multi-language Support', 'Cultural Bridge'],
          crisisInterventionTrained: true,
          traumaInformedCare: true,
          lgbtqFriendly: true,
          religiousAccommodation: false,
          anonymousSupport: true,
          peerSpecialist: true,
          livesExperience: ['Addiction Recovery (6 years)', 'PTSD Management', 'Cultural Identity Struggles'],
          supportStyle: 'strengths-based',
          boundaries: {
            topics: ['Active Substance Use (Referral to Treatment)', 'Suicidal Ideation (Crisis Team)'],
            timeZones: ['PST', 'MST'],
            maximumSessionLength: 60,
            emergencySupport: false
          },
          reviews: [],
          badges: [
            { id: 'peer-champion', name: 'Peer Champion', description: 'Outstanding peer support', icon: '🤝', earnedDate: new Date(), category: 'achievement' },
            { id: 'recovery-mentor', name: 'Recovery Mentor', description: 'Addiction recovery mentorship', icon: '🌟', earnedDate: new Date(), category: 'certification' }
          ],
          communityContributions: 32,
          mentorshipOffered: true,
          supervisionRequired: true
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          displayName: 'Emily R. (Youth Specialist)',
          bio: 'Licensed family therapist specializing in adolescent mental health, eating disorders, and family systems.',
          detailedBio: 'Emily Rodriguez is a licensed marriage and family therapist with specialized training in adolescent development and family systems. She combines evidence-based therapeutic approaches with culturally responsive practices, serving primarily Latino/Hispanic families and LGBTQ+ youth. Her approach emphasizes family involvement while respecting individual autonomy.',
          specializations: [
            { name: 'Adolescent Mental Health', level: 'expert', certifiedBy: 'AACAP', yearsOfExperience: 6, successRate: 88 },
            { name: 'Family Systems Therapy', level: 'advanced', certifiedBy: 'AAMFT', yearsOfExperience: 5, successRate: 85 },
            { name: 'Eating Disorders', level: 'intermediate', certifiedBy: 'NEDA', yearsOfExperience: 3, successRate: 79 },
            { name: 'LGBTQ+ Youth Support', level: 'advanced', certifiedBy: 'WPATH', yearsOfExperience: 4, successRate: 92 }
          ],
          rating: 4.7,
          totalReviews: 64,
          totalSessions: 98,
          successfulInterventions: 43,
          isOnline: true,
          responseTime: 'Within 30 minutes',
          averageResponseTime: 25,
          languages: ['English', 'Spanish', 'Portuguese'],
          joinedDate: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000),
          lastActive: new Date(Date.now() - 5 * 60 * 1000),
          isVerified: true,
          verificationLevel: 'professional',
          credentials: ['LMFT', 'MA', 'LPCC'],
          education: ['MA Marriage and Family Therapy - Alliant International', 'BA Psychology - UCLA'],
          certifications: ['Adolescent Therapy Specialist', 'Family Systems Certification', 'LGBTQ+ Affirmative Therapy'],
          yearsOfExperience: 6,
          ageGroups: ['children', 'teens'],
          supportMethods: ['video-call', 'text-chat'],
          availability: {
            timezone: 'PST',
            schedule: {
              monday: { start: '14:00', end: '20:00', available: true },
              tuesday: { start: '14:00', end: '20:00', available: true },
              wednesday: { start: '14:00', end: '20:00', available: true },
              thursday: { start: '14:00', end: '20:00', available: true },
              friday: { start: '16:00', end: '19:00', available: true },
              saturday: { start: '09:00', end: '13:00', available: true },
              sunday: { start: '00:00', end: '00:00', available: false }
            },
            emergencyAvailable: true,
            currentCapacity: 6,
            maxCapacity: 12
          },
          culturalCompetencies: ['Latino/Hispanic', 'LGBTQ+', 'Bilingual Families', 'First-Generation College'],
          accessibilityFeatures: ['Youth-Friendly Interface', 'Parent Portal', 'Crisis Alert System'],
          crisisInterventionTrained: true,
          traumaInformedCare: true,
          lgbtqFriendly: true,
          religiousAccommodation: true,
          anonymousSupport: true,
          peerSpecialist: false,
          livesExperience: ['First-Generation Professional', 'Bilingual Household'],
          supportStyle: 'collaborative',
          boundaries: {
            topics: ['Severe Eating Disorders (Medical Team Required)', 'Substance Abuse (Parent Involvement)'],
            timeZones: ['PST'],
            maximumSessionLength: 75,
            emergencySupport: true
          },
          reviews: [],
          badges: [
            { id: 'youth-advocate', name: 'Youth Advocate', description: 'Dedicated youth mental health support', icon: '🌱', earnedDate: new Date(), category: 'achievement' },
            { id: 'family-connector', name: 'Family Connector', description: 'Successful family therapy outcomes', icon: '👨‍👩‍👧‍👦', earnedDate: new Date(), category: 'achievement' }
          ],
          communityContributions: 18,
          mentorshipOffered: false,
          supervisionRequired: false
        }
      ];

      // Mock comprehensive community posts data
      const mockPosts: MentalHealthCommunityPost[] = [
        {
          id: '1',
          authorId: '1',
          authorName: 'Dr. Sarah Thompson',
          authorRole: 'therapist',
          title: 'Evidence-Based Techniques for Managing Panic Attacks: A Clinical Guide',
          content: 'I wanted to share some evidence-based breathing techniques and grounding methods that have shown remarkable success with my clients. These techniques combine cognitive-behavioral principles with mindfulness practices and have been clinically validated...',
          summary: 'Clinical guide to panic attack management using CBT and mindfulness techniques',
          category: 'resource',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
          likes: 23,
          comments: [],
          isLiked: false,
          isPinned: true,
          isModerated: true,
          moderatorApproved: true,
          tags: ['anxiety', 'panic-attacks', 'cbt', 'mindfulness', 'breathing-techniques', 'evidence-based'],
          attachments: [
            {
              id: 'guide-1',
              type: 'document',
              url: '/resources/panic-attack-guide.pdf',
              title: 'Panic Attack Management Guide',
              description: 'Comprehensive guide with techniques and worksheets',
              accessibilityDescription: 'PDF guide with screen reader compatible text and alt descriptions'
            }
          ],
          accessibilityFeatures: {
            screenReaderOptimized: true,
            hasAltText: true,
            hasTranscript: false,
            highContrastAvailable: true
          },
          translations: {
            'es': {
              title: 'Técnicas Basadas en Evidencia para Manejar Ataques de Pánico',
              content: 'Quería compartir algunas técnicas de respiración basadas en evidencia...',
              tags: ['ansiedad', 'ataques-de-panico', 'tcc', 'mindfulness']
            }
          },
          engagementMetrics: {
            views: 456,
            shares: 12,
            bookmarks: 34,
            reportCount: 0
          },
          therapeuticValue: {
            helpfulnessRating: 4.8,
            evidenceBased: true,
            clinicallyReviewed: true,
            triggerWarnings: ['panic symptoms discussion']
          },
          communityGuidelines: {
            followsGuidelines: true,
            contentWarnings: ['clinical content', 'symptom descriptions']
          }
        },
        {
          id: '2',
          authorId: '2',
          authorName: 'Michael Chen',
          authorRole: 'peer-specialist',
          title: 'Peer Support Question: Building Trust with Resistant Clients',
          content: 'Fellow peer specialists and helpers - I\'ve been working with someone who seems resistant to opening up during our sessions. They show up consistently but remain guarded. I\'m wondering if anyone has experience with trauma-informed approaches that might help build trust without pushing boundaries. My lived experience tells me there might be trust issues from previous negative experiences with mental health services...',
          summary: 'Seeking advice on building trust with resistant clients using trauma-informed approaches',
          category: 'question',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          likes: 15,
          comments: [],
          isLiked: true,
          isPinned: false,
          isModerated: true,
          moderatorApproved: true,
          tags: ['peer-support', 'trust-building', 'trauma-informed', 'client-engagement', 'resistance'],
          attachments: [],
          accessibilityFeatures: {
            screenReaderOptimized: true,
            hasAltText: false,
            hasTranscript: false,
            highContrastAvailable: true
          },
          translations: {},
          engagementMetrics: {
            views: 234,
            shares: 8,
            bookmarks: 19,
            reportCount: 0
          },
          therapeuticValue: {
            helpfulnessRating: 4.2,
            evidenceBased: false,
            clinicallyReviewed: false,
            triggerWarnings: ['trust issues', 'therapy resistance']
          },
          communityGuidelines: {
            followsGuidelines: true,
            contentWarnings: []
          }
        },
        {
          id: '3',
          authorId: '3',
          authorName: 'Emily Rodriguez',
          authorRole: 'helper',
          title: 'Success Story: 16-Year-Old Overcomes Social Anxiety and Finds Their Voice',
          content: 'I wanted to share an incredibly heartwarming success story (with permission and anonymized details). A 16-year-old I\'ve been working with came to me 6 months ago experiencing severe social anxiety that prevented them from participating in school, making friends, or even ordering food at restaurants. Through consistent family therapy sessions, gradual exposure therapy, and building on their strengths in art and creative expression, they have made remarkable progress. This week, they gave a presentation to their class and even joined the school\'s art club. What moved me most was when they said, "I finally feel like I can be myself." This reminds me why we do this work - every small step forward is a victory worth celebrating.',
          summary: 'Teen overcomes social anxiety through family therapy and strengths-based approach',
          category: 'success-story',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          likes: 45,
          comments: [],
          isLiked: false,
          isPinned: false,
          isModerated: true,
          moderatorApproved: true,
          tags: ['success-story', 'teens', 'social-anxiety', 'family-therapy', 'strengths-based', 'school-engagement'],
          attachments: [],
          accessibilityFeatures: {
            screenReaderOptimized: true,
            hasAltText: false,
            hasTranscript: false,
            highContrastAvailable: true
          },
          translations: {
            'es': {
              title: 'Historia de Éxito: Adolescente Supera la Ansiedad Social',
              content: 'Quería compartir una historia muy emotiva...',
              tags: ['historia-de-exito', 'adolescentes', 'ansiedad-social']
            }
          },
          engagementMetrics: {
            views: 678,
            shares: 23,
            bookmarks: 56,
            reportCount: 0
          },
          therapeuticValue: {
            helpfulnessRating: 4.9,
            evidenceBased: true,
            clinicallyReviewed: false,
            triggerWarnings: ['social anxiety discussion']
          },
          communityGuidelines: {
            followsGuidelines: true,
            contentWarnings: ['success story', 'teen mental health']
          }
        }
      ];

      // Mock comprehensive community events data
      const mockEvents: MentalHealthCommunityEvent[] = [
        {
          id: '1',
          title: 'Advanced Crisis Intervention and De-escalation Workshop',
          description: 'Learn evidence-based techniques for handling crisis situations safely and effectively, with emphasis on trauma-informed approaches and cultural sensitivity.',
          detailedDescription: 'This comprehensive workshop covers advanced crisis intervention techniques including risk assessment, de-escalation strategies, safety planning, and post-crisis follow-up. Participants will learn through interactive scenarios, role-playing, and case studies. The workshop emphasizes trauma-informed care, cultural competency, and ethical considerations in crisis intervention.',
          type: 'crisis-training',
          subType: 'certification-track',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          duration: 240,
          timezone: 'EST',
          maxParticipants: 25,
          currentParticipants: 18,
          waitlistCount: 3,
          isRegistered: false,
          registrationStatus: 'open',
          facilitators: [
            {
              id: 'fac-1',
              name: 'Dr. Jennifer Walsh',
              title: 'Director of Crisis Services',
              bio: 'Dr. Walsh has 15 years of experience in crisis intervention and suicide prevention.',
              credentials: ['PhD Clinical Psychology', 'Licensed Psychologist', 'AASUICIDOLOGY Fellow'],
              specializations: ['Crisis Intervention', 'Suicide Prevention', 'Trauma Response']
            }
          ],
          location: {
            type: 'online',
            platform: 'Secure Video Platform',
            meetingLink: 'https://secure-meet.example.com/crisis-workshop'
          },
          cost: {
            amount: 75,
            currency: 'USD',
            scholarshipAvailable: true,
            slidingScale: true
          },
          prerequisites: ['Basic Mental Health Training', 'CPR Certification (Recommended)'],
          learningObjectives: [
            'Conduct comprehensive risk assessments',
            'Apply de-escalation techniques effectively',
            'Develop safety plans with clients',
            'Navigate ethical considerations in crisis situations',
            'Implement culturally responsive crisis intervention'
          ],
          targetAudience: ['Peer Support Specialists', 'Mental Health Counselors', 'Crisis Hotline Volunteers'],
          continuingEducationCredits: 4,
          certificationOffered: 'Crisis Intervention Specialist Level 2',
          accessibilityFeatures: {
            closedCaptions: true,
            signLanguageInterpreter: true,
            wheelchairAccessible: true,
            screenReaderCompatible: true,
            cognitiveAccessibility: true
          },
          languageSupport: ['English', 'Spanish', 'ASL'],
          recordingAvailable: true,
          materials: [
            {
              id: 'mat-1',
              title: 'Crisis Intervention Handbook',
              type: 'document',
              url: '/materials/crisis-handbook.pdf',
              accessibilityVersion: '/materials/crisis-handbook-accessible.pdf'
            },
            {
              id: 'mat-2',
              title: 'De-escalation Techniques Video Series',
              type: 'video',
              url: '/materials/deescalation-videos/',
              accessibilityVersion: '/materials/deescalation-videos-captioned/'
            }
          ],
          feedback: [],
          tags: ['crisis-intervention', 'de-escalation', 'trauma-informed', 'certification', 'advanced-training'],
          relatedEvents: ['crisis-follow-up-2', 'trauma-informed-basics-1'],
          followUpEvents: ['crisis-specialist-certification'],
          communityImpact: {
            helpersServed: 156,
            skillsImproved: ['Risk Assessment', 'De-escalation', 'Safety Planning'],
            satisfactionRating: 4.8
          }
        },
        {
          id: '2',
          title: 'Monthly Helper Support Circle: Peer Supervision and Self-Care',
          description: 'Connect with fellow helpers in a safe space to share experiences, receive peer supervision, and focus on self-care and burnout prevention.',
          detailedDescription: 'Our monthly support circle provides a confidential space for helpers to process challenging cases, celebrate successes, and receive peer supervision. This session focuses on preventing burnout, maintaining boundaries, and developing sustainable practices. We integrate mindfulness, peer consultation, and evidence-based self-care strategies.',
          type: 'peer-supervision',
          subType: 'recurring-monthly',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          duration: 90,
          timezone: 'EST',
          currentParticipants: 12,
          waitlistCount: 0,
          isRegistered: true,
          registrationStatus: 'open',
          facilitators: [
            {
              id: 'fac-2',
              name: 'Community Supervision Team',
              title: 'Peer Supervision Facilitators',
              bio: 'Experienced peer supervisors trained in group facilitation and helper support.',
              credentials: ['Licensed Clinical Supervisors', 'Peer Support Supervision Training'],
              specializations: ['Peer Supervision', 'Burnout Prevention', 'Ethical Consultation']
            }
          ],
          location: {
            type: 'online',
            platform: 'Secure Video Platform',
            meetingLink: 'https://secure-meet.example.com/support-circle'
          },
          cost: {
            amount: 0,
            currency: 'USD',
            scholarshipAvailable: false,
            slidingScale: false
          },
          prerequisites: ['Active Helper Status', 'Confidentiality Agreement'],
          learningObjectives: [
            'Process challenging cases with peer support',
            'Develop self-care strategies',
            'Maintain professional boundaries',
            'Prevent and address burnout',
            'Enhance helping skills through peer feedback'
          ],
          targetAudience: ['Active Helpers', 'Peer Support Specialists', 'Volunteer Counselors'],
          continuingEducationCredits: 1.5,
          accessibilityFeatures: {
            closedCaptions: true,
            signLanguageInterpreter: false,
            wheelchairAccessible: true,
            screenReaderCompatible: true,
            cognitiveAccessibility: true
          },
          languageSupport: ['English'],
          recordingAvailable: false,
          materials: [
            {
              id: 'mat-3',
              title: 'Self-Care Assessment Tool',
              type: 'assessment',
              url: '/materials/self-care-assessment.pdf'
            }
          ],
          feedback: [],
          tags: ['peer-supervision', 'self-care', 'burnout-prevention', 'support-group', 'monthly'],
          relatedEvents: ['burnout-prevention-workshop', 'boundaries-training'],
          followUpEvents: [],
          communityImpact: {
            helpersServed: 45,
            skillsImproved: ['Self-Care', 'Boundary Setting', 'Peer Consultation'],
            satisfactionRating: 4.9
          }
        },
        {
          id: '3',
          title: 'Trauma-Informed Care: From Theory to Practice in Peer Support',
          description: 'Comprehensive webinar on implementing trauma-informed approaches in peer support, including practical applications and case studies.',
          detailedDescription: 'This educational webinar explores the principles of trauma-informed care and their practical application in peer support settings. Participants will learn to recognize trauma responses, create safety, build trust, and adapt their approach based on trauma-informed principles. The session includes interactive case studies and Q&A with experienced practitioners.',
          type: 'webinar',
          subType: 'educational-series',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          duration: 90,
          timezone: 'EST',
          maxParticipants: 100,
          currentParticipants: 67,
          waitlistCount: 0,
          isRegistered: false,
          registrationStatus: 'open',
          facilitators: [
            {
              id: 'fac-3',
              name: 'Dr. Marcus Johnson',
              title: 'Trauma Specialist and Researcher',
              bio: 'Dr. Johnson is a leading expert in trauma-informed care with 20 years of clinical and research experience.',
              credentials: ['PhD Clinical Psychology', 'Trauma Specialist Certification', 'EMDR Therapist'],
              specializations: ['Trauma-Informed Care', 'Complex PTSD', 'Organizational Trauma-Informed Transformation']
            }
          ],
          location: {
            type: 'online',
            platform: 'Educational Webinar Platform',
            meetingLink: 'https://webinar.example.com/trauma-informed-care'
          },
          cost: {
            amount: 25,
            currency: 'USD',
            scholarshipAvailable: true,
            slidingScale: true
          },
          prerequisites: ['Basic Understanding of Mental Health Support'],
          learningObjectives: [
            'Understand the six principles of trauma-informed care',
            'Recognize trauma responses in peer support contexts',
            'Create physically and emotionally safe environments',
            'Build trust and transparency in helping relationships',
            'Adapt peer support approaches using trauma-informed principles'
          ],
          targetAudience: ['Peer Support Specialists', 'Helpers', 'Mental Health Advocates', 'Community Workers'],
          continuingEducationCredits: 2,
          accessibilityFeatures: {
            closedCaptions: true,
            signLanguageInterpreter: true,
            wheelchairAccessible: true,
            screenReaderCompatible: true,
            cognitiveAccessibility: true
          },
          languageSupport: ['English', 'Spanish'],
          recordingAvailable: true,
          materials: [
            {
              id: 'mat-4',
              title: 'Trauma-Informed Care Toolkit',
              type: 'toolkit',
              url: '/materials/tic-toolkit.zip'
            },
            {
              id: 'mat-5',
              title: 'Case Study Collection',
              type: 'document',
              url: '/materials/tic-case-studies.pdf'
            }
          ],
          feedback: [],
          tags: ['trauma-informed', 'peer-support', 'education', 'webinar', 'evidence-based'],
          relatedEvents: ['crisis-intervention-workshop', 'secondary-trauma-prevention'],
          followUpEvents: ['advanced-trauma-informed-practice'],
          communityImpact: {
            helpersServed: 234,
            skillsImproved: ['Trauma Recognition', 'Safety Creation', 'Trust Building'],
            satisfactionRating: 4.7
          }
        }
      ];

      setHelpers(mockHelpers);
      setPosts(mockPosts);
      setEvents(mockEvents);
      
    } catch (error) {
      console.error('Error loading community data:', error);
      setError('Failed to load community data. Please try again.');
      showNotification('Failed to load community data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCommunityStats = useCallback(async () => {
    try {
      // Mock comprehensive community stats
      const mockStats: MentalHealthCommunityStats = {
        helpers: {
          total: 156,
          online: 23,
          verified: 134,
          crisisTrained: 87,
          peerSpecialists: 45,
          professionalHelpers: 111,
          newThisMonth: 12,
          activeThisWeek: 78
        },
        sessions: {
          total: 2847,
          thisMonth: 234,
          thisWeek: 67,
          averageLength: 52,
          successfulInterventions: 2698,
          crisisInterventions: 89
        },
        community: {
          totalPosts: 89,
          activeDiscussions: 12,
          resourcesShared: 156,
          successStoriesShared: 34,
          questionsAnswered: 267,
          moderatedContent: 5
        },
        engagement: {
          averageRating: 4.7,
          satisfactionScore: 4.8,
          returnUserRate: 0.89,
          communityParticipation: 0.73,
          peerSupportConnections: 445
        },
        diversity: {
          languagesSupported: 12,
          culturalCompetencies: 15,
          accessibilityFeatures: 8,
          ageGroupsCovered: 4,
          specializationsCovered: 23
        },
        training: {
          eventsThisMonth: 8,
          totalAttendees: 234,
          certificationCompletions: 45,
          continuingEducationHours: 678
        },
        impact: {
          livesImpacted: 1245,
          crisisInterventionsSuccessful: 87,
          supportGroupsFormed: 23,
          mentorshipPairsActive: 67
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load community statistics.');
    }
  }, []);

  const handleConnectWithHelper = useCallback(async (helperId: string) => {
    const helper = helpers.find(h => h.id === helperId);
    if (helper) {
      try {
        // Log analytics for helper matching
        console.log('Helper connection initiated:', {
          helperId: helper.id,
          helperSpecializations: helper.specializations.map(s => s.name),
          userNeeds: user?.currentNeeds || [],
          crisisMode: user?.crisisMode || false
        });
        
        showNotification(`Connecting with ${helper.displayName}...`, 'info');
        
        // In a real implementation, this would:
        // 1. Check helper availability
        // 2. Initiate connection protocol
        // 3. Create chat session
        // 4. Navigate to appropriate interface
        
        // For crisis situations, prioritize immediate connection
        if (user?.crisisMode) {
          showNotification(`Priority crisis connection initiated with ${helper.displayName}`, 'success');
        }
        
      } catch (error) {
        console.error('Error connecting with helper:', error);
        showNotification('Failed to connect with helper. Please try again.', 'error');
      }
    }
  }, [helpers, user, showNotification]);

  const handleLikePost = useCallback(async (postId: string) => {
    try {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          const updatedPost = {
            ...post,
            isLiked: newIsLiked,
            likes: newIsLiked ? post.likes + 1 : post.likes - 1,
            engagementMetrics: {
              ...post.engagementMetrics,
              // Update engagement tracking
            }
          };
          return updatedPost;
        }
        return post;
      }));
      
      // In a real implementation, this would make an API call
      // await likePost(postId, !posts.find(p => p.id === postId)?.isLiked);
      
    } catch (error) {
      console.error('Error liking post:', error);
      showNotification('Failed to update post reaction', 'error');
      
      // Revert the optimistic update on error
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      }));
    }
  }, [showNotification]);

  const handleRegisterForEvent = useCallback(async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    try {
      const isRegistering = !event.isRegistered;
      
      // Check capacity before registering
      if (isRegistering && event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
        showNotification('Event is at full capacity. You have been added to the waitlist.', 'info');
        setEvents(prev => prev.map(e => 
          e.id === eventId 
            ? { ...e, waitlistCount: e.waitlistCount + 1 }
            : e
        ));
        return;
      }
      
      setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            isRegistered: isRegistering,
            currentParticipants: isRegistering 
              ? e.currentParticipants + 1 
              : e.currentParticipants - 1,
            waitlistCount: !isRegistering && e.waitlistCount > 0
              ? e.waitlistCount - 1
              : e.waitlistCount
          };
        }
        return e;
      }));
      
      const message = isRegistering 
        ? `Successfully registered for "${event.title}"!
${event.continuingEducationCredits > 0 ? `You will earn ${event.continuingEducationCredits} CE credits.` : ''}`
        : `Unregistered from "${event.title}"`;
        
      showNotification(message, 'success');
      
      // For crisis training events, provide additional information
      if (event.type === 'crisis-training' && isRegistering) {
        showNotification('Pre-event materials will be sent 48 hours before the workshop.', 'info');
      }
      
    } catch (error) {
      console.error('Error registering for event:', error);
      showNotification('Failed to update event registration. Please try again.', 'error');
    }
  }, [events, showNotification]);

  const filteredHelpers = useMemo(() => {
    return helpers.filter(helper => {
      // Online status filter
      if (showOnlineOnly && !helper.isOnline) return false;
      
      // Crisis-trained filter
      if (showCrisisTrainedOnly && !helper.crisisInterventionTrained) return false;
      
      // Peer specialist filter
      if (showPeerSpecialistOnly && !helper.peerSpecialist) return false;
      
      // Specialization filter
      if (selectedSpecialization !== 'all' && 
          !helper.specializations.some(spec => spec.name === selectedSpecialization)) {
        return false;
      }
      
      // Language filter
      if (selectedLanguage !== 'all' && !helper.languages.includes(selectedLanguage)) {
        return false;
      }
      
      // Age group filter
      if (selectedAgeGroup !== 'all' && !helper.ageGroups.includes(selectedAgeGroup as any)) {
        return false;
      }
      
      // Accessibility features filter
      if (accessibilityFilter !== 'all' && 
          !helper.accessibilityFeatures.some(feature => 
            feature.toLowerCase().includes(accessibilityFilter.toLowerCase()))) {
        return false;
      }
      
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          helper.name,
          helper.displayName,
          helper.bio,
          helper.detailedBio,
          ...helper.specializations.map(s => s.name),
          ...helper.languages,
          ...helper.culturalCompetencies,
          ...helper.livesExperience
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }
      
      return true;
    });
  }, [
    helpers, showOnlineOnly, showCrisisTrainedOnly, showPeerSpecialistOnly,
    selectedSpecialization, selectedLanguage, selectedAgeGroup,
    accessibilityFilter, searchQuery
  ]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Category filter
      if (postFilter !== 'all' && post.category !== postFilter) return false;
      
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          post.title,
          post.content,
          post.summary,
          post.authorName,
          ...post.tags,
          ...(post.attachments?.map(att => att.title) || [])
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }
      
      return true;
    });
  }, [posts, postFilter, searchQuery]);

  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => 
      React.createElement(StarIcon, {
        key: i,
        className: `star-icon ${i < Math.round(rating) ? 'text-yellow-400 filled' : 'text-gray-300 empty'}`,
        size: 'small',
        'aria-hidden': 'true'
      })
    );
  }, []);

  const getSpecializations = useMemo(() => {
    const allSpecs = helpers.flatMap(h => h.specializations.map(s => s.name));
    return Array.from(new Set(allSpecs)).sort();
  }, [helpers]);
  
  const getLanguages = useMemo(() => {
    const allLanguages = helpers.flatMap(h => h.languages);
    return Array.from(new Set(allLanguages)).sort();
  }, [helpers]);
  
  const sortedFilteredHelpers = useMemo(() => {
    return Array.from(filteredHelpers).sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.yearsOfExperience - a.yearsOfExperience;
        case 'recent':
          return b.lastActive.getTime() - a.lastActive.getTime();
        case 'availability':
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;
          return (a.availability.maxCapacity - a.availability.currentCapacity) - 
                 (b.availability.maxCapacity - b.availability.currentCapacity);
        default:
          return 0;
      }
    });
  }, [filteredHelpers, sortBy]);

  if (isLoading) {
    return React.createElement('div', {
      className: 'loading-container mental-health-loading',
      role: 'status',
      'aria-live': 'polite',
      'aria-label': 'Loading helper community data'
    },
      React.createElement('div', { className: 'spinner therapeutic-spinner' }),
      React.createElement('p', { className: 'loading-text' }, 'Loading helper community...'),
      React.createElement('p', { className: 'loading-subtext' }, 'Connecting you with mental health support resources')
    );
  }
  
  if (error) {
    return React.createElement('div', {
      className: 'error-container mental-health-error',
      role: 'alert',
      'aria-live': 'assertive'
    },
      React.createElement('div', { className: 'error-icon' }, '⚠️'),
      React.createElement('h2', null, 'Unable to Load Community'),
      React.createElement('p', null, error),
      React.createElement(AppButton, {
        variant: 'primary',
        onClick: () => {
          setError(null);
          loadCommunityData();
        }
      }, 'Try Again')
    );
  }

  return (
    <div 
      className={`mental-health-helper-community-view ${
        therapeuticContext ? 'therapeutic-context' : ''
      } ${
        accessibilityMode ? 'accessibility-enhanced' : ''
      } ${
        culturalAdaptation ? `cultural-${culturalAdaptation}` : ''
      } ${
        user?.crisisMode ? 'crisis-mode' : ''
      }`}
      role="main"
      aria-label="Mental Health Helper Community"
    >
      <ViewHeader
        title="Mental Health Helper Community"
        subtitle="Connect with trained helpers, share knowledge, and build supportive therapeutic relationships"
        accessibilityLabel="Community dashboard for mental health helpers and peer support specialists"
      />

      {/* Comprehensive Community Stats */}
      {stats && (
        <section 
          className="community-stats-section"
          aria-labelledby="community-stats-heading"
        >
          <h2 id="community-stats-heading" className="sr-only">
            Community Statistics and Impact Metrics
          </h2>
          <div className="stats-grid comprehensive-stats">
            <Card className="stat-card helpers-stat">
              <div className="stat-header">
                <UserGroupIcon className="stat-icon" />
                <span className="stat-category">Helpers</span>
              </div>
              <div className="stat-value">{stats.helpers.total}</div>
              <div className="stat-label">Total Helpers</div>
              <div className="stat-breakdown">
                <span className="breakdown-item online">
                  {stats.helpers.online} online
                </span>
                <span className="breakdown-item verified">
                  {stats.helpers.crisisTrained} crisis-trained
                </span>
              </div>
            </Card>
            
            <Card className="stat-card sessions-stat">
              <div className="stat-header">
                <MessageIcon className="stat-icon" />
                <span className="stat-category">Sessions</span>
              </div>
              <div className="stat-value">{stats.sessions.total.toLocaleString()}</div>
              <div className="stat-label">Total Sessions</div>
              <div className="stat-breakdown">
                <span className="breakdown-item successful">
                  {stats.sessions.successfulInterventions} successful
                </span>
                <span className="breakdown-item crisis">
                  {stats.sessions.crisisInterventions} crisis interventions
                </span>
              </div>
            </Card>
            
            <Card className="stat-card engagement-stat">
              <div className="stat-header">
                <StarIcon className="stat-icon" />
                <span className="stat-category">Quality</span>
              </div>
              <div className="stat-value">{stats.engagement.averageRating.toFixed(1)}</div>
              <div className="stat-label">Avg Rating</div>
              <div className="stat-breakdown">
                <span className="breakdown-item satisfaction">
                  {(stats.engagement.satisfactionScore * 100).toFixed(0)}% satisfaction
                </span>
                <span className="breakdown-item return">
                  {(stats.engagement.returnUserRate * 100).toFixed(0)}% return rate
                </span>
              </div>
            </Card>
            
            <Card className="stat-card impact-stat">
              <div className="stat-header">
                <HeartIcon className="stat-icon" />
                <span className="stat-category">Impact</span>
              </div>
              <div className="stat-value">{stats.impact.livesImpacted.toLocaleString()}</div>
              <div className="stat-label">Lives Impacted</div>
              <div className="stat-breakdown">
                <span className="breakdown-item groups">
                  {stats.impact.supportGroupsFormed} support groups
                </span>
                <span className="breakdown-item mentorship">
                  {stats.impact.mentorshipPairsActive} mentorship pairs
                </span>
              </div>
            </Card>
            
            <Card className="stat-card diversity-stat">
              <div className="stat-header">
                <GlobalIcon className="stat-icon" />
                <span className="stat-category">Diversity</span>
              </div>
              <div className="stat-value">{stats.diversity.languagesSupported}</div>
              <div className="stat-label">Languages</div>
              <div className="stat-breakdown">
                <span className="breakdown-item cultural">
                  {stats.diversity.culturalCompetencies} cultural competencies
                </span>
                <span className="breakdown-item accessibility">
                  {stats.diversity.accessibilityFeatures} accessibility features
                </span>
              </div>
            </Card>
            
            <Card className="stat-card training-stat">
              <div className="stat-header">
                <BookIcon className="stat-icon" />
                <span className="stat-category">Training</span>
              </div>
              <div className="stat-value">{stats.training.continuingEducationHours}</div>
              <div className="stat-label">CE Hours</div>
              <div className="stat-breakdown">
                <span className="breakdown-item events">
                  {stats.training.eventsThisMonth} events this month
                </span>
                <span className="breakdown-item certifications">
                  {stats.training.certificationCompletions} certifications
                </span>
              </div>
            </Card>
          </div>
          
          {user?.crisisMode && (
            <Card className="crisis-stat-card">
              <div className="crisis-stats-header">
                <ShieldCheckIcon className="crisis-icon" />
                <span className="crisis-title">Crisis Support Available</span>
              </div>
              <div className="crisis-stats">
                <span className="crisis-stat">
                  {stats.helpers.crisisTrained} crisis-trained helpers online
                </span>
                <span className="crisis-stat">
                  {stats.sessions.crisisInterventions} successful interventions this month
                </span>
                <span className="crisis-stat">
                  Average response time: &lt; 5 minutes
                </span>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* Enhanced Navigation Tabs */}
      <nav 
        className="tab-navigation mental-health-tabs"
        role="tablist"
        aria-label="Community sections navigation"
      >
        <button
          className={`tab helpers-tab ${activeTab === 'helpers' ? 'active' : ''}`}
          onClick={() => setActiveTab('helpers')}
          role="tab"
          aria-selected={activeTab === 'helpers'}
          aria-controls="helpers-panel"
          id="helpers-tab"
        >
          <UserGroupIcon className="tab-icon" aria-hidden="true" /> 
          <span className="tab-text">Helpers</span>
          <span className="tab-count" aria-label={`${stats?.helpers.total || 0} helpers available`}>
            {stats?.helpers.total || 0}
          </span>
        </button>
        
        <button
          className={`tab discussions-tab ${activeTab === 'discussions' ? 'active' : ''}`}
          onClick={() => setActiveTab('discussions')}
          role="tab"
          aria-selected={activeTab === 'discussions'}
          aria-controls="discussions-panel"
          id="discussions-tab"
        >
          <ChatBubbleIcon className="tab-icon" aria-hidden="true" /> 
          <span className="tab-text">Discussions</span>
          <span className="tab-count" aria-label={`${stats?.community.activeDiscussions || 0} active discussions`}>
            {stats?.community.activeDiscussions || 0}
          </span>
        </button>
        
        <button
          className={`tab events-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
          role="tab"
          aria-selected={activeTab === 'events'}
          aria-controls="events-panel"
          id="events-tab"
        >
          <CalendarIcon className="tab-icon" aria-hidden="true" /> 
          <span className="tab-text">Events</span>
          <span className="tab-count" aria-label={`${stats?.training.eventsThisMonth || 0} events this month`}>
            {stats?.training.eventsThisMonth || 0}
          </span>
        </button>
        
        <button
          className={`tab resources-tab ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
          role="tab"
          aria-selected={activeTab === 'resources'}
          aria-controls="resources-panel"
          id="resources-tab"
        >
          <BookIcon className="tab-icon" aria-hidden="true" /> 
          <span className="tab-text">Resources</span>
          <span className="tab-count" aria-label={`${stats?.community.resourcesShared || 0} resources shared`}>
            {stats?.community.resourcesShared || 0}
          </span>
        </button>
        
        <button
          className={`tab mentorship-tab ${activeTab === 'mentorship' ? 'active' : ''}`}
          onClick={() => setActiveTab('mentorship')}
          role="tab"
          aria-selected={activeTab === 'mentorship'}
          aria-controls="mentorship-panel"
          id="mentorship-tab"
        >
          <UserGroupIcon className="tab-icon" aria-hidden="true" /> 
          <span className="tab-text">Mentorship</span>
          <span className="tab-count" aria-label={`${stats?.impact.mentorshipPairsActive || 0} active mentorship pairs`}>
            {stats?.impact.mentorshipPairsActive || 0}
          </span>
        </button>
        
        {user?.crisisMode && (
          <button
            className={`tab crisis-support-tab ${activeTab === 'crisis-support' ? 'active' : ''} crisis-priority`}
            onClick={() => setActiveTab('crisis-support')}
            role="tab"
            aria-selected={activeTab === 'crisis-support'}
            aria-controls="crisis-support-panel"
            id="crisis-support-tab"
          >
            <ShieldCheckIcon className="tab-icon crisis-icon" aria-hidden="true" /> 
            <span className="tab-text">Crisis Support</span>
            <span className="tab-count crisis-count" aria-label={`${stats?.helpers.crisisTrained || 0} crisis specialists available`}>
              {stats?.helpers.crisisTrained || 0}
            </span>
          </button>
        )}
      </nav>

      {/* Search and Filters */}
      <Card className="filters-card">
        <div className="search-bar">
          <SearchIcon />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'helpers' && (
          <div className="helper-filters">
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
            >
              <option value="all">All Specializations</option>
              {getSpecializations().map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
              />
              Online only
            </label>
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="post-filters">
            <select
              value={postFilter}
              onChange={(e) => setPostFilter(e.target.value as any)}
            >
              <option value="all">All Posts</option>
              <option value="discussion">Discussions</option>
              <option value="resource">Resources</option>
              <option value="question">Questions</option>
            </select>
          </div>
        )}
      </Card>

      {/* Helpers Tab */}
      {activeTab === 'helpers' && (
        <div className="helpers-content">
          <div className="helpers-grid">
            {filteredHelpers.map(helper => (
              <Card key={helper.id} className="helper-card">
                <div className="helper-header">
                  <div className="helper-info">
                    <h3>{helper.name}</h3>
                    <div className="helper-status">
                      <div className={`status-dot ${helper.isOnline ? 'online' : 'offline'}`} />
                      <span>{helper.isOnline ? 'Online' : 'Offline'}</span>
                      {helper.isVerified && <span className="verified">✓ Verified</span>}
                    </div>
                  </div>
                </div>

                <p className="helper-bio">{helper.bio}</p>

                <div className="helper-specializations">
                  {helper.specializations.map(spec => (
                    <span key={spec} className="specialization-tag">{spec}</span>
                  ))}
                </div>

                <div className="helper-stats">
                  <div className="stat-item">
                    <div className="stars">
                      {renderStars(Math.round(helper.rating))}
                    </div>
                    <span>{helper.rating.toFixed(1)} ({helper.totalReviews} reviews)</span>
                  </div>
                  <div className="stat-item">
                    <span>{helper.totalSessions} sessions completed</span>
                  </div>
                  <div className="stat-item">
                    <span>Responds {helper.responseTime.toLowerCase()}</span>
                  </div>
                </div>

                <div className="helper-languages">
                  <strong>Languages:</strong> {helper.languages.join(', ')}
                </div>

                <div className="helper-actions">
                  <AppButton
                    variant="primary"
                    size="small"
                    onClick={() => handleConnectWithHelper(helper.id)}
                  >
                    <MessageIcon /> Connect
                  </AppButton>
                  <AppButton
                    variant="secondary"
                    size="small"
                    onClick={() => showNotification('info', `Viewing ${helper.name}'s profile`)}
                  >
                    View Profile
                  </AppButton>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div className="discussions-content">
          <div className="posts-list">
            {filteredPosts.map(post => (
              <Card key={post.id} className={`post-card ${post.isPinned ? 'pinned' : ''}`}>
                <div className="post-header">
                  <div className="post-info">
                    <h3>{post.title}</h3>
                    <div className="post-meta">
                      <span className="author">by {post.authorName}</span>
                      <span className="timestamp">{formatTimeAgo(post.timestamp)}</span>
                      <span className={`category ${post.category}`}>{post.category}</span>
                      {post.isPinned && <span className="pinned-badge">📌 Pinned</span>}
                    </div>
                  </div>
                </div>

                <p className="post-content">{post.content}</p>

                <div className="post-tags">
                  {post.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>

                <div className="post-actions">
                  <AppButton
                    variant={post.isLiked ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleLikePost(post.id)}
                  >
                    ❤️ {post.likes}
                  </AppButton>
                  <AppButton
                    variant="secondary"
                    size="small"
                    onClick={() => showNotification('Opening comments', 'info')}
                  >
                    💬 {post.comments}
                  </AppButton>
                  <AppButton
                    variant="secondary"
                    size="small"
                    onClick={() => showNotification('Sharing post', 'info')}
                  >
                    🔗 Share
                  </AppButton>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="events-content">
          <div className="events-list">
            {events.map(event => (
              <Card key={event.id} className="event-card">
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <div className="event-type">{event.type}</div>
                </div>

                <p className="event-description">{event.description}</p>

                <div className="event-details">
                  <div className="detail-item">
                    <strong>Date:</strong> {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString()}
                  </div>
                  <div className="detail-item">
                    <strong>Duration:</strong> {event.duration} minutes
                  </div>
                  <div className="detail-item">
                    <strong>Facilitator:</strong> {event.facilitator}
                  </div>
                  <div className="detail-item">
                    <strong>Location:</strong> {event.location}
                  </div>
                  {event.maxParticipants && (
                    <div className="detail-item">
                      <strong>Participants:</strong> {event.currentParticipants}/{event.maxParticipants}
                    </div>
                  )}
                </div>

                <div className="event-actions">
                  <div className="flex flex-wrap gap-2">
                    <AppButton
                      variant={event.isRegistered ? 'danger' : 'primary'}
                      onClick={() => handleRegisterForEvent(event.id)}
                      disabled={event.maxParticipants ? event.currentParticipants >= event.maxParticipants && !event.isRegistered : false}
                    >
                      {event.isRegistered ? 'Unregister' : 'Register'}
                      {event.continuingEducationCredits > 0 && (
                        <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                          {event.continuingEducationCredits} CE
                        </span>
                      )}
                    </AppButton>
                    
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={() => showNotification('Adding to calendar', 'info')}
                    >
                      <CalendarIcon className="w-4 h-4 mr-1" /> 
                      Add to Calendar
                    </AppButton>
                    
                    {event.recordingAvailable && (
                      <AppButton
                        variant="outline"
                        size="small"
                        onClick={() => showNotification('Recording will be available after event', 'info')}
                      >
                        <VideoIcon className="w-4 h-4 mr-1" />
                        Recording
                      </AppButton>
                    )}
                    
                    {event.scholarshipsAvailable && (
                      <AppButton
                        variant="ghost"
                        size="small"
                        onClick={() => showNotification('Scholarship application opened', 'info')}
                      >
                        <AwardIcon className="w-4 h-4 mr-1" />
                        Scholarship
                      </AppButton>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="resources-content">
          <Card className="resources-placeholder">
            <h3>Community Resources</h3>
            <p>This section will contain shared resources, guides, and helpful materials from the helper community.</p>
            <AppButton variant="primary">
              <BookIcon /> Browse Resources
            </AppButton>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MentalHealthHelperCommunityView;
export { MentalHealthHelperCommunityView as HelperCommunityView };
export type {
  HelperCommunityViewProps,
  MentalHealthHelper,
  MentalHealthCommunityPost,
  MentalHealthCommunityEvent,
  MentalHealthCommunityStats,
  MentalHealthSpecialization,
  HelperAvailability,
  EventFacilitator,
  EventLocation
};
