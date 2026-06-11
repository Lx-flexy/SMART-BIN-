export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MUNICIPAL_ADMIN: 'municipal_admin',
  COLLECTION_STAFF: 'collection_staff'
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.MUNICIPAL_ADMIN]: 'Municipal Admin',
  [ROLES.COLLECTION_STAFF]: 'Collection Staff'
};

export const BIN_STATUS = {
  EMPTY: 'empty',
  MEDIUM: 'medium',
  FULL: 'full',
  OFFLINE: 'offline'
};

export const BIN_STATUS_LABELS = {
  [BIN_STATUS.EMPTY]: 'Empty',
  [BIN_STATUS.MEDIUM]: 'Medium',
  [BIN_STATUS.FULL]: 'Full',
  [BIN_STATUS.OFFLINE]: 'Offline'
};

export const TASK_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: 'Pending',
  [TASK_STATUS.ASSIGNED]: 'Assigned',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.COMPLETED]: 'Completed'
};

export const ALERT_TYPES = {
  FULL_BIN: 'full_bin',
  OVERFLOW: 'overflow',
  LOW_BATTERY: 'low_battery',
  OFFLINE: 'offline',
  SENSOR_FAILURE: 'sensor_failure'
};

export const ALERT_TYPE_LABELS = {
  [ALERT_TYPES.FULL_BIN]: 'Full Bin Alert',
  [ALERT_TYPES.OVERFLOW]: 'Overflow Alert',
  [ALERT_TYPES.LOW_BATTERY]: 'Low Battery',
  [ALERT_TYPES.OFFLINE]: 'Device Offline',
  [ALERT_TYPES.SENSOR_FAILURE]: 'Sensor Failure'
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const ZONES = [
  'Zone A - Central',
  'Zone B - North',
  'Zone C - South',
  'Zone D - East',
  'Zone E - West',
  'Zone F - Industrial'
];

export const getBinStatus = (fillLevel, networkStatus) => {
  if (networkStatus === 'offline' || networkStatus === false) return BIN_STATUS.OFFLINE;
  if (fillLevel >= 80) return BIN_STATUS.FULL;
  if (fillLevel >= 50) return BIN_STATUS.MEDIUM;
  return BIN_STATUS.EMPTY;
};

export const getBinColor = (status) => {
  switch (status) {
    case BIN_STATUS.FULL: return '#EF4444';
    case BIN_STATUS.MEDIUM: return '#F59E0B';
    case BIN_STATUS.EMPTY: return '#16A34A';
    case BIN_STATUS.OFFLINE: return '#1E293B';
    default: return '#64748B';
  }
};

export const DATABASE_PATHS = {
  USERS: 'users',
  BINS: 'bins',
  ALERTS: 'alerts',
  TASKS: 'tasks',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  SETTINGS: 'settings'
};
