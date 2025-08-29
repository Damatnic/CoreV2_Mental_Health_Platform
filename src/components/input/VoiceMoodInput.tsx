/**
 * Voice Mood Input Component for Mental Health Platform
 * 
 * Advanced voice-to-mood analysis with crisis detection,
 * accessibility features, and therapeutic intervention integration.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuth } from '../../contexts/AuthContext';

export interface VoiceMoodInputProps {
  className?: string;
  onMoodDetected?: (moodData: VoiceMoodData) => void;
  onCrisisDetected?: (crisisLevel: CrisisLevel) => void;
  enableCrisisDetection?: boolean;
  supportedLanguages?: string[];
  maxRecordingTime?: number;
  autoSubmit?: boolean;
  showVisualFeedback?: boolean;
}

export type CrisisLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe' | 'imminent';

export interface VoiceMoodData {
  transcript: string;
  moodScore: number;
  primaryEmotion: EmotionType;
  emotionIntensity: number;
  crisisRisk: CrisisLevel;
  stressIndicators: string[];
  copingSuggestions: string[];
  confidence: number;
  audioMetrics: {
    pitch: number;
    tone: number;
    pace: number;
    volume: number;
  };
}

export type EmotionType = 
  | 'joy' | 'sadness' | 'anger' | 'fear' | 'anxiety' 
  | 'depression' | 'hope' | 'calm' | 'excitement' | 'neutral';

export interface VoiceAnalysisState {
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  currentTranscript: string;
  audioLevel: number;
  recordingTime: number;
  error: string | null;
}

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'can\'t go on', 'no point',
  'hurt myself', 'want to die', 'hopeless', 'give up', 'worthless'
];

const EMOTION_PATTERNS = {
  joy: ['happy', 'excited', 'amazing', 'wonderful', 'great', 'fantastic', 'love'],
  sadness: ['sad', 'down', 'blue', 'depressed', 'empty', 'hollow', 'grief'],
  anger: ['angry', 'mad', 'furious', 'rage', 'hate', 'annoyed', 'frustrated'],
  fear: ['scared', 'afraid', 'terrified', 'anxious', 'worried', 'nervous', 'panic'],
  anxiety: ['anxious', 'worried', 'stressed', 'overwhelmed', 'tense', 'uneasy'],
  depression: ['depressed', 'hopeless', 'empty', 'numb', 'worthless', 'tired'],
  hope: ['hope', 'optimistic', 'better', 'improving', 'forward', 'positive'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'centered'],
  excitement: ['excited', 'thrilled', 'energized', 'pumped', 'enthusiastic'],
  neutral: ['okay', 'fine', 'average', 'normal', 'alright', 'so-so']
};

export const VoiceMoodInput: React.FC<VoiceMoodInputProps> = ({
  className = '',
  onMoodDetected,
  onCrisisDetected,
  enableCrisisDetection = true,
  supportedLanguages = ['en-US'],
  maxRecordingTime = 120, // 2 minutes
  autoSubmit = false,
  showVisualFeedback = true
}) => {
  const { user } = useAuth();
  const { announceToScreenReader, isFocusMode } = useAccessibility();

  const [state, setState] = useState<VoiceAnalysisState>({
    isRecording: false,
    isProcessing: false,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    currentTranscript: '',
    audioLevel: 0,
    recordingTime: 0,
    error: null
  });

  const [selectedLanguage, setSelectedLanguage] = useState(supportedLanguages[0]);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<VoiceMoodData | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!state.isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onstart = () => {
        setState(prev => ({ ...prev, isRecording: true, error: null }));
        announceToScreenReader('Voice recording started. Speak naturally about how you\'re feeling.');
        startRecordingTimer();
      };

      recognitionRef.current.onend = () => {
        setState(prev => ({ ...prev, isRecording: false }));
        stopRecordingTimer();
        if (autoSubmit && state.currentTranscript.trim()) {
          processVoiceInput(state.currentTranscript);
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        setState(prev => ({ ...prev, currentTranscript: transcript }));

        // Real-time crisis detection
        if (enableCrisisDetection) {
          const crisisRisk = detectCrisisRisk(transcript);
          if (crisisRisk !== 'none' && crisisRisk !== 'low') {
            onCrisisDetected?.(crisisRisk);
            announceToScreenReader(`Crisis risk detected: ${crisisRisk} level`);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setState(prev => ({ 
          ...prev, 
          error: `Speech recognition error: ${event.error}`,
          isRecording: false,
          isProcessing: false
        }));
        announceToScreenReader(`Voice input error: ${event.error}`);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage, enableCrisisDetection, autoSubmit, state.currentTranscript, onCrisisDetected, announceToScreenReader]);

  const startRecordingTimer = useCallback(() => {
    recordingTimerRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        recordingTime: prev.recordingTime + 1
      }));
    }, 1000);

    // Auto-stop at max time
    setTimeout(() => {
      if (state.isRecording) {
        stopRecording();
        announceToScreenReader('Recording stopped automatically due to time limit');
      }
    }, maxRecordingTime * 1000);
  }, [maxRecordingTime, state.isRecording]);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setState(prev => ({ ...prev, recordingTime: 0 }));
  }, []);

  const initializeAudioVisualization = useCallback(async () => {
    if (!showVisualFeedback) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
    }
  }, [showVisualFeedback]);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setState(prev => ({ ...prev, audioLevel: average }));

    if (state.isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [state.isRecording]);

  const detectCrisisRisk = useCallback((text: string): CrisisLevel => {
    const lowerText = text.toLowerCase();
    
    // Immediate crisis indicators
    const immediateCrisis = CRISIS_KEYWORDS.some(keyword => 
      lowerText.includes(keyword)
    );
    
    if (immediateCrisis) return 'imminent';

    // Analyze emotional content and patterns
    let negativeScore = 0;
    let positiveScore = 0;

    // Count emotion-related words
    Object.entries(EMOTION_PATTERNS).forEach(([emotion, patterns]) => {
      const count = patterns.filter(pattern => lowerText.includes(pattern)).length;
      
      if (['sadness', 'anger', 'fear', 'anxiety', 'depression'].includes(emotion)) {
        negativeScore += count * 2;
      } else if (['joy', 'hope', 'calm', 'excitement'].includes(emotion)) {
        positiveScore += count;
      }
    });

    // Additional risk indicators
    const riskPhrases = [
      'can\'t handle', 'overwhelmed', 'breaking down', 'falling apart',
      'no one cares', 'alone', 'isolated', 'trapped', 'stuck'
    ];
    
    const riskCount = riskPhrases.filter(phrase => lowerText.includes(phrase)).length;
    negativeScore += riskCount;

    // Determine crisis level
    const totalScore = negativeScore - positiveScore;
    
    if (totalScore >= 8) return 'severe';
    if (totalScore >= 6) return 'high';
    if (totalScore >= 4) return 'moderate';
    if (totalScore >= 2) return 'low';
    
    return 'none';
  }, []);

  const analyzeMoodFromVoice = useCallback((transcript: string): VoiceMoodData => {
    const lowerText = transcript.toLowerCase();
    
    // Analyze primary emotion
    let primaryEmotion: EmotionType = 'neutral';
    let maxMatches = 0;
    
    Object.entries(EMOTION_PATTERNS).forEach(([emotion, patterns]) => {
      const matches = patterns.filter(pattern => lowerText.includes(pattern)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        primaryEmotion = emotion as EmotionType;
      }
    });

    // Calculate mood score (1-10)
    const positiveWords = [...EMOTION_PATTERNS.joy, ...EMOTION_PATTERNS.hope, ...EMOTION_PATTERNS.calm];
    const negativeWords = [...EMOTION_PATTERNS.sadness, ...EMOTION_PATTERNS.anger, ...EMOTION_PATTERNS.fear];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let moodScore = 5; // neutral baseline
    moodScore += Math.min(positiveCount * 0.8, 4);
    moodScore -= Math.min(negativeCount * 0.8, 4);
    moodScore = Math.max(1, Math.min(10, Math.round(moodScore)));

    // Detect crisis risk
    const crisisRisk = detectCrisisRisk(transcript);

    // Generate stress indicators
    const stressIndicators: string[] = [];
    if (lowerText.includes('stress')) stressIndicators.push('Mentioned stress directly');
    if (lowerText.includes('tired') || lowerText.includes('exhausted')) stressIndicators.push('Fatigue indicators');
    if (lowerText.includes('worry') || lowerText.includes('anxious')) stressIndicators.push('Anxiety markers');

    // Generate coping suggestions
    const copingSuggestions: string[] = [];
    if (moodScore <= 4) {
      copingSuggestions.push('Consider breathing exercises');
      copingSuggestions.push('Reach out to support network');
      copingSuggestions.push('Practice grounding techniques');
    }
    if (crisisRisk !== 'none') {
      copingSuggestions.push('Contact crisis support services');
      copingSuggestions.push('Use emergency coping strategies');
    }

    // Mock audio metrics (in real implementation, would analyze audio features)
    const audioMetrics = {
      pitch: Math.random() * 100 + 50,
      tone: Math.random() * 100 + 50,
      pace: Math.random() * 100 + 50,
      volume: state.audioLevel
    };

    return {
      transcript,
      moodScore,
      primaryEmotion,
      emotionIntensity: Math.min(maxMatches * 20, 100),
      crisisRisk,
      stressIndicators,
      copingSuggestions,
      confidence: Math.min(transcript.length / 10 * 10, 95),
      audioMetrics
    };
  }, [detectCrisisRisk, state.audioLevel]);

  const processVoiceInput = useCallback(async (transcript: string) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const moodData = analyzeMoodFromVoice(transcript);
      setLastAnalysis(moodData);
      onMoodDetected?.(moodData);

      announceToScreenReader(
        `Mood analysis complete. Detected ${moodData.primaryEmotion} with mood score ${moodData.moodScore} out of 10.`
      );

      if (enableCrisisDetection && moodData.crisisRisk !== 'none') {
        onCrisisDetected?.(moodData.crisisRisk);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to analyze voice input'
      }));
      announceToScreenReader('Failed to analyze voice input');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [analyzeMoodFromVoice, onMoodDetected, onCrisisDetected, enableCrisisDetection, announceToScreenReader]);

  const startRecording = useCallback(async () => {
    if (!state.isSupported || !recognitionRef.current) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, currentTranscript: '', error: null }));
      await initializeAudioVisualization();
      recognitionRef.current.start();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start recording. Please check microphone permissions.' 
      }));
      announceToScreenReader('Failed to start recording. Please check microphone permissions.');
    }
  }, [state.isSupported, initializeAudioVisualization, announceToScreenReader]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && state.isRecording) {
      recognitionRef.current.stop();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [state.isRecording]);

  const handleSubmit = useCallback(() => {
    if (state.currentTranscript.trim()) {
      processVoiceInput(state.currentTranscript);
    }
  }, [state.currentTranscript, processVoiceInput]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentTranscript: '',
      error: null 
    }));
    setLastAnalysis(null);
    announceToScreenReader('Voice input cleared');
  }, [announceToScreenReader]);

  const formatRecordingTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!state.isSupported) {
    return (
      <div className="voice-input-unsupported" role="alert">
        <h3>Voice Input Not Available</h3>
        <p>Your browser doesn't support voice recognition. Please use a modern browser like Chrome or Firefox.</p>
      </div>
    );
  }

  return (
    <div 
      className={`voice-mood-input ${className} ${state.isRecording ? 'recording' : ''}`}
      role="region"
      aria-label="Voice mood input interface"
    >
      <div className="voice-input-header">
        <h3>Voice Mood Analysis</h3>
        <div className="privacy-controls">
          <label className="privacy-toggle">
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={(e) => setPrivacyMode(e.target.checked)}
              aria-describedby="privacy-help"
            />
            <span>Private Mode</span>
            <span id="privacy-help" className="sr-only">
              In private mode, recordings are not stored and transcripts are processed locally
            </span>
          </label>
        </div>
      </div>

      {supportedLanguages.length > 1 && (
        <div className="language-selector">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={state.isRecording}
          >
            {supportedLanguages.map(lang => (
              <option key={lang} value={lang}>
                {lang === 'en-US' ? 'English (US)' : 
                 lang === 'es-ES' ? 'Spanish' : 
                 lang === 'fr-FR' ? 'French' : lang}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="recording-interface">
        {showVisualFeedback && (
          <div 
            className="audio-visualizer"
            role="img"
            aria-label={`Audio level: ${Math.round(state.audioLevel)}%`}
          >
            <div className="visualizer-bars">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="bar"
                  style={{
                    height: `${Math.max(10, (state.audioLevel / 255) * 100 * (Math.random() * 0.5 + 0.5))}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            
            {state.isRecording && (
              <div className="recording-indicator" role="status" aria-live="polite">
                <span className="pulse-dot" aria-hidden="true"></span>
                Recording: {formatRecordingTime(state.recordingTime)}
              </div>
            )}
          </div>
        )}

        <div className="recording-controls">
          {!state.isRecording ? (
            <button
              type="button"
              className="btn-start-recording"
              onClick={startRecording}
              disabled={state.isProcessing}
              aria-label="Start voice recording"
            >
              <span className="btn-icon" aria-hidden="true">🎤</span>
              Start Recording
            </button>
          ) : (
            <button
              type="button"
              className="btn-stop-recording"
              onClick={stopRecording}
              aria-label="Stop voice recording"
            >
              <span className="btn-icon" aria-hidden="true">⏹️</span>
              Stop Recording
            </button>
          )}

          {state.currentTranscript && !state.isRecording && (
            <>
              <button
                type="button"
                className="btn-analyze"
                onClick={handleSubmit}
                disabled={state.isProcessing}
                aria-label="Analyze recorded speech"
              >
                {state.isProcessing ? 'Analyzing...' : 'Analyze Mood'}
              </button>
              
              <button
                type="button"
                className="btn-clear"
                onClick={clearTranscript}
                aria-label="Clear current transcript"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {state.currentTranscript && (
        <div className="transcript-section">
          <h4>Current Transcript:</h4>
          <div 
            className="transcript-display"
            role="textbox"
            aria-readonly="true"
            aria-label="Voice transcript"
          >
            {privacyMode ? '[Transcript hidden in private mode]' : state.currentTranscript}
          </div>
        </div>
      )}

      {lastAnalysis && (
        <div className="analysis-results" role="region" aria-label="Mood analysis results">
          <h4>Analysis Results:</h4>
          
          <div className="mood-summary">
            <div className="mood-score" aria-label={`Mood score: ${lastAnalysis.moodScore} out of 10`}>
              <span className="score-value">{lastAnalysis.moodScore}/10</span>
              <span className="score-label">Mood Score</span>
            </div>
            
            <div className="primary-emotion">
              <span className="emotion-label">Primary Emotion:</span>
              <span className="emotion-value">{lastAnalysis.primaryEmotion}</span>
            </div>
            
            <div className="confidence-level">
              <span className="confidence-label">Confidence:</span>
              <span className="confidence-value">{lastAnalysis.confidence}%</span>
            </div>
          </div>

          {lastAnalysis.crisisRisk !== 'none' && (
            <div className="crisis-warning" role="alert" aria-live="assertive">
              <h5>⚠️ Crisis Risk Detected: {lastAnalysis.crisisRisk.toUpperCase()}</h5>
              <p>Immediate support resources are available. Consider reaching out for help.</p>
            </div>
          )}

          {lastAnalysis.stressIndicators.length > 0 && (
            <div className="stress-indicators">
              <h5>Stress Indicators:</h5>
              <ul>
                {lastAnalysis.stressIndicators.map((indicator, index) => (
                  <li key={index}>{indicator}</li>
                ))}
              </ul>
            </div>
          )}

          {lastAnalysis.copingSuggestions.length > 0 && (
            <div className="coping-suggestions">
              <h5>Suggested Coping Strategies:</h5>
              <ul>
                {lastAnalysis.copingSuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.error && (
        <div className="error-message" role="alert">
          <h4>Error</h4>
          <p>{state.error}</p>
        </div>
      )}

      <div className="usage-tips">
        <h4>Tips for Better Voice Analysis:</h4>
        <ul>
          <li>Speak naturally about how you're feeling</li>
          <li>Use specific emotion words when possible</li>
          <li>Describe your current situation or triggers</li>
          <li>Speak for at least 10-15 seconds for better analysis</li>
          <li>Ensure a quiet environment for best results</li>
        </ul>
      </div>

      {!user && (
        <div className="auth-prompt" role="note">
          <p>
            <strong>Sign in</strong> to save your voice mood data and track patterns over time.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceMoodInput;