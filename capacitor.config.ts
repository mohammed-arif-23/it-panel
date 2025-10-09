import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dynamit.arif',
  appName: 'dynamIT',
  webDir: 'out', // Fallback directory (not used with server.url)
  server: {
    // Load from your remote server - this is correct for your PWA
    url: 'https://avsec-it.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    // Allow navigation to other PWA domains
    allowNavigation: [
      'avsec-it.vercel.app',
      'no-due-generator-app.vercel.app',
      'dynamit-learn.vercel.app',
      '*.vercel.app'
    ]
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false, // Disable in production
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      showSpinner: false
    },
    Filesystem: {
      iosScheme: "file",
      androidScheme: "content"
    }
  }
};

export default config;
