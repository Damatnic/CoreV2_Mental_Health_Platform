import React, { useState, useEffect } from 'react';
import { ActiveView, View } from '../types';
import SeekerSidebar from './SeekerSidebar';
// HelperSidebar component to be implemented
const HelperSidebar = SeekerSidebar; // Temporary fallback to SeekerSidebar
import { useOptionalAuth } from '../contexts/OptionalAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = React.memo(() => {
  const { isAuthenticated, isAnonymous, login, logout, helperProfile, userToken, anonymousId } = useOptionalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update active view based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      setActiveView('dashboard');
    } else if (path.includes('/mood')) {
      setActiveView('mood-tracker');
    } else if (path.includes('/journal')) {
      setActiveView('journal');
    } else if (path.includes('/resources')) {
      setActiveView('resources');
    } else if (path.includes('/crisis')) {
      setActiveView('crisis-support');
    } else if (path.includes('/community')) {
      setActiveView('community');
    } else if (path.includes('/settings')) {
      setActiveView('settings');
    } else if (path.includes('/profile')) {
      setActiveView('profile');
    } else {
      setActiveView('dashboard');
    }
  }, [location.pathname]);

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    
    // Navigate to the appropriate route
    switch (view) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'mood-tracker':
        navigate('/mood');
        break;
      case 'journal':
        navigate('/journal');
        break;
      case 'resources':
        navigate('/resources');
        break;
      case 'crisis-support':
        navigate('/crisis');
        break;
      case 'community':
        navigate('/community');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/dashboard');
    }

    // Collapse sidebar on mobile after navigation
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await logout();
      navigate('/');
    } else {
      await login();
    }
  };

  // Determine user type and render appropriate sidebar
  const isHelper = helperProfile !== null;
  const userType = isAuthenticated ? (isHelper ? 'helper' : 'seeker') : 'anonymous';

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 z-50
        ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64'}
        ${isMobile ? 'w-64' : ''}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-white">
                Astral Core
              </span>
            </div>
          )}
          
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg 
              className="w-5 h-5 text-gray-600 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {isAuthenticated ? (
                    helperProfile ? helperProfile.name || 'Helper' : 'User'
                  ) : 'Anonymous User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userType === 'helper' ? 'Mental Health Helper' : 
                   userType === 'seeker' ? 'Seeking Support' : 'Browsing Anonymously'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {isHelper ? (
            <HelperSidebar
              activeView={activeView}
              onViewChange={handleViewChange}
              isCollapsed={isCollapsed}
              userToken={userToken}
            />
          ) : (
            <SeekerSidebar
              activeView={activeView}
              onViewChange={handleViewChange}
              isCollapsed={isCollapsed}
              isAuthenticated={isAuthenticated}
              isAnonymous={isAnonymous}
              anonymousId={anonymousId}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {!isCollapsed && (
            <div className="space-y-2">
              <button
                onClick={handleAuthAction}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {isAuthenticated ? 'Sign Out' : 'Sign In'}
              </button>
              
              {!isAuthenticated && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Browsing anonymously. Sign in for full features.
                </p>
              )}
            </div>
          )}

          {isCollapsed && (
            <button
              onClick={handleAuthAction}
              className="w-full p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isAuthenticated ? 'Sign Out' : 'Sign In'}
            >
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isAuthenticated ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main content spacer */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`} />
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
