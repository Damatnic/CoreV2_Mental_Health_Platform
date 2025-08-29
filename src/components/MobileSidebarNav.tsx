/**
 * Mobile Sidebar Navigation
 * Responsive sidebar for mental health platform navigation
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Home, Smile, BookOpen, MessageCircle, Users, AlertTriangle, Heart, Settings } from 'lucide-react';

// Define ActiveView type locally to avoid import issues
export type ActiveView = 
  | 'dashboard'
  | 'mood-tracker' 
  | 'journal'
  | 'ai-chat'
  | 'community'
  | 'crisis-support'
  | 'wellness'
  | 'settings'
  | 'profile';

// Define MobileHelper type locally to avoid conflict with types.ts
interface MobileHelper {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy';
  specializations?: string[];
  rating?: number;
  isVerified?: boolean;
}

interface MobileSidebarNavProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onlineHelperCount: number;
  userToken: string | null;
  currentHelper: MobileHelper | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

// Navigation item configuration
interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  color: string;
  activeColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    emoji: '🏠',
    color: 'text-gray-700',
    activeColor: 'bg-blue-50 text-blue-700 border border-blue-200'
  },
  {
    id: 'mood-tracker',
    label: 'Mood Tracker',
    icon: Smile,
    emoji: '😊',
    color: 'text-gray-700',
    activeColor: 'bg-purple-50 text-purple-700 border border-purple-200'
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: BookOpen,
    emoji: '📝',
    color: 'text-gray-700',
    activeColor: 'bg-green-50 text-green-700 border border-green-200'
  },
  {
    id: 'ai-chat',
    label: 'AI Chat',
    icon: MessageCircle,
    emoji: '🤖',
    color: 'text-gray-700',
    activeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200'
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    emoji: '👥',
    color: 'text-gray-700',
    activeColor: 'bg-orange-50 text-orange-700 border border-orange-200'
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Heart,
    emoji: '💙',
    color: 'text-gray-700',
    activeColor: 'bg-pink-50 text-pink-700 border border-pink-200'
  },
  {
    id: 'crisis-support',
    label: 'Crisis Support',
    icon: AlertTriangle,
    emoji: '🚨',
    color: 'text-gray-700',
    activeColor: 'bg-red-50 text-red-700 border border-red-200'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    emoji: '⚙️',
    color: 'text-gray-700',
    activeColor: 'bg-gray-50 text-gray-700 border border-gray-200'
  }
];

export const MobileSidebarNav: React.FC<MobileSidebarNavProps> = ({
  activeView,
  setActiveView,
  isAuthenticated,
  onLogout,
  onlineHelperCount,
  userToken,
  currentHelper,
  isOpen,
  onToggle,
  onClose
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [swipeEnabled, setSwipeEnabled] = useState(true);

  // Handle swipe gestures for sidebar
  useEffect(() => {
    if (!sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    let startX = 0;
    let currentX = 0;
    let isSwipping = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isSwipping = true;
      sidebar.style.transition = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipping) return;
      
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      
      // Only allow left swipe to close
      if (diffX < 0 && isOpen) {
        const translateX = Math.max(diffX, -300);
        sidebar.style.transform = `translateX(${translateX}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isSwipping) return;
      
      isSwipping = false;
      sidebar.style.transition = 'transform 0.3s ease-out';
      
      const diffX = currentX - startX;
      
      // Close if swiped left more than 100px
      if (diffX < -100 && isOpen) {
        onClose();
      } else {
        // Reset position
        sidebar.style.transform = 'translateX(0)';
      }
    };

    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  // Disable body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSwipeEnabled(false);
    } else {
      document.body.style.overflow = '';
      setSwipeEnabled(true);
    }

    return () => {
      document.body.style.overflow = '';
      setSwipeEnabled(true);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle navigation item click
  const handleNavItemClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    onClose();
  };

  // Navigation item component
  const NavItemButton: React.FC<{ item: NavItem }> = ({ item }) => {
    const IconComponent = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        type="button"
        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
          isActive ? item.activeColor : `${item.color} hover:bg-gray-50`
        }`}
        onClick={() => handleNavItemClick(item.id)}
      >
        <IconComponent className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        <span className="text-lg">{item.emoji}</span>
      </button>
    );
  };

  // User info component
  const UserInfo: React.FC = () => {
    if (!isAuthenticated) return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {currentHelper?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">
              {currentHelper?.name || 'User'}
            </h3>
            <p className="text-sm text-gray-600">
              {currentHelper ? 'Helper' : 'Seeker'}
            </p>
            {currentHelper?.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                ✓ Verified
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Online helpers status
  const OnlineHelpersStatus: React.FC = () => (
    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="text-sm font-medium text-green-800 mb-1">
        Online Helpers
      </div>
      <div className="text-2xl font-bold text-green-700">
        {onlineHelperCount}
      </div>
      <p className="text-xs text-green-600">
        Available for support
      </p>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidebar-title"
    >
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleOverlayClick}
      />

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="sidebar-title" className="text-lg font-semibold text-gray-900">
            Navigation
          </h2>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <UserInfo />

          {/* Navigation items */}
          <nav className="space-y-2" role="navigation">
            {NAV_ITEMS.map((item) => (
              <NavItemButton key={item.id} item={item} />
            ))}
          </nav>

          <OnlineHelpersStatus />
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="border-t border-gray-200 p-4">
            <button
              type="button"
              className="w-full px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
              onClick={onLogout}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSidebarNav;

// Export the ActiveView type for use in other components
export type { ActiveView };