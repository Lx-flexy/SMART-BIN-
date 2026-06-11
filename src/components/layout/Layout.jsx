import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { useAuth } from '../../contexts/AuthContext'
import { ref, onValue, push, set, update } from 'firebase/database'
import { database, getFcmToken, onFcmMessage } from '../../config/firebase'

function RealtimeAutomation() {
  const { currentUser } = useAuth()
  const [settings, setSettings] = useState({
    alerts: {
      fullBinThreshold: 80,
      lowBatteryThreshold: 20,
      offlineTimeoutMinutes: 30
    },
    collection: {
      autoAssignTasks: false
    }
  })
  const [bins, setBins] = useState([])
  const [alerts, setAlerts] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])

  const createNotification = async (payload) => {
    const notificationRef = push(ref(database, 'Notifications'))
    await set(notificationRef, {
      ...payload,
      read: false,
      createdAt: new Date().toISOString()
    })
  }

  const createAlert = async (alertData) => {
    const alertRef = push(ref(database, 'Alerts'))
    await set(alertRef, alertData)
    await createNotification({
      title: alertData.title,
      message: alertData.message,
      type: alertData.type,
      binId: alertData.binId,
      category: 'alert',
      userId: alertData.userId || null
    })
    return alertRef.key
  }

  const createTask = async ({ bin, alertId }) => {
    const taskRef = push(ref(database, 'Tasks'))
    const taskOwner = users.find(user => user.role === 'collection_staff')
    const assignedTo = settings.collection.autoAssignTasks && taskOwner ? taskOwner.uid : ''
    const assignedToName = taskOwner ? taskOwner.name : ''
    const taskPayload = {
      title: `Collect bin ${bin.binId || bin.id}`,
      binId: bin.binId || bin.id,
      binDbId: bin.id,
      zone: bin.zone || 'Zone 1',
      priority: 'high',
      status: assignedTo ? 'assigned' : 'pending',
      assignedTo,
      assignedToName,
      alertId: alertId || '',
      notes: 'Auto-generated task from full bin alert',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await set(taskRef, taskPayload)
    await createNotification({
      title: 'Collection Task Created',
      message: `Task created for bin ${taskPayload.binId}`,
      type: 'task',
      taskId: taskRef.key,
      binId: taskPayload.binDbId,
      userId: assignedTo || null,
      category: 'task'
    })
    return taskRef.key
  }

  useEffect(() => {
    if (!currentUser) return

    const settingsRef = ref(database, 'Settings')
    const binsRef = ref(database, 'Bins')
    const alertsRef = ref(database, 'Alerts')
    const tasksRef = ref(database, 'Tasks')
    const usersRef = ref(database, 'Users')

    const unsubscribers = [
      onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          setSettings((prev) => ({
            ...prev,
            ...snapshot.val()
          }))
        }
      }),
      onValue(binsRef, (snapshot) => {
        if (snapshot.exists()) {
          const binsData = snapshot.val()
          setBins(Object.entries(binsData).map(([id, data]) => ({ id, ...data })))
        } else {
          setBins([])
        }
      }),
      onValue(alertsRef, (snapshot) => {
        if (snapshot.exists()) {
          const alertsData = snapshot.val()
          setAlerts(Object.entries(alertsData).map(([id, data]) => ({ id, ...data })))
        } else {
          setAlerts([])
        }
      }),
      onValue(tasksRef, (snapshot) => {
        if (snapshot.exists()) {
          const tasksData = snapshot.val()
          setTasks(Object.entries(tasksData).map(([id, data]) => ({ id, ...data })))
        } else {
          setTasks([])
        }
      }),
      onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val()
          setUsers(Object.entries(usersData).map(([uid, data]) => ({ uid, ...data })))
        } else {
          setUsers([])
        }
      })
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !bins.length || !users.length) return

    const processBins = async () => {
      const now = Date.now()
      for (const bin of bins) {
        if (!bin.id) continue

        const fullThreshold = settings.alerts?.fullBinThreshold ?? 80
        const lowBatteryThreshold = settings.alerts?.lowBatteryThreshold ?? 20
        const hasActiveAlert = (type) => alerts.some(alert => alert.binId === bin.id && alert.type === type && !alert.resolved)
        const hasOpenTask = tasks.some(task => task.binDbId === bin.id && ['pending', 'assigned', 'in_progress'].includes(task.status))

        if (bin.fillLevel >= fullThreshold && !hasActiveAlert('full_bin')) {
          const alertId = await createAlert({
            binId: bin.id,
            title: `Bin ${bin.binId || bin.id} is full`,
            message: `Fill level reached ${bin.fillLevel}%`,
            type: 'full_bin',
            status: 'open',
            resolved: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            binDetails: bin,
            userId: null
          })
          if (!hasOpenTask) {
            await createTask({ bin, alertId })
          }
        }

        if (bin.battery <= lowBatteryThreshold && !hasActiveAlert('low_battery')) {
          await createAlert({
            binId: bin.id,
            title: `Low battery on ${bin.binId || bin.id}`,
            message: `Battery is at ${bin.battery}%`,
            type: 'low_battery',
            status: 'open',
            resolved: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            binDetails: bin,
            userId: null
          })
        }

        if ((bin.status === 'offline' || bin.networkStatus === 'offline') && !hasActiveAlert('offline')) {
          await createAlert({
            binId: bin.id,
            title: `Bin ${bin.binId || bin.id} offline`,
            message: 'Device stopped sending data and may need service',
            type: 'offline',
            status: 'open',
            resolved: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            binDetails: bin,
            userId: null
          })
        }
      }
    }

    processBins()
  }, [bins, alerts, tasks, settings, users, currentUser])

  useEffect(() => {
    if (!currentUser || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const swUrl = new URL('../../firebase-messaging-sw.js', import.meta.url)
    navigator.serviceWorker.register(swUrl, { type: 'module' })
      .then(async () => {
        const token = await getFcmToken(currentUser.uid)
        if (token) {
          console.log('FCM token registered:', token)
        }
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })

    const unsubscribe = onFcmMessage(async (payload) => {
      if (payload?.notification) {
        const title = payload.notification.title || 'New Notification'
        const body = payload.notification.body || ''
        if (Notification.permission === 'granted') {
          new Notification(title, { body })
        }
        await createNotification({
          title,
          message: body,
          type: 'push',
          userId: currentUser.uid,
          category: 'push'
        })
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  return null
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  const getPageTitle = () => {
    const path = location.pathname.replace(/^\//, '').split('/')[0]
    const titles = {
      dashboard: 'Dashboard',
      bins: 'Bin Management',
      alerts: 'Alert Management',
      notifications: 'Notifications',
      map: 'Live Map',
      collections: 'Collection Management',
      analytics: 'Analytics',
      reports: 'Reports',
      users: 'User Management',
      settings: 'Settings',
      profile: 'My Profile'
    }
    return titles[path] || 'Dashboard'
  }

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div 
          className="sidebar-overlay mobile-only" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <main className="main-content">
        <Header 
          title={getPageTitle()} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        <RealtimeAutomation />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

export default Layout
