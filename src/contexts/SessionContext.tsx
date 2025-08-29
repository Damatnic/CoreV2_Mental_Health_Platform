import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SessionContextType {
  session: any;
  setSession: (session: any) => void;
  clearSession: () => void;
  isActive: boolean;
  lastActivity: Date | null;
  extendSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  timeout?: number; // Session timeout in milliseconds
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ 
  children, 
  timeout = 30 * 60 * 1000 // 30 minutes default
}) => {
  const [session, setSessionState] = useState<any>(null);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Initialize session from storage
  useEffect(() => {
    const storedSession = localStorage.getItem('session');
    const storedActivity = localStorage.getItem('lastActivity');
    
    if (storedSession && storedActivity) {
      const lastActivityDate = new Date(storedActivity);
      const now = new Date();
      
      // Check if session is still valid (not expired)
      if (now.getTime() - lastActivityDate.getTime() < timeout) {
        setSessionState(JSON.parse(storedSession));
        setLastActivity(lastActivityDate);
        setIsActive(true);
      } else {
        // Session expired, clear it
        clearSession();
      }
    }
  }, [timeout]);

  // Auto-logout on session timeout
  useEffect(() => {
    if (!isActive || !lastActivity) return;

    const checkTimeout = () => {
      const now = new Date();
      if (now.getTime() - lastActivity.getTime() >= timeout) {
        clearSession();
      }
    };

    const interval = setInterval(checkTimeout, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isActive, lastActivity, timeout]);

  const setSession = (newSession: any) => {
    const now = new Date();
    setSessionState(newSession);
    setLastActivity(now);
    setIsActive(true);
    
    // Persist to storage
    localStorage.setItem('session', JSON.stringify(newSession));
    localStorage.setItem('lastActivity', now.toISOString());
  };

  const clearSession = () => {
    setSessionState(null);
    setLastActivity(null);
    setIsActive(false);
    
    // Clear from storage
    localStorage.removeItem('session');
    localStorage.removeItem('lastActivity');
  };

  const extendSession = () => {
    if (session) {
      const now = new Date();
      setLastActivity(now);
      localStorage.setItem('lastActivity', now.toISOString());
    }
  };

  const value: SessionContextType = {
    session,
    setSession,
    clearSession,
    isActive,
    lastActivity,
    extendSession
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export { SessionContext };
export default SessionProvider;