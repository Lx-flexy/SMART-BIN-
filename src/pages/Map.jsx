import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBins } from '../contexts/BinContext';
import { BIN_STATUS } from '../utils/constants';
import './Map.css';

const createCustomIcon = (status, fillLevel) => {
  let color = '#16A34A';
  if (status === BIN_STATUS.FULL) color = '#EF4444';
  else if (status === BIN_STATUS.MEDIUM) color = '#F59E0B';
  else if (status === BIN_STATUS.OFFLINE) color = '#1E293B';

  const svgIcon = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 10.672 14.404 22.424 14.996 22.912a2 2 0 002.008 0C17.596 38.424 32 26.672 32 16c0-8.836-7.164-16-16-16z" fill="${color}"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <text x="16" y="20" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">${fillLevel}%</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
  });
};

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const LiveMap = () => {
  const { bins, statistics, loading } = useBins();
  const [selectedBin, setSelectedBin] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  const indiaCenter = [20.5937, 78.9629];

  useEffect(() => {
    if (bins.length > 0) {
      const validBins = bins.filter(b => b.location?.lat && b.location?.lng);
      if (validBins.length > 0) {
        const avgLat = validBins.reduce((sum, b) => sum + b.location.lat, 0) / validBins.length;
        const avgLng = validBins.reduce((sum, b) => sum + b.location.lng, 0) / validBins.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
      }
    }
  }, [bins]);

  const filteredBins = useMemo(() => {
    return bins.filter(bin => {
      if (filterStatus === 'all') return true;
      return bin.status === filterStatus;
    }).filter(bin => bin.location?.lat && bin.location?.lng);
  }, [bins, filterStatus]);

  const handleBinClick = (bin) => {
    setSelectedBin(bin);
    setMapCenter([bin.location.lat, bin.location.lng]);
    setMapZoom(16);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case BIN_STATUS.FULL: return 'danger';
      case BIN_STATUS.MEDIUM: return 'warning';
      case BIN_STATUS.EMPTY: return 'success';
      case BIN_STATUS.OFFLINE: return 'gray';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="map-page">
        <div className="map-loading">
          <div className="spinner spinner-lg"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Map</h1>
          <p className="page-subtitle">Real-time bin locations and status</p>
        </div>
        <div className="page-actions">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Bins ({bins.length})</option>
            <option value="empty">Empty ({statistics?.empty || 0})</option>
            <option value="medium">Medium ({statistics?.medium || 0})</option>
            <option value="full">Full ({statistics?.full || 0})</option>
            <option value="offline">Offline ({statistics?.offline || 0})</option>
          </select>
        </div>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot empty"></span>
          <span>Empty (0-49%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot medium"></span>
          <span>Medium (50-79%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot full"></span>
          <span>Full (80-100%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot offline"></span>
          <span>Offline</span>
        </div>
      </div>

      <div className="map-container-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="map-container"
          scrollWheelZoom={true}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredBins.map(bin => (
            <Marker
              key={bin.binId}
              position={[bin.location.lat, bin.location.lng]}
              icon={createCustomIcon(bin.status, bin.fillLevel)}
              eventHandlers={{
                click: () => handleBinClick(bin)
              }}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{bin.name}</h4>
                  <div className="popup-status">
                    <span className={`badge badge-${getStatusColor(bin.status)}`}>
                      {bin.status}
                    </span>
                  </div>
                  <div className="popup-details">
                    <div className="popup-row">
                      <span>Fill Level:</span>
                      <strong>{bin.fillLevel}%</strong>
                    </div>
                    <div className="popup-row">
                      <span>Battery:</span>
                      <strong>{bin.battery}%</strong>
                    </div>
                    <div className="popup-row">
                      <span>Zone:</span>
                      <strong>{bin.zone}</strong>
                    </div>
                    <div className="popup-row">
                      <span>Last Update:</span>
                      <strong>{new Date(bin.lastUpdate).toLocaleTimeString()}</strong>
                    </div>
                  </div>
                  <a href={`/bins/${bin.binId}`} className="popup-link">
                    View Details
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="map-sidebar">
          <h3>Bin List ({filteredBins.length})</h3>
          <div className="bin-list-container">
            {filteredBins.map(bin => (
              <div
                key={bin.binId}
                className={`bin-list-item ${selectedBin?.binId === bin.binId ? 'active' : ''}`}
                onClick={() => handleBinClick(bin)}
              >
                <div className={`bin-list-status ${bin.status}`}></div>
                <div className="bin-list-content">
                  <span className="bin-list-name">{bin.name}</span>
                  <span className="bin-list-zone">{bin.zone}</span>
                </div>
                <span className="bin-list-fill">{bin.fillLevel}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
