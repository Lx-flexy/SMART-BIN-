import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../config/firebase'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { 
  FileText, 
  Download, 
  Calendar,
  FileSpreadsheet,
  Clock,
  MapPin
} from 'lucide-react'

function Reports() {
  const [bins, setBins] = useState([])
  const [tasks, setTasks] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const binsRef = ref(database, 'Bins')
    const tasksRef = ref(database, 'Tasks')
    const alertsRef = ref(database, 'Alerts')

    const unsubscribeBins = onValue(binsRef, (snapshot) => {
      if (snapshot.exists()) {
        const binsData = snapshot.val()
        const binsList = Object.entries(binsData).map(([id, data]) => ({ id, ...data }))
        setBins(binsList)
      }
    })

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData = snapshot.val()
        const tasksList = Object.entries(tasksData).map(([id, data]) => ({ id, ...data }))
        setTasks(tasksList)
      }
    })

    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alertsData = snapshot.val()
        const alertsList = Object.entries(alertsData).map(([id, data]) => ({ id, ...data }))
        setAlerts(alertsList)
      }
      setLoading(false)
    })

    return () => {
      unsubscribeBins()
      unsubscribeTasks()
      unsubscribeAlerts()
    }
  }, [])

  const reportTypes = [
    {
      id: 'daily',
      title: 'Daily Collection Report',
      description: 'Summary of all collections made today',
      icon: Calendar
    },
    {
      id: 'weekly',
      title: 'Weekly Summary Report',
      description: 'Weekly overview of collections, alerts, and bin status',
      icon: FileText
    },
    {
      id: 'monthly',
      title: 'Monthly Analytics Report',
      description: 'Comprehensive monthly performance analysis',
      icon: FileText
    },
    {
      id: 'zone',
      title: 'Zone Performance Report',
      description: 'Performance metrics by zone',
      icon: MapPin
    }
  ]

  const filterDataByDate = (data, dateField = 'createdAt') => {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59, 999)
    
    return data.filter(item => {
      if (!item[dateField]) return false
      const itemDate = new Date(item[dateField])
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  const generatePDF = (reportType) => {
    setGenerating(true)
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFillColor(22, 163, 74)
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text('A5X Smart Waste Management', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`${reportType.title}`, pageWidth / 2, 32, { align: 'center' })
    
    // Date range
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.text(`Report Period: ${dateRange.start} to ${dateRange.end}`, 14, 52)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 58)
    
    let yPos = 70
    
    // Summary Stats
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Summary Statistics', 14, yPos)
    yPos += 10
    
    const filteredTasks = filterDataByDate(tasks)
    const filteredAlerts = filterDataByDate(alerts)
    const completedTasks = filteredTasks.filter(t => t.status === 'completed')
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    
    const stats = [
      ['Total Bins', bins.length.toString()],
      ['Total Collections', completedTasks.length.toString()],
      ['Total Alerts', filteredAlerts.length.toString()],
      ['Resolved Alerts', filteredAlerts.filter(a => a.resolved).length.toString()],
      ['Full Bins', bins.filter(b => b.fillLevel >= 80).length.toString()],
      ['Collection Efficiency', `${bins.length > 0 ? Math.round((bins.filter(b => b.fillLevel < 80).length / bins.length) * 100) : 0}%`]
    ]
    
    stats.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 14, yPos)
      yPos += 6
    })
    
    yPos += 10
    
    // Bin Status Table
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Bin Status Overview', 14, yPos)
    yPos += 10
    
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.text('Bin ID', 14, yPos)
    doc.text('Location', 50, yPos)
    doc.text('Zone', 110, yPos)
    doc.text('Fill Level', 140, yPos)
    doc.text('Status', 170, yPos)
    yPos += 6
    
    doc.setFont(undefined, 'normal')
    bins.slice(0, 15).forEach(bin => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.text(bin.binId || 'N/A', 14, yPos)
      doc.text((bin.location || 'N/A').substring(0, 25), 50, yPos)
      doc.text(bin.zone || 'N/A', 110, yPos)
      doc.text(`${bin.fillLevel || 0}%`, 140, yPos)
      doc.text(bin.fillLevel >= 80 ? 'Full' : bin.fillLevel >= 30 ? 'Medium' : 'Empty', 170, yPos)
      yPos += 5
    })
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' })
      doc.text('A5X Industries - Smart Waste Management Platform', pageWidth / 2, 295, { align: 'center' })
    }
    
    doc.save(`${reportType.id}_report_${dateRange.start}_${dateRange.end}.pdf`)
    setGenerating(false)
  }

  const generateExcel = (reportType) => {
    setGenerating(true)
    
    const filteredTasks = filterDataByDate(tasks)
    const filteredAlerts = filterDataByDate(alerts)
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['A5X Smart Waste Management - ' + reportType.title],
      ['Report Period', `${dateRange.start} to ${dateRange.end}`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Summary Statistics'],
      ['Total Bins', bins.length],
      ['Total Collections', filteredTasks.filter(t => t.status === 'completed').length],
      ['Total Alerts', filteredAlerts.length],
      ['Resolved Alerts', filteredAlerts.filter(a => a.resolved).length],
      ['Collection Efficiency', `${bins.length > 0 ? Math.round((bins.filter(b => b.fillLevel < 80).length / bins.length) * 100) : 0}%`]
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
    
    // Bins sheet
    const binsData = [
      ['Bin ID', 'Location', 'Zone', 'Fill Level', 'Battery', 'Status', 'Last Update']
    ]
    bins.forEach(bin => {
      binsData.push([
        bin.binId || 'N/A',
        bin.location || 'N/A',
        bin.zone || 'N/A',
        `${bin.fillLevel || 0}%`,
        `${bin.battery || 0}%`,
        bin.fillLevel >= 80 ? 'Full' : bin.fillLevel >= 30 ? 'Medium' : 'Empty',
        bin.lastUpdate ? new Date(bin.lastUpdate).toLocaleString() : 'N/A'
      ])
    })
    const binsSheet = XLSX.utils.aoa_to_sheet(binsData)
    XLSX.utils.book_append_sheet(wb, binsSheet, 'Bins')
    
    // Tasks sheet
    const tasksData = [
      ['Bin ID', 'Location', 'Zone', 'Assigned To', 'Priority', 'Status', 'Created', 'Completed']
    ]
    filteredTasks.forEach(task => {
      tasksData.push([
        task.binId || 'N/A',
        task.location || 'N/A',
        task.zone || 'N/A',
        task.assignedToName || 'Unassigned',
        task.priority || 'medium',
        task.status || 'pending',
        task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A',
        task.completedAt ? new Date(task.completedAt).toLocaleString() : 'N/A'
      ])
    })
    const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData)
    XLSX.utils.book_append_sheet(wb, tasksSheet, 'Tasks')
    
    // Alerts sheet
    const alertsData = [
      ['Type', 'Title', 'Message', 'Bin ID', 'Zone', 'Status', 'Created', 'Resolved']
    ]
    filteredAlerts.forEach(alert => {
      alertsData.push([
        alert.type || 'N/A',
        alert.title || 'N/A',
        alert.message || 'N/A',
        alert.binId || 'N/A',
        alert.zone || 'N/A',
        alert.resolved ? 'Resolved' : 'Active',
        alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A',
        alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : 'N/A'
      ])
    })
    const alertsSheet = XLSX.utils.aoa_to_sheet(alertsData)
    XLSX.utils.book_append_sheet(wb, alertsSheet, 'Alerts')
    
    // Generate file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, `${reportType.id}_report_${dateRange.start}_${dateRange.end}.xlsx`)
    
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Date Range Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={20} color="var(--text-light)" />
            <span style={{ fontWeight: 500 }}>Report Period:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span>to</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid-2">
        {reportTypes.map(report => (
          <div 
            key={report.id} 
            className="report-card"
            onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
            style={{ 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              border: selectedReport === report.id ? '2px solid var(--primary)' : '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
              <div className="report-icon">
                <report.icon size={24} />
              </div>
              <div className="report-info" style={{ flex: 1 }}>
                <h4>{report.title}</h4>
                <p>{report.description}</p>
              </div>
            </div>
            
            {selectedReport === report.id && (
              <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginTop: 16, 
                paddingTop: 16, 
                borderTop: '1px solid var(--border)',
                width: '100%'
              }}>
                <button 
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    generatePDF(report)
                  }}
                  disabled={generating}
                >
                  <Download size={18} />
                  {generating ? 'Generating...' : 'Export PDF'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    generateExcel(report)
                  }}
                  disabled={generating}
                >
                  <FileSpreadsheet size={18} />
                  {generating ? 'Generating...' : 'Export Excel'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Quick Stats</h3>
        </div>
        <div className="card-body">
          <div className="stats-grid" style={{ margin: 0 }}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{bins.length}</div>
              <div style={{ color: 'var(--text-light)' }}>Total Bins</div>
            </div>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}>
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div style={{ color: 'var(--text-light)' }}>Collections</div>
            </div>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--warning)' }}>{alerts.length}</div>
              <div style={{ color: 'var(--text-light)' }}>Total Alerts</div>
            </div>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--danger)' }}>
                {bins.filter(b => b.fillLevel >= 80).length}
              </div>
              <div style={{ color: 'var(--text-light)' }}>Full Bins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
