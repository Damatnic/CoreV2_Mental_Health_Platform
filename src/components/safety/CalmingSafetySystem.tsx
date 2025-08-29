import React, { useState, useEffect, useCallback } from 'react';
import { QuickExitButton } from './QuickExitButton';
import { BreathingExerciseOverlay } from './BreathingExerciseOverlay';
import '../../styles/calming-safety-system.css';

interface CalmingSafetySystemProps {
  userId?: string;
  showQuickExit?: boolean;
  showBreathingIndicator?: boolean;
  showCrisisHelp?: boolean;
  showGroundingBar?: boolean;
  showHopeMessages?: boolean;
  showSafeSpaceBadge?: boolean;
  enablePanicDetection?: boolean;
  enableBackgroundSounds?: boolean;
  customMessages?: string[];
}

const groundingTechniques = [
  { icon: "🫁", text: "Box Breathing", description: "4-4-4-4 breathing pattern" },
  { icon: "🧊", text: "Ice Technique", description: "Hold ice or cold water" },
  { icon: "🎵", text: "Sound Focus", description: "Listen to calming sounds" },
  { icon: "🤲", text: "Progressive Relaxation", description: "Tense and release muscles" },
  { icon: "🌿", text: "Nature Connection", description: "Visualize peaceful nature" }
];

const GROUNDING_EXERCISES = groundingTechniques;

const DEFAULT_HOPE_MESSAGES = [
  "You are stronger than you think.",
  "This feeling is temporary and will pass.",
  "You have overcome challenges before.",
  "You are not alone in this journey.",
  "Every small step forward counts.",
  "You deserve compassion and care.",
  "Your feelings are valid and heard."
];

export const CalmingSafetySystem: React.FC<CalmingSafetySystemProps> = ({
  userId,
  showQuickExit = true,
  showBreathingIndicator = true,
  showCrisisHelp = true,
  showGroundingBar = true,
  showHopeMessages = true,
  showSafeSpaceBadge = true,
  enablePanicDetection = false,
  enableBackgroundSounds = false,
  customMessages = []
}) => {
  const [breathingOverlayOpen, setBreathingOverlayOpen] = useState(false);
  const [currentHopeMessage, setCurrentHopeMessage] = useState(0);
  const [showCalmingMessage, setShowCalmingMessage] = useState(false);
  const [panicDetected, setPanicDetected] = useState(false);
  const [selectedGrounding, setSelectedGrounding] = useState<string | null>(null);
  const [crisisHelpExpanded, setCrisisHelpExpanded] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [backgroundSound, setBackgroundSound] = useState<'rain' | "ocean" | "forest" | null>(null);

  const messages = [...DEFAULT_HOPE_MESSAGES, ...customMessages];

  // Rotate hope messages
  useEffect(() => {
    if (!showHopeMessages) return;

    const interval = setInterval(() => {
      setCurrentHopeMessage((prev) => (prev + 1) % messages.length);
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [showHopeMessages, messages.length]);

  // Panic detection based on rapid clicking or keyboard mashing
  useEffect(() => {
    if (!enablePanicDetection) return;

    let clickCount = 0;
    let keyPressCount = 0;
    let resetTimer: NodeJS.Timeout;

    const detectPanic = (): void => {
      if (clickCount > 10 || keyPressCount > 20) {
        setPanicDetected(true);
        setShowCalmingMessage(true);
        clickCount = 0;
        keyPressCount = 0;
      }
    };

    const handleClick = (): void => {
      clickCount++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        clickCount = 0;
      }, 2000);
      detectPanic();
    };

    const handleKeyPress = (): void => {
      keyPressCount++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        keyPressCount = 0;
      }, 2000);
      detectPanic();
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyPress);
      clearTimeout(resetTimer);
    };
  }, [enablePanicDetection]);

  // Initialize background sounds
  const initializeBackgroundSound = useCallback((soundType: 'rain' | "ocean" | "forest") => {
    if (!enableBackgroundSounds) return;

    // Create audio context if not exists
    if (!audioContext) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);

      // Create white noise generator for ambient sounds
      const createAmbientSound = (type: string) => {
        const bufferSize = 4096;
        const whiteNoise = context.createScriptProcessor(bufferSize, 1, 1);

        whiteNoise.onaudioprocess = (e: any) => {
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            // Different noise patterns for different sounds
            if (type === "rain") {
              output[i] = (Math.random() * 0.1) - 0.05; // Soft rain
            } else if (type === "ocean") {
              output[i] = Math.sin(i * 0.01) * (Math.random() * 0.05); // Wave-like
            } else {
              output[i] = (Math.random() * 0.02) - 0.01; // Forest whisper
            }
          }
        };

        const gainNode = context.createGain();
        gainNode.gain.value = 0.1; // Keep volume low and calming

        whiteNoise.connect(gainNode);
        gainNode.connect(context.destination);
        return { processor: whiteNoise, gain: gainNode };
      };

      createAmbientSound(soundType);
      setBackgroundSound(soundType);
    }
  }, [audioContext, enableBackgroundSounds]);

  // Handle grounding exercise selection
  const handleGroundingExercise = (exercise: string): void => {
    setSelectedGrounding(exercise);
    // Special handling for breathing exercise
    if (exercise === "Box Breathing") {
      setBreathingOverlayOpen(true);
    } else {
      // Show instructions for other exercises
      setShowCalmingMessage(true);
    }
  };

  // Handle crisis help expansion
  const handleCrisisHelp = (): void => {
    setCrisisHelpExpanded(!crisisHelpExpanded);
    // Automatically show breathing exercise when crisis help is accessed
    if (!crisisHelpExpanded) {
      setTimeout(() => {
        setBreathingOverlayOpen(true);
      }, 500);
    }
  };

  // Emergency call handler
  const handleEmergencyCall = (number: string): void => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="calming-safety-system" data-testid="calming-safety-system">
      {/* Quick Exit Button - Always Visible */}
      {showQuickExit && (
        <div className="quick-exit-enhanced">
          <QuickExitButton
            position="top-right"
            buttonText="Quick Exit"
            size="medium"
            className="quick-exit-enhanced-inner"
          />
        </div>
      )}

      {/* Safe Space Badge */}
      {showSafeSpaceBadge && (
        <div className="safe-space-badge fade-in-hope">
          You're in a safe space
        </div>
      )}

      {/* Breathing Indicator */}
      {showBreathingIndicator && (
        <div tabIndex={0}
          className="breathing-indicator"
          onClick={() => setBreathingOverlayOpen(true)}
          role="button"
          aria-label="Open breathing exercise"
          title="Click for breathing exercise"
        />
      )}

      {/* Hope Messages */}
      {showHopeMessages && (
        <div className="hope-message fade-in-hope">
          {messages[currentHopeMessage]}
        </div>
      )}

      {/* Crisis Help Floating Button */}
      {showCrisisHelp && (
        <div tabIndex={0}
          className={`crisis-help-float ${crisisHelpExpanded ? "expanded" : ""}`}
          onKeyDown={(e) => e.key === "Enter" && handleCrisisHelp()}
          onClick={handleCrisisHelp}
          role="button"
          aria-label="Crisis help and support"
          title="Click for immediate help"
        >
          {crisisHelpExpanded && (
            <div tabIndex={0} className="crisis-help-menu" onClick={(e) => e.stopPropagation()}>
              <h3>You're Not Alone</h3>
              <div className="crisis-options">
                <button className="crisis-button-large"
                  onClick={() => handleEmergencyCall("988")}
                >
                  <span>📞</span> Crisis Lifeline: 988
                </button>
                <button className="crisis-button-large"
                  onClick={() => handleEmergencyCall("911")}
                >
                  <span>🚨</span> Emergency: 911
                </button>
                <button className="crisis-button-large"
                  onClick={() => window.open("https://www.crisistextline.org", "_blank")}
                >
                  <span>💬</span> Text HOME to 741741
                </button>
                <button className="crisis-button-large"
                  onClick={() => setBreathingOverlayOpen(true)}
                >
                  <span>🫁</span> Breathing Exercise
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grounding Exercises Bar */}
      {showGroundingBar && (
        <div className="grounding-bar">
          {GROUNDING_EXERCISES.map((exercise) => (
            <div tabIndex={0}
              key={exercise.text}
              className="grounding-exercise"
              onClick={() => handleGroundingExercise(exercise.text)}
              role="button"
              aria-label={`${exercise.text} grounding exercise`}
              title={exercise.description}
            >
              <span>{exercise.icon}</span>
              <div>
                <strong>{exercise.text}</strong>
                <small style={{ display: 'block', opacity: 0.8 }}>
                  {exercise.description}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calming Message Modal */}
      {showCalmingMessage && (
        <div className={`calming-message ${showCalmingMessage ? "show" : ""}`}>
          <h3>Let's Take a Moment</h3>
          <p>
            {panicDetected
              ? "I notice you might be feeling overwhelmed. That's okay. Let's breathe together."
              : selectedGrounding
              ? `Great choice! ${GROUNDING_EXERCISES.find(e => e.text === selectedGrounding)?.description}`
              : "Remember, you are safe and supported. Take a deep breath with me."}
          </p>
          <button onClick={() => {
            setShowCalmingMessage(false);
            setPanicDetected(false);
            setSelectedGrounding(null);
          }}>
            I'm Ready to Continue
          </button>
        </div>
      )}

      {/* Panic Prevention Overlay */}
      {panicDetected && (
        <div className="panic-prevention-overlay">
          <div className="panic-prevention-content">
            <h2>It's Okay, You're Safe</h2>
            <div className="breathing-guide">
              Breathe
            </div>
            <p>Follow the circle above. Breathe in as it grows, breathe out as it shrinks.</p>
            <button className="crisis-button-large"
              onClick={() => {
                setPanicDetected(false);
                setBreathingOverlayOpen(true);
              }}
            >
              Start Guided Breathing
            </button>
          </div>
        </div>
      )}

      {/* Breathing Exercise Overlay */}
      <BreathingExerciseOverlay
        isOpen={breathingOverlayOpen}
        onClose={() => setBreathingOverlayOpen(false)}
        technique="478"
        autoStart={true}
        defaultCycles={3}
        onComplete={(stats) => {
          // Could track this for user wellness metrics
        }}
      />

      {/* Background Sound Controls */}
      {enableBackgroundSounds && (
        <div className="background-sound-controls" style={{
          position: "fixed",
          bottom: "150px",
          left: "20px",
          background: 'white',
          padding: "10px",
          borderRadius: '20px',
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          zIndex: 999990
        }}>
          <p style={{
            margin: "0 0 10px 0",
            fontSize: "14px",
            fontWeight: "600"
          }}>
            Calming Sounds:
          </p>
          <div style={{
            display: "flex",
            gap: "10px"
          }}>
            <button
              onClick={() => initializeBackgroundSound("rain")}
              style={{
                padding: "5px 10px",
                borderRadius: "10px",
                border: "none",
                background: backgroundSound === 'rain' ? "#007bff" : "#f8f9fa",
                color: backgroundSound === 'rain' ? "white" : "black",
                cursor: 'pointer'
              }}
            >
              🌧️ Rain
            </button>
            <button
              onClick={() => initializeBackgroundSound("ocean")}
              style={{
                padding: "5px 10px",
                borderRadius: "10px",
                border: "none",
                background: backgroundSound === "ocean" ? "#007bff" : '#f8f9fa',
                color: backgroundSound === "ocean" ? "white" : "black",
                cursor: "pointer"
              }}
            >
              🌊 Ocean
            </button>
            <button
              onClick={() => initializeBackgroundSound("forest")}
              style={{
                padding: "5px 10px",
                borderRadius: "10px",
                border: 'none',
                background: backgroundSound === "forest" ? "#007bff" : "#f8f9fa",
                color: backgroundSound === 'forest' ? "white" : "black",
                cursor: "pointer"
              }}
            >
              🌲 Forest
            </button>
          </div>
        </div>
      )}

      {/* Mindfulness Prompt */}
      <div className="mindfulness-prompt" style={{ display: "none" }}>
        <h4>Mindful Moment</h4>
        <p>
          Take a moment to notice your surroundings.
          What can you see, hear, and feel right now?
          You are here, you are safe, and this moment is yours.
        </p>
      </div>
    </div>
  );
};

export default CalmingSafetySystem;