import React, { Suspense, lazy, useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import PageBackground from './components/PageBackground';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import TutorPage from './pages/TutorPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import EnglishHubPage from './pages/EnglishHubPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { useOnboardingStore } from './store/onboardingStore';
import { useAuthStore } from './store/authStore';

const ExamPage = lazy(() => import('./pages/ExamPage'));
const DemoFeaturesPage = lazy(() => import('./pages/DemoFeaturesPage'));

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/auth';
  const { completed } = useOnboardingStore();
  const { checkAuth, isAuthenticated } = useAuthStore();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('auth') === 'success') {
      checkAuth().finally(() => {
        navigate('/', { replace: true });
      });
    }
  }, [location.search, checkAuth, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <PageBackground>
      {!isAuthPage && isAuthenticated && !completed && <OnboardingWizard />}
      {!isAuthPage && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}
      <Routes>
        <Route
          path="/auth"
          element={
            <AuthRedirect>
              <AuthPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor"
          element={
            <ProtectedRoute>
              <TutorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/english"
          element={
            <ProtectedRoute>
              <EnglishHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="pt-24 text-center text-slate-500">Đang tải...</div>}>
                <ExamPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/demo-features"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="pt-24 text-center text-slate-500">Đang tải...</div>}>
                <DemoFeaturesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          className: 'font-sans',
          style: {
            background: darkMode ? '#1e293b' : '#fff',
            color: darkMode ? '#f1f5f9' : '#0f172a',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      />
    </PageBackground>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
