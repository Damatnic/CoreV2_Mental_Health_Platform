import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { SessionProvider } from './contexts/SessionContext';
import { I18nProvider } from './i18n';

// Layout Components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorFallback from './components/ErrorFallback';

// Core Components
import PWAInstallBanner from './components/PWAInstallBanner';
import ServiceWorkerUpdate from './components/ServiceWorkerUpdate';

// Views - Lazy loaded for better performance with retry logic
const retryLazy = (componentImport: () => Promise<any>) => 
  React.lazy(() => componentImport().catch(() => 
    new Promise(resolve => setTimeout(resolve, 1500)).then(() => componentImport())
  ));

const LandingView = retryLazy(() => import('./views/LandingView'));
const DashboardView = retryLazy(() => import('./views/DashboardView'));
const AuthPage = retryLazy(() => import('./views/AuthPage'));
const ProfileView = retryLazy(() => import('./views/ProfileView'));
const SettingsView = retryLazy(() => import('./views/SettingsView'));
const AIChatView = retryLazy(() => import('./views/AIChatView'));
const CrisisView = retryLazy(() => import('./views/CrisisView'));
const CommunityView = retryLazy(() => import('./views/CommunityView'));
const WellnessView = retryLazy(() => import('./views/WellnessView'));
const AssessmentsView = retryLazy(() => import('./views/AssessmentsView'));
const ReflectionsView = retryLazy(() => import('./views/ReflectionsView'));
const TetherView = retryLazy(() => import('./views/TetherView'));
const HelpView = retryLazy(() => import('./views/HelpView'));
const ProfessionalView = retryLazy(() => import('./views/ProfessionalView'));

// Utils
import { logger } from './utils/logger';
import { useAuth } from './hooks/useAuth';
import { useMobile } from './hooks/useMobile';

// Styles
import './App.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { isMobile } = useMobile();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        logger.info('App initializing', { userAgent: navigator.userAgent }, 'App');
        
        // Simulate initialization time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoading(false);
        logger.info('App initialized successfully', undefined, 'App');
      } catch (error) {
        logger.error('App initialization failed', error, 'App');
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      initializeApp();
    }
  }, [authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" message="Initializing CoreV2..." />
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <SessionProvider>
              <div className="app">
                <Helmet>
                  <title>CoreV2 - Mental Health Support Platform</title>
                  <meta name="description" content="A comprehensive mental health support platform providing AI-powered assistance, crisis intervention, and peer support." />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <meta name="theme-color" content="#2563eb" />
                </Helmet>

                {/* PWA Components */}
                <PWAInstallBanner />
                <ServiceWorkerUpdate />

                {/* Navigation */}
                <Navigation />

                {/* Main Content */}
                <main className="main-content">
                  <Suspense fallback={<LoadingSpinner message="Loading..." />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<LandingView />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/help" element={<HelpView />} />
                      <Route path="/crisis" element={<CrisisView />} />

                      {/* Protected Routes */}
                      {user ? (
                        <>
                          <Route path="/dashboard" element={<DashboardView />} />
                          <Route path="/profile" element={<ProfileView />} />
                          <Route path="/settings" element={<SettingsView />} />
                          <Route path="/ai-chat" element={<AIChatView />} />
                          <Route path="/community" element={<CommunityView />} />
                          <Route path="/wellness" element={<WellnessView />} />
                          <Route path="/assessments" element={<AssessmentsView />} />
                          <Route path="/reflections" element={<ReflectionsView />} />
                          <Route path="/tether" element={<TetherView />} />
                          <Route path="/professional" element={<ProfessionalView />} />
                        </>
                      ) : (
                        <Route path="*" element={<Navigate to="/auth" replace />} />
                      )}

                      {/* Catch-all redirect */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>

                {/* Footer */}
                <Footer />

                {/* Mobile-specific overlays */}
                {isMobile && (
                  <div className="mobile-overlay" aria-hidden="true" />
                )}
              </div>
            </SessionProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;