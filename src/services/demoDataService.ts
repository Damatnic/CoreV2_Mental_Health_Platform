/**
 * Demo Data Service
 *
 * Provides realistic sample data for all user types during demo presentations.
 * Creates interconnected scenarios showing the complete support ecosystem.
 */

export interface DemoUser {
  id: string;
  name: string;
  role: 'user' | 'helper' | 'therapist' | 'moderator' | 'admin';
  avatar?: string;
  joinDate: string;
  bio?: string;
  badges?: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  timestamp: string;
  content: string;
  mood: string;
  tags: string[];
  isPrivate: boolean;
}

export interface MoodCheckIn {
  id: string;
  userId: string;
  timestamp: string;
  moodScore: number;
  anxietyLevel: number;
  sleepQuality: number;
  energyLevel: number;
  tags: string[];
  notes: string;
}

export interface Assessment {
  id: string;
  userId: string;
  type: string;
  title: string;
  timestamp: string;
  score: number;
  severity: string;
  responses: Record<string, number>;
  recommendations: string[];
}

export interface SafetyPlan {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  warningSignals: string[];
  copingStrategies: string[];
  supportContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  professionalContacts: Array<{
    name: string;
    phone: string;
    available: string;
  }>;
  safeEnvironment: string[];
}

export interface WellnessGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  milestones: Array<{
    title: string;
    completed: boolean;
  }>;
  createdAt: string;
}

export interface CommunityStats {
  totalUsers: number;
  activeHelpers: number;
  sessionsToday: number;
  averageRating: number;
  totalHelpSessions: number;
  successStories: number;
}

class DemoDataService {
  private static instance: DemoDataService;

  public static getInstance(): DemoDataService {
    if (!DemoDataService.instance) {
      DemoDataService.instance = new DemoDataService();
    }
    return DemoDataService.instance;
  }

  // Generate demo users
  getDemoUsers(): DemoUser[] {
    return [
      {
        id: 'user-001',
        name: 'Alex Thompson',
        role: 'user',
        avatar: '/avatars/alex.png',
        joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        bio: 'Working on managing anxiety and building better coping strategies.',
        badges: ['early-bird', 'consistent-journaler', '30-day-streak']
      },
      {
        id: 'helper-001',
        name: 'Dr. Sarah Chen',
        role: 'therapist',
        avatar: '/avatars/sarah.png',
        joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        bio: 'Licensed therapist specializing in anxiety and depression. Here to help!',
        badges: ['verified-therapist', 'top-helper', '1000-helps']
      },
      {
        id: 'helper-002',
        name: 'Marcus Williams',
        role: 'helper',
        avatar: '/avatars/marcus.png',
        joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        bio: 'Peer support specialist. Recovered from depression and here to share my journey.',
        badges: ['peer-supporter', 'community-champion', '500-helps']
      },
      {
        id: 'mod-001',
        name: 'Jamie Rodriguez',
        role: 'moderator',
        avatar: '/avatars/jamie.png',
        joinDate: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
        bio: 'Community moderator ensuring a safe and supportive environment for all.',
        badges: ['trusted-moderator', 'safety-champion']
      }
    ];
  }

  // Generate journal entries
  getDemoJournalEntries(userId: string): JournalEntry[] {
    const now = Date.now();
    return [
      {
        id: 'journal-001',
        userId,
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        content: 'Been feeling really overwhelmed with work lately. The deadlines keep piling up and I feel like I\'m drowning. Sometimes I wonder if I\'m good enough for this job. Maybe talking to someone would help...',
        mood: 'anxious',
        tags: ['work', 'anxiety', 'self-doubt'],
        isPrivate: false
      },
      {
        id: 'journal-002',
        userId,
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        content: 'Had a breakthrough moment today during my session with Dr. Chen. She helped me realize that my anxiety spirals usually start with comparison to others. Going to try the breathing exercises she suggested.',
        mood: 'hopeful',
        tags: ['therapy', 'progress', 'breathing'],
        isPrivate: false
      },
      {
        id: 'journal-003',
        userId,
        timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        content: 'Practiced the 5-4-3-2-1 grounding technique when I felt panic rising at the grocery store. It actually worked! Small victory but it feels huge.',
        mood: 'proud',
        tags: ['grounding', 'progress', 'victory'],
        isPrivate: false
      },
      {
        id: 'journal-004',
        userId,
        timestamp: new Date(now).toISOString(),
        content: 'Practicing gratitude like my guide suggested. Three things I\'m grateful for: 1) The supportive community here 2) Having a safe space to share my thoughts 3) Small progress feels significant.',
        mood: 'grateful',
        tags: ['gratitude', 'community', 'progress'],
        isPrivate: false
      }
    ];
  }

  // Generate mood check-ins
  getDemoMoodCheckIns(userId: string): MoodCheckIn[] {
    const now = Date.now();
    return [
      {
        id: 'mood-001',
        userId,
        timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        moodScore: 3,
        anxietyLevel: 7,
        sleepQuality: 4,
        energyLevel: 3,
        tags: ['overwhelmed', 'stressed', 'tired'],
        notes: 'Work pressure getting to me. Barely sleeping.'
      },
      {
        id: 'mood-002',
        userId,
        timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        moodScore: 4,
        anxietyLevel: 6,
        sleepQuality: 5,
        energyLevel: 4,
        tags: ['improving', 'therapy-helping'],
        notes: 'Started therapy. Feeling slightly better.'
      },
      {
        id: 'mood-003',
        userId,
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        moodScore: 5,
        anxietyLevel: 5,
        sleepQuality: 6,
        energyLevel: 5,
        tags: ['hopeful', 'supported'],
        notes: 'Had a really good session. Feeling more hopeful.'
      },
      {
        id: 'mood-004',
        userId,
        timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        moodScore: 6,
        anxietyLevel: 4,
        sleepQuality: 7,
        energyLevel: 6,
        tags: ['progress', 'grateful', 'rested'],
        notes: 'Best I\'ve felt in weeks. Sleep improving.'
      },
      {
        id: 'mood-005',
        userId,
        timestamp: new Date(now).toISOString(),
        moodScore: 6,
        anxietyLevel: 4,
        sleepQuality: 7,
        energyLevel: 7,
        tags: ['stable', 'optimistic'],
        notes: 'Maintaining progress. Feeling stable.'
      }
    ];
  }

  // Generate assessments
  getDemoAssessments(userId: string): Assessment[] {
    return [
      {
        id: 'assess-001',
        userId,
        type: 'GAD-7',
        title: 'Generalized Anxiety Disorder Assessment',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        score: 12,
        severity: 'moderate',
        responses: {
          q1: 2,
          q2: 2,
          q3: 1,
          q4: 2,
          q5: 2,
          q6: 1,
          q7: 2
        },
        recommendations: [
          'Consider speaking with a mental health professional',
          'Practice daily relaxation techniques',
          'Regular exercise may help reduce anxiety'
        ]
      },
      {
        id: 'assess-002',
        userId,
        type: 'PHQ-9',
        title: 'Depression Screening',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        score: 8,
        severity: 'mild',
        responses: {
          q1: 1,
          q2: 1,
          q3: 1,
          q4: 1,
          q5: 0,
          q6: 1,
          q7: 1,
          q8: 1,
          q9: 1
        },
        recommendations: [
          'Monitor your mood daily',
          'Maintain regular sleep schedule',
          'Stay connected with support network'
        ]
      }
    ];
  }

  // Generate safety plans
  getDemoSafetyPlans(userId: string): SafetyPlan[] {
    return [
      {
        id: 'safety-001',
        userId,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        warningSignals: [
          'Feeling overwhelmed and unable to cope',
          'Isolating myself from friends and family',
          'Sleep disruption for multiple nights',
          'Catastrophic thinking patterns'
        ],
        copingStrategies: [
          'Practice 5-4-3-2-1 grounding technique',
          'Call my support buddy Marcus',
          'Take a walk in nature',
          'Listen to calming music playlist',
          'Use the breathing exercise app'
        ],
        supportContacts: [
          { name: 'Dr. Sarah Chen', phone: '555-0123', relationship: 'Therapist' },
          { name: 'Marcus (Support Buddy)', phone: '555-0124', relationship: 'Peer Support' },
          { name: 'Sister Emma', phone: '555-0125', relationship: 'Family' },
          { name: 'Crisis Hotline', phone: '988', relationship: 'Emergency' }
        ],
        professionalContacts: [
          { name: 'City Mental Health Center', phone: '555-0200', available: '24/7' },
          { name: 'Dr. Chen\'s Office', phone: '555-0201', available: 'Mon-Fri 9-5' }
        ],
        safeEnvironment: [
          'Remove any harmful objects',
          'Stay with trusted people',
          'Avoid alcohol and substances',
          'Go to a calm, familiar place'
        ]
      }
    ];
  }

  // Generate wellness goals
  getDemoWellnessGoals(userId: string): WellnessGoal[] {
    return [
      {
        id: 'goal-001',
        userId,
        title: 'Daily Meditation Practice',
        description: 'Meditate for at least 10 minutes every day',
        category: 'mindfulness',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 65,
        milestones: [
          { title: 'Week 1 Complete', completed: true },
          { title: 'Week 2 Complete', completed: true },
          { title: 'Week 3 Complete', completed: false },
          { title: 'Week 4 Complete', completed: false }
        ],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'goal-002',
        userId,
        title: 'Regular Exercise',
        description: 'Exercise 3 times per week for mental health',
        category: 'physical',
        targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 40,
        milestones: [
          { title: 'First workout completed', completed: true },
          { title: 'One week streak', completed: true },
          { title: 'Two week streak', completed: false },
          { title: 'One month streak', completed: false }
        ],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Generate complete demo dataset
  getCompleteDemoData() {
    const userId = 'user-001';
    
    return {
      users: this.getDemoUsers(),
      journalEntries: this.getDemoJournalEntries(userId),
      moodCheckIns: this.getDemoMoodCheckIns(userId),
      assessments: this.getDemoAssessments(userId),
      safetyPlans: this.getDemoSafetyPlans(userId),
      wellnessGoals: this.getDemoWellnessGoals(userId),
      communityStats: {
        totalUsers: 15234,
        activeHelpers: 523,
        sessionsToday: 1247,
        averageRating: 4.7,
        totalHelpSessions: 89432,
        successStories: 3421
      }
    };
  }

  // Helper methods for demo scenarios
  generateRealisticCrisisScenario() {
    return {
      timestamp: new Date().toISOString(),
      severity: 'high',
      triggers: ['work stress', 'relationship issues'],
      currentMood: 2,
      anxietyLevel: 9,
      hasSupport: false,
      needsImmediate: true,
      copingStrategiesUsed: ['breathing', 'grounding'],
      effectivenessScore: 3
    };
  }

  generateProgressReport(userId: string, period: 'week' | 'month' | 'quarter') {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    
    return {
      userId,
      period,
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      metrics: {
        moodImprovement: 35,
        anxietyReduction: 28,
        sessionsCompleted: period === 'week' ? 3 : period === 'month' ? 12 : 35,
        goalsAchieved: period === 'week' ? 2 : period === 'month' ? 8 : 24,
        journalEntries: period === 'week' ? 7 : period === 'month' ? 28 : 82,
        copingStrategiesLearned: period === 'week' ? 3 : period === 'month' ? 10 : 25
      },
      insights: [
        'Consistent journaling correlates with mood improvement',
        'Breathing exercises most effective during morning anxiety',
        'Social connections increased by 40%'
      ],
      recommendations: [
        'Continue daily meditation practice',
        'Consider group therapy sessions',
        'Explore creative expression activities'
      ]
    };
  }
}

export default DemoDataService.getInstance();
