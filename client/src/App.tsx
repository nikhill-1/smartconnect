import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AboutUsPage } from './pages/AboutUsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AcademicsPage } from './pages/AcademicsPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { PolytechnicPage } from './pages/PolytechnicPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  return (
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
      <Route path="/placements" element={<AdmissionsPage />} />
      <Route path="/placements.html" element={<AdmissionsPage />} />
      <Route path="/contact" element={<ContactUsPage />} />
      <Route path="/ContactUs.html" element={<ContactUsPage />} />
      <Route path="/polytechnic" element={<PolytechnicPage />} />
      <Route path="/polytechnic.html" element={<PolytechnicPage />} />

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
  );
};
