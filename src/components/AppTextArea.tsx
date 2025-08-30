import React, { forwardRef, useState, useCallback, useRef, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, Copy, Check, MessageSquare, Mic, MicOff } from 'lucide-react';
import { cn } from '../utils/cn';

interface AppTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;
  maxRows?: number;
  autoResize?: boolean;
  onValueChange?: (value: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // Mental health specific props
  confidential?: boolean;
  triggerWarning?: boolean;
  supportiveMode?: boolean;
  voiceInput?: boolean;
  crisisDetection?: boolean;
  onCrisisDetected?: (content: string, riskLevel: 'low' | 'medium' | 'high') => void;
  // Additional features
  copyable?: boolean;
  clearable?: boolean;
  templateSuggestions?: string[];
  mentionSupport?: boolean;
  mood?: 'neutral' | 'supportive' | 'crisis' | 'celebration';
}

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm', 
  'not worth living', 'better off dead', 'can\'t go on'
];

const MODERATE_RISK_KEYWORDS = [
  'hopeless', 'worthless', 'overwhelming', 'can\'t cope', 'giving up',
  'nobody cares', 'better without me'
];

export const AppTextArea = forwardRef<HTMLTextAreaElement, AppTextAreaProps>(({
  label,
  error,
  success,
  hint,
  required = false,
  showCharCount = false,
  maxLength,
  minHeight = 100,
  maxHeight = 400,
  autoResize = false,
  onValueChange,
  onChange,
  confidential = false,
  triggerWarning = false,
  supportiveMode = false,
  voiceInput = false,
  crisisDetection = false,
  onCrisisDetected,
  copyable = false,
  clearable = false,
  templateSuggestions = [],
  mentionSupport = false,
  mood = 'neutral',
  className = '',
  style,
  value,
  defaultValue,
  placeholder,
  disabled,
  readOnly,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showConfidentialOverlay, setShowConfidentialOverlay] = useState(confidential);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [crisisWarning, setCrisisWarning] = useState<{ level: 'low' | 'medium' | 'high'; message: string } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Use provided ref or internal ref
  const resolvedRef = ref || textareaRef;

  // Current value (controlled or uncontrolled)
  const currentValue = value !== undefined ? String(value) : internalValue;

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && resolvedRef && typeof resolvedRef === 'object' && resolvedRef.current) {
      const textarea = resolvedRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [currentValue, autoResize, minHeight, maxHeight, resolvedRef]);

  // Crisis detection
  useEffect(() => {
    if (!crisisDetection || !currentValue) {
      setCrisisWarning(null);
      return;
    }

    const content = currentValue.toLowerCase();
    
    // Check for high-risk keywords
    const hasHighRisk = CRISIS_KEYWORDS.some(keyword => content.includes(keyword));
    if (hasHighRisk) {
      const warning = {
        level: 'high' as const,
        message: 'We\'re concerned about your safety. Would you like to speak with someone?'
      };
      setCrisisWarning(warning);
      onCrisisDetected?.(currentValue, 'high');
      return;
    }

    // Check for moderate risk keywords
    const hasModerateRisk = MODERATE_RISK_KEYWORDS.some(keyword => content.includes(keyword));
    if (hasModerateRisk) {
      const warning = {
        level: 'medium' as const,
        message: 'It sounds like you\'re going through a difficult time. Support is available.'
      };
      setCrisisWarning(warning);
      onCrisisDetected?.(currentValue, 'medium');
      return;
    }

    setCrisisWarning(null);
  }, [currentValue, crisisDetection, onCrisisDetected]);

  // Voice input setup
  useEffect(() => {
    if (!voiceInput || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const newValue = currentValue + (currentValue ? ' ' : '') + transcript;
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      
      onValueChange?.(newValue);
      onChange?.({
        target: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [voiceInput, currentValue, value, onValueChange, onChange]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    
    // Respect maxLength
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    if (value === undefined) {
      setInternalValue(newValue);
    }

    onValueChange?.(newValue);
    onChange?.(event);
  }, [maxLength, value, onValueChange, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowConfidentialOverlay(false);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (confidential && !currentValue) {
      setShowConfidentialOverlay(true);
    }
  }, [confidential, currentValue]);

  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const handleCopy = useCallback(async () => {
    if (!currentValue) return;

    try {
      await navigator.clipboard.writeText(currentValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = resolvedRef && typeof resolvedRef === 'object' ? resolvedRef.current : null;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [currentValue, resolvedRef]);

  const handleClear = useCallback(() => {
    const newValue = '';
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onValueChange?.(newValue);
    onChange?.({
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [value, onValueChange, onChange]);

  const getMoodClasses = () => {
    switch (mood) {
      case 'supportive':
        return 'border-green-300 focus:border-green-500 focus:ring-green-500';
      case 'crisis':
        return 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50';
      case 'celebration':
        return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    }
  };

  const getCharCount = () => {
    return currentValue.length;
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {confidential && <span className="text-blue-500 ml-1">🔒</span>}
        </label>
      )}

      {/* Trigger Warning */}
      {triggerWarning && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Content Warning:</strong> This content may contain sensitive topics.
              Please proceed with care and remember that support is available.
            </div>
          </div>
        </div>
      )}

      {/* Crisis Warning */}
      {crisisWarning && (
        <div className={cn(
          'mb-3 p-3 border rounded-lg',
          crisisWarning.level === 'high' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-yellow-50 border-yellow-200'
        )}>
          <div className="flex items-start gap-2">
            <AlertCircle className={cn(
              'w-4 h-4 mt-0.5 flex-shrink-0',
              crisisWarning.level === 'high' ? 'text-red-600' : 'text-yellow-600'
            )} />
            <div className={cn(
              'text-sm',
              crisisWarning.level === 'high' ? 'text-red-800' : 'text-yellow-800'
            )}>
              {crisisWarning.message}
              {crisisWarning.level === 'high' && (
                <div className="mt-2 flex gap-2">
                  <button className="bg-red-600 text-white px-3 py-1 text-xs rounded hover:bg-red-700">
                    Get Help Now
                  </button>
                  <button className="bg-red-100 text-red-700 px-3 py-1 text-xs rounded hover:bg-red-200">
                    Call 988
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Suggestions */}
      {templateSuggestions.length > 0 && isFocused && !currentValue && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Suggestions:</h4>
          <div className="space-y-1">
            {templateSuggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  const newValue = suggestion;
                  if (value === undefined) {
                    setInternalValue(newValue);
                  }
                  onValueChange?.(newValue);
                  onChange?.({
                    target: { value: newValue }
                  } as React.ChangeEvent<HTMLTextAreaElement>);
                }}
                className="block text-left text-sm text-blue-700 hover:text-blue-900 hover:underline"
              >
                "{suggestion.substring(0, 60)}..."
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <textarea
          ref={resolvedRef}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          style={{
            minHeight,
            maxHeight: autoResize ? maxHeight : undefined,
            ...style
          }}
          className={cn(
            'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors resize-none',
            getMoodClasses(),
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            success && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            disabled && 'bg-gray-50 cursor-not-allowed',
            readOnly && 'bg-gray-50',
            supportiveMode && 'bg-green-50',
            'placeholder:text-gray-400'
          )}
          {...props}
        />

        {/* Confidential Overlay */}
        {showConfidentialOverlay && (
          <div className="absolute inset-0 bg-gray-100 border rounded-lg flex items-center justify-center cursor-pointer"
               onClick={() => setShowConfidentialOverlay(false)}>
            <div className="text-center text-gray-600">
              <EyeOff className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">Click to reveal confidential content</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(voiceInput || copyable || clearable) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {voiceInput && 'webkitSpeechRecognition' in window && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={disabled || readOnly}
                className={cn(
                  'p-1 rounded text-gray-400 hover:text-gray-600 transition-colors',
                  isListening && 'text-red-500 animate-pulse'
                )}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            
            {copyable && currentValue && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            
            {clearable && currentValue && !disabled && !readOnly && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                title="Clear text"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2 flex justify-between items-start text-sm">
        <div className="space-y-1">
          {hint && !error && !success && (
            <p className="text-gray-500">{hint}</p>
          )}
          {error && (
            <p className="text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-600">{success}</p>
          )}
          {supportiveMode && (
            <p className="text-green-600 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Remember: You're not alone, and your feelings are valid.
            </p>
          )}
        </div>

        {showCharCount && maxLength && (
          <div className={cn(
            'text-gray-500 flex-shrink-0',
            getCharCount() > maxLength * 0.9 && 'text-yellow-600',
            getCharCount() >= maxLength && 'text-red-600'
          )}>
            {getCharCount()}/{maxLength}
          </div>
        )}
      </div>

      {/* Supportive Messages */}
      {supportiveMode && isFocused && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          💚 Take your time. Your thoughts and feelings matter.
        </div>
      )}
    </div>
  );
});

AppTextArea.displayName = 'AppTextArea';

export default AppTextArea;

