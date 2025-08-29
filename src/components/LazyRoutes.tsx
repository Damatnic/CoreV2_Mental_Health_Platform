import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

// Lazy load all views
const LandingView = lazy(() => import('../views/LandingView'));
const AuthPage = lazy(() => import('../views/AuthPage'));
const DashboardView = lazy(() => import('../views/DashboardView'));
const JournalView = lazy(() => import('../views/JournalView'));
const MoodView = lazy(() => import('../views/MoodView'));
const SafetyPlanView = lazy(() => import('../views/SafetyPlanView'));
const CrisisView = lazy(() => import('../views/CrisisView'));
const HelpView = lazy(() => import('../views/HelpView'));
const SettingsView = lazy(() => import('../views/SettingsView'));
const ProfileView = lazy(() => import('../views/ProfileView'));
const AnalyticsView = lazy(() => import('../views/AnalyticsView'));
const CommunityView = lazy(() => import('../views/CommunityView'));

interface LazyRoutesProps {
  isAuthenticated?: boolean;
  userRole?: string;
}

const LazyRoutes: React.FC<LazyRoutesProps> = ({ 
  isAuthenticated = false,
  userRole = 'user'
}) => {
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
    return <>{children}</>;
  };

  const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated || userRole !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingView />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/crisis" element={<CrisisView />} />
        <Route path="/help" element={<HelpView />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <JournalView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mood"
          element={
            <ProtectedRoute>
              <MoodView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/safety-plan"
          element={
            <ProtectedRoute>
              <SafetyPlanView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityView />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/analytics"
          element={
            <AdminRoute>
              <AnalyticsView />
            </AdminRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default LazyRoutes;
