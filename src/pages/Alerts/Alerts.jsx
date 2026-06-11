import { useState, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { database } from '../../config/firebase'
import { 
  Search, 
  AlertTriangle, 
  Battery, 
  WifiOff, 
  Trash2,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react'

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [filteredAlerts, setFilteredAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    const alertsRef = ref(database, 'Alerts')
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alertsData = snapshot.val()
        const alertsList = Object.entries(alertsData)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setAlerts(alertsList)
      } else {
        setAlerts([])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let result = alerts

    // Filter by tab (active/resolved)
    if (activeTab === 'active') {
      result = result.filter(alert => !alert.resolved)
    } else {
      result = result.filter(alert => alert.resolved)
    }

    if (searchTerm) {
      result = result.filter(alert => 
        alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.binId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter(alert => alert.type === typeFilter)
    }

    setFilteredAlerts(result)
  }, [alerts, searchTerm, typeFilter, activeTab])

  const handleAcknowledge = async (alertId) => {
    try {
      await update(ref(database, `Alerts/${alertId}`), {
        acknowledged: true,
        acknowledgedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const handleResolve = async (alertId) => {
    try {
      await update(ref(database, `Alerts/${alertId}`), {
        resolved: true,
        resolvedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'full_bin':
        return <Trash2 size={20} />
      case 'overflow':
        return <AlertTriangle size={20} />
      case 'low_battery':
        return <Battery size={20} />
      case 'offline':
        return <WifiOff size={20} />
      default:
        return <AlertTriangle size={20} />
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'full_bin':
      case 'overflow':
        return 'danger'
      case 'low_battery':
      case 'sensor_failure':
        return 'warning'
      default:
        return 'warning'
    }
  }

  const getAlertTypeBadge = (type) => {
    const labels = {
      full_bin: 'Full Bin',
      overflow: 'Overflow',
      low_battery: 'Low Battery',
      offline: 'Offline',
      sensor_failure: 'Sensor Failure'
    }
    return labels[type] || type
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hours ago`
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const activeCount = alerts.filter(a => !a.resolved).length
  const resolvedCount = alerts.filter(a => a.resolved).length

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: 300 }}>
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activeCount})
        </button>
        <button 
          className={`tab ${activeTab === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveTab('resolved')}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="search-input"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-select filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="full_bin">Full Bin</option>
          <option value="overflow">Overflow</option>
          <option value="low_battery">Low Battery</option>
          <option value="offline">Offline Device</option>
          <option value="sensor_failure">Sensor Failure</option>
        </select>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Type</th>
                  <th>Bin ID</th>
                  <th>Zone</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(alert => (
                  <tr key={alert.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div 
                          className={`alert-item-icon ${getAlertColor(alert.type)}`}
                          style={{ width: 36, height: 36 }}
                        >
                          {getAlertIcon(alert.type)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{alert.title || 'Alert'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                            {alert.message}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${getAlertColor(alert.type)}`}>
                        {getAlertTypeBadge(alert.type)}
                      </span>
                    </td>
                    <td>{alert.binId || 'N/A'}</td>
                    <td>{alert.zone || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)' }}>
                        <Clock size={14} />
                        {formatTime(alert.createdAt)}
                      </div>
                    </td>
                    <td>
                      {alert.resolved ? (
                        <span className="badge badge-success">Resolved</span>
                      ) : alert.acknowledged ? (
                        <span className="badge badge-warning">Acknowledged</span>
                      ) : (
                        <span className="badge badge-danger">New</span>
                      )}
                    </td>
                    <td>
                      {!alert.resolved && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {!alert.acknowledged && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </button>
                          )}
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleResolve(alert.id)}
                          >
                            <CheckCircle size={14} />
                            Resolve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <CheckCircle />
            <h3>{activeTab === 'active' ? 'No Active Alerts' : 'No Resolved Alerts'}</h3>
            <p>
              {activeTab === 'active' 
                ? 'All systems are running smoothly' 
                : 'No alerts have been resolved yet'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Alerts
