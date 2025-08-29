/**
 * Responsive Navigation Component
 * Handles both desktop sidebar and mobile navigation without duplication
 */

import React, { useEffect, useRef, useState } from 'react';
import { Helper, ActiveView } from '../types';
import { SeekerSidebar } from './SeekerSidebar';
import { HelperSidebar } from './HelperSidebar';
import { useSwipeNavigation } from '../contexts/SwipeNavigationContext';
import { CloseIcon, MenuIcon } from './icons.dynamic';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ResponsiveNavigationProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onlineHelperCount: number;
  userToken: string | null;
  helperProfile: Helper | null;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = React.memo(({
  activeView,
  setActiveView,
  isAuthenticated,
  onLogout,
  onlineHelperCount,
  userToken,
  helperProfile
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const { isSidebarOpen, openSidebar, closeSidebar } = useSwipeNavigation();
  const sidebarRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle responsive behavior on screen size change
  useEffect(() => {
    if (!isMobile && isSidebarOpen) {
      // Close mobile sidebar when switching to desktop
      closeSidebar();
    }
  }, [isMobile, isSidebarOpen, closeSidebar]);

  // Handle escape key to close sidebar (mobile only)
  useEffect(() => {
    if (!isMobile) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSidebarOpen) {
        closeSidebar();
        hamburgerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isSidebarOpen, closeSidebar]);

  // Focus management for accessibility
  useEffect(() => {
    if (isMobile && isSidebarOpen && !isTransitioning) {
      // Focus first interactive element in sidebar for mobile
      setTimeout(() => {
        const firstButton = sidebarRef.current?.querySelector("button, a[href]");
        (firstButton as HTMLElement)?.focus();
      }, 100);
    }
  }, [isMobile, isSidebarOpen, isTransitioning]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobile, isSidebarOpen]);

  const handleSidebarNavigation = (view: ActiveView) => {
    setActiveView(view);

    if (isMobile) {
      setIsTransitioning(true);
      closeSidebar();

      // Return focus to hamburger menu for keyboard users
      setTimeout(() => {
        hamburgerRef.current?.focus();
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleOverlayClick = () => {
    closeSidebar();
    hamburgerRef.current?.focus();
  };

  const renderSidebarContent = () => {
    const props = {
      activeView,
      setActiveView: handleSidebarNavigation,
      onLogout,
      userToken,
      onlineHelperCount
    };

    if (isAuthenticated && helperProfile) {
      return (
        <HelperSidebar
          {...props}
          helperProfile={helperProfile}
        />
      );
    }

    return <SeekerSidebar {...props} />;
  };

  // Mobile Navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger Menu */}
        <header className="mobile-header" role="banner">
          <button
            ref={hamburgerRef}
            className="sidebar-trigger touch-optimized"
            onClick={openSidebar}
            aria-label="Open navigation menu"
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-sidebar"
            type="button"
          >
            <MenuIcon aria-hidden="true" />
          </button>

          <h1 className="mobile-header-title">Astral Core</h1>

          {/* Quick action buttons for mobile */}
          <div className="mobile-header-actions">
            {isAuthenticated && (
              <button 
                className="crisis-quick-access"
                onClick={() => handleSidebarNavigation({ view: "crisis" })}
                aria-label="Crisis support"
              >
                🆘
              </button>
            )}
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <button 
            className="sidebar-overlay"
            onClick={handleOverlayClick}
            aria-label="Close navigation menu"
            tabIndex={-1}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          ref={sidebarRef}
          id="mobile-sidebar"
          className={`mobile-sidebar ${isSidebarOpen ? "open" : ""}`}
          aria-hidden={!isSidebarOpen}
          role="navigation"
        >
          <div className="mobile-sidebar-header">
            <h2 className="mobile-sidebar-title">Menu</h2>
            <button 
              className="mobile-sidebar-close touch-optimized"
              onClick={closeSidebar}
              aria-label="Close navigation menu"
              type="button"
            >
              <CloseIcon aria-hidden="true" />
            </button>
          </div>

          <nav className="mobile-sidebar-content" role="navigation">
            {renderSidebarContent()}
          </nav>
        </aside>
      </>
    );
  }

  // Tablet Navigation (collapsible sidebar)
  if (isTablet) {
    return (
      <aside
        ref={sidebarRef}
        className={`tablet-sidebar ${isSidebarOpen ? "expanded" : "collapsed"}`}
        role="navigation"
      >
        <button 
          className="tablet-sidebar-toggle"
          onClick={() => isSidebarOpen ? closeSidebar() : openSidebar()}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className="tablet-sidebar-content">
          {renderSidebarContent()}
        </div>
      </aside>
    );
  }

  // Desktop Navigation (always visible sidebar)
  return (
    <aside
      ref={sidebarRef}
      className="desktop-sidebar"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="desktop-sidebar-header">
        <h1>Astral Core</h1>
        <p className="desktop-sidebar-subtitle">Peer Support Platform</p>
      </div>

      <nav className="desktop-sidebar-content">
        {renderSidebarContent()}
      </nav>

      <div className="desktop-sidebar-footer">
        <p className="online-status">
          {onlineHelperCount} helpers online
        </p>
        {isAuthenticated && (
          <button 
            className="sidebar-logout"
            onClick={onLogout}
            aria-label="Logout"
          >
            Logout
          </button>
        )}
      </div>
    </aside>
  );
});

ResponsiveNavigation.displayName = "ResponsiveNavigation";
export default ResponsiveNavigation;