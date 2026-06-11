import { useState, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { database } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Bell, CheckCircle2, ArrowRightCircle, XCircle } from 'lucide-react'

function Notifications() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [view, setView] = useState('unread')

  useEffect(() => {
    const notificationsRef = ref(database, 'Notifications')
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notificationsData = snapshot.val()
        const notificationsList = Object.entries(notificationsData)
          .map(([id, data]) => ({ id, ...data }))
          .filter(item => !item.userId || item.userId === currentUser?.uid)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setNotifications(notificationsList)
      } else {
        setNotifications([])
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  const visibleNotifications = notifications.filter((notification) => {
    if (view === 'unread') return !notification.read
    if (view === 'read') return notification.read
    return true
  })

  const markRead = async (notificationId, value) => {
    await update(ref(database, `Notifications/${notificationId}`), {
      read: value,
      readAt: new Date().toISOString()
    })
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Notifications</h2>
          <p className="text-muted">Track alerts, task updates, and system events in real time.</p>
        </div>
      </div>

      <div className="tabs" style={{ maxWidth: 520, marginBottom: 20 }}>
        <button className={`tab ${view === 'unread' ? 'active' : ''}`} onClick={() => setView('unread')}>Unread</button>
        <button className={`tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>All</button>
        <button className={`tab ${view === 'read' ? 'active' : ''}`} onClick={() => setView('read')}>Read</button>
      </div>

      {visibleNotifications.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <Bell size={32} style={{ marginBottom: 12 }} />
          <p>No notifications in this section.</p>
        </div>
      ) : (
        visibleNotifications.map((notification) => (
          <div key={notification.id} className={`card notification-item ${notification.read ? '' : 'unread'}`} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div className="notification-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)' }}>
                  <Bell size={18} />
                </div>
                <div>
                  <h3 style={{ marginBottom: 6 }}>{notification.title || 'System Notification'}</h3>
                  <p style={{ margin: 0, color: 'var(--text-light)' }}>{notification.message}</p>
                  <small style={{ color: 'var(--text-light)', fontSize: 12 }}>{new Date(notification.createdAt).toLocaleString()}</small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!notification.read ? (
                  <button className="btn btn-secondary" onClick={() => markRead(notification.id, true)}>
                    <CheckCircle2 size={16} />
                    Mark Read
                  </button>
                ) : (
                  <button className="btn btn-outline" onClick={() => markRead(notification.id, false)}>
                    <XCircle size={16} />
                    Mark Unread
                  </button>
                )}
                {notification.taskId && (
                  <span className="badge badge-primary" style={{ whiteSpace: 'nowrap' }}>
                    Task Update
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={() => setView('all')}>
          <ArrowRightCircle size={16} style={{ marginRight: 8 }} />
          Show all notifications
        </button>
      </div>
    </div>
  )
}

export default Notifications
