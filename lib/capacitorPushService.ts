// Capacitor Native Push Notification Service
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
}

class CapacitorPushService {
  private fcmToken: string | null = null;

  /**
   * Check if we're running in a native app (not browser)
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initialize push notifications and request permissions
   */
  async initialize(): Promise<string | null> {
    if (!this.isNative()) {
      console.log('📱 Not running in native app, skipping Capacitor push setup');
      return null;
    }

    console.log('📱 Initializing Capacitor push notifications...');

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        console.log('✅ Push notification permission granted');
        
        // Register with FCM
        await PushNotifications.register();
        
        // Listen for registration token
        await PushNotifications.addListener('registration', (token: Token) => {
          console.log('🔑 FCM Token received:', token.value);
          this.fcmToken = token.value;
          this.saveFCMToken(token.value);
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('❌ FCM registration error:', error);
        });

        // Listen for push notifications received
        await PushNotifications.addListener('pushNotificationReceived', 
          (notification: PushNotificationSchema) => {
            console.log('🔔 Push notification received:', notification);
            // Notification is automatically shown by the system
          }
        );

        // Listen for notification taps
        await PushNotifications.addListener('pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('👆 Notification tapped:', notification);
            const data = notification.notification.data;
            
            // Navigate to the appropriate page
            if (data?.url) {
              window.location.href = data.url;
            }
          }
        );

        console.log('✅ Capacitor push notifications initialized');
        return this.fcmToken;
      } else {
        console.log('❌ Push notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Save FCM token to backend
   */
  private async saveFCMToken(token: string) {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.warn('⚠️ No user_id found, cannot save FCM token');
        return;
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcmToken: token,
          userId: userId,
          platform: 'android'
        })
      });

      if (response.ok) {
        console.log('✅ FCM token saved to backend');
      } else {
        console.error('❌ Failed to save FCM token:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Show a local notification (for testing)
   */
  async showLocalNotification(payload: NotificationPayload) {
    if (!this.isNative()) {
      console.log('Not in native app, cannot show local notification');
      return;
    }

    try {
      await PushNotifications.createChannel({
        id: 'dynamit',
        name: 'dynamIT Notifications',
        description: 'Notifications from dynamIT app',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true
      });

      // Note: Local notifications require @capacitor/local-notifications plugin
      // For now, this is handled by FCM push notifications
      console.log('📬 Notification will be sent via FCM');
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  /**
   * Remove all listeners (cleanup)
   */
  async cleanup() {
    if (this.isNative()) {
      await PushNotifications.removeAllListeners();
    }
  }
}

export const capacitorPushService = new CapacitorPushService();

// Auto-initialize on app load if native - with better error handling
if (typeof window !== 'undefined') {
  // Use multiple event listeners for better reliability
  const initializeWithRetry = async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        await capacitorPushService.initialize();
        break;
      } catch (error) {
        console.warn(`Push service initialization failed, retries left: ${retries - 1}`, error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
  };

  // Try multiple initialization points
  window.addEventListener('DOMContentLoaded', initializeWithRetry);
  window.addEventListener('load', initializeWithRetry);
  
  // Also try after a short delay for Capacitor apps
  setTimeout(initializeWithRetry, 2000);
}
