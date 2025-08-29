import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/SafetyFirstDesign.css';

interface PanicButtonProps {
  onPanicClick?: () => void;
  showHelpMenu?: boolean;
  autoDetectDistress?: boolean;
  position?: "fixed" | "relative";
  size?: "small" | "medium" | 'large';
}

const PanicButton: React.FC<PanicButtonProps> = ({
  onPanicClick,
  showHelpMenu = true,
  autoDetectDistress = true,
  position = "fixed",
  size = "large"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [distressLevel, setDistressLevel] = useState(0);
  const [showVirtualHug, setShowVirtualHug] = useState(false);

  // Crisis resources with direct actions
  const crisisResources = [
    {
      name: "988 Suicide & Crisis Lifeline",
      action: "tel:988",
      icon: "📞",
      description: "Free, confidential support 24/7"
    },
    {
      name: "Crisis Text Line",
      action: "sms:741741?body=HOME",
      icon: "💬",
      description: "Text HOME to 741741"
    },
    {
      name: "Emergency Services",
      action: "tel:911",
      icon: "🚨",
      description: "For immediate danger"
    },
    {
      name: "International Crisis Lines",
      action: "https://findahelpline.com",
      icon: "🌍",
      description: "Find help in your country"
    }
  ];

  // Immediate calming actions
  const calmingActions = [
    {
      name: "Breathing Exercise",
      icon: "🫁",
      action: () => {
        document.dispatchEvent(new CustomEvent("startBreathingExercise"));
      }
    },
    {
      name: "Grounding Technique",
      icon: "🌱",
      action: () => {
        document.dispatchEvent(new CustomEvent("startGroundingExercise"));
      }
    },
    {
      name: "Virtual Hug",
      icon: "🤗",
      action: () => {
        setShowVirtualHug(true);
        setTimeout(() => setShowVirtualHug(false), 5000);
      }
    },
    {
      name: "Safe Space",
      icon: "🏠",
      action: () => {
        document.dispatchEvent(new CustomEvent("activateSafeSpace"));
      }
    }
  ];

  // Auto-detect user distress based on interaction patterns
  useEffect(() => {
    if (!autoDetectDistress) return;

    let rapidClicks = 0;
    let scrollSpeed = 0;
    let lastScrollTime = Date.now();
    let distressTimer: NodeJS.Timeout;

    const handleRapidClicks = (): void => {
      rapidClicks++;
      clearTimeout(distressTimer);
      distressTimer = setTimeout(() => {
        if (rapidClicks > 5) {
          setDistressLevel(prev => Math.min(100, prev + 20));
          setIsPulsing(true);
        }
        rapidClicks = 0;
      }, 2000);
    };

    const handleScroll = (): void => {
      const now = Date.now();
      const timeDiff = now - lastScrollTime;
      lastScrollTime = now;
      if (timeDiff < 50) {
        scrollSpeed++;
        if (scrollSpeed > 10) {
          setDistressLevel(prev => Math.min(100, prev + 10));
        }
      } else {
        scrollSpeed = 0;
      }
    };

    window.addEventListener("click", handleRapidClicks);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("click", handleRapidClicks);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(distressTimer);
    };
  }, [autoDetectDistress]);

  // Show pulse effect when distress is detected
  useEffect(() => {
    if (distressLevel > 50) {
      setIsPulsing(true);
      // Auto-expand if distress is very high
      if (distressLevel > 80) {
        setIsExpanded(true);
      }
    }
  }, [distressLevel]);

  // Handle panic button click
  const handlePanicClick = useCallback(() => {
    if (onPanicClick) {
      onPanicClick();
    }

    setIsExpanded(!isExpanded);
    setIsPulsing(false);

    // Reset distress level after interaction
    setTimeout(() => {
      setDistressLevel(0);
    }, 5000);
  }, [isExpanded, onPanicClick]);

  // Handle resource click
  const handleResourceClick = (action: string): void => {
    setShowConfirmation(true);
    setTimeout(() => {
      if (action.startsWith("tel:") || action.startsWith("sms:")) {
        window.location.href = action;
      } else if (action.startsWith("http")) {
        window.open(action, "_blank", "noopener,noreferrer");
      }
    }, 500);

    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };

  // Size classes
  const sizeClasses = {
    small: "panic-button-small",
    medium: "panic-button-medium",
    large: "panic-button-large"
  };

  return (
    <>
      {/* Main Panic Button */}
      <div className={`panic-button-container ${
        position === "fixed" ? "panic-fixed" : ""
      } ${sizeClasses[size]}`}
        data-distress-level={distressLevel}
      >
        <button className={`panic-button ${
          isPulsing ? "pulsing" : ""
        } ${isExpanded ? "expanded" : ""}`}
          onClick={handlePanicClick}
          aria-label="Get immediate help"
          aria-expanded={isExpanded}
        >
          <span className="panic-icon">🆘</span>
          <span className="panic-text">
            {distressLevel > 50 ? "I'm Here to Help" : "Need Help?"}
          </span>
        </button>

        {/* Expanded Help Menu */}
        {isExpanded && showHelpMenu && (
          <div className="panic-menu" role="dialog" aria-label="Crisis help options">
            <div className="panic-menu-header">
              <h3>You're Not Alone</h3>
              <p>Choose what feels right for you:</p>
            </div>

            {/* Crisis Resources */}
            <div className="panic-resources">
              <h4>Talk to Someone</h4>
              {crisisResources.map((resource) => (
                <button
                  key={resource.name}
                  className="resource-button"
                  onClick={() => handleResourceClick(resource.action)}
                  aria-label={`Contact ${resource.name}`}
                >
                  <span className="resource-icon">{resource.icon}</span>
                  <div className="resource-info">
                    <strong>{resource.name}</strong>
                    <small>{resource.description}</small>
                  </div>
                </button>
              ))}
            </div>

            {/* Calming Actions */}
            <div className="panic-actions">
              <h4>Calm Your Mind</h4>
              <div className="action-grid">
                {calmingActions.map((action) => (
                  <button
                    key={action.name}
                    className="action-button"
                    onClick={() => action.action()}
                    aria-label={action.name}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-name">{action.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reassuring Message */}
            <div className="panic-message">
              <p>
                Whatever you're feeling right now is valid. 
                You don't have to go through this alone. 
                Help is available, and you deserve support.
              </p>
            </div>

            {/* Close button */}
            <button className="panic-close"
              onClick={() => setIsExpanded(false)}
              aria-label="Close help menu"
            >
              I'll be okay for now
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="panic-confirmation" role="alert">
          <span className="confirmation-icon">✓</span>
          <span>Connecting you to help...</span>
        </div>
      )}

      {/* Virtual Hug Animation */}
      {showVirtualHug && (
        <div className="virtual-hug-overlay">
          <div className="hug-animation">
            <span className="hug-emoji">🤗</span>
            <p>Sending you a virtual hug</p>
            <p className="hug-message">You are valued and loved</p>
          </div>
        </div>
      )}

      {/* Distress Indicator (subtle) */}
      {distressLevel > 0 && (
        <div className="distress-indicator"
          style={{
            opacity: Math.min(1, distressLevel / 100),
            background: `linear-gradient(45deg,
              rgba(147, 197, 253, ${distressLevel / 200}),
              rgba(196, 181, 253, ${distressLevel / 200}))`
          }}
        />
      )}
    </>
  );
};

export default PanicButton;