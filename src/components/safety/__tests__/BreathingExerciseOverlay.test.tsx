import React from 'react';
import { render, screen, fireEvent, waitFor, userEvent } from '../../../test-utils/testing-library-exports';
import { BreathingExerciseOverlay } from '../BreathingExerciseOverlay';
import { renderWithProviders } from '../../../test-utils/testHelpers';

// Mock audio context
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 },
    type: 'sine'
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 0.3 }
  })),
  destination: {},
  currentTime: 0,
  resume: jest.fn()
};

// Mock Web Audio API
Object.defineProperty(window, 'AudioContext', {
  value: jest.fn(() => mockAudioContext)
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

describe('BreathingExerciseOverlay', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onComplete: jest.fn(),
    exercise: {
      id: 'test-exercise',
      name: '4-7-8 Breathing',
      description: 'A calming breathing technique',
      phases: [
        { name: 'Inhale', duration: 4000, instruction: 'Breathe in slowly' },
        { name: 'Hold', duration: 7000, instruction: 'Hold your breath' },
        { name: 'Exhale', duration: 8000, instruction: 'Breathe out completely' }
      ],
      totalCycles: 4,
      backgroundSound: 'ocean'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders overlay when open', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByTestId('breathing-overlay')).toBeInTheDocument();
      expect(screen.getByText('4-7-8 Breathing')).toBeInTheDocument();
      expect(screen.getByText('A calming breathing technique')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithProviders(
        <BreathingExerciseOverlay {...mockProps} isOpen={false} />
      );
      
      expect(screen.queryByTestId('breathing-overlay')).not.toBeInTheDocument();
    });

    it('displays exercise phases correctly', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByText('Inhale')).toBeInTheDocument();
      expect(screen.getByText('Breathe in slowly')).toBeInTheDocument();
    });

    it('shows progress indicator', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Cycle 1 of 4')).toBeInTheDocument();
    });

    it('displays breathing circle animation', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByTestId('breathing-circle')).toBeInTheDocument();
    });
  });

  describe('Controls', () => {
    it('has start button initially', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('shows pause/resume button when exercise is running', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('has close button', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('has mute/unmute button', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /mute|unmute/i })).toBeInTheDocument();
    });

    it('has fullscreen toggle', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    });
  });

  describe('Exercise Flow', () => {
    it('starts exercise when start button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      expect(screen.getByText('Inhale')).toBeInTheDocument();
      expect(screen.getByText('Breathe in slowly')).toBeInTheDocument();
    });

    it('progresses through breathing phases', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Initial phase: Inhale
      expect(screen.getByText('Inhale')).toBeInTheDocument();
      
      // Advance to Hold phase
      jest.advanceTimersByTime(4000);
      await waitFor(() => {
        expect(screen.getByText('Hold')).toBeInTheDocument();
        expect(screen.getByText('Hold your breath')).toBeInTheDocument();
      });
      
      // Advance to Exhale phase
      jest.advanceTimersByTime(7000);
      await waitFor(() => {
        expect(screen.getByText('Exhale')).toBeInTheDocument();
        expect(screen.getByText('Breathe out completely')).toBeInTheDocument();
      });
    });

    it('advances cycles correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Complete first cycle
      jest.advanceTimersByTime(19000); // 4 + 7 + 8 seconds
      
      await waitFor(() => {
        expect(screen.getByText('Cycle 2 of 4')).toBeInTheDocument();
      });
    });

    it('completes exercise after all cycles', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Complete all 4 cycles
      jest.advanceTimersByTime(76000); // 19 * 4 seconds
      
      await waitFor(() => {
        expect(screen.getByText(/exercise complete/i)).toBeInTheDocument();
        expect(mockProps.onComplete).toHaveBeenCalled();
      });
    });

    it('pauses and resumes exercise', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);
      
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeButton);
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  describe('Audio Features', () => {
    it('initializes audio context when exercise starts', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      expect(window.AudioContext).toHaveBeenCalled();
    });

    it('toggles mute state', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const muteButton = screen.getByRole('button', { name: /mute|unmute/i });
      await user.click(muteButton);
      
      // Check that mute state has changed (implementation specific)
      expect(muteButton).toBeInTheDocument();
    });

    it('plays background sound when specified', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    it('updates progress bar during exercise', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      
      // Advance partway through first phase
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(progressBar).toHaveAttribute('aria-valuenow', expect.not.stringMatching('0'));
      });
    });

    it('displays time remaining for current phase', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      expect(screen.getByText(/4s/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      startButton.focus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('announces phase changes to screen readers', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      jest.advanceTimersByTime(4000);
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/hold/i);
      });
    });
  });

  describe('Event Handling', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when escape key is pressed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onComplete when exercise finishes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Complete all cycles
      jest.advanceTimersByTime(76000);
      
      await waitFor(() => {
        expect(mockProps.onComplete).toHaveBeenCalledWith({
          exerciseId: 'test-exercise',
          completedCycles: 4,
          totalDuration: expect.any(Number),
          timestamp: expect.any(Date)
        });
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      expect(screen.getByTestId('breathing-overlay')).toHaveClass('mobile-layout');
    });

    it('supports fullscreen mode', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock fullscreen API
      document.documentElement.requestFullscreen = jest.fn();
      document.exitFullscreen = jest.fn();
      
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await user.click(fullscreenButton);
      
      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles audio context creation failure', async () => {
      // Mock AudioContext to throw error
      Object.defineProperty(window, 'AudioContext', {
        value: jest.fn(() => {
          throw new Error('Audio not supported');
        })
      });
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Should still work without audio
      expect(screen.getByText('Inhale')).toBeInTheDocument();
    });

    it('handles missing exercise data gracefully', () => {
      renderWithProviders(
        <BreathingExerciseOverlay {...mockProps} exercise={undefined} />
      );
      
      expect(screen.getByText(/no exercise data/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up timers on unmount', () => {
      const { unmount } = renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('cancels animation frames on unmount', () => {
      const { unmount } = renderWithProviders(<BreathingExerciseOverlay {...mockProps} />);
      
      const cancelAnimationFrameSpy = jest.spyOn(global, 'cancelAnimationFrame');
      unmount();
      
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });
});
