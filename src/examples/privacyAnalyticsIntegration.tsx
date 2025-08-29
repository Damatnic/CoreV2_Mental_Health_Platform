/**
 * Privacy-Preserving Analytics Integration Examples
 *
 * Demonstrates how to integrate the privacy-preserving analytics system
 * with existing crisis intervention components while maintaining HIPAA compliance.
 *
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAnalyticsTracking } from '../hooks/useAnalyticsTracking';
import { privacyPreservingAnalyticsService } from '../services/privacyPreservingAnalyticsService';

interface AnalyticsIntegrationExampleProps {
  userId?: string;
  userType?: 'seeker' | 'helper' | 'admin';
  enableRealTimeTracking?: boolean;
}

/**
 * Example 1: Crisis Button with Privacy-Preserving Analytics
 */
export const CrisisButtonWithAnalytics: React.FC<{ onCrisisActivated: () => void }> = ({ 
  onCrisisActivated 
}) => {
  const { trackEvent, trackUserAction, isTrackingEnabled } = useAnalyticsTracking({
    enableAutoTracking: true,
    trackUserInteractions: true,
    respectDoNotTrack: true
  });

  const handleCrisisClick = () => {
    // Track crisis button activation (anonymized)
    if (isTrackingEnabled) {
      trackEvent({
        category: 'Crisis Intervention',
        action: 'emergency_button_activated',
        label: 'crisis_support_requested',
        customDimensions: {
          timestamp: new Date().toISOString(),
          urgency: 'high',
          source: 'crisis_button'
        }
      });
    }

    onCrisisActivated();
  };

  return (
    <button
      className="crisis-button bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
      onClick={handleCrisisClick}
      aria-label="Emergency crisis support"
    >
      🆘 Need Crisis Support
    </button>
  );
};

/**
 * Example 2: Mood Tracker with Privacy Analytics
 */
export const MoodTrackerWithAnalytics: React.FC = () => {
  const [mood, setMood] = useState<number>(5);
  const [hasConsent, setHasConsent] = useState(false);
  
  const { trackEvent, trackUserAction } = useAnalyticsTracking({
    enableAutoTracking: false,
    consentRequired: true
  });

  useEffect(() => {
    // Check for analytics consent
    setHasConsent(privacyPreservingAnalyticsService.hasUserConsent());
  }, []);

  const handleMoodSubmit = () => {
    // Only track if user has given consent
    if (hasConsent) {
      trackEvent({
        category: 'Wellness Tracking',
        action: 'mood_entry_submitted',
        value: mood,
        customDimensions: {
          mood_range: mood <= 3 ? 'low' : mood <= 7 ? 'medium' : 'high',
          entry_method: 'slider',
          session_type: 'regular_checkin'
        }
      });

      // Track user engagement without personal data
      trackUserAction('mood_tracking_completed', {
        engagement_level: 'active',
        feature_used: 'mood_slider'
      });
    }

    // Process mood data (separate from analytics)
    console.log('Mood submitted:', mood);
  };

  return (
    <div className="mood-tracker p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">How are you feeling today?</h3>
      
      <div className="mb-4">
        <input
          type="range"
          min="1"
          max="10"
          value={mood}
          onChange={(e) => setMood(parseInt(e.target.value))}
          className="w-full"
          aria-label="Mood level from 1 to 10"
        />
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>Very Low</span>
          <span>Neutral</span>
          <span>Very High</span>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className="text-2xl font-bold text-blue-600">{mood}/10</span>
      </div>

      <button
        onClick={handleMoodSubmit}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Submit Mood Entry
      </button>

      {!hasConsent && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Analytics disabled. Your privacy is protected. 
            <button 
              onClick={() => privacyPreservingAnalyticsService.requestConsent()}
              className="underline ml-1"
            >
              Enable anonymous insights
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Example 3: Chat Interface with Privacy Analytics
 */
export const ChatWithAnalytics: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'user' | 'ai' }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId] = useState(() => `chat_${Date.now()}`);

  const { trackEvent, trackUserAction, trackTiming } = useAnalyticsTracking({
    enableAutoTracking: true,
    trackPerformance: true
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageId = `msg_${Date.now()}`;
    const startTime = Date.now();

    // Add user message
    const userMessage = { id: messageId, text: inputValue, sender: 'user' as const };
    setMessages(prev => [...prev, userMessage]);

    // Track message sending (anonymized)
    trackEvent({
      category: 'Chat Interaction',
      action: 'message_sent',
      customDimensions: {
        message_length: inputValue.length,
        session_id: sessionId,
        message_type: 'text'
      }
    });

    // Clear input
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = { 
        id: `ai_${Date.now()}`, 
        text: "I understand you're reaching out. How can I help you today?", 
        sender: 'ai' as const 
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Track response timing
      const responseTime = Date.now() - startTime;
      trackTiming('Chat Performance', 'ai_response_time', responseTime);

      // Track AI interaction
      trackEvent({
        category: 'AI Interaction',
        action: 'response_generated',
        customDimensions: {
          response_time_ms: responseTime,
          session_id: sessionId
        }
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-interface max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <div className="chat-header bg-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="font-semibold">Crisis Support Chat</h3>
        <p className="text-sm opacity-90">Private & Secure</p>
      </div>

      <div className="chat-messages h-64 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 4: Analytics Dashboard for Privacy-Compliant Insights
 */
export const PrivacyAnalyticsDashboard: React.FC<AnalyticsIntegrationExampleProps> = ({
  userId,
  userType = 'seeker',
  enableRealTimeTracking = false
}) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { trackPageView, setUserProperties } = useAnalyticsTracking({
    enableAutoTracking: enableRealTimeTracking,
    trackPageViews: true,
    respectDoNotTrack: true
  });

  useEffect(() => {
    // Set user properties (anonymized)
    setUserProperties({
      userType,
      sessionId: `session_${Date.now()}`
    });

    // Track dashboard view
    trackPageView({
      path: '/analytics-dashboard',
      title: 'Privacy Analytics Dashboard'
    });

    // Load anonymized analytics data
    loadAnalyticsData();
  }, [userType, setUserProperties, trackPageView]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate loading anonymized analytics data
      const data = await privacyPreservingAnalyticsService.getAggregatedInsights({
        timeRange: '7d',
        includePersonalData: false,
        anonymizationLevel: 'high'
      });
      
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-dashboard p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Privacy-Compliant Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="metric-card p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800">User Engagement</h4>
          <p className="text-2xl font-bold text-blue-600">
            {analyticsData?.engagement?.score || '85%'}
          </p>
          <p className="text-sm text-blue-600">
            Anonymized engagement score
          </p>
        </div>

        <div className="metric-card p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800">Feature Usage</h4>
          <p className="text-2xl font-bold text-green-600">
            {analyticsData?.features?.active || '12'}
          </p>
          <p className="text-sm text-green-600">
            Active features used
          </p>
        </div>
      </div>

      <div className="privacy-notice p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-medium text-gray-800 mb-2">Privacy Notice</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• All data is anonymized and aggregated</li>
          <li>• No personal information is collected or stored</li>
          <li>• You can opt out at any time</li>
          <li>• Data is used only for improving user experience</li>
        </ul>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => privacyPreservingAnalyticsService.optOut()}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
          >
            Opt Out
          </button>
          <button
            onClick={() => privacyPreservingAnalyticsService.exportUserData()}
            className="text-xs bg-blue-200 hover:bg-blue-300 px-3 py-1 rounded transition-colors"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 5: A/B Testing with Privacy Preservation
 */
export const PrivacyAwareABTest: React.FC = () => {
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [hasParticipated, setHasParticipated] = useState(false);

  const { trackEvent } = useAnalyticsTracking();

  useEffect(() => {
    // Determine A/B test variant (privacy-preserving)
    const testVariant = Math.random() > 0.5 ? 'B' : 'A';
    setVariant(testVariant);

    // Track test participation (anonymized)
    trackEvent({
      category: 'A/B Test',
      action: 'test_exposure',
      label: 'crisis_button_design',
      customDimensions: {
        variant: testVariant,
        test_id: 'crisis_button_v2',
        anonymous_user_id: `anon_${Date.now()}`
      }
    });
  }, [trackEvent]);

  const handleButtonClick = () => {
    setHasParticipated(true);

    // Track conversion (anonymized)
    trackEvent({
      category: 'A/B Test',
      action: 'conversion',
      label: 'crisis_button_design',
      customDimensions: {
        variant,
        test_id: 'crisis_button_v2',
        conversion_type: 'button_click'
      }
    });
  };

  return (
    <div className="ab-test-example p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">A/B Test Example</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Testing crisis button design (Variant {variant})
        </p>
        
        {variant === 'A' ? (
          <button
            onClick={handleButtonClick}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            🆘 Crisis Support
          </button>
        ) : (
          <button
            onClick={handleButtonClick}
            className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold hover:bg-orange-700 transition-colors shadow-lg"
          >
            ⚠️ Emergency Help
          </button>
        )}
      </div>

      {hasParticipated && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Thank you for participating! Your anonymous feedback helps improve the experience.
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>• No personal data collected</p>
        <p>• Results are aggregated and anonymized</p>
        <p>• Used only for UX improvements</p>
      </div>
    </div>
  );
};

/**
 * Main Integration Example Component
 */
const PrivacyAnalyticsIntegrationExample: React.FC<AnalyticsIntegrationExampleProps> = (props) => {
  return (
    <div className="privacy-analytics-examples space-y-8 max-w-4xl mx-auto p-6">
      <div className="header text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Privacy-Preserving Analytics Integration
        </h1>
        <p className="text-gray-600">
          Examples of HIPAA-compliant analytics in mental health applications
        </p>
      </div>

      <div className="examples-grid space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Crisis Intervention</h2>
          <CrisisButtonWithAnalytics onCrisisActivated={() => console.log('Crisis activated')} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Wellness Tracking</h2>
          <MoodTrackerWithAnalytics />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Chat Interface</h2>
          <ChatWithAnalytics />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
          <PrivacyAnalyticsDashboard {...props} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">A/B Testing</h2>
          <PrivacyAwareABTest />
        </section>
      </div>
    </div>
  );
};

export default PrivacyAnalyticsIntegrationExample;
