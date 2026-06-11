import { database } from '../firebase/config';
import { ref, set, get, update, push, onValue, off } from 'firebase/database';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DATABASE_PATHS } from '../utils/constants';

const analyticsRef = ref(database, DATABASE_PATHS.ANALYTICS);

export const analyticsService = {
  async recordDailyStats(date, stats) {
    const dateKey = format(date, 'yyyy-MM-dd');
    await set(ref(database, `${DATABASE_PATHS.ANALYTICS}/daily/${dateKey}`), {
      date: dateKey,
      ...stats,
      updatedAt: new Date().toISOString()
    });
  },

  async getDailyStats(date) {
    const dateKey = format(date, 'yyyy-MM-dd');
    const snapshot = await get(ref(database, `${DATABASE_PATHS.ANALYTICS}/daily/${dateKey}`));
    return snapshot.exists() ? snapshot.val() : null;
  },

  async getWeeklyStats(startDate) {
    const start = startOfWeek(startDate);
    const end = endOfWeek(startDate);
    const days = eachDayOfInterval({ start, end });
    const stats = {};

    for (const day of days) {
      const dayStats = await this.getDailyStats(day);
      if (dayStats) {
        stats[format(day, 'yyyy-MM-dd')] = dayStats;
      }
    }

    return stats;
  },

  async getMonthlyStats(startDate) {
    const start = startOfMonth(startDate);
    const end = endOfMonth(startDate);
    const days = eachDayOfInterval({ start, end });
    const stats = {};

    for (const day of days) {
      const dayStats = await this.getDailyStats(day);
      if (dayStats) {
        stats[format(day, 'yyyy-MM-dd')] = dayStats;
      }
    }

    return stats;
  },

  async calculateDailyStats(bins, tasks, alerts) {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const todayTasks = tasks.filter(task =>
      format(new Date(task.createdAt), 'yyyy-MM-dd') === todayStr
    );

    const todayAlerts = alerts.filter(alert =>
      format(new Date(alert.createdAt), 'yyyy-MM-dd') === todayStr
    );

    const stats = {
      totalBins: bins.length,
      fullBins: bins.filter(b => b.status === 'full').length,
      mediumBins: bins.filter(b => b.status === 'medium').length,
      emptyBins: bins.filter(b => b.status === 'empty').length,
      offlineBins: bins.filter(b => b.status === 'offline').length,
      avgFillLevel: Math.round(bins.reduce((sum, b) => sum + (b.fillLevel || 0), 0) / bins.length) || 0,
      avgBattery: Math.round(bins.reduce((sum, b) => sum + (b.battery || 0), 0) / bins.length) || 0,
      tasksCreated: todayTasks.length,
      tasksCompleted: todayTasks.filter(t => t.status === 'completed').length,
      tasksPending: todayTasks.filter(t => t.status === 'pending').length,
      alertsGenerated: todayAlerts.length,
      alertsCritical: todayAlerts.filter(a => a.severity === 'critical').length,
      collectionEfficiency: todayTasks.length > 0
        ? Math.round((todayTasks.filter(t => t.status === 'completed').length / todayTasks.length) * 100)
        : 0
    };

    await this.recordDailyStats(today, stats);
    return stats;
  },

  subscribeToDailyStats(callback) {
    const dailyRef = ref(database, `${DATABASE_PATHS.ANALYTICS}/daily`);
    const unsubscribe = onValue(dailyRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback({});
        return;
      }
      callback(snapshot.val());
    });
    return () => off(dailyRef, 'value', unsubscribe);
  },

  async generateZoneReport(bins, tasks, zone) {
    const zoneBins = bins.filter(b => b.zone === zone);
    const zoneTasks = tasks.filter(t => t.zone === zone);

    return {
      zone,
      totalBins: zoneBins.length,
      fullBins: zoneBins.filter(b => b.status === 'full').length,
      avgFillLevel: Math.round(zoneBins.reduce((sum, b) => sum + (b.fillLevel || 0), 0) / zoneBins.length) || 0,
      totalTasks: zoneTasks.length,
      completedTasks: zoneTasks.filter(t => t.status === 'completed').length,
      pendingTasks: zoneTasks.filter(t => t.status === 'pending').length,
      efficiency: zoneTasks.length > 0
        ? Math.round((zoneTasks.filter(t => t.status === 'completed').length / zoneTasks.length) * 100)
        : 0
    };
  },

  async generateAllZoneReports(bins, tasks) {
    const zones = [...new Set(bins.map(b => b.zone))];
    const reports = {};

    for (const zone of zones) {
      reports[zone] = await this.generateZoneReport(bins, tasks, zone);
    }

    return reports;
  },

  getChartData(dailyStats, days = 7) {
    const chartData = {
      labels: [],
      fillLevels: [],
      collections: [],
      alerts: []
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const stats = dailyStats[dateKey] || {};

      chartData.labels.push(format(date, 'MMM dd'));
      chartData.fillLevels.push(stats.avgFillLevel || 0);
      chartData.collections.push(stats.tasksCompleted || 0);
      chartData.alerts.push(stats.alertsGenerated || 0);
    }

    return chartData;
  },

  async recordZoneAnalytics(zone, data) {
    const dateKey = format(new Date(), 'yyyy-MM-dd');
    await push(ref(database, `${DATABASE_PATHS.ANALYTICS}/zones/${zone}/${dateKey}`), {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

export default analyticsService;
