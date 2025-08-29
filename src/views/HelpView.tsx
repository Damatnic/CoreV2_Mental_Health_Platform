import React from 'react';

const HelpView: React.FC = () => {
  return (
    <div className="help-view">
      <div className="help-header">
        <h1>Help Center</h1>
        <p>Find answers to common questions and get support</p>
      </div>

      <div className="help-sections">
        <section className="help-section">
          <h2>Getting Started</h2>
          <div className="help-items">
            <div className="help-item">
              <h3>How do I create an account?</h3>
              <p>Click the "Get Started" button and follow the registration process. You'll need a valid email address to create your account.</p>
            </div>
            
            <div className="help-item">
              <h3>Is my information secure?</h3>
              <p>Yes, we use industry-standard encryption to protect your data. All conversations and personal information are kept strictly confidential.</p>
            </div>
            
            <div className="help-item">
              <h3>How do I use the AI chat?</h3>
              <p>Navigate to the AI Chat section and start typing your message. The AI assistant is available 24/7 to provide support and guidance.</p>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>Mental Health Resources</h2>
          <div className="help-items">
            <div className="help-item">
              <h3>What if I'm having a crisis?</h3>
              <p>If you're in immediate danger, call 911. For mental health crises, contact the National Suicide Prevention Lifeline at 988.</p>
            </div>
            
            <div className="help-item">
              <h3>How accurate are the assessments?</h3>
              <p>Our assessments use validated screening tools, but they are not diagnostic instruments. Always consult with a healthcare professional for proper diagnosis.</p>
            </div>
            
            <div className="help-item">
              <h3>Can I share my results with my doctor?</h3>
              <p>Yes, you can export your assessment results and mood tracking data to share with your healthcare provider.</p>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>Community Guidelines</h2>
          <div className="help-items">
            <div className="help-item">
              <h3>What are the community rules?</h3>
              <p>Be respectful, supportive, and maintain confidentiality. Share experiences rather than giving medical advice.</p>
            </div>
            
            <div className="help-item">
              <h3>How do I report inappropriate content?</h3>
              <p>Use the report button on any post or message, or contact our moderation team directly.</p>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>Technical Support</h2>
          <div className="help-items">
            <div className="help-item">
              <h3>The app isn't working properly</h3>
              <p>Try refreshing the page or clearing your browser cache. If problems persist, contact our support team.</p>
            </div>
            
            <div className="help-item">
              <h3>How do I reset my password?</h3>
              <p>Click "Forgot Password" on the login page and follow the instructions sent to your email.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="contact-support">
        <h2>Still Need Help?</h2>
        <p>If you can't find the answer you're looking for, our support team is here to help.</p>
        <div className="contact-options">
          <a href="mailto:support@corev2.com" className="contact-button">
            📧 Email Support
          </a>
          <a href="/crisis" className="contact-button crisis">
            🚨 Crisis Resources
          </a>
        </div>
      </div>

      <div className="emergency-notice">
        <h3>Emergency Resources</h3>
        <div className="emergency-contacts">
          <div className="emergency-item">
            <strong>National Suicide Prevention Lifeline:</strong>
            <a href="tel:988">988</a>
          </div>
          <div className="emergency-item">
            <strong>Crisis Text Line:</strong>
            <a href="sms:741741">Text HOME to 741741</a>
          </div>
          <div className="emergency-item">
            <strong>Emergency Services:</strong>
            <a href="tel:911">911</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpView;