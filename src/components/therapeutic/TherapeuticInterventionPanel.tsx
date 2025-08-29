/**
 * Therapeutic Intervention Panel Component for Mental Health Platform
 * 
 * Crisis-aware therapeutic intervention interface with accessibility,
 * evidence-based interventions, and professional integration features.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTherapeuticInterventions } from '../../hooks/useTherapeuticInterventions';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuth } from '../../contexts/AuthContext';

export interface TherapeuticInterventionPanelProps {
  className?: string;
  crisisMode?: boolean;
  onInterventionStart?: (interventionId: string) => void;
  onInterventionComplete?: (sessionId: string, rating: number) => void;
  showEmergencyOnly?: boolean;
  culturalContext?: string;
  autoFocus?: boolean;
}

export interface InterventionCardProps {
  intervention: any;
  isActive: boolean;
  onStart: (id: string, crisisLevel?: any) => void;
  onComplete?: (sessionId: string, rating: number, notes?: string) => void;
  crisisMode: boolean;
  culturalContext?: string;
}

export interface EmergencyActionsProps {
  onEmergencyIntervention: (type: 'crisis-hotline' | 'emergency-services' | 'crisis-chat') => void;
  crisisLevel: any;
}

export interface InterventionTimerProps {
  duration: number;
  isActive: boolean;
  onComplete: () => void;
  intervention: any;
}

const InterventionCard: React.FC<InterventionCardProps> = ({
  intervention,
  isActive,
  onStart,
  onComplete,
  crisisMode,
  culturalContext
}) => {
  const { announceToScreenReader, isFocusMode } = useAccessibility();
  const [showInstructions, setShowInstructions] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [userNotes, setUserNotes] = useState<string>('');

  const handleStart = useCallback(() => {
    const crisisLevel = crisisMode ? 'high' : 'low';
    onStart(intervention.id, crisisLevel);
    announceToScreenReader(`Started ${intervention.title} intervention`);
  }, [intervention.id, intervention.title, onStart, crisisMode, announceToScreenReader]);

  const handleComplete = useCallback(() => {
    if (onComplete && isActive) {
      onComplete(intervention.id, userRating, userNotes);
      announceToScreenReader(`Completed ${intervention.title} with rating ${userRating}/10`);
    }
  }, [onComplete, isActive, intervention.id, intervention.title, userRating, userNotes, announceToScreenReader]);

  const displayInstructions = useMemo(() => {
    if (culturalContext && intervention.culturalAdaptations?.[culturalContext]) {
      return intervention.culturalAdaptations[culturalContext].instructions;
    }
    return intervention.instructions;
  }, [intervention, culturalContext]);

  const crisisIndicator = intervention.crisisAppropriate && crisisMode ? (
    <div className="crisis-indicator" role="alert" aria-label="Crisis intervention available">
      <span className="crisis-badge">Crisis Support</span>
    </div>
  ) : null;

  return (
    <div 
      className={`intervention-card ${isActive ? 'active' : ''} ${crisisMode ? 'crisis-mode' : ''}`}
      role="article"
      aria-labelledby={`intervention-${intervention.id}-title`}
      tabIndex={0}
    >
      <div className="intervention-header">
        <h3 id={`intervention-${intervention.id}-title`}>
          {culturalContext && intervention.culturalAdaptations?.[culturalContext]
            ? intervention.culturalAdaptations[culturalContext].title
            : intervention.title}
        </h3>
        {crisisIndicator}
        <div className="intervention-meta">
          <span className="duration" aria-label={`Duration ${intervention.duration} minutes`}>
            ⏱️ {intervention.duration}min
          </span>
          <span className="difficulty" aria-label={`Difficulty level ${intervention.difficulty}`}>
            📊 {intervention.difficulty}
          </span>
        </div>
      </div>

      <p className="intervention-description">
        {intervention.description}
      </p>

      <div className="intervention-tags">
        {intervention.tags.map((tag: string) => (
          <span key={tag} className="tag" aria-label={`Tag: ${tag}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="intervention-actions">
        <button
          type="button"
          className="btn-instructions"
          onClick={() => setShowInstructions(!showInstructions)}
          aria-expanded={showInstructions}
          aria-controls={`instructions-${intervention.id}`}
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>

        {!isActive ? (
          <button
            type="button"
            className={`btn-start ${crisisMode ? 'crisis-btn' : 'primary-btn'}`}
            onClick={handleStart}
            aria-label={`Start ${intervention.title} intervention`}
          >
            Start Intervention
          </button>
        ) : (
          <div className="completion-section">
            <div className="rating-section">
              <label htmlFor={`rating-${intervention.id}`}>
                How helpful was this? (1-10)
              </label>
              <input
                id={`rating-${intervention.id}`}
                type="number"
                min="1"
                max="10"
                value={userRating}
                onChange={(e) => setUserRating(Number(e.target.value))}
                aria-describedby={`rating-help-${intervention.id}`}
              />
              <span id={`rating-help-${intervention.id}`} className="sr-only">
                Rate effectiveness from 1 to 10, where 10 is most helpful
              </span>
            </div>

            <div className="notes-section">
              <label htmlFor={`notes-${intervention.id}`}>
                Optional notes about your experience:
              </label>
              <textarea
                id={`notes-${intervention.id}`}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="How did this help? Any insights or reactions?"
                rows={3}
              />
            </div>

            <button
              type="button"
              className="btn-complete"
              onClick={handleComplete}
              aria-label={`Complete ${intervention.title} intervention`}
            >
              Complete Intervention
            </button>
          </div>
        )}
      </div>

      {showInstructions && (
        <div 
          id={`instructions-${intervention.id}`}
          className="intervention-instructions"
          role="region"
          aria-label="Intervention instructions"
        >
          <h4>Instructions</h4>
          <ol>
            {displayInstructions.map((instruction: string, index: number) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>

          {intervention.audioGuided && (
            <div className="audio-guidance">
              <h5>Audio Guidance Available</h5>
              <audio 
                controls 
                aria-label="Audio guided intervention"
                aria-describedby={`audio-transcript-${intervention.id}`}
              >
                <source src={intervention.audioGuided.url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <details>
                <summary>Audio Transcript</summary>
                <p id={`audio-transcript-${intervention.id}`}>
                  {intervention.audioGuided.transcript}
                </p>
              </details>
            </div>
          )}

          {intervention.evidenceBase.length > 0 && (
            <div className="evidence-base">
              <h5>Evidence Base</h5>
              <ul>
                {intervention.evidenceBase.map((evidence: string, index: number) => (
                  <li key={index}>{evidence}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EmergencyActions: React.FC<EmergencyActionsProps> = ({ 
  onEmergencyIntervention, 
  crisisLevel 
}) => {
  const { announceToScreenReader } = useAccessibility();

  const handleEmergencyAction = useCallback((type: 'crisis-hotline' | 'emergency-services' | 'crisis-chat') => {
    onEmergencyIntervention(type);
    announceToScreenReader(`Emergency action initiated: ${type.replace('-', ' ')}`);
  }, [onEmergencyIntervention, announceToScreenReader]);

  if (!crisisLevel || crisisLevel === 'low') {
    return null;
  }

  return (
    <div className="emergency-actions" role="region" aria-label="Emergency support options">
      <h3>Immediate Support</h3>
      <div className="emergency-buttons">
        <button
          type="button"
          className="emergency-btn crisis-hotline"
          onClick={() => handleEmergencyAction('crisis-hotline')}
          aria-label="Call crisis hotline for immediate support"
        >
          <span className="icon">📞</span>
          Crisis Hotline
          <span className="subtitle">24/7 Support</span>
        </button>

        <button
          type="button"
          className="emergency-btn crisis-chat"
          onClick={() => handleEmergencyAction('crisis-chat')}
          aria-label="Start crisis chat for immediate text-based support"
        >
          <span className="icon">💬</span>
          Crisis Chat
          <span className="subtitle">Text Support</span>
        </button>

        {(crisisLevel === 'severe' || crisisLevel === 'imminent') && (
          <button
            type="button"
            className="emergency-btn emergency-services"
            onClick={() => handleEmergencyAction('emergency-services')}
            aria-label="Contact emergency services - call 911"
          >
            <span className="icon">🚨</span>
            Emergency Services
            <span className="subtitle">Call 911</span>
          </button>
        )}
      </div>
    </div>
  );
};

const InterventionTimer: React.FC<InterventionTimerProps> = ({ 
  duration, 
  isActive, 
  onComplete, 
  intervention 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [isPaused, setIsPaused] = useState(false);
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onComplete();
          announceToScreenReader(`${intervention.title} intervention completed`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, onComplete, intervention.title, announceToScreenReader]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    announceToScreenReader(isPaused ? 'Timer resumed' : 'Timer paused');
  }, [isPaused, announceToScreenReader]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progressPercentage = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;

  if (!isActive) return null;

  return (
    <div className="intervention-timer" role="timer" aria-label="Intervention progress timer">
      <div className="timer-display">
        <div className="time-remaining" aria-live="polite">
          {formatTime(timeRemaining)} remaining
        </div>
        <div 
          className="progress-bar"
          role="progressbar"
          aria-valuenow={Math.round(progressPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(progressPercentage)}% complete`}
        >
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="timer-controls">
        <button
          type="button"
          className="btn-pause"
          onClick={togglePause}
          aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
        
        <button
          type="button"
          className="btn-complete-early"
          onClick={onComplete}
          aria-label="Complete intervention early"
        >
          Complete Now
        </button>
      </div>
    </div>
  );
};

export const TherapeuticInterventionPanel: React.FC<TherapeuticInterventionPanelProps> = ({
  className = '',
  crisisMode = false,
  onInterventionStart,
  onInterventionComplete,
  showEmergencyOnly = false,
  culturalContext,
  autoFocus = false
}) => {
  const { user } = useAuth();
  const { 
    availableInterventions,
    currentSession,
    personalizedRecommendations,
    emergencyInterventions,
    startIntervention,
    completeIntervention,
    isLoading,
    error,
    interventionStats
  } = useTherapeuticInterventions();

  const { announceToScreenReader, isFocusMode } = useAccessibility();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleInterventionStart = useCallback(async (interventionId: string, crisisLevel?: any) => {
    try {
      const session = await startIntervention(interventionId, crisisLevel);
      onInterventionStart?.(interventionId);
      announceToScreenReader('Intervention started successfully');
    } catch (error) {
      announceToScreenReader('Failed to start intervention');
      console.error('Failed to start intervention:', error);
    }
  }, [startIntervention, onInterventionStart, announceToScreenReader]);

  const handleInterventionComplete = useCallback(async (
    sessionId: string, 
    rating: number, 
    notes?: string
  ) => {
    try {
      await completeIntervention(sessionId, rating, notes, ['completed-successfully']);
      onInterventionComplete?.(sessionId, rating);
      announceToScreenReader('Intervention completed and recorded');
    } catch (error) {
      announceToScreenReader('Failed to record intervention completion');
      console.error('Failed to complete intervention:', error);
    }
  }, [completeIntervention, onInterventionComplete, announceToScreenReader]);

  const handleEmergencyIntervention = useCallback((type: 'crisis-hotline' | 'emergency-services' | 'crisis-chat') => {
    switch (type) {
      case 'crisis-hotline':
        window.open('tel:988', '_self');
        break;
      case 'emergency-services':
        window.open('tel:911', '_self');
        break;
      case 'crisis-chat':
        window.open('https://suicidepreventionlifeline.org/chat/', '_blank');
        break;
    }
    announceToScreenReader(`Connecting to ${type.replace('-', ' ')}`);
  }, [announceToScreenReader]);

  const filteredInterventions = useMemo(() => {
    let interventions = showEmergencyOnly 
      ? emergencyInterventions 
      : (crisisMode ? emergencyInterventions.concat(personalizedRecommendations) : availableInterventions);

    if (selectedCategory !== 'all') {
      interventions = interventions.filter(intervention => 
        intervention.type === selectedCategory || 
        intervention.tags.includes(selectedCategory)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      interventions = interventions.filter(intervention =>
        intervention.title.toLowerCase().includes(query) ||
        intervention.description.toLowerCase().includes(query) ||
        intervention.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    return interventions;
  }, [
    showEmergencyOnly,
    crisisMode,
    emergencyInterventions,
    personalizedRecommendations,
    availableInterventions,
    selectedCategory,
    searchQuery
  ]);

  const categories = useMemo(() => {
    const allCategories = new Set(['all']);
    availableInterventions.forEach(intervention => {
      allCategories.add(intervention.type);
      intervention.tags.forEach((tag: string) => allCategories.add(tag));
    });
    return Array.from(allCategories);
  }, [availableInterventions]);

  useEffect(() => {
    if (autoFocus && filteredInterventions.length > 0) {
      const firstCard = document.querySelector('.intervention-card');
      (firstCard as HTMLElement)?.focus();
    }
  }, [autoFocus, filteredInterventions]);

  if (isLoading) {
    return (
      <div className="loading-state" role="status" aria-label="Loading therapeutic interventions">
        <div className="spinner" aria-hidden="true"></div>
        <span className="sr-only">Loading interventions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state" role="alert">
        <h3>Unable to Load Interventions</h3>
        <p>{error}</p>
        <button 
          type="button"
          className="btn-retry"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`therapeutic-intervention-panel ${className} ${crisisMode ? 'crisis-mode' : ''}`}
      role="main"
      aria-label="Therapeutic interventions panel"
    >
      <div className="panel-header">
        <h2>
          {showEmergencyOnly 
            ? 'Emergency Support' 
            : crisisMode 
              ? 'Crisis Interventions' 
              : 'Therapeutic Interventions'}
        </h2>
        
        {interventionStats && (
          <div className="stats-summary" aria-label="Your intervention statistics">
            <span>Average effectiveness: {interventionStats.averageEffectiveness}/10</span>
            <span>Total sessions: {interventionStats.totalSessions}</span>
          </div>
        )}
      </div>

      <EmergencyActions 
        onEmergencyIntervention={handleEmergencyIntervention}
        crisisLevel={crisisMode ? 'high' : 'low'}
      />

      {currentSession && (
        <InterventionTimer
          duration={availableInterventions.find(i => i.id === currentSession.interventionId)?.duration || 5}
          isActive={true}
          onComplete={() => handleInterventionComplete(currentSession.id, 7)}
          intervention={availableInterventions.find(i => i.id === currentSession.interventionId) || {}}
        />
      )}

      {!showEmergencyOnly && (
        <div className="panel-filters">
          <div className="search-section">
            <label htmlFor="intervention-search" className="sr-only">
              Search interventions
            </label>
            <input
              id="intervention-search"
              type="search"
              placeholder="Search interventions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-describedby="search-help"
            />
            <span id="search-help" className="sr-only">
              Search by title, description, or tags
            </span>
          </div>

          <div className="category-filters">
            <label htmlFor="category-select" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div 
        className="interventions-list"
        role="list"
        aria-label={`${filteredInterventions.length} available interventions`}
      >
        {filteredInterventions.length === 0 ? (
          <div className="no-interventions" role="status">
            <p>No interventions found matching your criteria.</p>
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredInterventions.map(intervention => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              isActive={currentSession?.interventionId === intervention.id}
              onStart={handleInterventionStart}
              onComplete={handleInterventionComplete}
              crisisMode={crisisMode}
              culturalContext={culturalContext}
            />
          ))
        )}
      </div>

      {!user && (
        <div className="auth-prompt" role="note">
          <p>
            <strong>Sign in</strong> to track your progress and get personalized recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default TherapeuticInterventionPanel;