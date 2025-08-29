import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { path: '/', label: 'Home', public: true },
    { path: '/dashboard', label: 'Dashboard', public: false },
    { path: '/ai-chat', label: 'AI Chat', public: false },
    { path: '/crisis', label: 'Crisis Resources', public: true },
    { path: '/community', label: 'Community', public: false },
    { path: '/wellness', label: 'Wellness', public: false },
    { path: '/assessments', label: 'Assessments', public: false },
    { path: '/reflections', label: 'Reflections', public: false },
    { path: '/tether', label: 'Tether', public: false },
    { path: '/help', label: 'Help', public: true }
  ];

  const visibleItems = navigationItems.filter(item => 
    item.public || user
  );

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">🧠</span>
            <span className="brand-text">CoreV2</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-menu desktop-only">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="nav-user">
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-profile">
                <span className="user-avatar">
                  {user.firstName?.[0] || user.username?.[0] || '👤'}
                </span>
                <span className="user-name desktop-only">
                  {user.firstName || user.username}
                </span>
              </Link>
              <div className="user-dropdown">
                <Link to="/profile" className="dropdown-item">Profile</Link>
                <Link to="/settings" className="dropdown-item">Settings</Link>
                <button onClick={handleLogout} className="dropdown-item">
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth" className="auth-button">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle mobile-only"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-items">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="mobile-divider"></div>
                <Link
                  to="/profile"
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="mobile-nav-link logout-button"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Emergency Banner */}
      <div className="emergency-banner">
        <span>Crisis Support: </span>
        <a href="tel:988" className="emergency-link">988</a>
        <span> | </span>
        <a href="tel:911" className="emergency-link">911</a>
      </div>
    </nav>
  );
};

export default Navigation;
