import { useState, useEffect, useMemo } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../config/firebase'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, Filter, Layers, MapPin, Battery, Clock } from 'lucide-react'

// Custom marker icons
const createMarkerIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

const markerIcons = {
  empty: createMarkerIcon('#10B981'),
  medium: createMarkerIcon('#F59E0B'),
  full: createMarkerIcon('#EF4444'),
  offline: createMarkerIcon('#64748B')
}

function MapController({ center }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])
  
  return null
}

function LiveMap() {
  const [bins, setBins] = useState([])
  const [filteredBins, setFilteredBins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [zones, setZones] = useState([])
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]) // Default to Delhi
  const [selectedBin, setSelectedBin] = useState(null)

  useEffect(() => {
    const binsRef = ref(database, 'Bins')
    const unsubscribe = onValue(binsRef, (snapshot) => {
      if (snapshot.exists()) {
        const binsData = snapshot.val()
        const binsList = Object.entries(binsData)
          .map(([id, data]) => ({ id, ...data }))
          .filter(bin => bin.latitude && bin.longitude)
        setBins(binsList)
        
        const uniqueZones = [...new Set(binsList.map(b => b.zone).filter(Boolean))]
        setZones(uniqueZones)

        // Set initial map center to first bin with coordinates
        if (binsList.length > 0) {
          setMapCenter([binsList[0].latitude, binsList[0].longitude])
        }
      } else {
        setBins([])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let result = bins

    if (searchTerm) {
      result = result.filter(bin => 
        bin.binId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(bin => {
        if (statusFilter === 'empty') return bin.fillLevel < 30
        if (statusFilter === 'medium') return bin.fillLevel >= 30 && bin.fillLevel < 80
        if (statusFilter === 'full') return bin.fillLevel >= 80
        if (statusFilter === 'offline') return bin.status === 'offline'
        return true
      })
    }

    if (zoneFilter !== 'all') {
      result = result.filter(bin => bin.zone === zoneFilter)
    }

    setFilteredBins(result)
  }, [bins, searchTerm, statusFilter, zoneFilter])

  const getMarkerIcon = (bin) => {
    if (bin.status === 'offline') return markerIcons.offline
    if (bin.fillLevel >= 80) return markerIcons.full
    if (bin.fillLevel >= 30) return markerIcons.medium
    return markerIcons.empty
  }

  const getStatusText = (bin) => {
    if (bin.status === 'offline') return 'Offline'
    if (bin.fillLevel >= 80) return 'Full'
    if (bin.fillLevel >= 30) return 'Medium'
    return 'Empty'
  }

  const getStatusColor = (bin) => {
    if (bin.status === 'offline') return '#64748B'
    if (bin.fillLevel >= 80) return '#EF4444'
    if (bin.fillLevel >= 30) return '#F59E0B'
    return '#10B981'
  }

  const handleBinClick = (bin) => {
    setSelectedBin(bin)
    setMapCenter([bin.latitude, bin.longitude])
  }

  const stats = useMemo(() => ({
    total: filteredBins.length,
    empty: filteredBins.filter(b => b.fillLevel < 30 && b.status !== 'offline').length,
    medium: filteredBins.filter(b => b.fillLevel >= 30 && b.fillLevel < 80 && b.status !== 'offline').length,
    full: filteredBins.filter(b => b.fillLevel >= 80 && b.status !== 'offline').length,
    offline: filteredBins.filter(b => b.status === 'offline').length
  }), [filteredBins])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="search-input"
            placeholder="Search bins by ID or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-select filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="empty">Empty ({stats.empty})</option>
          <option value="medium">Medium ({stats.medium})</option>
          <option value="full">Full ({stats.full})</option>
          <option value="offline">Offline ({stats.offline})</option>
        </select>
        <select
          className="form-select filter-select"
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
        >
          <option value="all">All Zones</option>
          {zones.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-light)' }}>
            <Layers size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Legend:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10B981' }}></div>
            <span>Empty ({stats.empty})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F59E0B' }}></div>
            <span>Medium ({stats.medium})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#EF4444' }}></div>
            <span>Full ({stats.full})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#64748B' }}></div>
            <span>Offline ({stats.offline})</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} />
            
            {filteredBins.map(bin => (
              <Marker
                key={bin.id}
                position={[bin.latitude, bin.longitude]}
                icon={getMarkerIcon(bin)}
                eventHandlers={{
                  click: () => handleBinClick(bin)
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>
                      {bin.binId || 'BIN-' + bin.id.slice(-4)}
                    </h4>
                    <p style={{ margin: '0 0 12px', color: '#64748B', fontSize: 13 }}>
                      <MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      {bin.location || 'Unknown Location'}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      marginBottom: 12
                    }}>
                      <span 
                        style={{ 
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: `${getStatusColor(bin)}20`,
                          color: getStatusColor(bin)
                        }}
                      >
                        {getStatusText(bin)} - {bin.fillLevel || 0}%
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B' }}>
                        <Battery size={14} />
                        {bin.battery || 0}%
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B' }}>
                        <Filter size={14} />
                        {bin.zone || 'N/A'}
                      </div>
                    </div>
                    {bin.lastUpdate && (
                      <div style={{ 
                        marginTop: 8, 
                        paddingTop: 8, 
                        borderTop: '1px solid #E2E8F0',
                        fontSize: 12,
                        color: '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Clock size={12} />
                        Updated: {new Date(bin.lastUpdate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Bin Quick List */}
      {filteredBins.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Bins on Map ({filteredBins.length})</h3>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Bin ID</th>
                  <th>Location</th>
                  <th>Zone</th>
                  <th>Fill Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBins.map(bin => (
                  <tr 
                    key={bin.id} 
                    onClick={() => handleBinClick(bin)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 500 }}>{bin.binId || 'BIN-' + bin.id.slice(-4)}</td>
                    <td>{bin.location || 'N/A'}</td>
                    <td>{bin.zone || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div 
                            className={`progress-fill ${bin.fillLevel >= 80 ? 'red' : bin.fillLevel >= 30 ? 'yellow' : 'green'}`}
                            style={{ width: `${bin.fillLevel || 0}%` }}
                          ></div>
                        </div>
                        <span>{bin.fillLevel || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className={`badge ${
                          bin.status === 'offline' ? 'badge-offline' :
                          bin.fillLevel >= 80 ? 'badge-full' :
                          bin.fillLevel >= 30 ? 'badge-medium' : 'badge-empty'
                        }`}
                      >
                        {getStatusText(bin)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMap
