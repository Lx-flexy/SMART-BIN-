import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Trash2, 
  Bell, 
  Map, 
  Truck, 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Recycle
} from 'lucide-react'

function Sidebar({ isOpen, onClose }) {
  const { currentUser, userRole, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/bins', icon: Trash2, label: 'Bins' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/map', icon: Map, label: 'Live Map' },
    { path: '/collections', icon: Truck, label: 'Collections' },
  ]

  const analyticsNavItems = [
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ]

  const adminNavItems = [
    { path: '/users', icon: Users, label: 'Users', roles: ['super_admin'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin', 'municipal_admin'] },
  ]

  const filteredAdminItems = adminNavItems.filter(
    item => !item.roles || item.roles.includes(userRole)
  )

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ 
          width: 40, 
          height: 40, 
          background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Recycle size={24} color="white" />
        </div>
        <div>
          <h1>A5X SWMS</h1>
          <span>Smart Waste Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main Menu</div>
          {mainNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Analytics</div>
          {analyticsNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </div>

        {filteredAdminItems.length > 0 && (
          <div className="nav-section">
            <div className="nav-section-title">Administration</div>
            {filteredAdminItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <item.icon />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <h4>{currentUser?.name || 'User'}</h4>
              <span>{userRole ? userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}</span>
          </div>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: 12 }}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
