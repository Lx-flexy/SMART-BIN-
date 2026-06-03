import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { database } from '../../config/firebase'

function Dashboard() {
  const [bins, setBins] = useState([])
  const [tasks, setTasks] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    const binsRef = ref(database, 'Bins')
    const tasksRef = ref(database, 'Tasks')
    const alertsRef = ref(database, 'Alerts')

    const unsubscribeBins = onValue(binsRef, (snapshot) => {
      if (snapshot.exists()) {
        const binsData = snapshot.val()
        const binsList = Object.entries(binsData).map(([id, data]) => ({ id, ...data }))
        setBins(binsList)
      } else {
        setBins([])
      }
      setLoading(false)
    })

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData = snapshot.val()
        const tasksList = Object.entries(tasksData).map(([id, data]) => ({ id, ...data }))
        setTasks(tasksList)
      } else {
        setTasks([])
      }
    })

    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alertsData = snapshot.val()
        const alertsList = Object.entries(alertsData).map(([id, data]) => ({ id, ...data }))
        setAlerts(alertsList)
      } else {
        setAlerts([])
      }
    })

    return () => {
      unsubscribeBins()
      unsubscribeTasks()
      unsubscribeAlerts()
    }
  }, [])

  const totalBins = bins.length
  const fullBins = bins.filter((bin) => bin.fillLevel >= 80).length
  const emptyBins = bins.filter((bin) => bin.fillLevel < 30 && bin.status !== 'offline').length
  const activeAlerts = alerts.filter((alert) => !alert.resolved).length

  const getLabels = () => {
    if (timeRange === 'today') {
      return ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM', '12AM']
    }
    if (timeRange === 'month') {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }

  const getLabelForTask = (date) => {
    if (!date) return ''
    const value = new Date(date)

    if (timeRange === 'today') {
      const hour = value.getHours()
      if (hour < 4) return '12AM'
      if (hour < 8) return '4AM'
      if (hour < 12) return '8AM'
      if (hour < 16) return '12PM'
      if (hour < 20) return '4PM'
      return '8PM'
    }

    if (timeRange === 'month') {
      const weekOfMonth = Math.ceil(value.getDate() / 7)
      return `Week ${weekOfMonth}`
    }

    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value.getDay()]
  }

  const collectionData = {
    labels: getLabels(),
    values: getLabels().map((label) => tasks.filter((task) => {
      const labelForTask = getLabelForTask(task.completedAt || task.createdAt)
      return labelForTask === label
    }).length)
  }

  const statusData = {
    empty: bins.filter((bin) => bin.fillLevel < 30 && bin.status !== 'offline').length,
    medium: bins.filter((bin) => bin.fillLevel >= 30 && bin.fillLevel < 80 && bin.status !== 'offline').length,
    full: bins.filter((bin) => bin.fillLevel >= 80 && bin.status !== 'offline').length,
    offline: bins.filter((bin) => bin.status === 'offline').length
  }

  const recentAlerts = alerts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)

  const getAlertColor = (type) => {
    switch (type) {
      case 'full_bin':
      case 'overflow':
        return { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }
      case 'low_battery':
      case 'sensor_failure':
        return { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }
      default:
        return { background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }
    }
  }

  const getAlertTitle = (alert) => {
    if (alert.title) return alert.title
    if (alert.type === 'full_bin') return 'Full Bin Alert'
    if (alert.type === 'overflow') return 'Overflow Alert'
    return 'New Alert'
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Welcome back! Here&apos;s your waste management overview.</p>
        </div>
        <select className="form-select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ minWidth: 150 }}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            <span className="stat-change positive">+5%</span>
          </div>
          <div className="stat-value">{totalBins.toLocaleString()}</div>
          <div className="stat-label">Total Bins</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span className="stat-change negative">-12%</span>
          </div>
          <div className="stat-value">{fullBins}</div>
          <div className="stat-label">Full Bins</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <span className="stat-change positive">+8%</span>
          </div>
          <div className="stat-value">{emptyBins.toLocaleString()}</div>
          <div className="stat-label">Empty Bins</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon yellow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
          </div>
          <div className="stat-value">{activeAlerts}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Collection Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Collection Summary</h3>
            <Link to="/analytics" className="btn btn-sm btn-secondary">View Details</Link>
          </div>
          <div className="card-body">
            <div style={{ height: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, padding: '0 8px' }}>
              {collectionData.labels.map((label, i) => {
                const value = collectionData.values[i] || 0
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: '100%', maxWidth: 40, height: `${Math.max(value, 10) * 2}px`, background: 'linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: 4 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bin Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Bin Status Distribution</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ width: 180, height: 180, borderRadius: '50%', background: `conic-gradient(var(--success) 0deg ${statusData.empty * 1.8}deg, var(--warning) ${statusData.empty * 1.8}deg ${statusData.empty * 1.8 + statusData.medium * 1.8}deg, var(--danger) ${statusData.empty * 1.8 + statusData.medium * 1.8}deg ${statusData.empty * 1.8 + statusData.medium * 1.8 + statusData.full * 1.8}deg, var(--text-light) ${statusData.empty * 1.8 + statusData.medium * 1.8 + statusData.full * 1.8}deg 360deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{totalBins || 0}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Total</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { label: 'Empty (<30%)', value: statusData.empty, color: 'var(--success)' },
                { label: 'Medium (30-80%)', value: statusData.medium, color: 'var(--warning)' },
                { label: 'Full (>80%)', value: statusData.full, color: 'var(--danger)' },
                { label: 'Offline', value: statusData.offline, color: 'var(--text-light)' }
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color }} />
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{item.label}</span>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Alerts</h3>
            <Link to="/alerts" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="notification-item">
                  <div className="notification-icon" style={getAlertColor(alert.type)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <div className="notification-content">
                    <h4>{getAlertTitle(alert)}</h4>
                    <p>{alert.message}</p>
                  </div>
                  <span className="notification-time">{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 24, textAlign: 'center' }}>
                <p>No recent alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="quick-actions" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Link to="/bins" className="quick-action-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <span>Add Bin</span>
              </Link>
              <Link to="/map" className="quick-action-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                <span>Live Map</span>
              </Link>
              <Link to="/analytics" className="quick-action-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>Analytics</span>
              </Link>
              <Link to="/reports" className="quick-action-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
