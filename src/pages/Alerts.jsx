import { useState } from 'react';
import { useAlerts } from '../contexts/AlertContext';
import { ALERT_TYPES, ALERT_TYPE_LABELS, ALERT_SEVERITY } from '../utils/constants';
import { formatDateTime, getRelativeTime } from '../utils/helpers';
import './Alerts.css';

const Alerts = () => {
  const {
    alerts,
    activeAlerts,
    statistics,
    loading,
    acknowledgeAlert,
    resolveAlert,
    markAsRead,
    markAllAsRead
  } = useAlerts();
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    return matchesType && matchesSeverity && matchesStatus;
  });

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL: return 'danger';
      case ALERT_SEVERITY.HIGH: return 'warning';
      case ALERT_SEVERITY.MEDIUM: return 'info';
      case ALERT_SEVERITY.LOW: return 'gray';
      default: return 'gray';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case ALERT_TYPES.FULL_BIN:
      case ALERT_TYPES.OVERFLOW:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        );
      case ALERT_TYPES.LOW_BATTERY:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
          </svg>
        );
      case ALERT_TYPES.OFFLINE:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.43 16.06c1.52-1.46 3.04-2.31 4.56-4.06.63-.76.97-1.58.97-2.5 0-1.49-.73-2.75-1.64-3.5zm-17.28-3.63L5 1.44l1.41-1.41L21.17 14.8l-1.41 1.41-3.26-3.26C14.64 14.19 12.54 16 9.64 16c-3.43 0-6.14-2.47-6.14-5.92 0-2.37 1.36-4.09 3.16-5.71zM1.41 0L0 1.41l2.86 2.86C1.35 5.74 0 7.73 0 10.08c0 3.3 2.7 6.06 6 6.06 0 0 0 0 0 .14 0 2.14 1.5 3.93 3.5 4.45v2.41c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-2.41c1.18-.27 2.23-.85 3.07-1.64L22.59 24 24 22.59 1.41 0z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        );
    }
  };

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Monitor and manage system alerts</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            onClick={markAllAsRead}
            disabled={activeAlerts.filter(a => !a.isRead).length === 0}
          >
            Mark All Read
          </button>
        </div>
      </div>

      <div className="alerts-stats">
        <div className="alert-stat-item critical">
          <span className="alert-stat-value">{statistics?.critical || 0}</span>
          <span className="alert-stat-label">Critical</span>
        </div>
        <div className="alert-stat-item high">
          <span className="alert-stat-value">{statistics?.high || 0}</span>
          <span className="alert-stat-label">High</span>
        </div>
        <div className="alert-stat-item medium">
          <span className="alert-stat-value">{statistics?.medium || 0}</span>
          <span className="alert-stat-label">Medium</span>
        </div>
        <div className="alert-stat-item low">
          <span className="alert-stat-value">{statistics?.low || 0}</span>
          <span className="alert-stat-label">Low</span>
        </div>
        <div className="alert-stat-item active-count">
          <span className="alert-stat-value">{statistics?.active || 0}</span>
          <span className="alert-stat-label">Active</span>
        </div>
        <div className="alert-stat-item unread">
          <span className="alert-stat-value">{statistics?.unread || 0}</span>
          <span className="alert-stat-label">Unread</span>
        </div>
      </div>

      <div className="alerts-filters">
        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          className="form-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          {Object.keys(ALERT_TYPES).map(key => (
            <option key={ALERT_TYPES[key]} value={ALERT_TYPES[key]}>
              {ALERT_TYPE_LABELS[ALERT_TYPES[key]]}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="all">All Severity</option>
          {Object.keys(ALERT_SEVERITY).map(key => (
            <option key={ALERT_SEVERITY[key]} value={ALERT_SEVERITY[key]}>
              {ALERT_SEVERITY[key]}
            </option>
          ))}
        </select>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <h3>No Alerts</h3>
          <p>No alerts match the selected filters</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map(alert => (
            <div
              key={alert.alertId}
              className={`alert-card ${!alert.isRead ? 'unread' : ''} severity-${alert.severity}`}
            >
              <div className={`alert-icon ${getSeverityColor(alert.severity)}`}>
                {getAlertIcon(alert.type)}
              </div>

              <div className="alert-content">
                <div className="alert-header">
                  <h3 className="alert-title">{ALERT_TYPE_LABELS[alert.type]}</h3>
                  <span className={`badge badge-${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="alert-message">{alert.message}</p>
                <div className="alert-meta">
                  <span className="alert-bin">{alert.binName}</span>
                  <span className="alert-separator">•</span>
                  <span className="alert-zone">{alert.zone}</span>
                  <span className="alert-separator">•</span>
                  <span className="alert-time">{getRelativeTime(alert.createdAt)}</span>
                </div>
              </div>

              <div className="alert-actions">
                {alert.status === 'active' && (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAcknowledge(alert.alertId)}
                    >
                      Acknowledge
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResolve(alert.alertId)}
                    >
                      Resolve
                    </button>
                  </>
                )}
                {alert.status === 'acknowledged' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleResolve(alert.alertId)}
                  >
                    Resolve
                  </button>
                )}
                {alert.status === 'resolved' && (
                  <span className="badge badge-success">Resolved</span>
                )}
              </div>

              <div className="alert-status-indicator">
                <span className={`status-dot status-${alert.status}`}></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
