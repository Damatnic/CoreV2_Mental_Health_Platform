/**
 * Two-Factor Setup Component
 * Provides a secure setup wizard for enabling 2FA for professional users
 * HIPAA-compliant UI with QR code display, backup codes, and verification flow
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { twoFactorAuth, TwoFactorSecret, PROFESSIONAL_ROLES } from '../services/twoFactorAuth';
import { logger } from '../utils/logger';
import './TwoFactorSetup.css';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
  phoneNumber?: string;
}

type SetupStep = 'intro' | 'generate' | 'scan' | 'verify' | 'backup' | 'complete';

interface SetupState {
  currentStep: SetupStep;
  secret: TwoFactorSecret | null;
  verificationCode: string;
  verificationError: string | null;
  backupMethod: 'sms' | 'codes' | null;
  phoneNumber: string;
  smsCode: string;
  isLoading: boolean;
  showRecoveryCodes: boolean;
  copiedCodes: boolean;
  downloadedCodes: boolean;
  agreedToTerms: boolean;
}

/**
 * Two-Factor Authentication Setup Component
 */
export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onComplete,
  onCancel,
  phoneNumber: initialPhoneNumber = ''
}) => {
  const { user } = useAuth();
  
  const [state, setState] = useState<SetupState>({
    currentStep: 'intro',
    secret: null,
    verificationCode: '',
    verificationError: null,
    backupMethod: null,
    phoneNumber: initialPhoneNumber,
    smsCode: '',
    isLoading: false,
    showRecoveryCodes: false,
    copiedCodes: false,
    downloadedCodes: false,
    agreedToTerms: false
  });

  // Check if user is eligible for 2FA
  useEffect(() => {
    if (user && !twoFactorAuth.requiresTwoFactor(user.role)) {
      logger.warn('User role does not require 2FA', { userId: user.id, role: user.role });
    }
  }, [user]);

  /**
   * Generate new 2FA secret
   */
  const generateSecret = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, verificationError: null }));

    try {
      const secret = await twoFactorAuth.generateSecret(user.id, user.email);
      setState(prev => ({
        ...prev,
        secret,
        currentStep: 'scan',
        isLoading: false
      }));
      
      logger.info('2FA secret generated successfully', { userId: user.id });
    } catch (error) {
      logger.error('Failed to generate 2FA secret', { error, userId: user.id });
      setState(prev => ({
        ...prev,
        verificationError: 'Failed to generate authentication secret. Please try again.',
        isLoading: false
      }));
    }
  }, [user]);

  /**
   * Verify TOTP code
   */
  const verifyCode = useCallback(async () => {
    if (!user || !state.secret || !state.verificationCode) return;

    setState(prev => ({ ...prev, isLoading: true, verificationError: null }));

    try {
      const result = twoFactorAuth.verifyTOTP(
        state.secret.secret,
        state.verificationCode,
        user.id
      );

      if (result.isValid) {
        setState(prev => ({
          ...prev,
          currentStep: 'backup',
          isLoading: false,
          verificationError: null
        }));
        
        logger.info('TOTP verification successful', { userId: user.id });
      } else {
        const errorMessage = result.lockedUntil
          ? `Too many failed attempts. Please try again after ${new Date(result.lockedUntil).toLocaleTimeString()}`
          : `Invalid code. ${result.remainingAttempts} attempts remaining.`;
          
        setState(prev => ({
          ...prev,
          verificationError: errorMessage,
          isLoading: false
        }));
      }
    } catch (error) {
      logger.error('TOTP verification failed', { error, userId: user.id });
      setState(prev => ({
        ...prev,
        verificationError: 'Verification failed. Please try again.',
        isLoading: false
      }));
    }
  }, [user, state.secret, state.verificationCode]);

  /**
   * Send SMS backup code
   */
  const sendSMSCode = useCallback(async () => {
    if (!user || !state.phoneNumber) return;

    setState(prev => ({ ...prev, isLoading: true, verificationError: null }));

    try {
      const success = await twoFactorAuth.sendSMSBackupCode(user.id, state.phoneNumber);
      
      if (success) {
        setState(prev => ({
          ...prev,
          backupMethod: 'sms',
          isLoading: false
        }));
        
        logger.info('SMS backup code sent', { userId: user.id });
      } else {
        setState(prev => ({
          ...prev,
          verificationError: 'Failed to send SMS code. Please check your phone number.',
          isLoading: false
        }));
      }
    } catch (error) {
      logger.error('Failed to send SMS code', { error, userId: user.id });
      setState(prev => ({
        ...prev,
        verificationError: 'Failed to send SMS code. Please try again.',
        isLoading: false
      }));
    }
  }, [user, state.phoneNumber]);

  /**
   * Verify SMS backup code
   */
  const verifySMSCode = useCallback(async () => {
    if (!user || !state.smsCode) return;

    setState(prev => ({ ...prev, isLoading: true, verificationError: null }));

    try {
      const result = twoFactorAuth.verifySMSCode(user.id, state.smsCode);
      
      if (result.isValid) {
        setState(prev => ({
          ...prev,
          currentStep: 'complete',
          isLoading: false
        }));
        
        logger.info('SMS verification successful', { userId: user.id });
      } else {
        const errorMessage = result.lockedUntil
          ? `Too many failed attempts. Account locked until ${new Date(result.lockedUntil).toLocaleTimeString()}`
          : `Invalid code. ${result.remainingAttempts} attempts remaining.`;
          
        setState(prev => ({
          ...prev,
          verificationError: errorMessage,
          isLoading: false
        }));
      }
    } catch (error) {
      logger.error('SMS verification failed', { error, userId: user.id });
      setState(prev => ({
        ...prev,
        verificationError: 'Verification failed. Please try again.',
        isLoading: false
      }));
    }
  }, [user, state.smsCode]);

  /**
   * Copy recovery codes to clipboard
   */
  const copyRecoveryCodes = useCallback(() => {
    if (!state.secret?.backupCodes) return;

    const codesText = state.secret.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      setState(prev => ({ ...prev, copiedCodes: true }));
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, copiedCodes: false }));
      }, 3000);
      
      logger.info('Recovery codes copied to clipboard', { userId: user?.id });
    }).catch(error => {
      logger.error('Failed to copy recovery codes', { error });
    });
  }, [state.secret, user]);

  /**
   * Download recovery codes as text file
   */
  const downloadRecoveryCodes = useCallback(() => {
    if (!state.secret?.backupCodes || !user) return;

    const content = [
      'Astral Core Mental Health Platform',
      'Two-Factor Authentication Recovery Codes',
      `Generated: ${new Date().toLocaleString()}`,
      `User: ${user.email}`,
      '',
      'KEEP THESE CODES SAFE!',
      'Each code can only be used once.',
      '',
      '--- Recovery Codes ---',
      ...state.secret.backupCodes,
      '',
      '--- Instructions ---',
      '1. Store these codes in a secure location',
      '2. Do not share these codes with anyone',
      '3. Use these codes if you lose access to your authenticator app',
      '4. Each code can only be used once'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `astral-core-2fa-recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setState(prev => ({ ...prev, downloadedCodes: true }));
    logger.info('Recovery codes downloaded', { userId: user.id });
  }, [state.secret, user]);

  /**
   * Complete setup process
   */
  const completeSetup = useCallback(() => {
    if (!state.agreedToTerms) {
      setState(prev => ({
        ...prev,
        verificationError: 'You must agree to the terms to complete setup.'
      }));
      return;
    }

    logger.info('2FA setup completed', { userId: user?.id });
    
    if (onComplete) {
      onComplete();
    }
  }, [state.agreedToTerms, user, onComplete]);

  /**
   * Handle step navigation
   */
  const navigateToStep = (step: SetupStep) => {
    setState(prev => ({ ...prev, currentStep: step, verificationError: null }));
  };

  /**
   * Render current step content
   */
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'intro':
        return (
          <div className="twofa-step twofa-intro">
            <h2>Secure Your Account with Two-Factor Authentication</h2>
            <div className="twofa-info">
              <div className="info-icon">🔐</div>
              <p>
                As a healthcare professional, two-factor authentication (2FA) adds an extra 
                layer of security to protect sensitive patient information and maintain 
                HIPAA compliance.
              </p>
            </div>
            
            <div className="twofa-benefits">
              <h3>Benefits of 2FA:</h3>
              <ul>
                <li>✓ Enhanced security for patient data</li>
                <li>✓ HIPAA compliance requirement</li>
                <li>✓ Protection against unauthorized access</li>
                <li>✓ Secure session management</li>
              </ul>
            </div>

            <div className="twofa-requirements">
              <h3>What you'll need:</h3>
              <ul>
                <li>• An authenticator app (Google Authenticator, Authy, or Microsoft Authenticator)</li>
                <li>• Your mobile phone for backup SMS codes</li>
                <li>• A secure place to store recovery codes</li>
              </ul>
            </div>

            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={() => navigateToStep('generate')}
              >
                Begin Setup
              </button>
              <button 
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case 'generate':
        return (
          <div className="twofa-step twofa-generate">
            <h2>Generate Authentication Secret</h2>
            <p>
              We'll generate a unique secret key that links your account to your 
              authenticator app. This ensures only you can access your account.
            </p>
            
            <div className="security-notice">
              <strong>🔒 Security Notice:</strong>
              <p>
                Your secret key will be generated using cryptographically secure methods 
                and will never be shared or transmitted insecurely.
              </p>
            </div>

            {state.verificationError && (
              <div className="error-message" role="alert">
                {state.verificationError}
              </div>
            )}

            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={generateSecret}
                disabled={state.isLoading}
              >
                {state.isLoading ? 'Generating...' : 'Generate Secret'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigateToStep('intro')}
                disabled={state.isLoading}
              >
                Back
              </button>
            </div>
          </div>
        );

      case 'scan':
        return (
          <div className="twofa-step twofa-scan">
            <h2>Scan QR Code with Authenticator App</h2>
            
            <div className="qr-container">
              {state.secret?.qrCode && (
                <img 
                  src={state.secret.qrCode} 
                  alt="2FA QR Code"
                  className="qr-code"
                  aria-label="QR code for two-factor authentication setup"
                />
              )}
            </div>

            <div className="manual-entry">
              <details>
                <summary>Can't scan? Enter code manually</summary>
                <div className="manual-code">
                  <label htmlFor="manual-secret">Secret Key:</label>
                  <div className="code-display">
                    <code id="manual-secret">{state.secret?.secret}</code>
                    <button 
                      className="btn-copy"
                      onClick={() => navigator.clipboard.writeText(state.secret?.secret || '')}
                      aria-label="Copy secret key"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </details>
            </div>

            <div className="instructions">
              <h3>Setup Instructions:</h3>
              <ol>
                <li>Open your authenticator app</li>
                <li>Tap "Add Account" or the "+" button</li>
                <li>Scan the QR code above</li>
                <li>Your app will display a 6-digit code</li>
              </ol>
            </div>

            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={() => navigateToStep('verify')}
              >
                I've Added the Account
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigateToStep('generate')}
              >
                Back
              </button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="twofa-step twofa-verify">
            <h2>Verify Your Setup</h2>
            <p>
              Enter the 6-digit code from your authenticator app to verify that 
              two-factor authentication is working correctly.
            </p>

            <div className="verification-input">
              <label htmlFor="verification-code">Enter Verification Code:</label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={state.verificationCode}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                }))}
                className="code-input"
                aria-describedby={state.verificationError ? 'verification-error' : undefined}
              />
            </div>

            {state.verificationError && (
              <div id="verification-error" className="error-message" role="alert">
                {state.verificationError}
              </div>
            )}

            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={verifyCode}
                disabled={state.isLoading || state.verificationCode.length !== 6}
              >
                {state.isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigateToStep('scan')}
                disabled={state.isLoading}
              >
                Back
              </button>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="twofa-step twofa-backup">
            <h2>Setup Backup Methods</h2>
            <p>
              Configure backup methods in case you lose access to your authenticator app.
            </p>

            <div className="backup-options">
              <div className="backup-option">
                <h3>📱 SMS Backup (Recommended)</h3>
                <p>Receive backup codes via SMS when needed.</p>
                
                <div className="phone-input">
                  <label htmlFor="phone-number">Phone Number:</label>
                  <input
                    id="phone-number"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={state.phoneNumber}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      phoneNumber: e.target.value
                    }))}
                    disabled={state.backupMethod === 'sms'}
                  />
                  {state.backupMethod !== 'sms' && (
                    <button 
                      className="btn btn-small"
                      onClick={sendSMSCode}
                      disabled={!state.phoneNumber || state.isLoading}
                    >
                      Send Code
                    </button>
                  )}
                </div>

                {state.backupMethod === 'sms' && (
                  <div className="sms-verification">
                    <label htmlFor="sms-code">Enter SMS Code:</label>
                    <input
                      id="sms-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={state.smsCode}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        smsCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                      }))}
                    />
                    <button 
                      className="btn btn-small"
                      onClick={verifySMSCode}
                      disabled={state.smsCode.length !== 6 || state.isLoading}
                    >
                      Verify
                    </button>
                  </div>
                )}
              </div>

              <div className="backup-option">
                <h3>📝 Recovery Codes</h3>
                <p>Download one-time use recovery codes for emergency access.</p>
                
                <button 
                  className="btn btn-secondary"
                  onClick={() => setState(prev => ({ ...prev, showRecoveryCodes: true }))}
                >
                  View Recovery Codes
                </button>

                {state.showRecoveryCodes && state.secret?.backupCodes && (
                  <div className="recovery-codes">
                    <div className="codes-grid">
                      {state.secret.backupCodes.map((code, index) => (
                        <div key={index} className="recovery-code">
                          <span className="code-number">{index + 1}.</span>
                          <code>{code}</code>
                        </div>
                      ))}
                    </div>
                    
                    <div className="codes-actions">
                      <button 
                        className="btn btn-small"
                        onClick={copyRecoveryCodes}
                      >
                        {state.copiedCodes ? '✓ Copied!' : '📋 Copy All'}
                      </button>
                      <button 
                        className="btn btn-small"
                        onClick={downloadRecoveryCodes}
                      >
                        {state.downloadedCodes ? '✓ Downloaded!' : '💾 Download'}
                      </button>
                    </div>

                    <div className="warning-message">
                      <strong>⚠️ Important:</strong>
                      <ul>
                        <li>Store these codes in a secure location</li>
                        <li>Each code can only be used once</li>
                        <li>Do not share these codes with anyone</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {state.verificationError && (
              <div className="error-message" role="alert">
                {state.verificationError}
              </div>
            )}

            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={() => navigateToStep('complete')}
                disabled={!state.showRecoveryCodes || (!state.copiedCodes && !state.downloadedCodes)}
              >
                Continue
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigateToStep('verify')}
              >
                Back
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="twofa-step twofa-complete">
            <div className="success-icon">✅</div>
            <h2>Two-Factor Authentication Enabled!</h2>
            
            <div className="success-message">
              <p>
                Your account is now protected with two-factor authentication. 
                You'll be prompted to enter a verification code from your authenticator 
                app each time you sign in.
              </p>
            </div>

            <div className="final-checklist">
              <h3>Setup Summary:</h3>
              <ul>
                <li>✓ Authenticator app configured</li>
                <li>✓ Verification successful</li>
                {state.backupMethod === 'sms' && <li>✓ SMS backup enabled</li>}
                {state.downloadedCodes && <li>✓ Recovery codes saved</li>}
              </ul>
            </div>

            <div className="terms-agreement">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.agreedToTerms}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    agreedToTerms: e.target.checked
                  }))}
                />
                <span>
                  I understand that I must have access to my authenticator app or 
                  backup methods to sign in to my account.
                </span>
              </label>
            </div>

            {state.verificationError && (
              <div className="error-message" role="alert">
                {state.verificationError}
              </div>
            )}

            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={completeSetup}
                disabled={!state.agreedToTerms}
              >
                Complete Setup
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps: SetupStep[] = ['intro', 'generate', 'scan', 'verify', 'backup', 'complete'];
    const currentIndex = steps.indexOf(state.currentStep);

    return (
      <div className="step-indicator" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        {steps.map((step, index) => (
          <div
            key={step}
            className={`step ${index <= currentIndex ? 'active' : ''} ${index === currentIndex ? 'current' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step.charAt(0).toUpperCase() + step.slice(1)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="twofa-setup-container">
      <div className="twofa-setup-card">
        <div className="twofa-header">
          <h1>Two-Factor Authentication Setup</h1>
          {user && PROFESSIONAL_ROLES.includes(user.role) && (
            <span className="required-badge">Required for {user.role}</span>
          )}
        </div>

        {renderStepIndicator()}
        
        <div className="twofa-content">
          {renderStepContent()}
        </div>

        <div className="twofa-footer">
          <p className="security-note">
            🔒 All authentication data is encrypted and stored securely in compliance with HIPAA regulations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;