import React, { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: "polite" | 'assertive';
  clearOnUnmount?: boolean;
}

const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
  priority = "polite",
  clearOnUnmount = true
}) => {
  const announcementRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    if (announcementRef.current && message) {
      // Clear previous message
      announcementRef.current.textContent = "";

      // Add new message with a slight delay to ensure screen readers pick it up
      const timeoutId = setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && announcementRef.current) {
        announcementRef.current.textContent = "";
      }
    };
  }, [clearOnUnmount]);

  return (
    <output
      ref={announcementRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only sr-announcement"
    />
  );
};

// Hook for managing announcements
export const useScreenReaderAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | "assertive" = "polite") => {
    // Create a temporary announcement element
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute('aria-atomic', "true");
    announcement.className = "sr-only sr-announcement";
    announcement.setAttribute("role", "status");

    // Add to DOM
    document.body.appendChild(announcement);

    // Announce message
    setTimeout(() => {
      announcement.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 3000);
  };

  return { announce };
};

// Context for global announcements
export const AnnouncementContext = React.createContext<{
  announce: (message: string, priority?: "polite" | "assertive") => void;
}>({
  announce: () => {}
});

interface AnnouncementProviderProps {
  children: React.ReactNode;
}

export const AnnouncementProvider: React.FC<AnnouncementProviderProps> = ({ children }) => {
  const { announce } = useScreenReaderAnnouncement();

  return (
    <AnnouncementContext.Provider value={{ announce }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

// Hook to use the announcement context
export const useAnnouncement = () => {
  const context = React.useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
};

// Common announcement messages
export const ANNOUNCEMENT_MESSAGES = {
  // Navigation
  PAGE_LOADED: (pageName: string) => `${pageName} page loaded`,
  NAVIGATION_CHANGED: (newLocation: string) => `Navigated to ${newLocation}`,

  // Form states
  FORM_SUBMITTED: 'Form submitted successfully',
  FORM_ERROR: "Form submission failed. Please check for errors.",
  FIELD_ERROR: (fieldName: string) => `Error in ${fieldName} field`,
  FIELD_REQUIRED: (fieldName: string) => `${fieldName} is required`,

  // Loading states
  LOADING_START: "Loading content",
  LOADING_COMPLETE: "Content loaded",
  LOADING_ERROR: "Failed to load content",

  // Chat states
  MESSAGE_SENT: "Message sent",
  MESSAGE_RECEIVED: "New message received",
  TYPING_INDICATOR: "Someone is typing",
  CHAT_CONNECTED: "Connected to chat",
  CHAT_DISCONNECTED: "Disconnected from chat",

  // Modal states
  MODAL_OPENED: (modalTitle: string) => `${modalTitle} dialog opened`,
  MODAL_CLOSED: "Dialog closed",

  // Search states
  SEARCH_RESULTS: (count: number) => `${count} search results found`,
  NO_SEARCH_RESULTS: "No search results found",
  SEARCH_CLEARED: "Search cleared",

  // Wellness states
  MOOD_UPDATED: 'Mood updated',
  REFLECTION_SAVED: "Reflection saved",
  GOAL_COMPLETED: "Goal marked as completed",

  // Error states
  NETWORK_ERROR: "Network connection error. Please check your internet connection.",
  PERMISSION_DENIED: "Permission denied. Please check your access rights.",
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Success states
  SETTINGS_SAVED: 'Settings saved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: "Password changed successfully",

  // Notification states
  NOTIFICATION_RECEIVED: "New notification received",
  NOTIFICATIONS_CLEARED: "All notifications cleared",

  // Copy/Share states
  COPIED_TO_CLIPBOARD: "Copied to clipboard",
  LINK_SHARED: 'Link shared successfully',

  // Filter/Sort states
  FILTER_APPLIED: (filterName: string) => `${filterName} filter applied`,
  SORT_CHANGED: (sortOption: string) => `Sorted by ${sortOption}`,

  // Count updates
  ITEMS_UPDATED: (count: number, itemType: string) => `${count} ${itemType} ${count === 1 ? "item" : "items"}`,

  // Time-sensitive
  SESSION_WARNING: 'Your session will expire in 5 minutes',
  AUTO_SAVE: 'Content automatically saved',

  // Accessibility
  KEYBOARD_SHORTCUT: (shortcut: string, action: string) => `Keyboard shortcut: ${shortcut} for ${action}`,
  SCREEN_READER_HELP: "Screen reader help available. Press H for help menu."
} as const;

// Helper component for common state announcements
interface StateAnnouncementProps {
  state: 'loading' | "success" | "error" | "idle";
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  previousState?: string;
}

export const StateAnnouncement: React.FC<StateAnnouncementProps> = ({
  state,
  loadingMessage = ANNOUNCEMENT_MESSAGES.LOADING_START,
  successMessage = ANNOUNCEMENT_MESSAGES.LOADING_COMPLETE,
  errorMessage = ANNOUNCEMENT_MESSAGES.LOADING_ERROR,
  previousState
}) => {
  const getMessage = () => {
    switch (state) {
      case "loading":
        return loadingMessage;
      case "success":
        return successMessage;
      case "error":
        return errorMessage;
      case "idle":
      default:
        return "";
    }
  };

  const message = getMessage();
  const priority = state === "error" ? "assertive" : 'polite';

  // Only announce if state has changed
  const shouldAnnounce = message && state !== previousState;

  return shouldAnnounce ? (
    <ScreenReaderAnnouncement message={message} priority={priority} />
  ) : null;
};

export default ScreenReaderAnnouncement;