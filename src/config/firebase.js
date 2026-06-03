import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase, ref, set } from 'firebase/database'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBKe9JcSdwxzMwZulkZruhoxX4S6rNk90g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-been.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://smart-been-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-been",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-been.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "251660841816",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ||"1:251660841816:web:47508f4bf3cba71c71ab2d"
}
// Initialize app only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const database = getDatabase(app)
export const storage = getStorage(app)
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

export async function getFcmToken(uid) {
  if (typeof window === 'undefined' || !messaging || !('Notification' in window)) {
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return null
  }

  const options = import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY
    ? { vapidKey: import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY }
    : undefined

  const token = await getToken(messaging, options)

  if (token && uid) {
    await set(ref(database, `Users/${uid}/fcmToken`), token)
  }

  return token
}

export function onFcmMessage(callback) {
  if (!messaging) {
    return () => {}
  }

  return onMessage(messaging, callback)
}

export default app

// Lazy analytics initializer to avoid ad-blocker issues and to control initialization
export async function initAnalytics() {
  try {
    // Dynamically import analytics to avoid bundling analytics into main bundle
    const { getAnalytics } = await import('firebase/analytics')
    // Only initialize if window is available and analytics isn't already set
    if (typeof window !== 'undefined') {
      try {
        return getAnalytics(app)
      } catch (err) {
        console.warn('Analytics initialization skipped or blocked:', err)
        return null
      }
    }
  } catch (e) {
    console.warn('Firebase analytics module not available or blocked by client:', e)
    return null
  }
}
