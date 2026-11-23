import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';

// Layouts & Navbars
import { CandidateNavbar } from './components/candidate/CandidateNavbar.js';
import { HrSidebar } from './components/hr/HrSidebar.js';
import { HrNavbar } from './components/hr/HrNavbar.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';

// Candidate Pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard.js';
import { JobsPage } from './pages/candidate/JobsPage.js';
import { JobDetailPage } from './pages/candidate/JobDetailPage.js';
import { MyApplicationsPage } from './pages/candidate/MyApplicationsPage.js';
import { CvBuilderPage } from './pages/candidate/CvBuilderPage.js';
import { ProfilePage } from './pages/candidate/ProfilePage.js';

// HR Pages
import { HrDashboard } from './pages/hr/HrDashboard.js';
import { HrJobsPage } from './pages/hr/HrJobsPage.js';
import { HrApplicationsPage } from './pages/hr/HrApplicationsPage.js';
import { ApplicationDetailPage } from './pages/hr/ApplicationDetailPage.js';
import { AiStudioPage } from './pages/hr/AiStudioPage.js';
import { TalentPoolPage } from './pages/hr/TalentPoolPage.js';
import { InterviewsCalendarPage } from './pages/hr/InterviewsCalendarPage.js';
import { UsersRbacPage } from './pages/hr/UsersRbacPage.js';

// Candidate Protected Route Guard
const CandidateProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isHR, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#004b82] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strict RBAC: Admin / HR must NOT access Candidate personal space!
  if (isHR) {
    return <Navigate to="/hr/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  return <>{children}</>;
};

// Layout Wrappers
const CandidateLayout: React.FC = () => {
  const { isHR, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#004b82] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strict RBAC: Admin / HR must NOT access Candidate pages!
  if (isHR) {
    return <Navigate to="/hr/dashboard" replace />;
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      <CandidateNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 mobile-touch-scroll">
        <ErrorBoundary fallbackTitle="Erreur dans l'espace candidat">
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t border-[#e2e5e7] py-6 px-4 text-center text-xs text-[#868889] bg-white">
        <p>© 2026 SmartRecruit ATS – Plateforme professionnelle de recrutement intelligent.</p>
      </footer>
    </div>
  );
};

const HrLayout: React.FC = () => {
  const { user, isHR, isLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#004b82] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#868889] font-bold">Vérification des autorisations RH...</p>
        </div>
      </div>
    );
  }

  // Security check: Redirect to login if unauthenticated
  if (!user) {
    return <Navigate to="/login" state={{ returnUrl: '/hr/dashboard' }} replace />;
  }

  // Strict RBAC: Candidates must NOT access HR portal!
  if (!isHR) {
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gray-50 flex font-sans overflow-x-hidden">
      <HrSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 max-h-screen max-h-dvh overflow-hidden">
        <HrNavbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto mobile-touch-scroll">
          <ErrorBoundary fallbackTitle="Erreur dans le portail RH">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

// Root Router Redirector
const RootRedirect: React.FC = () => {
  const { user, isHR, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isHR) return <Navigate to="/hr/dashboard" replace />;
  return <Navigate to="/candidate/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="SmartRecruit ATS – Plateforme de Recrutement ESTC">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Main Portal Entry & Auth */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Candidate Portal */}
            <Route path="/candidate" element={<CandidateLayout />}>
              <Route index element={<Navigate to="/candidate/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <CandidateProtectedRoute>
                    <CandidateDashboard />
                  </CandidateProtectedRoute>
                }
              />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/:idOrSlug" element={<JobDetailPage />} />
              <Route
                path="applications"
                element={
                  <CandidateProtectedRoute>
                    <MyApplicationsPage />
                  </CandidateProtectedRoute>
                }
              />
              <Route
                path="cv-builder"
                element={
                  <CandidateProtectedRoute>
                    <CvBuilderPage />
                  </CandidateProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <CandidateProtectedRoute>
                    <ProfilePage />
                  </CandidateProtectedRoute>
                }
              />
            </Route>

            {/* HR Management Portal (RBAC Protected) */}
            <Route path="/hr" element={<HrLayout />}>
              <Route index element={<Navigate to="/hr/dashboard" replace />} />
              <Route path="dashboard" element={<HrDashboard />} />
              <Route path="jobs" element={<HrJobsPage />} />
              <Route path="applications" element={<HrApplicationsPage />} />
              <Route path="applications/:id" element={<ApplicationDetailPage />} />
              <Route path="ai-agent" element={<AiStudioPage />} />
              <Route path="ai-studio" element={<AiStudioPage />} />
              <Route path="talent-pool" element={<TalentPoolPage />} />
              <Route path="interviews" element={<InterviewsCalendarPage />} />
              <Route path="users" element={<UsersRbacPage />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
