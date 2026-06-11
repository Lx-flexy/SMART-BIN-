import { createContext, useContext, useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = taskService.subscribeToTasks((taskData) => {
      setTasks(taskData);
      setStatistics(taskService.getStatistics(taskData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = taskService.subscribeToUserTasks(user.uid, (userTaskData) => {
        setMyTasks(userTaskData);
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

  const createTask = async (taskData) => {
    setError(null);
    try {
      return await taskService.createTask({
        ...taskData,
        createdBy: user?.uid
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const assignTask = async (taskId, staffId, staffName) => {
    setError(null);
    try {
      return await taskService.assignTask(taskId, staffId, staffName);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const startTask = async (taskId) => {
    setError(null);
    try {
      return await taskService.startTask(taskId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const completeTask = async (taskId, notes = '') => {
    setError(null);
    try {
      return await taskService.completeTask(taskId, notes, user?.uid);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    setError(null);
    try {
      return await taskService.updateTask(taskId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    setError(null);
    try {
      await taskService.deleteTask(taskId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getTasksByZone = (zone) => {
    return tasks.filter(task => task.zone === zone);
  };

  const getTaskById = (taskId) => {
    return tasks.find(task => task.taskId === taskId) || null;
  };

  const value = {
    tasks,
    myTasks,
    statistics,
    loading,
    error,
    createTask,
    assignTask,
    startTask,
    completeTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getTasksByZone,
    getTaskById,
    setError
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;
