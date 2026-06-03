import { useState, useEffect } from 'react'
import { ref, onValue, push, set, update } from 'firebase/database'
import { database } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'

function Tasks() {
  const { currentUser } = useAuth()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [bins, setBins] = useState([])
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'collection',
    binId: '',
    assignedTo: '',
    zone: '',
    priority: 'medium',
    notes: ''
  })

  useEffect(() => {
    const tasksRef = ref(database, 'Tasks')
    const usersRef = ref(database, 'Users')
    const binsRef = ref(database, 'Bins')

    const tasksUnsub = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setTasks(Object.entries(data).map(([id, task]) => ({ id, ...task })))
      } else {
        setTasks([])
      }
    })

    const usersUnsub = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setUsers(Object.entries(data).map(([uid, user]) => ({ uid, ...user })))
      } else {
        setUsers([])
      }
    })

    const binsUnsub = onValue(binsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setBins(Object.entries(data).map(([id, bin]) => ({ id, ...bin })))
      } else {
        setBins([])
      }
    })

    return () => {
      tasksUnsub()
      usersUnsub()
      binsUnsub()
    }
  }, [])

  const visibleTasks = currentUser?.userRole === 'collection_staff'
    ? tasks.filter((task) => task.assignedTo === currentUser.uid)
    : tasks.filter((task) => {
      const matchesStatus = filter === 'all' || task.status === filter
      const matchesType = typeFilter === 'all' || task.type === typeFilter
      return matchesStatus && matchesType
    })

  const scheduledCount = tasks.filter((task) => task.status === 'scheduled').length
  const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length
  const completedCount = tasks.filter((task) => task.status === 'completed').length

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'badge-success'
      case 'in_progress': return 'badge-warning'
      case 'scheduled': return 'badge-empty'
      default: return 'badge-offline'
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return 'badge-danger'
      case 'high': return 'badge-warning'
      case 'medium': return 'badge-empty'
      default: return 'badge-offline'
    }
  }

  const handleFormChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      zone: key === 'binId' ? bins.find((bin) => bin.id === value)?.zone || prev.zone : prev.zone
    }))
  }

  const createNotification = async (payload) => {
    const notificationRef = push(ref(database, 'Notifications'))
    await set(notificationRef, {
      ...payload,
      read: false,
      createdAt: new Date().toISOString()
    })
  }

  const handleCreateTask = async () => {
    if (!form.title.trim()) {
      return
    }

    const assignedUser = users.find((user) => user.uid === form.assignedTo)
    const taskRef = push(ref(database, 'Tasks'))
    const taskPayload = {
      title: form.title,
      type: form.type,
      binId: form.binId ? bins.find((bin) => bin.id === form.binId)?.binId || form.binId : '',
      binDbId: form.binId || '',
      zone: form.zone || 'Unassigned zone',
      priority: form.priority,
      status: form.assignedTo ? 'assigned' : 'pending',
      assignedTo: form.assignedTo,
      assignedToName: assignedUser?.name || '',
      notes: form.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    await set(taskRef, taskPayload)
    await createNotification({
      title: 'New Task Created',
      message: `Task "${taskPayload.title}" has been created${assignedUser ? ` and assigned to ${assignedUser.name}` : ''}.`,
      type: 'task',
      taskId: taskRef.key,
      userId: assignedUser?.uid || null,
      category: 'task'
    })

    setForm({
      title: '',
      type: 'collection',
      binId: '',
      assignedTo: '',
      zone: '',
      priority: 'medium',
      notes: ''
    })
    setShowModal(false)
  }

  const handleStatusUpdate = async (task, nextStatus) => {
    await update(ref(database, `Tasks/${task.id}`), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    })

    await createNotification({
      title: 'Task Updated',
      message: `Task "${task.title}" status changed to ${nextStatus.replace('_', ' ')}.`,
      type: 'task',
      taskId: task.id,
      userId: task.assignedTo || null,
      category: 'task'
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Task Management</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Manage collections, maintenance, and inspections with live assignment and tracking.</p>
        </div>
        {currentUser?.userRole !== 'collection_staff' ? (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create Task
          </button>
        ) : (
          <button className="btn btn-secondary" disabled>
            Create Task
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{inProgressCount}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{scheduledCount}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="search-bar">
        <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`tab ${filter === 'scheduled' ? 'active' : ''}`} onClick={() => setFilter('scheduled')}>Scheduled</button>
          <button className={`tab ${filter === 'in_progress' ? 'active' : ''}`} onClick={() => setFilter('in_progress')}>In Progress</button>
          <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
        </div>
        <select className="form-select filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="collection">Collection</option>
          <option value="maintenance">Maintenance</option>
          <option value="inspection">Inspection</option>
        </select>
      </div>

      <div className="card">
        {visibleTasks.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Zone</th>
                  <th>Assignee</th>
                  <th>Scheduled</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          {task.type?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{task.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{task.binId || 'No bin selected'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{task.zone || 'Unassigned'}</td>
                    <td>{task.assignedToName || 'Unassigned'}</td>
                    <td>{task.scheduledTime || '-'}</td>
                    <td><span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}</span></td>
                    <td><span className={`badge ${getStatusBadge(task.status)}`}>{task.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></td>
                    <td>
                      {task.status !== 'completed' ? (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleStatusUpdate(task, 'completed')}>Mark Complete</button>
                      ) : (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleStatusUpdate(task, 'in_progress')}>Reopen</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <h3>No Tasks Found</h3>
            <p>No tasks match your current filters</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Task</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" className="form-input" value={form.title} onChange={(e) => handleFormChange('title', e.target.value)} placeholder="Enter task title" />
              </div>
              <div className="form-group">
                <label className="form-label">Task Type</label>
                <select className="form-select" value={form.type} onChange={(e) => handleFormChange('type', e.target.value)}>
                  <option value="collection">Collection</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bin</label>
                <select className="form-select" value={form.binId} onChange={(e) => handleFormChange('binId', e.target.value)}>
                  <option value="">Select a bin</option>
                  {bins.map((bin) => (
                    <option key={bin.id} value={bin.id}>{bin.binId || bin.id} — {bin.zone || 'Unknown zone'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select" value={form.assignedTo} onChange={(e) => handleFormChange('assignedTo', e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.filter((user) => user.role === 'collection_staff').map((user) => (
                    <option key={user.uid} value={user.uid}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Zone</label>
                <input type="text" className="form-input" value={form.zone} onChange={(e) => handleFormChange('zone', e.target.value)} placeholder="Enter collection zone" />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={(e) => handleFormChange('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="Notes for the task" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
