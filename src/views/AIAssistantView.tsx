/**
 * AI Assistant View
 * Interactive AI-powered mental health assistant interface
 */

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';

// Core interfaces
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  type: 'text' | 'suggestion' | 'resource' | 'assessment';
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestions?: string[];
    resources?: Resource[];
  };
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'exercise' | 'hotline' | 'professional';
  url?: string;
  phone?: string;
  category: 'anxiety' | 'depression' | 'stress' | 'sleep' | 'relationships' | 'crisis';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  mood?: 'very-low' | 'low' | 'neutral' | 'good' | 'excellent';
  topics: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  previousAssessments?: string[];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  communicationStyle: 'formal' | 'casual' | 'supportive';
  responseLength: 'brief' | 'moderate' | 'detailed';
  includeResources: boolean;
  crisisProtocol: boolean;
}

export interface AIAssistantViewProps {
  userId?: string;
  initialContext?: Partial<ConversationContext>;
  onCrisisDetected?: (context: ConversationContext) => void;
  onResourceRequest?: (resource: Resource) => void;
  className?: string;
  readOnly?: boolean;
}

// Mock conversation data
export const MOCK_CONVERSATION: ChatMessage[] = [
  {
    id: 'msg-1',
    content: 'Hello! I\'m your AI mental health assistant. How are you feeling today?',
    role: 'assistant',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    type: 'text'
  },
  {
    id: 'msg-2',
    content: 'I\'ve been feeling quite anxious lately, especially about work.',
    role: 'user',
    timestamp: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
    type: 'text'
  },
  {
    id: 'msg-3',
    content: 'I understand that work-related anxiety can be challenging. Can you tell me more about what specifically is causing you to feel anxious at work?',
    role: 'assistant',
    timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
    type: 'text',
    metadata: {
      confidence: 0.85,
      suggestions: [
        'Tell me about your workload',
        'Describe your work environment',
        'What triggers your anxiety most?'
      ]
    }
  }
];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'resource-1',
    title: 'Workplace Anxiety Management',
    description: 'Strategies for managing anxiety in professional environments',
    type: 'article',
    url: '/resources/workplace-anxiety',
    category: 'anxiety',
    priority: 'medium'
  },
  {
    id: 'resource-2',
    title: 'Quick Breathing Exercise',
    description: '5-minute breathing technique for immediate anxiety relief',
    type: 'exercise',
    url: '/exercises/breathing-anxiety',
    category: 'anxiety',
    priority: 'high'
  },
  {
    id: 'resource-3',
    title: 'Crisis Support Hotline',
    description: '24/7 mental health crisis support',
    type: 'hotline',
    phone: '988',
    category: 'crisis',
    priority: 'urgent'
  }
];

// Utility functions
export const createMessage = (
  content: string,
  role: ChatMessage['role'],
  type: ChatMessage['type'] = 'text'
): ChatMessage => {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    role,
    timestamp: new Date().toISOString(),
    type
  };
};

export const detectCrisisKeywords = (message: string): boolean => {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living',
    'hurt myself', 'self-harm', 'cutting', 'overdose',
    'can\'t go on', 'hopeless', 'worthless', 'better off dead'
  ];
  
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
};

export const analyzeSentiment = (message: string): {
  sentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
  confidence: number;
  emotions: string[];
} => {
  // Simplified sentiment analysis - in real app would use proper NLP
  const positiveWords = ['happy', 'good', 'great', 'better', 'excited', 'grateful', 'peaceful'];
  const negativeWords = ['sad', 'anxious', 'depressed', 'worried', 'stressed', 'overwhelmed', 'hopeless'];
  
  const lowerMessage = message.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  let sentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
  if (negativeCount > positiveCount + 1) sentiment = 'very-negative';
  else if (negativeCount > positiveCount) sentiment = 'negative';
  else if (positiveCount > negativeCount) sentiment = 'positive';
  else if (positiveCount > negativeCount + 1) sentiment = 'very-positive';
  else sentiment = 'neutral';
  
  return {
    sentiment,
    confidence: Math.min((Math.abs(positiveCount - negativeCount) + 1) / 5, 1),
    emotions: [...positiveWords.filter(word => lowerMessage.includes(word)), 
              ...negativeWords.filter(word => lowerMessage.includes(word))]
  };
};

export const generateSuggestions = (context: ConversationContext, lastMessage?: ChatMessage): string[] => {
  const baseSuggestions = [
    'Can you tell me more about that?',
    'How long have you been feeling this way?',
    'What helps you feel better?',
    'Have you tried any coping strategies?'
  ];
  
  if (context.riskLevel === 'high' || context.riskLevel === 'crisis') {
    return [
      'Would you like to speak with a counselor?',
      'Can I help you find immediate support?',
      'Are you in a safe place right now?'
    ];
  }
  
  if (context.topics.includes('anxiety')) {
    return [
      'What triggers your anxiety most?',
      'Have you tried breathing exercises?',
      'Would you like some relaxation techniques?'
    ];
  }
  
  if (context.topics.includes('depression')) {
    return [
      'What activities used to bring you joy?',
      'How is your sleep and appetite?',
      'Do you have support from friends or family?'
    ];
  }
  
  return baseSuggestions;
};

export const getRelevantResources = (
  context: ConversationContext,
  category?: Resource['category']
): Resource[] => {
  let filtered = MOCK_RESOURCES;
  
  if (category) {
    filtered = filtered.filter(resource => resource.category === category);
  } else if (context.topics.length > 0) {
    filtered = filtered.filter(resource => 
      context.topics.some(topic => resource.category.includes(topic))
    );
  }
  
  // Sort by priority
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
};

export const assessRiskLevel = (messages: ChatMessage[]): 'low' | 'medium' | 'high' | 'crisis' => {
  const recentMessages = messages.slice(-5); // Last 5 messages
  
  const hasCrisisKeywords = recentMessages.some(msg => 
    msg.role === 'user' && detectCrisisKeywords(msg.content)
  );
  
  if (hasCrisisKeywords) return 'crisis';
  
  const sentiments = recentMessages
    .filter(msg => msg.role === 'user')
    .map(msg => analyzeSentiment(msg.content));
  
  const avgSentiment = sentiments.reduce((sum, s) => {
    const values = { 'very-negative': 1, 'negative': 2, 'neutral': 3, 'positive': 4, 'very-positive': 5 };
    return sum + values[s.sentiment];
  }, 0) / sentiments.length;
  
  if (avgSentiment <= 1.5) return 'high';
  if (avgSentiment <= 2.5) return 'medium';
  return 'low';
};

export const extractTopics = (messages: ChatMessage[]): string[] => {
  const topicKeywords = {
    anxiety: ['anxious', 'anxiety', 'worried', 'panic', 'nervous', 'fear'],
    depression: ['depressed', 'depression', 'sad', 'hopeless', 'empty', 'worthless'],
    stress: ['stress', 'stressed', 'overwhelmed', 'pressure', 'burden'],
    sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'nightmares'],
    relationships: ['relationship', 'partner', 'family', 'friends', 'lonely', 'isolated'],
    work: ['work', 'job', 'career', 'workplace', 'boss', 'colleague']
  };
  
  const userMessages = messages.filter(msg => msg.role === 'user');
  const allText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  return Object.entries(topicKeywords)
    .filter(([topic, keywords]) => keywords.some(keyword => allText.includes(keyword)))
    .map(([topic]) => topic);
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
};

export const validateMessage = (content: string): { isValid: boolean; error?: string } => {
  if (!content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 1000) {
    return { isValid: false, error: 'Message too long (max 1000 characters)' };
  }
  
  return { isValid: true };
};

export const exportConversation = (messages: ChatMessage[], context: ConversationContext): string => {
  const exportData = {
    conversation: {
      sessionId: context.sessionId,
      userId: context.userId,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type
      })),
      context: {
        topics: context.topics,
        riskLevel: context.riskLevel,
        mood: context.mood
      }
    },
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const createConversationSummary = (messages: ChatMessage[], context: ConversationContext): {
  summary: string;
  keyTopics: string[];
  riskLevel: string;
  recommendedActions: string[];
} => {
  const userMessages = messages.filter(msg => msg.role === 'user');
  const topics = extractTopics(messages);
  const riskLevel = assessRiskLevel(messages);
  
  let recommendedActions: string[] = [];
  
  if (riskLevel === 'crisis') {
    recommendedActions = ['Immediate professional intervention', 'Crisis hotline contact', 'Safety planning'];
  } else if (riskLevel === 'high') {
    recommendedActions = ['Professional consultation recommended', 'Increased monitoring', 'Coping strategies'];
  } else {
    recommendedActions = ['Continue self-care practices', 'Regular check-ins', 'Resource exploration'];
  }
  
  return {
    summary: `Conversation with ${userMessages.length} user messages discussing ${topics.join(', ')}`,
    keyTopics: topics,
    riskLevel,
    recommendedActions
  };
};

// Mock component
export const AIAssistantView = {
  displayName: 'AIAssistantView',
  defaultProps: {
    readOnly: false
  }
};

export default AIAssistantView;









