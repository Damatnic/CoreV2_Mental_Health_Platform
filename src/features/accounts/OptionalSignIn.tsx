import React, { useState } from 'react';
import { User, Lock, Mail, ChevronRight, Shield } from 'lucide-react';
import '../../styles/OptionalSignIn.css';

interface OptionalSignInProps {
  onSignIn?: (email: string) => void;
  onContinueAsGuest?: () => void;
}

const OptionalSignIn: React.FC<OptionalSignInProps> = ({
  onSignIn,
  onContinueAsGuest
}) => {
  const [mode, setMode] = useState<'choice' | 'signin' | 'signup'>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onSignIn?.(email);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && password === confirmPassword) {
      onSignIn?.(email);
    }
  };

  const handleGuestContinue = () => {
    onContinueAsGuest?.();
  };

  if (mode === 'choice') {
    return (
      <div className="optional-signin">
        <div className="signin-card">
          <div className="card-header">
            <Shield size={48} />
            <h2>Welcome to Your Safe Space</h2>
            <p>Choose how you'd like to continue</p>
          </div>

          <div className="options">
            <button 
              className="option-btn primary"
              onClick={() => setMode('signin')}
            >
              <User size={20} />
              <div>
                <h3>Sign In / Create Account</h3>
                <p>Save your progress and sync across devices</p>
              </div>
              <ChevronRight size={20} />
            </button>

            <button 
              className="option-btn secondary"
              onClick={handleGuestContinue}
            >
              <Shield size={20} />
              <div>
                <h3>Continue as Guest</h3>
                <p>Use the app privately without an account</p>
              </div>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="privacy-note">
            <Lock size={16} />
            <p>Your privacy is our priority. All data is encrypted and confidential.</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'signin') {
    return (
      <div className="optional-signin">
        <div className="signin-card">
          <div className="card-header">
            <User size={32} />
            <h2>Welcome Back</h2>
            <p>Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={18} />
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="submit-btn">
              Sign In
            </button>
          </form>

          <div className="form-footer">
            <button 
              className="link-btn"
              onClick={() => setMode('signup')}
            >
              New here? Create an account
            </button>
            <button 
              className="link-btn"
              onClick={() => setMode('choice')}
            >
              Back to options
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="optional-signin">
      <div className="signin-card">
        <div className="card-header">
          <User size={32} />
          <h2>Create Your Account</h2>
          <p>Start your wellness journey</p>
        </div>

        <form onSubmit={handleSignUp}>
          <div className="form-group">
            <label htmlFor="signup-email">
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              id="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">
              <Lock size={18} />
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={!email || !password || password !== confirmPassword}
          >
            Create Account
          </button>
        </form>

        <div className="form-footer">
          <button 
            className="link-btn"
            onClick={() => setMode('signin')}
          >
            Already have an account? Sign in
          </button>
          <button 
            className="link-btn"
            onClick={() => setMode('choice')}
          >
            Back to options
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionalSignIn;
