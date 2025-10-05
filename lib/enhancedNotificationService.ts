// Enhanced Notification Service with FCM Token Management
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

interface NotificationConfig {
  title: string;
  body: string;
  data?: any;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: number;
}

class EnhancedNotificationService {
  private fcmToken: string | null = null;
  private tokenRefreshInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 5;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Not running in native app, using web notifications');
      return this.initializeWebNotifications();
    }

    try {
      console.log('📱 Initializing enhanced push notifications...');

      // Request permissions with retry logic
      const permission = await this.requestPermissionsWithRetry();
      if (permission.receive !== 'granted') {
        console.warn('❌ Push notification permission denied');
        return false;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Set up listeners
      this.setupListeners();

      // Set up token refresh mechanism
      this.setupTokenRefresh();

      // Create notification channels for Android
      await this.createNotificationChannels();

      this.isInitialized = true;
      console.log('✅ Enhanced push notifications initialized');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying initialization (${this.retryCount}/${this.maxRetries})...`);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 30000);
        setTimeout(() => this.initialize(), delay);
      }
      
      return false;
    }
  }

  private async requestPermissionsWithRetry(): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const permission = await PushNotifications.requestPermissions();
        return permission;
      } catch (error) {
        lastError = error;
        console.warn(`Permission request attempt ${attempt} failed:`, error);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }

  private setupListeners() {
    // Token registration listener
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('🔑 FCM Token received:', token.value.substring(0, 20) + '...');
      this.fcmToken = token.value;
      this.saveFCMToken(token.value);
      this.retryCount = 0; // Reset retry count on success
    });

    // Registration error listener
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ FCM registration error:', error);
      
      // Retry registration after delay
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.min(5000 * this.retryCount, 30000);
        setTimeout(() => {
          console.log(`🔄 Retrying FCM registration (${this.retryCount}/${this.maxRetries})...`);
          PushNotifications.register();
        }, delay);
      }
    });

    // Push notification received listener
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('🔔 Push notification received:', notification);
      
      // Handle notification based on app state
      this.handleReceivedNotification(notification);
    });

    // Notification action performed listener
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('👆 Notification tapped:', notification);
      
      const data = notification.notification.data;
      if (data?.url) {
        // Navigate to the specified URL
        window.location.href = data.url;
      }
    });
  }

  private setupTokenRefresh() {
    // Refresh token every 24 hours
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Refreshing FCM token...');
        await PushNotifications.register();
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async createNotificationChannels() {
    try {
      // Create main notification channel
      await PushNotifications.createChannel({
        id: 'dynamit_main',
        name: 'dynamIT Notifications',
        description: 'Main notifications from dynamIT app',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#3B82F6'
      });

      // Create high priority channel for urgent notifications
      await PushNotifications.createChannel({
        id: 'dynamit_urgent',
        name: 'Urgent Notifications',
        description: 'Urgent notifications requiring immediate attention',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#EF4444'
      });

      // Create assignment channel
      await PushNotifications.createChannel({
        id: 'dynamit_assignments',
        name: 'Assignment Notifications',
        description: 'Notifications about assignments and deadlines',
        importance: 4,
        visibility: 1,
        sound: 'default',
        vibration: true
      });

      console.log('✅ Notification channels created');
    } catch (error) {
      console.error('❌ Failed to create notification channels:', error);
    }
  }

  private async handleReceivedNotification(notification: PushNotificationSchema) {
    // Show local notification if app is in foreground
    if (document.visibilityState === 'visible') {
      try {
        await this.showLocalNotification({
          title: notification.title || 'dynamIT',
          body: notification.body || '',
          data: notification.data,
          tag: `received_${Date.now()}`
        });
      } catch (error) {
        console.error('Failed to show local notification:', error);
      }
    }
  }

  async showLocalNotification(config: NotificationConfig): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return this.showWebNotification(config);
    }

    try {
      // Try to import LocalNotifications dynamically
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.schedule({
        notifications: [{
          id: this.generateNotificationId(),
          title: config.title,
          body: config.body,
          extra: config.data,
          channelId: this.getChannelId(config),
          sound: 'default',
          smallIcon: 'ic_stat_icon_default',
          iconColor: '#3B82F6'
        }]
      });
    } catch (error) {
      console.error('Failed to show local notification:', error);
      // Fallback to web notification only if supported
      if (typeof window !== 'undefined' && 'Notification' in window) {
        this.showWebNotification(config);
      }
    }
  }

  private getChannelId(config: NotificationConfig): string {
    if (config.data?.priority === 'high' || config.data?.urgent) {
      return 'dynamit_urgent';
    } else if (config.data?.type === 'assignment') {
      return 'dynamit_assignments';
    }
    return 'dynamit_main';
  }

  /**
   * Generate a safe Android notification ID within Java int range
   */
  private generateNotificationId(): number {
    const maxInt = 2147483647; // Integer.MAX_VALUE
    const now = Date.now();
    return Math.max(1, Math.floor(now % maxInt));
  }

  private async initializeWebNotifications(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.isInitialized = permission === 'granted';
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize web notifications:', error);
      return false;
    }
  }

  private showWebNotification(config: NotificationConfig) {
    if (!this.isInitialized || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(config.title, {
      body: config.body,
      icon: config.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: config.tag,
      data: config.data,
      requireInteraction: true
    });

    notification.onclick = () => {
      if (config.url) {
        window.open(config.url, '_blank');
      }
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  }

  private async saveFCMToken(token: string, retryCount: number = 0) {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.warn('⚠️ No user_id found, will retry saving FCM token...');
        
        // Retry up to 10 times with 2 second intervals
        if (retryCount < 20) {
          setTimeout(() => this.saveFCMToken(token, retryCount + 1), 3500);
        } else {
          console.error('❌ Failed to save FCM token: user_id not available after retries');
        }
        return;
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcmToken: token,
          userId: userId,
          platform: Capacitor.getPlatform(),
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        console.log('✅ FCM token saved to backend');
        // Store token locally to avoid duplicate saves
        localStorage.setItem('fcm_token_saved', 'true');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save FCM token:', errorText);
        
        // Retry after delay
        if (retryCount < 3) {
          setTimeout(() => this.saveFCMToken(token, retryCount + 1), 5000);
        }
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      
      // Retry after delay
      if (retryCount < 3) {
        setTimeout(() => this.saveFCMToken(token, retryCount + 1), 5000);
      }
    }
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Manually trigger token save (call this after user login)
   */
  async syncTokenAfterLogin(): Promise<void> {
    if (this.fcmToken) {
      console.log('🔄 Syncing FCM token after login...');
      await this.saveFCMToken(this.fcmToken, 0);
    } else {
      console.log('⚠️ No FCM token available to sync');
    }
  }

  // Request battery optimization whitelist (Android)
  async requestBatteryOptimizationWhitelist() {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      // This would require a custom plugin, but we can show instructions
      console.log('💡 To ensure notifications work reliably, please:');
      console.log('1. Go to Settings > Battery > Battery Optimization');
      console.log('2. Find dynamIT app and select "Don\'t optimize"');
      
      // Show user-friendly notification about battery optimization
      await this.showLocalNotification({
        title: '🔋 Battery Optimization',
        body: 'For reliable notifications, please disable battery optimization for this app in Settings.',
        data: { type: 'battery_optimization' }
      });
    } catch (error) {
      console.error('Failed to handle battery optimization:', error);
    }
  }

  async cleanup() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }

    if (Capacitor.isNativePlatform()) {
      PushNotifications.removeAllListeners();
      
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        LocalNotifications.removeAllListeners();
      } catch (error) {
        console.warn('Failed to cleanup local notification listeners:', error);
      }
    }

    this.isInitialized = false;
    this.fcmToken = null;
    this.retryCount = 0;
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
