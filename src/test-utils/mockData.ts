// Mock data for testing
export const mockUsers = {
  seeker: {
    id: 'seeker-123',
    email: 'seeker@example.com',
    name: 'John Seeker',
    role: 'seeker',
    isEmailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    profile: {
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Seeking support and wellness',
      timezone: 'America/New_York',
      preferredLanguage: 'en'
    }
  },
  helper: {
    id: 'helper-456',
    email: 'helper@example.com',
    name: 'Jane Helper',
    role: 'helper',
    isEmailVerified: true,
    isCertified: true,
    createdAt: '2023-06-01T00:00:00Z',
    profile: {
      avatar: 'https://example.com/helper-avatar.jpg',
      bio: 'Certified peer support specialist',
      specialties: ['anxiety', 'depression', 'crisis'],
      availability: 'weekdays',
      rating: 4.8,
      sessionsCompleted: 150
    }
  },
  admin: {
    id: 'admin-789',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    isEmailVerified: true,
    createdAt: '2023-01-01T00:00:00Z'
  }
};

export const mockAssessments = {
  phq9: {
    id: 'phq9-001',
    type: 'PHQ-9',
    userId: 'seeker-123',
    score: 12,
    severity: 'moderate',
    completedAt: '2024-01-15T10:30:00Z',
    answers: [2, 1, 2, 1, 2, 1, 1, 1, 1],
    recommendations: [
      'Consider speaking with a mental health professional',
      'Practice daily mindfulness exercises',
      'Maintain regular sleep schedule'
    ]
  },
  gad7: {
    id: 'gad7-001',
    type: 'GAD-7',
    userId: 'seeker-123',
    score: 8,
    severity: 'mild',
    completedAt: '2024-01-15T11:00:00Z',
    answers: [1, 1, 2, 1, 1, 1, 1],
    recommendations: [
      'Try breathing exercises',
      'Regular physical activity',
      'Limit caffeine intake'
    ]
  }
};

export const mockMoodEntries = [
  {
    id: 'mood-001',
    userId: 'seeker-123',
    mood: 7,
    energy: 6,
    anxiety: 3,
    sleep: 8,
    notes: 'Had a good day, feeling positive',
    activities: ['exercise', 'meditation', 'socializing'],
    timestamp: '2024-01-15T08:00:00Z'
  },
  {
    id: 'mood-002',
    userId: 'seeker-123',
    mood: 5,
    energy: 4,
    anxiety: 6,
    sleep: 6,
    notes: 'Feeling stressed about work',
    activities: ['work', 'reading'],
    timestamp: '2024-01-14T08:00:00Z'
  },
  {
    id: 'mood-003',
    userId: 'seeker-123',
    mood: 8,
    energy: 8,
    anxiety: 2,
    sleep: 9,
    notes: 'Great sleep, feeling refreshed',
    activities: ['exercise', 'nature walk', 'cooking'],
    timestamp: '2024-01-13T08:00:00Z'
  }
];

export const mockReflections = [
  {
    id: 'reflection-001',
    userId: 'seeker-123',
    content: 'Today I realized that taking small breaks throughout the day really helps my anxiety.',
    mood: 'thoughtful',
    isPublic: true,
    createdAt: '2024-01-15T14:00:00Z',
    reactions: {
      heart: 12,
      support: 8,
      empathy: 5,
      inspire: 3
    },
    comments: [
      {
        id: 'comment-001',
        userId: 'helper-456',
        content: 'This is a great insight! Small breaks are so important.',
        createdAt: '2024-01-15T15:00:00Z'
      }
    ]
  },
  {
    id: 'reflection-002',
    userId: 'seeker-123',
    content: 'Grateful for the support I received today from this community.',
    mood: 'grateful',
    isPublic: true,
    createdAt: '2024-01-14T20:00:00Z',
    reactions: {
      heart: 25,
      support: 15,
      empathy: 10,
      inspire: 8
    },
    comments: []
  }
];

export const mockCrisisResources = [
  {
    id: 'resource-001',
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    text: 'Text HOME to 741741',
    availability: '24/7',
    description: 'Free, confidential crisis support',
    categories: ['crisis', 'suicide prevention'],
    languages: ['en', 'es'],
    website: 'https://988lifeline.org'
  },
  {
    id: 'resource-002',
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    availability: '24/7',
    description: 'Treatment referral and information service',
    categories: ['substance abuse', 'mental health'],
    languages: ['en', 'es'],
    website: 'https://www.samhsa.gov/find-help/national-helpline'
  },
  {
    id: 'resource-003',
    name: 'Veterans Crisis Line',
    phone: '1-800-273-8255',
    text: 'Text 838255',
    availability: '24/7',
    description: 'Support for Veterans and their families',
    categories: ['veterans', 'crisis'],
    languages: ['en'],
    website: 'https://www.veteranscrisisline.net'
  }
];

export const mockSafetyPlan = {
  id: 'safety-001',
  userId: 'seeker-123',
  warningSignTriggers: [
    'Feeling overwhelmed',
    'Isolation from friends',
    'Sleep disruption'
  ],
  copingStrategies: [
    'Deep breathing exercises',
    'Go for a walk',
    'Listen to calming music',
    'Journal thoughts'
  ],
  distractions: [
    'Watch favorite show',
    'Call a friend',
    'Play with pet',
    'Do a puzzle'
  ],
  supportContacts: [
    {
      name: 'Mom',
      phone: '555-0101',
      relationship: 'family'
    },
    {
      name: 'Best Friend Sarah',
      phone: '555-0102',
      relationship: 'friend'
    }
  ],
  professionals: [
    {
      name: 'Dr. Smith',
      phone: '555-0201',
      role: 'Therapist',
      availability: 'Mon-Fri 9-5'
    }
  ],
  safeEnvironment: [
    'Remove sharp objects',
    'Give medications to trusted person',
    'Avoid alcohol'
  ],
  reasonsToLive: [
    'My family',
    'My pet',
    'Future goals',
    'Helping others'
  ],
  createdAt: '2024-01-01T00:00:00Z',
  lastUpdated: '2024-01-15T00:00:00Z'
};

export const mockChatMessages = [
  {
    id: 'msg-001',
    sender: 'user',
    text: 'I\'m feeling anxious about tomorrow',
    timestamp: '2024-01-15T10:00:00Z'
  },
  {
    id: 'msg-002',
    sender: 'ai',
    text: 'I understand you\'re feeling anxious. Can you tell me more about what\'s happening tomorrow?',
    timestamp: '2024-01-15T10:00:30Z'
  },
  {
    id: 'msg-003',
    sender: 'user',
    text: 'I have a big presentation at work',
    timestamp: '2024-01-15T10:01:00Z'
  },
  {
    id: 'msg-004',
    sender: 'ai',
    text: 'Presentations can definitely cause anxiety. Let\'s work through some strategies that might help you feel more prepared and calm.',
    timestamp: '2024-01-15T10:01:30Z',
    suggestions: [
      'Practice deep breathing',
      'Rehearse your presentation',
      'Visualize success',
      'Prepare thoroughly'
    ]
  }
];

export const mockHabits = [
  {
    id: 'habit-001',
    userId: 'seeker-123',
    name: 'Daily Meditation',
    description: 'Meditate for 10 minutes',
    frequency: 'daily',
    streak: 15,
    longestStreak: 30,
    completedDates: [
      '2024-01-15',
      '2024-01-14',
      '2024-01-13'
      // ... more dates
    ],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'habit-002',
    userId: 'seeker-123',
    name: 'Exercise',
    description: '30 minutes of physical activity',
    frequency: 'daily',
    streak: 5,
    longestStreak: 10,
    completedDates: [
      '2024-01-15',
      '2024-01-14',
      '2024-01-13',
      '2024-01-12',
      '2024-01-11'
    ],
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockJournalEntries = [
  {
    id: 'journal-001',
    userId: 'seeker-123',
    title: 'A Day of Progress',
    content: 'Today was better than yesterday. I managed to complete all my tasks without feeling overwhelmed.',
    mood: 'hopeful',
    tags: ['progress', 'productivity', 'calm'],
    isPrivate: true,
    createdAt: '2024-01-15T20:00:00Z'
  },
  {
    id: 'journal-002',
    userId: 'seeker-123',
    title: 'Dealing with Stress',
    content: 'Work has been stressful lately, but I\'m learning to manage it better with breathing exercises.',
    mood: 'stressed',
    tags: ['work', 'stress', 'coping'],
    isPrivate: true,
    createdAt: '2024-01-14T19:00:00Z'
  }
];

export const mockNotifications = [
  {
    id: 'notif-001',
    userId: 'seeker-123',
    type: 'mood_reminder',
    title: 'Time for your daily check-in',
    message: 'How are you feeling today?',
    isRead: false,
    createdAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 'notif-002',
    userId: 'seeker-123',
    type: 'achievement',
    title: 'Milestone reached!',
    message: 'You\'ve completed a 7-day meditation streak!',
    isRead: true,
    createdAt: '2024-01-14T10:00:00Z'
  },
  {
    id: 'notif-003',
    userId: 'seeker-123',
    type: 'support',
    title: 'Someone reacted to your reflection',
    message: 'Your reflection received 5 hearts',
    isRead: true,
    createdAt: '2024-01-13T15:00:00Z'
  }
];

export const mockVideos = [
  {
    id: 'video-001',
    title: 'Introduction to Mindfulness',
    description: 'Learn the basics of mindfulness meditation',
    duration: 600,
    thumbnail: 'https://example.com/mindfulness-thumb.jpg',
    url: 'https://example.com/mindfulness-video.mp4',
    category: 'meditation',
    views: 1250,
    likes: 98,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'video-002',
    title: 'Coping with Anxiety',
    description: 'Practical strategies for managing anxiety',
    duration: 480,
    thumbnail: 'https://example.com/anxiety-thumb.jpg',
    url: 'https://example.com/anxiety-video.mp4',
    category: 'anxiety',
    views: 2100,
    likes: 156,
    createdAt: '2024-01-05T00:00:00Z'
  }
];

export const mockPeerSessions = [
  {
    id: 'session-001',
    seekerId: 'seeker-123',
    helperId: 'helper-456',
    status: 'completed',
    startTime: '2024-01-14T14:00:00Z',
    endTime: '2024-01-14T14:45:00Z',
    rating: 5,
    feedback: 'Very helpful session, thank you!',
    topics: ['anxiety', 'work stress']
  },
  {
    id: 'session-002',
    seekerId: 'seeker-123',
    helperId: 'helper-789',
    status: 'scheduled',
    startTime: '2024-01-16T15:00:00Z',
    endTime: '2024-01-16T15:45:00Z',
    topics: ['coping strategies', 'self-care']
  }
];

// Crisis detection test data
export const mockCrisisTexts = {
  none: [
    'I had a great day today',
    'Looking forward to the weekend',
    'Just finished a good workout'
  ],
  low: [
    'Feeling a bit down today',
    'Things have been tough lately',
    'Not sure how to handle this stress'
  ],
  medium: [
    'I can\'t take this anymore',
    'Everything feels hopeless',
    'I don\'t see a way out'
  ],
  high: [
    'I want to end it all',
    'Planning to hurt myself',
    'I have pills ready'
  ],
  immediate: [
    'Goodbye everyone',
    'This is my last message',
    'I\'m doing it now'
  ]
};

// Mock API responses
export const mockApiResponses = {
  success: {
    status: 'success',
    data: {},
    message: 'Operation completed successfully'
  },
  error: {
    status: 'error',
    error: 'Something went wrong',
    code: 'GENERIC_ERROR'
  },
  unauthorized: {
    status: 'error',
    error: 'Unauthorized access',
    code: 'UNAUTHORIZED'
  },
  notFound: {
    status: 'error',
    error: 'Resource not found',
    code: 'NOT_FOUND'
  }
};

// Mock WebSocket messages
export const mockWebSocketMessages = {
  typing: {
    type: 'typing',
    userId: 'helper-456',
    isTyping: true
  },
  message: {
    type: 'message',
    id: 'ws-msg-001',
    sender: 'helper-456',
    text: 'How can I help you today?',
    timestamp: '2024-01-15T10:00:00Z'
  },
  presence: {
    type: 'presence',
    userId: 'helper-456',
    status: 'online'
  },
  notification: {
    type: 'notification',
    title: 'New message',
    message: 'You have a new message from your helper'
  }
};