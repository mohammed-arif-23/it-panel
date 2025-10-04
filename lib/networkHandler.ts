// Comprehensive Network and Connectivity Handler
import { Capacitor } from '@capacitor/core';
import { networkCircuitBreaker, apiCircuitBreaker } from './circuitBreaker';
import { logger } from './productionLogger';

interface NetworkStatus {
  connected: boolean;
  connectionType: string;
  retryCount: number;
}

class NetworkHandler {
  private networkStatus: NetworkStatus = {
    connected: true,
    connectionType: 'unknown',
    retryCount: 0
  };
  
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();

  async initialize() {
    // Always use web network monitoring for better compatibility
    this.setupWebNetworkMonitoring();
    
    // Try to enhance with native network monitoring if available
    if (Capacitor.isNativePlatform()) {
      try {
        // Try to import Network plugin dynamically
        const networkModule = await import('@capacitor/network').catch(() => null);
        
        if (networkModule?.Network) {
          const { Network } = networkModule;
          
          // Get initial network status
          const status = await Network.getStatus();
          this.networkStatus = {
            connected: status.connected,
            connectionType: status.connectionType,
            retryCount: 0
          };

          // Listen for network changes
          Network.addListener('networkStatusChange', (status: any) => {
            console.log('Network status changed:', status);
            
            const wasConnected = this.networkStatus.connected;
            this.networkStatus = {
              connected: status.connected,
              connectionType: status.connectionType,
              retryCount: status.connected ? 0 : this.networkStatus.retryCount
            };

            // Notify listeners
            this.notifyListeners();

            // Handle reconnection
            if (!wasConnected && status.connected) {
              this.handleReconnection();
            }
          });

          console.log('✅ Enhanced network monitoring initialized');
        } else {
          console.log('✅ Basic network monitoring initialized (Network plugin not available)');
        }
      } catch (error) {
        console.log('✅ Basic network monitoring initialized (fallback mode)');
      }
    } else {
      console.log('✅ Web network monitoring initialized');
    }
  }

  private setupWebNetworkMonitoring() {
    // Web fallback using navigator.onLine
    this.networkStatus.connected = navigator.onLine;
    
    window.addEventListener('online', () => {
      const wasConnected = this.networkStatus.connected;
      this.networkStatus.connected = true;
      this.networkStatus.retryCount = 0;
      this.notifyListeners();
      
      if (!wasConnected) {
        this.handleReconnection();
      }
    });

    window.addEventListener('offline', () => {
      this.networkStatus.connected = false;
      this.notifyListeners();
    });
  }

  private handleReconnection() {
    console.log('🌐 Network reconnected. Resuming without full reload.');
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    // Notify listeners so views can refetch selectively
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.networkStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  addListener(callback: (status: NetworkStatus) => void) {
    this.listeners.push(callback);
    // Immediately call with current status
    callback(this.networkStatus);
  }

  removeListener(callback: (status: NetworkStatus) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  isConnected(): boolean {
    return this.networkStatus.connected;
  }

  // Enhanced fetch with retry logic and circuit breaker
  async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    return await networkCircuitBreaker.execute(async () => {
      let lastError: Error;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Check network status before attempting
          if (!this.isConnected()) {
            throw new Error('No network connection');
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              // Keep caller-provided headers; avoid forcing no-cache globally
              ...options.headers
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Reset retry count on success
          this.networkStatus.retryCount = 0;
          logger.debug(`Network request successful: ${url}`);
          return response;

        } catch (error) {
          lastError = error as Error;
          logger.warn(`Fetch attempt ${attempt}/${maxRetries} failed: ${url}`, error);

          this.networkStatus.retryCount = attempt;
          this.notifyListeners();

          // Don't retry on certain errors
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            // Network error - wait before retry
            if (attempt < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
              await this.delay(delay);
            }
          } else if (error instanceof Error && error.name === 'AbortError') {
            // Timeout error
            if (attempt < maxRetries) {
              await this.delay(2000);
            }
          } else {
            // Other errors (4xx, 5xx) - don't retry
            break;
          }
        }
      }

      throw lastError!;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      this.retryTimeouts.add(timeout);
      setTimeout(() => this.retryTimeouts.delete(timeout), ms);
    });
  }

  // Handle CORS issues
  async handleCorsRequest(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      return await this.fetchWithRetry(url, {
        ...options,
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });
    } catch (error) {
      console.error('CORS request failed:', error);
      
      // Try with no-cors mode as fallback (limited functionality)
      if (options.method === 'GET') {
        try {
          return await this.fetchWithRetry(url, {
            ...options,
            mode: 'no-cors'
          });
        } catch (fallbackError) {
          console.error('No-cors fallback also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  async cleanup() {
    this.listeners = [];
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    if (Capacitor.isNativePlatform()) {
      try {
        const networkModule = await import('@capacitor/network').catch(() => null);
        if (networkModule?.Network) {
          networkModule.Network.removeAllListeners();
        }
      } catch (error) {
        console.warn('Failed to cleanup network listeners:', error);
      }
    }
  }
}

export const networkHandler = new NetworkHandler();

// Auto-initialize
if (typeof window !== 'undefined') {
  networkHandler.initialize();
}
