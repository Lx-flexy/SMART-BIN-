import { useState } from 'react';

const tasksData = [
  { id: 1, type: 'collection', title: 'Morning Collection - Zone A', description: 'Collect waste from all bins in Zone A', zone: 'Zone A', assignee: 'John Smith', vehicle: 'TRK-001', status: 'in_progress', priority: 'high', scheduledTime: '08:00 AM', bins: 12 },
  { id: 2, type: 'collection', title: 'Morning Collection - Zone B', description: 'Collect waste from all bins in Zone B', zone: 'Zone B', assignee: 'Mike Johnson', vehicle: 'TRK-002', status: 'scheduled', priority: 'medium', scheduledTime: '09:30 AM', bins: 15 },
  { id: 3, type: 'maintenance', title: 'Sensor Replacement', description: 'Replace faulty sensor in BIN-2345', zone: 'Zone D', assignee: 'Tom Brown', vehicle: null, status: 'scheduled', priority: 'high', scheduledTime: '11:00 AM', bins: 1 },
  { id: 4, type: 'collection', title: 'Afternoon Collection - Zone C', description: 'Collect waste from high-priority bins', zone: 'Zone C', assignee: 'Sarah Wilson', vehicle: 'TRK-003', status: 'scheduled', priority: 'medium', scheduledTime: '02:00 PM', bins: 8 },
  { id: 5, type: 'inspection', title: 'Weekly Inspection', description: 'Inspect all bins in Zone A for damage', zone: 'Zone A', assignee: 'John Smith', vehicle: null, status: 'completed', priority: 'low', scheduledTime: '04:00 PM', bins: 12 },
  { id: 6, type: 'collection', title: 'Emergency Collection', description: 'Urgent collection for overflowing bins', zone: 'Zone A', assignee: 'Mike Johnson', vehicle: 'TRK-001', status: 'completed', priority: 'critical', scheduledTime: '07:00 AM', bins: 3 }
];

function Tasks() {
  const [tasks] = useState(tasksData);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filter === 'all' || task.status === filter;
    const matchesType = typeFilter === 'all' || task.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      case 'scheduled': return 'badge-empty';
      default: return 'badge-offline';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-empty';
      default: return 'badge-offline';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'collection':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>;
      case 'maintenance':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
      default:
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
    }
  };

  const scheduledCount = tasks.filter(t => t.status === 'scheduled').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Task Management</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Manage collections, maintenance, and inspections</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Task
        </button>
      </div>

      {/* Stats */}
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
          <div className="stat-value" style={{ color: 'var(--success)' }}>{tasks.filter(t => t.status === 'completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Filters */}
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

      {/* Tasks List */}
      <div className="card">
        {filteredTasks.length > 0 ? (
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
                {filteredTasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          {getTypeIcon(task.type)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{task.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{task.bins} bins</div>
                        </div>
                      </div>
                    </td>
                    <td>{task.zone}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                        {task.assignee}
                      </div>
                    </td>
                    <td>{task.scheduledTime}</td>
                    <td><span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span></td>
                    <td><span className={`badge ${getStatusBadge(task.status)}`}>{task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></td>
                    <td>
                      <button className="btn btn-sm btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
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

      {/* Create Task Modal */}
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
                <label className="form-label">Task Type</label>
                <select className="form-select">
                  <option value="collection">Collection</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" placeholder="Task title" />
              </div>
              <div className="form-group">
                <label className="form-label">Zone</label>
                <select className="form-select">
                  <option>Zone A</option>
                  <option>Zone B</option>
                  <option>Zone C</option>
                  <option>Zone D</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select">
                  <option>John Smith</option>
                  <option>Mike Johnson</option>
                  <option>Sarah Wilson</option>
                  <option>Tom Brown</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
