import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Shield, Users, TrendingUp, Lock, Star } from 'lucide-react';
import '../styles/Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Heart size={24} />,
      title: 'Personalized Support',
      description: 'Tailored mental health resources based on your unique needs'
    },
    {
      icon: <Shield size={24} />,
      title: 'Crisis Support',
      description: '24/7 access to crisis resources and immediate help'
    },
    {
      icon: <Users size={24} />,
      title: 'Community',
      description: 'Connect with peers who understand your journey'
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Track Progress',
      description: 'Monitor your mood and wellness over time'
    },
    {
      icon: <Lock size={24} />,
      title: 'Privacy First',
      description: 'Your data is encrypted and completely confidential'
    },
    {
      icon: <Star size={24} />,
      title: 'Evidence-Based',
      description: 'Tools and techniques backed by mental health research'
    }
  ];

  const testimonials = [
    {
      text: 'This platform has been a lifeline during difficult times.',
      author: 'Anonymous User',
      rating: 5
    },
    {
      text: 'Finally, a mental health app that truly understands privacy.',
      author: 'Healthcare Professional',
      rating: 5
    },
    {
      text: 'The crisis support features have helped me more than I can express.',
      author: 'Community Member',
      rating: 5
    }
  ];

  return (
    <div className="landing-page">
      <header className="hero-section">
        <div className="hero-content">
          <h1>Your Mental Health Journey Starts Here</h1>
          <p>
            A safe, private, and supportive platform designed to help you
            navigate mental health challenges with confidence.
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/auth')}
            >
              Get Started Free
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/crisis')}
            >
              Crisis Support
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="placeholder-graphic">
            <Heart size={120} />
          </div>
        </div>
      </header>

      <section className="features-section">
        <h2>Everything You Need for Mental Wellness</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <h2>Trusted by Thousands</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="stars">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>
              <p>"{testimonial.text}"</p>
              <cite>- {testimonial.author}</cite>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Take the First Step Today</h2>
          <p>
            Join thousands who have found support, understanding, and hope
            through our platform.
          </p>
          <button 
            className="btn-primary large"
            onClick={() => navigate('/auth')}
          >
            Start Your Journey
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/help">Help Center</a>
          <a href="/crisis">Crisis Resources</a>
        </div>
        <p className="footer-text">
          © 2024 Mental Health Platform. Your wellness is our priority.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
