import { NavLink } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAlerts } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import './MobileNav.css';

const MobileNav = () => {
  const { unreadCount } = useNotifications();
  const { activeAlerts } = useAlerts();
  const { userProfile } = useAuth();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      )
    },
    {
      path: '/bins',
      label: 'Bins',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      )
    },
    {
      path: '/map',
      label: 'Map',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
        </svg>
      )
    },
    {
      path: '/alerts',
      label: 'Alerts',
      badge: activeAlerts.length > 0 ? activeAlerts.length : null,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )
    }
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'active' : ''}`
            }
            end={item.path === '/dashboard'}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="mobile-nav-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
