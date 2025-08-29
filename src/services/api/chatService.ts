// Chat service for managing real-time communication with AI and peer support
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'emoji' | 'voice' | 'image' | 'suggestion' | 'crisis_resources';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    aiConfidence?: number;
    sentiment?: string;
    suggestedActions?: string[];
    isEncrypted?: boolean;
  };
}

export interface Chat {
  id: string;
  type: 'ai_support' | 'peer_support' | 'crisis_support' | 'group_chat';
  participants: string[];
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
  metadata?: {
    topic?: string;
    priority?: 'low' | 'medium' | 'high' | 'emergency';
    crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class ChatService {
  private apiBaseUrl: string;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || process.env.VITE_API_URL || '/api';
  }

  // Initialize WebSocket connection
  async connect(userId: string): Promise<void> {
    const wsUrl = this.apiBaseUrl.replace('http', 'ws') + `/chat/ws?userId=${userId}`;
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('Chat WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleIncomingMessage(message);
    };

    this.websocket.onclose = () => {
      console.log('Chat WebSocket disconnected');
      this.handleReconnection();
    };

    this.websocket.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
    };
  }

  // Create new chat
  async createChat(options: {
    type: Chat['type'];
    participants?: string[];
    topic?: string;
    priority?: Chat['metadata']['priority'];
  }): Promise<Chat> {
    const response = await fetch(`${this.apiBaseUrl}/chat/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('Failed to create chat');
    }

    return await response.json();
  }

  // Send message
  async sendMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'chatId' | 'timestamp' | 'status'>): Promise<ChatMessage> {
    const messageData: ChatMessage = {
      ...message,
      id: this.generateId(),
      chatId,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    // Send via WebSocket if connected
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'send_message',
        data: messageData
      }));
    } else {
      // Fallback to HTTP
      const response = await fetch(`${this.apiBaseUrl}/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    }

    return messageData;
  }

  // Get chat messages
  async getMessages(chatId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    const response = await fetch(
      `${this.apiBaseUrl}/chat/${chatId}/messages?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return await response.json();
  }

  // Get user's chats
  async getChats(userId: string): Promise<Chat[]> {
    const response = await fetch(`${this.apiBaseUrl}/chat/user/${userId}/chats`);

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return await response.json();
  }

  // Crisis chat specific methods
  async requestCrisisSupport(options: {
    userId: string;
    crisisLevel: 'low' | 'medium' | 'high' | 'critical';
    message?: string;
    location?: { lat: number; lng: number };
  }): Promise<Chat> {
    const response = await fetch(`${this.apiBaseUrl}/chat/crisis/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('Failed to request crisis support');
    }

    return await response.json();
  }

  // AI chat specific methods
  async requestAISupport(options: {
    userId: string;
    topic?: string;
    aiPersonality?: 'therapeutic' | 'supportive' | 'clinical';
    preferences?: {
      language: string;
      communicationStyle: string;
    };
  }): Promise<Chat> {
    const response = await fetch(`${this.apiBaseUrl}/chat/ai/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('Failed to request AI support');
    }

    return await response.json();
  }

  private handleIncomingMessage(data: any): void {
    // Handle different message types
    switch (data.type) {
      case 'message':
        this.onMessageReceived?.(data.data);
        break;
      case 'typing':
        this.onTypingIndicator?.(data.data);
        break;
      case 'crisis_alert':
        this.onCrisisAlert?.(data.data);
        break;
      case 'ai_suggestion':
        this.onAISuggestion?.(data.data);
        break;
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        // Would need userId stored to reconnect
        // this.connect(userId);
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event handlers (to be set by consumers)
  onMessageReceived?: (message: ChatMessage) => void;
  onTypingIndicator?: (data: { chatId: string; userId: string; isTyping: boolean }) => void;
  onCrisisAlert?: (data: { chatId: string; level: string }) => void;
  onAISuggestion?: (data: { chatId: string; suggestions: string[] }) => void;

  disconnect(): void {
    this.websocket?.close();
    this.websocket = null;
  }
}

export default new ChatService();
