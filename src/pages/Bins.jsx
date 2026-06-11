import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBins } from '../contexts/BinContext';
import { useAlerts } from '../contexts/AlertContext';
import { useTasks } from '../contexts/TaskContext';
import { BIN_STATUS, BIN_STATUS_LABELS, ZONES } from '../utils/constants';
import { formatDateTime, getRelativeTime } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';
import './Bins.css';

const Bins = () => {
  const { bins, statistics, loading, updateBin, deleteBin } = useBins();
  const { acknowledgeAlert } = useAlerts();
  const { createTask } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [sortBy, setSortBy] = useState('lastUpdate');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedBins, setSelectedBins] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [binToDelete, setBinToDelete] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredBins = bins.filter(bin => {
    const matchesSearch = bin.binId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      bin.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      bin.zone.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bin.status === filterStatus;
    const matchesZone = filterZone === 'all' || bin.zone === filterZone;
    return matchesSearch && matchesStatus && matchesZone;
  }).sort((a, b) => {
    if (sortBy === 'lastUpdate') return new Date(b.lastUpdate) - new Date(a.lastUpdate);
    if (sortBy === 'fillLevel') return b.fillLevel - a.fillLevel;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const handleSelectBin = (binId) => {
    setSelectedBins(prev =>
      prev.includes(binId)
        ? prev.filter(id => id !== binId)
        : [...prev, binId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBins.length === filteredBins.length) {
      setSelectedBins([]);
    } else {
      setSelectedBins(filteredBins.map(bin => bin.binId));
    }
  };

  const handleCreateTask = async (bin) => {
    try {
      await createTask({
        binId: bin.binId,
        binName: bin.name,
        zone: bin.zone,
        type: 'collection',
        priority: bin.fillLevel >= 95 ? 'high' : 'normal',
        location: bin.location,
        description: `Collection required for bin ${bin.name}`
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteClick = (bin) => {
    setBinToDelete(bin);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (binToDelete) {
      await deleteBin(binToDelete.binId);
      setShowDeleteModal(false);
      setBinToDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case BIN_STATUS.EMPTY: return 'success';
      case BIN_STATUS.MEDIUM: return 'warning';
      case BIN_STATUS.FULL: return 'danger';
      case BIN_STATUS.OFFLINE: return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div className="bins-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Bins</h1>
          <p className="page-subtitle">Monitor and manage all smart dustbins</p>
        </div>
        <div className="page-actions">
          <Link to="/bins/new" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Bin
          </Link>
        </div>
      </div>

      <div className="bins-stats">
        <div className="bin-stat-item">
          <span className="bin-stat-value">{statistics?.total || 0}</span>
          <span className="bin-stat-label">Total Bins</span>
        </div>
        <div className="bin-stat-item">
          <span className="bin-stat-value text-success">{statistics?.empty || 0}</span>
          <span className="bin-stat-label">Empty</span>
        </div>
        <div className="bin-stat-item">
          <span className="bin-stat-value text-warning">{statistics?.medium || 0}</span>
          <span className="bin-stat-label">Medium</span>
        </div>
        <div className="bin-stat-item">
          <span className="bin-stat-value text-danger">{statistics?.full || 0}</span>
          <span className="bin-stat-label">Full</span>
        </div>
        <div className="bin-stat-item">
          <span className="bin-stat-value text-muted">{statistics?.offline || 0}</span>
          <span className="bin-stat-label">Offline</span>
        </div>
      </div>

      <div className="bins-filters">
        <div className="search-input">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            placeholder="Search bins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          {Object.keys(BIN_STATUS).map(key => (
            <option key={BIN_STATUS[key]} value={BIN_STATUS[key]}>
              {BIN_STATUS_LABELS[BIN_STATUS[key]]}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
        >
          <option value="all">All Zones</option>
          {ZONES.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>

        <select
          className="form-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="lastUpdate">Last Updated</option>
          <option value="fillLevel">Fill Level</option>
          <option value="name">Name</option>
        </select>

        <div className="view-toggle">
          <button
            className={`btn btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('grid')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
            </svg>
          </button>
          <button
            className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zm0-10h4V5H4v4zm6 5h12v-4H10v4zm0 5h12v-4H10v4zM10 5v4h12V5H10z"/>
            </svg>
          </button>
        </div>
      </div>

      {filteredBins.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          <h3>No Bins Found</h3>
          <p>Try adjusting your filters or add a new bin</p>
          <Link to="/bins/new" className="btn btn-primary">Add Bin</Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="bins-grid">
          {filteredBins.map(bin => (
            <div key={bin.binId} className={`bin-card bin-card-${bin.status}`}>
              <div className="bin-card-header">
                <div className="bin-card-title">
                  <h3>{bin.name}</h3>
                  <span className={`badge badge-${getStatusColor(bin.status)}`}>
                    {BIN_STATUS_LABELS[bin.status]}
                  </span>
                </div>
                <div className="bin-card-menu">
                  <button className="btn btn-icon btn-ghost">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bin-card-body">
                <div className="bin-fill-info">
                  <div className="fill-gauge">
                    <svg viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={bin.fillLevel >= 80 ? '#EF4444' : bin.fillLevel >= 50 ? '#F59E0B' : '#16A34A'}
                        strokeWidth="3"
                        strokeDasharray={`${bin.fillLevel}, 100`}
                      />
                    </svg>
                    <span className="fill-value">{bin.fillLevel}%</span>
                  </div>
                </div>

                <div className="bin-details">
                  <div className="bin-detail-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    <span>{bin.zone}</span>
                  </div>
                  <div className="bin-detail-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                    </svg>
                    <span>{bin.battery}%</span>
                  </div>
                  <div className="bin-detail-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <span>{getRelativeTime(bin.lastUpdate)}</span>
                  </div>
                </div>
              </div>

              <div className="bin-card-footer">
                <Link to={`/bins/${bin.binId}`} className="btn btn-secondary btn-sm">
                  View Details
                </Link>
                {bin.status === BIN_STATUS.FULL && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleCreateTask(bin)}
                  >
                    Create Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedBins.length === filteredBins.length && filteredBins.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Bin ID</th>
                <th>Name</th>
                <th>Zone</th>
                <th>Fill Level</th>
                <th>Battery</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBins.map(bin => (
                <tr key={bin.binId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedBins.includes(bin.binId)}
                      onChange={() => handleSelectBin(bin.binId)}
                    />
                  </td>
                  <td>
                    <Link to={`/bins/${bin.binId}`} className="text-primary font-medium">
                      {bin.binId}
                    </Link>
                  </td>
                  <td>{bin.name}</td>
                  <td>{bin.zone}</td>
                  <td>
                    <div className="fill-level-bar">
                      <div className="fill-level-bar-fill">
                        <div
                          className={`fill-bar-inner ${bin.fillLevel >= 80 ? 'danger' : bin.fillLevel >= 50 ? 'warning' : 'success'}`}
                          style={{ width: `${bin.fillLevel}%` }}
                        ></div>
                      </div>
                      <span>{bin.fillLevel}%</span>
                    </div>
                  </td>
                  <td>{bin.battery}%</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(bin.status)}`}>
                      {BIN_STATUS_LABELS[bin.status]}
                    </span>
                  </td>
                  <td>{getRelativeTime(bin.lastUpdate)}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/bins/${bin.binId}`} className="btn btn-ghost btn-sm">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteClick(bin)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2.2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Bin</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowDeleteModal(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{binToDelete?.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bins;
