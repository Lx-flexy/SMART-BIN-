import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { database } from '../../config/firebase'

function BinDetails() {
  const { id } = useParams()
  const [bin, setBin] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [tasks, setTasks] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const binRef = ref(database, `Bins/${id}`)
    const tasksRef = ref(database, 'Tasks')
    const alertsRef = ref(database, 'Alerts')

    const unsubscribeBin = onValue(binRef, (snapshot) => {
      setBin(snapshot.exists() ? { id, ...snapshot.val() } : null)
    })

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const taskList = Object.entries(snapshot.val()).map(([taskId, taskData]) => ({ id: taskId, ...taskData }))
          .filter((task) => task.binDbId === id || task.binId === id)
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        setTasks(taskList)
      } else {
        setTasks([])
      }
    })

    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alertList = Object.entries(snapshot.val()).map(([alertId, alertData]) => ({ id: alertId, ...alertData }))
          .filter((alert) => alert.binId === id || alert.binDetails?.id === id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setAlerts(alertList)
      } else {
        setAlerts([])
      }
    })

    return () => {
      unsubscribeBin()
      unsubscribeTasks()
      unsubscribeAlerts()
    }
  }, [id])

  const getFillLevelColor = (level) => {
    if (level >= 80) return 'red'
    if (level >= 50) return 'yellow'
    return 'green'
  }

  const getStatusLabel = (value) => {
    if (!value) return 'Unknown'
    return value.toString().replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (!bin) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/bins" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-light)', fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Bins
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>{bin.binId || bin.id}</h1>
              <span className="badge badge-success">{getStatusLabel(bin.status || bin.networkStatus || 'active')}</span>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>{bin.location || 'Location unknown'} • {bin.zone || 'Zone unavailable'}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary">Edit</button>
            <button className="btn btn-primary">Schedule Collection</button>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
          </div>
          <div className="stat-value">{bin.fillLevel ?? 'N/A'}%</div>
          <div className="stat-label">Fill Level</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className={`progress-fill ${getFillLevelColor(bin.fillLevel ?? 0)}`} style={{ width: `${bin.fillLevel ?? 0}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
            </div>
          </div>
          <div className="stat-value">{bin.temperature ?? 'N/A'}</div>
          <div className="stat-label">Temperature</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon yellow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M22 11h-4"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>
            </div>
          </div>
          <div className="stat-value">{bin.battery ?? 'N/A'}</div>
          <div className="stat-label">Battery</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
            </div>
          </div>
          <div className="stat-value">{bin.networkStatus || 'Online'}</div>
          <div className="stat-label">Network</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 0, marginTop: 24 }}>
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Collection History</button>
        <button className={`tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>Alerts</button>
        <button className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
      </div>

      <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {activeTab === 'overview' && (
          <div className="card-body">
            <div className="grid-2">
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Bin Information</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { label: 'Bin ID', value: bin.binId || bin.id },
                    { label: 'Location', value: bin.location || 'Unknown' },
                    { label: 'Address', value: bin.address || 'Unknown' },
                    { label: 'Zone', value: bin.zone || 'Unknown' },
                    { label: 'Type', value: bin.type || 'Unknown' },
                    { label: 'Capacity', value: bin.capacity || 'Unknown' },
                    { label: 'Last Updated', value: bin.updatedAt || bin.lastCollection || 'Unknown' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-light)', fontSize: 14 }}>{item.label}</span>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h3>
                <div className="card" style={{ background: 'var(--background)', marginBottom: 16 }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Last Collection</p>
                        <p style={{ fontWeight: 600 }}>{bin.lastCollection || 'No record'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Next Collection</p>
                        <p style={{ fontWeight: 600 }}>{bin.nextCollection || 'Not scheduled'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Location</h3>
                <div style={{ background: 'var(--background)', borderRadius: 8, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 8 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p style={{ fontSize: 14 }}>Map Preview</p>
                    <p style={{ fontSize: 12 }}>{bin.coordinates?.lat ?? 'N/A'}, {bin.coordinates?.lng ?? 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Task</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length > 0 ? tasks.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{item.title}</td>
                      <td><span className={`badge ${item.status === 'completed' ? 'badge-success' : item.status === 'in_progress' ? 'badge-warning' : 'badge-empty'}`}>{getStatusLabel(item.status)}</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 24 }}>No collection history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="card-body" style={{ padding: 0 }}>
            {alerts.length > 0 ? alerts.map((alert) => (
              <div key={alert.id} className="notification-item">
                <div className="notification-icon" style={{ background: alert.type === 'low_battery' ? 'rgba(245, 158, 11, 0.1)' : alert.type === 'offline' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: alert.type === 'low_battery' ? 'var(--warning)' : alert.type === 'offline' ? 'var(--text-light)' : 'var(--danger)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div className="notification-content">
                  <h4>{alert.title || alert.message}</h4>
                  <p style={{ margin: 0, color: 'var(--text-light)' }}>{alert.message}</p>
                  <span className="notification-time">{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
                <span className={`badge ${alert.resolved ? 'badge-success' : 'badge-warning'}`}>{alert.resolved ? 'Resolved' : 'Open'}</span>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center' }}>
                <h3>No alerts found</h3>
                <p>There are no alerts for this bin yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="card-body">
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <h3>No Maintenance Records</h3>
              <p>This bin has no maintenance history yet</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }}>Schedule Maintenance</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BinDetails
