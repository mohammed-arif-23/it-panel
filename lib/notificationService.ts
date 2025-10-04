// Push Notification Service for IT Panel
// Handles push notifications for assignments, seminars, and important updates
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface NotificationPreferences {
  assignments: boolean
  seminars: boolean
  fines: boolean
  cod: boolean
  general: boolean
}

class NotificationService {
  private static instance: NotificationService
  private vapidPublicKey: string = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  private swRegistration: ServiceWorkerRegistration | null = null

  private constructor() {
    // Initialize native notifications if in Capacitor app
    if (typeof window !== 'undefined' && this.isNative()) {
      this.initializeNativeNotifications()
    }
  }

  /**
   * Generate a safe Android notification ID (Java int range)
   */
  private generateNotificationId(): number {
    const maxInt = 2147483647 // Java Integer.MAX_VALUE
    const now = Date.now()
    // Ensure positive, within int range
    return Math.max(1, Math.floor(now % maxInt))
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Check if notifications are supported (browser or native)
   */
  isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true // Native apps always support notifications
    }
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Check if running in native Capacitor app
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform()
  }

  /**
   * Initialize native notifications for Capacitor apps
   */
  private async initializeNativeNotifications(): Promise<void> {
    try {
      // Create notification channel for Android
      await LocalNotifications.createChannel({
        id: 'dynamit_main',
        name: 'dynamIT Notifications',
        description: 'Notifications from dynamIT app for assignments, downloads, and updates',
        sound: 'default',
        importance: 5,
        visibility: 1,
        lights: true,
        vibration: true
      })

      // Set up notification listeners
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('📱 Native notification received:', notification)
      })

      await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('👆 Native notification tapped:', notification)
        
        // Handle notification tap actions
        const data = notification.notification.extra
        if (data?.url) {
          window.location.href = data.url
        }
      })

      console.log('✅ Native notification listeners and channel initialized')
    } catch (error) {
      console.error('❌ Error initializing native notifications:', error)
    }
  }

  /**
   * Get current notification permission status
   */
  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied'
    }

    // Handle native app permission status
    if (this.isNative()) {
      try {
        const permission = await LocalNotifications.checkPermissions()
        return permission.display === 'granted' ? 'granted' : 'denied'
      } catch (error) {
        console.error('Error checking native permission:', error)
        return 'denied'
      }
    }

    // Handle browser permission status
    return Notification.permission
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported')
    }

    // Handle native app permissions
    if (this.isNative()) {
      try {
        const permission = await LocalNotifications.requestPermissions()
        if (permission.display === 'granted') {
          console.log(' Native notification permission granted')
          await this.showWelcomeNotification()
          return 'granted'
        } else {
          console.log(' Native notification permission denied')
          return 'denied'
        }
      } catch (error) {
        console.error(' Error requesting native notification permission:', error)
        return 'denied'
      }
    }

    // Handle browser permissions
    const currentPermission = await this.getPermissionStatus()
    if (currentPermission === 'granted') {
      return 'granted'
    }

    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      console.log(' Browser notification permission granted')
      await this.showWelcomeNotification()
    } else {
      console.log(' Browser notification permission denied')
    }
    
    return permission
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready
      this.swRegistration = registration

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        const applicationServerKey = this.vapidPublicKey 
          ? this.urlBase64ToUint8Array(this.vapidPublicKey)
          : undefined
          
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        })
      }

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription)
      
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  /**
   * Send subscription details to backend for storage
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: this.getUserId()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }
    } catch (error) {
      console.error('Error sending subscription to backend:', error)
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Notify backend
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: this.getUserId()
          })
        })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error unsubscribing:', error)
      return false
    }
  }

  /**
   * Show a local notification (browser or native)
   */
  async showLocalNotification(data: NotificationPayload): Promise<void> {
    if (!this.isSupported()) {
      console.warn('⚠️ Cannot show notification: not supported')
      return
    }

    // Handle native app notifications
    if (this.isNative()) {
      try {
        const permission = await LocalNotifications.checkPermissions()
        if (permission.display !== 'granted') {
          console.warn('⚠️ Native notification permission not granted')
          return
        }

        await LocalNotifications.schedule({
          notifications: [{
            title: data.title,
            body: data.body,
            id: this.generateNotificationId(),
            schedule: { at: new Date(Date.now() + 100) }, // Show immediately
            sound: 'default',
            channelId: 'dynamit_main',
            // Avoid attachments on Android to keep things stable
            extra: data.data || {}
          }]
        })

        console.log('📬 Native notification scheduled:', data.title)
        return
      } catch (error) {
        console.error('❌ Error showing native notification:', error)
        return
      }
    }

    // Handle browser notifications
    const browserPermission = await this.getPermissionStatus()
    if (browserPermission !== 'granted') {
      console.warn('⚠️ Browser notification permission not granted')
      return
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: false,
        silent: false
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle click events
      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Navigate if URL is provided
        if (data.data?.url) {
          window.location.href = data.data.url
        }
      }

      console.log('📬 Browser notification shown:', data.title)
    } catch (error) {
      console.error('❌ Error showing browser notification:', error)
    }
  }

  /**
   * Get user's notification preferences
   */
  getPreferences(): NotificationPreferences {
    const stored = typeof window !== 'undefined' 
      ? (window.localStorage?.getItem('notification_preferences') || null)
      : null
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Return default preferences on parse error
        return {
          assignments: true,
          seminars: true,
          fines: true,
          cod: true,
          general: true
        }
      }
    }
    return {
      assignments: true,
      seminars: true,
      fines: true,
      cod: true,
      general: true
    }
  }

  /**
   * Update notification preferences
   */
  setPreferences(preferences: NotificationPreferences): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('notification_preferences', JSON.stringify(preferences))
      } catch (error) {
        console.warn('Failed to save notification preferences', error)
      }
    }
    
    // Sync with backend
    fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: this.getUserId(),
        preferences
      })
    }).catch(error => console.error('Error updating preferences:', error))
  }

  /**
   * Helper to convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const buffer = new ArrayBuffer(rawData.length)
    const outputArray = new Uint8Array(buffer)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Get current user ID from auth context or storage
   */
  private getUserId(): string | null {
    // Try to get from localStorage (set during login)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return localStorage.getItem('user_id')
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * Convenience methods for specific notification types
   */
  async notifyAssignmentDeadline(assignmentTitle: string, hoursRemaining: number): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.assignments) return

    await this.showLocalNotification({
      title: '⏰ Assignment Deadline Approaching',
      body: `"${assignmentTitle}" is due in ${hoursRemaining} hours`,
      tag: 'assignment-deadline',
      icon: '/icons/icon-192x192.png',
      data: { type: 'assignment', action: 'deadline' },
      actions: [
        { action: 'view', title: 'View Assignment' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  }

  async notifySeminarSelection(studentName: string, date: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.seminars) return

    await this.showLocalNotification({
      title: '🎉 Seminar Selection Result',
      body: `${studentName} has been selected for ${date}`,
      tag: 'seminar-selection',
      icon: '/icons/icon-192x192.png',
      data: { type: 'seminar', action: 'selection' },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'OK' }
      ]
    })
  }

  async notifyNewAssignment(title: string, dueDate: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.assignments) return

    await this.showLocalNotification({
      title: '📝 New Assignment Posted',
      body: `"${title}" - Due: ${dueDate}`,
      tag: 'new-assignment',
      icon: '/icons/icon-192x192.png',
      data: { type: 'assignment', action: 'new' },
      actions: [
        { action: 'view', title: 'View Assignment' },
        { action: 'dismiss', title: 'Later' }
      ]
    })
  }

  async notifyFineReminder(amount: number, reason: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.fines) return

    await this.showLocalNotification({
      title: '💰 Fine Payment Reminder',
      body: `You have a pending fine of ₹${amount} for ${reason}`,
      tag: 'fine-reminder',
      icon: '/icons/icon-192x192.png',
      data: { type: 'fine', action: 'reminder' },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  }

  async notifyCODUpdate(topic: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.cod) return

    await this.showLocalNotification({
      title: '💡 New Concept of the Day',
      body: topic,
      tag: 'cod-update',
      icon: '/icons/icon-192x192.png',
      data: { type: 'cod', action: 'new' },
      actions: [
        { action: 'view', title: 'Learn Now' },
        { action: 'dismiss', title: 'Later' }
      ]
    })
  }

  async notifyAssignmentUploaded(assignmentTitle: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.assignments) return

    await this.showLocalNotification({
      title: '✅ Assignment Uploaded Successfully',
      body: `"${assignmentTitle}" has been submitted successfully`,
      tag: 'assignment-uploaded',
      icon: '/icons/icon-192x192.png',
      data: { type: 'assignment', action: 'uploaded' }
    })
  }

  async notifyAssignmentDownloaded(fileName: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.assignments) return

    await this.showLocalNotification({
      title: '📥 Assignment Downloaded',
      body: `"${fileName}" has been downloaded successfully`,
      tag: 'assignment-downloaded',
      icon: '/icons/icon-192x192.png',
      data: { type: 'assignment', action: 'downloaded' }
    })
  }

  async notifySeminarBooked(date: string, topic: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.seminars) return

    await this.showLocalNotification({
      title: '🎯 Seminar Booked Successfully',
      body: `Your seminar "${topic}" is scheduled for ${date}`,
      tag: 'seminar-booked',
      icon: '/icons/icon-192x192.png',
      data: { type: 'seminar', action: 'booked' }
    })
  }

  async notifySeminarCancelled(date: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.seminars) return

    await this.showLocalNotification({
      title: '❌ Seminar Cancelled',
      body: `Your seminar scheduled for ${date} has been cancelled`,
      tag: 'seminar-cancelled',
      icon: '/icons/icon-192x192.png',
      data: { type: 'seminar', action: 'cancelled' }
    })
  }

  async notifyQPDownloaded(fileName: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.general) return

    await this.showLocalNotification({
      title: '📥 Question Paper Downloaded',
      body: `"${fileName}" has been downloaded successfully`,
      tag: 'qp-downloaded',
      icon: '/icons/icon-192x192.png',
      data: { type: 'qp', action: 'downloaded' }
    })
  }

  async notifyNotesDownloaded(fileName: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.general) return

    await this.showLocalNotification({
      title: '📚 Notes Downloaded',
      body: `"${fileName}" has been downloaded successfully`,
      tag: 'notes-downloaded',
      icon: '/icons/icon-192x192.png',
      data: { type: 'notes', action: 'downloaded' }
    })
  }

  async notifyLabManualDownloaded(fileName: string): Promise<void> {
    const prefs = this.getPreferences()
    if (!prefs.general) return

    await this.showLocalNotification({
      title: '🔬 Lab Manual Downloaded',
      body: `"${fileName}" has been downloaded successfully`,
      tag: 'lab-manual-downloaded',
      icon: '/icons/icon-192x192.png',
      data: { type: 'lab_manual', action: 'downloaded' }
    })
  }

  /**
   * Show welcome notification when user enables notifications
   */
  async showWelcomeNotification(): Promise<void> {
    await this.showLocalNotification({
      title: '🔔 Notifications Enabled!',
      body: 'You\'ll now receive updates about assignments, downloads, and important announcements',
      tag: 'welcome-notification',
      icon: '/icons/icon-192x192.png',
      data: { type: 'welcome', action: 'enabled' }
    })
  }
}

export const notificationService = NotificationService.getInstance()
