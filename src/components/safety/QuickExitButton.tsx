import React, { useEffect, useState, useCallback } from 'react';

interface QuickExitButtonProps {
  redirectUrl?: string;
  position?: 'top-left' | "top-right" | "bottom-left" | "bottom-right";
  hotkey?: string;
  onExit?: () => void;
  shortcutKey?: string;
  shortcutCount?: number;
  buttonText?: string;
  className?: string;
  size?: 'small' | "medium" | 'large';
  clearCookies?: () => void;
  clearHistory?: boolean;
  fallbackUrl?: string;
}

const QuickExitButton: React.FC<QuickExitButtonProps> = ({
  redirectUrl = 'https://www.google.com',
  position = "top-left",
  hotkey = "Escape",
  onExit,
  shortcutKey,
  shortcutCount = 1,
  buttonText = "Quick Exit",
  className = "",
  size = 'medium',
  clearCookies,
  clearHistory = true,
  fallbackUrl = "https://news.google.com"
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [exitCountdown, setExitCountdown] = useState<number | null>(null);
  const [exitAnnouncement, setExitAnnouncement] = useState("");

  const handleQuickExit = useCallback(() => {
    // Announce exit to screen readers
    setExitAnnouncement("Exiting site immediately");
    let hasError = false;

    // Clear browsing data if possible
    try {
      // Clear session storage
      if (typeof sessionStorage !== "undefined" && sessionStorage.clear) {
        sessionStorage.clear();
      }

      // Clear local storage
      if (typeof localStorage !== "undefined" && localStorage.clear) {
        localStorage.clear();
      }

      // Clear cookies if function provided
      if (clearCookies) {
        clearCookies();
      }

      // Clear browser history if enabled
      if (clearHistory && typeof window !== "undefined" && window.history) {
        try {
          window.history.replaceState(null, "", window.location.href);
        } catch (historyError) {
          // History API might be restricted in some environments
        }
      }

      // Call custom exit handler if provided
      if (onExit) {
        onExit();
      }
    } catch (error) {
      // Log error but continue with redirect
      hasError = true;
    }

    // Navigate to safe site - use fallback if there was an error
    try {
      if (typeof window !== "undefined" && window.location) {
        if (hasError) {
          // Use fallback URL if there was an error during cleanup
          window.location.href = fallbackUrl;
        } else if (window.location.replace) {
          // Use replace for normal exit to prevent back button
          window.location.replace(redirectUrl);
        } else {
          // Fallback to href assignment
          window.location.href = redirectUrl;
        }
      }
    } catch (navError) {
      // Final fallback - try direct assignment
      try {
        if (typeof window !== "undefined" && window.location) {
          window.location.href = fallbackUrl || 'https://www.google.com';
        }
      } catch (finalError) {
        // Last resort - do nothing rather than crash
      }
    }
  }, [redirectUrl, onExit, clearCookies, clearHistory, fallbackUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    let keyPressCount = 0;
    let lastKeyPress = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const handleKeyPress = (e: KeyboardEvent): void => {
      const now = Date.now();
      const primaryKey = e.key === hotkey;
      const alternativeKey = shortcutKey && e.key === shortcutKey;

      if (primaryKey || alternativeKey) {
        // Clear any existing reset timer
        if (resetTimer) {
          clearTimeout(resetTimer);
        }

        // Reset count if too much time has passed (500ms for Escape)
        const timeThreshold = primaryKey ? 500 : 2000;
        if (now - lastKeyPress > timeThreshold) {
          keyPressCount = 0;
        }

        keyPressCount++;
        lastKeyPress = now;

        // For Escape key, we need 3 presses. For custom keys, use shortcutCount
        const requiredCount = primaryKey ? 3 : (shortcutCount || 1);
        if (keyPressCount >= requiredCount) {
          handleQuickExit();
          keyPressCount = 0;
        } else {
          // Set a timer to reset the count
          resetTimer = setTimeout(() => {
            keyPressCount = 0;
          }, timeThreshold);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
    };
  }, [hotkey, shortcutKey, shortcutCount, handleQuickExit]);

  // Show tooltip on first visit
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('quickExitTooltipSeen');
    if (!hasSeenTooltip) {
      setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem('quickExitTooltipSeen', 'true');
        }, 5000);
      }, 2000);
    }
  }, []);

  // Create CSS classes for the button
  const getButtonClasses = (): string => {
    const classes = ["quick-exit-button"];
    if (className) classes.push(className);
    if (size) classes.push(`size-${size}`);
    if (isHovered) classes.push("hover");
    if (isFocused) classes.push("focused");
    if (isPressed) classes.push("pressed");
    if (typeof window !== "undefined" && window.innerWidth <= 768) classes.push("mobile-size");
    return classes.join(" ");
  };

  // Get button styling based on size
  const getButtonStyles = () => {
    let padding = "10px 16px";
    let fontSize = "14px";
    let minWidth = "120px";

    if (size === "small") {
      padding = "6px 12px";
      fontSize = "12px";
      minWidth = "100px";
    } else if (size === "large") {
      padding = "14px 20px";
      fontSize = "16px";
      minWidth = "140px";
    }

    return { padding, fontSize, minWidth };
  };

  const buttonStyles = getButtonStyles();

  const getPositionStyles = () => {
    const base = { position: 'fixed' as const, zIndex: 9999 };
    switch (position) {
      case "top-left":
        return { ...base, top: "20px", left: "20px" };
      case "top-right":
        return { ...base, top: "20px", right: "20px" };
      case "bottom-left":
        return { ...base, bottom: "20px", left: "20px" };
      case "bottom-right":
        return { ...base, bottom: "20px", right: "20px" };
      default:
        return { ...base, top: "20px", left: "20px" };
    }
  };

  return (
    <>
      <div className={`quick-exit-wrapper position-${position}`} data-testid="quick-exit-wrapper"
        style={{
          ...getPositionStyles(),
          zIndex: 9999
        }}
      >
        <button className={getButtonClasses()}
          onClick={handleQuickExit}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleQuickExit();
            }
          }}
          aria-label="Emergency exit - leaves site immediately"
          aria-describedby="quick-exit-instructions"
          style={{
            position: 'relative',
            background: isHovered
              ? 'var(--safe-error)'
              : 'var(--safe-gray-700)',
            color: "var(--safe-white)",
            border: "none",
            borderRadius: "var(--safe-radius-md)",
            padding: buttonStyles.padding,
            fontSize: buttonStyles.fontSize,
            fontWeight: '600',
            cursor: "pointer",
            boxShadow: "var(--safe-shadow-lg)",
            transition: "all 0.2s ease-out",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: buttonStyles.minWidth
          }}
        >
          <svg
            data-testid="exit-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            style={{
              animation: isHovered ? "pulse 0.5s infinite" : 'none'
            }}
          >
            <path d="M9 3l-6 6l6 6" />
            <path d="M3 9h12" />
            <path d="M21 3v18" />
          </svg>
          <span>{buttonText}</span>
          <span style={{
            marginLeft: "8px",
            fontSize: '11px',
            opacity: 0.9,
            fontWeight: "normal"
          }}>
            {hotkey === "Escape" ? "ESC×3" : shortcutKey}
          </span>
        </button>
      </div>

      {/* Hidden instructions for screen readers */}
      <div id="quick-exit-instructions" style={{ display: "none" }}>
        Press {hotkey === 'Escape' ? "Escape 3 times" : `${shortcutKey} ${shortcutCount} time${shortcutCount > 1 ? 's' : ''}`} or click this button to immediately leave the site.
      </div>

      {/* Screen reader announcement */}
      {exitAnnouncement && (
        <div role="alert" style={{
          position: "absolute", left: "-9999px"
        }}>
          {exitAnnouncement}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            ...getPositionStyles(),
            top: position.includes("top") ? "70px" : "auto",
            bottom: position.includes("bottom") ? "70px" : "auto",
            background: "var(--safe-gray-800)",
            color: "var(--safe-white)",
            padding: "12px 16px",
            borderRadius: "var(--safe-radius-md)",
            fontSize: "13px",
            maxWidth: "250px",
            boxShadow: "var(--safe-shadow-xl)",
            animation: "fadeIn 0.3s ease-out",
            pointerEvents: "none"
          }}
        >
          <div style={{
            fontWeight: "600", marginBottom: "4px"
          }}>
            Quick Exit Available
          </div>
          <div style={{
            opacity: 0.9
          }}>
            Press <kbd style={{
              background: "var(--safe-gray-600)",
              padding: "2px 6px",
              borderRadius: "3px",
              margin: "0 4px",
              fontSize: "12px"
            }}>{hotkey}</kbd>
            {shortcutKey && (
              <>
                {" or "}
                <kbd style={{
                  background: "var(--safe-gray-600)",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  margin: "0 4px",
                  fontSize: "12px"
                }}>{shortcutKey}</kbd>
                {shortcutCount > 1 && ` ${shortcutCount} times`}
              </>
            )}
            {" or click this button to immediately leave the site."}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export { QuickExitButton };
export default QuickExitButton;