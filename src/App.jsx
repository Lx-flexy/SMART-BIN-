<<<<<<< HEAD
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
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import Dashboard from './pages/Dashboard/Dashboard'
import Bins from './pages/Bins/Bins'
import BinDetails from './pages/Bins/BinDetails'
import Alerts from './pages/Alerts/Alerts'
import LiveMap from './pages/LiveMap/LiveMap'
import Analytics from './pages/Insights/Insights'
import Reports from './pages/Reports/Reports'
import Collections from './pages/Collections/Collections'
import Tasks from './pages/Tasks/Tasks'
import Users from './pages/Users/Users'
import Settings from './pages/Settings/Settings'
import Profile from './pages/Profile/Profile.jsx'
import Notifications from './pages/Notifications/Notifications'
import { useAuth } from './contexts/AuthContext'
import './styles/index.css'

function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function RequireRole({ children, roles }) {
  const { userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!roles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
>>>>>>> bc7a63e11784e20ae2b9b0f1b42530b93978e951

function App() {
  return (
    <BrowserRouter>
<<<<<<< HEAD
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
=======
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

        {/* Main App Routes */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bins" element={<RequireRole roles={['super_admin', 'municipal_admin']}><Bins /></RequireRole>} />
          <Route path="bins/:id" element={<RequireRole roles={['super_admin', 'municipal_admin']}><BinDetails /></RequireRole>} />
          <Route path="alerts" element={<RequireRole roles={['super_admin', 'municipal_admin']}><Alerts /></RequireRole>} />
          <Route path="map" element={<LiveMap />} />
          <Route path="collections" element={<RequireRole roles={['super_admin', 'municipal_admin']}><Collections /></RequireRole>} />
          <Route path="analytics" element={<RequireRole roles={['super_admin', 'municipal_admin']}><Analytics /></RequireRole>} />
          <Route path="reports" element={<RequireRole roles={['super_admin', 'municipal_admin']}><Reports /></RequireRole>} />
          <Route path="tasks" element={<RequireRole roles={['super_admin', 'municipal_admin', 'collection_staff']}><Tasks /></RequireRole>} />
          <Route path="notifications" element={<RequireRole roles={['super_admin', 'municipal_admin', 'collection_staff']}><Notifications /></RequireRole>} />
          <Route path="users" element={<RequireRole roles={['super_admin']}><Users /></RequireRole>} />
          <Route path="settings" element={<RequireRole roles={['super_admin', 'municipal_admin']}><Settings /></RequireRole>} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
>>>>>>> bc7a63e11784e20ae2b9b0f1b42530b93978e951
}

export default App;
