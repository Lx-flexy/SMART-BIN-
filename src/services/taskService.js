import { database } from '../firebase/config';
import { ref, set, get, update, remove, onValue, off, push } from 'firebase/database';
import { DATABASE_PATHS, TASK_STATUS } from '../utils/constants';

const tasksRef = ref(database, DATABASE_PATHS.TASKS);

export const taskService = {
  async createTask(taskData) {
    const taskId = `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      taskId,
      binId: taskData.binId,
      binName: taskData.binName,
      zone: taskData.zone,
      type: taskData.type || 'collection',
      priority: taskData.priority || 'normal',
      status: TASK_STATUS.PENDING,
      assignedTo: taskData.assignedTo || null,
      assignedToName: taskData.assignedToName || null,
      assignedAt: null,
      description: taskData.description || '',
      location: taskData.location || null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      completedBy: null,
      notes: null,
      createdBy: taskData.createdBy || 'system'
    };

    await set(ref(database, `${DATABASE_PATHS.TASKS}/${taskId}`), task);
    return task;
  },

  async getTask(taskId) {
    const snapshot = await get(ref(database, `${DATABASE_PATHS.TASKS}/${taskId}`));
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getAllTasks() {
    const snapshot = await get(tasksRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  },

  async assignTask(taskId, staffId, staffName) {
    await update(ref(database, `${DATABASE_PATHS.TASKS}/${taskId}`), {
      status: TASK_STATUS.ASSIGNED,
      assignedTo: staffId,
      assignedToName: staffName,
      assignedAt: new Date().toISOString()
    });
    return this.getTask(taskId);
  },

  async startTask(taskId) {
    await update(ref(database, `${DATABASE_PATHS.TASKS}/${taskId}`), {
      status: TASK_STATUS.IN_PROGRESS,
      startedAt: new Date().toISOString()
    });
    return this.getTask(taskId);
  },

  async completeTask(taskId, notes = '', completedBy) {
    await update(ref(database, `${DATABASE_PATHS.TASKS}/${taskId}`), {
      status: TASK_STATUS.COMPLETED,
      completedAt: new Date().toISOString(),
      completedBy,
      notes
    });
    return this.getTask(taskId);
  },

  async updateTask(taskId, updates) {
    await update(ref(database, `${DATABASE_PATHS.TASKS}/${taskId}`), updates);
    return this.getTask(taskId);
  },

  async deleteTask(taskId) {
    await remove(ref(database, `${DATABASE_PATHS.TASKS}/${taskId}`));
  },

  subscribeToTasks(callback) {
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const tasks = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });
    return () => off(tasksRef, 'value', unsubscribe);
  },

  subscribeToUserTasks(userId, callback) {
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const tasks = Object.keys(data)
        .map(key => ({ id: key, ...data[key] }))
        .filter(task => task.assignedTo === userId);
      callback(tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });
    return () => off(tasksRef, 'value', unsubscribe);
  },

  async getTasksByStatus(status) {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => task.status === status);
  },

  async getTasksByZone(zone) {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => task.zone === zone);
  },

  async createCollectionTask(bin) {
    return this.createTask({
      binId: bin.binId,
      binName: bin.name,
      zone: bin.zone,
      type: 'collection',
      priority: bin.fillLevel >= 95 ? 'high' : 'normal',
      location: bin.location,
      description: `Collection required for bin ${bin.name} at ${bin.location?.address || bin.zone}`
    });
  },

  getStatistics(tasks) {
    const stats = {
      total: tasks.length,
      pending: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      completedToday: 0,
      avgCompletionTime: 0
    };

    if (tasks.length === 0) return stats;

    let totalCompletionTime = 0;
    let completedCount = 0;
    const today = new Date().toDateString();

    tasks.forEach(task => {
      switch (task.status) {
        case TASK_STATUS.PENDING:
          stats.pending++;
          break;
        case TASK_STATUS.ASSIGNED:
          stats.assigned++;
          break;
        case TASK_STATUS.IN_PROGRESS:
          stats.inProgress++;
          break;
        case TASK_STATUS.COMPLETED:
          stats.completed++;
          if (task.completedAt && new Date(task.completedAt).toDateString() === today) {
            stats.completedToday++;
          }
          if (task.createdAt && task.completedAt) {
            totalCompletionTime += new Date(task.completedAt) - new Date(task.createdAt);
            completedCount++;
          }
          break;
      }
    });

    if (completedCount > 0) {
      stats.avgCompletionTime = Math.round(totalCompletionTime / completedCount / (1000 * 60));
    }

    return stats;
  }
};

export default taskService;
