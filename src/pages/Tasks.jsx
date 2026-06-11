import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { TASK_STATUS, TASK_STATUS_LABELS, ZONES, ROLES } from '../utils/constants';
import { formatDateTime, getRelativeTime } from '../utils/helpers';
import './Tasks.css';

const Tasks = () => {
  const {
    tasks,
    myTasks,
    statistics,
    loading,
    createTask,
    assignTask,
    startTask,
    completeTask,
    updateTask
  } = useTasks();
  const { userProfile } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    binName: '',
    zone: ZONES[0],
    priority: 'normal',
    description: ''
  });

  const isStaff = userProfile?.role === ROLES.COLLECTION_STAFF;
  const isAdmin = userProfile?.role === ROLES.SUPER_ADMIN || userProfile?.role === ROLES.MUNICIPAL_ADMIN;

  const displayTasks = isStaff ? myTasks : tasks;

  const filteredTasks = displayTasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesZone = filterZone === 'all' || task.zone === filterZone;
    return matchesStatus && matchesZone;
  });

  const handleStartTask = async (taskId) => {
    try {
      await startTask(taskId);
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await completeTask(taskId, 'Task completed successfully');
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const getTaskColor = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return 'warning';
      case TASK_STATUS.ASSIGNED: return 'info';
      case TASK_STATUS.IN_PROGRESS: return 'primary';
      case TASK_STATUS.COMPLETED: return 'success';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'normal': return 'info';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({
        binName: newTask.binName || 'Manual Collection',
        zone: newTask.zone,
        type: 'collection',
        priority: newTask.priority,
        description: newTask.description
      });
      setShowCreateModal(false);
      setNewTask({ binName: '', zone: ZONES[0], priority: 'normal', description: '' });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isStaff ? 'My Tasks' : 'Tasks'}</h1>
          <p className="page-subtitle">
            {isStaff ? 'View and complete assigned tasks' : 'Manage collection tasks and assignments'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Task
          </button>
        )}
      </div>

      <div className="tasks-stats">
        <div className="task-stat-item pending">
          <span className="task-stat-value">{statistics?.pending || 0}</span>
          <span className="task-stat-label">Pending</span>
        </div>
        <div className="task-stat-item assigned">
          <span className="task-stat-value">{statistics?.assigned || 0}</span>
          <span className="task-stat-label">Assigned</span>
        </div>
        <div className="task-stat-item progress">
          <span className="task-stat-value">{statistics?.inProgress || 0}</span>
          <span className="task-stat-label">In Progress</span>
        </div>
        <div className="task-stat-item completed">
          <span className="task-stat-value">{statistics?.completed || 0}</span>
          <span className="task-stat-label">Completed</span>
        </div>
        <div className="task-stat-item today">
          <span className="task-stat-value">{statistics?.completedToday || 0}</span>
          <span className="task-stat-label">Today</span>
        </div>
      </div>

      <div className="tasks-filters">
        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          {Object.keys(TASK_STATUS).map(key => (
            <option key={TASK_STATUS[key]} value={TASK_STATUS[key]}>
              {TASK_STATUS_LABELS[TASK_STATUS[key]]}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
        >
          <option value="all">All Zones</option>
          {ZONES.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3>No Tasks</h3>
          <p>No tasks match the selected filters</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map(task => (
            <div key={task.taskId} className={`task-card task-card-${task.status}`}>
              <div className="task-card-header">
                <div className="task-card-badges">
                  <span className={`badge badge-${getTaskColor(task.status)}`}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className={`badge badge-${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="task-card-id">{task.taskId}</div>
              </div>

              <div className="task-card-body">
                <h3 className="task-card-title">{task.binName}</h3>
                <div className="task-card-meta">
                  <div className="task-meta-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    <span>{task.zone}</span>
                  </div>
                  <div className="task-meta-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <span>{getRelativeTime(task.createdAt)}</span>
                  </div>
                </div>
                {task.assignedToName && (
                  <div className="task-assigned">
                    <span>Assigned to:</span>
                    <strong>{task.assignedToName}</strong>
                  </div>
                )}
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
              </div>

              <div className="task-card-footer">
                {task.status === TASK_STATUS.PENDING && isAdmin && (
                  <button className="btn btn-primary btn-sm">Assign Staff</button>
                )}
                {task.status === TASK_STATUS.ASSIGNED && isStaff && task.assignedTo === userProfile?.uid && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStartTask(task.taskId)}
                  >
                    Start Task
                  </button>
                )}
                {task.status === TASK_STATUS.IN_PROGRESS && isStaff && task.assignedTo === userProfile?.uid && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleCompleteTask(task.taskId)}
                  >
                    Complete
                  </button>
                )}
                <Link to={`/tasks/${task.taskId}`} className="btn btn-secondary btn-sm">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Task</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Bin/Location Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.binName}
                    onChange={(e) => setNewTask({...newTask, binName: e.target.value})}
                    placeholder="Enter bin or location name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zone</label>
                  <select
                    className="form-select"
                    value={newTask.zone}
                    onChange={(e) => setNewTask({...newTask, zone: e.target.value})}
                  >
                    {ZONES.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Task description..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
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
  );
};

export default Tasks;
