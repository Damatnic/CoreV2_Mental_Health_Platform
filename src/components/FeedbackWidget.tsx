/**
 * Feedback Widget Component
 * 
 * Comprehensive feedback collection widget with crisis support,
 * satisfaction surveys, and therapeutic considerations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFeedback } from '../hooks/useFeedback';
import { useGlobalStore } from '../stores/globalStore';
import { motion, AnimatePresence } from 'framer-motion';
import './FeedbackWidget.css';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showLabel?: boolean;
  autoShow?: boolean;
  onSubmit?: (feedbackId: string | null) => void;
}

type FeedbackTab = 'general' | 'bug' | 'feature' | 'crisis';

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  position = 'bottom-right',
  showLabel = true,
  autoShow = false,
  onSubmit
}) => {
  const [isOpen, setIsOpen] = useState(autoShow);
  const [activeTab, setActiveTab] = useState<FeedbackTab>('general');
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactMe, setContactMe] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    showFeedback,
    hideFeedback,
    showSatisfactionSurvey,
    submitSatisfactionSurvey,
    quickFeedback,
    reportBug,
    requestFeature,
    submitCrisisFeedback,
    isSubmitting,
    error,
    successMessage,
    activePrompt,
    activeSurvey,
    dismissPrompt,
    analytics
  } = useFeedback();

  const { 
    user,
    crisisState,
    addNotification 
  } = useGlobalStore();

  // Show crisis tab if user is in crisis
  useEffect(() => {
    if (crisisState.isActive && crisisState.level !== 'none') {
      setActiveTab('crisis');
      if (!isOpen) {
        setIsOpen(true);
        addNotification({
          type: 'info',
          title: 'Feedback',
          message: 'We noticed you might need support. Please share how we can help.'
        });
      }
    }
  }, [crisisState]);

  // Handle active prompt
  useEffect(() => {
    if (activePrompt && !isOpen) {
      setIsOpen(true);
    }
  }, [activePrompt]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim()) {
      addNotification({
        type: 'warning',
        title: 'Message Required',
        message: 'Please enter your feedback message'
      });
      return;
    }

    let feedbackId: string | null = null;

    switch (activeTab) {
      case 'general':
        feedbackId = await showFeedback({
          type: 'general',
          message,
          category,
          anonymous: isAnonymous,
          contactMe,
          attachments,
          metadata: {
            rating,
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        });
        break;

      case 'bug':
        const steps = message.split('\n').filter(s => s.trim());
        feedbackId = await reportBug(
          message,
          steps.length > 1 ? steps : undefined,
          attachments[0]
        );
        break;

      case 'feature':
        feedbackId = await requestFeature(
          category || 'Feature Request',
          message,
          'User submitted via feedback widget'
        );
        break;

      case 'crisis':
        feedbackId = await submitCrisisFeedback(message, true);
        break;
    }

    if (feedbackId) {
      // Clear form
      setMessage('');
      setCategory('');
      setRating(0);
      setAttachments([]);
      
      // Call callback
      onSubmit?.(feedbackId);
      
      // Close after delay for non-crisis feedback
      if (activeTab !== 'crisis') {
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      }
    }
  }, [activeTab, message, category, rating, isAnonymous, contactMe, attachments]);

  const handleQuickRating = useCallback((value: number) => {
    setRating(value);
    quickFeedback(value as any);
    
    // Show thank you message
    addNotification({
      type: 'success',
      title: 'Thanks!',
      message: `You rated us ${value} stars`
    });
  }, [quickFeedback, addNotification]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        addNotification({
          type: 'warning',
          title: 'File Too Large',
          message: `${file.name} exceeds 10MB limit`
        });
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  }, [addNotification]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const renderSurvey = () => {
    if (!activeSurvey) return null;

    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});

    return (
      <div className="feedback-survey">
        <h3>Quick Survey</h3>
        {activeSurvey.questions.map(question => (
          <div key={question.id} className="survey-question">
            <label>{question.question}</label>
            
            {question.type === 'rating' && (
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    className={`star ${surveyAnswers[question.id] >= value ? 'active' : ''}`}
                    onClick={() => setSurveyAnswers(prev => ({ ...prev, [question.id]: value }))}
                    aria-label={`Rate ${value} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
            
            {question.type === 'text' && (
              <textarea
                value={surveyAnswers[question.id] || ''}
                onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                placeholder="Your answer..."
                rows={3}
              />
            )}
            
            {question.type === 'yes-no' && (
              <div className="yes-no-input">
                <button
                  className={surveyAnswers[question.id] === true ? 'active' : ''}
                  onClick={() => setSurveyAnswers(prev => ({ ...prev, [question.id]: true }))}
                >
                  Yes
                </button>
                <button
                  className={surveyAnswers[question.id] === false ? 'active' : ''}
                  onClick={() => setSurveyAnswers(prev => ({ ...prev, [question.id]: false }))}
                >
                  No
                </button>
              </div>
            )}
            
            {question.type === 'multiple-choice' && question.options && (
              <select
                value={surveyAnswers[question.id] || ''}
                onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
              >
                <option value="">Select...</option>
                {question.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
        ))}
        
        <div className="survey-actions">
          <button
            onClick={() => submitSatisfactionSurvey(surveyAnswers)}
            disabled={isSubmitting}
          >
            Submit Survey
          </button>
        </div>
      </div>
    );
  };

  const getPositionClasses = () => {
    const classes = ['feedback-widget'];
    classes.push(`position-${position}`);
    if (isOpen) classes.push('open');
    return classes.join(' ');
  };

  return (
    <div className={getPositionClasses()}>
      <button
        className="feedback-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close feedback' : 'Open feedback'}
        aria-expanded={isOpen}
      >
        <span className="icon">💬</span>
        {showLabel && <span className="label">Feedback</span>}
        {analytics.pending > 0 && (
          <span className="badge">{analytics.pending}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="feedback-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="panel-header">
              <h2>Send Feedback</h2>
              <button
                className="close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close feedback"
              >
                ×
              </button>
            </div>

            {activePrompt && (
              <div className="feedback-prompt">
                <p>{activePrompt.message}</p>
                {activePrompt.options && (
                  <div className="prompt-options">
                    {activePrompt.options.map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          setMessage(option);
                          dismissPrompt();
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={dismissPrompt} className="dismiss-button">
                  Dismiss
                </button>
              </div>
            )}

            {activeSurvey ? (
              renderSurvey()
            ) : (
              <>
                <div className="quick-rating">
                  <span>Quick Rating:</span>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        className={`star ${rating >= value ? 'active' : ''}`}
                        onClick={() => handleQuickRating(value)}
                        aria-label={`Rate ${value} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="feedback-tabs" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'general'}
                    onClick={() => setActiveTab('general')}
                    className={activeTab === 'general' ? 'active' : ''}
                  >
                    General
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'bug'}
                    onClick={() => setActiveTab('bug')}
                    className={activeTab === 'bug' ? 'active' : ''}
                  >
                    Report Bug
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'feature'}
                    onClick={() => setActiveTab('feature')}
                    className={activeTab === 'feature' ? 'active' : ''}
                  >
                    Request Feature
                  </button>
                  {crisisState.isActive && (
                    <button
                      role="tab"
                      aria-selected={activeTab === 'crisis'}
                      onClick={() => setActiveTab('crisis')}
                      className={`crisis-tab ${activeTab === 'crisis' ? 'active' : ''}`}
                    >
                      Crisis Support
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                  {activeTab === 'general' && (
                    <div className="form-group">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="">Select category...</option>
                        <option value="user-experience">User Experience</option>
                        <option value="performance">Performance</option>
                        <option value="content">Content</option>
                        <option value="accessibility">Accessibility</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  {activeTab === 'feature' && (
                    <div className="form-group">
                      <label htmlFor="feature-title">Feature Title</label>
                      <input
                        id="feature-title"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Brief title for your feature request"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="message">
                      {activeTab === 'bug' ? 'Describe the issue' : 
                       activeTab === 'feature' ? 'Describe the feature' :
                       activeTab === 'crisis' ? 'How can we help?' :
                       'Your feedback'}
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        activeTab === 'bug' ? 'What went wrong? Please include steps to reproduce...' :
                        activeTab === 'feature' ? 'What would you like to see? How would it help you?' :
                        activeTab === 'crisis' ? 'Please share what you need right now...' :
                        'Share your thoughts...'
                      }
                      rows={5}
                      required
                    />
                  </div>

                  {activeTab !== 'crisis' && (
                    <>
                      <div className="form-group attachments">
                        <label>
                          Attachments
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.txt,.doc,.docx"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="attach-button"
                          >
                            📎 Add Files
                          </button>
                        </label>
                        {attachments.length > 0 && (
                          <div className="attachment-list">
                            {attachments.map((file, index) => (
                              <div key={index} className="attachment-item">
                                <span>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(index)}
                                  aria-label={`Remove ${file.name}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="form-options">
                        <label>
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            disabled={!user}
                          />
                          Submit anonymously
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={contactMe}
                            onChange={(e) => setContactMe(e.target.checked)}
                            disabled={isAnonymous}
                          />
                          I'd like a response
                        </label>
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="error-message" role="alert">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="success-message" role="status">
                      {successMessage}
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim()}
                      className={activeTab === 'crisis' ? 'crisis-submit' : ''}
                    >
                      {isSubmitting ? 'Sending...' : 
                       activeTab === 'crisis' ? 'Get Help' : 'Send Feedback'}
                    </button>
                    {activeTab === 'crisis' && (
                      <a href="tel:988" className="crisis-hotline">
                        📞 Call 988 (Crisis Hotline)
                      </a>
                    )}
                  </div>
                </form>

                <div className="feedback-footer">
                  <button
                    onClick={() => showSatisfactionSurvey('manual')}
                    className="survey-link"
                  >
                    Take our satisfaction survey
                  </button>
                  <div className="analytics-summary">
                    <span>Response time: ~{analytics.responseTime}h</span>
                    <span>Satisfaction: {analytics.satisfactionTrend}</span>
                  </div>
                </div>
              </>
            )}

            <div className="keyboard-hint">
              <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> to toggle
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackWidget;