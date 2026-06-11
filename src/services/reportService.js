import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export const reportService = {
  generatePDFReport(title, data, columns) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setTextColor(22, 163, 74);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, 30, { align: 'center' });

    const startX = 14;
    let startY = 45;
    const cellHeight = 10;
    const cellWidth = (pageWidth - 28) / columns.length;

    doc.setFillColor(240, 240, 240);
    doc.rect(startX, startY - 5, pageWidth - 28, cellHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    columns.forEach((col, index) => {
      doc.text(col.header, startX + index * cellWidth + 2, startY);
    });

    startY += cellHeight;

    data.forEach(row => {
      if (startY > 280) {
        doc.addPage();
        startY = 20;
      }

      columns.forEach((col, index) => {
        const value = String(row[col.key] || 'N/A');
        doc.text(value.substring(0, 20), startX + index * cellWidth + 2, startY);
      });
      startY += cellHeight;
    });

    return doc;
  },

  exportToPDF(title, data, columns, filename) {
    const doc = this.generatePDFReport(title, data, columns);
    doc.save(`${filename}.pdf`);
  },

  exportToExcel(data, columns, filename) {
    const worksheetData = [
      columns.map(col => col.header),
      ...data.map(row => columns.map(col => row[col.key] || 'N/A'))
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  },

  exportToCSV(data, columns, filename) {
    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(row =>
      columns.map(col => {
        const value = row[col.key] || 'N/A';
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${filename}.csv`);
  },

  generateBinReport(bins) {
    const columns = [
      { key: 'binId', header: 'Bin ID' },
      { key: 'name', header: 'Name' },
      { key: 'fillLevel', header: 'Fill Level (%)' },
      { key: 'battery', header: 'Battery (%)' },
      { key: 'status', header: 'Status' },
      { key: 'zone', header: 'Zone' },
      { key: 'lastUpdate', header: 'Last Update' }
    ];

    const data = bins.map(bin => ({
      ...bin,
      fillLevel: `${bin.fillLevel}%`,
      battery: `${bin.battery}%`,
      lastUpdate: format(new Date(bin.lastUpdate), 'MMM dd, yyyy HH:mm')
    }));

    return { columns, data };
  },

  generateTaskReport(tasks) {
    const columns = [
      { key: 'taskId', header: 'Task ID' },
      { key: 'binName', header: 'Bin' },
      { key: 'zone', header: 'Zone' },
      { key: 'status', header: 'Status' },
      { key: 'assignedToName', header: 'Assigned To' },
      { key: 'createdAt', header: 'Created' },
      { key: 'completedAt', header: 'Completed' }
    ];

    const data = tasks.map(task => ({
      ...task,
      createdAt: format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm'),
      completedAt: task.completedAt ? format(new Date(task.completedAt), 'MMM dd, yyyy HH:mm') : 'N/A',
      assignedToName: task.assignedToName || 'Unassigned'
    }));

    return { columns, data };
  },

  generateAlertReport(alerts) {
    const columns = [
      { key: 'alertId', header: 'Alert ID' },
      { key: 'type', header: 'Type' },
      { key: 'severity', header: 'Severity' },
      { key: 'binName', header: 'Bin' },
      { key: 'zone', header: 'Zone' },
      { key: 'status', header: 'Status' },
      { key: 'createdAt', header: 'Created' }
    ];

    const data = alerts.map(alert => ({
      ...alert,
      createdAt: format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm')
    }));

    return { columns, data };
  },

  generateDailySummaryReport(date, bins, tasks, alerts) {
    const columns = [
      { key: 'metric', header: 'Metric' },
      { key: 'value', header: 'Value' }
    ];

    const data = [
      { metric: 'Total Bins', value: bins.length },
      { metric: 'Full Bins', value: bins.filter(b => b.status === 'full').length },
      { metric: 'Medium Bins', value: bins.filter(b => b.status === 'medium').length },
      { metric: 'Empty Bins', value: bins.filter(b => b.status === 'empty').length },
      { metric: 'Offline Bins', value: bins.filter(b => b.status === 'offline').length },
      { metric: 'Average Fill Level', value: `${Math.round(bins.reduce((s, b) => s + (b.fillLevel || 0), 0) / bins.length)}%` },
      { metric: 'Tasks Created Today', value: tasks.length },
      { metric: 'Tasks Completed Today', value: tasks.filter(t => t.status === 'completed').length },
      { metric: 'Alerts Generated Today', value: alerts.length },
      { metric: 'Active Alerts', value: alerts.filter(a => a.status === 'active').length }
    ];

    return { columns, data };
  }
};

export default reportService;
