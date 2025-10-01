// Server-side push notification sender
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Initialize Web Push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:mohammedarif2303@gmail.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  url?: string
}

export class PushNotificationSender {
  /**
   * Send notification to a specific student
   */
  static async sendToStudent(
    studentId: string,
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get student's push subscriptions
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', studentId)

      if (error || !subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions found for student:', studentId)
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notification to student:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Send notification to multiple students
   */
  static async sendToStudents(
    studentIds: string[],
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all subscriptions for these students
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', studentIds)

      if (error || !subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions found for students:', studentIds)
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications to students:', error)
      return { success: 0, failed: studentIds.length }
    }
  }

  /**
   * Send notification to a class/year
   */
  static async sendToClass(
    classYear: string,
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all students in this class
      const { data: students, error: studentsError } = await supabase
        .from('unified_students')
        .select('id')
        .eq('class_year', classYear)

      if (studentsError || !students || students.length === 0) {
        console.log('No students found for class:', classYear)
        return { success: 0, failed: 0 }
      }

      const studentIds = students.map(s => s.id)

      // Get all subscriptions for these students
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', studentIds)

      if (error || !subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions found for class:', classYear)
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications to class:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Send notification to all students
   */
  static async sendToAll(
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all active subscriptions
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')

      if (error || !subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions found')
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications to all:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Send notification based on preferences
   */
  static async sendByCategory(
    category: 'assignments' | 'seminars' | 'fines' | 'cod' | 'general',
    notification: NotificationPayload,
    classYear?: string
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get student IDs from class if provided
      let studentIds: string[] | undefined

      if (classYear) {
        const { data: students } = await supabase
          .from('unified_students')
          .select('id')
          .eq('class_year', classYear)

        if (students && students.length > 0) {
          studentIds = students.map(s => s.id)
        } else {
          console.log('No students found for class:', classYear)
          return { success: 0, failed: 0 }
        }
      }

      // Get subscriptions with preferences
      let query = supabase
        .from('push_subscriptions')
        .select(`
          *,
          notification_preferences!inner(${category})
        `)

      if (studentIds) {
        query = query.in('user_id', studentIds)
      }

      const { data: result, error } = await query

      if (error || !result || result.length === 0) {
        console.log('No subscriptions found for category:', category)
        return { success: 0, failed: 0 }
      }

      // Filter by preference
      const subscriptions = result.filter((r: any) => {
        const prefs = r.notification_preferences
        return prefs && prefs[category] === true
      })

      if (subscriptions.length === 0) {
        console.log('No subscriptions with category enabled:', category)
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications by category:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Core method to send notifications to subscriptions
   */
  private static async sendToSubscriptions(
    subscriptions: any[],
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0
    let failedCount = 0

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/icon-192x192.png',
      tag: notification.tag || 'notification',
      data: {
        ...notification.data,
        url: notification.url || '/dashboard',
        timestamp: Date.now()
      }
    })

    // Send to all subscriptions in parallel (with rate limiting)
    const batchSize = 100 // Send 100 at a time
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (sub) => {
          try {
            await webpush.sendNotification(sub.subscription, payload)
            successCount++
          } catch (error: any) {
            failedCount++
            
            // Remove invalid subscriptions (410 = gone, 404 = not found)
            if (error.statusCode === 410 || error.statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id)
              
              console.log('Removed invalid subscription:', sub.id)
            }
            
            console.error(`Failed to send to subscription ${sub.id}:`, error.message)
          }
        })
      )
    }

    console.log(`Notification sent: ${successCount} success, ${failedCount} failed`)
    return { success: successCount, failed: failedCount }
  }

  /**
   * Log notification to history table
   */
  static async logNotification(
    studentIds: string[],
    notification: NotificationPayload,
    type: string
  ): Promise<void> {
    try {
      const records = studentIds.map(studentId => ({
        user_id: studentId,
        notification_type: type,
        title: notification.title,
        body: notification.body,
        sent_at: new Date().toISOString()
      }))

      await supabase
        .from('notification_history')
        .insert(records)
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }
}
