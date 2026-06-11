import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import './Settings.css';

const Settings = () => {
  const { userProfile, updateProfile } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    alertSound: true,
    autoRefresh: true,
    refreshInterval: 30,
    theme: 'light'
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (userProfile?.role !== ROLES.SUPER_ADMIN) {
    return (
      <div className="settings-page">
        <div className="access-denied">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-10h2v8h-2V7z"/>
          </svg>
          <h2>Access Denied</h2>
          <p>Only Super Admin can access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure platform settings</p>
        </div>
      </div>

      {success && (
        <div className="settings-alert success">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {success}
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-section">
          <h3>Notifications</h3>
          <div className="settings-option">
            <div className="option-info">
              <span className="option-title">Email Notifications</span>
              <span className="option-description">Receive email notifications for alerts</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-option">
            <div className="option-info">
              <span className="option-title">Push Notifications</span>
              <span className="option-description">Receive push notifications in the browser</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-option">
            <div className="option-info">
              <span className="option-title">Alert Sound</span>
              <span className="option-description">Play sound for critical alerts</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.alertSound}
                onChange={() => handleToggle('alertSound')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Data Refresh</h3>
          <div className="settings-option">
            <div className="option-info">
              <span className="option-title">Auto Refresh</span>
              <span className="option-description">Automatically refresh data</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={() => handleToggle('autoRefresh')}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-option">
            <div className="option-info">
              <span className="option-title">Refresh Interval</span>
              <span className="option-description">How often to refresh data (seconds)</span>
            </div>
            <select
              className="form-select"
              value={settings.refreshInterval}
              onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-option">
            <div className="option-info">
              <span className="option-title">Theme</span>
              <span className="option-description">Select your preferred theme</span>
            </div>
            <select
              className="form-select"
              value={settings.theme}
              onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
            >
              <option value="light">Light</option>
              <option value="dark">Dark (Coming Soon)</option>
              <option value="system">System (Coming Soon)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="settings-section">
        <h3>System Information</h3>
        <div className="system-info">
          <div className="info-row">
            <span>Platform Version</span>
            <span>A5X Smart Waste v1.0.0</span>
          </div>
          <div className="info-row">
            <span>Platform</span>
            <span>A5X INDUSTRIES</span>
          </div>
          <div className="info-row">
            <span>Last Updated</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
