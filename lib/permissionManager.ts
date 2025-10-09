import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface PermissionStatus {
  notifications: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited' | 'unknown';
  filesystem: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited' | 'unknown';
  camera: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited' | 'unknown';
  localNotifications: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited' | 'unknown';
}

export interface PermissionRequest {
  type: keyof PermissionStatus;
  title: string;
  description: string;
  icon: string;
  required: boolean;
}

class PermissionManager {
  private static instance: PermissionManager;

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  private constructor() {}

  public async checkFirstLaunch(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'first_launch_completed' });
    return value !== 'true';
  }

  public async markFirstLaunchCompleted(): Promise<void> {
    await Preferences.set({ key: 'first_launch_completed', value: 'true' });
  }

  async getCurrentPermissionStatus(): Promise<PermissionStatus> {
    const status: PermissionStatus = {
      notifications: 'unknown',
      filesystem: 'unknown',
      camera: 'unknown',
      localNotifications: 'unknown'
    };

    if (!Capacitor.isNativePlatform()) {
      // Web platform permissions
      if ('Notification' in window) {
        status.notifications = Notification.permission as any;
      }
      return status;
    }

    try {
      // Check push notifications
      const pushStatus = await PushNotifications.checkPermissions();
      status.notifications = pushStatus.receive;

      // Check local notifications
      const localStatus = await LocalNotifications.checkPermissions();
      status.localNotifications = localStatus.display;

      // Check filesystem (always granted on most platforms)
      status.filesystem = 'granted';

      // Check camera
      const cameraStatus = await Camera.checkPermissions();
      status.camera = cameraStatus.camera;

    } catch (error) {
      console.warn('Error checking permissions:', error);
    }

    return status;
  }

  getPermissionRequests(): PermissionRequest[] {
    return [
      {
        type: 'notifications',
        title: 'Push Notifications',
        description: 'Get notified about assignments, announcements, and important updates',
        icon: '🔔',
        required: false
      },
      {
        type: 'localNotifications',
        title: 'Local Notifications',
        description: 'Receive reminders and alerts even when offline',
        icon: '⏰',
        required: false
      },
      {
        type: 'filesystem',
        title: 'File Access',
        description: 'Download and save assignments, documents, and study materials',
        icon: '📁',
        required: true
      },
      {
        type: 'camera',
        title: 'Camera Access',
        description: 'Take photos for assignments and profile pictures',
        icon: '📷',
        required: false
      }
    ];
  }

  async requestPermission(type: keyof PermissionStatus): Promise<'granted' | 'denied'> {
    if (!Capacitor.isNativePlatform()) {
      // Web platform
      if (type === 'notifications' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted' ? 'granted' : 'denied';
      }
      return 'granted'; // Most web permissions are implicit
    }

    try {
      switch (type) {
        case 'notifications':
          // Check if PushNotifications plugin is available
          try {
            await PushNotifications.checkPermissions();
            const pushResult = await PushNotifications.requestPermissions();
            return pushResult.receive === 'granted' ? 'granted' : 'denied';
          } catch (error) {
            console.warn('PushNotifications plugin not available, using web fallback');
            if ('Notification' in window) {
              const permission = await Notification.requestPermission();
              return permission === 'granted' ? 'granted' : 'denied';
            }
            return 'denied';
          }

        case 'localNotifications':
          try {
            const localResult = await LocalNotifications.requestPermissions();
            return localResult.display === 'granted' ? 'granted' : 'denied';
          } catch (error) {
            console.warn('LocalNotifications plugin not available');
            return 'granted'; // Assume granted for web
          }

        case 'camera':
          try {
            const cameraResult = await Camera.requestPermissions();
            return cameraResult.camera === 'granted' ? 'granted' : 'denied';
          } catch (error) {
            console.warn('Camera plugin not available');
            return 'granted'; // Assume granted for web
          }

        case 'filesystem':
          // Filesystem permission is usually granted by default
          try {
            await Filesystem.writeFile({
              path: 'test_permission.txt',
              data: 'test',
              directory: Directory.Documents
            });
            await Filesystem.deleteFile({
              path: 'test_permission.txt',
              directory: Directory.Documents
            });
            return 'granted';
          } catch (error) {
            console.warn('Filesystem plugin not available');
            return 'granted'; // Assume granted for web
          }

        default:
          return 'denied';
      }
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return 'denied';
    }
  }

  async requestAllPermissions(): Promise<PermissionStatus> {
    const requests = this.getPermissionRequests();
    const status: PermissionStatus = {
      notifications: 'unknown',
      filesystem: 'unknown',
      camera: 'unknown',
      localNotifications: 'unknown'
    };

    for (const request of requests) {
      try {
        const result = await this.requestPermission(request.type);
        status[request.type] = result;
        
        // Small delay between requests to avoid overwhelming the user
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to request ${request.type} permission:`, error);
        status[request.type] = 'denied';
      }
    }

    return status;
  }

  async setupNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Web push notifications setup
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('Service worker ready for notifications');
        } catch (error) {
          console.error('Service worker setup failed:', error);
        }
      }
      return;
    }

    // Check if PushNotifications plugin is available before using it
    try {
      await PushNotifications.checkPermissions();
    } catch (error) {
      console.warn('PushNotifications plugin not available, skipping native setup');
      return;
    }

    try {
      // Setup push notifications
      await PushNotifications.addListener('registration', token => {
        console.log('Push registration success, token: ' + token.value);
      });

      await PushNotifications.addListener('registrationError', err => {
        console.error('Registration error: ', err.error);
      });

      await PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push notification received: ', notification);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
      });

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  async setupFileSystem(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return; // Web file downloads work differently
    }

    try {
      // Test filesystem access
      const info = await Filesystem.getUri({
        directory: Directory.Documents,
        path: ''
      });
      console.log('Filesystem access granted:', info.uri);
    } catch (error) {
      console.error('Filesystem setup failed:', error);
    }
  }

  public async hasRequestedPermissions(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'permissions_requested' });
    return value === 'true';
  }

  public async markPermissionsRequested(): Promise<void> {
    await Preferences.set({ key: 'permissions_requested', value: 'true' });
  }
}

export const permissionManager = PermissionManager.getInstance();
