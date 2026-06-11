import { database } from '../firebase/config';
import { ref, set, get, update, remove, onValue, off, push, query, orderByChild, limitToLast } from 'firebase/database';
import { DATABASE_PATHS, ALERT_TYPES, ALERT_SEVERITY } from '../utils/constants';

const alertsRef = ref(database, DATABASE_PATHS.ALERTS);

export const alertService = {
  async createAlert(alertData) {
    const alertId = `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const alert = {
      alertId,
      type: alertData.type,
      severity: alertData.severity,
      binId: alertData.binId,
      binName: alertData.binName,
      zone: alertData.zone,
      message: alertData.message,
      status: 'active',
      isRead: false,
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null
    };

    await set(ref(database, `${DATABASE_PATHS.ALERTS}/${alertId}`), alert);
    return alert;
  },

  async getAlert(alertId) {
    const snapshot = await get(ref(database, `${DATABASE_PATHS.ALERTS}/${alertId}`));
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getAllAlerts() {
    const snapshot = await get(alertsRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  },

  async getActiveAlerts() {
    const alerts = await this.getAllAlerts();
    return alerts.filter(alert => alert.status === 'active');
  },

  async acknowledgeAlert(alertId) {
    await update(ref(database, `${DATABASE_PATHS.ALERTS}/${alertId}`), {
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString()
    });
    return this.getAlert(alertId);
  },

  async resolveAlert(alertId) {
    await update(ref(database, `${DATABASE_PATHS.ALERTS}/${alertId}`), {
      status: 'resolved',
      resolvedAt: new Date().toISOString()
    });
    return this.getAlert(alertId);
  },

  async markAsRead(alertId) {
    await update(ref(database, `${DATABASE_PATHS.ALERTS}/${alertId}`), {
      isRead: true
    });
  },

  async markAllAsRead() {
    const alerts = await this.getActiveAlerts();
    const updates = {};
    alerts.forEach(alert => {
      updates[`${alert.alertId}/isRead`] = true;
    });
    await update(alertsRef, updates);
  },

  async deleteAlert(alertId) {
    await remove(ref(database, `${DATABASE_PATHS.ALERTS}/${alertId}`));
  },

  subscribeToAlerts(callback) {
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const alerts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });
    return () => off(alertsRef, 'value', unsubscribe);
  },

  subscribeToActiveAlerts(callback) {
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const alerts = Object.keys(data)
        .map(key => ({ id: key, ...data[key] }))
        .filter(alert => alert.status === 'active')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(alerts);
    });
    return () => off(alertsRef, 'value', unsubscribe);
  },

  async checkAndGenerateAlerts(bin, previousBin = null) {
    const alerts = [];

    if (bin.networkStatus === 'offline' || bin.networkStatus === false) {
      if (!previousBin || (previousBin.networkStatus !== 'offline' && previousBin.networkStatus !== false)) {
        alerts.push({
          type: ALERT_TYPES.OFFLINE,
          severity: ALERT_SEVERITY.HIGH,
          binId: bin.binId,
          binName: bin.name,
          zone: bin.zone,
          message: `Bin ${bin.name} (${bin.binId}) has gone offline`
        });
      }
    } else {
      if (bin.fillLevel >= 80) {
        if (!previousBin || previousBin.fillLevel < 80) {
          alerts.push({
            type: ALERT_TYPES.FULL_BIN,
            severity: bin.fillLevel >= 95 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH,
            binId: bin.binId,
            binName: bin.name,
            zone: bin.zone,
            message: `Bin ${bin.name} is ${bin.fillLevel}% full and needs collection`
          });
        }
        if (bin.fillLevel >= 95) {
          alerts.push({
            type: ALERT_TYPES.OVERFLOW,
            severity: ALERT_SEVERITY.CRITICAL,
            binId: bin.binId,
            binName: bin.name,
            zone: bin.zone,
            message: `Bin ${bin.name} is at risk of overflow!`
          });
        }
      }

      if (bin.battery < 20) {
        if (!previousBin || previousBin.battery >= 20) {
          alerts.push({
            type: ALERT_TYPES.LOW_BATTERY,
            severity: ALERT_SEVERITY.MEDIUM,
            binId: bin.binId,
            binName: bin.name,
            zone: bin.zone,
            message: `Bin ${bin.name} battery is low (${bin.battery}%). Please recharge.`
          });
        }
      }
    }

    for (const alertData of alerts) {
      await this.createAlert(alertData);
    }

    return alerts;
  },

  getStatistics(alerts) {
    const stats = {
      total: alerts.length,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      unread: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    if (alerts.length === 0) return stats;

    alerts.forEach(alert => {
      switch (alert.status) {
        case 'active':
          stats.active++;
          if (!alert.isRead) stats.unread++;
          break;
        case 'acknowledged':
          stats.acknowledged++;
          break;
        case 'resolved':
          stats.resolved++;
          break;
      }

      switch (alert.severity) {
        case ALERT_SEVERITY.CRITICAL:
          stats.critical++;
          break;
        case ALERT_SEVERITY.HIGH:
          stats.high++;
          break;
        case ALERT_SEVERITY.MEDIUM:
          stats.medium++;
          break;
        case ALERT_SEVERITY.LOW:
          stats.low++;
          break;
      }
    });

    return stats;
  }
};

export default alertService;
