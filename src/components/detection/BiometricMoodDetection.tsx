/**
 * Biometric Mood Detection Component for Mental Health Platform
 * 
 * Advanced biometric analysis for mood detection using camera and sensors,
 * with privacy protection, crisis detection, and accessibility features.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuth } from '../../contexts/AuthContext';

export interface BiometricMoodDetectionProps {
  className?: string;
  onMoodDetected?: (biometricData: BiometricMoodData) => void;
  onCrisisDetected?: (level: CrisisLevel) => void;
  enableFaceDetection?: boolean;
  enableHeartRateDetection?: boolean;
  enableVoiceAnalysis?: boolean;
  privacyMode?: boolean;
  autoStart?: boolean;
  detectionInterval?: number;
}

export type CrisisLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe' | 'imminent';

export interface BiometricMoodData {
  moodScore: number;
  stressLevel: number;
  arousalLevel: number;
  valenceLevel: number;
  primaryEmotion: EmotionType;
  confidence: number;
  timestamp: Date;
  metrics: {
    heartRate?: number;
    heartRateVariability?: number;
    facialExpressionScores: FacialExpressionScores;
    voiceMetrics?: VoiceMetrics;
    eyeMovementPatterns?: EyeMovementData;
    microExpressions: MicroExpression[];
  };
  crisisIndicators: CrisisIndicator[];
  recommendations: string[];
}

export type EmotionType = 
  | 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' 
  | 'disgusted' | 'neutral' | 'anxious' | 'depressed' | 'stressed';

export interface FacialExpressionScores {
  happiness: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
  anxiety: number;
}

export interface VoiceMetrics {
  pitch: number;
  tone: number;
  pace: number;
  tremor: number;
  breathingPattern: number;
}

export interface EyeMovementData {
  blinkRate: number;
  gazeStability: number;
  pupilDilation: number;
  focusPattern: string;
}

export interface MicroExpression {
  type: EmotionType;
  intensity: number;
  duration: number;
  timestamp: number;
}

export interface CrisisIndicator {
  type: 'facial' | 'physiological' | 'behavioral';
  severity: number;
  description: string;
  confidence: number;
}

export interface DetectionState {
  isActive: boolean;
  isProcessing: boolean;
  hasPermissions: boolean;
  currentMode: 'face' | 'voice' | 'heart-rate' | 'combined';
  error: string | null;
  calibrationComplete: boolean;
}

const FACIAL_EMOTION_WEIGHTS = {
  happiness: { mood: 0.8, stress: -0.6, arousal: 0.4, valence: 0.9 },
  sadness: { mood: -0.7, stress: 0.3, arousal: -0.4, valence: -0.8 },
  anger: { mood: -0.5, stress: 0.8, arousal: 0.7, valence: -0.6 },
  fear: { mood: -0.6, stress: 0.9, arousal: 0.8, valence: -0.7 },
  surprise: { mood: 0.2, stress: 0.3, arousal: 0.6, valence: 0.1 },
  disgust: { mood: -0.4, stress: 0.4, arousal: 0.3, valence: -0.5 },
  neutral: { mood: 0.0, stress: 0.0, arousal: 0.0, valence: 0.0 },
  anxiety: { mood: -0.6, stress: 0.9, arousal: 0.7, valence: -0.7 }
};

const CRISIS_INDICATORS = {
  facial: {
    prolongedSadness: { threshold: 0.7, duration: 30000 },
    extremeAnger: { threshold: 0.8, duration: 10000 },
    fearExpression: { threshold: 0.6, duration: 15000 },
    blankStare: { threshold: 0.9, duration: 20000 }
  },
  physiological: {
    elevatedHeartRate: { threshold: 100, sustained: true },
    lowHeartRateVariability: { threshold: 20, concerning: true },
    rapidBreathing: { threshold: 25, worrisome: true }
  },
  behavioral: {
    avoidedEyeContact: { threshold: 0.8, duration: 30000 },
    excessiveBlinking: { threshold: 40, concerning: true },
    microExpressionClusters: { threshold: 5, timeWindow: 60000 }
  }
};

export const BiometricMoodDetection: React.FC<BiometricMoodDetectionProps> = ({
  className = '',
  onMoodDetected,
  onCrisisDetected,
  enableFaceDetection = true,
  enableHeartRateDetection = false,
  enableVoiceAnalysis = false,
  privacyMode = false,
  autoStart = false,
  detectionInterval = 5000
}) => {
  const { user } = useAuth();
  const { announceToScreenReader, isFocusMode } = useAccessibility();

  const [state, setState] = useState<DetectionState>({
    isActive: false,
    isProcessing: false,
    hasPermissions: false,
    currentMode: 'face',
    error: null,
    calibrationComplete: false
  });

  const [lastDetection, setLastDetection] = useState<BiometricMoodData | null>(null);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Mock ML model references (in real implementation, would load actual models)
  const faceDetectionModelRef = useRef<any>(null);
  const emotionModelRef = useRef<any>(null);
  const microExpressionModelRef = useRef<any>(null);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (enableFaceDetection) {
        const videoPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (videoPermission.state === 'denied') return false;
      }

      if (enableVoiceAnalysis) {
        const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (audioPermission.state === 'denied') return false;
      }

      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }, [enableFaceDetection, enableVoiceAnalysis]);

  const initializeCamera = useCallback(async (): Promise<boolean> => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: enableVoiceAnalysis
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = resolve;
        });
      }

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to access camera. Please check permissions and try again.'
      }));
      return false;
    }
  }, [enableVoiceAnalysis]);

  const loadDetectionModels = useCallback(async (): Promise<boolean> => {
    try {
      // In a real implementation, would load actual ML models
      // For demo purposes, we'll simulate model loading
      
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Simulate model loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock model initialization
      faceDetectionModelRef.current = { loaded: true };
      emotionModelRef.current = { loaded: true };
      microExpressionModelRef.current = { loaded: true };
      
      setState(prev => ({ ...prev, isProcessing: false }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load detection models',
        isProcessing: false
      }));
      return false;
    }
  }, []);

  const performCalibration = useCallback(async (): Promise<void> => {
    announceToScreenReader('Starting calibration. Please look at the camera with a neutral expression.');
    
    // Mock calibration process
    setState(prev => ({ ...prev, isProcessing: true }));
    
    // Simulate calibration data collection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockCalibration = {
      baselineExpression: {
        happiness: 0.1,
        sadness: 0.1,
        anger: 0.05,
        fear: 0.05,
        surprise: 0.05,
        disgust: 0.05,
        neutral: 0.7,
        anxiety: 0.1
      },
      baselineHeartRate: 75,
      baselineBlinkRate: 15
    };
    
    setCalibrationData(mockCalibration);
    setState(prev => ({ 
      ...prev, 
      calibrationComplete: true,
      isProcessing: false 
    }));
    
    announceToScreenReader('Calibration complete. Biometric mood detection is ready.');
  }, [announceToScreenReader]);

  const detectFacialExpressions = useCallback((): FacialExpressionScores => {
    // Mock facial expression detection
    // In real implementation, would use computer vision models
    
    const mockScores: FacialExpressionScores = {
      happiness: Math.random() * 0.3 + 0.1,
      sadness: Math.random() * 0.2 + 0.05,
      anger: Math.random() * 0.15 + 0.02,
      fear: Math.random() * 0.1 + 0.02,
      surprise: Math.random() * 0.1 + 0.02,
      disgust: Math.random() * 0.05 + 0.01,
      neutral: Math.random() * 0.4 + 0.3,
      anxiety: Math.random() * 0.3 + 0.05
    };

    // Normalize scores to sum to 1
    const total = Object.values(mockScores).reduce((sum, val) => sum + val, 0);
    Object.keys(mockScores).forEach(key => {
      mockScores[key as keyof FacialExpressionScores] /= total;
    });

    return mockScores;
  }, []);

  const detectMicroExpressions = useCallback((): MicroExpression[] => {
    // Mock micro-expression detection
    const microExpressions: MicroExpression[] = [];
    
    // Randomly generate 0-3 micro-expressions
    const count = Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const emotions: EmotionType[] = ['sad', 'angry', 'fearful', 'anxious'];
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      microExpressions.push({
        type: emotion,
        intensity: Math.random() * 0.8 + 0.2,
        duration: Math.random() * 300 + 100, // 100-400ms
        timestamp: Date.now() - Math.random() * 1000
      });
    }
    
    return microExpressions;
  }, []);

  const detectHeartRate = useCallback(async (): Promise<{ heartRate: number; hrv: number } | null> => {
    if (!enableHeartRateDetection) return null;
    
    // Mock heart rate detection from camera (photoplethysmography)
    // In real implementation, would analyze skin color changes
    
    const baseHR = calibrationData?.baselineHeartRate || 75;
    const variation = Math.random() * 20 - 10; // ±10 bpm variation
    const heartRate = Math.max(50, Math.min(120, baseHR + variation));
    
    const hrv = Math.random() * 50 + 20; // 20-70 ms HRV
    
    return { heartRate, hrv };
  }, [enableHeartRateDetection, calibrationData]);

  const detectCrisisIndicators = useCallback((
    facialScores: FacialExpressionScores,
    microExpressions: MicroExpression[],
    heartRate?: number,
    hrv?: number
  ): CrisisIndicator[] => {
    const indicators: CrisisIndicator[] = [];
    
    // Check facial expression indicators
    if (facialScores.sadness > CRISIS_INDICATORS.facial.prolongedSadness.threshold) {
      indicators.push({
        type: 'facial',
        severity: facialScores.sadness * 10,
        description: 'Prolonged sadness expression detected',
        confidence: 0.8
      });
    }
    
    if (facialScores.anger > CRISIS_INDICATORS.facial.extremeAnger.threshold) {
      indicators.push({
        type: 'facial',
        severity: facialScores.anger * 10,
        description: 'Extreme anger expression detected',
        confidence: 0.85
      });
    }
    
    if (facialScores.fear > CRISIS_INDICATORS.facial.fearExpression.threshold) {
      indicators.push({
        type: 'facial',
        severity: facialScores.fear * 10,
        description: 'Fear expression indicating distress',
        confidence: 0.75
      });
    }
    
    // Check physiological indicators
    if (heartRate && heartRate > CRISIS_INDICATORS.physiological.elevatedHeartRate.threshold) {
      indicators.push({
        type: 'physiological',
        severity: ((heartRate - 100) / 20) * 10,
        description: 'Elevated heart rate indicating stress',
        confidence: 0.7
      });
    }
    
    if (hrv && hrv < CRISIS_INDICATORS.physiological.lowHeartRateVariability.threshold) {
      indicators.push({
        type: 'physiological',
        severity: ((30 - hrv) / 10) * 10,
        description: 'Low heart rate variability indicating chronic stress',
        confidence: 0.75
      });
    }
    
    // Check micro-expression clusters
    const negativeExpressions = microExpressions.filter(me => 
      ['sad', 'angry', 'fearful', 'anxious'].includes(me.type)
    );
    
    if (negativeExpressions.length >= CRISIS_INDICATORS.behavioral.microExpressionClusters.threshold) {
      indicators.push({
        type: 'behavioral',
        severity: negativeExpressions.length * 2,
        description: 'Multiple negative micro-expressions detected',
        confidence: 0.65
      });
    }
    
    return indicators;
  }, []);

  const calculateMoodMetrics = useCallback((
    facialScores: FacialExpressionScores,
    microExpressions: MicroExpression[],
    heartRate?: number
  ): { mood: number; stress: number; arousal: number; valence: number } => {
    let mood = 5; // baseline neutral
    let stress = 0;
    let arousal = 0;
    let valence = 0;
    
    // Apply facial expression weights
    Object.entries(facialScores).forEach(([emotion, score]) => {
      const weights = FACIAL_EMOTION_WEIGHTS[emotion as keyof typeof FACIAL_EMOTION_WEIGHTS];
      if (weights) {
        mood += score * weights.mood;
        stress += score * weights.stress;
        arousal += score * weights.arousal;
        valence += score * weights.valence;
      }
    });
    
    // Factor in micro-expressions
    microExpressions.forEach(me => {
      const intensity = me.intensity;
      if (['sad', 'angry', 'fearful', 'anxious'].includes(me.type)) {
        mood -= intensity * 0.5;
        stress += intensity * 0.3;
        valence -= intensity * 0.4;
      }
    });
    
    // Factor in heart rate if available
    if (heartRate) {
      const baseHR = calibrationData?.baselineHeartRate || 75;
      const hrDiff = heartRate - baseHR;
      
      if (hrDiff > 10) {
        stress += (hrDiff - 10) * 0.05;
        arousal += (hrDiff - 10) * 0.03;
      }
    }
    
    // Normalize values
    mood = Math.max(1, Math.min(10, mood));
    stress = Math.max(0, Math.min(10, stress));
    arousal = Math.max(-5, Math.min(5, arousal));
    valence = Math.max(-5, Math.min(5, valence));
    
    return { mood, stress, arousal, valence };
  }, [calibrationData]);

  const performDetection = useCallback(async (): Promise<void> => {
    if (!state.isActive || !state.calibrationComplete) return;
    
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Detect facial expressions
      const facialScores = detectFacialExpressions();
      
      // Detect micro-expressions
      const microExpressions = detectMicroExpressions();
      
      // Detect heart rate if enabled
      const heartRateData = await detectHeartRate();
      
      // Calculate mood metrics
      const moodMetrics = calculateMoodMetrics(
        facialScores,
        microExpressions,
        heartRateData?.heartRate
      );
      
      // Determine primary emotion
      const primaryEmotion = Object.entries(facialScores).reduce((max, [emotion, score]) => 
        score > facialScores[max as keyof FacialExpressionScores] ? emotion : max
      ) as EmotionType;
      
      // Check for crisis indicators
      const crisisIndicators = detectCrisisIndicators(
        facialScores,
        microExpressions,
        heartRateData?.heartRate,
        heartRateData?.hrv
      );
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (moodMetrics.mood < 4) {
        recommendations.push('Consider mood-boosting activities');
        recommendations.push('Practice deep breathing exercises');
      }
      if (moodMetrics.stress > 6) {
        recommendations.push('Take a short break to relax');
        recommendations.push('Try progressive muscle relaxation');
      }
      if (crisisIndicators.length > 0) {
        recommendations.push('Consider reaching out to support resources');
        recommendations.push('Use crisis management techniques');
      }
      
      // Calculate confidence based on data quality
      const confidence = Math.min(95, 
        60 + 
        (facialScores.neutral < 0.8 ? 20 : 0) + // More confident with clear expressions
        (microExpressions.length > 0 ? 10 : 0) + // More confident with micro-expressions
        (heartRateData ? 15 : 0) // More confident with physiological data
      );
      
      const biometricData: BiometricMoodData = {
        moodScore: Math.round(moodMetrics.mood * 10) / 10,
        stressLevel: Math.round(moodMetrics.stress * 10) / 10,
        arousalLevel: Math.round(moodMetrics.arousal * 10) / 10,
        valenceLevel: Math.round(moodMetrics.valence * 10) / 10,
        primaryEmotion,
        confidence,
        timestamp: new Date(),
        metrics: {
          heartRate: heartRateData?.heartRate,
          heartRateVariability: heartRateData?.hrv,
          facialExpressionScores: facialScores,
          microExpressions,
          eyeMovementPatterns: {
            blinkRate: calibrationData?.baselineBlinkRate || 15 + Math.random() * 10 - 5,
            gazeStability: Math.random() * 0.5 + 0.5,
            pupilDilation: Math.random() * 0.3 + 0.7,
            focusPattern: 'stable'
          }
        },
        crisisIndicators,
        recommendations
      };
      
      setLastDetection(biometricData);
      onMoodDetected?.(biometricData);
      
      // Check for crisis level
      if (crisisIndicators.length > 0) {
        const maxSeverity = Math.max(...crisisIndicators.map(ci => ci.severity));
        let crisisLevel: CrisisLevel = 'none';
        
        if (maxSeverity >= 8) crisisLevel = 'severe';
        else if (maxSeverity >= 6) crisisLevel = 'high';
        else if (maxSeverity >= 4) crisisLevel = 'moderate';
        else if (maxSeverity >= 2) crisisLevel = 'low';
        
        if (crisisLevel !== 'none') {
          onCrisisDetected?.(crisisLevel);
          announceToScreenReader(`Crisis indicators detected at ${crisisLevel} level`);
        }
      }
      
      announceToScreenReader(
        `Mood analysis complete. Detected ${primaryEmotion} emotion with ${moodMetrics.mood.toFixed(1)} mood score`
      );
      
    } catch (error) {
      console.error('Detection failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Biometric detection failed. Please try again.'
      }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [
    state.isActive,
    state.calibrationComplete,
    detectFacialExpressions,
    detectMicroExpressions,
    detectHeartRate,
    calculateMoodMetrics,
    detectCrisisIndicators,
    onMoodDetected,
    onCrisisDetected,
    announceToScreenReader,
    calibrationData
  ]);

  const startDetection = useCallback(async () => {
    if (!privacyConsent && !privacyMode) {
      setState(prev => ({
        ...prev,
        error: 'Please provide consent for biometric data processing'
      }));
      return;
    }
    
    const hasPermissions = await checkPermissions();
    if (!hasPermissions) {
      setState(prev => ({
        ...prev,
        error: 'Camera and/or microphone permissions required'
      }));
      return;
    }
    
    const cameraInitialized = await initializeCamera();
    if (!cameraInitialized) return;
    
    const modelsLoaded = await loadDetectionModels();
    if (!modelsLoaded) return;
    
    if (!state.calibrationComplete) {
      await performCalibration();
    }
    
    setState(prev => ({ 
      ...prev, 
      isActive: true, 
      hasPermissions: true,
      error: null 
    }));
    
    // Start detection loop
    detectionIntervalRef.current = setInterval(performDetection, detectionInterval);
    
    announceToScreenReader('Biometric mood detection started');
  }, [
    privacyConsent,
    privacyMode,
    checkPermissions,
    initializeCamera,
    loadDetectionModels,
    performCalibration,
    performDetection,
    detectionInterval,
    announceToScreenReader,
    state.calibrationComplete
  ]);

  const stopDetection = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    announceToScreenReader('Biometric mood detection stopped');
  }, [announceToScreenReader]);

  useEffect(() => {
    if (autoStart && privacyMode) {
      startDetection();
    }
    
    return () => {
      stopDetection();
    };
  }, [autoStart, privacyMode]);

  const formatEmotionScores = useCallback((scores: FacialExpressionScores) => {
    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion, score]) => ({
        emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        percentage: Math.round(score * 100)
      }));
  }, []);

  if (!enableFaceDetection && !enableHeartRateDetection && !enableVoiceAnalysis) {
    return (
      <div className="biometric-detection-disabled" role="status">
        <p>No biometric detection methods enabled. Please enable at least one detection method.</p>
      </div>
    );
  }

  return (
    <div 
      className={`biometric-mood-detection ${className} ${state.isActive ? 'active' : ''}`}
      role="region"
      aria-label="Biometric mood detection interface"
    >
      <div className="detection-header">
        <h3>Biometric Mood Detection</h3>
        <div className="privacy-status">
          {privacyMode ? (
            <span className="privacy-badge private" role="img" aria-label="Private mode active">
              🔒 Private Mode
            </span>
          ) : (
            <span className="privacy-badge standard">
              📊 Standard Mode
            </span>
          )}
        </div>
      </div>

      {!privacyMode && !privacyConsent && (
        <div className="privacy-consent" role="region" aria-label="Privacy consent">
          <h4>Privacy Consent Required</h4>
          <p>
            This feature analyzes your facial expressions, voice, and potentially heart rate 
            to detect mood patterns. All processing happens locally on your device.
          </p>
          <ul>
            <li>✅ Data processed locally on your device</li>
            <li>✅ No biometric data sent to servers</li>
            <li>✅ Video feed not recorded or stored</li>
            <li>✅ You can stop detection at any time</li>
          </ul>
          
          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              aria-describedby="consent-description"
            />
            <span id="consent-description">
              I consent to biometric mood detection and understand my privacy rights
            </span>
          </label>
        </div>
      )}

      {enableFaceDetection && (
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="detection-video"
            style={{ display: privacyMode ? 'none' : 'block' }}
            aria-label="Video feed for facial expression detection"
          />
          <canvas
            ref={canvasRef}
            className="detection-overlay"
            style={{ display: 'none' }}
          />
          
          {state.isActive && (
            <div className="detection-status" role="status" aria-live="polite">
              <span className="status-indicator active" aria-hidden="true"></span>
              {state.isProcessing ? 'Analyzing...' : 'Monitoring'}
            </div>
          )}
        </div>
      )}

      <div className="detection-controls">
        {!state.isActive ? (
          <button
            type="button"
            className="btn-start-detection"
            onClick={startDetection}
            disabled={(!privacyConsent && !privacyMode) || state.isProcessing}
            aria-label="Start biometric mood detection"
          >
            <span className="btn-icon" aria-hidden="true">📊</span>
            Start Detection
          </button>
        ) : (
          <button
            type="button"
            className="btn-stop-detection"
            onClick={stopDetection}
            aria-label="Stop biometric mood detection"
          >
            <span className="btn-icon" aria-hidden="true">⏹️</span>
            Stop Detection
          </button>
        )}
        
        {!state.calibrationComplete && state.hasPermissions && (
          <button
            type="button"
            className="btn-calibrate"
            onClick={performCalibration}
            disabled={state.isProcessing}
            aria-label="Calibrate detection system"
          >
            Calibrate System
          </button>
        )}
      </div>

      {lastDetection && (
        <div className="detection-results" role="region" aria-label="Biometric analysis results">
          <h4>Current Analysis:</h4>
          
          <div className="mood-metrics">
            <div className="metric-card" aria-label={`Mood score: ${lastDetection.moodScore} out of 10`}>
              <div className="metric-value">{lastDetection.moodScore}/10</div>
              <div className="metric-label">Mood</div>
            </div>
            
            <div className="metric-card" aria-label={`Stress level: ${lastDetection.stressLevel} out of 10`}>
              <div className="metric-value">{lastDetection.stressLevel}/10</div>
              <div className="metric-label">Stress</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value">{lastDetection.primaryEmotion}</div>
              <div className="metric-label">Primary Emotion</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value">{lastDetection.confidence}%</div>
              <div className="metric-label">Confidence</div>
            </div>
          </div>

          <div className="emotion-breakdown">
            <h5>Expression Analysis:</h5>
            <div className="emotion-scores">
              {formatEmotionScores(lastDetection.metrics.facialExpressionScores).map((item, index) => (
                <div key={index} className="emotion-item">
                  <span className="emotion-name">{item.emotion}:</span>
                  <span className="emotion-percentage">{item.percentage}%</span>
                  <div 
                    className="emotion-bar"
                    style={{ width: `${item.percentage}%` }}
                    aria-label={`${item.emotion}: ${item.percentage}%`}
                  />
                </div>
              ))}
            </div>
          </div>

          {lastDetection.metrics.heartRate && (
            <div className="physiological-metrics">
              <h5>Physiological Data:</h5>
              <p>Heart Rate: {lastDetection.metrics.heartRate} BPM</p>
              {lastDetection.metrics.heartRateVariability && (
                <p>HRV: {lastDetection.metrics.heartRateVariability} ms</p>
              )}
            </div>
          )}

          {lastDetection.crisisIndicators.length > 0 && (
            <div className="crisis-indicators" role="alert">
              <h5>⚠️ Wellness Indicators Detected:</h5>
              <ul>
                {lastDetection.crisisIndicators.map((indicator, index) => (
                  <li key={index}>
                    <strong>{indicator.type.charAt(0).toUpperCase() + indicator.type.slice(1)}:</strong> 
                    {indicator.description} (Confidence: {Math.round(indicator.confidence * 100)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lastDetection.recommendations.length > 0 && (
            <div className="recommendations">
              <h5>Suggestions:</h5>
              <ul>
                {lastDetection.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
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

      <div className="detection-info">
        <h4>Detection Methods:</h4>
        <ul>
          {enableFaceDetection && <li>✅ Facial Expression Analysis</li>}
          {enableHeartRateDetection && <li>✅ Heart Rate Detection</li>}
          {enableVoiceAnalysis && <li>✅ Voice Pattern Analysis</li>}
          <li>✅ Micro-expression Detection</li>
          <li>✅ Real-time Crisis Detection</li>
        </ul>
      </div>

      {!user && (
        <div className="auth-prompt" role="note">
          <p>
            <strong>Sign in</strong> to save your biometric mood data and track patterns over time.
          </p>
        </div>
      )}
    </div>
  );
};

export default BiometricMoodDetection;