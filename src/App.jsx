import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Dance from './pages/Dance';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Finance from './pages/Finance';
import Events from './pages/Events';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import Gallery from './pages/Gallery';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/dance" element={<Dance />} />
                <Route path="/events" element={<Events />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/notifications" element={<Notifications />} />

                {/* Leader & Super Admin Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin', 'leader']} />}>
                  <Route path="/members" element={<Members />} />
                  <Route path="/income" element={<Income />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/finance" element={<Finance />} />
                </Route>

                {/* Super Admin Only Route */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
