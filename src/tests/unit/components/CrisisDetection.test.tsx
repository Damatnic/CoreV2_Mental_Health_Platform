import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CrisisDetectionDashboard from '../../../components/CrisisDetectionDashboard';
import Crisis988Widget from '../../../components/Crisis988Widget';
import CrisisAlertBanner from '../../../components/CrisisAlertBanner';
import CrisisSupportWidget from '../../../components/CrisisSupportWidget';

// Mock services
jest.mock('../../../services/crisisDetectionService', () => ({
  analyzeCrisisKeywords: jest.fn(),
  assessRiskLevel: jest.fn(),
  generateCrisisReport: jest.fn(),
  getCrisisHistory: jest.fn(),
  updateCrisisSettings: jest.fn()
}));

jest.mock('../../../services/crisis988Service', () => ({
  connect: jest.fn(),
  assessAndConnect: jest.fn(),
  getAvailability: jest.fn(),
  endSession: jest.fn()
}));

jest.mock('../../../services/emergencyEscalationService', () => ({
  escalateCrisis: jest.fn(),
  notifyEmergencyContacts: jest.fn(),
  connectToLocalServices: jest.fn(),
  log911Call: jest.fn()
}));

jest.mock('../../../services/enhancedCrisisDetectionIntegrationService', () => ({
  analyzeCombinedCrisisFactors: jest.fn(),
  triggerMultiLayerResponse: jest.fn(),
  logCrisisEvent: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Crisis Detection System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
    
    // Mock window methods
    global.window.open = jest.fn();
    global.window.confirm = jest.fn();
  });

  describe('CrisisDetectionDashboard', () => {
    it('should render crisis detection dashboard', () => {
      render(<CrisisDetectionDashboard />);
      
      expect(screen.getByText(/Crisis Detection/i)).toBeInTheDocument();
      expect(screen.getByText(/Risk Assessment/i)).toBeInTheDocument();
    });

    it('should display current risk level', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      crisisDetectionService.assessRiskLevel.mockResolvedValueOnce({
        level: 'moderate',
        score: 0.65,
        factors: ['mood_decline', 'isolation_indicators']
      });
      
      render(<CrisisDetectionDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Moderate Risk/i)).toBeInTheDocument();
        expect(screen.getByText(/65%/)).toBeInTheDocument();
      });
    });

    it('should analyze crisis keywords in real-time', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      crisisDetectionService.analyzeCrisisKeywords.mockResolvedValueOnce({
        detectedKeywords: ['hopeless', 'end it all'],
        riskScore: 0.85,
        severity: 'high'
      });
      
      render(<CrisisDetectionDashboard />);
      
      const textInput = screen.getByPlaceholderText(/Test crisis detection/i);
      await userEvent.type(textInput, 'I feel hopeless and want to end it all');
      
      const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(crisisDetectionService.analyzeCrisisKeywords).toHaveBeenCalledWith(
          'I feel hopeless and want to end it all'
        );
        expect(screen.getByText(/High Risk Detected/i)).toBeInTheDocument();
        expect(screen.getByText(/hopeless/i)).toBeInTheDocument();
      });
    });

    it('should show crisis history and patterns', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      crisisDetectionService.getCrisisHistory.mockResolvedValueOnce({
        events: [
          {
            id: '1',
            timestamp: Date.now() - 86400000,
            riskLevel: 'high',
            triggers: ['mood_tracker', 'journal_analysis'],
            resolved: true
          },
          {
            id: '2',
            timestamp: Date.now() - 172800000,
            riskLevel: 'moderate',
            triggers: ['chat_analysis'],
            resolved: true
          }
        ],
        patterns: {
          timeOfDay: 'evening',
          frequency: 'weekly',
          commonTriggers: ['isolation', 'stress']
        }
      });
      
      render(<CrisisDetectionDashboard />);
      
      const historyTab = screen.getByRole('tab', { name: /History/i });
      fireEvent.click(historyTab);
      
      await waitFor(() => {
        expect(screen.getByText(/2 crisis events/i)).toBeInTheDocument();
        expect(screen.getByText(/Evening pattern detected/i)).toBeInTheDocument();
        expect(screen.getByText(/isolation/i)).toBeInTheDocument();
      });
    });

    it('should allow updating crisis detection settings', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      
      render(<CrisisDetectionDashboard />);
      
      const settingsTab = screen.getByRole('tab', { name: /Settings/i });
      fireEvent.click(settingsTab);
      
      const sensitivitySlider = screen.getByRole('slider', { name: /Sensitivity/i });
      fireEvent.change(sensitivitySlider, { target: { value: '80' } });
      
      const saveButton = screen.getByRole('button', { name: /Save Settings/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(crisisDetectionService.updateCrisisSettings).toHaveBeenCalledWith({
          sensitivity: 80
        });
      });
    });
  });

  describe('Crisis988Widget', () => {
    it('should render 988 crisis widget', () => {
      render(<Crisis988Widget />);
      
      expect(screen.getByText(/988 Suicide & Crisis Lifeline/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Call 988/i })).toBeInTheDocument();
    });

    it('should connect to 988 when button clicked', async () => {
      const crisis988Service = require('../../../services/crisis988Service');
      crisis988Service.connect.mockResolvedValueOnce({
        sessionId: 'session-123',
        status: 'connected',
        waitTime: 0
      });
      
      render(<Crisis988Widget />);
      
      const callButton = screen.getByRole('button', { name: /Call 988/i });
      fireEvent.click(callButton);
      
      await waitFor(() => {
        expect(crisis988Service.connect).toHaveBeenCalled();
        expect(screen.getByText(/Connecting to 988/i)).toBeInTheDocument();
      });
    });

    it('should show availability status', async () => {
      const crisis988Service = require('../../../services/crisis988Service');
      crisis988Service.getAvailability.mockResolvedValueOnce({
        available: true,
        waitTime: 120, // 2 minutes
        languagesAvailable: ['english', 'spanish']
      });
      
      render(<Crisis988Widget />);
      
      await waitFor(() => {
        expect(screen.getByText(/Available now/i)).toBeInTheDocument();
        expect(screen.getByText(/~2 minute wait/i)).toBeInTheDocument();
      });
    });

    it('should handle connection failures gracefully', async () => {
      const crisis988Service = require('../../../services/crisis988Service');
      crisis988Service.connect.mockRejectedValueOnce(new Error('Service unavailable'));
      
      render(<Crisis988Widget />);
      
      const callButton = screen.getByRole('button', { name: /Call 988/i });
      fireEvent.click(callButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
        // Fallback option
        expect(screen.getByRole('button', { name: /Call Direct/i })).toBeInTheDocument();
      });
    });

    it('should provide multi-language support', async () => {
      render(<Crisis988Widget />);
      
      const languageSelector = screen.getByRole('combobox', { name: /Language/i });
      fireEvent.change(languageSelector, { target: { value: 'spanish' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Línea de Crisis/i)).toBeInTheDocument();
      });
    });

    it('should auto-assess and connect for high-risk users', async () => {
      const crisis988Service = require('../../../services/crisis988Service');
      const mockCrisisEvent = {
        id: 'crisis-123',
        userId: 'user-456',
        timestamp: new Date(),
        severity: 'critical',
        triggers: ['suicidal_ideation']
      };
      
      crisis988Service.assessAndConnect.mockResolvedValueOnce({
        sessionId: 'emergency-session-789',
        priority: 'urgent',
        status: 'connected'
      });
      
      render(<Crisis988Widget crisisEvent={mockCrisisEvent} autoConnect={true} />);
      
      await waitFor(() => {
        expect(crisis988Service.assessAndConnect).toHaveBeenCalledWith(
          mockCrisisEvent,
          expect.objectContaining({
            triggers: expect.arrayContaining(['suicidal_ideation'])
          }),
          expect.any(Object) // consent object
        );
      });
    });
  });

  describe('CrisisAlertBanner', () => {
    it('should render crisis alert banner when crisis detected', () => {
      const crisisData = {
        level: 'high',
        message: 'We are concerned about your wellbeing',
        resources: ['988', 'textline', 'emergency']
      };
      
      render(<CrisisAlertBanner crisisData={crisisData} />);
      
      expect(screen.getByText(/We are concerned about your wellbeing/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get Help Now/i })).toBeInTheDocument();
    });

    it('should not render when no crisis detected', () => {
      render(<CrisisAlertBanner crisisData={null} />);
      
      expect(screen.queryByText(/We are concerned/i)).not.toBeInTheDocument();
    });

    it('should trigger emergency escalation for critical alerts', async () => {
      const emergencyEscalationService = require('../../../services/emergencyEscalationService');
      
      const criticalCrisis = {
        level: 'critical',
        message: 'Immediate intervention required',
        autoEscalate: true
      };
      
      render(<CrisisAlertBanner crisisData={criticalCrisis} />);
      
      await waitFor(() => {
        expect(emergencyEscalationService.escalateCrisis).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 'critical',
            autoEscalate: true
          })
        );
      });
    });

    it('should allow dismissing non-critical alerts', async () => {
      const crisisData = {
        level: 'moderate',
        message: 'Please consider reaching out for support',
        dismissible: true
      };
      
      const mockOnDismiss = jest.fn();
      render(<CrisisAlertBanner crisisData={crisisData} onDismiss={mockOnDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
      fireEvent.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('should show appropriate resources based on crisis level', () => {
      const highRiskCrisis = {
        level: 'high',
        message: 'High risk detected'
      };
      
      render(<CrisisAlertBanner crisisData={highRiskCrisis} />);
      
      expect(screen.getByRole('button', { name: /Call 988/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Text Crisis Line/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Emergency Services/i })).toBeInTheDocument();
    });
  });

  describe('CrisisSupportWidget', () => {
    it('should render crisis support widget', () => {
      render(<CrisisSupportWidget />);
      
      expect(screen.getByText(/Crisis Support/i)).toBeInTheDocument();
      expect(screen.getByText(/You're not alone/i)).toBeInTheDocument();
    });

    it('should show immediate help options', () => {
      render(<CrisisSupportWidget />);
      
      expect(screen.getByRole('button', { name: /988 Lifeline/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crisis Text/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Local Crisis Center/i })).toBeInTheDocument();
    });

    it('should provide breathing exercises for calming', async () => {
      render(<CrisisSupportWidget />);
      
      const breathingButton = screen.getByRole('button', { name: /Breathing Exercise/i });
      fireEvent.click(breathingButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Breathe in/i)).toBeInTheDocument();
        expect(screen.getByText(/Hold/i)).toBeInTheDocument();
        expect(screen.getByText(/Breathe out/i)).toBeInTheDocument();
      });
    });

    it('should connect to local crisis services', async () => {
      const emergencyEscalationService = require('../../../services/emergencyEscalationService');
      emergencyEscalationService.connectToLocalServices.mockResolvedValueOnce({
        services: [
          {
            name: 'Local Crisis Center',
            phone: '555-0123',
            address: '123 Main St'
          }
        ]
      });
      
      render(<CrisisSupportWidget />);
      
      const localServicesButton = screen.getByRole('button', { name: /Local Crisis Center/i });
      fireEvent.click(localServicesButton);
      
      await waitFor(() => {
        expect(emergencyEscalationService.connectToLocalServices).toHaveBeenCalled();
        expect(screen.getByText('Local Crisis Center')).toBeInTheDocument();
        expect(screen.getByText('555-0123')).toBeInTheDocument();
      });
    });

    it('should log crisis interactions for analytics', async () => {
      const enhancedCrisisService = require('../../../services/enhancedCrisisDetectionIntegrationService');
      
      render(<CrisisSupportWidget />);
      
      const lifeline988 = screen.getByRole('button', { name: /988 Lifeline/i });
      fireEvent.click(lifeline988);
      
      await waitFor(() => {
        expect(enhancedCrisisService.logCrisisEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'resource_accessed',
            resource: '988_lifeline'
          })
        );
      });
    });

    it('should provide safety planning tools', async () => {
      render(<CrisisSupportWidget />);
      
      const safetyPlanButton = screen.getByRole('button', { name: /Safety Plan/i });
      fireEvent.click(safetyPlanButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Create Safety Plan/i)).toBeInTheDocument();
        expect(screen.getByText(/Warning Signs/i)).toBeInTheDocument();
        expect(screen.getByText(/Coping Strategies/i)).toBeInTheDocument();
        expect(screen.getByText(/Support Contacts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integrated Crisis Detection Flow', () => {
    it('should detect crisis across multiple data sources', async () => {
      const enhancedCrisisService = require('../../../services/enhancedCrisisDetectionIntegrationService');
      enhancedCrisisService.analyzeCombinedCrisisFactors.mockResolvedValueOnce({
        overallRisk: 'high',
        confidence: 0.92,
        triggers: [
          { source: 'mood_tracker', severity: 'moderate', content: 'Very low mood for 3 days' },
          { source: 'journal_analysis', severity: 'high', content: 'Hopelessness expressions' },
          { source: 'chat_analysis', severity: 'critical', content: 'Suicidal ideation detected' }
        ]
      });
      
      // Simulate combined data from multiple sources
      const mockData = {
        moodData: { score: 2, trend: 'declining' },
        journalData: { sentiment: 'very_negative', keywords: ['hopeless'] },
        chatData: { messages: ['I don\'t want to live anymore'] }
      };
      
      render(<CrisisDetectionDashboard combinedData={mockData} />);
      
      await waitFor(() => {
        expect(enhancedCrisisService.analyzeCombinedCrisisFactors).toHaveBeenCalledWith(
          expect.objectContaining(mockData)
        );
        expect(screen.getByText(/High Risk - Multiple Sources/i)).toBeInTheDocument();
        expect(screen.getByText(/92% confidence/i)).toBeInTheDocument();
      });
    });

    it('should trigger multi-layer response for high-confidence crises', async () => {
      const enhancedCrisisService = require('../../../services/enhancedCrisisDetectionIntegrationService');
      const emergencyEscalationService = require('../../../services/emergencyEscalationService');
      
      enhancedCrisisService.triggerMultiLayerResponse.mockResolvedValueOnce({
        actions: [
          'immediate_988_connection',
          'emergency_contacts_notified',
          'safety_plan_activated',
          'therapist_alerted'
        ]
      });
      
      const highConfidenceCrisis = {
        risk: 'critical',
        confidence: 0.95,
        triggers: ['suicidal_plan', 'means_available']
      };
      
      render(<CrisisDetectionDashboard crisisEvent={highConfidenceCrisis} />);
      
      await waitFor(() => {
        expect(enhancedCrisisService.triggerMultiLayerResponse).toHaveBeenCalledWith(
          highConfidenceCrisis
        );
        expect(screen.getByText(/Emergency Response Activated/i)).toBeInTheDocument();
        expect(screen.getByText(/988 connection initiated/i)).toBeInTheDocument();
        expect(screen.getByText(/Emergency contacts notified/i)).toBeInTheDocument();
      });
    });

    it('should handle false positives gracefully', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      
      render(<CrisisDetectionDashboard />);
      
      // Simulate false positive detection
      crisisDetectionService.assessRiskLevel.mockResolvedValueOnce({
        level: 'high',
        score: 0.75,
        falsePositiveLikelihood: 0.40
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Risk detected/i)).toBeInTheDocument();
        expect(screen.getByText(/Please confirm/i)).toBeInTheDocument();
      });
      
      // User can dismiss false positive
      const notInCrisisButton = screen.getByRole('button', { name: /I'm okay/i });
      fireEvent.click(notInCrisisButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Thank you for clarifying/i)).toBeInTheDocument();
      });
    });

    it('should provide crisis prevention recommendations', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      crisisDetectionService.assessRiskLevel.mockResolvedValueOnce({
        level: 'moderate',
        score: 0.45,
        preventionTips: [
          'Schedule regular check-ins with support system',
          'Maintain consistent sleep schedule',
          'Practice daily mindfulness exercises'
        ]
      });
      
      render(<CrisisDetectionDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Prevention Recommendations/i)).toBeInTheDocument();
        expect(screen.getByText(/regular check-ins/i)).toBeInTheDocument();
        expect(screen.getByText(/sleep schedule/i)).toBeInTheDocument();
        expect(screen.getByText(/mindfulness exercises/i)).toBeInTheDocument();
      });
    });
  });

  describe('Crisis Data Privacy and Ethics', () => {
    it('should encrypt crisis event data', async () => {
      const mockEncrypt = jest.fn();
      jest.doMock('../../../services/encryptionService', () => ({
        encrypt: mockEncrypt
      }));
      
      const enhancedCrisisService = require('../../../services/enhancedCrisisDetectionIntegrationService');
      
      const crisisEvent = {
        userId: 'user-123',
        content: 'Sensitive crisis information',
        triggers: ['suicidal_ideation']
      };
      
      render(<CrisisDetectionDashboard crisisEvent={crisisEvent} />);
      
      await waitFor(() => {
        expect(enhancedCrisisService.logCrisisEvent).toHaveBeenCalled();
      });
      
      // Verify data was encrypted before storage
      expect(mockEncrypt).toHaveBeenCalledWith(
        expect.stringContaining('Sensitive crisis information')
      );
    });

    it('should obtain consent before sharing data with services', async () => {
      const crisis988Service = require('../../../services/crisis988Service');
      
      render(<Crisis988Widget />);
      
      const callButton = screen.getByRole('button', { name: /Call 988/i });
      fireEvent.click(callButton);
      
      // Should show consent dialog
      await waitFor(() => {
        expect(screen.getByText(/Data Sharing Consent/i)).toBeInTheDocument();
        expect(screen.getByText(/share your information with 988/i)).toBeInTheDocument();
      });
      
      const consentButton = screen.getByRole('button', { name: /I Consent/i });
      fireEvent.click(consentButton);
      
      await waitFor(() => {
        expect(crisis988Service.connect).toHaveBeenCalledWith(
          expect.objectContaining({
            consent: expect.objectContaining({
              dataSharing: true
            })
          })
        );
      });
    });

    it('should allow withdrawing consent', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'crisisConsent') {
          return JSON.stringify({
            dataSharing: true,
            timestamp: Date.now() - 3600000
          });
        }
        return null;
      });
      
      render(<CrisisDetectionDashboard />);
      
      const privacyTab = screen.getByRole('tab', { name: /Privacy/i });
      fireEvent.click(privacyTab);
      
      const withdrawConsentButton = screen.getByRole('button', { name: /Withdraw Consent/i });
      fireEvent.click(withdrawConsentButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'crisisConsent',
          expect.stringContaining('"dataSharing":false')
        );
      });
    });

    it('should minimize data retention', async () => {
      jest.useFakeTimers();
      
      render(<CrisisDetectionDashboard />);
      
      // Simulate data older than retention period (e.g., 30 days)
      const oldData = {
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000),
        content: 'Old crisis data'
      };
      
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([oldData]));
      
      // Fast forward to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours
      });
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'crisisHistory',
          '[]' // Old data removed
        );
      });
      
      jest.useRealTimers();
    });
  });
});