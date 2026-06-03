import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const binData = {
  id: 'BIN-1234',
  location: 'Central Park North',
  address: '123 Park Avenue, New York, NY 10001',
  zone: 'Zone A',
  type: 'General Waste',
  fillLevel: 85,
  status: 'active',
  lastCollection: '2024-01-15 08:30 AM',
  nextCollection: '2024-01-16 08:00 AM',
  temperature: '24°C',
  battery: '87%',
  signalStrength: 'Strong',
  installDate: '2023-06-15',
  capacity: '240L',
  coordinates: { lat: 40.7829, lng: -73.9654 }
};

const collectionHistory = [
  { id: 1, date: '2024-01-15', time: '08:30 AM', driver: 'John Smith', fillBefore: 92, fillAfter: 5, status: 'completed' },
  { id: 2, date: '2024-01-14', time: '09:15 AM', driver: 'Mike Johnson', fillBefore: 88, fillAfter: 3, status: 'completed' },
  { id: 3, date: '2024-01-13', time: '08:45 AM', driver: 'Sarah Wilson', fillBefore: 95, fillAfter: 8, status: 'completed' },
  { id: 4, date: '2024-01-12', time: '10:00 AM', driver: 'Tom Brown', fillBefore: 78, fillAfter: 2, status: 'completed' }
];

const alertHistory = [
  { id: 1, type: 'warning', message: 'Fill level exceeded 80%', date: '2024-01-15 06:30 AM', resolved: true },
  { id: 2, type: 'info', message: 'Collection completed', date: '2024-01-15 08:30 AM', resolved: true },
  { id: 3, type: 'warning', message: 'Battery low warning', date: '2024-01-10 02:15 PM', resolved: true }
];

function BinDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const getFillLevelColor = (level) => {
    if (level >= 80) return 'red';
    if (level >= 50) return 'yellow';
    return 'green';
  };

  return (
    <div>
      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/bins" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-light)', fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Bins
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>{id || binData.id}</h1>
              <span className="badge badge-success">Active</span>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>{binData.location} • {binData.zone}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              Schedule Collection
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
          </div>
          <div className="stat-value">{binData.fillLevel}%</div>
          <div className="stat-label">Fill Level</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className={`progress-fill ${getFillLevelColor(binData.fillLevel)}`} style={{ width: `${binData.fillLevel}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
            </div>
          </div>
          <div className="stat-value">{binData.temperature}</div>
          <div className="stat-label">Temperature</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon yellow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M22 11h-4"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>
            </div>
          </div>
          <div className="stat-value">{binData.battery}</div>
          <div className="stat-label">Battery</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
            </div>
          </div>
          <div className="stat-value">{binData.signalStrength}</div>
          <div className="stat-label">Signal</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 0, marginTop: 24 }}>
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Collection History</button>
        <button className={`tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>Alerts</button>
        <button className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
      </div>

      {/* Tab Content */}
      <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {activeTab === 'overview' && (
          <div className="card-body">
            <div className="grid-2">
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Bin Information</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { label: 'Bin ID', value: binData.id },
                    { label: 'Location', value: binData.location },
                    { label: 'Address', value: binData.address },
                    { label: 'Zone', value: binData.zone },
                    { label: 'Type', value: binData.type },
                    { label: 'Capacity', value: binData.capacity },
                    { label: 'Install Date', value: binData.installDate }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-light)', fontSize: 14 }}>{item.label}</span>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Collection Schedule</h3>
                <div className="card" style={{ background: 'var(--background)', marginBottom: 16 }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Next Collection</p>
                        <p style={{ fontWeight: 600 }}>{binData.nextCollection}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Last Collection</p>
                        <p style={{ fontWeight: 600 }}>{binData.lastCollection}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Location</h3>
                <div style={{ background: 'var(--background)', borderRadius: 8, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 8 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p style={{ fontSize: 14 }}>Map Preview</p>
                    <p style={{ fontSize: 12 }}>{binData.coordinates.lat}, {binData.coordinates.lng}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Driver</th>
                    <th>Fill Before</th>
                    <th>Fill After</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>{item.driver}</td>
                      <td>{item.fillBefore}%</td>
                      <td>{item.fillAfter}%</td>
                      <td><span className="badge badge-success">Completed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="card-body" style={{ padding: 0 }}>
            {alertHistory.map((alert) => (
              <div key={alert.id} className="notification-item">
                <div className="notification-icon" style={{ background: alert.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: alert.type === 'warning' ? 'var(--warning)' : '#3B82F6' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div className="notification-content">
                  <h4>{alert.message}</h4>
                  <span className="notification-time">{alert.date}</span>
                </div>
                <span className="badge badge-success">Resolved</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="card-body">
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <h3>No Maintenance Records</h3>
              <p>This bin has no maintenance history yet</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }}>Schedule Maintenance</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BinDetails;
