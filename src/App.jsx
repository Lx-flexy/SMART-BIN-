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

function App() {
  return (
    <BrowserRouter>
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
}

export default App;
