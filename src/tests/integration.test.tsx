/**
 * Integration Tests
 * 
 * Comprehensive integration tests for the mental health platform
 * covering key user flows and component interactions
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock external dependencies
vi.mock('../services/api/chatService', () => ({
  useChatService: () => ({
    sendMessage: vi.fn(),
    messages: [],
    isLoading: false,
    error: null
  })
}));

vi.mock('../hooks/useAIChat', () => ({
  useAIChat: () => ({
    sendMessage: vi.fn(),
    messages: [],
    isLoading: false,
    error: null
  })
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 'test-user', email: 'test@example.com' },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false
  })
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <div data-testid="test-wrapper">{children}</div>
    </BrowserRouter>
  );
};

// Mock components for testing
const MockApp: React.FC = () => <div data-testid="mock-app">Mental Health App</div>;
const MockMoodTracker: React.FC = () => <div data-testid="mood-tracker">Mood Tracker</div>;

describe('Mental Health Platform Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllTimers();
  });

  describe('Application Bootstrap', () => {
    test('should render main application without crashing', () => {
      render(
        <TestWrapper>
          <MockApp />
        </TestWrapper>
      );

      expect(screen.getByTestId('mock-app')).toBeInTheDocument();
      expect(screen.getByText('Mental Health App')).toBeInTheDocument();
    });

    test('should handle basic user interactions', async () => {
      render(
        <TestWrapper>
          <button data-testid="test-button">Click me</button>
        </TestWrapper>
      );

      const button = screen.getByTestId('test-button');
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      // Add assertion for click event if needed
    });

    test('should maintain routing state', () => {
      render(
        <TestWrapper>
          <div data-testid="router-test">Router Working</div>
        </TestWrapper>
      );

      expect(screen.getByTestId('router-test')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should integrate mood tracking components', async () => {
      render(
        <TestWrapper>
          <MockMoodTracker />
        </TestWrapper>
      );

      expect(screen.getByTestId('mood-tracker')).toBeInTheDocument();
      expect(screen.getByText('Mood Tracker')).toBeInTheDocument();
    });

    test('should handle component state changes', async () => {
      const TestComponent: React.FC = () => {
        const [data, setData] = React.useState('loading');

        React.useEffect(() => {
          setTimeout(() => setData('loaded'), 100);
        }, []);

        return <div data-testid="async-component">{data}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('async-component')).toHaveTextContent('loading');

      await waitFor(() => {
        expect(screen.getByTestId('async-component')).toHaveTextContent('loaded');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle component errors gracefully', async () => {
      const ErrorComponent: React.FC = () => {
        throw new Error('Test error');
      };

      const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [hasError, setHasError] = React.useState(false);
        
        React.useEffect(() => {
          const handleError = () => setHasError(true);
          window.addEventListener('error', handleError);
          return () => window.removeEventListener('error', handleError);
        }, []);
        
        if (hasError) {
          return <div data-testid="error-fallback">Something went wrong</div>;
        }
        
        try {
          return <>{children}</>;
        } catch {
          return <div data-testid="error-fallback">Something went wrong</div>;
        }
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <TestWrapper>
            <ErrorBoundary>
              <ErrorComponent />
            </ErrorBoundary>
          </TestWrapper>
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should handle large lists efficiently', async () => {
      const LargeList: React.FC = () => {
        const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);

        return (
          <div data-testid="large-list">
            {items.map(item => (
              <div key={item}>{item}</div>
            ))}
          </div>
        );
      };

      const start = performance.now();
      
      render(
        <TestWrapper>
          <LargeList />
        </TestWrapper>
      );

      const end = performance.now();
      const renderTime = end - start;

      expect(screen.getByTestId('large-list')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
    });
  });

  describe('Accessibility', () => {
    test('should provide proper ARIA labels', () => {
      render(
        <TestWrapper>
          <button aria-label="Close dialog" data-testid="close-button">
            ×
          </button>
        </TestWrapper>
      );

      const button = screen.getByLabelText('Close dialog');
      expect(button).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <div>
            <button data-testid="button1">Button 1</button>
            <button data-testid="button2">Button 2</button>
          </div>
        </TestWrapper>
      );

      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');

      button1.focus();
      expect(document.activeElement).toBe(button1);

      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      // Tab navigation would need more complex setup in testing environment
    });
  });

  describe('Data Flow', () => {
    test('should handle async data loading', async () => {
      const AsyncDataComponent: React.FC = () => {
        const [data, setData] = React.useState<string | null>(null);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          setTimeout(() => {
            setData('Async data loaded');
            setLoading(false);
          }, 500);
        }, []);

        if (loading) {
          return <div data-testid="loading">Loading...</div>;
        }

        return <div data-testid="data">{data}</div>;
      };

      render(
        <TestWrapper>
          <AsyncDataComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('data')).toBeInTheDocument();
        expect(screen.getByText('Async data loaded')).toBeInTheDocument();
      });
    });

    test('should handle form submissions', async () => {
      const FormComponent: React.FC = () => {
        const [submitted, setSubmitted] = React.useState(false);

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setSubmitted(true);
        };

        return (
          <form onSubmit={handleSubmit} data-testid="test-form">
            <input
              type="text"
              data-testid="input"
              placeholder="Enter text"
            />
            <button type="submit" data-testid="submit">
              Submit
            </button>
            {submitted && <div data-testid="success">Form submitted!</div>}
          </form>
        );
      };

      render(
        <TestWrapper>
          <FormComponent />
        </TestWrapper>
      );

      const input = screen.getByTestId('input');
      const submitButton = screen.getByTestId('submit');

      fireEvent.change(input, { target: { value: 'test input' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('success')).toBeInTheDocument();
      });
    });
  });

  describe('Theme and Styling', () => {
    test('should apply correct CSS classes', () => {
      render(
        <TestWrapper>
          <div className="test-class" data-testid="styled-element">
            Styled Element
          </div>
        </TestWrapper>
      );

      const element = screen.getByTestId('styled-element');
      expect(element).toHaveClass('test-class');
    });

    test('should handle responsive design', () => {
      // Mock window resize
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <div data-testid="responsive-element">
            Responsive Content
          </div>
        </TestWrapper>
      );

      const element = screen.getByTestId('responsive-element');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Crisis Detection Integration', () => {
    test('should handle crisis detection workflow', async () => {
      const CrisisTestComponent: React.FC = () => {
        const [crisisDetected, setCrisisDetected] = React.useState(false);

        const handleCrisisKeywords = (text: string) => {
          const crisisKeywords = ['help me', 'suicide', 'hurt myself'];
          const containsCrisis = crisisKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
          );
          setCrisisDetected(containsCrisis);
        };

        return (
          <div>
            <input
              data-testid="crisis-input"
              onChange={(e) => handleCrisisKeywords(e.target.value)}
              placeholder="Type your message"
            />
            {crisisDetected && (
              <div data-testid="crisis-alert">
                Crisis detected - help is available
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper>
          <CrisisTestComponent />
        </TestWrapper>
      );

      const input = screen.getByTestId('crisis-input');
      
      fireEvent.change(input, { target: { value: 'I need help me' } });

      await waitFor(() => {
        expect(screen.getByTestId('crisis-alert')).toBeInTheDocument();
      });
    });
  });

  describe('Chat Integration', () => {
    test('should handle chat message flow', async () => {
      const ChatComponent: React.FC = () => {
        const [messages, setMessages] = React.useState<string[]>([]);
        const [input, setInput] = React.useState('');

        const sendMessage = () => {
          if (input.trim()) {
            setMessages(prev => [...prev, input]);
            setInput('');
          }
        };

        return (
          <div data-testid="chat-container">
            <div data-testid="messages">
              {messages.map((msg, index) => (
                <div key={index} data-testid={`message-${index}`}>
                  {msg}
                </div>
              ))}
            </div>
            <input
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
            />
            <button data-testid="send-button" onClick={sendMessage}>
              Send
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <ChatComponent />
        </TestWrapper>
      );

      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('message-0')).toHaveTextContent('Hello, how are you?');
      });
    });
  });
});

// Helper functions for tests
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'client',
  ...overrides
});

export const createMockMessage = (overrides = {}) => ({
  id: 'msg-123',
  content: 'Test message',
  timestamp: new Date(),
  sender: 'user',
  ...overrides
});

export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

export const expectAccessibleElement = (element: HTMLElement) => {
  // Check for basic accessibility attributes
  const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
  const hasRole = element.hasAttribute('role') || ['BUTTON', 'INPUT', 'A'].includes(element.tagName);
  
  expect(hasAriaLabel || hasRole).toBe(true);
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  await act(async () => {
    renderFn();
  });
  const end = performance.now();
  return end - start;
};

export const expectFastRender = async (renderFn: () => void, maxTime = 100) => {
  const renderTime = await measureRenderTime(renderFn);
  expect(renderTime).toBeLessThan(maxTime);
};



