import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MoodTracker from '../../../components/MoodTracker';

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

// Mock services
jest.mock('../../../services/crisisDetectionService', () => ({
  analyzeMoodForCrisis: jest.fn().mockResolvedValue({
    risk: 'low',
    confidence: 0.8,
    triggers: []
  })
}));

jest.mock('../../../services/therapeuticAIService', () => ({
  getInterventionRecommendations: jest.fn().mockResolvedValue({
    recommendations: [
      { type: 'breathing', description: 'Try a breathing exercise' }
    ]
  })
}));

describe('MoodTracker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('should render the mood tracker with default state', () => {
      render(<MoodTracker />);
      
      expect(screen.getByText(/How are you feeling/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Track My Mood/i })).toBeInTheDocument();
    });

    it('should display mood options when tracking is initiated', async () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        // Check for mood option emojis
        expect(screen.getByText('😊')).toBeInTheDocument();
        expect(screen.getByText('😐')).toBeInTheDocument();
        expect(screen.getByText('😔')).toBeInTheDocument();
        expect(screen.getByText('😰')).toBeInTheDocument();
        expect(screen.getByText('😡')).toBeInTheDocument();
      });
    });

    it('should allow selecting a mood option', async () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        expect(screen.getByText('😊')).toBeInTheDocument();
      });
      
      const happyMood = screen.getByText('😊').closest('button');
      fireEvent.click(happyMood!);
      
      await waitFor(() => {
        expect(happyMood).toHaveClass('selected');
      });
    });

    it('should show additional context fields after mood selection', async () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        expect(screen.getByText('😊')).toBeInTheDocument();
      });
      
      const happyMood = screen.getByText('😊').closest('button');
      fireEvent.click(happyMood!);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Any thoughts/i)).toBeInTheDocument();
        expect(screen.getByText(/What factors/i)).toBeInTheDocument();
      });
    });

    it('should save mood entry when submitted', async () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        expect(screen.getByText('😊')).toBeInTheDocument();
      });
      
      const happyMood = screen.getByText('😊').closest('button');
      fireEvent.click(happyMood!);
      
      const notesInput = screen.getByPlaceholderText(/Any thoughts/i);
      await userEvent.type(notesInput, 'Feeling great today!');
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'moodEntries',
          expect.stringContaining('Feeling great today!')
        );
      });
    });
  });

  describe('Mood History and Analytics', () => {
    it('should display mood history when entries exist', () => {
      const mockEntries = [
        {
          id: '1',
          mood: { id: 'happy', emoji: '😊', label: 'Happy', value: 8 },
          timestamp: Date.now() - 3600000,
          notes: 'Good day'
        },
        {
          id: '2',
          mood: { id: 'sad', emoji: '😔', label: 'Sad', value: 3 },
          timestamp: Date.now() - 7200000,
          notes: 'Tough morning'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));
      
      render(<MoodTracker />);
      
      expect(screen.getByText('Good day')).toBeInTheDocument();
      expect(screen.getByText('Tough morning')).toBeInTheDocument();
    });

    it('should calculate and display mood statistics', () => {
      const mockEntries = [
        {
          id: '1',
          mood: { id: 'happy', emoji: '😊', label: 'Happy', value: 8 },
          timestamp: Date.now() - 3600000
        },
        {
          id: '2',
          mood: { id: 'neutral', emoji: '😐', label: 'Neutral', value: 5 },
          timestamp: Date.now() - 7200000
        },
        {
          id: '3',
          mood: { id: 'sad', emoji: '😔', label: 'Sad', value: 3 },
          timestamp: Date.now() - 10800000
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));
      
      render(<MoodTracker />);
      
      const statsButton = screen.getByRole('button', { name: /View Statistics/i });
      fireEvent.click(statsButton);
      
      expect(screen.getByText(/Average Mood/i)).toBeInTheDocument();
      expect(screen.getByText(/5.3/)).toBeInTheDocument(); // Average of 8, 5, 3
    });

    it('should show mood trends over time', async () => {
      const mockEntries = Array.from({ length: 7 }, (_, i) => ({
        id: `${i}`,
        mood: { 
          id: i % 2 === 0 ? 'happy' : 'neutral', 
          emoji: i % 2 === 0 ? '😊' : '😐',
          label: i % 2 === 0 ? 'Happy' : 'Neutral',
          value: i % 2 === 0 ? 8 : 5
        },
        timestamp: Date.now() - (i * 86400000) // One entry per day
      }));
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));
      
      render(<MoodTracker />);
      
      const trendsButton = screen.getByRole('button', { name: /View Trends/i });
      fireEvent.click(trendsButton);
      
      await waitFor(() => {
        expect(screen.getByText(/7-Day Trend/i)).toBeInTheDocument();
        expect(screen.getByText(/Mood Pattern/i)).toBeInTheDocument();
      });
    });

    it('should allow deleting mood entries', async () => {
      const mockEntries = [
        {
          id: '1',
          mood: { id: 'happy', emoji: '😊', label: 'Happy', value: 8 },
          timestamp: Date.now() - 3600000,
          notes: 'Good day'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));
      
      render(<MoodTracker />);
      
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'moodEntries',
          '[]'
        );
      });
    });
  });

  describe('Crisis Detection Integration', () => {
    it('should trigger crisis detection for concerning moods', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      crisisDetectionService.analyzeMoodForCrisis.mockResolvedValueOnce({
        risk: 'high',
        confidence: 0.95,
        triggers: ['very_sad', 'isolation']
      });
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        expect(screen.getByText('😰')).toBeInTheDocument();
      });
      
      const anxiousMood = screen.getByText('😰').closest('button');
      fireEvent.click(anxiousMood!);
      
      const notesInput = screen.getByPlaceholderText(/Any thoughts/i);
      await userEvent.type(notesInput, 'Feeling really overwhelmed and alone');
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(crisisDetectionService.analyzeMoodForCrisis).toHaveBeenCalledWith(
          expect.objectContaining({
            mood: expect.objectContaining({ id: 'anxious' }),
            notes: 'Feeling really overwhelmed and alone'
          })
        );
      });
      
      // Should show crisis resources
      expect(screen.getByText(/Would you like to talk/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get Support/i })).toBeInTheDocument();
    });

    it('should not show crisis resources for positive moods', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        expect(screen.getByText('😊')).toBeInTheDocument();
      });
      
      const happyMood = screen.getByText('😊').closest('button');
      fireEvent.click(happyMood!);
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(crisisDetectionService.analyzeMoodForCrisis).toHaveBeenCalled();
      });
      
      // Should not show crisis resources for positive mood
      expect(screen.queryByText(/Would you like to talk/i)).not.toBeInTheDocument();
    });
  });

  describe('Therapeutic Recommendations', () => {
    it('should show intervention recommendations based on mood', async () => {
      const therapeuticAIService = require('../../../services/therapeuticAIService');
      therapeuticAIService.getInterventionRecommendations.mockResolvedValueOnce({
        recommendations: [
          { type: 'breathing', description: 'Try a 4-7-8 breathing exercise' },
          { type: 'mindfulness', description: 'Practice 5-minute mindfulness' }
        ]
      });
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        expect(screen.getByText('😔')).toBeInTheDocument();
      });
      
      const sadMood = screen.getByText('😔').closest('button');
      fireEvent.click(sadMood!);
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(therapeuticAIService.getInterventionRecommendations).toHaveBeenCalled();
        expect(screen.getByText(/Try a 4-7-8 breathing exercise/i)).toBeInTheDocument();
        expect(screen.getByText(/Practice 5-minute mindfulness/i)).toBeInTheDocument();
      });
    });

    it('should track engagement with recommendations', async () => {
      const therapeuticAIService = require('../../../services/therapeuticAIService');
      therapeuticAIService.getInterventionRecommendations.mockResolvedValueOnce({
        recommendations: [
          { id: 'rec1', type: 'breathing', description: 'Breathing exercise' }
        ]
      });
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      const sadMood = screen.getByText('😔').closest('button');
      fireEvent.click(sadMood!);
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Breathing exercise/i)).toBeInTheDocument();
      });
      
      const tryButton = screen.getByRole('button', { name: /Try This/i });
      fireEvent.click(tryButton);
      
      // Should track engagement
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('recommendationEngagement'),
        expect.any(String)
      );
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      expect(trackButton).toHaveAttribute('aria-label');
      
      fireEvent.click(trackButton);
      
      const moodOptions = screen.getAllByRole('button');
      moodOptions.forEach(option => {
        if (option.textContent?.match(/[😊😐😔😰😡]/)) {
          expect(option).toHaveAttribute('aria-label');
        }
      });
    });

    it('should be keyboard navigable', async () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      trackButton.focus();
      
      // Simulate Enter key to open mood options
      fireEvent.keyDown(trackButton, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('😊')).toBeInTheDocument();
      });
      
      // Tab through mood options
      const happyMood = screen.getByText('😊').closest('button');
      happyMood!.focus();
      
      fireEvent.keyDown(happyMood!, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(happyMood).toHaveClass('selected');
      });
    });

    it('should announce mood selection to screen readers', async () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        expect(screen.getByText('😊')).toBeInTheDocument();
      });
      
      const happyMood = screen.getByText('😊').closest('button');
      fireEvent.click(happyMood!);
      
      // Check for screen reader announcement
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/Happy mood selected/i);
    });

    it('should support voice input for mood tracking', async () => {
      // Mock speech recognition
      const mockSpeechRecognition = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
      };
      
      (window as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
      
      render(<MoodTracker />);
      
      const voiceButton = screen.getByRole('button', { name: /Use Voice/i });
      fireEvent.click(voiceButton);
      
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      
      // Simulate voice input
      const onResult = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )?.[1];
      
      if (onResult) {
        onResult({
          results: [[{ transcript: 'I feel happy today' }]]
        });
      }
      
      await waitFor(() => {
        const happyMood = screen.getByText('😊').closest('button');
        expect(happyMood).toHaveClass('selected');
      });
    });
  });

  describe('Cultural Adaptations', () => {
    it('should display culturally appropriate mood options', async () => {
      // Mock user culture preference
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'userCulture') return 'japanese';
        return null;
      });
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      await waitFor(() => {
        // Should show culturally adapted labels
        expect(screen.getByText(/genki/i)).toBeInTheDocument(); // Japanese for "energetic/well"
      });
    });

    it('should respect cultural privacy preferences', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'culturalPrivacy') return 'high';
        return null;
      });
      
      render(<MoodTracker />);
      
      // Should not show mood history by default for high privacy cultures
      expect(screen.queryByText(/Recent Moods/i)).not.toBeInTheDocument();
      
      // Should require explicit action to view history
      const showHistoryButton = screen.getByRole('button', { name: /View Private History/i });
      expect(showHistoryButton).toBeInTheDocument();
    });
  });

  describe('Data Privacy and Security', () => {
    it('should encrypt sensitive mood data before storage', async () => {
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      const sadMood = screen.getByText('😔').closest('button');
      fireEvent.click(sadMood!);
      
      const notesInput = screen.getByPlaceholderText(/Any thoughts/i);
      await userEvent.type(notesInput, 'Sensitive personal information');
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        const savedData = localStorageMock.setItem.mock.calls[0][1];
        // Should not contain plain text sensitive information
        expect(savedData).not.toContain('Sensitive personal information');
        // Should be encrypted (base64 or similar)
        expect(savedData).toMatch(/^[A-Za-z0-9+/=]+$/);
      });
    });

    it('should allow data export for user control', async () => {
      const mockEntries = [
        {
          id: '1',
          mood: { id: 'happy', emoji: '😊', label: 'Happy', value: 8 },
          timestamp: Date.now(),
          notes: 'Good day'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));
      
      render(<MoodTracker />);
      
      const exportButton = screen.getByRole('button', { name: /Export Data/i });
      
      // Mock blob creation and download
      const mockCreateObjectURL = jest.fn();
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it('should allow complete data deletion', async () => {
      const mockEntries = [
        {
          id: '1',
          mood: { id: 'happy', emoji: '😊', label: 'Happy', value: 8 },
          timestamp: Date.now()
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));
      
      render(<MoodTracker />);
      
      const deleteAllButton = screen.getByRole('button', { name: /Delete All Data/i });
      fireEvent.click(deleteAllButton);
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /Yes, Delete Everything/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('moodEntries');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('moodAnalytics');
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce notes input to prevent excessive saves', async () => {
      jest.useFakeTimers();
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      const happyMood = screen.getByText('😊').closest('button');
      fireEvent.click(happyMood!);
      
      const notesInput = screen.getByPlaceholderText(/Any thoughts/i);
      
      // Type multiple characters quickly
      await userEvent.type(notesInput, 'Testing debounce');
      
      // Auto-save should be debounced
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      });
      
      jest.useRealTimers();
    });

    it('should paginate mood history for large datasets', () => {
      const mockEntries = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        mood: { id: 'happy', emoji: '😊', label: 'Happy', value: 8 },
        timestamp: Date.now() - (i * 3600000),
        notes: `Entry ${i}`
      }));
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));
      
      render(<MoodTracker />);
      
      // Should only show first page (e.g., 10 entries)
      const visibleEntries = screen.getAllByText(/Entry \d+/);
      expect(visibleEntries).toHaveLength(10);
      
      // Should have pagination controls
      expect(screen.getByRole('button', { name: /Next Page/i })).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 5/i)).toBeInTheDocument();
    });

    it('should lazy load mood analytics', async () => {
      render(<MoodTracker />);
      
      // Analytics should not be loaded initially
      expect(screen.queryByText(/Mood Analytics/i)).not.toBeInTheDocument();
      
      const analyticsButton = screen.getByRole('button', { name: /View Analytics/i });
      fireEvent.click(analyticsButton);
      
      // Show loading state
      expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/Mood Analytics/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      const happyMood = screen.getByText('😊').closest('button');
      fireEvent.click(happyMood!);
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to save/i)).toBeInTheDocument();
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors for crisis detection', async () => {
      const crisisDetectionService = require('../../../services/crisisDetectionService');
      crisisDetectionService.analyzeMoodForCrisis.mockRejectedValueOnce(new Error('Network error'));
      
      render(<MoodTracker />);
      
      const trackButton = screen.getByRole('button', { name: /Track My Mood/i });
      fireEvent.click(trackButton);
      
      const anxiousMood = screen.getByText('😰').closest('button');
      fireEvent.click(anxiousMood!);
      
      const saveButton = screen.getByRole('button', { name: /Save Mood/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        // Should still save mood locally even if crisis detection fails
        expect(localStorageMock.setItem).toHaveBeenCalled();
        // Should show offline crisis resources
        expect(screen.getByText(/Offline Support Resources/i)).toBeInTheDocument();
      });
    });
  });
});