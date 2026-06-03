import { useState, useEffect } from 'react'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { database } from '../../config/firebase'
import { 
  Search, 
  Plus, 
  User,
  Mail,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react'

function Users() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'collection_staff',
    phone: '',
    zone: '',
    isActive: true
  })

  useEffect(() => {
    const usersRef = ref(database, 'Users')
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val()
        const usersList = Object.entries(usersData).map(([id, data]) => ({ id, ...data }))
        setUsers(usersList)
      } else {
        setUsers([])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let result = users

    if (searchTerm) {
      result = result.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(result)
  }, [users, searchTerm, roleFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const userData = {
      ...formData,
      updatedAt: new Date().toISOString()
    }

    try {
      if (editingUser) {
        await update(ref(database, `Users/${editingUser.id}`), userData)
      } else {
        userData.createdAt = new Date().toISOString()
        await push(ref(database, 'Users'), userData)
      }
      resetForm()
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'collection_staff',
      phone: user.phone || '',
      zone: user.zone || '',
      isActive: user.isActive !== false
    })
    setShowModal(true)
    setActiveMenu(null)
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await remove(ref(database, `Users/${userId}`))
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
    setActiveMenu(null)
  }

  const handleToggleActive = async (user) => {
    try {
      await update(ref(database, `Users/${user.id}`), {
        isActive: !user.isActive,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
    setActiveMenu(null)
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      role: 'collection_staff',
      phone: '',
      zone: '',
      isActive: true
    })
  }

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>Super Admin</span>,
      municipal_admin: <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>Municipal Admin</span>,
      collection_staff: <span className="badge badge-success">Collection Staff</span>
    }
    return badges[role] || <span className="badge">{role}</span>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    municipalAdmins: users.filter(u => u.role === 'municipal_admin').length,
    collectionStaff: users.filter(u => u.role === 'collection_staff').length,
    active: users.filter(u => u.isActive !== false).length
  }

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
            <div className="stat-icon green">
              <User size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
              <Shield size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.superAdmins + stats.municipalAdmins}</div>
          <div className="stat-label">Administrators</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <User size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.collectionStaff}</div>
          <div className="stat-label">Collection Staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Users</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="search-input"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-select filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="municipal_admin">Municipal Admin</option>
          <option value="collection_staff">Collection Staff</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600
                        }}>
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{user.name || 'Unknown'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{user.zone || 'All Zones'}</td>
                    <td>
                      {user.isActive !== false ? (
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-light)', fontSize: 13 }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td>
                      <div className="actions-menu">
                        <button 
                          className="btn btn-icon btn-secondary btn-sm"
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenu === user.id && (
                          <div className="actions-dropdown">
                            <button onClick={() => handleEdit(user)}>
                              <Edit size={16} /> Edit
                            </button>
                            <button onClick={() => handleToggleActive(user)}>
                              {user.isActive !== false ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              {user.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="danger" onClick={() => handleDelete(user.id)}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
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
            <User />
            <h3>No Users Found</h3>
            <p>
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first user to get started'}
            </p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              Add User
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button className="modal-close" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="collection_staff">Collection Staff</option>
                    <option value="municipal_admin">Municipal Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Zone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Zone A (leave empty for all zones)"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Active User</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
