import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BinProvider } from './contexts/BinContext';
import { AlertProvider } from './contexts/AlertContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/common';
import { Layout } from './components/layout';
import { ROLES } from './utils/constants';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Bins from './pages/Bins';
import Alerts from './pages/Alerts';
import Tasks from './pages/Tasks';
import Map from './pages/Map';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

import './styles/index.css';
import './pages/auth.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BinProvider>
          <AlertProvider>
            <TaskProvider>
              <NotificationProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/bins" element={<Bins />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/map" element={<Map />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />

                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                          <Users />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </NotificationProvider>
            </TaskProvider>
          </AlertProvider>
        </BinProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
