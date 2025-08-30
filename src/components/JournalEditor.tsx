/**
 * Enhanced Accessible Journal Editor Component
 * WCAG 2.1 AA compliant journal editor with voice input, keyboard navigation,
 * and screen reader support for mental health journaling
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, Edit3, Calendar, Mic, MicOff, Volume2, Keyboard, Type, AlertCircle } from 'lucide-react';

interface JournalEditorProps {
  onSave?: (content: string) => void;
  initialContent?: string;
  placeholder?: string;
  enableVoiceInput?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  maxLength?: number;
  minLength?: number;
  accessibilityMode?: 'standard' | 'enhanced' | 'simplified';
  highContrastMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
  lineSpacing?: 'normal' | 'relaxed' | 'loose';
  voiceLanguage?: string;
}

const JournalEditor: React.FC<JournalEditorProps> = ({
  onSave,
  initialContent = '',
  placeholder = 'Write your thoughts here...',
  enableVoiceInput = true,
  enableAutoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  maxLength = 10000,
  minLength = 0,
  accessibilityMode = 'standard',
  highContrastMode = false,
  fontSize = 'medium',
  lineSpacing = 'normal',
  voiceLanguage = 'en-US'
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Screen reader announcement helper
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 100);
    }
  }, []);

  // Calculate word and character counts
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
    
    // Validate content length
    if (maxLength && content.length > maxLength) {
      setValidationError(`Content exceeds maximum length of ${maxLength} characters`);
    } else if (minLength && content.length < minLength && content.length > 0) {
      setValidationError(`Content must be at least ${minLength} characters`);
    } else {
      setValidationError(null);
    }
  }, [content, maxLength, minLength]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !content.trim()) return;
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true);
    }, autoSaveInterval);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, enableAutoSave, autoSaveInterval]);

  // Voice input initialization
  useEffect(() => {
    if (!enableVoiceInput) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      announceToScreenReader('Voice input is not supported in your browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceLanguage;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
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
        announceToScreenReader('Voice input added to journal');
      }
      
      setVoiceTranscript(interimTranscript);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      announceToScreenReader(`Voice input error: ${event.error}`);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      announceToScreenReader('Voice input stopped');
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enableVoiceInput, voiceLanguage, announceToScreenReader]);

  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      announceToScreenReader('Voice input stopped');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      announceToScreenReader('Voice input started. Speak to add to your journal.');
    }
  }, [isListening, announceToScreenReader]);

  const handleSave = async (isAutoSave = false) => {
    if (validationError) {
      announceToScreenReader(validationError, 'assertive');
      return;
    }
    
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(content);
        setLastSaved(new Date());
        announceToScreenReader(isAutoSave ? 'Journal auto-saved' : 'Journal entry saved successfully');
      }
    } catch (error) {
      announceToScreenReader('Failed to save journal entry. Please try again.', 'assertive');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Alt + V: Toggle voice input
      if (e.altKey && e.key === 'v' && enableVoiceInput) {
        e.preventDefault();
        toggleVoiceInput();
      }
      // Alt + C: Clear content (with confirmation)
      if (e.altKey && e.key === 'c' && content.trim()) {
        e.preventDefault();
        if (confirm('Are you sure you want to clear your journal entry?')) {
          setContent('');
          announceToScreenReader('Journal entry cleared');
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [content, enableVoiceInput, toggleVoiceInput]);

  // Get text styles based on accessibility settings
  const getTextStyles = () => {
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '20px',
      'extra-large': '24px'
    };
    
    const lineHeightMap = {
      'normal': '1.5',
      'relaxed': '1.75',
      'loose': '2'
    };
    
    return {
      fontSize: fontSizeMap[fontSize],
      lineHeight: lineHeightMap[lineSpacing],
      fontFamily: accessibilityMode === 'simplified' ? 'Arial, sans-serif' : 'inherit'
    };
  };

  const editorClasses = [
    'journal-editor p-4 rounded-lg shadow',
    highContrastMode ? 'bg-black text-white border-2 border-white' : 'bg-white',
    accessibilityMode === 'simplified' && 'simplified-mode'
  ].filter(Boolean).join(' ');

  const textareaClasses = [
    'w-full h-64 p-3 rounded-md resize-none transition-all',
    highContrastMode 
      ? 'bg-black text-white border-2 border-white focus:ring-4 focus:ring-yellow-400' 
      : 'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    validationError && 'border-red-500 focus:ring-red-500'
  ].filter(Boolean).join(' ');

  return (
    <div className={editorClasses}>
      {/* Screen reader announcer */}
      <div
        ref={announcerRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" id="journal-editor-title">
          <Edit3 className="w-5 h-5" aria-hidden="true" />
          Journal Entry
        </h3>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="text-sm text-gray-500" aria-live="polite">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <time dateTime={new Date().toISOString()}>
              {new Date().toLocaleDateString()}
            </time>
          </div>
        </div>
      </div>

      {/* Voice input indicator */}
      {isListening && (
        <div className="mb-2 p-2 bg-blue-50 rounded-md flex items-center gap-2" role="status">
          <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-sm">Listening... {voiceTranscript}</span>
        </div>
      )}

      <div className="relative">
        <label htmlFor="journal-textarea" className="sr-only">
          Journal entry text area. {enableVoiceInput && 'Press Alt+V to toggle voice input.'}
        </label>
        <textarea
          ref={textareaRef}
          id="journal-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className={textareaClasses}
          style={getTextStyles()}
          rows={10}
          maxLength={maxLength}
          aria-labelledby="journal-editor-title"
          aria-describedby={validationError ? 'validation-error' : 'character-count'}
          aria-invalid={!!validationError}
          spellCheck={true}
          autoComplete="off"
        />
        
        {/* Voice input button */}
        {enableVoiceInput && (
          <button
            onClick={toggleVoiceInput}
            className={`absolute top-2 right-2 p-2 rounded-md transition-colors ${
              isListening 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isListening}
            title="Toggle voice input (Alt+V)"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div id="validation-error" className="mt-2 flex items-center gap-2 text-red-600" role="alert">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm">{validationError}</span>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="flex flex-col gap-1">
          <div id="character-count" className="text-sm text-gray-500">
            <span aria-label={`${characterCount} characters`}>
              {characterCount}{maxLength && `/${maxLength}`} characters
            </span>
            {' • '}
            <span aria-label={`${wordCount} words`}>
              {wordCount} words
            </span>
          </div>
          {enableAutoSave && (
            <div className="text-xs text-gray-400">
              Auto-save enabled • Every {autoSaveInterval / 1000} seconds
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Keyboard shortcuts help */}
          <button
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Keyboard shortcuts: Ctrl+S to save, Alt+V for voice input, Alt+C to clear"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          
          {/* Save button */}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving || !content.trim() || !!validationError}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              highContrastMode
                ? 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            } disabled:cursor-not-allowed`}
            aria-label={isSaving ? 'Saving journal entry' : 'Save journal entry (Ctrl+S)'}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalEditor;
