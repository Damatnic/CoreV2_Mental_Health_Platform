import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, MessageCircle, AlertCircle } from 'lucide-react';
import '../../styles/AnonymousTherapyChat.css';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'therapist' | 'system';
  timestamp: Date;
  isAnonymous: boolean;
}

const AnonymousTherapyChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Welcome to Anonymous Therapy Chat. This is a safe, confidential space where you can speak with a licensed therapist. Your identity remains completely anonymous.',
      sender: 'system',
      timestamp: new Date(),
      isAnonymous: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConnect = () => {
    setIsConnected(true);
    setIsWaiting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setIsWaiting(false);
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'Hello, I\'m here to listen and support you. Everything you share here is confidential. How are you feeling today?',
        sender: 'therapist',
        timestamp: new Date(),
        isAnonymous: true
      };
      setMessages(prev => [...prev, welcomeMessage]);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected && !isWaiting) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: inputMessage,
        sender: 'user',
        timestamp: new Date(),
        isAnonymous: true
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setIsWaiting(true);

      // Simulate therapist response
      setTimeout(() => {
        const responses = [
          'I hear what you\'re saying. Can you tell me more about how that makes you feel?',
          'That sounds challenging. You\'re brave for sharing this with me.',
          'I understand. What do you think might help you feel better in this situation?',
          'Thank you for trusting me with this. How long have you been feeling this way?',
          'That must be difficult to deal with. What support do you have around you?'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const therapistMessage: ChatMessage = {
          id: Date.now().toString(),
          content: randomResponse,
          sender: 'therapist',
          timestamp: new Date(),
          isAnonymous: true
        };

        setMessages(prev => [...prev, therapistMessage]);
        setIsWaiting(false);
      }, 1500 + Math.random() * 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <div key={message.id} className={`message ${message.sender}`}>
      <div className="message-content">
        <p>{message.content}</p>
        <span className="message-time">
          {message.timestamp.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="anonymous-therapy-chat">
        <div className="chat-intro">
          <Shield size={48} />
          <h2>Anonymous Therapy Chat</h2>
          <p>Connect with a licensed therapist anonymously and confidentially</p>
          
          <div className="privacy-features">
            <div className="feature">
              <Shield size={20} />
              <span>Complete anonymity</span>
            </div>
            <div className="feature">
              <MessageCircle size={20} />
              <span>Licensed therapists</span>
            </div>
            <div className="feature">
              <AlertCircle size={20} />
              <span>Crisis support available</span>
            </div>
          </div>

          <button className="connect-btn" onClick={handleConnect}>
            Start Anonymous Session
          </button>

          <div className="disclaimer">
            <p>
              <strong>Note:</strong> This service is for support and guidance. 
              If you're experiencing a mental health emergency, please contact 
              your local emergency services or call 988.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anonymous-therapy-chat connected">
      <div className="chat-header">
        <div className="therapist-info">
          <div className="therapist-avatar">
            <Shield size={20} />
          </div>
          <div>
            <h3>Anonymous Therapist</h3>
            <span className="status">
              {isWaiting ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
        <div className="privacy-indicator">
          <Shield size={16} />
          <span>Anonymous & Encrypted</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(renderMessage)}
        {isWaiting && (
          <div className="message therapist typing">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Share what's on your mind..."
          rows={1}
          disabled={isWaiting}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isWaiting}
          className="send-btn"
        >
          <Send size={20} />
        </button>
      </div>

      <div className="chat-footer">
        <p>
          Remember: You are anonymous. This conversation is confidential 
          and will not be stored after the session ends.
        </p>
      </div>
    </div>
  );
};

export default AnonymousTherapyChat;
