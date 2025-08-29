import React, { useEffect, useState } from 'react';
import { useWellnessStore } from '../stores/wellnessStore';
import './MoodThemeAdapter.css';

interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  overlay: string;
  message: string;
}

interface MoodThemeAdapterProps {
  children: React.ReactNode;
  enableTransitions?: boolean;
  className?: string;
}

const moodThemes: Record<string, ThemeConfig> = {
  excellent: {
    name: 'Radiant',
    primary: '#10b981', // Emerald green
    secondary: '#34d399',
    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    overlay: 'rgba(16, 185, 129, 0.1)',
    message: 'You\'re radiating positive energy! ✨'
  },
  great: {
    name: 'Uplifting',
    primary: '#3b82f6', // Blue
    secondary: '#60a5fa',
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    overlay: 'rgba(59, 130, 246, 0.1)',
    message: 'Your mood is lifting the spirits around you! 🌟'
  },
  good: {
    name: 'Balanced',
    primary: '#8b5cf6', // Purple
    secondary: '#a78bfa',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    overlay: 'rgba(139, 92, 246, 0.1)',
    message: 'You\'re finding your balance beautifully 🌸'
  },
  okay: {
    name: 'Neutral',
    primary: '#6b7280', // Gray
    secondary: '#9ca3af',
    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    overlay: 'rgba(107, 114, 128, 0.1)',
    message: 'Every moment is a new beginning 🌱'
  },
  poor: {
    name: 'Gentle',
    primary: '#f59e0b', // Amber
    secondary: '#fbbf24',
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    overlay: 'rgba(245, 158, 11, 0.1)',
    message: 'Be gentle with yourself today 🤗'
  },
  terrible: {
    name: 'Supportive',
    primary: '#ef4444', // Red
    secondary: '#f87171',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    overlay: 'rgba(239, 68, 68, 0.1)',
    message: 'You\'re not alone. Support is here 💙'
  }
};

const defaultTheme: ThemeConfig = {
  name: 'Default',
  primary: '#6366f1',
  secondary: '#818cf8',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  overlay: 'rgba(99, 102, 241, 0.05)',
  message: 'Welcome to your wellness journey 🌈'
};

export const MoodThemeAdapter: React.FC<MoodThemeAdapterProps> = ({
  children,
  enableTransitions = true,
  className = ''
}) => {
  const { history } = useWellnessStore();
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Determine theme based on current mood
  useEffect(() => {
    const getMoodLevel = () => {
      // Use recent mood history if available
      if (history && history.length > 0) {
        const recentMood = history[0];
        return recentMood.level;
      }
      return null;
    };

    const moodLevel = getMoodLevel();
    const newTheme = moodLevel ? moodThemes[moodLevel] || defaultTheme : defaultTheme;

    if (newTheme.name !== activeTheme.name) {
      if (enableTransitions) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveTheme(newTheme);
          setIsTransitioning(false);
        }, 150);
      } else {
        setActiveTheme(newTheme);
      }
    }
  }, [history, activeTheme.name, enableTransitions]);

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    root.style.setProperty('--mood-primary', activeTheme.primary);
    root.style.setProperty('--mood-secondary', activeTheme.secondary);
    root.style.setProperty('--mood-background', activeTheme.background);
    root.style.setProperty('--mood-overlay', activeTheme.overlay);

    // Add mood class for additional styling
    const bodyClasses = document.body.classList;
    
    // Remove existing mood classes
    Array.from(bodyClasses).forEach(cls => {
      if (cls.startsWith('mood-theme-')) {
        bodyClasses.remove(cls);
      }
    });

    // Add current mood theme class
    const themeClass = `mood-theme-${activeTheme.name.toLowerCase()}`;
    bodyClasses.add(themeClass);

    return () => {
      // Cleanup on unmount
      Array.from(bodyClasses).forEach(cls => {
        if (cls.startsWith('mood-theme-')) {
          bodyClasses.remove(cls);
        }
      });
    };
  }, [activeTheme]);

  const containerClass = [
    'mood-theme-adapter',
    enableTransitions ? 'mood-theme-transitions' : '',
    isTransitioning ? 'mood-theme-transitioning' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClass}
      data-mood-theme={activeTheme.name.toLowerCase()}
      style={{
        '--mood-primary': activeTheme.primary,
        '--mood-secondary': activeTheme.secondary,
        '--mood-background': activeTheme.background,
        '--mood-overlay': activeTheme.overlay
      } as React.CSSProperties}
    >
      {/* Theme Message Overlay */}
      {currentMood && (
        <div className="mood-theme-message" role="status" aria-live="polite">
          <div className="mood-theme-message-content">
            <span className="mood-theme-message-text">
              {activeTheme.message}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mood-theme-content">
        {children}
      </div>

      {/* Background Enhancement */}
      <div 
        className="mood-theme-background"
        style={{ background: activeTheme.background }}
      />
      
      <div 
        className="mood-theme-overlay-layer"
        style={{ backgroundColor: activeTheme.overlay }}
      />
    </div>
  );
};

export default MoodThemeAdapter;