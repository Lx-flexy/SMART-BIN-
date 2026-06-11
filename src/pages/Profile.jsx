import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ZONES } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Profile.css';

const Profile = () => {
  const { user, userProfile, updateProfile, loading } = useAuth();
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    zone: userProfile?.zone || ZONES[0]
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const storage = getStorage();
      const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);
      await updateProfile({ photoURL });
      setSuccess('Photo updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  const roleLabels = {
    'super_admin': 'Super Admin',
    'municipal_admin': 'Municipal Admin',
    'collection_staff': 'Collection Staff'
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      {success && (
        <div className="profile-alert success">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {success}
        </div>
      )}

      {error && (
        <div className="profile-alert error">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-photo-section">
            <div className="profile-photo">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.name} />
              ) : (
                <span className="photo-placeholder">{getInitials(userProfile?.name)}</span>
              )}
              {uploading && (
                <div className="photo-uploading">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <div className="profile-info">
            <h2>{userProfile?.name}</h2>
            <p className="profile-role">{roleLabels[userProfile?.role]}</p>
            <p className="profile-email">{userProfile?.email}</p>
            <p className="profile-zone">{userProfile?.zone}</p>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-value">{
                userProfile?.role === 'collection_staff' ? 'Active' : 'Admin'
              }</span>
              <span className="stat-label">Status</span>
            </div>
            <div className="profile-stat">
              <span className="stat-value">{
                userProfile?.role === 'collection_staff' ? userProfile?.zone : 'All Zones'
              }</span>
              <span className="stat-label">Zone</span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <h3 className="card-title">Personal Information</h3>
            {!editing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="profile-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={userProfile?.email}
                    disabled
                  />
                  <span className="form-hint">Email cannot be changed</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zone</label>
                  <select
                    className="form-select"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                  >
                    {ZONES.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-input"
                    value={roleLabels[userProfile?.role]}
                    disabled
                  />
                  <span className="form-hint">Role can only be changed by admin</span>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-row">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{userProfile?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{userProfile?.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{userProfile?.phone || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Zone</span>
                <span className="detail-value">{userProfile?.zone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role</span>
                <span className="detail-value">{roleLabels[userProfile?.role]}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account Created</span>
                <span className="detail-value">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
