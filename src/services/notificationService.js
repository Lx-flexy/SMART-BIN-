import { database } from '../firebase/config';
import { ref, set, get, update, remove, onValue, off, push } from 'firebase/database';
import { DATABASE_PATHS } from '../utils/constants';

const notificationsRef = ref(database, DATABASE_PATHS.NOTIFICATIONS);

export const notificationService = {
  async createNotification(userId, notificationData) {
    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = {
      notificationId,
      userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `${DATABASE_PATHS.NOTIFICATIONS}/${userId}/${notificationId}`), notification);
    return notification;
  },

  async getUserNotifications(userId) {
    const snapshot = await get(ref(database, `${DATABASE_PATHS.NOTIFICATIONS}/${userId}`));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data)
      .map(key => ({ id: key, ...data[key] }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markAsRead(userId, notificationId) {
    await update(ref(database, `${DATABASE_PATHS.NOTIFICATIONS}/${userId}/${notificationId}`), {
      isRead: true,
      readAt: new Date().toISOString()
    });
  },

  async markAllAsRead(userId) {
    const notifications = await this.getUserNotifications(userId);
    const updates = {};
    notifications.forEach(notification => {
      if (!notification.isRead) {
        updates[`${notification.notificationId}/isRead`] = true;
        updates[`${notification.notificationId}/readAt`] = new Date().toISOString();
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(database, `${DATABASE_PATHS.NOTIFICATIONS}/${userId}`), updates);
    }
  },

  async deleteNotification(userId, notificationId) {
    await remove(ref(database, `${DATABASE_PATHS.NOTIFICATIONS}/${userId}/${notificationId}`));
  },

  async clearAllNotifications(userId) {
    await remove(ref(database, `${DATABASE_PATHS.NOTIFICATIONS}/${userId}`));
  },

  subscribeToNotifications(userId, callback) {
    const userNotifRef = ref(database, `${DATABASE_PATHS.NOTIFICATIONS}/${userId}`);
    const unsubscribe = onValue(userNotifRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const notifications = Object.keys(data)
        .map(key => ({ id: key, ...data[key] }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(notifications);
    });
    return () => off(userNotifRef, 'value', unsubscribe);
  },

  async notifyNewTask(userId, task) {
    return this.createNotification(userId, {
      type: 'new_task',
      title: 'New Task Assigned',
      message: `You have been assigned to collect waste from ${task.binName}`,
      data: { taskId: task.taskId, binId: task.binId }
    });
  },

  async notifyTaskCompleted(userId, task) {
    return this.createNotification(userId, {
      type: 'task_completed',
      title: 'Task Completed',
      message: `Collection task for ${task.binName} has been completed`,
      data: { taskId: task.taskId, binId: task.binId }
    });
  },

  async notifyAlert(userId, alert) {
    return this.createNotification(userId, {
      type: 'alert',
      title: alert.type,
      message: alert.message,
      data: { alertId: alert.alertId, binId: alert.binId }
    });
  },

  getUnreadCount(notifications) {
    return notifications.filter(n => !n.isRead).length;
  }
};

export default notificationService;
