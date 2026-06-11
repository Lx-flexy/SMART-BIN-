import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ref, onValue, push, remove } from 'firebase/database'
import { database } from '../../config/firebase'

function Bins() {
  const [bins, setBins] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [formData, setFormData] = useState({
    binId: '',
    location: '',
    zone: 'Zone A',
    latitude: '',
    longitude: '',
    fillLevel: 0,
    battery: 100,
    status: 'online'
  })

  useEffect(() => {
    const binsRef = ref(database, 'Bins')
    const unsubscribe = onValue(binsRef, (snapshot) => {
      if (snapshot.exists()) {
        const binsData = snapshot.val()
        const binsList = Object.entries(binsData).map(([id, data]) => ({ id, ...data }))
        setBins(binsList)
      } else {
        setBins([])
      }
    })
    return () => unsubscribe()
  }, [])

  const filteredBins = bins.filter((bin) => {
    const matchesSearch = bin.binId?.toLowerCase().includes(searchTerm.toLowerCase()) || bin.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'empty' && bin.fillLevel < 30) ||
      (statusFilter === 'medium' && bin.fillLevel >= 30 && bin.fillLevel < 80) ||
      (statusFilter === 'full' && bin.fillLevel >= 80) ||
      (statusFilter === 'offline' && bin.status === 'offline')
    const matchesZone = zoneFilter === 'all' || bin.zone === zoneFilter
    return matchesSearch && matchesStatus && matchesZone
  })

  const zones = Array.from(new Set(bins.map((bin) => bin.zone).filter(Boolean)))

  const getStatusBadge = (bin) => {
    if (bin.status === 'offline') return <span className="badge badge-offline">Offline</span>
    if (bin.fillLevel >= 80) return <span className="badge badge-full">Full</span>
    if (bin.fillLevel >= 30) return <span className="badge badge-medium">Medium</span>
    return <span className="badge badge-empty">Empty</span>
  }

  const getProgressColor = (level) => {
    if (level >= 80) return 'red'
    if (level >= 30) return 'yellow'
    return 'green'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddBin = async (e) => {
    e.preventDefault()

    const newBin = {
      binId: formData.binId || `BIN-${Date.now()}`,
      location: formData.location,
      zone: formData.zone,
      latitude: Number(formData.latitude) || 0,
      longitude: Number(formData.longitude) || 0,
      fillLevel: Number(formData.fillLevel),
      battery: Number(formData.battery),
      status: formData.status,
      lastUpdate: new Date().toISOString()
    }

    try {
      await push(ref(database, 'Bins'), newBin)
      setShowModal(false)
      setFormData({ binId: '', location: '', zone: 'Zone A', latitude: '', longitude: '', fillLevel: 0, battery: 100, status: 'online' })
    } catch (error) {
      console.error('Error adding bin:', error)
    }
  }

  const handleDeleteBin = async (binId) => {
    if (!window.confirm('Delete this bin?')) return

    try {
      await remove(ref(database, `Bins/${binId}`))
      setActiveMenu(null)
    } catch (error) {
      console.error('Error deleting bin:', error)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Bin Management</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Monitor and manage all waste bins across zones</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Bin
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" className="search-input" placeholder="Search bins by ID or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-select filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="empty">Empty</option>
          <option value="medium">Medium</option>
          <option value="full">Full</option>
          <option value="offline">Offline</option>
        </select>
        <select className="form-select filter-select" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
          <option value="all">All Zones</option>
          {zones.map((zone) => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      {/* Bins Grid */}
      {filteredBins.length > 0 ? (
        <div className="bin-grid">
          {filteredBins.map((bin) => (
            <div key={bin.id} className="bin-card">
              <div className="bin-card-header">
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{bin.binId || bin.id}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {bin.location}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getStatusBadge(bin)}
                  <div className="actions-menu">
                    <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setActiveMenu(activeMenu === bin.id ? null : bin.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                    {activeMenu === bin.id && (
                      <div className="actions-dropdown">
                        <Link to={`/bins/${bin.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          View
                        </Link>
                        <button type="button">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                        </button>
                        <button type="button" className="danger" onClick={() => handleDeleteBin(bin.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Fill Level</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{bin.fillLevel}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${getProgressColor(bin.fillLevel)}`} style={{ width: `${bin.fillLevel}%` }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M22 11h-4"/></svg>
                  {bin.battery}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)' }}>
                  {bin.status === 'offline' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                  )}
                  {bin.status === 'offline' ? 'Offline' : 'Online'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  {bin.zone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {new Date(bin.lastUpdate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            <h3>No Bins Found</h3>
            <p>Try adjusting your filters or add a new bin</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Bin</button>
          </div>
        </div>
      )}

      {/* Add Bin Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Bin</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form className="modal-body" onSubmit={handleAddBin}>
              <div className="form-group">
                <label className="form-label">Bin ID</label>
                <input type="text" name="binId" className="form-input" placeholder="e.g., BIN-001" value={formData.binId} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" name="location" className="form-input" placeholder="e.g., Main Street, Block A" value={formData.location} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Zone</label>
                <select name="zone" className="form-select" value={formData.zone} onChange={handleChange}>
                  <option value="Zone A">Zone A</option>
                  <option value="Zone B">Zone B</option>
                  <option value="Zone C">Zone C</option>
                  <option value="Zone D">Zone D</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input type="number" name="latitude" step="any" className="form-input" placeholder="28.6139" value={formData.latitude} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input type="number" name="longitude" step="any" className="form-input" placeholder="77.2090" value={formData.longitude} onChange={handleChange} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label">Fill Level (%)</label>
                  <input type="number" name="fillLevel" className="form-input" value={formData.fillLevel} onChange={handleChange} min="0" max="100" />
                </div>
                <div className="form-group">
                  <label className="form-label">Battery (%)</label>
                  <input type="number" name="battery" className="form-input" value={formData.battery} onChange={handleChange} min="0" max="100" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Status</label>
                <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit">Add Bin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bins
