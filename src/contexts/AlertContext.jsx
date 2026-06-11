import { createContext, useContext, useState, useEffect } from 'react';
import { alertService } from '../services/alertService';

const AlertContext = createContext(null);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = alertService.subscribeToAlerts((alertData) => {
      setAlerts(alertData);
      setActiveAlerts(alertData.filter(a => a.status === 'active'));
      setStatistics(alertService.getStatistics(alertData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const acknowledgeAlert = async (alertId) => {
    setError(null);
    try {
      return await alertService.acknowledgeAlert(alertId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resolveAlert = async (alertId) => {
    setError(null);
    try {
      return await alertService.resolveAlert(alertId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await alertService.markAsRead(alertId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await alertService.markAllAsRead();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAlert = async (alertId) => {
    setError(null);
    try {
      await alertService.deleteAlert(alertId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getUnreadCount = () => {
    return activeAlerts.filter(a => !a.isRead).length;
  };

  const getAlertsByBin = (binId) => {
    return alerts.filter(a => a.binId === binId);
  };

  const value = {
    alerts,
    activeAlerts,
    statistics,
    loading,
    error,
    acknowledgeAlert,
    resolveAlert,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    getUnreadCount,
    getAlertsByBin,
    setError
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertContext;
