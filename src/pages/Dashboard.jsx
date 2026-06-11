import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBins } from '../contexts/BinContext';
import { useAlerts } from '../contexts/AlertContext';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { BIN_STATUS, TASK_STATUS, ROLES } from '../utils/constants';
import { formatDateTime, getRelativeTime } from '../utils/helpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const Dashboard = () => {
  const { bins, statistics: binStats, loading: binsLoading } = useBins();
  const { activeAlerts, statistics: alertStats, loading: alertsLoading } = useAlerts();
  const { tasks, statistics: taskStats, myTasks, loading: tasksLoading } = useTasks();
  const { userProfile } = useAuth();
  const [timeRange, setTimeRange] = useState('today');

  const isLoading = binsLoading || alertsLoading || tasksLoading;

  const statCards = [
    {
      label: 'Total Bins',
      value: binStats?.total || 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      ),
      color: 'primary',
      trend: `${binStats?.online || 0} online`
    },
    {
      label: 'Full Bins',
      value: binStats?.full || 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
      ),
      color: 'danger',
      trend: `${Math.round((binStats?.full / (binStats?.total || 1)) * 100)}% capacity`
    },
    {
      label: 'Active Alerts',
      value: alertStats?.active || 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
      ),
      color: 'warning',
      trend: `${alertStats?.critical || 0} critical`
    },
    {
      label: 'Pending Tasks',
      value: taskStats?.pending + taskStats?.assigned || 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      color: 'info',
      trend: `${taskStats?.completed || 0} completed`
    }
  ];

  const binStatusData = {
    labels: ['Empty', 'Medium', 'Full', 'Offline'],
    datasets: [{
      data: [binStats?.empty || 0, binStats?.medium || 0, binStats?.full || 0, binStats?.offline || 0],
      backgroundColor: ['#16A34A', '#F59E0B', '#EF4444', '#1E293B'],
      borderWidth: 0
    }]
  };

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Collections',
        data: [12, 19, 8, 15, 22, 18, 10],
        backgroundColor: '#16A34A',
        borderRadius: 4
      },
      {
        label: 'Alerts',
        data: [5, 8, 3, 6, 9, 4, 2],
        backgroundColor: '#F59E0B',
        borderRadius: 4
      }
    ]
  };

  const fillTrendData = {
    labels: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM'],
    datasets: [{
      label: 'Avg Fill Level',
      data: [25, 32, 45, 58, 62, 55, 40],
      borderColor: '#16A34A',
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

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
    }
  };

  const barOptions = {
    ...chartOptions,
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

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
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

  const recentAlerts = activeAlerts.slice(0, 5);
  const recentTasks = tasks.slice(0, 5);
  const fullBins = bins.filter(b => b.status === BIN_STATUS.FULL).slice(0, 5);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner spinner-lg"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {userProfile?.name || 'User'}</p>
        </div>
        <div className="dashboard-header-actions">
          <select
            className="form-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card stat-card-${stat.color}`}>
            <div className={`stat-icon stat-icon-${stat.color}`}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-trend">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Bin Status Overview</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper doughnut-chart">
              <Doughnut data={binStatusData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Weekly Activity</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <Bar data={weeklyData} options={barOptions} />
            </div>
          </div>
        </div>

        <div className="dashboard-card dashboard-card-wide">
          <div className="card-header">
            <h3 className="card-title">Fill Level Trend</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <Line data={fillTrendData} options={lineOptions} />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Active Alerts</h3>
            <Link to="/alerts" className="card-link">View All</Link>
          </div>
          <div className="card-body p-0">
            {recentAlerts.length > 0 ? (
              <div className="alert-list">
                {recentAlerts.map(alert => (
                  <div key={alert.alertId} className={`alert-item alert-severity-${alert.severity}`}>
                    <div className="alert-item-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                    </div>
                    <div className="alert-item-content">
                      <span className="alert-item-title">{alert.binName}</span>
                      <span className="alert-item-message">{alert.message}</span>
                      <span className="alert-item-time">{getRelativeTime(alert.createdAt)}</span>
                    </div>
                    <span className={`badge badge-${alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'info'}`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Full Bins</h3>
            <Link to="/bins" className="card-link">View All</Link>
          </div>
          <div className="card-body p-0">
            {fullBins.length > 0 ? (
              <div className="bin-list">
                {fullBins.map(bin => (
                  <div key={bin.binId} className="bin-item">
                    <div className="bin-item-icon bin-full">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </div>
                    <div className="bin-item-content">
                      <span className="bin-item-name">{bin.name}</span>
                      <span className="bin-item-zone">{bin.zone}</span>
                    </div>
                    <div className="bin-item-fill">
                      <div className="fill-bar">
                        <div className="fill-bar-inner" style={{ width: `${bin.fillLevel}%` }}></div>
                      </div>
                      <span className="fill-percent">{bin.fillLevel}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No full bins</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Recent Tasks</h3>
            <Link to="/tasks" className="card-link">View All</Link>
          </div>
          <div className="card-body p-0">
            {recentTasks.length > 0 ? (
              <div className="task-list">
                {recentTasks.map(task => (
                  <div key={task.taskId} className="task-item">
                    <div className="task-item-content">
                      <span className="task-item-bin">{task.binName}</span>
                      <span className="task-item-zone">{task.zone}</span>
                    </div>
                    <span className={`badge badge-${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'gray'}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {userProfile?.role === ROLES.COLLECTION_STAFF && myTasks.length > 0 && (
        <div className="my-tasks-section">
          <h2>My Assigned Tasks</h2>
          <div className="my-tasks-grid">
            {myTasks.slice(0, 4).map(task => (
              <Link to={`/tasks/${task.taskId}`} key={task.taskId} className="my-task-card">
                <span className={`badge badge-${task.status === 'pending' ? 'warning' : task.status === 'in_progress' ? 'info' : 'success'}`}>
                  {task.status}
                </span>
                <h4>{task.binName}</h4>
                <p>{task.zone}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
