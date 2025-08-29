/**
 * Mobile Navigation Component
 * 
 * Bottom navigation bar for mobile devices with accessibility features
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Heart, User, Plus } from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface MobileNavigationProps {
  className?: string;
  showLabels?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  onNavigate?: (path: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className = '',
  showLabels = false,
  activeColor = 'text-blue-600',
  inactiveColor = 'text-gray-400',
  onNavigate
}) => {
  const location = useLocation();
  
  const navItems: NavItem[] = [
    {
      path: '/',
      icon: Home,
      label: 'Home'
    },
    {
      path: '/chat',
      icon: MessageCircle,
      label: 'Chat',
      badge: 2
    },
    {
      path: '/mood',
      icon: Heart,
      label: 'Mood'
    },
    {
      path: '/crisis',
      icon: Plus,
      label: 'Crisis'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  const handleNavigation = (path: string) => {
    onNavigate?.(path);
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${className}`}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-3 relative ${
                isActive ? activeColor : inactiveColor
              } hover:opacity-80 transition-opacity`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              {showLabels && (
                <span className="text-xs mt-1">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;



