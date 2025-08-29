/**
 * Sample Data for Development and Testing
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'helper' | 'therapist' | 'admin';
  avatar?: string;
  joinDate: string;
  isActive: boolean;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: number; // 1-10 scale
  timestamp: string;
  notes?: string;
  tags?: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  timestamp: string;
  mood?: string;
  isPrivate: boolean;
  tags?: string[];
}

export interface CrisisEvent {
  id: string;
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  interventions: string[];
}

export interface TherapySession {
  id: string;
  userId: string;
  therapistId: string;
  scheduledTime: string;
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isEmergency: boolean;
}

// Sample Users
export const sampleUsers: User[] = [
  {
    id: 'user-001',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'user',
    avatar: '/avatars/alice.jpg',
    joinDate: '2024-01-15T08:00:00Z',
    isActive: true
  },
  {
    id: 'user-002',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'user',
    avatar: '/avatars/bob.jpg',
    joinDate: '2024-01-20T10:30:00Z',
    isActive: true
  },
  {
    id: 'helper-001',
    name: 'Carol Davis',
    email: 'carol@example.com',
    role: 'helper',
    avatar: '/avatars/carol.jpg',
    joinDate: '2023-11-01T09:00:00Z',
    isActive: true
  },
  {
    id: 'therapist-001',
    name: 'Dr. David Wilson',
    email: 'david@example.com',
    role: 'therapist',
    avatar: '/avatars/david.jpg',
    joinDate: '2023-06-15T08:00:00Z',
    isActive: true
  },
  {
    id: 'admin-001',
    name: 'Emma Thompson',
    email: 'emma@example.com',
    role: 'admin',
    avatar: '/avatars/emma.jpg',
    joinDate: '2023-01-01T08:00:00Z',
    isActive: true
  }
];

// Sample Mood Entries
export const sampleMoodEntries: MoodEntry[] = [
  {
    id: 'mood-001',
    userId: 'user-001',
    mood: 7,
    timestamp: '2024-02-01T08:00:00Z',
    notes: 'Feeling good today, had a great morning walk',
    tags: ['exercise', 'positive']
  },
  {
    id: 'mood-002',
    userId: 'user-001',
    mood: 5,
    timestamp: '2024-02-01T14:00:00Z',
    notes: 'Afternoon slump, feeling a bit tired',
    tags: ['tired', 'neutral']
  },
  {
    id: 'mood-003',
    userId: 'user-001',
    mood: 8,
    timestamp: '2024-02-01T20:00:00Z',
    notes: 'Evening meditation helped a lot',
    tags: ['meditation', 'relaxed']
  },
  {
    id: 'mood-004',
    userId: 'user-002',
    mood: 4,
    timestamp: '2024-02-01T09:00:00Z',
    notes: 'Anxious about upcoming presentation',
    tags: ['anxiety', 'work']
  },
  {
    id: 'mood-005',
    userId: 'user-002',
    mood: 6,
    timestamp: '2024-02-01T17:00:00Z',
    notes: 'Presentation went better than expected',
    tags: ['relief', 'accomplishment']
  }
];

// Sample Journal Entries
export const sampleJournalEntries: JournalEntry[] = [
  {
    id: 'journal-001',
    userId: 'user-001',
    title: 'Morning Reflections',
    content: 'Today I woke up feeling refreshed. The sun was shining through my window, and I felt a sense of peace I haven\'t felt in weeks. I\'m grateful for this moment of clarity.',
    timestamp: '2024-02-01T07:30:00Z',
    mood: 'peaceful',
    isPrivate: false,
    tags: ['gratitude', 'morning', 'reflection']
  },
  {
    id: 'journal-002',
    userId: 'user-001',
    title: 'Dealing with Stress',
    content: 'Work has been overwhelming lately. I\'m trying to practice the breathing exercises my therapist taught me. It\'s helping, but I still feel the pressure.',
    timestamp: '2024-01-31T18:00:00Z',
    mood: 'stressed',
    isPrivate: true,
    tags: ['work', 'stress', 'coping']
  },
  {
    id: 'journal-003',
    userId: 'user-002',
    title: 'Small Victories',
    content: 'Made it through the presentation today! I was so nervous, but I did it. My hands were shaking, but my voice stayed steady. I\'m proud of myself.',
    timestamp: '2024-02-01T16:00:00Z',
    mood: 'proud',
    isPrivate: false,
    tags: ['achievement', 'anxiety', 'growth']
  },
  {
    id: 'journal-004',
    userId: 'user-002',
    title: 'Therapy Insights',
    content: 'Had a breakthrough in therapy today. Realized that my fear of failure comes from childhood experiences. It\'s liberating to understand where these feelings come from.',
    timestamp: '2024-01-30T14:00:00Z',
    mood: 'hopeful',
    isPrivate: true,
    tags: ['therapy', 'insight', 'healing']
  }
];

// Sample Crisis Events
export const sampleCrisisEvents: CrisisEvent[] = [
  {
    id: 'crisis-001',
    userId: 'user-001',
    severity: 'medium',
    timestamp: '2024-01-28T22:00:00Z',
    resolved: true,
    interventions: ['breathing-exercise', 'grounding-technique', 'support-chat']
  },
  {
    id: 'crisis-002',
    userId: 'user-002',
    severity: 'high',
    timestamp: '2024-01-25T03:00:00Z',
    resolved: true,
    interventions: ['crisis-hotline', 'emergency-contact', 'safety-plan']
  },
  {
    id: 'crisis-003',
    userId: 'user-001',
    severity: 'low',
    timestamp: '2024-02-01T15:00:00Z',
    resolved: true,
    interventions: ['self-help-resources', 'mood-tracking']
  }
];

// Sample Therapy Sessions
export const sampleTherapySessions: TherapySession[] = [
  {
    id: 'session-001',
    userId: 'user-001',
    therapistId: 'therapist-001',
    scheduledTime: '2024-02-05T14:00:00Z',
    duration: 50,
    status: 'scheduled',
    notes: 'Weekly session - focus on anxiety management'
  },
  {
    id: 'session-002',
    userId: 'user-001',
    therapistId: 'therapist-001',
    scheduledTime: '2024-01-29T14:00:00Z',
    duration: 50,
    status: 'completed',
    notes: 'Discussed coping strategies for work stress'
  },
  {
    id: 'session-003',
    userId: 'user-002',
    therapistId: 'therapist-001',
    scheduledTime: '2024-02-03T10:00:00Z',
    duration: 50,
    status: 'scheduled',
    notes: 'Bi-weekly session - social anxiety focus'
  },
  {
    id: 'session-004',
    userId: 'user-002',
    therapistId: 'therapist-001',
    scheduledTime: '2024-01-20T10:00:00Z',
    duration: 50,
    status: 'completed',
    notes: 'Breakthrough session - identified core fears'
  }
];

// Sample Messages
export const sampleMessages: Message[] = [
  {
    id: 'msg-001',
    senderId: 'user-001',
    recipientId: 'helper-001',
    content: 'Hi, I\'m feeling a bit overwhelmed today. Can we talk?',
    timestamp: '2024-02-01T10:00:00Z',
    isRead: true,
    isEmergency: false
  },
  {
    id: 'msg-002',
    senderId: 'helper-001',
    recipientId: 'user-001',
    content: 'Of course! I\'m here to listen. What\'s on your mind?',
    timestamp: '2024-02-01T10:05:00Z',
    isRead: true,
    isEmergency: false
  },
  {
    id: 'msg-003',
    senderId: 'user-002',
    recipientId: 'therapist-001',
    content: 'Is it possible to reschedule our session to earlier in the day?',
    timestamp: '2024-02-01T08:00:00Z',
    isRead: true,
    isEmergency: false
  },
  {
    id: 'msg-004',
    senderId: 'therapist-001',
    recipientId: 'user-002',
    content: 'I have a slot available at 9 AM. Would that work for you?',
    timestamp: '2024-02-01T09:00:00Z',
    isRead: false,
    isEmergency: false
  },
  {
    id: 'msg-005',
    senderId: 'user-001',
    recipientId: 'therapist-001',
    content: 'Having a panic attack, need immediate help',
    timestamp: '2024-01-28T22:00:00Z',
    isRead: true,
    isEmergency: true
  }
];

// Utility functions for sample data
export function getUserById(userId: string): User | undefined {
  return sampleUsers.find(user => user.id === userId);
}

export function getMoodEntriesForUser(userId: string): MoodEntry[] {
  return sampleMoodEntries.filter(entry => entry.userId === userId);
}

export function getJournalEntriesForUser(userId: string): JournalEntry[] {
  return sampleJournalEntries.filter(entry => entry.userId === userId);
}

export function getCrisisEventsForUser(userId: string): CrisisEvent[] {
  return sampleCrisisEvents.filter(event => event.userId === userId);
}

export function getTherapySessionsForUser(userId: string): TherapySession[] {
  return sampleTherapySessions.filter(session => session.userId === userId);
}

export function getMessagesForUser(userId: string): Message[] {
  return sampleMessages.filter(
    msg => msg.senderId === userId || msg.recipientId === userId
  );
}

export function getRecentMoodData(userId: string, days: number = 7): MoodEntry[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return getMoodEntriesForUser(userId).filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= cutoffDate;
  });
}

export function getAverageMood(userId: string, days: number = 7): number {
  const recentMoods = getRecentMoodData(userId, days);
  if (recentMoods.length === 0) return 5; // Default neutral mood
  
  const sum = recentMoods.reduce((acc, entry) => acc + entry.mood, 0);
  return Math.round(sum / recentMoods.length);
}

export function getUnreadMessages(userId: string): Message[] {
  return getMessagesForUser(userId).filter(
    msg => msg.recipientId === userId && !msg.isRead
  );
}

export function getEmergencyMessages(): Message[] {
  return sampleMessages.filter(msg => msg.isEmergency);
}

// Mock API response generators
export function generateMockApiResponse<T>(data: T, delay: number = 500): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
}

export function generatePaginatedResponse<T>(
  data: T[],
  page: number = 1,
  pageSize: number = 10
): {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
} {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    data: data.slice(start, end),
    pagination: {
      page,
      pageSize,
      total: data.length,
      totalPages: Math.ceil(data.length / pageSize)
    }
  };
}

// Export all sample data as a single object for convenience
export const sampleData = {
  users: sampleUsers,
  moodEntries: sampleMoodEntries,
  journalEntries: sampleJournalEntries,
  crisisEvents: sampleCrisisEvents,
  therapySessions: sampleTherapySessions,
  messages: sampleMessages,
  utils: {
    getUserById,
    getMoodEntriesForUser,
    getJournalEntriesForUser,
    getCrisisEventsForUser,
    getTherapySessionsForUser,
    getMessagesForUser,
    getRecentMoodData,
    getAverageMood,
    getUnreadMessages,
    getEmergencyMessages,
    generateMockApiResponse,
    generatePaginatedResponse
  }
};

export default sampleData;
