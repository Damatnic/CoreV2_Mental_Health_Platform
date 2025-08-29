# WebSocket Real-time Features Implementation

## Overview

This document describes the real-time communication features implemented for the CoreV2 Mental Health Platform using a serverless-compatible architecture optimized for Netlify deployment.

## Architecture

### Technology Stack

- **Pusher**: WebSocket service provider for serverless environments
- **Netlify Functions**: Serverless API endpoints
- **React Hooks**: Client-side real-time state management
- **Fallback**: WebSocket service for local development

### Why Pusher?

Netlify's serverless architecture doesn't support persistent WebSocket connections. Pusher provides:
- Managed WebSocket infrastructure
- Automatic scaling
- Global presence
- Channel-based messaging
- Presence tracking
- Private/public channels
- Client libraries for all platforms

## Features Implemented

### 1. Real-time Notifications

**Component**: `RealtimeNotifications.tsx`

- Browser push notifications
- In-app notification center
- Urgency levels (low, normal, high, critical)
- Crisis alerts with special handling
- Notification persistence
- Read/unread tracking
- Auto-dismiss for non-urgent messages

**Usage**:
```tsx
import { RealtimeNotifications } from './components/RealtimeNotifications';

<RealtimeNotifications 
  userId="user123"
  position="top-right"
  maxVisible={3}
  autoHide={true}
  autoHideDelay={5000}
/>
```

### 2. Live Chat

**Component**: `LiveChat.tsx`

- Real-time messaging
- Typing indicators
- Emoji support
- Message history
- Auto-scroll
- Mobile responsive
- Crisis keyword detection

**Usage**:
```tsx
import { LiveChat } from './components/LiveChat';

<LiveChat
  roomId="support-room-123"
  username="JohnDoe"
  userId="user123"
  title="Support Chat"
  height="500px"
  enableEmojis={true}
  enableTypingIndicator={true}
/>
```

### 3. Presence Indicators

**Component**: `PresenceIndicator.tsx`

- Real-time user status (online, away, busy, offline)
- Mood indicators
- Last seen timestamps
- Presence badges
- Community member list

**Usage**:
```tsx
import { PresenceIndicator, PresenceBadge } from './components/PresenceIndicator';

// Full presence list
<PresenceIndicator
  channelName="presence-global"
  showMood={true}
  showLastSeen={true}
  maxUsers={10}
/>

// Simple badge
<PresenceBadge userId="user123" size="medium" />
```

### 4. Mood Sharing

**Component**: `MoodSharing.tsx`

- Real-time mood updates
- Public/private sharing options
- Community mood feed
- Mood analytics
- Support messages
- Mood trends visualization

**Usage**:
```tsx
import { MoodSharing } from './components/MoodSharing';

<MoodSharing
  userId="user123"
  username="JohnDoe"
  showFeed={true}
  allowSharing={true}
/>
```

### 5. Crisis Alerts

**API Endpoint**: `/api/realtime/crisis`

- Automatic keyword detection
- Multiple severity levels
- Support team notifications
- Location-based alerts (if enabled)
- Helper mobilization
- Audit logging

**Trigger Crisis Alert**:
```javascript
await realtimeService.sendCrisisAlert(
  'high', // severity
  'User needs immediate help',
  'Location coordinates' // optional
);
```

## API Endpoints

### Base URL: `/.netlify/functions/api-realtime`

#### GET /config
Get Pusher configuration for client initialization

#### GET /presence
Get list of active users

#### GET /notifications
Get unread notifications for authenticated user

#### POST /auth
Authenticate Pusher channel subscription

#### POST /message
Send a message to a channel

#### POST /presence
Update user presence status

#### POST /notify
Send notification to specific user

#### POST /typing
Send typing indicator

#### POST /mood
Share mood update

#### POST /crisis
Trigger crisis alert

#### PUT /notifications/read/:id
Mark notification as read

## Services

### RealtimeService

**Location**: `src/services/realtimeService.ts`

Main service for managing real-time connections:

```typescript
import { getRealtimeService } from './services/realtimeService';

const service = getRealtimeService();

// Subscribe to events
service.on('notification', (data) => {
  console.log('New notification:', data);
});

// Send message
await service.sendMessage('channel-name', 'Hello world');

// Update presence
await service.updatePresence('online', 'happy');

// Share mood
await service.shareMoodUpdate(
  { value: 4, label: 'Good' },
  true // public
);
```

### React Hooks

#### useRealtime
```tsx
const { service, isConnected } = useRealtime();
```

#### useRealtimeChannel
```tsx
const { messages, typingUsers, sendMessage, sendTyping } = useRealtimeChannel('room-id');
```

#### usePresenceChannel
```tsx
const { members } = usePresenceChannel('presence-global');
```

## Environment Variables

Add these to your `.env` file and Netlify environment:

```bash
# Pusher Configuration
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=us2

# Optional: Fallback WebSocket URL for development
VITE_WS_URL=ws://localhost:8080/ws
```

## Setup Instructions

### 1. Create Pusher Account

1. Go to [pusher.com](https://pusher.com)
2. Sign up for a free account
3. Create a new Channels app
4. Note your credentials

### 2. Configure Environment Variables

In Netlify Dashboard:
1. Go to Site Settings > Environment Variables
2. Add all Pusher variables
3. Redeploy site

### 3. Install Dependencies

```bash
npm install pusher pusher-js
```

### 4. Initialize Service

The service auto-initializes when imported. No additional setup required.

## Database Schema

Required tables (already created in Phase 6):

- `notifications` - Store notification history
- `messages` - Store chat messages
- `user_presence` - Track user presence
- `mood_entries` - Store mood updates
- `crisis_alerts` - Log crisis events
- `crisis_logs` - Audit trail

## Security Considerations

### Channel Authentication

- Private channels require authentication
- Users can only subscribe to their own private channels
- Public channels for community features
- Presence channels for member tracking

### Crisis Detection

- Keyword scanning in messages
- Automatic escalation for high-risk content
- Support team notifications
- Audit logging for compliance

### Data Privacy

- Messages encrypted in transit (TLS)
- Optional end-to-end encryption available
- User consent for public sharing
- GDPR-compliant data handling

## Performance Optimization

### Connection Management

- Automatic reconnection with exponential backoff
- Connection state monitoring
- Fallback to polling if WebSocket fails
- Lazy channel subscription

### Message Optimization

- Message batching
- Compression for large payloads
- Local caching for offline support
- Pagination for message history

## Testing

### Local Development

```bash
# Start development server
npm run dev

# Service will use demo mode if Pusher not configured
```

### Manual Testing

1. Open multiple browser windows
2. Log in as different users
3. Test features:
   - Send messages in chat
   - Share mood updates
   - Trigger notifications
   - Check presence updates

### Crisis Alert Testing

```javascript
// Test crisis detection
await service.sendMessage('test-channel', 'I want to hurt myself');
// Should trigger automatic crisis alert

// Manual crisis alert
await service.sendCrisisAlert('high', 'Test alert');
```

## Monitoring

### Pusher Dashboard

- Real-time connection count
- Message throughput
- Channel activity
- Error logs

### Application Logs

```javascript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  Pusher.logToConsole = true;
}
```

## Troubleshooting

### Connection Issues

1. Check Pusher credentials
2. Verify environment variables
3. Check browser console for errors
4. Ensure Pusher cluster is correct

### Message Delivery

1. Verify channel subscription
2. Check authentication for private channels
3. Monitor Pusher dashboard
4. Check network connectivity

### Performance Issues

1. Reduce message frequency
2. Implement message throttling
3. Use presence channels sparingly
4. Consider message pagination

## Future Enhancements

### Planned Features

1. **Video Chat Integration**
   - WebRTC for peer-to-peer video
   - Screen sharing for therapy sessions
   - Recording capabilities

2. **Advanced Analytics**
   - Real-time dashboard
   - User engagement metrics
   - Crisis response times

3. **AI Integration**
   - Sentiment analysis
   - Automated crisis detection
   - Predictive mood patterns

4. **Group Features**
   - Group chat rooms
   - Scheduled sessions
   - Breakout rooms

5. **Enhanced Security**
   - End-to-end encryption
   - Message expiration
   - Secure file sharing

## Support

For issues or questions:
- Check Pusher documentation: [pusher.com/docs](https://pusher.com/docs)
- Review error logs in Netlify Functions
- Monitor browser console for client errors
- Check network tab for API failures

## License

This implementation is part of the CoreV2 Mental Health Platform and follows the project's licensing terms.