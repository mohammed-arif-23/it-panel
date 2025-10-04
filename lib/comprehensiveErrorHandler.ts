// Comprehensive Error Handler and Recovery System
import { Capacitor } from '@capacitor/core';
import { networkHandler } from './networkHandler';

interface ErrorReport {
  type: 'network' | 'webview' | 'plugin' | 'javascript' | 'memory' | 'permission';
  message: string;
  stack?: string;
  url?: string;
  timestamp: number;
  userAgent: string;
  platform: string;
  retryCount: number;
}

interface RecoveryAction {
  name: string;
  action: () => Promise<void>;
  priority: number;
}

class ComprehensiveErrorHandler {
  private errorQueue: ErrorReport[] = [];
  private recoveryActions: Map<string, RecoveryAction[]> = new Map();
  private isRecovering = false;
  private maxRetries = 3;

  initialize() {
    this.setupGlobalErrorHandlers();
    this.setupRecoveryActions();
    this.setupPerformanceMonitoring();
    console.log('✅ Comprehensive error handler initialized');
  }

  private setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        platform: Capacitor.getPlatform(),
        retryCount: 0
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        platform: Capacitor.getPlatform(),
        retryCount: 0
      });
    });

    // Network errors
    if (Capacitor.isNativePlatform()) {
      // Monitor WebView errors
      this.monitorWebViewErrors();
    }
  }

  private monitorWebViewErrors() {
    // Monitor for WebView-specific issues
    let pageLoadTimeout: NodeJS.Timeout;
    
    const checkPageLoad = () => {
      pageLoadTimeout = setTimeout(() => {
        if (document.readyState !== 'complete') {
          this.handleError({
            type: 'webview',
            message: 'WebView page load timeout',
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            platform: Capacitor.getPlatform(),
            retryCount: 0
          });
        }
      }, 30000); // 30 second timeout
    };

    document.addEventListener('DOMContentLoaded', () => {
      clearTimeout(pageLoadTimeout);
    });

    window.addEventListener('load', () => {
      clearTimeout(pageLoadTimeout);
    });

    checkPageLoad();
  }

  private setupRecoveryActions() {
    // Network recovery actions
    this.recoveryActions.set('network', [
      {
        name: 'retry_request',
        action: async () => {
          console.log('🔄 Retrying network request...');
          // This would be handled by networkHandler
        },
        priority: 1
      },
      {
        name: 'clear_cache',
        action: async () => {
          console.log('🧹 Clearing network cache...');
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
        },
        priority: 2
      },
      {
        name: 'reload_page',
        action: async () => {
          console.log('🔄 Reloading page...');
          window.location.reload();
        },
        priority: 3
      }
    ]);

    // WebView recovery actions
    this.recoveryActions.set('webview', [
      {
        name: 'clear_webview_cache',
        action: async () => {
          console.log('🧹 Clearing WebView cache...');
          if (Capacitor.isNativePlatform()) {
            // This would require native implementation
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
          }
        },
        priority: 1
      },
      {
        name: 'force_reload',
        action: async () => {
          console.log('🔄 Force reloading WebView...');
          window.location.href = window.location.href;
        },
        priority: 2
      }
    ]);

    // Plugin recovery actions
    this.recoveryActions.set('plugin', [
      {
        name: 'reinitialize_plugins',
        action: async () => {
          console.log('🔄 Reinitializing plugins...');
          // Reinitialize critical plugins
          try {
            const { enhancedNotificationService } = await import('./enhancedNotificationService');
            await enhancedNotificationService.initialize();
          } catch (error) {
            console.error('Failed to reinitialize notification service:', error);
          }
        },
        priority: 1
      }
    ]);

    // Memory recovery actions
    this.recoveryActions.set('memory', [
      {
        name: 'garbage_collect',
        action: async () => {
          console.log('🗑️ Triggering garbage collection...');
          if ('gc' in window) {
            (window as any).gc();
          }
          
          // Clear unnecessary data
          this.clearMemoryCache();
        },
        priority: 1
      },
      {
        name: 'reduce_memory_usage',
        action: async () => {
          console.log('📉 Reducing memory usage...');
          // Clear error queue
          this.errorQueue = this.errorQueue.slice(-10); // Keep only last 10 errors
          
          // Clear caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            // Clear old caches but keep essential ones
            const oldCaches = cacheNames.filter(name => 
              !name.includes('essential') && !name.includes('critical')
            );
            await Promise.all(oldCaches.map(name => caches.delete(name)));
          }
        },
        priority: 2
      }
    ]);
  }

  private setupPerformanceMonitoring() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 80) {
          this.handleError({
            type: 'memory',
            message: `High memory usage: ${usedPercent.toFixed(1)}%`,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            platform: Capacitor.getPlatform(),
            retryCount: 0
          });
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn(`Long task detected: ${entry.duration}ms`);
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  async handleError(error: ErrorReport) {
    console.error('🚨 Error detected:', error);
    
    // Add to error queue
    this.errorQueue.push(error);
    
    // Keep only last 50 errors to prevent memory issues
    if (this.errorQueue.length > 50) {
      this.errorQueue = this.errorQueue.slice(-50);
    }

    // Don't start recovery if already recovering
    if (this.isRecovering) {
      return;
    }

    // Attempt recovery based on error type
    await this.attemptRecovery(error);
  }

  private async attemptRecovery(error: ErrorReport) {
    if (error.retryCount >= this.maxRetries) {
      console.error('❌ Max retries reached for error:', error.message);
      this.reportCriticalError(error);
      return;
    }

    this.isRecovering = true;
    
    try {
      const actions = this.recoveryActions.get(error.type) || [];
      
      // Sort by priority and execute
      actions.sort((a, b) => a.priority - b.priority);
      
      for (const action of actions) {
        try {
          console.log(`🔧 Attempting recovery action: ${action.name}`);
          await action.action();
          
          // Wait a bit to see if recovery worked
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if error is resolved (this would need specific implementation)
          if (await this.isErrorResolved(error)) {
            console.log('✅ Recovery successful');
            break;
          }
        } catch (recoveryError) {
          console.error(`❌ Recovery action ${action.name} failed:`, recoveryError);
        }
      }
    } finally {
      this.isRecovering = false;
    }
  }

  private async isErrorResolved(error: ErrorReport): Promise<boolean> {
    switch (error.type) {
      case 'network':
        return networkHandler.isConnected();
      case 'webview':
        return document.readyState === 'complete';
      case 'memory':
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          return usedPercent < 70;
        }
        return true;
      default:
        return true; // Assume resolved for other types
    }
  }

  private clearMemoryCache() {
    // Clear various caches and temporary data
    try {
      // Clear console if available
      if (console.clear) {
        console.clear();
      }
      
      // Clear any temporary DOM elements
      const tempElements = document.querySelectorAll('[data-temp="true"]');
      tempElements.forEach(el => el.remove());
      
      // Clear localStorage of non-essential items
      const keysToKeep = ['user_id', 'auth_token', 'user_preferences'];
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key) && key.startsWith('temp_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error clearing memory cache:', error);
    }
  }

  private reportCriticalError(error: ErrorReport) {
    console.error('🚨 CRITICAL ERROR - Manual intervention required:', error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: system-ui;
      ">
        <div style="
          background: #1f2937;
          padding: 2rem;
          border-radius: 8px;
          max-width: 400px;
          text-align: center;
        ">
          <h2 style="color: #ef4444; margin-bottom: 1rem;">App Error</h2>
          <p style="margin-bottom: 1.5rem;">
            The app encountered a critical error. Please restart the application.
          </p>
          <button onclick="window.location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
          ">
            Restart App
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }

  getErrorReport(): ErrorReport[] {
    return [...this.errorQueue];
  }

  clearErrorQueue() {
    this.errorQueue = [];
  }

  // Manual recovery trigger
  async triggerRecovery(errorType: string) {
    const actions = this.recoveryActions.get(errorType as any);
    if (!actions) {
      console.warn(`No recovery actions found for error type: ${errorType}`);
      return;
    }

    this.isRecovering = true;
    
    try {
      for (const action of actions) {
        console.log(`🔧 Executing recovery action: ${action.name}`);
        await action.action();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      this.isRecovering = false;
    }
  }
}

export const comprehensiveErrorHandler = new ComprehensiveErrorHandler();

// Auto-initialize
if (typeof window !== 'undefined') {
  comprehensiveErrorHandler.initialize();
}
