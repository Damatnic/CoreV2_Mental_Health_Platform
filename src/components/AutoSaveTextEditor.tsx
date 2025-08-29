import React, { useState, useEffect, useCallback } from 'react';
import { Save, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import '../styles/AutoSaveTextEditor.css';

interface AutoSaveTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onSave?: (content: string) => Promise<boolean>;
  autoSaveDelay?: number;
  maxLength?: number;
  showWordCount?: boolean;
  className?: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const AutoSaveTextEditor: React.FC<AutoSaveTextEditorProps> = ({
  initialContent = '',
  placeholder = 'Start writing...',
  onSave,
  autoSaveDelay = 3000,
  maxLength,
  showWordCount = true,
  className = ''
}) => {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveTimeoutId, setSaveTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const performSave = useCallback(async (textToSave: string) => {
    if (!onSave || textToSave === initialContent) return;
    
    setSaveStatus('saving');
    
    try {
      const success = await onSave(textToSave);
      if (success) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset status after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  }, [onSave, initialContent]);

  const handleContentChange = (newContent: string) => {
    // Apply max length limit
    if (maxLength && newContent.length > maxLength) {
      newContent = newContent.substring(0, maxLength);
    }
    
    setContent(newContent);
    
    // Clear existing timeout
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    
    // Set new auto-save timeout
    if (newContent.trim() && newContent !== initialContent) {
      setSaveStatus('idle');
      const timeoutId = setTimeout(() => {
        performSave(newContent);
      }, autoSaveDelay);
      
      setSaveTimeoutId(timeoutId);
    }
  };

  const handleManualSave = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      setSaveTimeoutId(null);
    }
    performSave(content);
  };

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="loading-spinner" />;
      case 'saved':
        return <CheckCircle size={16} className="status-saved" />;
      case 'error':
        return <AlertTriangle size={16} className="status-error" />;
      default:
        return <Clock size={16} className="status-idle" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved';
      case 'error':
        return 'Save failed - try again';
      default:
        return content !== initialContent ? 'Unsaved changes' : 'All changes saved';
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
    };
  }, [saveTimeoutId]);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (content !== initialContent && saveStatus !== 'saved') {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [content, initialContent, saveStatus]);

  return (
    <div className={`auto-save-text-editor ${className}`}>
      <div className="editor-header">
        <div className="save-status">
          {getSaveStatusIcon()}
          <span className={`status-text status-${saveStatus}`}>
            {getSaveStatusText()}
          </span>
        </div>
        
        {onSave && (
          <button
            className="manual-save-btn"
            onClick={handleManualSave}
            disabled={saveStatus === 'saving' || content === initialContent}
          >
            <Save size={16} />
            Save Now
          </button>
        )}
      </div>

      <div className="editor-content">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          className="editor-textarea"
        />
      </div>

      <div className="editor-footer">
        {showWordCount && (
          <div className="word-count">
            <span className="words">
              {getWordCount(content)} words
            </span>
            <span className="characters">
              {getCharacterCount(content)}
              {maxLength && ` / ${maxLength}`} characters
            </span>
          </div>
        )}
        
        {maxLength && (
          <div className="character-limit">
            <div 
              className="limit-bar"
              style={{
                width: `${(content.length / maxLength) * 100}%`,
                backgroundColor: content.length > maxLength * 0.9 ? '#ef4444' : '#10b981'
              }}
            />
          </div>
        )}
      </div>

      {saveStatus === 'error' && (
        <div className="error-message">
          <AlertTriangle size={16} />
          <span>
            Failed to save your changes. Please check your connection and try again.
          </span>
          <button onClick={handleManualSave} className="retry-btn">
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default AutoSaveTextEditor;
