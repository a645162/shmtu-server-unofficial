import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountListPage from './pages/AccountListPage';
import AccountDetailPage from './pages/AccountDetailPage';
import BillListPage from './pages/BillListPage';
import BillStatsPage from './pages/BillStatsPage';
import NotificationPage from './pages/NotificationPage';
import SettingsPage from './pages/SettingsPage';
import ConfigPage from './pages/ConfigPage';

const App: React.FC = () => {
  return (
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="accounts" element={<AccountListPage />} />
            <Route path="accounts/:id" element={<AccountDetailPage />} />
            <Route path="bills" element={<BillListPage />} />
            <Route path="bills/stats" element={<BillStatsPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin/config" element={<ConfigPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  );
};

export default App;
