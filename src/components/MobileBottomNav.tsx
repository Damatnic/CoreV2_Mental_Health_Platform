/**
 * Mobile Bottom Navigation Component
 * Responsive navigation for mobile mental health platform
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  MessageCircle, 
  Activity, 
  User, 
  Plus, 
  Heart, 
  Menu, 
  X, 
  CheckCircle,
  Bell,
  Calendar,
  Settings
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number | string;
  disabled?: boolean;
  color?: string;
  activeColor?: string;
}

export interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  items?: NavItem[];
  showLabels?: boolean;
  variant?: 'default' | 'floating' | 'translucent';
  position?: 'bottom' | 'top';
  maxItems?: number;
  showMoreMenu?: boolean;
  className?: string;
  onQuickAction?: () => void;
  showQuickAction?: boolean;
  quickActionIcon?: React.ComponentType<{ className?: string }>;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    color: 'text-gray-600',
    activeColor: 'text-blue-600'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    path: '/chat',
    color: 'text-gray-600',
    activeColor: 'text-green-600'
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Activity,
    path: '/wellness',
    color: 'text-gray-600',
    activeColor: 'text-purple-600'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    path: '/calendar',
    color: 'text-gray-600',
    activeColor: 'text-orange-600'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
    color: 'text-gray-600',
    activeColor: 'text-red-600'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    color: 'text-gray-600',
    activeColor: 'text-gray-600'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    color: 'text-gray-600',
    activeColor: 'text-indigo-600'
  }
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  items = DEFAULT_NAV_ITEMS,
  showLabels = true,
  variant = 'default',
  position = 'bottom',
  maxItems = 5,
  showMoreMenu = true,
  className = '',
  onQuickAction,
  showQuickAction = false,
  quickActionIcon: QuickActionIcon = Plus
}) => {
  const [showOverflow, setShowOverflow] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll for floating variant
  useEffect(() => {
    if (variant === 'floating') {
      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY;
        const isScrolledEnough = currentScrollY > 100;

        if (isScrollingDown && isScrolledEnough) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }

        setLastScrollY(currentScrollY);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [variant, lastScrollY]);

  // Handle visibility changes
  useEffect(() => {
    if (variant === 'floating') {
      const root = document.documentElement;
      root.style.setProperty('--bottom-nav-visible', isVisible ? '1' : '0');
    }
  }, [isVisible, variant]);

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab) return;
    onTabChange(tabId);
    setShowOverflow(false); // Close overflow menu when selecting
  };

  const handleQuickAction = () => {
    onQuickAction?.();
  };

  const toggleOverflow = () => {
    setShowOverflow(!showOverflow);
  };

  const visibleItems = items.slice(0, showQuickAction ? maxItems - 1 : maxItems);
  const overflowItems = items.slice(showQuickAction ? maxItems - 1 : maxItems);

  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return 'rounded-full shadow-lg border border-gray-200 bg-white/90 backdrop-blur-sm mx-4 mb-4';
      case 'translucent':
        return 'bg-white/80 backdrop-blur-sm border-t border-gray-200/50';
      default:
        return 'bg-white border-t border-gray-200';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-0 border-t-0 border-b border-gray-200';
      default:
        return 'bottom-0';
    }
  };

  if (!isVisible && variant === 'floating') {
    return null;
  }

  // Navigation item component
  const NavItemButton: React.FC<{ item: NavItem }> = ({ item }) => {
    const IconComponent = item.icon;
    const isActive = activeTab === item.id;
    const isDisabled = item.disabled;

    return (
      <button
        type="button"
        className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-1 rounded-lg transition-all duration-200 ${
          isActive 
            ? `${item.activeColor || 'text-blue-600'} bg-blue-50` 
            : `${item.color || 'text-gray-600'} hover:text-gray-800 hover:bg-gray-50`
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !isDisabled && handleTabClick(item.id)}
        disabled={isDisabled}
        aria-label={`${item.label} tab`}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="relative mb-1">
          <IconComponent 
            className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform duration-200`}
          />
          {item.badge && (
            <span 
              className={`absolute -top-1 -right-1 w-4 h-4 text-xs text-white bg-red-500 rounded-full flex items-center justify-center ${
                typeof item.badge === 'string' ? 'min-w-[1rem] px-1' : ''
              }`}
            >
              {item.badge}
            </span>
          )}
        </div>
        {showLabels && (
          <span 
            className={`text-xs font-medium truncate max-w-full ${
              isActive ? 'font-semibold' : ''
            }`}
          >
            {item.label}
          </span>
        )}
      </button>
    );
  };

  // Overflow menu item component
  const OverflowMenuItem: React.FC<{ item: NavItem }> = ({ item }) => {
    const IconComponent = item.icon;
    const isActive = activeTab === item.id;
    const isDisabled = item.disabled;

    return (
      <button
        type="button"
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-50'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !isDisabled && handleTabClick(item.id)}
        disabled={isDisabled}
      >
        <div className="relative">
          <IconComponent className="w-5 h-5" />
          {isActive && (
            <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-blue-600" />
          )}
        </div>
        <span className="font-medium">{item.label}</span>
        {item.badge && (
          <span className="ml-auto px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div 
      className={`mobile-bottom-nav fixed left-0 right-0 z-50 transition-all duration-300 ${getPositionClasses()} ${getVariantClasses()} ${className}`}
      style={{
        '--bottom-nav-visible': isVisible ? '1' : '0'
      } as React.CSSProperties}
    >
      {/* Main navigation */}
      <nav className="flex items-center justify-around px-2 py-2">
        {/* Visible navigation items */}
        {visibleItems.map((item) => (
          <NavItemButton key={item.id} item={item} />
        ))}

        {/* Quick action button */}
        {showQuickAction && (
          <button
            type="button"
            className="flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-1 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            onClick={handleQuickAction}
            aria-label="Quick action"
          >
            <div className="relative mb-1">
              <QuickActionIcon className="w-5 h-5" />
            </div>
            {showLabels && (
              <span className="text-xs font-medium truncate max-w-full">Action</span>
            )}
          </button>
        )}

        {/* More menu button */}
        {showMoreMenu && overflowItems.length > 0 && (
          <button
            type="button"
            className="flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-1 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            onClick={toggleOverflow}
            aria-label="More options"
            aria-expanded={showOverflow}
          >
            <div className="relative mb-1">
              {showOverflow ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </div>
            {showLabels && (
              <span className="text-xs font-medium truncate max-w-full">
                {showOverflow ? 'Close' : 'More'}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Overflow menu */}
      {showOverflow && overflowItems.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-lg mb-1">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">More Options</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {overflowItems.map((item) => (
              <OverflowMenuItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Backdrop for closing overflow menu */}
      {showOverflow && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setShowOverflow(false)}
        />
      )}
    </div>
  );
};

// Mental health specific navigation presets
export const mentalHealthNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
    color: 'text-gray-600',
    activeColor: 'text-blue-600'
  },
  {
    id: 'chat',
    label: 'Support',
    icon: MessageCircle,
    path: '/chat',
    color: 'text-gray-600',
    activeColor: 'text-green-600'
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Heart,
    path: '/wellness',
    color: 'text-gray-600',
    activeColor: 'text-purple-600'
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: Activity,
    path: '/activities',
    color: 'text-gray-600',
    activeColor: 'text-orange-600'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    color: 'text-gray-600',
    activeColor: 'text-indigo-600'
  }
];

export default MobileBottomNav;