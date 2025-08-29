import React from 'react';
import { ActiveView } from '../types';

interface SeekerSidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  isCollapsed: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  anonymousId?: string | null;
}

const SeekerSidebar: React.FC<SeekerSidebarProps> = ({
  activeView,
  onViewChange,
  isCollapsed,
  isAuthenticated,
  isAnonymous,
  anonymousId
}) => {
  const navigationItems = [
    {
      id: 'dashboard' as ActiveView,
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      description: 'Your personal wellness dashboard'
    },
    {
      id: 'mood-tracker' as ActiveView,
      label: 'Mood Tracker',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Track your daily mood and emotions'
    },
    {
      id: 'journal' as ActiveView,
      label: 'Journal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      description: 'Write and reflect on your thoughts'
    },
    {
      id: 'resources' as ActiveView,
      label: 'Resources',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      description: 'Helpful resources and tools'
    },
    {
      id: 'crisis-support' as ActiveView,
      label: 'Crisis Support',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      description: 'Immediate crisis support and resources',
      urgent: true
    },
    {
      id: 'community' as ActiveView,
      label: 'Community',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      description: 'Connect with others on similar journeys',
      requiresAuth: true
    },
    {
      id: 'settings' as ActiveView,
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Customize your experience'
    }
  ];

  const handleNavigation = (viewId: ActiveView) => {
    onViewChange(viewId);
  };

  return (
    <nav className="flex-1 px-4 py-6 space-y-2">
      {/* User Status */}
      {!isCollapsed && (
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {isAuthenticated ? 'Signed In' : isAnonymous ? 'Anonymous' : 'Guest'}
            </span>
          </div>
          {isAnonymous && (
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Your privacy is protected. Sign up to save progress.
            </p>
          )}
        </div>
      )}

      {/* Navigation Items */}
      {navigationItems.map((item) => {
        // Skip auth-required items for anonymous users
        if (item.requiresAuth && !isAuthenticated) {
          return null;
        }

        const isActive = activeView === item.id;
        const baseClasses = `
          flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
          ${isCollapsed ? 'justify-center' : 'justify-start'}
        `;
        
        const activeClasses = isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
        
        const urgentClasses = item.urgent && !isActive
          ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
          : '';

        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`${baseClasses} ${activeClasses} ${urgentClasses}`}
            title={isCollapsed ? item.label : undefined}
            aria-label={item.label}
          >
            <span className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>
              {item.icon}
            </span>
            
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  {item.urgent && !isActive && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  isActive 
                    ? 'text-blue-100' 
                    : item.urgent 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.description}
                </p>
              </div>
            )}
          </button>
        );
      })}

      {/* Anonymous User Call-to-Action */}
      {!isCollapsed && !isAuthenticated && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Get the Full Experience
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Sign up to save your progress, access community features, and get personalized support.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => onViewChange('profile')}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Sign Up Free
            </button>
            <button
              onClick={() => onViewChange('profile')}
              className="w-full px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Crisis Hotline */}
      {!isCollapsed && (
        <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm font-semibold text-red-800 dark:text-red-200">
              Crisis Support
            </span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300 mb-2">
            If you're in crisis, help is available 24/7:
          </p>
          <div className="space-y-1 text-xs">
            <div className="text-red-800 dark:text-red-200 font-medium">
              📞 988 - Suicide & Crisis Lifeline
            </div>
            <div className="text-red-700 dark:text-red-300">
              💬 Text HOME to 741741
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export { SeekerSidebar };
export default SeekerSidebar;
