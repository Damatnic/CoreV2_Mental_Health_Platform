/**
 * Chat Store - Mental Health Platform
 *
 * Zustand store for managing chat sessions, messages, and real-time communication
 * in the mental health platform. Handles peer support, crisis intervention, and
 * therapeutic conversations with full offline support and message persistence.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// Types and Interfaces
export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'crisis_alert' | 'system';
  isEdited: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  attachments?: ChatAttachment[];
  crisisDetected?: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ChatSession {
  id: string;
  type: 'peer_support' | 'crisis_intervention' | 'therapeutic' | 'group';
  participants: ChatParticipant[];
  messages: ChatMessage[];
  status: 'active' | 'paused' | 'ended' | 'archived';
  createdAt: Date;
  lastActivity: Date;
  metadata: {
    topic?: string;
    tags?: string[];
    crisis_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
    therapeutic_notes?: string;
    session_goals?: string[];
  };
  settings: {
    crisis_monitoring: boolean;
    auto_moderation: boolean;
    message_persistence: boolean;
    notification_enabled: boolean;
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: 'peer' | 'helper' | 'therapist' | 'moderator' | 'crisis_counselor';
  status: 'online' | 'offline' | 'away' | 'busy';
  isTyping: boolean;
  lastSeen: Date;
  permissions: {
    send_messages: boolean;
    send_attachments: boolean;
    moderate_chat: boolean;
    access_crisis_tools: boolean;
  };
}

export interface ChatNotification {
  id: string;
  sessionId: string;
  type: 'new_message' | 'crisis_alert' | 'user_joined' | 'user_left' | 'typing';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
}

// Store State Interface
export interface ChatStoreState {
  // Core Data
  sessions: Record<string, ChatSession>;
  activeSessionId: string | null;
  notifications: ChatNotification[];
  
  // UI State
  isConnected: boolean;
  isTyping: Record<string, boolean>; // sessionId -> isTyping
  typingUsers: Record<string, string[]>; // sessionId -> userIds
  unreadCounts: Record<string, number>; // sessionId -> count
  
  // Loading States
  isLoadingSessions: boolean;
  isSendingMessage: boolean;
  isJoiningSessions: boolean;
  
  // Error States
  lastError: string | null;
  connectionError: string | null;
  messageError: string | null;
  
  // Settings
  preferences: {
    soundEnabled: boolean;
    desktopNotifications: boolean;
    autoScrollToBottom: boolean;
    showTypingIndicators: boolean;
    messagePreview: boolean;
    crisisAutoAlert: boolean;
  };
  
  // Performance
  metrics: {
    messagesPerSecond: number;
    connectionUptime: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
    averageResponseTime: number;
  };
}

// Store Actions Interface  
export interface ChatStoreActions {
  // Session Management
  createSession: (type: ChatSession['type'], participants: string[], metadata?: Partial<ChatSession['metadata']>) => Promise<ChatSession>;
  joinSession: (sessionId: string) => Promise<boolean>;
  leaveSession: (sessionId: string) => Promise<boolean>;
  setActiveSession: (sessionId: string | null) => void;
  updateSessionSettings: (sessionId: string, settings: Partial<ChatSession['settings']>) => void;
  
  // Message Management
  sendMessage: (sessionId: string, content: string, type?: ChatMessage['type'], attachments?: ChatAttachment[]) => Promise<ChatMessage>;
  editMessage: (sessionId: string, messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (sessionId: string, messageId: string) => Promise<boolean>;
  reactToMessage: (sessionId: string, messageId: string, emoji: string) => Promise<boolean>;
  
  // Real-time Features
  setTypingStatus: (sessionId: string, isTyping: boolean) => void;
  updateUserStatus: (userId: string, status: ChatParticipant['status']) => void;
  
  // Notifications
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (sessionId?: string) => void;
  addNotification: (notification: Omit<ChatNotification, 'id' | 'timestamp'>) => void;
  clearNotifications: (sessionId?: string) => void;
  
  // Crisis Management
  triggerCrisisAlert: (sessionId: string, message: string, severity: 'medium' | 'high' | 'critical') => Promise<void>;
  escalateToCrisisCounselor: (sessionId: string) => Promise<boolean>;
  
  // Connection Management
  connect: () => Promise<boolean>;
  disconnect: () => void;
  reconnect: () => Promise<boolean>;
  
  // Utilities
  searchMessages: (query: string, sessionId?: string) => ChatMessage[];
  exportChatHistory: (sessionId: string) => string;
  clearChatHistory: (sessionId: string) => Promise<boolean>;
  updatePreferences: (preferences: Partial<ChatStoreState['preferences']>) => void;
  
  // Error Handling
  clearErrors: () => void;
  handleConnectionError: (error: string) => void;
  handleMessageError: (error: string) => void;
}

// Combined Store Type
export type ChatStore = ChatStoreState & ChatStoreActions;

// Default State
const defaultState: ChatStoreState = {
  sessions: {},
  activeSessionId: null,
  notifications: [],
  isConnected: false,
  isTyping: {},
  typingUsers: {},
  unreadCounts: {},
  isLoadingSessions: false,
  isSendingMessage: false,
  isJoiningSessions: false,
  lastError: null,
  connectionError: null,
  messageError: null,
  preferences: {
    soundEnabled: true,
    desktopNotifications: true,
    autoScrollToBottom: true,
    showTypingIndicators: true,
    messagePreview: true,
    crisisAutoAlert: true
  },
  metrics: {
    messagesPerSecond: 0,
    connectionUptime: 0,
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    averageResponseTime: 0
  }
};

// Utility Functions
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const createChatMessage = (
  sessionId: string,
  senderId: string,
  content: string,
  type: ChatMessage['type'] = 'text',
  attachments: ChatAttachment[] = []
): ChatMessage => ({
  id: generateId(),
  sessionId,
  senderId,
  content,
  timestamp: new Date(),
  type,
  isEdited: false,
  attachments,
  crisisDetected: false,
  priority: 'medium',
  deliveryStatus: 'sending'
});

const createNotification = (
  sessionId: string,
  type: ChatNotification['type'],
  title: string,
  message: string,
  priority: ChatNotification['priority'] = 'medium'
): ChatNotification => ({
  id: generateId(),
  sessionId,
  type,
  title,
  message,
  priority,
  timestamp: new Date(),
  isRead: false,
  actionRequired: priority === 'critical'
});

// Mock API functions (replace with real implementations)
const mockApiCall = async <T>(data: T, delay: number = 500): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return data;
};

// Create the Zustand Store
export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,

        // Session Management
        createSession: async (type, participantIds, metadata = {}) => {
          set({ isLoadingSessions: true, lastError: null });
          
          try {
            const participants: ChatParticipant[] = participantIds.map(id => ({
              id,
              name: `User ${id}`,
              role: 'peer',
              status: 'online',
              isTyping: false,
              lastSeen: new Date(),
              permissions: {
                send_messages: true,
                send_attachments: true,
                moderate_chat: false,
                access_crisis_tools: type === 'crisis_intervention'
              }
            }));

            const newSession: ChatSession = {
              id: generateId(),
              type,
              participants,
              messages: [],
              status: 'active',
              createdAt: new Date(),
              lastActivity: new Date(),
              metadata: {
                crisis_level: 'none',
                ...metadata
              },
              settings: {
                crisis_monitoring: type === 'crisis_intervention' || type === 'therapeutic',
                auto_moderation: true,
                message_persistence: true,
                notification_enabled: true
              }
            };

            // Simulate API call
            const session = await mockApiCall(newSession);
            
            set(state => ({
              sessions: {
                ...state.sessions,
                [session.id]: session
              },
              activeSessionId: session.id,
              isLoadingSessions: false
            }));

            // Add notification
            get().addNotification({
              sessionId: session.id,
              type: 'user_joined',
              title: 'Session Created',
              message: `New ${type.replace('_', ' ')} session started`,
              priority: 'medium',
              isRead: false,
              actionRequired: false
            });

            return session;
          } catch (error) {
            set({ 
              lastError: error instanceof Error ? error.message : 'Failed to create session',
              isLoadingSessions: false 
            });
            throw error;
          }
        },

        joinSession: async (sessionId) => {
          set({ isJoiningSessions: true, lastError: null });
          
          try {
            // Simulate API call
            await mockApiCall(true);
            
            set(state => ({
              activeSessionId: sessionId,
              isJoiningSessions: false
            }));

            return true;
          } catch (error) {
            set({ 
              lastError: error instanceof Error ? error.message : 'Failed to join session',
              isJoiningSessions: false 
            });
            return false;
          }
        },

        leaveSession: async (sessionId) => {
          try {
            await mockApiCall(true);
            
            set(state => ({
              activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
              isTyping: {
                ...state.isTyping,
                [sessionId]: false
              }
            }));

            return true;
          } catch (error) {
            set({ lastError: error instanceof Error ? error.message : 'Failed to leave session' });
            return false;
          }
        },

        setActiveSession: (sessionId) => {
          set({ activeSessionId: sessionId });
          
          if (sessionId) {
            // Mark messages as read when switching to session
            set(state => ({
              unreadCounts: {
                ...state.unreadCounts,
                [sessionId]: 0
              }
            }));
          }
        },

        updateSessionSettings: (sessionId, newSettings) => {
          set(state => ({
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...state.sessions[sessionId],
                settings: {
                  ...state.sessions[sessionId].settings,
                  ...newSettings
                }
              }
            }
          }));
        },

        // Message Management
        sendMessage: async (sessionId, content, type = 'text', attachments = []) => {
          const currentUser = 'current-user-id'; // Replace with actual user ID
          const message = createChatMessage(sessionId, currentUser, content, type, attachments);
          
          set({ isSendingMessage: true, messageError: null });
          
          try {
            // Add message optimistically
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  messages: [...state.sessions[sessionId].messages, message],
                  lastActivity: new Date()
                }
              }
            }));

            // Simulate API call
            const sentMessage = await mockApiCall({
              ...message,
              deliveryStatus: 'sent' as const
            });

            // Update message status
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  messages: state.sessions[sessionId].messages.map(msg =>
                    msg.id === sentMessage.id ? sentMessage : msg
                  )
                }
              },
              metrics: {
                ...state.metrics,
                totalMessagesSent: state.metrics.totalMessagesSent + 1
              },
              isSendingMessage: false
            }));

            return sentMessage;
          } catch (error) {
            // Mark message as failed
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  messages: state.sessions[sessionId].messages.map(msg =>
                    msg.id === message.id ? { ...msg, deliveryStatus: 'failed' } : msg
                  )
                }
              },
              messageError: error instanceof Error ? error.message : 'Failed to send message',
              isSendingMessage: false
            }));
            throw error;
          }
        },

        editMessage: async (sessionId, messageId, newContent) => {
          try {
            await mockApiCall(true);
            
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  messages: state.sessions[sessionId].messages.map(msg =>
                    msg.id === messageId ? {
                      ...msg,
                      content: newContent,
                      isEdited: true,
                      editedAt: new Date()
                    } : msg
                  )
                }
              }
            }));

            return true;
          } catch (error) {
            set({ messageError: error instanceof Error ? error.message : 'Failed to edit message' });
            return false;
          }
        },

        deleteMessage: async (sessionId, messageId) => {
          try {
            await mockApiCall(true);
            
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  messages: state.sessions[sessionId].messages.filter(msg => msg.id !== messageId)
                }
              }
            }));

            return true;
          } catch (error) {
            set({ messageError: error instanceof Error ? error.message : 'Failed to delete message' });
            return false;
          }
        },

        reactToMessage: async (sessionId, messageId, emoji) => {
          const currentUser = 'current-user-id';
          
          try {
            await mockApiCall(true);
            
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  messages: state.sessions[sessionId].messages.map(msg =>
                    msg.id === messageId ? {
                      ...msg,
                      reactions: [
                        ...(msg.reactions || []).filter(r => r.userId !== currentUser),
                        { userId: currentUser, emoji, timestamp: new Date() }
                      ]
                    } : msg
                  )
                }
              }
            }));

            return true;
          } catch (error) {
            set({ messageError: error instanceof Error ? error.message : 'Failed to react to message' });
            return false;
          }
        },

        // Real-time Features
        setTypingStatus: (sessionId, isTyping) => {
          set(state => ({
            isTyping: {
              ...state.isTyping,
              [sessionId]: isTyping
            }
          }));
        },

        updateUserStatus: (userId, status) => {
          set(state => ({
            sessions: Object.keys(state.sessions).reduce((acc, sessionId) => {
              acc[sessionId] = {
                ...state.sessions[sessionId],
                participants: state.sessions[sessionId].participants.map(p =>
                  p.id === userId ? { ...p, status } : p
                )
              };
              return acc;
            }, {} as Record<string, ChatSession>)
          }));
        },

        // Notifications
        markNotificationAsRead: (notificationId) => {
          set(state => ({
            notifications: state.notifications.map(notif =>
              notif.id === notificationId ? { ...notif, isRead: true } : notif
            )
          }));
        },

        markAllNotificationsAsRead: (sessionId) => {
          set(state => ({
            notifications: state.notifications.map(notif =>
              !sessionId || notif.sessionId === sessionId ? { ...notif, isRead: true } : notif
            )
          }));
        },

        addNotification: (notification) => {
          const fullNotification = createNotification(
            notification.sessionId,
            notification.type,
            notification.title,
            notification.message,
            notification.priority
          );
          
          set(state => ({
            notifications: [fullNotification, ...state.notifications].slice(0, 100) // Keep last 100
          }));
        },

        clearNotifications: (sessionId) => {
          set(state => ({
            notifications: sessionId 
              ? state.notifications.filter(notif => notif.sessionId !== sessionId)
              : []
          }));
        },

        // Crisis Management
        triggerCrisisAlert: async (sessionId, message, severity) => {
          try {
            await mockApiCall(true);
            
            // Add crisis notification
            get().addNotification({
              sessionId,
              type: 'crisis_alert',
              title: 'Crisis Alert Triggered',
              message: `${severity.toUpperCase()} crisis detected: ${message}`,
              priority: 'critical',
              isRead: false,
              actionRequired: true
            });

            // Update session crisis level
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  metadata: {
                    ...state.sessions[sessionId].metadata,
                    crisis_level: severity
                  }
                }
              }
            }));

          } catch (error) {
            set({ lastError: error instanceof Error ? error.message : 'Failed to trigger crisis alert' });
          }
        },

        escalateToCrisisCounselor: async (sessionId) => {
          try {
            await mockApiCall(true);
            
            get().addNotification({
              sessionId,
              type: 'crisis_alert',
              title: 'Crisis Escalated',
              message: 'A crisis counselor has been notified and will join soon',
              priority: 'critical',
              isRead: false,
              actionRequired: false
            });

            return true;
          } catch (error) {
            set({ lastError: error instanceof Error ? error.message : 'Failed to escalate to crisis counselor' });
            return false;
          }
        },

        // Connection Management
        connect: async () => {
          try {
            await mockApiCall(true);
            set({ isConnected: true, connectionError: null });
            return true;
          } catch (error) {
            set({ 
              isConnected: false, 
              connectionError: error instanceof Error ? error.message : 'Connection failed' 
            });
            return false;
          }
        },

        disconnect: () => {
          set({ 
            isConnected: false, 
            activeSessionId: null,
            isTyping: {},
            connectionError: null 
          });
        },

        reconnect: async () => {
          set({ connectionError: null });
          return await get().connect();
        },

        // Utilities
        searchMessages: (query, sessionId) => {
          const state = get();
          const sessionsToSearch = sessionId 
            ? [state.sessions[sessionId]].filter(Boolean)
            : Object.values(state.sessions);

          return sessionsToSearch.flatMap(session =>
            session.messages.filter(message =>
              message.content.toLowerCase().includes(query.toLowerCase())
            )
          );
        },

        exportChatHistory: (sessionId) => {
          const state = get();
          const session = state.sessions[sessionId];
          
          if (!session) return '';

          const header = `Chat History - ${session.type}\nSession ID: ${sessionId}\nCreated: ${session.createdAt.toLocaleString()}\n${'='.repeat(50)}\n\n`;
          const messages = session.messages.map(msg =>
            `[${msg.timestamp.toLocaleString()}] ${msg.senderId}: ${msg.content}`
          ).join('\n');

          return header + messages;
        },

        clearChatHistory: async (sessionId) => {
          try {
            await mockApiCall(true);
            
            set(state => ({
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...state.sessions[sessionId],
                  messages: []
                }
              }
            }));

            return true;
          } catch (error) {
            set({ lastError: error instanceof Error ? error.message : 'Failed to clear chat history' });
            return false;
          }
        },

        updatePreferences: (newPreferences) => {
          set(state => ({
            preferences: {
              ...state.preferences,
              ...newPreferences
            }
          }));
        },

        // Error Handling
        clearErrors: () => {
          set({ 
            lastError: null, 
            connectionError: null, 
            messageError: null 
          });
        },

        handleConnectionError: (error) => {
          set({ 
            connectionError: error, 
            isConnected: false 
          });
        },

        handleMessageError: (error) => {
          set({ messageError: error });
        }
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          sessions: state.sessions,
          preferences: state.preferences,
          notifications: state.notifications.slice(0, 50) // Persist only recent notifications
        })
      }
    ),
    { name: 'chat-store' }
  )
);

export default useChatStore;