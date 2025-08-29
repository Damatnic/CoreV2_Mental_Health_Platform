import React from 'react';
import { Link } from 'react-router-dom';

const LandingView: React.FC = () => {
  return (
    <div className="landing-view">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            CoreV2 Mental Health Platform
          </h1>
          <p className="hero-subtitle">
            Your comprehensive mental health support system with AI assistance, 
            crisis resources, and community support.
          </p>
          <div className="hero-actions">
            <Link to="/auth" className="cta-button primary">
              Get Started
            </Link>
            <Link to="/crisis" className="cta-button secondary">
              Crisis Resources
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Comprehensive Mental Health Support</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Mental Health Assistant</h3>
              <p>24/7 AI-powered support and guidance tailored to your needs</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🚨</div>
              <h3>Crisis Intervention</h3>
              <p>Immediate access to crisis resources and professional help</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Community Support</h3>
              <p>Connect with peers and share your mental health journey</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your mental health with assessments and mood tracking</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>Your data is secure and confidential with end-to-end encryption</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Access support anywhere with our responsive design</p>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="container">
          <h2>Making a Difference</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10k+</div>
              <div className="stat-label">Users Supported</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Available Support</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Confidential</div>
            </div>
          </div>
        </div>
      </div>

      <div className="testimonials-section">
        <div className="container">
          <h2>What Our Users Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p>
                "CoreV2 has been a lifeline for me. The AI assistant is always there 
                when I need support, and the community is incredibly caring."
              </p>
              <div className="testimonial-author">- Sarah M.</div>
            </div>
            
            <div className="testimonial-card">
              <p>
                "The crisis resources saved my life. Having immediate access to help 
                when I needed it most made all the difference."
              </p>
              <div className="testimonial-author">- Alex K.</div>
            </div>
            
            <div className="testimonial-card">
              <p>
                "I love how I can track my progress and see how far I've come. 
                The mood tracking helps me understand my patterns."
              </p>
              <div className="testimonial-author">- Jordan R.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Start Your Mental Health Journey?</h2>
          <p>Join thousands of others who have found support and healing with CoreV2</p>
          <div className="cta-actions">
            <Link to="/auth" className="cta-button large primary">
              Get Started Today
            </Link>
          </div>
        </div>
      </div>

      <div className="emergency-banner">
        <div className="container">
          <p>
            <strong>In Crisis?</strong> Get immediate help: 
            <a href="tel:988" className="emergency-link">988 (Suicide Prevention)</a> | 
            <a href="tel:911" className="emergency-link">911 (Emergency)</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingView;