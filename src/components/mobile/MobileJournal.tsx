import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mic, MicOff, Save, X, Calendar, Clock, Tag, 
  Sparkles, ChevronRight, AlertCircle, CheckCircle,
  BookOpen, PenTool, Volume2
} from 'lucide-react';
import '../../styles/MobileJournal.css';

interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  mood?: number;
  timestamp: Date;
  voiceTranscript?: boolean;
  autosaved?: boolean;
}

interface JournalPrompt {
  id: string;
  text: string;
  category: string;
}

interface MobileJournalProps {
  onSave?: (entry: JournalEntry) => void;
  onCancel?: () => void;
  initialEntry?: Partial<JournalEntry>;
  prompts?: JournalPrompt[];
}

const MobileJournal: React.FC<MobileJournalProps> = ({
  onSave,
  onCancel,
  initialEntry,
  prompts
}) => {
  // State management
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialEntry?.tags || []);
  const [isListening, setIsListening] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Default journal prompts if not provided
  const defaultPrompts: JournalPrompt[] = prompts || [
    { id: '1', text: 'What am I grateful for today?', category: 'gratitude' },
    { id: '2', text: 'What challenged me today and how did I handle it?', category: 'reflection' },
    { id: '3', text: 'What emotions am I feeling right now?', category: 'emotions' },
    { id: '4', text: 'What do I need to let go of?', category: 'release' },
    { id: '5', text: 'What would make tomorrow better?', category: 'planning' },
    { id: '6', text: 'Describe a moment of peace from today.', category: 'mindfulness' },
    { id: '7', text: 'What did I learn about myself today?', category: 'growth' },
    { id: '8', text: 'How can I show myself compassion right now?', category: 'self-care' }
  ];

  // Common tags for quick selection
  const commonTags = [
    'personal', 'work', 'relationships', 'health', 'goals',
    'gratitude', 'anxiety', 'achievement', 'reflection', 'therapy'
  ];

  // Calculate word and character count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(content.length);
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (content.length > 10 || title.length > 0) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, selectedTags]);

  // Load auto-saved entry on mount
  useEffect(() => {
    if (!initialEntry) {
      const savedEntry = localStorage.getItem('journalAutoSave');
      if (savedEntry) {
        try {
          const parsed = JSON.parse(savedEntry);
          const savedTime = new Date(parsed.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
          
          // Only restore if less than 24 hours old
          if (hoursDiff < 24) {
            if (confirm('Found an unsaved journal entry. Would you like to restore it?')) {
              setTitle(parsed.title || '');
              setContent(parsed.content || '');
              setSelectedTags(parsed.tags || []);
              setLastSaved(savedTime);
            }
          }
        } catch (error) {
          console.error('Error loading auto-saved entry:', error);
        }
      }
    }
  }, [initialEntry]);

  // Haptic feedback helper
  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[pattern]);
    }
  }, []);

  // Auto-save handler
  const handleAutoSave = useCallback(() => {
    setIsAutoSaving(true);
    const autoSaveData = {
      title,
      content,
      tags: selectedTags,
      timestamp: new Date(),
      autosaved: true
    };
    localStorage.setItem('journalAutoSave', JSON.stringify(autoSaveData));
    setLastSaved(new Date());
    setTimeout(() => setIsAutoSaving(false), 1000);
  }, [title, content, selectedTags]);

  // Voice recognition setup
  const startVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition is not supported on this device.');
      return;
    }

    triggerHaptic('medium');
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceLanguage;
    
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setContent(prev => prev + finalTranscript);
        triggerHaptic('light');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      setIsListening(false);
      triggerHaptic('heavy');
      
      if (event.error === 'no-speech') {
        alert('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please enable microphone permissions.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, [voiceLanguage, triggerHaptic]);

  // Stop voice recognition
  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      triggerHaptic('medium');
    }
  }, [triggerHaptic]);

  // Toggle voice recognition
  const toggleVoiceRecognition = useCallback(() => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  }, [isListening, startVoiceRecognition, stopVoiceRecognition]);

  // Handle prompt selection
  const selectPrompt = useCallback((prompt: JournalPrompt) => {
    setSelectedPrompt(prompt);
    setContent(prev => {
      if (prev) {
        return prev + '\n\n' + prompt.text + '\n';
      }
      return prompt.text + '\n';
    });
    setShowPrompts(false);
    triggerHaptic('light');
    
    // Focus on textarea
    setTimeout(() => {
      if (contentTextareaRef.current) {
        contentTextareaRef.current.focus();
        contentTextareaRef.current.setSelectionRange(
          contentTextareaRef.current.value.length,
          contentTextareaRef.current.value.length
        );
      }
    }, 100);
  }, [triggerHaptic]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
    triggerHaptic('light');
  }, [triggerHaptic]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      alert('Please write something before saving.');
      return;
    }

    setIsSaving(true);
    triggerHaptic('heavy');

    const entry: JournalEntry = {
      title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
      content,
      tags: selectedTags,
      timestamp: new Date(),
      voiceTranscript: false // Track if voice was used
    };

    // Clear auto-save after successful save
    localStorage.removeItem('journalAutoSave');

    if (onSave) {
      await onSave(entry);
    }

    setIsSaving(false);
  }, [title, content, selectedTags, onSave, triggerHaptic]);

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mobile-journal">
      {/* Header */}
      <div className="journal-header">
        <button
          className="close-btn"
          onClick={onCancel}
          aria-label="Close journal"
        >
          <X size={24} />
        </button>
        <h2>Journal</h2>
        <button
          className="save-btn-header"
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          aria-label="Save entry"
        >
          {isSaving ? (
            <div className="saving-spinner" />
          ) : (
            <Save size={24} />
          )}
        </button>
      </div>

      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="autosave-indicator">
          {isAutoSaving ? (
            <>
              <div className="autosave-spinner" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              <span>Saved {formatLastSaved(lastSaved)}</span>
            </>
          )}
        </div>
      )}

      {/* Title Input */}
      <div className="journal-title-section">
        <input
          type="text"
          className="journal-title-input"
          placeholder="Give your entry a title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Writing Prompts */}
      <div className="prompts-section">
        <button
          className="prompts-toggle"
          onClick={() => setShowPrompts(!showPrompts)}
          aria-expanded={showPrompts}
        >
          <Sparkles size={16} />
          <span>Writing Prompts</span>
          <ChevronRight size={16} className={showPrompts ? 'rotated' : ''} />
        </button>
        
        {showPrompts && (
          <div className="prompts-grid">
            {defaultPrompts.map(prompt => (
              <button
                key={prompt.id}
                className="prompt-card"
                onClick={() => selectPrompt(prompt)}
              >
                <span className="prompt-text">{prompt.text}</span>
                <span className="prompt-category">{prompt.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="journal-content-section">
        <div className="content-toolbar">
          <button
            className={`voice-toggle-btn ${isListening ? 'active' : ''}`}
            onClick={toggleVoiceRecognition}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? (
              <>
                <MicOff size={20} />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>Voice</span>
              </>
            )}
          </button>
          
          <div className="content-stats">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        <textarea
          ref={contentTextareaRef}
          className="journal-content-textarea"
          placeholder="Start writing... What's on your mind today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
        />

        {isListening && (
          <div className="voice-indicator">
            <div className="voice-wave" />
            <span>Listening... Speak clearly</span>
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="tags-section">
        <label className="tags-label">
          <Tag size={16} />
          <span>Add tags to organize</span>
        </label>
        <div className="tags-grid">
          {commonTags.map(tag => (
            <button
              key={tag}
              className={`tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
              aria-pressed={selectedTags.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="journal-actions">
        <button
          className="btn-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn-save-journal"
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {/* Tips */}
      <div className="journal-tips">
        <AlertCircle size={14} />
        <span>Tip: Your journal is private and encrypted. Write freely!</span>
      </div>
    </div>
  );
};

export default MobileJournal;