// Centralized Configuration Management
interface AppConfig {
  serverUrl: string;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enableDebugMode: boolean;
  };
  cache: {
    maxSize: number;
    ttl: number;
  };
  notifications: {
    vapidPublicKey?: string;
    fcmSenderId?: string;
  };
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isStaging = process.env.VERCEL_ENV === 'preview';
    const isProduction = process.env.NODE_ENV === 'production' && !isStaging;

    let environment: 'development' | 'staging' | 'production' = 'development';
    if (isProduction) environment = 'production';
    else if (isStaging) environment = 'staging';

    // Determine server URL based on environment
    let serverUrl = 'http://localhost:3000';
    if (isProduction) {
      serverUrl = 'https://avsec-it.vercel.app';
    } else if (isStaging) {
      serverUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://avsec-it.vercel.app';
    }

    return {
      serverUrl,
      apiBaseUrl: `${serverUrl}/api`,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      environment,
      features: {
        enableAnalytics: isProduction,
        enableCrashReporting: isProduction || isStaging,
        enableDebugMode: isDevelopment,
      },
      cache: {
        maxSize: this.calculateCacheSize(),
        ttl: isDevelopment ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // 5 min dev, 24h prod
      },
      notifications: {
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        fcmSenderId: process.env.NEXT_PUBLIC_FCM_SENDER_ID,
      },
    };
  }

  private calculateCacheSize(): number {
    // Dynamic cache sizing based on device capabilities
    if (typeof navigator !== 'undefined') {
      // Estimate device memory (if available)
      const deviceMemory = (navigator as any).deviceMemory || 4; // Default to 4GB
      
      if (deviceMemory >= 8) {
        return 100 * 1024 * 1024; // 100MB for high-end devices
      } else if (deviceMemory >= 4) {
        return 50 * 1024 * 1024;  // 50MB for mid-range devices
      } else {
        return 25 * 1024 * 1024;  // 25MB for low-end devices
      }
    }
    
    return 50 * 1024 * 1024; // Default 50MB
  }

  get(key: keyof AppConfig): any {
    return this.config[key];
  }

  getServerUrl(): string {
    return this.config.serverUrl;
  }

  getApiUrl(endpoint: string): string {
    return `${this.config.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  getCacheConfig() {
    return this.config.cache;
  }

  getNotificationConfig() {
    return this.config.notifications;
  }

  // Update configuration at runtime (for testing)
  updateConfig(updates: Partial<AppConfig>) {
    this.config = { ...this.config, ...updates };
  }
}

export const configManager = new ConfigManager();

// Export commonly used values
export const SERVER_URL = configManager.getServerUrl();
export const API_BASE_URL = configManager.get('apiBaseUrl');
export const IS_PRODUCTION = configManager.isProduction();
export const IS_DEVELOPMENT = configManager.isDevelopment();
