import React, { useState } from 'react';
import { Send, User, Clock, AlertTriangle } from 'lucide-react';
import '../../styles/TetherRequest.css';

interface TetherRequest {
  recipientId: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  responseNeeded: boolean;
  expiresAt?: Date;
}

const TetherRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    recipientId: '',
    message: '',
    urgency: 'medium' as const,
    responseNeeded: true,
    duration: '24'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tetherRequest: TetherRequest = {
        recipientId: formData.recipientId,
        message: formData.message,
        urgency: formData.urgency,
        responseNeeded: formData.responseNeeded,
        expiresAt: new Date(Date.now() + parseInt(formData.duration) * 60 * 60 * 1000)
      };
      
      console.log('Tether request sent:', tetherRequest);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to send tether request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  if (submitted) {
    return (
      <div className="tether-request success">
        <div className="success-message">
          <Send size={48} />
          <h2>Tether Request Sent</h2>
          <p>Your support request has been sent successfully.</p>
          <button 
            className="reset-btn"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                recipientId: '',
                message: '',
                urgency: 'medium',
                responseNeeded: true,
                duration: '24'
              });
            }}
          >
            Send Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tether-request">
      <div className="request-header">
        <Send size={24} />
        <div>
          <h2>Send Tether Request</h2>
          <p>Reach out to your support network when you need connection</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tether-form">
        <div className="form-group">
          <label htmlFor="recipient">
            <User size={18} />
            Recipient
          </label>
          <select
            id="recipient"
            value={formData.recipientId}
            onChange={(e) => setFormData({...formData, recipientId: e.target.value})}
            required
          >
            <option value="">Select a contact</option>
            <option value="friend1">Sarah (Friend)</option>
            <option value="family1">Mom (Family)</option>
            <option value="therapist1">Dr. Smith (Therapist)</option>
            <option value="support1">Crisis Counselor</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="urgency">
            <AlertTriangle size={18} />
            Urgency Level
          </label>
          <div className="urgency-selector">
            {(['low', 'medium', 'high', 'critical'] as const).map(level => (
              <label key={level} className="urgency-option">
                <input
                  type="radio"
                  name="urgency"
                  value={level}
                  checked={formData.urgency === level}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value as any})}
                />
                <span 
                  className="urgency-indicator"
                  style={{ backgroundColor: getUrgencyColor(level) }}
                />
                <span className="urgency-label">{level}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            placeholder="Let them know how you're feeling and what kind of support you need..."
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">
            <Clock size={18} />
            Request Duration
          </label>
          <select
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
          >
            <option value="1">1 hour</option>
            <option value="6">6 hours</option>
            <option value="12">12 hours</option>
            <option value="24">24 hours</option>
            <option value="72">3 days</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.responseNeeded}
              onChange={(e) => setFormData({...formData, responseNeeded: e.target.checked})}
            />
            Response needed
          </label>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
          style={{ backgroundColor: getUrgencyColor(formData.urgency) }}
        >
          {isSubmitting ? (
            <>
              <div className="loading-spinner" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Tether Request
            </>
          )}
        </button>
      </form>

      <div className="tether-info">
        <h3>What is a Tether Request?</h3>
        <p>
          A tether request is a way to reach out to your support network when you need 
          connection, comfort, or immediate assistance. Your chosen contact will receive 
          a notification and can respond based on the urgency level you set.
        </p>
      </div>
    </div>
  );
};

export default TetherRequest;
