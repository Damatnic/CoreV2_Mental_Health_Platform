/**
 * Mood Sharing Component
 * Allows users to share their moods with the community and view others' moods
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageSquare, Clock, Users, Share2, X, Lock, Globe } from 'lucide-react';

// Internal realtime service for mood sharing
class RealtimeService {
  private listeners = new Map<string, Set<Function>>();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.CONNECTING) return;
    
    this.isConnecting = true;
    
    try {
      // Use mock WebSocket for development
      this.ws = {
        readyState: WebSocket.OPEN,
        send: (data: string) => {
          console.log('Mock WebSocket send:', data);
        },
        close: () => {
          console.log('Mock WebSocket close');
        },
        addEventListener: () => {},
        removeEventListener: () => {}
      } as any;
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect();
    }, Math.pow(2, this.reconnectAttempts) * 1000);
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  async sendMoodUpdate(moodData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'mood-update',
            data: moodData
          }));
          
          // Simulate broadcast to other users
          setTimeout(() => {
            if (moodData.isPublic) {
              this.emit('mood-update', {
                userId: 'mock-user-id',
                username: moodData.username || 'Anonymous',
                mood: moodData.mood,
                timestamp: Date.now(),
                message: moodData.message
              });
            }
          }, 100);
          
          resolve();
        } else {
          reject(new Error('WebSocket not connected'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    this.ws?.close();
    this.listeners.clear();
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

// Time formatting utility
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
};

// Types
interface MoodOption {
  value: number;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

interface SharedMood {
  userId: string;
  username: string;
  mood: {
    value: number;
    label: string;
    emoji?: string;
    color?: string;
  };
  timestamp: number;
  message?: string;
  isPublic?: boolean;
}

interface MoodSharingProps {
  userId: string;
  username: string;
  showFeed?: boolean;
  allowSharing?: boolean;
  className?: string;
  onMoodShared?: (mood: SharedMood) => void;
  initialMoods?: SharedMood[];
}

// Mood options with improved styling
const MOOD_OPTIONS: MoodOption[] = [
  { 
    value: 1, 
    label: 'Very Sad', 
    emoji: '😢', 
    color: '#ef4444',
    bgColor: '#fef2f2'
  },
  { 
    value: 2, 
    label: 'Sad', 
    emoji: '😔', 
    color: '#f97316',
    bgColor: '#fff7ed'
  },
  { 
    value: 3, 
    label: 'Neutral', 
    emoji: '😐', 
    color: '#f59e0b',
    bgColor: '#fffbeb'
  },
  { 
    value: 4, 
    label: 'Good', 
    emoji: '🙂', 
    color: '#84cc16',
    bgColor: '#f7fee7'
  },
  { 
    value: 5, 
    label: 'Great', 
    emoji: '😊', 
    color: '#10b981',
    bgColor: '#ecfdf5'
  }
];

export const MoodSharing: React.FC<MoodSharingProps> = ({
  userId,
  username,
  showFeed = true,
  allowSharing = true,
  className = '',
  onMoodShared,
  initialMoods = []
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [moodMessage, setMoodMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [sharedMoods, setSharedMoods] = useState<SharedMood[]>(initialMoods);
  const [showShareForm, setShowShareForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to mood updates
  useEffect(() => {
    const unsubscribe = realtimeService.on('mood-update', (data: SharedMood) => {
      setSharedMoods(prev => {
        const updated = [data, ...prev];
        return updated.slice(0, 50); // Keep last 50 moods
      });
    });

    return unsubscribe;
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [moodMessage]);

  const handleMoodSelect = useCallback((mood: MoodOption) => {
    setSelectedMood(mood);
    if (!showShareForm) {
      setShowShareForm(true);
    }
  }, [showShareForm]);

  const handleShareMood = useCallback(async () => {
    if (!selectedMood) return;

    setIsSharing(true);

    try {
      const moodData = {
        mood: {
          value: selectedMood.value,
          label: selectedMood.label,
          emoji: selectedMood.emoji,
          color: selectedMood.color
        },
        message: moodMessage.trim(),
        isPublic,
        username
      };

      await realtimeService.sendMoodUpdate(moodData);

      // Create shared mood object
      const sharedMood: SharedMood = {
        userId,
        username,
        mood: {
          value: selectedMood.value,
          label: selectedMood.label,
          emoji: selectedMood.emoji,
          color: selectedMood.color
        },
        timestamp: Date.now(),
        message: moodMessage.trim() || undefined,
        isPublic
      };

      // Add to local feed if public
      if (isPublic) {
        setSharedMoods(prev => [sharedMood, ...prev.slice(0, 49)]);
      }

      // Callback for parent component
      onMoodShared?.(sharedMood);

      // Reset form
      setSelectedMood(null);
      setMoodMessage('');
      setShowShareForm(false);
      setIsPublic(false);
    } catch (error) {
      console.error('Failed to share mood:', error);
    } finally {
      setIsSharing(false);
    }
  }, [selectedMood, moodMessage, isPublic, username, userId, onMoodShared]);

  const handleCancel = useCallback(() => {
    setSelectedMood(null);
    setMoodMessage('');
    setShowShareForm(false);
    setIsPublic(false);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Mood selection component
  const MoodSelection: React.FC = () => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          How are you feeling?
        </h3>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.value}
            type="button"
            className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
              selectedMood?.value === mood.value
                ? `border-2 shadow-md`
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              backgroundColor: selectedMood?.value === mood.value ? mood.bgColor : 'white',
              borderColor: selectedMood?.value === mood.value ? mood.color : undefined
            }}
            onClick={() => handleMoodSelect(mood)}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{mood.emoji}</div>
              <div className={`text-xs font-medium ${
                selectedMood?.value === mood.value ? 'text-gray-800' : 'text-gray-600'
              }`}>
                {mood.label}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Share form component
  const ShareForm: React.FC = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ 
            backgroundColor: selectedMood?.bgColor,
            border: `2px solid ${selectedMood?.color}`
          }}
        >
          {selectedMood?.emoji}
        </div>
        <div>
          <div className="font-medium text-gray-900">
            Feeling {selectedMood?.label.toLowerCase()}
          </div>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Share what's on your mind... (optional)"
        value={moodMessage}
        onChange={(e) => setMoodMessage(e.target.value)}
        rows={2}
        maxLength={280}
      />
      
      <div className="text-right text-xs text-gray-500 mt-1">
        {moodMessage.length}/280
      </div>

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 flex items-center gap-1">
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isPublic ? 'Share with community' : 'Keep private'}
          </span>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSharing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleShareMood}
            disabled={isSharing}
          >
            {isSharing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sharing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Mood
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Mood feed component
  const MoodFeed: React.FC = () => {
    const displayMoods = isExpanded ? sharedMoods : sharedMoods.slice(0, 5);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Community Moods
            </h3>
            {sharedMoods.length > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                {sharedMoods.length}
              </span>
            )}
          </div>
          
          {sharedMoods.length > 5 && (
            <button
              onClick={toggleExpanded}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isExpanded ? 'Show Less' : `Show All (${sharedMoods.length})`}
            </button>
          )}
        </div>

        {displayMoods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No moods shared yet.</p>
            <p className="text-sm">Be the first to share how you're feeling!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayMoods.map((sharedMood, index) => (
              <div
                key={`${sharedMood.userId}-${sharedMood.timestamp}-${index}`}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ 
                      backgroundColor: MOOD_OPTIONS.find(m => m.value === sharedMood.mood.value)?.bgColor || '#f3f4f6',
                      border: `2px solid ${sharedMood.mood.color || '#6b7280'}`
                    }}
                  >
                    {sharedMood.mood.emoji || '😊'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {sharedMood.username}
                      </span>
                      <span className="text-sm text-gray-600">
                        is feeling {sharedMood.mood.label.toLowerCase()}
                      </span>
                    </div>
                    
                    {sharedMood.message && (
                      <p className="text-gray-700 mb-2">{sharedMood.message}</p>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(sharedMood.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`mood-sharing ${className}`}>
      {allowSharing && <MoodSelection />}
      {showShareForm && selectedMood && <ShareForm />}
      {showFeed && <MoodFeed />}
    </div>
  );
};

// Export the realtime service for external use
export const getRealtimeService = () => realtimeService;

export default MoodSharing;

// Export types for external use
export type { MoodOption, SharedMood, MoodSharingProps };