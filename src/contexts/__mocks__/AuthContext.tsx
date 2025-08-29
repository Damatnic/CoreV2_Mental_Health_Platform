import React, { createContext, useContext, ReactNode } from 'react';
import { Helper } from '../../types';

// Mock Auth Context for testing
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  helperProfile: Helper | null;
  isNewUser: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  updateHelperProfile: (updatedProfile: Helper) => void;
  userToken: string | null;
  isAnonymous?: boolean;
  authState?: any;
  register?: () => Promise<void>;
}

// Global state object to bridge context and stores
export const authState: {
  isAuthenticated: boolean;
  user: any;
  helperProfile: Helper | null;
  userToken: string | null;
} = {
  isAuthenticated: false,
  user: null,
  helperProfile: null,
  userToken: 'test-token' // Provide default test token
};

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  helperProfile: null,
  isNewUser: false,
  isLoading: false,
  login: jest.fn(() => Promise.resolve()),
  logout: jest.fn(() => Promise.resolve()),
  reloadProfile: jest.fn(() => Promise.resolve()),
  updateHelperProfile: jest.fn(),
  userToken: "test-token", // Provide default test token
  isAnonymous: false,
  authState: authState,
  register: jest.fn(() => Promise.resolve())
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Export the context for testing
export { AuthContext };

export const AuthProvider: React.FC<{ children: ReactNode; value?: Partial<AuthContextType> }> = ({
  children,
  value = {}
}) => {
  const contextValue = { ...defaultAuthContext, ...value };

  // Update global authState when value changes
  if (value.userToken !== undefined) authState.userToken = value.userToken;
  if (value.user !== undefined) authState.user = value.user;
  if (value.helperProfile !== undefined) authState.helperProfile = value.helperProfile;
  if (value.isAuthenticated !== undefined) authState.isAuthenticated = value.isAuthenticated;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};

// Mock useLegalConsents hook
export const useLegalConsents = () => ({
  requiredConsent: null,
  allConsentsGiven: true,
  acceptConsent: jest.fn(() => Promise.resolve()),
  getConsentContent: jest.fn(() => ({ title: '', text: '' }))
});

// Additional exports for testing convenience
export const mockLogin = jest.fn(() => Promise.resolve());
export const mockLogout = jest.fn(() => Promise.resolve());
export const mockReloadProfile = jest.fn(() => Promise.resolve());
export const mockUpdateHelperProfile = jest.fn();
export const mockRegister = jest.fn(() => Promise.resolve());

export default AuthContext;