import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketClient, SocketEvents } from '../services/websocket/socketClient';
import { useAuth } from './useAuth';

// Types for WebSocket hook
interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  latency: number;
  reconnectAttempts: number;
  lastConnected?: Date;
  lastDisconnected?: Date;
}

interface WebSocketMessage {
  id: string;
  event: string;
  data: any;
  timestamp: Date;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
  debug?: boolean;
}

interface WebSocketHookReturn {
  // Connection state
  state: WebSocketState;
  isConnected: boolean;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Messaging methods
  sendMessage: (roomId: string, content: string, metadata?: any) => void;
  sendTyping: (roomId: string, isTyping: boolean) => void;
  sendReadReceipt: (messageId: string, roomId: string) => void;
  
  // Room methods
  joinRoom: (roomId: string, roomType: string, metadata?: any) => void;
  leaveRoom: (roomId: string) => void;
  
  // Crisis methods
  triggerCrisisAlert: (severity: string, message: string, location?: any) => void;
  shareLocation: (location: any, alertId?: string) => void;
  
  // Event subscription
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  
  // Utility methods
  getLatency: () => number;
  getSessionId: () => string | null;
}

/**
 * React hook for WebSocket integration
 */
export function useWebSocket(options: UseWebSocketOptions = {}): WebSocketHookReturn {
  const { user, token } = useAuth();
  const clientRef = useRef<ReturnType<typeof getWebSocketClient>>();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    latency: 0,
    reconnectAttempts: 0
  });
  
  const messageHistoryRef = useRef<WebSocketMessage[]>([]);
  const eventListenersRef = useRef<Map<string, Set<Function>>>(new Map());
  
  // Initialize WebSocket client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = getWebSocketClient({
        token,
        autoConnect: options.autoConnect !== false && !!token
      });
      
      if (options.debug) {
        console.log('WebSocket client initialized');
      }
    }
    
    return () => {
      // Don't destroy singleton on unmount
      // Client persists across component lifecycle
    };
  }, []);
  
  // Setup connection state listeners
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;
    
    const handleConnected = () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        lastConnected: new Date(),
        reconnectAttempts: 0
      }));
      
      if (options.debug) {
        console.log('WebSocket connected');
      }
    };
    
    const handleDisconnected = (reason?: string) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        lastDisconnected: new Date()
      }));
      
      if (options.debug) {
        console.log('WebSocket disconnected:', reason);
      }
    };
    
    const handleReconnecting = (data: any) => {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        reconnectAttempts: data.attempt
      }));
      
      if (options.debug) {
        console.log('WebSocket reconnecting:', data);
      }
    };
    
    const handlePong = (data: any) => {
      setState(prev => ({
        ...prev,
        latency: data.latency || 0
      }));
    };
    
    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
    };
    
    // Subscribe to events
    client.on(SocketEvents.CONNECTED, handleConnected);
    client.on(SocketEvents.DISCONNECTED, handleDisconnected);
    client.on(SocketEvents.RECONNECTING, handleReconnecting);
    client.on(SocketEvents.PONG, handlePong);
    client.on(SocketEvents.ERROR, handleError);
    
    // Get initial state
    const currentState = client.getConnectionState();
    setState(prev => ({
      ...prev,
      ...currentState
    }));
    
    return () => {
      // Cleanup listeners
      client.off(SocketEvents.CONNECTED, handleConnected);
      client.off(SocketEvents.DISCONNECTED, handleDisconnected);
      client.off(SocketEvents.RECONNECTING, handleReconnecting);
      client.off(SocketEvents.PONG, handlePong);
      client.off(SocketEvents.ERROR, handleError);
    };
  }, [options.debug]);
  
  // Auto-connect when token changes
  useEffect(() => {
    if (token && options.autoConnect !== false && clientRef.current) {
      clientRef.current.connect(token).catch(error => {
        console.error('Failed to connect WebSocket:', error);
      });
    }
  }, [token, options.autoConnect]);
  
  // Reconnect on mount if requested
  useEffect(() => {
    if (options.reconnectOnMount && token && clientRef.current && !state.isConnected) {
      clientRef.current.connect(token).catch(error => {
        console.error('Failed to reconnect on mount:', error);
      });
    }
  }, [options.reconnectOnMount]);
  
  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async (): Promise<void> => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    setState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      await clientRef.current.connect(token);
    } catch (error) {
      setState(prev => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, [token]);
  
  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback((): void => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);
  
  /**
   * Send message to room
   */
  const sendMessage = useCallback((roomId: string, content: string, metadata?: any): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    clientRef.current.sendMessage(roomId, content, metadata);
    
    // Add to message history
    const message: WebSocketMessage = {
      id: `msg_${Date.now()}`,
      event: 'send-message',
      data: { roomId, content, metadata },
      timestamp: new Date()
    };
    
    messageHistoryRef.current.push(message);
    
    // Limit history size
    if (messageHistoryRef.current.length > 100) {
      messageHistoryRef.current = messageHistoryRef.current.slice(-100);
    }
  }, []);
  
  /**
   * Send typing indicator
   */
  const sendTyping = useCallback((roomId: string, isTyping: boolean): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    clientRef.current.sendTypingIndicator(roomId, isTyping);
  }, []);
  
  /**
   * Send read receipt
   */
  const sendReadReceipt = useCallback((messageId: string, roomId: string): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    clientRef.current.sendReadReceipt(messageId, roomId);
  }, []);
  
  /**
   * Join room
   */
  const joinRoom = useCallback((roomId: string, roomType: string, metadata?: any): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    clientRef.current.joinRoom(roomId, roomType, {
      ...metadata,
      userName: user?.name || 'User',
      userId: user?.id
    });
  }, [user]);
  
  /**
   * Leave room
   */
  const leaveRoom = useCallback((roomId: string): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    clientRef.current.leaveRoom(roomId);
  }, []);
  
  /**
   * Trigger crisis alert
   */
  const triggerCrisisAlert = useCallback((severity: string, message: string, location?: any): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    clientRef.current.triggerCrisisAlert(severity, message, location);
  }, []);
  
  /**
   * Share location
   */
  const shareLocation = useCallback((location: any, alertId?: string): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    clientRef.current.shareLocation(location, alertId);
  }, []);
  
  /**
   * Subscribe to event
   */
  const on = useCallback((event: string, callback: Function): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    // Track listener for cleanup
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)!.add(callback);
    
    clientRef.current.on(event, callback);
  }, []);
  
  /**
   * Unsubscribe from event
   */
  const off = useCallback((event: string, callback?: Function): void => {
    if (!clientRef.current) {
      console.error('WebSocket client not initialized');
      return;
    }
    
    if (callback) {
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }
    } else {
      eventListenersRef.current.delete(event);
    }
    
    clientRef.current.off(event, callback);
  }, []);
  
  /**
   * Get current latency
   */
  const getLatency = useCallback((): number => {
    return clientRef.current?.getLatency() || 0;
  }, []);
  
  /**
   * Get session ID
   */
  const getSessionId = useCallback((): string | null => {
    return clientRef.current?.getSessionId() || null;
  }, []);
  
  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach((listeners, event) => {
        listeners.forEach(callback => {
          clientRef.current?.off(event, callback);
        });
      });
      eventListenersRef.current.clear();
    };
  }, []);
  
  return {
    state,
    isConnected: state.isConnected,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    joinRoom,
    leaveRoom,
    triggerCrisisAlert,
    shareLocation,
    on,
    off,
    getLatency,
    getSessionId
  };
}

/**
 * Hook for real-time chat functionality
 */
export function useWebSocketChat(roomId: string) {
  const ws = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [participants, setParticipants] = useState<any[]>([]);
  
  useEffect(() => {
    if (!roomId || !ws.isConnected) return;
    
    // Join room
    ws.joinRoom(roomId, 'chat');
    
    // Message handlers
    const handleNewMessage = (message: any) => {
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    };
    
    const handleMessageEdited = (data: any) => {
      if (data.roomId === roomId) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, content: data.newContent, edited: true, editedAt: data.editedAt }
            : msg
        ));
      }
    };
    
    const handleMessageDeleted = (data: any) => {
      if (data.roomId === roomId) {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    };
    
    const handleTypingIndicator = (data: any) => {
      if (data.roomId === roomId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };
    
    const handleParticipantJoined = (data: any) => {
      if (data.roomId === roomId) {
        setParticipants(prev => [...prev, data.participant]);
      }
    };
    
    const handleParticipantLeft = (data: any) => {
      if (data.roomId === roomId) {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      }
    };
    
    const handleRoomJoined = (data: any) => {
      if (data.roomId === roomId) {
        setMessages(data.recentMessages || []);
        setParticipants(data.participants || []);
      }
    };
    
    // Subscribe to events
    ws.on('new-message', handleNewMessage);
    ws.on('message-edited', handleMessageEdited);
    ws.on('message-deleted', handleMessageDeleted);
    ws.on('typing-indicator', handleTypingIndicator);
    ws.on('participant-joined', handleParticipantJoined);
    ws.on('participant-left', handleParticipantLeft);
    ws.on('room-joined', handleRoomJoined);
    
    return () => {
      // Cleanup
      ws.leaveRoom(roomId);
      ws.off('new-message', handleNewMessage);
      ws.off('message-edited', handleMessageEdited);
      ws.off('message-deleted', handleMessageDeleted);
      ws.off('typing-indicator', handleTypingIndicator);
      ws.off('participant-joined', handleParticipantJoined);
      ws.off('participant-left', handleParticipantLeft);
      ws.off('room-joined', handleRoomJoined);
    };
  }, [roomId, ws.isConnected]);
  
  return {
    messages,
    typingUsers,
    participants,
    sendMessage: (content: string, metadata?: any) => ws.sendMessage(roomId, content, metadata),
    sendTyping: (isTyping: boolean) => ws.sendTyping(roomId, isTyping),
    sendReadReceipt: (messageId: string) => ws.sendReadReceipt(messageId, roomId)
  };
}

/**
 * Hook for crisis alert functionality
 */
export function useWebSocketCrisis() {
  const ws = useWebSocket();
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [responders, setResponders] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('idle');
  
  useEffect(() => {
    if (!ws.isConnected) return;
    
    const handleAlertConfirmed = (data: any) => {
      setActiveAlert(data);
      setStatus('active');
    };
    
    const handleResponderAssigned = (data: any) => {
      setResponders(prev => [...prev, data.responderInfo]);
      setStatus('responding');
    };
    
    const handleCrisisEscalated = (data: any) => {
      setStatus('escalated');
    };
    
    const handleCrisisResolved = (data: any) => {
      setStatus('resolved');
      // Clear after delay
      setTimeout(() => {
        setActiveAlert(null);
        setResponders([]);
        setStatus('idle');
      }, 5000);
    };
    
    // Subscribe to events
    ws.on('crisis-alert-confirmed', handleAlertConfirmed);
    ws.on('responder-assigned', handleResponderAssigned);
    ws.on('crisis-escalated', handleCrisisEscalated);
    ws.on('crisis-resolved', handleCrisisResolved);
    
    return () => {
      ws.off('crisis-alert-confirmed', handleAlertConfirmed);
      ws.off('responder-assigned', handleResponderAssigned);
      ws.off('crisis-escalated', handleCrisisEscalated);
      ws.off('crisis-resolved', handleCrisisResolved);
    };
  }, [ws.isConnected]);
  
  const triggerAlert = useCallback((severity: string, message: string) => {
    // Get user location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          ws.triggerCrisisAlert(severity, message, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          // Send without location
          ws.triggerCrisisAlert(severity, message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      ws.triggerCrisisAlert(severity, message);
    }
  }, [ws]);
  
  const shareLocation = useCallback(() => {
    if (!activeAlert) return;
    
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          ws.shareLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }, activeAlert.alertId);
        },
        (error) => {
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      
      // Return cleanup function
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeAlert, ws]);
  
  return {
    activeAlert,
    responders,
    status,
    triggerAlert,
    shareLocation
  };
}

export default useWebSocket;