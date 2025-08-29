import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/MobileResponsiveComponents.css';

// Mobile Navigation Component
interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onToggle,
  onClose,
  children
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button 
        className="mobile-nav-trigger"
        onClick={onToggle}
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <div className={`mobile-nav-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      
      <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <h3>Navigation</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="mobile-nav-content">
          {children}
        </div>
      </nav>
    </>
  );
};

// Mobile Bottom Navigation
interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MobileBottomNavProps {
  items: BottomNavItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeItem,
  onItemClick
}) => {
  return (
    <nav className="mobile-bottom-nav">
      {items.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={() => onItemClick(item.id)}
          aria-label={item.label}
        >
          <div className="nav-icon">
            {item.icon}
            {item.badge && item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </div>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// Mobile Card Swiper
interface MobileCardSwiperProps {
  children: React.ReactNode[];
  className?: string;
  showIndicators?: boolean;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

export const MobileCardSwiper: React.FC<MobileCardSwiperProps> = ({
  children,
  className = '',
  showIndicators = true,
  autoPlay = false,
  autoPlayDelay = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (autoPlay && children.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % children.length);
      }, autoPlayDelay);

      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayDelay, children.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < children.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, children.length - 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className={`mobile-card-swiper ${className}`}>
      <div className="swiper-container">
        <button 
          className="swiper-btn prev"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>

        <div 
          className="swiper-wrapper"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.3s ease'
          }}
        >
          {children.map((child, index) => (
            <div key={index} className="swiper-slide">
              {child}
            </div>
          ))}
        </div>

        <button 
          className="swiper-btn next"
          onClick={nextSlide}
          disabled={currentIndex === children.length - 1}
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {showIndicators && children.length > 1 && (
        <div className="swiper-indicators">
          {children.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile Pull to Refresh
interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  refreshThreshold?: number;
}

export const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
  onRefresh,
  children,
  refreshThreshold = 100
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, refreshThreshold * 1.5));
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  return (
    <div 
      className="mobile-pull-to-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`refresh-indicator ${pullDistance >= refreshThreshold ? 'ready' : ''} ${isRefreshing ? 'refreshing' : ''}`}
        style={{ 
          transform: `translateY(${Math.max(0, pullDistance - 50)}px)`,
          opacity: pullDistance > 0 ? 1 : 0
        }}
      >
        <div className="refresh-spinner" />
        <span>
          {isRefreshing ? 'Refreshing...' : 
           pullDistance >= refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      
      <div 
        className="refresh-content"
        style={{ transform: `translateY(${pullDistance * 0.5}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

// Mobile Tab Bar
interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface MobileTabBarProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  scrollable?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  scrollable = false
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab || tabs[0]?.id);
  
  const currentTab = activeTab || internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  return (
    <div className="mobile-tab-bar">
      <div className={`tab-headers ${scrollable ? 'scrollable' : ''}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-header ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {tabs.find(tab => tab.id === currentTab)?.content}
      </div>
    </div>
  );
};

// Mobile Responsive Hook
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setScreenSize('mobile');
        setIsMobile(true);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, screenSize };
};

// Export all components as default
export default {
  MobileNav,
  MobileBottomNav,
  MobileCardSwiper,
  MobilePullToRefresh,
  MobileTabBar,
  useMobileDetection
};
