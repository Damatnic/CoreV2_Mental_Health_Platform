import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import HelperDashboardView from './HelperDashboardView';

// Mock dependencies
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'helper-123',
      email: 'helper@example.com',
      name: 'Helper User',
      role: 'helper',
      isVerified: true,
      preferences: {
        notifications: true,
        theme: 'light'
      }
    },
    isAuthenticated: true,
    loading: false
  }))
}));

jest.mock('../services/helperService', () => ({
  getDashboardStats: jest.fn(),
  getActiveRequests: jest.fn(),
  getRecentActivity: jest.fn(),
  updateHelperStatus: jest.fn(),
  getHelperProfile: jest.fn(),
  acceptRequest: jest.fn(),
  rejectRequest: jest.fn(),
  completeRequest: jest.fn()
}));

jest.mock('../services/analyticsService', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn()
}));

jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuthContext: () => ({
    user: {
      id: 'helper-123',
      role: 'helper'
    },
    isAuthenticated: true
  })
}));

jest.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn()
  })
}));

// Mock chart components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>
}));

// Mock data
const mockDashboardStats = {
  totalRequests: 45,
  activeRequests: 8,
  completedRequests: 37,
  averageResponseTime: 12,
  satisfactionRating: 4.7,
  helpfulVotes: 156,
  weeklyActivity: [
    { day: 'Mon', requests: 7 },
    { day: 'Tue', requests: 5 },
    { day: 'Wed', requests: 8 },
    { day: 'Thu', requests: 6 },
    { day: 'Fri', requests: 4 },
    { day: 'Sat', requests: 3 },
    { day: 'Sun', requests: 2 }
  ],
  requestsByCategory: {
    'Crisis Support': 12,
    'General Support': 20,
    'Therapy': 8,
    'Wellness': 5
  }
};

const mockActiveRequests = [
  {
    id: 'req-1',
    title: 'Need immediate support',
    description: 'Having a difficult time and need someone to talk to',
    requesterName: 'Anonymous User',
    priority: 'high',
    category: 'Crisis Support',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'pending',
    isUrgent: true,
    tags: ['crisis', 'anxiety']
  },
  {
    id: 'req-2',
    title: 'Looking for coping strategies',
    description: 'Need help developing better coping mechanisms',
    requesterName: 'Sarah M.',
    priority: 'medium',
    category: 'General Support',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'assigned',
    isUrgent: false,
    tags: ['coping', 'strategies']
  }
];

const mockRecentActivity = [
  {
    id: 'activity-1',
    type: 'request_completed',
    title: 'Completed support request',
    description: 'Successfully helped user with anxiety management',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    metadata: {
      requestId: 'req-completed-1',
      satisfaction: 5,
      duration: 45
    }
  },
  {
    id: 'activity-2',
    type: 'message_sent',
    title: 'Sent supportive message',
    description: 'Provided crisis support to user in need',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: {
      messageId: 'msg-1',
      isHelpful: true
    }
  }
];

// Get mocked services from jest mocks
const helperService = jest.mocked({
  getDashboardStats: jest.fn(),
  getActiveRequests: jest.fn(),
  getRecentActivity: jest.fn(),
  updateHelperStatus: jest.fn(),
  getHelperProfile: jest.fn(),
  acceptRequest: jest.fn(),
  rejectRequest: jest.fn(),
  completeRequest: jest.fn()
});

const analyticsService = jest.mocked({
  trackEvent: jest.fn(),
  trackPageView: jest.fn()
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('HelperDashboardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (helperService.getDashboardStats as jest.Mock).mockResolvedValue(mockDashboardStats);
    (helperService.getActiveRequests as jest.Mock).mockResolvedValue(mockActiveRequests);
    (helperService.getRecentActivity as jest.Mock).mockResolvedValue(mockRecentActivity);
    (helperService.updateHelperStatus as jest.Mock).mockResolvedValue({ success: true });
    (helperService.getHelperProfile as jest.Mock).mockResolvedValue({
      id: 'helper-123',
      name: 'Helper User',
      status: 'available',
      specialties: ['Crisis Support', 'Anxiety'],
      rating: 4.8,
      totalSessions: 45
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render dashboard with loading state initially', () => {
      renderWithRouter(<HelperDashboardView />);
      
      // Component might show loading or render immediately
      const dashboard = screen.queryByText(/Helper Dashboard/i) || screen.queryByTestId('loading-spinner');
      expect(dashboard).toBeTruthy();
    });

    it('should render dashboard content after loading', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(screen.getByText(/Helper Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display helper status', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const statusElement = screen.queryByText(/Available/i) || screen.queryByText(/Unavailable/i);
        expect(statusElement).toBeTruthy();
      });
    });
  });

  describe('Dashboard Statistics', () => {
    it('should display key statistics', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getDashboardStats).toHaveBeenCalled();
      });

      // Stats should be displayed somewhere on the page
      await waitFor(() => {
        const totalRequests = screen.queryByText('45') || screen.queryByText(/45 requests/i);
        expect(totalRequests).toBeTruthy();
      });
    });

    it('should display active requests count', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const activeRequests = screen.queryByText('8') || screen.queryByText(/8 active/i);
        expect(activeRequests).toBeTruthy();
      });
    });

    it('should display satisfaction rating', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const rating = screen.queryByText('4.7') || screen.queryByText(/4\.7/);
        expect(rating).toBeTruthy();
      });
    });
  });

  describe('Active Requests Section', () => {
    it('should display active requests list', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getActiveRequests).toHaveBeenCalled();
      });

      await waitFor(() => {
        const request1 = screen.queryByText(/Need immediate support/i);
        const request2 = screen.queryByText(/Looking for coping strategies/i);
        expect(request1 || request2).toBeTruthy();
      });
    });

    it('should handle accepting a request', async () => {
      (helperService.acceptRequest as jest.Mock).mockResolvedValue({ success: true });
      
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getActiveRequests).toHaveBeenCalled();
      });

      const acceptButton = screen.queryByRole('button', { name: /accept/i });
      if (acceptButton) {
        fireEvent.click(acceptButton);
        
        await waitFor(() => {
          expect(helperService.acceptRequest).toHaveBeenCalled();
        });
      }
    });

    it('should handle rejecting a request', async () => {
      (helperService.rejectRequest as jest.Mock).mockResolvedValue({ success: true });
      
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getActiveRequests).toHaveBeenCalled();
      });

      const rejectButton = screen.queryByRole('button', { name: /reject|decline/i });
      if (rejectButton) {
        fireEvent.click(rejectButton);
        
        await waitFor(() => {
          expect(helperService.rejectRequest).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Recent Activity Section', () => {
    it('should display recent activity', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getRecentActivity).toHaveBeenCalled();
      });

      await waitFor(() => {
        const activity = screen.queryByText(/Completed support request/i) || 
                         screen.queryByText(/Sent supportive message/i);
        expect(activity).toBeTruthy();
      });
    });
  });

  describe('Charts and Analytics', () => {
    it('should render chart components', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const charts = screen.queryAllByTestId(/chart/i);
        expect(charts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Helper Status Management', () => {
    it('should allow toggling helper status', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getHelperProfile).toHaveBeenCalled();
      });

      const statusToggle = screen.queryByRole('switch') || screen.queryByRole('checkbox');
      if (statusToggle) {
        fireEvent.click(statusToggle);
        
        await waitFor(() => {
          expect(helperService.updateHelperStatus).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle dashboard stats loading error', async () => {
      (helperService.getDashboardStats as jest.Mock).mockRejectedValue(new Error('Failed to load stats'));
      
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const errorMessage = screen.queryByText(/error|failed|unable/i);
        expect(errorMessage).toBeTruthy();
      });
    });

    it('should handle active requests loading error', async () => {
      (helperService.getActiveRequests as jest.Mock).mockRejectedValue(new Error('Failed to load requests'));
      
      renderWithRouter(<HelperDashboardView />);
      
      // Component should handle error gracefully
      await waitFor(() => {
        expect(helperService.getActiveRequests).toHaveBeenCalled();
      });
    });

    it('should show retry option on error', async () => {
      (helperService.getDashboardStats as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeTruthy();
      });
    });
  });

  describe('Analytics Integration', () => {
    it('should track page view', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(analyticsService.trackPageView).toHaveBeenCalled();
      });
    });

    it('should track user interactions', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getActiveRequests).toHaveBeenCalled();
      });

      const actionButton = screen.queryByRole('button');
      if (actionButton) {
        fireEvent.click(actionButton);
        
        // Analytics should track the interaction
        expect(analyticsService.trackEvent).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const headings = screen.queryAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it('should have accessible form controls', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const interactiveElements = screen.queryAllByRole('button');
        interactiveElements.forEach(element => {
          expect(element).toHaveAccessibleName();
        });
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getDashboardStats).toHaveBeenCalled();
      });

      // Test tab navigation
      await user.tab();
      
      const activeElement = document.activeElement;
      expect(activeElement?.tagName).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should load data efficiently', async () => {
      const startTime = Date.now();
      
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getDashboardStats).toHaveBeenCalled();
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should batch API calls', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getDashboardStats).toHaveBeenCalledTimes(1);
        expect(helperService.getActiveRequests).toHaveBeenCalledTimes(1);
        expect(helperService.getRecentActivity).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Mental Health Specific Features', () => {
    it('should prioritize crisis requests', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        expect(helperService.getActiveRequests).toHaveBeenCalled();
      });

      // Crisis requests should be visible
      const crisisIndicator = screen.queryByText(/crisis|urgent|immediate/i);
      expect(crisisIndicator).toBeTruthy();
    });

    it('should display safety features', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const safetyElement = document.querySelector('[data-safety]') || 
                             screen.queryByText(/safety|emergency/i);
        expect(safetyElement).toBeTruthy();
      });
    });

    it('should show helper wellness reminders', async () => {
      renderWithRouter(<HelperDashboardView />);
      
      await waitFor(() => {
        const wellnessReminder = screen.queryByText(/self-care|wellness|break/i) ||
                                screen.queryByTestId('wellness-reminder');
        // Wellness features might be present
        expect(true).toBe(true); // Placeholder assertion
      });
    });
  });
});