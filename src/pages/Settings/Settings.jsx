import { useState, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { database } from '../../config/firebase'
import { 
  Settings as SettingsIcon, 
  Bell, 
  MapPin, 
  Shield,
  Save,
  CheckCircle
} from 'lucide-react'

function Settings() {
  const [settings, setSettings] = useState({
    general: {
      companyName: 'A5X Industries',
      systemName: 'Smart Waste Management Platform',
      defaultZone: '',
      timezone: 'Asia/Kolkata'
    },
    alerts: {
      fullBinThreshold: 80,
      lowBatteryThreshold: 20,
      offlineTimeoutMinutes: 30,
      enableEmailNotifications: true,
      enablePushNotifications: true
    },
    collection: {
      autoAssignTasks: false,
      defaultPriority: 'medium',
      workingHoursStart: '08:00',
      workingHoursEnd: '18:00'
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    const settingsRef = ref(database, 'Settings')
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setSettings(prev => ({
          general: { ...prev.general, ...data.general },
          alerts: { ...prev.alerts, ...data.alerts },
          collection: { ...prev.collection, ...data.collection }
        }))
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await update(ref(database, 'Settings'), settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
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
      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: 400 }}>
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <SettingsIcon size={16} style={{ marginRight: 6 }} />
          General
        </button>
        <button 
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={16} style={{ marginRight: 6 }} />
          Alerts
        </button>
        <button 
          className={`tab ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <MapPin size={16} style={{ marginRight: 6 }} />
          Collection
        </button>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <CheckCircle size={20} />
          Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">General Settings</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.general.companyName}
                onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">System Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.general.systemName}
                onChange={(e) => updateSetting('general', 'systemName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Zone</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Zone A"
                value={settings.general.defaultZone}
                onChange={(e) => updateSetting('general', 'defaultZone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={settings.general.timezone}
                onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Alert Settings */}
      {activeTab === 'alerts' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Alert Settings</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Full Bin Threshold (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={settings.alerts.fullBinThreshold}
                onChange={(e) => updateSetting('alerts', 'fullBinThreshold', parseInt(e.target.value))}
              />
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                Trigger alert when bin fill level exceeds this percentage
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Low Battery Threshold (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={settings.alerts.lowBatteryThreshold}
                onChange={(e) => updateSetting('alerts', 'lowBatteryThreshold', parseInt(e.target.value))}
              />
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                Trigger alert when battery level falls below this percentage
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Offline Timeout (minutes)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={settings.alerts.offlineTimeoutMinutes}
                onChange={(e) => updateSetting('alerts', 'offlineTimeoutMinutes', parseInt(e.target.value))}
              />
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                Mark device as offline after no response for this duration
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
              <h4 style={{ marginBottom: 16 }}>Notification Channels</h4>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.alerts.enableEmailNotifications}
                    onChange={(e) => updateSetting('alerts', 'enableEmailNotifications', e.target.checked)}
                  />
                  <span>Email Notifications</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.alerts.enablePushNotifications}
                    onChange={(e) => updateSetting('alerts', 'enablePushNotifications', e.target.checked)}
                  />
                  <span>Push Notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Settings */}
      {activeTab === 'collection' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Collection Settings</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.collection.autoAssignTasks}
                  onChange={(e) => updateSetting('collection', 'autoAssignTasks', e.target.checked)}
                />
                <span>Auto-assign collection tasks</span>
              </label>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                Automatically assign tasks to available collection staff
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Default Priority</label>
              <select
                className="form-select"
                value={settings.collection.defaultPriority}
                onChange={(e) => updateSetting('collection', 'defaultPriority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Working Hours Start</label>
                <input
                  type="time"
                  className="form-input"
                  value={settings.collection.workingHoursStart}
                  onChange={(e) => updateSetting('collection', 'workingHoursStart', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Working Hours End</label>
                <input
                  type="time"
                  className="form-input"
                  value={settings.collection.workingHoursEnd}
                  onChange={(e) => updateSetting('collection', 'workingHoursEnd', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default Settings
