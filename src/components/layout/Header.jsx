import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { database } from '../../config/firebase'
import { Menu, Bell, User, AlertTriangle, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function Header({ title, onMenuClick }) {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)

  useEffect(() => {
    const notificationsRef = ref(database, 'Notifications')
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notificationsData = snapshot.val()
        const notificationsList = Object.entries(notificationsData)
          .map(([id, data]) => ({ id, ...data }))
          .filter((notification) => {
            return !notification.read && (!notification.userId || notification.userId === currentUser?.uid)
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
        setNotifications(notificationsList)
      } else {
        setNotifications([])
      }
    })
    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'full_bin':
        return <Trash2 size={18} />
      case 'overflow':
        return <AlertTriangle size={18} />
      default:
        return <Bell size={18} />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'full_bin':
      case 'overflow':
        return 'var(--danger)'
      case 'low_battery':
        return 'var(--warning)'
      default:
        return 'var(--primary)'
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-right">
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button 
            className="header-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={22} />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notifications-dropdown">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Notifications</h3>
              </div>
              {notifications.length > 0 ? (
                <>
                  {notifications.map(notification => (
                    <div key={notification.id} className="notification-item unread">
                      <div 
                        className="notification-icon"
                        style={{ 
                          background: `${getNotificationColor(notification.type)}15`,
                          color: getNotificationColor(notification.type)
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title || 'New Alert'}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Link 
                    to="/notifications" 
                    style={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      padding: '12px',
                      color: 'var(--primary)',
                      fontWeight: 500,
                      fontSize: 14
                    }}
                    onClick={() => setShowNotifications(false)}
                  >
                    View Notifications
                  </Link>
                </>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)' }}>
                  No new notifications
                </div>
              )}
            </div>
          )}
        </div>
        
        <Link to="/profile" className="header-btn">
          <User size={22} />
        </Link>
      </div>
    </header>
  )
}

export default Header
