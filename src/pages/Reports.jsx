import { useState } from 'react';
import { useBins } from '../contexts/BinContext';
import { useTasks } from '../contexts/TaskContext';
import { useAlerts } from '../contexts/AlertContext';
import { reportService } from '../services/reportService';
import { ZONES } from '../utils/constants';
import { format } from 'date-fns';
import './Reports.css';

const Reports = () => {
  const { bins } = useBins();
  const { tasks } = useTasks();
  const { alerts } = useAlerts();
  const [reportType, setReportType] = useState('bins');
  const [selectedZone, setSelectedZone] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);

  const getFilteredData = () => {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    switch (reportType) {
      case 'bins':
        const filteredBins = selectedZone === 'all'
          ? bins
          : bins.filter(b => b.zone === selectedZone);
        return reportService.generateBinReport(filteredBins);
      case 'tasks':
        const filteredTasks = tasks.filter(t => {
          const created = new Date(t.createdAt);
          return created >= fromDate && created <= toDate &&
            (selectedZone === 'all' || t.zone === selectedZone);
        });
        return reportService.generateTaskReport(filteredTasks);
      case 'alerts':
        const filteredAlerts = alerts.filter(a => {
          const created = new Date(a.createdAt);
          return created >= fromDate && created <= toDate &&
            (selectedZone === 'all' || a.zone === selectedZone);
        });
        return reportService.generateAlertReport(filteredAlerts);
      case 'summary':
        return reportService.generateDailySummaryReport(new Date(), bins, tasks, alerts);
      default:
        return { columns: [], data: [] };
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const { columns, data } = getFilteredData();
      const filename = `${reportType}_report_${format(new Date(), 'yyyyMMdd')}`;

      switch (format) {
        case 'pdf':
          reportService.exportToPDF(`${reportType.toUpperCase()} Report`, data, columns, filename);
          break;
        case 'excel':
          reportService.exportToExcel(data, columns, filename);
          break;
        case 'csv':
          reportService.exportToCSV(data, columns, filename);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const { columns, data } = getFilteredData();

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and export comprehensive reports</p>
        </div>
      </div>

      <div className="reports-filters">
        <div className="filter-group">
          <label className="form-label">Report Type</label>
          <select
            className="form-select"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="bins">Bin Report</option>
            <option value="tasks">Task Report</option>
            <option value="alerts">Alert Report</option>
            <option value="summary">Daily Summary</option>
          </select>
        </div>

        {(reportType === 'bins' || reportType === 'tasks' || reportType === 'alerts') && (
          <div className="filter-group">
            <label className="form-label">Zone</label>
            <select
              className="form-select"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
            >
              <option value="all">All Zones</option>
              {ZONES.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        )}

        {reportType !== 'summary' && (
          <>
            <div className="filter-group">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="reports-actions">
        <button
          className="btn btn-secondary"
          onClick={() => handleExport('pdf')}
          disabled={exporting || data.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          Export PDF
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleExport('excel')}
          disabled={exporting || data.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          Export Excel
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleExport('csv')}
          disabled={exporting || data.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="report-preview">
        <div className="report-preview-header">
          <h2>{reportType.toUpperCase()} Report</h2>
          <span className="report-date">Generated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <tr key={index}>
                    {columns.map(col => (
                      <td key={col.key}>{row[col.key] || 'N/A'}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center text-muted">
                    No data available for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="report-footer">
          <span className="report-stats">
            Showing {data.length} records
          </span>
        </div>
      </div>
    </div>
  );
};

export default Reports;
