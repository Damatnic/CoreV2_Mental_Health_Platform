import React, { useState } from 'react';
import { UserX, Eye, Shield, ArrowRight } from 'lucide-react';
import '../../styles/AnonymousLogin.css';

interface AnonymousLoginProps {
  onLogin?: (sessionId: string) => void;
  onCancel?: () => void;
}

const AnonymousLogin: React.FC<AnonymousLoginProps> = ({ onLogin, onCancel }) => {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      alert('Please agree to the terms of service to continue');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate anonymous session creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Store anonymous session
      sessionStorage.setItem('anonymous_session', JSON.stringify({
        sessionId,
        nickname: nickname || 'Anonymous User',
        createdAt: new Date().toISOString(),
        anonymous: true
      }));
      
      onLogin?.(sessionId);
    } catch (error) {
      console.error('Anonymous login failed:', error);
      alert('Failed to create anonymous session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomNickname = () => {
    const adjectives = ['Brave', 'Peaceful', 'Strong', 'Hopeful', 'Calm', 'Resilient'];
    const nouns = ['Warrior', 'Spirit', 'Soul', 'Heart', 'Mind', 'Light'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    
    setNickname(`${adjective}${noun}${number}`);
  };

  return (
    <div className="anonymous-login">
      <div className="login-container">
        <div className="login-header">
          <UserX size={32} />
          <h2>Anonymous Access</h2>
          <p>Access mental health support without creating an account</p>
        </div>

        <div className="privacy-notice">
          <Shield size={20} />
          <div>
            <h3>Your Privacy is Protected</h3>
            <ul>
              <li>No personal information required</li>
              <li>No email or phone number needed</li>
              <li>Session data is not permanently stored</li>
              <li>Complete anonymity maintained</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="anonymous-form">
          <div className="form-group">
            <label htmlFor="nickname">
              Display Name (Optional)
            </label>
            <div className="nickname-input">
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Choose a display name..."
                maxLength={20}
              />
              <button
                type="button"
                className="generate-btn"
                onClick={generateRandomNickname}
                title="Generate random nickname"
              >
                Generate
              </button>
            </div>
            <small>This is how you'll appear in community features</small>
          </div>

          <div className="limitations-notice">
            <Eye size={16} />
            <div>
              <h4>Anonymous Session Limitations</h4>
              <ul>
                <li>Data is not saved between sessions</li>
                <li>Limited access to personalization features</li>
                <li>Session expires after 24 hours of inactivity</li>
                <li>Cannot save progress or preferences</li>
              </ul>
            </div>
          </div>

          <div className="terms-agreement">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
              />
              <span>
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <div className="form-actions">
            {onCancel && (
              <button 
                type="button" 
                className="cancel-btn"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className="login-btn"
              disabled={!agreedToTerms || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Creating Session...
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  Continue Anonymously
                </>
              )}
            </button>
          </div>
        </form>

        <div className="alternative-options">
          <div className="divider">
            <span>or</span>
          </div>
          
          <div className="account-options">
            <p>Want to save your progress and access all features?</p>
            <button className="create-account-btn">
              Create Free Account
            </button>
            <button className="signin-btn">
              Sign In
            </button>
          </div>
        </div>

        <div className="security-note">
          <Shield size={14} />
          <p>
            Your anonymous session uses the same security measures as regular accounts, 
            ensuring your mental health data remains private and protected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnonymousLogin;
