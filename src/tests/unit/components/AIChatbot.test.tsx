import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AIChatbot from '../../../components/ai/AIChatbot';
import AIChatInterface from '../../../components/AIChatInterface';

// Mock services
jest.mock('../../../services/ai/chatbotService', () => ({
  sendMessage: jest.fn(),
  analyzeEmotionalContent: jest.fn(),
  getSuggestedResponses: jest.fn(),
  endSession: jest.fn()
}));

jest.mock('../../../services/crisisDetectionService', () => ({
  analyzeChatForCrisis: jest.fn().mockResolvedValue({
    hasCrisisIndicators: false,
    riskLevel: 'low',
    confidence: 0.85
  })
}));

jest.mock('../../../services/aiSafetyGuardrails', () => ({
  validateInput: jest.fn().mockResolvedValue({ safe: true }),
  filterResponse: jest.fn((response) => response)
}));

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }
  
  send(data: string) {
    // Simulate response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'response',
            content: 'AI response to: ' + JSON.parse(data).content
          })
        }));
      }
    }, 100);
  }
  
  close() {
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('AIChatbot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Chat Functionality', () => {
    it('should render the chat interface', () => {
      render(<AIChatbot />);
      
      expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    });

    it('should display welcome message on mount', () => {
      render(<AIChatbot />);
      
      expect(screen.getByText(/Hello! I'm here to listen/i)).toBeInTheDocument();
    });

    it('should send user message and receive AI response', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage.mockResolvedValueOnce({
        response: "I understand you're feeling stressed. Let's talk about it.",
        emotion: 'empathetic',
        suggestions: ['Try deep breathing', 'Take a short walk']
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'I feel stressed');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('I feel stressed')).toBeInTheDocument();
        expect(screen.getByText(/I understand you're feeling stressed/i)).toBeInTheDocument();
      });
    });

    it('should clear input after sending message', async () => {
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i) as HTMLInputElement;
      await userEvent.type(input, 'Test message');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should show typing indicator while AI responds', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          response: 'Delayed response'
        }), 500))
      );
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Test');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      expect(screen.getByText(/AI is typing/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText(/AI is typing/i)).not.toBeInTheDocument();
        expect(screen.getByText('Delayed response')).toBeInTheDocument();
      });
    });

    it('should maintain chat history', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage
        .mockResolvedValueOnce({ response: 'First response' })
        .mockResolvedValueOnce({ response: 'Second response' });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      
      // First message
      await userEvent.type(input, 'First message');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
        expect(screen.getByText('First response')).toBeInTheDocument();
      });
      
      // Second message
      await userEvent.type(input, 'Second message');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Second message')).toBeInTheDocument();
        expect(screen.getByText('Second response')).toBeInTheDocument();
        // Previous messages still visible
        expect(screen.getByText('First message')).toBeInTheDocument();
        expect(screen.getByText('First response')).toBeInTheDocument();
      });
    });
  });

  describe('Crisis Detection Integration', () => {
    it('should analyze messages for crisis indicators', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, "I don't want to live anymore");
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(crisisDetectionService.analyzeChatForCrisis).toHaveBeenCalledWith(
          expect.stringContaining("don't want to live")
        );
      });
    });

    it('should show crisis resources when crisis is detected', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      crisisDetectionService.analyzeChatForCrisis.mockResolvedValueOnce({
        hasCrisisIndicators: true,
        riskLevel: 'high',
        confidence: 0.95,
        triggers: ['suicidal ideation']
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'I want to end it all');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/I'm concerned about you/i)).toBeInTheDocument();
        expect(screen.getByText(/988 Suicide & Crisis Lifeline/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Call 988 Now/i })).toBeInTheDocument();
      });
    });

    it('should prioritize crisis response over normal AI response', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      const chatbotService = require('../../../services/ai/chatbotService');
      
      crisisDetectionService.analyzeChatForCrisis.mockResolvedValueOnce({
        hasCrisisIndicators: true,
        riskLevel: 'critical',
        confidence: 0.98
      });
      
      chatbotService.sendMessage.mockResolvedValueOnce({
        response: 'Normal AI response'
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Crisis message');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        // Should show crisis response, not normal AI response
        expect(screen.getByText(/immediate help/i)).toBeInTheDocument();
        expect(screen.queryByText('Normal AI response')).not.toBeInTheDocument();
      });
    });
  });

  describe('Safety and Content Filtering', () => {
    it('should validate user input for safety', async () => {
      const aiSafetyGuardrails = require('../../../services/aiSafetyGuardrails');
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Test message');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(aiSafetyGuardrails.validateInput).toHaveBeenCalledWith('Test message');
      });
    });

    it('should block unsafe content', async () => {
      const aiSafetyGuardrails = require('../../../services/aiSafetyGuardrails');
      aiSafetyGuardrails.validateInput.mockResolvedValueOnce({
        safe: false,
        reason: 'Contains harmful content'
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Unsafe content');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/cannot process this message/i)).toBeInTheDocument();
      });
    });

    it('should filter AI responses for safety', async () => {
      const aiSafetyGuardrails = require('../../../services/aiSafetyGuardrails');
      const chatbotService = require('../../../services/ai/chatbotService');
      
      chatbotService.sendMessage.mockResolvedValueOnce({
        response: 'Potentially harmful response'
      });
      
      aiSafetyGuardrails.filterResponse.mockReturnValueOnce(
        'This response has been filtered for safety'
      );
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Test');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(aiSafetyGuardrails.filterResponse).toHaveBeenCalledWith(
          'Potentially harmful response'
        );
        expect(screen.getByText('This response has been filtered for safety')).toBeInTheDocument();
      });
    });
  });

  describe('Suggested Responses', () => {
    it('should show suggested responses after AI message', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage.mockResolvedValueOnce({
        response: 'How can I help you today?',
        suggestions: [
          'I need someone to talk to',
          'I want to learn coping strategies',
          'Tell me about mindfulness'
        ]
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Hello');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('I need someone to talk to')).toBeInTheDocument();
        expect(screen.getByText('I want to learn coping strategies')).toBeInTheDocument();
        expect(screen.getByText('Tell me about mindfulness')).toBeInTheDocument();
      });
    });

    it('should send suggested response when clicked', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage
        .mockResolvedValueOnce({
          response: 'How are you?',
          suggestions: ['I'm feeling good', 'Not great']
        })
        .mockResolvedValueOnce({
          response: 'Glad to hear that!'
        });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Hi');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        expect(screen.getByText('I'm feeling good')).toBeInTheDocument();
      });
      
      const suggestion = screen.getByText('I'm feeling good');
      fireEvent.click(suggestion);
      
      await waitFor(() => {
        // Suggestion becomes user message
        expect(screen.getAllByText('I'm feeling good')).toHaveLength(2);
        expect(screen.getByText('Glad to hear that!')).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should start a new session on mount', () => {
      render(<AIChatbot />);
      
      expect(screen.getByText(/Session started/i)).toBeInTheDocument();
    });

    it('should end session when component unmounts', () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      
      const { unmount } = render(<AIChatbot />);
      
      unmount();
      
      expect(chatbotService.endSession).toHaveBeenCalled();
    });

    it('should save chat history to localStorage', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage.mockResolvedValueOnce({
        response: 'Test response'
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Test message');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'chatHistory',
          expect.stringContaining('Test message')
        );
      });
      
      setItemSpy.mockRestore();
    });

    it('should restore chat history on mount', () => {
      const mockHistory = [
        { role: 'user', content: 'Previous message', timestamp: Date.now() - 3600000 },
        { role: 'assistant', content: 'Previous response', timestamp: Date.now() - 3590000 }
      ];
      
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(
        JSON.stringify(mockHistory)
      );
      
      render(<AIChatbot />);
      
      expect(screen.getByText('Previous message')).toBeInTheDocument();
      expect(screen.getByText('Previous response')).toBeInTheDocument();
    });

    it('should clear chat history when requested', async () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      
      render(<AIChatbot />);
      
      const clearButton = screen.getByRole('button', { name: /Clear Chat/i });
      fireEvent.click(clearButton);
      
      // Confirm clear
      const confirmButton = screen.getByRole('button', { name: /Yes, Clear/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(removeItemSpy).toHaveBeenCalledWith('chatHistory');
        expect(screen.queryByText(/Previous message/i)).not.toBeInTheDocument();
      });
      
      removeItemSpy.mockRestore();
    });
  });

  describe('Emotional Analysis', () => {
    it('should analyze emotional content of messages', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.analyzeEmotionalContent.mockResolvedValueOnce({
        primaryEmotion: 'sadness',
        intensity: 0.8,
        secondaryEmotions: ['loneliness', 'frustration']
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'I feel so alone and sad');
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(chatbotService.analyzeEmotionalContent).toHaveBeenCalledWith(
          'I feel so alone and sad'
        );
      });
      
      // Should show emotion indicator
      expect(screen.getByText(/Detecting: sadness/i)).toBeInTheDocument();
    });

    it('should adapt responses based on emotional state', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      
      // First message - sad
      chatbotService.analyzeEmotionalContent.mockResolvedValueOnce({
        primaryEmotion: 'sadness',
        intensity: 0.9
      });
      
      chatbotService.sendMessage.mockResolvedValueOnce({
        response: 'I hear that you're feeling sad. That must be difficult.',
        tone: 'empathetic'
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'I'm very sad');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/That must be difficult/i)).toBeInTheDocument();
      });
      
      // Verify empathetic tone indicator
      expect(screen.getByText(/Empathetic/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      expect(input).toHaveAttribute('aria-label', expect.stringContaining('chat'));
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      expect(sendButton).toHaveAttribute('aria-label');
    });

    it('should announce new messages to screen readers', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage.mockResolvedValueOnce({
        response: 'New AI response'
      });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Test');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        const liveRegion = screen.getByRole('log');
        expect(liveRegion).toHaveTextContent('New AI response');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation', async () => {
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      
      // Enter key should send message
      await userEvent.type(input, 'Keyboard test');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard test')).toBeInTheDocument();
      });
    });

    it('should support voice input', async () => {
      // Mock speech recognition
      const mockSpeechRecognition = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
      };
      
      (window as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
      
      render(<AIChatbot />);
      
      const voiceButton = screen.getByRole('button', { name: /Voice Input/i });
      fireEvent.click(voiceButton);
      
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      
      // Simulate voice input
      const onResult = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )?.[1];
      
      if (onResult) {
        onResult({
          results: [[{ transcript: 'Voice message test' }]]
        });
      }
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Type your message/i) as HTMLInputElement;
        expect(input.value).toBe('Voice message test');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage.mockRejectedValueOnce(new Error('Network error'));
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Test');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to send message/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should retry failed messages', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      chatbotService.sendMessage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ response: 'Success on retry' });
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      await userEvent.type(input, 'Test');
      fireEvent.click(screen.getByRole('button', { name: /Send/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success on retry')).toBeInTheDocument();
      });
    });

    it('should handle WebSocket disconnection', async () => {
      render(<AIChatbot />);
      
      // Simulate WebSocket disconnect
      act(() => {
        const ws = (global as any).WebSocket.mock.instances[0];
        if (ws && ws.onclose) {
          ws.onclose(new CloseEvent('close'));
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reconnect/i })).toBeInTheDocument();
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should throttle rapid message sending', async () => {
      jest.useFakeTimers();
      const chatbotService = require('../../../services/ai/chatbotService');
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      const sendButton = screen.getByRole('button', { name: /Send/i });
      
      // Try to send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await userEvent.type(input, `Message ${i}`);
        fireEvent.click(sendButton);
      }
      
      // Should only send limited messages due to throttling
      expect(chatbotService.sendMessage).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should limit chat history size', async () => {
      const chatbotService = require('../../../services/ai/chatbotService');
      
      // Generate many messages
      for (let i = 0; i < 100; i++) {
        chatbotService.sendMessage.mockResolvedValueOnce({
          response: `Response ${i}`
        });
      }
      
      render(<AIChatbot />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      const sendButton = screen.getByRole('button', { name: /Send/i });
      
      // Send many messages
      for (let i = 0; i < 100; i++) {
        await userEvent.type(input, `Message ${i}`);
        fireEvent.click(sendButton);
      }
      
      await waitFor(() => {
        // Should only display recent messages (e.g., last 50)
        const messages = screen.getAllByText(/Message \d+/);
        expect(messages.length).toBeLessThanOrEqual(50);
      });
    });
  });
});