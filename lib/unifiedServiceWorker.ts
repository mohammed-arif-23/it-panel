// Unified Service Worker Manager
import { configManager } from './configManager';

class UnifiedServiceWorkerManager {
  private registrations: Map<string, ServiceWorkerRegistration> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      // Register main service worker
      await this.registerMainServiceWorker();
      
      // Register push notification service worker
      await this.registerPushServiceWorker();
      
      // Clean up old service workers
      await this.cleanupOldServiceWorkers();
      
      this.isInitialized = true;
      console.log('✅ Unified service worker manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize service workers:', error);
    }
  }

  private async registerMainServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });

      this.registrations.set('main', registration);
      
      // Try to fetch latest SW immediately to avoid stale precache
      try { await registration.update(); } catch {}

      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found');
        this.handleServiceWorkerUpdate(registration);
      });

      console.log('✅ Main service worker registered');
    } catch (error) {
      console.error('❌ Failed to register main service worker:', error);
    }
  }

  private async registerPushServiceWorker() {
    try {
      // Only register if push notifications are supported
      if ('PushManager' in window) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/firebase-cloud-messaging-push-scope'
        });

        this.registrations.set('push', registration);
        console.log('✅ Push service worker registered');
      }
    } catch (error) {
      console.error('❌ Failed to register push service worker:', error);
    }
  }

  private async cleanupOldServiceWorkers() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      const obsoleteWorkers = [
        '/push-sw.js',
        '/sw-custom.js',
        '/sw-push-handler.js',
        '/sw-template.js'
      ];

      for (const registration of registrations) {
        const scriptURL = registration.active?.scriptURL || '';
        
        if (obsoleteWorkers.some(worker => scriptURL.includes(worker))) {
          console.log(`🧹 Unregistering obsolete service worker: ${scriptURL}`);
          await registration.unregister();
        }
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old service workers:', error);
    }
  }

  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is available
        this.showUpdateNotification();
      }
    });
  }

  private showUpdateNotification() {
    // Show user-friendly update notification
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #3B82F6;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 10000;
        font-family: system-ui;
      ">
        <span>App update available!</span>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #3B82F6;
          border: none;
          padding: 4px 12px;
          margin-left: 12px;
          border-radius: 4px;
          cursor: pointer;
        ">
          Update Now
        </button>
        <button onclick="this.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 4px 12px;
          margin-left: 8px;
          border-radius: 4px;
          cursor: pointer;
        ">
          Later
        </button>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (updateBanner.parentElement) {
        updateBanner.remove();
      }
    }, 10000);
  }

  async getRegistration(name: string): Promise<ServiceWorkerRegistration | undefined> {
    return this.registrations.get(name);
  }

  async updateServiceWorkers() {
    for (const [name, registration] of this.registrations) {
      try {
        await registration.update();
        console.log(`✅ Updated service worker: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to update service worker ${name}:`, error);
      }
    }
  }

  async unregisterAll() {
    for (const [name, registration] of this.registrations) {
      try {
        await registration.unregister();
        console.log(`✅ Unregistered service worker: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to unregister service worker ${name}:`, error);
      }
    }
    
    this.registrations.clear();
    this.isInitialized = false;
  }
}

export const unifiedServiceWorkerManager = new UnifiedServiceWorkerManager();

// Auto-initialize
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    unifiedServiceWorkerManager.initialize();
    // Periodic update check to reduce stale assets
    setInterval(() => unifiedServiceWorkerManager.updateServiceWorkers(), 60 * 1000 * 5);
  });
}
