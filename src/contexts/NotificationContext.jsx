import { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      const unsubscribe = notificationService.subscribeToNotifications(user.uid, (notifData) => {
        setNotifications(notifData);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [user?.uid]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(user.uid, notificationId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.uid);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(user.uid, notificationId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.clearAllNotifications(user.uid);
      setNotifications([]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const unreadCount = notificationService.getUnreadCount(notifications);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    setError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
