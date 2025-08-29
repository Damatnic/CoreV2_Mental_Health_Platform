/**
 * Help & Tutorial System Component
 * Comprehensive interactive help system with guided tours, tooltips, and contextual assistance
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X, HelpCircle, Search, Book, Video, FileText } from 'lucide-react';
import '../styles/HelpTutorialSystem.css';

// Types for the help system
interface HelpTopic {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'basics' | 'features' | 'wellness' | 'safety' | 'troubleshooting' | 'accessibility';
  tags: string[];
  relatedTopics?: string[];
  videoUrl?: string;
  screenshots?: string[];
}

interface TutorialStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  skipable?: boolean;
  highlightTarget?: boolean;
}

interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  requiredPath?: string;
  estimatedTime?: number; // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface TooltipData {
  id: string;
  selector: string;
  content: string;
  showOnHover?: boolean;
  showOnFocus?: boolean;
  delay?: number;
}

interface HelpSystemConfig {
  showTutorialOnFirstVisit?: boolean;
  enableTooltips?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableContextualHelp?: boolean;
  autoShowHelpForNewFeatures?: boolean;
}

interface HelpTutorialSystemProps {
  config?: HelpSystemConfig;
  userId?: string;
}

const HelpTutorialSystem: React.FC<HelpTutorialSystemProps> = ({ 
  config = {
    showTutorialOnFirstVisit: true,
    enableTooltips: true,
    enableKeyboardShortcuts: true,
    enableContextualHelp: true,
    autoShowHelpForNewFeatures: true
  },
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<HelpTopic[]>([]);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [isLoading] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const helpPanelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sample help topics
  const helpTopics: HelpTopic[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of the mental health platform',
      content: 'Welcome to our mental health support platform. This guide will help you get started...',
      category: 'basics',
      tags: ['beginner', 'introduction', 'setup'],
      relatedTopics: ['navigation', 'profile-setup']
    },
    {
      id: 'crisis-support',
      title: 'Crisis Support Features',
      description: 'Understanding emergency and crisis support tools',
      content: 'Our platform provides immediate crisis support through multiple channels...',
      category: 'safety',
      tags: ['emergency', 'crisis', 'help'],
      relatedTopics: ['emergency-contacts', 'panic-button']
    },
    {
      id: 'mood-tracking',
      title: 'Mood Tracking',
      description: 'How to use the mood tracking feature',
      content: 'Track your mood over time to identify patterns and triggers...',
      category: 'wellness',
      tags: ['mood', 'tracking', 'wellness'],
      videoUrl: '/tutorials/mood-tracking.mp4',
      relatedTopics: ['journaling', 'analytics']
    },
    {
      id: 'accessibility',
      title: 'Accessibility Features',
      description: 'Making the platform accessible for all users',
      content: 'We offer various accessibility features including screen reader support...',
      category: 'accessibility',
      tags: ['accessibility', 'screen-reader', 'keyboard-navigation']
    }
  ];

  // Sample tutorials
  const tutorials: Tutorial[] = [
    {
      id: 'platform-tour',
      name: 'Platform Tour',
      description: 'A comprehensive tour of all main features',
      estimatedTime: 5,
      difficulty: 'beginner',
      steps: [
        {
          id: 'step-1',
          target: '.navigation',
          title: 'Navigation',
          content: 'Use the navigation menu to access different sections of the platform.',
          position: 'bottom',
          highlightTarget: true
        },
        {
          id: 'step-2',
          target: '.dashboard',
          title: 'Dashboard',
          content: 'Your dashboard shows your recent activity and quick actions.',
          position: 'center',
          highlightTarget: true
        },
        {
          id: 'step-3',
          target: '.crisis-button',
          title: 'Crisis Support',
          content: 'In case of emergency, use the crisis support button for immediate help.',
          position: 'left',
          highlightTarget: true,
          skipable: false
        }
      ]
    },
    {
      id: 'mood-tracker-tutorial',
      name: 'Mood Tracker Tutorial',
      description: 'Learn how to track and analyze your mood',
      estimatedTime: 3,
      difficulty: 'beginner',
      requiredPath: '/wellness',
      steps: [
        {
          id: 'mood-step-1',
          target: '.mood-input',
          title: 'Log Your Mood',
          content: 'Select your current mood from the scale.',
          position: 'right',
          highlightTarget: true
        },
        {
          id: 'mood-step-2',
          target: '.mood-notes',
          title: 'Add Notes',
          content: 'Optionally add notes about what influenced your mood.',
          position: 'top',
          highlightTarget: true
        }
      ]
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    if (!config.enableKeyboardShortcuts) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h':
            e.preventDefault();
            setIsHelpOpen(!isHelpOpen);
            break;
          case '/':
            e.preventDefault();
            setIsHelpOpen(true);
            setTimeout(() => {
              const searchInput = document.querySelector('.help-search-input') as HTMLInputElement;
              searchInput?.focus();
            }, 100);
            break;
          case '?':
            e.preventDefault();
            setShowKeyboardShortcuts(!showKeyboardShortcuts);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isHelpOpen, showKeyboardShortcuts, config.enableKeyboardShortcuts]);

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const results = helpTopics.filter(topic => 
      topic.title.toLowerCase().includes(query.toLowerCase()) ||
      topic.description.toLowerCase().includes(query.toLowerCase()) ||
      topic.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    setSearchResults(results);
  }, []);

  // Tutorial navigation
  const startTutorial = useCallback((tutorialId: string) => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      if (tutorial.requiredPath && location.pathname !== tutorial.requiredPath) {
        navigate(tutorial.requiredPath);
      }
      setActiveTutorial(tutorial);
      setCurrentTutorialStep(0);
    }
  }, [location.pathname, navigate]);

  const nextTutorialStep = useCallback(() => {
    if (activeTutorial && currentTutorialStep < activeTutorial.steps.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1);
    } else {
      completeTutorial();
    }
  }, [activeTutorial, currentTutorialStep]);

  const previousTutorialStep = useCallback(() => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(currentTutorialStep - 1);
    }
  }, [currentTutorialStep]);

  const completeTutorial = useCallback(() => {
    if (activeTutorial) {
      setCompletedTutorials(new Set([...completedTutorials, activeTutorial.id]));
      setActiveTutorial(null);
      setCurrentTutorialStep(0);
    }
  }, [activeTutorial, completedTutorials]);

  // Render tutorial overlay
  const renderTutorialOverlay = () => {
    if (!activeTutorial) return null;

    const currentStep = activeTutorial.steps[currentTutorialStep];
    
    return (
      <div className="tutorial-overlay" ref={overlayRef}>
        <div className="tutorial-backdrop" onClick={() => currentStep.skipable && completeTutorial()} />
        <div className={`tutorial-tooltip tutorial-position-${currentStep.position}`}>
          <div className="tutorial-header">
            <h3>{currentStep.title}</h3>
            <button onClick={completeTutorial} className="tutorial-close">
              <X size={20} />
            </button>
          </div>
          <div className="tutorial-content">
            <p>{currentStep.content}</p>
          </div>
          <div className="tutorial-footer">
            <div className="tutorial-progress">
              Step {currentTutorialStep + 1} of {activeTutorial.steps.length}
            </div>
            <div className="tutorial-actions">
              {currentTutorialStep > 0 && (
                <button onClick={previousTutorialStep} className="tutorial-btn-secondary">
                  <ChevronLeft size={16} /> Previous
                </button>
              )}
              {currentStep.action && (
                <button onClick={currentStep.action.onClick} className="tutorial-btn-action">
                  {currentStep.action.label}
                </button>
              )}
              <button onClick={nextTutorialStep} className="tutorial-btn-primary">
                {currentTutorialStep === activeTutorial.steps.length - 1 ? 'Finish' : 'Next'} 
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render help panel
  const renderHelpPanel = () => {
    if (!isHelpOpen) return null;

    return (
      <div className="help-panel" ref={helpPanelRef}>
        <div className="help-panel-header">
          <h2>Help & Support</h2>
          <button onClick={() => setIsHelpOpen(false)} className="help-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="help-search">
          <Search size={20} />
          <input
            type="text"
            className="help-search-input"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="help-categories">
          <button 
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All Topics
          </button>
          <button 
            className={selectedCategory === 'basics' ? 'active' : ''}
            onClick={() => setSelectedCategory('basics')}
          >
            <Book size={16} /> Basics
          </button>
          <button 
            className={selectedCategory === 'wellness' ? 'active' : ''}
            onClick={() => setSelectedCategory('wellness')}
          >
            Wellness
          </button>
          <button 
            className={selectedCategory === 'safety' ? 'active' : ''}
            onClick={() => setSelectedCategory('safety')}
          >
            Safety
          </button>
        </div>

        <div className="help-content">
          {searchQuery && searchResults.length > 0 ? (
            <div className="help-search-results">
              <h3>Search Results</h3>
              {searchResults.map(topic => (
                <div key={topic.id} className="help-topic-card">
                  <h4>{topic.title}</h4>
                  <p>{topic.description}</p>
                  {topic.videoUrl && <Video size={16} />}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="help-tutorials">
                <h3>Interactive Tutorials</h3>
                {tutorials.map(tutorial => (
                  <div key={tutorial.id} className="tutorial-card">
                    <h4>{tutorial.name}</h4>
                    <p>{tutorial.description}</p>
                    <div className="tutorial-meta">
                      <span className="tutorial-time">{tutorial.estimatedTime} min</span>
                      <span className={`tutorial-difficulty tutorial-${tutorial.difficulty}`}>
                        {tutorial.difficulty}
                      </span>
                    </div>
                    <button 
                      onClick={() => startTutorial(tutorial.id)}
                      className="tutorial-start-btn"
                      disabled={completedTutorials.has(tutorial.id)}
                    >
                      {completedTutorials.has(tutorial.id) ? 'Completed' : 'Start Tutorial'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="help-topics">
                <h3>Help Topics</h3>
                {helpTopics
                  .filter(topic => selectedCategory === 'all' || topic.category === selectedCategory)
                  .map(topic => (
                    <div key={topic.id} className="help-topic-card">
                      <div className="topic-icon">
                        {topic.videoUrl ? <Video size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="topic-content">
                        <h4>{topic.title}</h4>
                        <p>{topic.description}</p>
                        <div className="topic-tags">
                          {topic.tags.map(tag => (
                            <span key={tag} className="topic-tag">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        {showKeyboardShortcuts && (
          <div className="keyboard-shortcuts">
            <h3>Keyboard Shortcuts</h3>
            <div className="shortcut-item">
              <span className="shortcut-keys">Ctrl + H</span>
              <span>Toggle Help</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-keys">Ctrl + /</span>
              <span>Search Help</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-keys">Ctrl + ?</span>
              <span>Show Shortcuts</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating help button */}
      <button
        className="help-floating-btn"
        onClick={() => setIsHelpOpen(true)}
        aria-label="Open help"
      >
        <HelpCircle size={24} />
      </button>

      {/* Help panel */}
      {renderHelpPanel()}

      {/* Tutorial overlay */}
      {renderTutorialOverlay()}

      {/* Loading indicator */}
      {isLoading && (
        <div className="help-loading">
          <div className="help-spinner" />
        </div>
      )}
    </>
  );
};

export default HelpTutorialSystem;
