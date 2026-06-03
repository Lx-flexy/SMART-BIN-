import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../config/firebase'
import { User, Mail, Phone, MapPin, Edit3, Save } from 'lucide-react'

function Profile() {
  const { currentUser, updateUserProfile } = useAuth()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    zone: '',
    photoURL: ''
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    setForm({
      name: currentUser.name || '',
      phone: currentUser.phone || '',
      zone: currentUser.zone || '',
      photoURL: currentUser.photoURL || ''
    })
  }, [currentUser])

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setForm((prev) => ({ ...prev, photoURL: URL.createObjectURL(file) }))
    }
  }

  const uploadPhoto = async () => {
    if (!photoFile || !currentUser) return form.photoURL
    const storageReference = storageRef(storage, `profileImages/${currentUser.uid}/${photoFile.name}`)
    await uploadBytes(storageReference, photoFile)
    return await getDownloadURL(storageReference)
  }

  const handleSave = async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      const photoURL = photoFile ? await uploadPhoto() : form.photoURL
      await updateUserProfile({
        name: form.name,
        phone: form.phone,
        zone: form.zone,
        photoURL
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Profile update failed:', error)
    } finally {
      setSaving(false)
    }
  }

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
      <div className="card" style={{ display: 'grid', gap: 24, padding: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: 'var(--background)', display: 'grid', placeItems: 'center' }}>
              {form.photoURL ? (
                <img src={form.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-light)' }}>
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{form.name || currentUser.email}</h2>
              <div style={{ color: 'var(--text-light)', marginTop: 6 }}>
                <Mail size={14} style={{ marginRight: 8 }} /> {currentUser.email}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Edit3 size={14} style={{ marginRight: 8 }} /> Change Photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} style={{ marginRight: 8 }} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {saved && (
          <div className="alert alert-success" style={{ padding: '12px 16px' }}>
            Profile updated successfully.
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Profile Settings</h3>
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="text" className="form-input" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Zone</label>
            <input type="text" className="form-input" value={form.zone} onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={18} />
              <span>{currentUser.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={18} />
              <span>{currentUser.phone || 'Phone not set'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} />
              <span>{currentUser.zone || 'Zone not set'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
