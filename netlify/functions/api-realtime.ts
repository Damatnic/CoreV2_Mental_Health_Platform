/**
 * Real-time Communication API for Netlify Functions
 * Uses Pusher for WebSocket functionality in serverless environment
 */

import { Handler } from '@netlify/functions';
import Pusher from 'pusher';
import PusherClient from 'pusher-js';
import { getDb } from './utils/db-connection';
import { verifyToken } from './utils/auth';

// Initialize Pusher server (for sending messages)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'demo-app-id',
  key: process.env.PUSHER_KEY || 'demo-key',
  secret: process.env.PUSHER_SECRET || 'demo-secret',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

// Crisis detection keywords for real-time alerts
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'not worth living',
  'hurt myself', 'self harm', 'cutting', 'overdose',
  'no one cares', 'better off dead', 'goodbye forever'
];

interface RealtimeMessage {
  type: 'message' | 'notification' | 'presence' | 'crisis_alert' | 'mood_update' | 'typing';
  channel: string;
  data: any;
  userId?: string;
  timestamp: number;
}

interface PresenceData {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  mood?: string;
}

interface CrisisAlert {
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  location?: string;
  supportTeamNotified: boolean;
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Parse request path
  const path = event.path.replace('/api/realtime', '');
  const segments = path.split('/').filter(Boolean);
  const endpoint = segments[0] || '';

  try {
    // Verify authentication
    const authHeader = event.headers.authorization;
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
      userId = decoded.sub;
    }

    const db = getDb();

    switch (event.httpMethod) {
      case 'GET':
        // Get Pusher configuration for client
        if (endpoint === 'config') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              key: process.env.PUSHER_KEY || 'demo-key',
              cluster: process.env.PUSHER_CLUSTER || 'us2',
              authEndpoint: '/.netlify/functions/api-realtime/auth',
              auth: {
                headers: {
                  'Authorization': authHeader || ''
                }
              }
            })
          };
        }

        // Get active users (presence)
        if (endpoint === 'presence') {
          const activeUsers = await db('user_presence')
            .where('last_seen', '>', new Date(Date.now() - 5 * 60 * 1000)) // Active in last 5 minutes
            .select('user_id', 'username', 'status', 'last_seen', 'current_mood');

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ activeUsers })
          };
        }

        // Get recent notifications
        if (endpoint === 'notifications' && userId) {
          const notifications = await db('notifications')
            .where('user_id', userId)
            .where('read', false)
            .orderBy('created_at', 'desc')
            .limit(20);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ notifications })
          };
        }

        break;

      case 'POST':
        const body = JSON.parse(event.body || '{}');

        // Pusher authentication for private channels
        if (endpoint === 'auth') {
          if (!userId) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ error: 'Authentication required' })
            };
          }

          const socketId = body.socket_id;
          const channel = body.channel_name;

          // Only allow users to subscribe to their own private channels or public channels
          if (channel.startsWith('private-user-') && !channel.includes(userId)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Access denied to this channel' })
            };
          }

          // Generate auth signature for Pusher
          const auth = pusher.authenticate(socketId, channel, {
            user_id: userId,
            user_info: {
              name: body.username || 'Anonymous'
            }
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(auth)
          };
        }

        // Send message
        if (endpoint === 'message') {
          const { channel, message, type = 'message' } = body;

          // Check for crisis keywords
          const containsCrisisKeyword = CRISIS_KEYWORDS.some(keyword => 
            message.toLowerCase().includes(keyword)
          );

          if (containsCrisisKeyword) {
            // Trigger crisis alert
            await handleCrisisAlert({
              userId: userId || 'anonymous',
              message,
              severity: 'high',
              channel
            }, db);
          }

          // Store message in database
          if (userId) {
            await db('messages').insert({
              user_id: userId,
              channel,
              content: message,
              type,
              created_at: new Date()
            });
          }

          // Send via Pusher
          await pusher.trigger(channel, type, {
            userId,
            message,
            timestamp: Date.now(),
            id: Math.random().toString(36).substring(2, 11)
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }

        // Update presence
        if (endpoint === 'presence') {
          const { status, mood } = body;

          if (userId) {
            await db('user_presence')
              .insert({
                user_id: userId,
                status,
                current_mood: mood,
                last_seen: new Date()
              })
              .onConflict('user_id')
              .merge();

            // Broadcast presence update
            await pusher.trigger('presence-global', 'presence-update', {
              userId,
              status,
              mood,
              timestamp: Date.now()
            });
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }

        // Send notification
        if (endpoint === 'notify') {
          const { targetUserId, title, message, urgency = 'normal', type = 'info' } = body;

          // Store notification
          const [notification] = await db('notifications')
            .insert({
              user_id: targetUserId,
              sender_id: userId,
              title,
              message,
              type,
              urgency,
              read: false,
              created_at: new Date()
            })
            .returning('*');

          // Send real-time notification
          await pusher.trigger(`private-user-${targetUserId}`, 'notification', {
            id: notification.id,
            title,
            message,
            type,
            urgency,
            senderId: userId,
            timestamp: Date.now()
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, notificationId: notification.id })
          };
        }

        // Typing indicator
        if (endpoint === 'typing') {
          const { channel, isTyping } = body;

          await pusher.trigger(channel, 'typing', {
            userId,
            isTyping,
            timestamp: Date.now()
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }

        // Share mood update
        if (endpoint === 'mood') {
          const { mood, isPublic = false } = body;

          if (userId) {
            // Store mood update
            await db('mood_entries').insert({
              user_id: userId,
              mood_value: mood.value,
              mood_label: mood.label,
              is_public: isPublic,
              created_at: new Date()
            });

            // Update current mood in presence
            await db('user_presence')
              .where('user_id', userId)
              .update({ current_mood: mood.label });

            // Broadcast if public
            if (isPublic) {
              await pusher.trigger('mood-updates', 'mood-shared', {
                userId,
                mood,
                timestamp: Date.now()
              });
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }

        // Crisis alert
        if (endpoint === 'crisis') {
          const { severity, message, location } = body;

          const alert = await handleCrisisAlert({
            userId: userId || 'anonymous',
            severity,
            message,
            location
          }, db);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, alertId: alert.id })
          };
        }

        break;

      case 'PUT':
        // Mark notification as read
        if (endpoint === 'notifications' && segments[1] === 'read') {
          const notificationId = segments[2];
          
          if (userId) {
            await db('notifications')
              .where('id', notificationId)
              .where('user_id', userId)
              .update({ read: true, read_at: new Date() });
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }

        break;

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Realtime API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

// Helper function to handle crisis alerts
async function handleCrisisAlert(
  alert: {
    userId: string;
    severity: string;
    message: string;
    location?: string;
    channel?: string;
  },
  db: any
) {
  // Store crisis alert
  const [savedAlert] = await db('crisis_alerts')
    .insert({
      user_id: alert.userId,
      severity: alert.severity,
      message: alert.message,
      location: alert.location,
      status: 'active',
      created_at: new Date()
    })
    .returning('*');

  // Notify support team via multiple channels
  const supportChannels = [
    'crisis-support-team',
    'emergency-response',
    `private-helper-alerts`
  ];

  for (const channel of supportChannels) {
    await pusher.trigger(channel, 'crisis-alert', {
      alertId: savedAlert.id,
      userId: alert.userId,
      severity: alert.severity,
      message: alert.message,
      location: alert.location,
      timestamp: Date.now(),
      requiresImmediate: alert.severity === 'critical' || alert.severity === 'high'
    });
  }

  // Send notification to nearby helpers if location is provided
  if (alert.location) {
    // This would integrate with a geolocation service
    // For now, notify all available helpers
    const availableHelpers = await db('helpers')
      .where('status', 'available')
      .where('certified', true)
      .select('user_id');

    for (const helper of availableHelpers) {
      await pusher.trigger(`private-user-${helper.user_id}`, 'crisis-nearby', {
        alertId: savedAlert.id,
        severity: alert.severity,
        distance: 'nearby', // Would calculate actual distance
        timestamp: Date.now()
      });
    }
  }

  // Log the alert for monitoring
  await db('crisis_logs').insert({
    alert_id: savedAlert.id,
    action: 'alert_created',
    details: JSON.stringify(alert),
    created_at: new Date()
  });

  return savedAlert;
}