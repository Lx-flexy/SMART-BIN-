import { useState, useEffect } from 'react';
import { useBins } from '../contexts/BinContext';
import { useTasks } from '../contexts/TaskContext';
import { useAlerts } from '../contexts/AlertContext';
import { analyticsService } from '../services/analyticsService';
import { format, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

const Analytics = () => {
  const { bins, statistics: binStats } = useBins();
  const { tasks, statistics: taskStats } = useTasks();
  const { alerts, statistics: alertStats } = useAlerts();
  const [dateRange, setDateRange] = useState('week');
  const [dailyStats, setDailyStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      await analyticsService.calculateDailyStats(bins, tasks, alerts);
      const stats = await analyticsService.getWeeklyStats(new Date());
      setDailyStats(stats);
      setLoading(false);
    };

    if (bins.length > 0 && tasks.length >= 0 && alerts.length >= 0) {
      loadAnalytics();
    }
  }, [bins, tasks, alerts, dateRange]);

  const chartData = analyticsService.getChartData(
    dailyStats,
    dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 1
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#E2E8F0'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const zoneData = bins.reduce((acc, bin) => {
    acc[bin.zone] = (acc[bin.zone] || 0) + 1;
    return acc;
  }, {});

  const zoneChartData = {
    labels: Object.keys(zoneData),
    datasets: [{
      data: Object.values(zoneData),
      backgroundColor: [
        '#16A34A', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'
      ],
      borderWidth: 0
    }]
  };

  const fillDistributionData = {
    labels: ['Empty (0-49%)', 'Medium (50-79%)', 'Full (80-100%)'],
    datasets: [{
      label: 'Bins',
      data: [binStats?.empty || 0, binStats?.medium || 0, binStats?.full || 0],
      backgroundColor: ['#16A34A', '#F59E0B', '#EF4444'],
      borderRadius: 4
    }]
  };

  const completionData = {
    labels: ['Pending', 'Assigned', 'In Progress', 'Completed'],
    datasets: [{
      label: 'Tasks',
      data: [
        taskStats?.pending || 0,
        taskStats?.assigned || 0,
        taskStats?.inProgress || 0,
        taskStats?.completed || 0
      ],
      backgroundColor: ['#F59E0B', '#3B82F6', '#16A34A', '#22C55E'],
      borderRadius: 4
    }]
  };

  const efficiencyRate = taskStats?.total > 0
    ? Math.round((taskStats?.completed / taskStats?.total) * 100)
    : 0;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Comprehensive waste management insights</p>
        </div>
        <div className="page-actions">
          <select
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="analytics-card highlight">
          <div className="analytics-card-content">
            <h3>Collection Efficiency</h3>
            <div className="efficiency-circle">
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
                  stroke="#16A34A"
                  strokeWidth="3"
                  strokeDasharray={`${efficiencyRate}, 100`}
                />
              </svg>
              <span className="efficiency-value">{efficiencyRate}%</span>
            </div>
            <p>{taskStats?.completed || 0} of {taskStats?.total || 0} tasks completed</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-content">
            <h3>Average Fill Level</h3>
            <span className="analytics-value">{binStats?.avgFillLevel || 0}%</span>
            <p>Across all bins</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-content">
            <h3>Average Battery</h3>
            <span className="analytics-value">{binStats?.avgBattery || 0}%</span>
            <p>Device health status</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-content">
            <h3>Active Alerts</h3>
            <span className="analytics-value text-danger">{alertStats?.active || 0}</span>
            <p>{alertStats?.critical || 0} critical alerts</p>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Fill Level Trends</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <Line
                data={{
                  labels: chartData.labels,
                  datasets: [{
                    label: 'Average Fill Level',
                    data: chartData.fillLevels,
                    borderColor: '#16A34A',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: true,
                    tension: 0.4
                  }]
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>

        <div className="analytics-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Collections & Alerts</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <Bar
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: 'Collections',
                      data: chartData.collections,
                      backgroundColor: '#16A34A',
                      borderRadius: 4
                    },
                    {
                      label: 'Alerts',
                      data: chartData.alerts,
                      backgroundColor: '#F59E0B',
                      borderRadius: 4
                    }
                  ]
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>

        <div className="analytics-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Bin Distribution by Zone</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper doughnut">
              <Doughnut data={zoneChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }} />
            </div>
          </div>
        </div>

        <div className="analytics-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Fill Level Distribution</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <Bar data={fillDistributionData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="analytics-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Task Completion Status</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <Bar data={completionData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="analytics-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Device Health</h3>
          </div>
          <div className="card-body">
            <div className="device-health">
              <div className="health-item">
                <span className="health-label">Online Devices</span>
                <span className="health-value online">{binStats?.online || 0}</span>
              </div>
              <div className="health-item">
                <span className="health-label">Offline Devices</span>
                <span className="health-value offline">{binStats?.offline || 0}</span>
              </div>
              <div className="health-item">
                <span className="health-label">Low Battery</span>
                <span className="health-value warning">{binStats?.lowBattery || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
