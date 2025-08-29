import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { Toaster } from 'react-hot-toast';
import { Heart, Shield, Users, MessageSquare, Brain, Loader2 } from 'lucide-react';

// Contexts
// import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SessionProvider } from './contexts/SessionContext';

// Components
import ErrorBoundary from './components/EnhancedErrorBoundary';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AppButton } from './components/AppButton';
import { NetworkBanner } from './components/NetworkBanner';

// Main App Components
import App from './App';

// Styles
import './index.css';
import './App.css';

interface User {
  id: string;
  email?: string;
  displayName: string;
  isAnonymous: boolean;
  role: 'user' | 'helper' | 'admin' | 'therapist' | 'moderator';
  profile: {
    avatar?: string;
    preferences: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      notifications: boolean;
    };
  };
  mentalHealth?: {
    conditions?: string[];
    goals?: string[];
    supportNeeds?: string[];
  };
}

interface SimpleAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

// Simple Auth Context
const SimpleAuthContext = React.createContext<SimpleAuthContextType | null>(null);

export const useSimpleAuth = () => {
  const context = React.useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};

// Simple Auth Provider
const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('simple_auth_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('simple_auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const saveUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('simple_auth_user', JSON.stringify(userData));
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const userData: User = {
        id: `user_${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        isAnonymous: false,
        role: 'user',
        profile: {
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=3b82f6&color=white`,
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true
          }
        }
      };

      saveUser(userData);
    } catch (error) {
      throw new Error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAnonymously = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const anonymousNames = [
        'Gentle Soul', 'Kind Heart', 'Caring Spirit', 'Supportive Friend',
        'Peaceful Mind', 'Wise Listener', 'Understanding Guide', 'Healing Light'
      ];
      
      const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
      const randomNumber = Math.floor(Math.random() * 9999) + 1;
      
      const userData: User = {
        id: `anon_${Date.now()}`,
        displayName: `${randomName} ${randomNumber}`,
        isAnonymous: true,
        role: 'user',
        profile: {
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomName)}&background=10b981&color=white`,
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: false
          }
        }
      };

      saveUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userData: User = {
        id: `user_${Date.now()}`,
        email,
        displayName,
        isAnonymous: false,
        role: 'user',
        profile: {
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=white`,
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true
          }
        }
      };

      saveUser(userData);
    } catch (error) {
      throw new Error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    const updatedUser = { ...user, ...updates };
    saveUser(updatedUser);
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('simple_auth_user');
    localStorage.removeItem('simple_auth_session');
  };

  const value: SimpleAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginAnonymously,
    logout,
    register,
    updateProfile
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

// Simple Login Form
const SimpleLoginForm: React.FC<{
  onSuccess: () => void;
}> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register, loginAnonymously } = useSimpleAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register(formData.email, formData.password, formData.displayName);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await loginAnonymously();
      onSuccess();
    } catch (err) {
      setError('Anonymous login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mental Health Platform
          </h1>
          <p className="text-gray-600">
            Your safe space for mental wellness and support
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex rounded-lg bg-gray-100 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'login' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'register' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                  required={mode === 'register'}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required={mode === 'register'}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <AppButton
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              loadingText={mode === 'login' ? 'Signing in...' : 'Creating account...'}
              className="mt-6"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </AppButton>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Anonymous Login */}
          <AppButton
            onClick={handleAnonymousLogin}
            variant="ghost"
            fullWidth
            loading={isLoading}
            loadingText="Creating anonymous session..."
            icon={<Shield className="w-4 h-4" />}
          >
            Continue Anonymously
          </AppButton>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">What you'll get:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                AI-powered emotional support chat
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Users className="w-4 h-4 text-green-500" />
                Peer support community
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Brain className="w-4 h-4 text-purple-500" />
                Personalized wellness tools
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-red-500" />
                Crisis support resources
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Your privacy and safety are our top priorities</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/privacy" className="hover:text-gray-700 underline">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-gray-700 underline">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create QueryClient
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 1000 * 60 * 5, // 5 minutes
//       cacheTime: 1000 * 60 * 10, // 10 minutes
//       retry: (failureCount, error) => {
//         if (error instanceof Error && error.message.includes('401')) {
//           return false; // Don't retry auth errors
//         }
//         return failureCount < 3;
//       }
//     },
//   },
// });

// Main App with Simple Auth
export const AppWithSimpleAuth: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <ErrorBoundary showCrisisSupport={true}>
      {/* <QueryClientProvider client={queryClient}> */}
        <SimpleAuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <SessionProvider>
                <BrowserRouter>
                  <AuthenticatedApp 
                    showWelcome={showWelcome}
                    setShowWelcome={setShowWelcome}
                  />
                  
                  {/* Global Components */}
                  <NetworkBanner />
                  {/* <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: '#10b981',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        duration: 5000,
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  /> */}
                </BrowserRouter>
              </SessionProvider>
            </NotificationProvider>
          </ThemeProvider>
        </SimpleAuthProvider>
      {/* </QueryClientProvider> */}
    </ErrorBoundary>
  );
};

// Authenticated App Component
const AuthenticatedApp: React.FC<{
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
}> = ({ showWelcome, setShowWelcome }) => {
  const { user, isAuthenticated, isLoading } = useSimpleAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your mental health platform...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return <SimpleLoginForm onSuccess={() => setShowWelcome(true)} />;
  }

  // Show welcome screen for new users
  if (showWelcome) {
    return (
      <WelcomeScreen 
        user={user}
        onComplete={() => setShowWelcome(false)}
      />
    );
  }

  // Show main app
  return <App />;
};

export default AppWithSimpleAuth;
