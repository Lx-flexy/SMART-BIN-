import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Phone, MapPin } from 'lucide-react'

function Profile() {
  const { currentUser } = useAuth()
  const [editing] = useState(false)

  if (!currentUser) {
    return (
      <div className="card">
        <div className="empty-state">
          <User />
          <h3>Not signed in</h3>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700
          }}>
            {currentUser.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{currentUser.name || currentUser.email}</h2>
            <div style={{ color: 'var(--text-light)', marginTop: 6 }}>
              <Mail size={14} style={{ marginRight: 8 }} /> {currentUser.email}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Details</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <div>
            <strong>Role:</strong> {currentUser.role || 'N/A'}
          </div>
          <div>
            <strong>Phone:</strong> {currentUser.phone || 'N/A'}
          </div>
          <div>
            <strong>Zone:</strong> {currentUser.zone || 'All Zones'}
          </div>
          <div>
            <strong>Member since:</strong> {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
