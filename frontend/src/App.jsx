import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { FocusMoodOverlay } from './components/layout/FocusMoodOverlay';

// Pages
import DashboardPage from './pages/DashboardPage';
import PlanPage from './pages/PlanPage';
import TasksPage from './pages/TasksPage';
import SubjectsPage from './pages/SubjectsPage';
import FocusRoomPage from './pages/FocusRoomPage';
import QuizzesPage from './pages/QuizzesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-peach-100 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Derive title from pathname
  const path = location.pathname;
  let pageTitle = 'Overview';
  if (path === '/plan') pageTitle = 'My Plan';
  else if (path === '/tasks') pageTitle = 'Tasks & Assignments';
  else if (path === '/subjects') pageTitle = 'Subjects & Syllabus';
  else if (path === '/focus') pageTitle = 'Pomodoro Focus Room';
  else if (path === '/quizzes') pageTitle = 'Quizzes & Diagnostics';
  else if (path === '/analytics') pageTitle = 'Productivity Analytics';
  else if (path === '/settings') pageTitle = 'Settings & Profile';

  return (
    <div className="min-h-screen bg-peach-100 flex p-2.5 sm:p-4 md:p-6 gap-4 md:gap-6 max-w-[1700px] mx-auto pb-20 md:pb-6">
      {/* Floating Rounded Coral/Orange Sidebar (Desktop / Tablet) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={pageTitle}
          onToggleMobileMenu={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/focus" element={<FocusRoomPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Bar & Slide-Over Drawer Navigation */}
      <MobileNav
        isDrawerOpen={isMobileDrawerOpen}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* Zen Focus Mood Overlay */}
      <FocusMoodOverlay />
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
