import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AboutUsPage } from './pages/AboutUsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AcademicsPage } from './pages/AcademicsPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { PlacementsPage } from './pages/PlacementsPage';
import { NoticesPage } from './pages/NoticesPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { PolytechnicPage } from './pages/PolytechnicPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { FloatingChatWidget } from './components/FloatingChatWidget';

export const App: React.FC = () => {
  const location = useLocation();
  const isDedicatedChatPage = location.pathname.startsWith('/chatbot');

  return (
    <>
      <Routes>
        {/* Public Pages preserving exact HTML URL compatibility */}
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />
        <Route path="/aboutus" element={<AboutUsPage />} />
        <Route path="/aboutus.html" element={<AboutUsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments.html" element={<DepartmentsPage />} />
        <Route path="/academics" element={<AcademicsPage />} />
        <Route path="/academics.html" element={<AcademicsPage />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        <Route path="/facilities.html" element={<FacilitiesPage />} />
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/admissions.html" element={<AdmissionsPage />} />
        <Route path="/placements" element={<PlacementsPage />} />
        <Route path="/placements.html" element={<PlacementsPage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices.html" element={<NoticesPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/ContactUs.html" element={<ContactUsPage />} />
        <Route path="/polytechnic" element={<PolytechnicPage />} />
        <Route path="/polytechnic.html" element={<PolytechnicPage />} />

        {/* Student Portal & Academics */}
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />

        {/* RAG Public AI Chatbot */}
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/chatbot.html" element={<ChatbotPage />} />

        {/* Admin Authentication & Secured Dashboard */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin.html" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/chatbotadmin.html" element={<AdminDashboardPage />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating AI Chat Assistant available on all pages except full-page chat */}
      {!isDedicatedChatPage && <FloatingChatWidget />}
    </>
  );
};
