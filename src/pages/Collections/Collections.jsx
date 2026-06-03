import { useState, useEffect } from 'react'
import { ref, onValue, push, update } from 'firebase/database'
import { database } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  Truck, 
  User,
  MapPin,
  X,
  AlertTriangle
} from 'lucide-react'

function Collections() {
  const { userRole } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [users, setUsers] = useState([])
  const [bins, setBins] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('pending')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    binId: '',
    assignedTo: '',
    priority: 'medium',
    notes: ''
  })

  useEffect(() => {
    const tasksRef = ref(database, 'Tasks')
    const usersRef = ref(database, 'Users')
    const binsRef = ref(database, 'Bins')
    const alertsRef = ref(database, 'Alerts')

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData = snapshot.val()
        const tasksList = Object.entries(tasksData)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setTasks(tasksList)
      } else {
        setTasks([])
      }
      setLoading(false)
    })

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val()
        const usersList = Object.entries(usersData)
          .map(([id, data]) => ({ id, ...data }))
          .filter(user => user.role === 'collection_staff')
        setUsers(usersList)
      }
    })

    const unsubscribeBins = onValue(binsRef, (snapshot) => {
      if (snapshot.exists()) {
        const binsData = snapshot.val()
        const binsList = Object.entries(binsData).map(([id, data]) => ({ id, ...data }))
        setBins(binsList)
      }
    })

    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alertsData = snapshot.val()
        const alertsList = Object.entries(alertsData)
          .map(([id, data]) => ({ id, ...data }))
          .filter(alert => !alert.resolved && (alert.type === 'full_bin' || alert.type === 'overflow'))
        setAlerts(alertsList)
      }
    })

    return () => {
      unsubscribeTasks()
      unsubscribeUsers()
      unsubscribeBins()
      unsubscribeAlerts()
    }
  }, [])

  useEffect(() => {
    let result = tasks

    if (activeTab === 'pending') {
      result = result.filter(task => task.status === 'pending' || task.status === 'assigned')
    } else if (activeTab === 'in_progress') {
      result = result.filter(task => task.status === 'in_progress')
    } else {
      result = result.filter(task => task.status === 'completed')
    }

    if (searchTerm) {
      result = result.filter(task => 
        task.binId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTasks(result)
  }, [tasks, searchTerm, activeTab])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    
    const selectedBin = bins.find(b => b.id === formData.binId || b.binId === formData.binId)
    
    const taskData = {
      binId: selectedBin?.binId || formData.binId,
      binDbId: formData.binId,
      location: selectedBin?.location || '',
      zone: selectedBin?.zone || '',
      assignedTo: formData.assignedTo,
      assignedToName: users.find(u => u.id === formData.assignedTo)?.name || '',
      priority: formData.priority,
      notes: formData.notes,
      status: formData.assignedTo ? 'assigned' : 'pending',
      createdAt: new Date().toISOString()
    }

    try {
      await push(ref(database, 'Tasks'), taskData)
      setShowModal(false)
      setFormData({ binId: '', assignedTo: '', priority: 'medium', notes: '' })
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const updates = {
        status: newStatus
      }
      
      if (newStatus === 'completed') {
        updates.completedAt = new Date().toISOString()
        
        // Reset bin fill level
        const task = tasks.find(t => t.id === taskId)
        if (task?.binDbId) {
          await update(ref(database, `Bins/${task.binDbId}`), {
            fillLevel: 0,
            lastUpdate: new Date().toISOString()
          })
        }
      } else if (newStatus === 'in_progress') {
        updates.startedAt = new Date().toISOString()
      }
      
      await update(ref(database, `Tasks/${taskId}`), updates)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--danger)'
      case 'medium': return 'var(--warning)'
      case 'low': return 'var(--success)'
      default: return 'var(--text-light)'
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge badge-warning">Pending</span>,
      assigned: <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>Assigned</span>,
      in_progress: <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>In Progress</span>,
      completed: <span className="badge badge-success">Completed</span>
    }
    return badges[status] || badges.pending
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const pendingCount = tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const completedCount = tasks.filter(t => t.status === 'completed').length

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon yellow">
              <Clock size={24} />
            </div>
          </div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <Truck size={24} />
            </div>
          </div>
          <div className="stat-value">{inProgressCount}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">Completed Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon red">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="stat-value">{alerts.length}</div>
          <div className="stat-label">Pending Alerts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: 400 }}>
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button 
          className={`tab ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          In Progress ({inProgressCount})
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {(userRole === 'super_admin' || userRole === 'municipal_admin') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Create Task
          </button>
        )}
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{task.binId || 'N/A'}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} />
                          {task.location || 'Unknown Location'}
                        </div>
                      </div>
                    </td>
                    <td>
                      {task.assignedToName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            {task.assignedToName.charAt(0)}
                          </div>
                          {task.assignedToName}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div 
                          style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: getPriorityColor(task.priority) 
                          }} 
                        />
                        {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                      </div>
                    </td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-light)' }}>
                      {formatTime(task.createdAt)}
                    </td>
                    <td>
                      {task.status === 'pending' || task.status === 'assigned' ? (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                        >
                          Start
                        </button>
                      ) : task.status === 'in_progress' ? (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(task.id, 'completed')}
                        >
                          <CheckCircle size={14} />
                          Complete
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: 13 }}>
                          ✓ Done
                        </span>
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
            <Truck />
            <h3>No Tasks Found</h3>
            <p>
              {activeTab === 'pending' ? 'No pending tasks at the moment' :
               activeTab === 'in_progress' ? 'No tasks currently in progress' :
               'No completed tasks yet'}
            </p>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Collection Task</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Bin</label>
                  <select
                    className="form-select"
                    value={formData.binId}
                    onChange={(e) => setFormData({ ...formData, binId: e.target.value })}
                    required
                  >
                    <option value="">Select a bin...</option>
                    {bins.filter(b => b.fillLevel >= 80).map(bin => (
                      <option key={bin.id} value={bin.id}>
                        {bin.binId || 'BIN-' + bin.id.slice(-4)} - {bin.location} ({bin.fillLevel}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-select"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  >
                    <option value="">Leave unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Add any notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Collections
