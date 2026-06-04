import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public + Monitor (root)
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import MonitorDashboardPage from './pages/monitor/DashboardPage';

// Admin (/admin/*)
import AdminLoginPage from './pages/admin/LoginPage';
import AdminRegisterPage from './pages/admin/RegisterPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminAccountListPage from './pages/admin/AccountListPage';
import AdminAccountDetailPage from './pages/admin/AccountDetailPage';
import AdminBillListPage from './pages/admin/BillListPage';
import AdminBillStatsPage from './pages/admin/BillStatsPage';
import AdminNotificationPage from './pages/admin/NotificationPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import AdminConfigPage from './pages/admin/ConfigPage';

import AdminLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public + Monitor (root) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/monitor" element={<Navigate to="/monitor/dashboard" replace />} />
        <Route path="/monitor/dashboard" element={<MonitorDashboardPage />} />

        {/* Admin (/admin/*) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="accounts" element={<AdminAccountListPage />} />
          <Route path="accounts/:id" element={<AdminAccountDetailPage />} />
          <Route path="bills" element={<AdminBillListPage />} />
          <Route path="bills/stats" element={<AdminBillStatsPage />} />
          <Route path="notifications" element={<AdminNotificationPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="config" element={<AdminConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
