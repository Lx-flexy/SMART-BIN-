import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trash2, Map, Bell, User } from 'lucide-react'

function BottomNav() {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/bins', icon: Trash2, label: 'Bins' },
    { path: '/map', icon: Map, label: 'Map' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
