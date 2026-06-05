import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import PageBackground from './components/PageBackground';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import HomePage from './pages/HomePage';
import TutorPage from './pages/TutorPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import EnglishHubPage from './pages/EnglishHubPage';
import { useOnboardingStore } from './store/onboardingStore';

const ExamPage = React.lazy(() => import('./pages/ExamPage'));

const queryClient = new QueryClient();

function App() {
  const { completed } = useOnboardingStore();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <PageBackground>
          {!completed && <OnboardingWizard />}
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/english" element={<EnglishHubPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/exam"
              element={
                <Suspense fallback={<div className="pt-24 text-center text-slate-500">Đang tải...</div>}>
                  <ExamPage />
                </Suspense>
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
      </Router>
    </QueryClientProvider>
  );
}

export default App;
