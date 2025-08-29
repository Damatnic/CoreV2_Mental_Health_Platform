import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import JournalEditor from '../../../components/JournalEditor';
import JournalPrompts from '../../../components/JournalPrompts';

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
jest.mock('../../../services/encryptionService', () => ({
  encrypt: jest.fn((data) => `encrypted_${data}`),
  decrypt: jest.fn((data) => data.replace('encrypted_', ''))
}));

jest.mock('../../../services/therapeuticAIService', () => ({
  analyzeJournalEntry: jest.fn().mockResolvedValue({
    sentiment: 'positive',
    themes: ['gratitude', 'growth'],
    suggestions: ['Keep focusing on positive aspects']
  })
}));

describe('JournalEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Basic Functionality', () => {
    it('should render the journal editor', () => {
      render(<JournalEditor />);
      
      expect(screen.getByPlaceholderText(/Write your thoughts/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Entry/i })).toBeInTheDocument();
    });

    it('should allow typing in the journal editor', async () => {
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Today was a good day');
      
      expect(editor).toHaveValue('Today was a good day');
    });

    it('should save journal entry when save button is clicked', async () => {
      const encryptionService = require('../../../services/encryptionService');
      
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'My journal entry for today');
      
      const saveButton = screen.getByRole('button', { name: /Save Entry/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(encryptionService.encrypt).toHaveBeenCalledWith('My journal entry for today');
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'journalEntries',
          expect.stringContaining('encrypted_')
        );
      });
      
      expect(screen.getByText(/Entry saved successfully/i)).toBeInTheDocument();
    });

    it('should show character count', async () => {
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Testing character count');
      
      expect(screen.getByText(/23 characters/i)).toBeInTheDocument();
    });

    it('should auto-save draft periodically', async () => {
      jest.useFakeTimers();
      
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Draft content');
      
      // Fast-forward auto-save timer (e.g., 30 seconds)
      jest.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'journalDraft',
          expect.stringContaining('Draft content')
        );
      });
      
      jest.useRealTimers();
    });

    it('should restore draft on mount if exists', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalDraft') {
          return JSON.stringify({
            content: 'Restored draft content',
            timestamp: Date.now()
          });
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      expect(editor).toHaveValue('Restored draft content');
      expect(screen.getByText(/Draft restored/i)).toBeInTheDocument();
    });
  });

  describe('Journal Entries Management', () => {
    it('should display previous journal entries', () => {
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_First entry',
          timestamp: Date.now() - 86400000,
          tags: ['reflection']
        },
        {
          id: '2',
          content: 'encrypted_Second entry',
          timestamp: Date.now() - 172800000,
          tags: ['gratitude']
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      expect(screen.getByText('First entry')).toBeInTheDocument();
      expect(screen.getByText('Second entry')).toBeInTheDocument();
    });

    it('should allow editing existing entries', async () => {
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_Original content',
          timestamp: Date.now() - 86400000
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      const editButton = screen.getByRole('button', { name: /Edit/i });
      fireEvent.click(editButton);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.clear(editor);
      await userEvent.type(editor, 'Updated content');
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'journalEntries',
          expect.stringContaining('Updated content')
        );
      });
    });

    it('should allow deleting entries with confirmation', async () => {
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_Entry to delete',
          timestamp: Date.now()
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);
      
      // Should show confirmation dialog
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      
      const confirmButton = screen.getByRole('button', { name: /Yes, Delete/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'journalEntries',
          '[]'
        );
      });
    });

    it('should allow searching through entries', async () => {
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_Happy memories',
          timestamp: Date.now() - 86400000
        },
        {
          id: '2',
          content: 'encrypted_Sad thoughts',
          timestamp: Date.now() - 172800000
        },
        {
          id: '3',
          content: 'encrypted_Grateful for today',
          timestamp: Date.now()
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      const searchInput = screen.getByPlaceholderText(/Search entries/i);
      await userEvent.type(searchInput, 'Happy');
      
      await waitFor(() => {
        expect(screen.getByText('Happy memories')).toBeInTheDocument();
        expect(screen.queryByText('Sad thoughts')).not.toBeInTheDocument();
        expect(screen.queryByText('Grateful for today')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tags and Categorization', () => {
    it('should allow adding tags to entries', async () => {
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Entry with tags');
      
      const tagInput = screen.getByPlaceholderText(/Add tags/i);
      await userEvent.type(tagInput, 'reflection{enter}gratitude{enter}');
      
      expect(screen.getByText('#reflection')).toBeInTheDocument();
      expect(screen.getByText('#gratitude')).toBeInTheDocument();
      
      const saveButton = screen.getByRole('button', { name: /Save Entry/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'journalEntries',
          expect.stringContaining('reflection')
        );
      });
    });

    it('should filter entries by tags', async () => {
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_Reflection entry',
          timestamp: Date.now(),
          tags: ['reflection']
        },
        {
          id: '2',
          content: 'encrypted_Gratitude entry',
          timestamp: Date.now(),
          tags: ['gratitude']
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      const reflectionTag = screen.getByRole('button', { name: /#reflection/i });
      fireEvent.click(reflectionTag);
      
      await waitFor(() => {
        expect(screen.getByText('Reflection entry')).toBeInTheDocument();
        expect(screen.queryByText('Gratitude entry')).not.toBeInTheDocument();
      });
    });
  });

  describe('AI Analysis Integration', () => {
    it('should analyze journal entry for insights', async () => {
      const therapeuticAIService = require('../../../services/therapeuticAIService');
      
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Today I feel grateful for my family and friends');
      
      const analyzeButton = screen.getByRole('button', { name: /Analyze Entry/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(therapeuticAIService.analyzeJournalEntry).toHaveBeenCalledWith(
          'Today I feel grateful for my family and friends'
        );
      });
      
      expect(screen.getByText(/Sentiment: positive/i)).toBeInTheDocument();
      expect(screen.getByText(/gratitude/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep focusing on positive aspects/i)).toBeInTheDocument();
    });

    it('should provide writing suggestions based on mood', async () => {
      // Mock current mood from mood tracker
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'currentMood') {
          return JSON.stringify({ mood: 'anxious', timestamp: Date.now() });
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      // Should show anxiety-related prompts
      expect(screen.getByText(/What's causing you to feel anxious/i)).toBeInTheDocument();
      expect(screen.getByText(/Describe a moment of calm/i)).toBeInTheDocument();
    });
  });

  describe('Privacy and Security', () => {
    it('should encrypt entries before saving', async () => {
      const encryptionService = require('../../../services/encryptionService');
      
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Sensitive personal information');
      
      const saveButton = screen.getByRole('button', { name: /Save Entry/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(encryptionService.encrypt).toHaveBeenCalledWith(
          expect.stringContaining('Sensitive personal information')
        );
      });
    });

    it('should decrypt entries when displaying', () => {
      const encryptionService = require('../../../services/encryptionService');
      
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_Decrypted content',
          timestamp: Date.now()
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_Decrypted content');
      expect(screen.getByText('Decrypted content')).toBeInTheDocument();
    });

    it('should allow setting entry privacy levels', async () => {
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Private entry');
      
      const privacySelect = screen.getByRole('combobox', { name: /Privacy Level/i });
      fireEvent.change(privacySelect, { target: { value: 'private' } });
      
      const saveButton = screen.getByRole('button', { name: /Save Entry/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'journalEntries',
          expect.stringContaining('"privacy":"private"')
        );
      });
    });

    it('should require authentication for private entries', async () => {
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_Private content',
          timestamp: Date.now(),
          privacy: 'private'
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        if (key === 'authenticated') {
          return 'false';
        }
        return null;
      });
      
      render(<JournalEditor />);
      
      // Should show locked entry
      expect(screen.getByText(/Entry locked/i)).toBeInTheDocument();
      expect(screen.queryByText('Private content')).not.toBeInTheDocument();
      
      const unlockButton = screen.getByRole('button', { name: /Unlock/i });
      expect(unlockButton).toBeInTheDocument();
    });
  });

  describe('Export and Backup', () => {
    it('should allow exporting journal entries', async () => {
      const mockEntries = [
        {
          id: '1',
          content: 'encrypted_Export this entry',
          timestamp: Date.now()
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalEntries') {
          return JSON.stringify(mockEntries);
        }
        return null;
      });
      
      // Mock blob creation
      const mockCreateObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      
      render(<JournalEditor />);
      
      const exportButton = screen.getByRole('button', { name: /Export Journal/i });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it('should allow importing journal backup', async () => {
      render(<JournalEditor />);
      
      const file = new File(['{"entries":[{"content":"Imported entry"}]}'], 'backup.json', {
        type: 'application/json'
      });
      
      const importInput = screen.getByLabelText(/Import Journal/i);
      
      await waitFor(() => {
        fireEvent.change(importInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Import successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      expect(editor).toHaveAttribute('aria-label', expect.stringContaining('Journal'));
      
      const saveButton = screen.getByRole('button', { name: /Save Entry/i });
      expect(saveButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard shortcuts', async () => {
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Test content');
      
      // Ctrl+S to save
      fireEvent.keyDown(editor, { key: 's', ctrlKey: true });
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    it('should announce save status to screen readers', async () => {
      render(<JournalEditor />);
      
      const editor = screen.getByPlaceholderText(/Write your thoughts/i);
      await userEvent.type(editor, 'Accessible entry');
      
      const saveButton = screen.getByRole('button', { name: /Save Entry/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/Entry saved successfully/i);
      });
    });
  });
});

describe('JournalPrompts Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display daily prompts', () => {
    render(<JournalPrompts />);
    
    expect(screen.getByText(/Today's Prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/What are you grateful for/i)).toBeInTheDocument();
  });

  it('should rotate prompts daily', () => {
    const mockDate = new Date('2024-01-01');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    const { rerender } = render(<JournalPrompts />);
    const firstPrompt = screen.getByText(/What are you grateful for/i);
    
    // Change date
    const nextDay = new Date('2024-01-02');
    jest.spyOn(global, 'Date').mockImplementation(() => nextDay);
    
    rerender(<JournalPrompts />);
    
    // Should show different prompt
    expect(screen.queryByText(firstPrompt.textContent!)).not.toBeInTheDocument();
  });

  it('should allow selecting prompts to use', async () => {
    const mockOnSelectPrompt = jest.fn();
    render(<JournalPrompts onSelectPrompt={mockOnSelectPrompt} />);
    
    const prompt = screen.getByText(/What are you grateful for/i);
    fireEvent.click(prompt);
    
    expect(mockOnSelectPrompt).toHaveBeenCalledWith(
      expect.stringContaining('grateful')
    );
  });

  it('should show category-based prompts', async () => {
    render(<JournalPrompts />);
    
    const categoryButton = screen.getByRole('button', { name: /Anxiety/i });
    fireEvent.click(categoryButton);
    
    await waitFor(() => {
      expect(screen.getByText(/What helps you feel calm/i)).toBeInTheDocument();
    });
  });
});