import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-sections">
          <div className="footer-section">
            <h3 className="footer-title">CoreV2</h3>
            <p className="footer-description">
              Comprehensive mental health support platform providing AI assistance, 
              crisis resources, and community support.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/crisis">Crisis Resources</Link></li>
              <li><a href="mailto:support@corev2.com">Contact Support</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/assessments">Mental Health Assessments</Link></li>
              <li><Link to="/wellness">Wellness Tools</Link></li>
              <li><Link to="/community">Community</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/accessibility">Accessibility</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-emergency">
          <div className="emergency-notice">
            <h4>🚨 Crisis Support</h4>
            <div className="emergency-contacts">
              <a href="tel:988" className="emergency-link">
                📞 988 - Suicide Prevention Lifeline
              </a>
              <a href="tel:911" className="emergency-link">
                🚨 911 - Emergency Services
              </a>
              <a href="sms:741741" className="emergency-link">
                💬 Text HOME to 741741 - Crisis Text Line
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} CoreV2 Mental Health Platform. All rights reserved.</p>
          </div>
          
          <div className="footer-disclaimer">
            <p>
              <strong>Disclaimer:</strong> This platform provides general mental health information 
              and support tools. It is not a substitute for professional medical advice, diagnosis, 
              or treatment. Always seek the advice of qualified health providers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
