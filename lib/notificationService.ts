// Push Notification Service for IT Panel
// Handles push notifications for assignments, seminars, and important updates

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

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Check if notifications are supported in the browser
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied'
    }
    return Notification.permission
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser')
    }

    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      await this.subscribeToPushNotifications()
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
   * Show a local notification (doesn't require service worker)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported() || this.getPermissionStatus() !== 'granted') {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-96x96.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: false
      })
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  /**
   * Get user's notification preferences
   */
  getPreferences(): NotificationPreferences {
    const stored = localStorage.getItem('notification_preferences')
    if (stored) {
      return JSON.parse(stored)
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
    localStorage.setItem('notification_preferences', JSON.stringify(preferences))
    
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
    return localStorage.getItem('user_id')
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
}

export const notificationService = NotificationService.getInstance()
